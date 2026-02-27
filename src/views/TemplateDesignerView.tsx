import { useEffect, useRef } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { performUndo, performRedo } from '@/lib/undoRedo'
import type { CardType } from '@/types/card'
import { DesignerCanvas } from '@/components/designer/DesignerCanvas'
import { CanvasErrorBoundary } from '@/components/designer/CanvasErrorBoundary'
import { LayerPanel } from '@/components/designer/LayerPanel'
import { PropertiesPanel } from '@/components/designer/PropertiesPanel'
import { AddLayerMenu } from '@/components/designer/AddLayerMenu'
import { PreviewCardSelector } from '@/components/designer/PreviewCardSelector'

const CARD_TYPES: CardType[] = [
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase',
]

const SNAP_SIZES = [1, 5, 10, 20] as const

export function TemplateDesignerView() {
  const activeTemplateId = useUiStore((s) => s.activeTemplateId)
  const clearUndoHistory = useUiStore((s) => s.clearUndoHistory)
  const undoCount = useUiStore((s) => s.undoStack.length)
  const redoCount = useUiStore((s) => s.redoStack.length)
  const templates = useProjectStore((s) => s.project?.templates)
  const updateTemplate = useProjectStore((s) => s.updateTemplate)
  const snapGridEnabled = useUiStore((s) => s.snapGridEnabled)
  const snapGridSize = useUiStore((s) => s.snapGridSize)
  const setSnapGridEnabled = useUiStore((s) => s.setSnapGridEnabled)
  const setSnapGridSize = useUiStore((s) => s.setSnapGridSize)

  const isFirstRender = useRef(true)
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return }
    clearUndoHistory()
  }, [activeTemplateId])

  if (!activeTemplateId || !templates) {
    return (
      <div className="p-6 text-neutral-400 text-sm">No template selected.</div>
    )
  }

  const template = templates.find((t) => t.id === activeTemplateId)
  if (!template) {
    return (
      <div className="p-6 text-neutral-400 text-sm">No template selected.</div>
    )
  }

  function handleCardTypeChange(type: CardType, checked: boolean) {
    if (!template) return
    const next = checked
      ? [...template.cardTypes, type]
      : template.cardTypes.filter((t) => t !== type)
    updateTemplate(activeTemplateId!, { cardTypes: next })
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top toolbar */}
      <div className="flex items-center gap-4 px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={undoCount === 0}
            onClick={() => performUndo(activeTemplateId!)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            disabled={redoCount === 0}
            onClick={() => performRedo(activeTemplateId!)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="tmpl-name" className="text-xs text-neutral-500 whitespace-nowrap">
            Template Name
          </label>
          <input
            id="tmpl-name"
            type="text"
            aria-label="Template Name"
            value={template.name}
            onChange={(e) => updateTemplate(activeTemplateId, { name: e.target.value })}
            className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-40 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="canvas-width" className="text-xs text-neutral-500">
            Canvas Width
          </label>
          <input
            id="canvas-width"
            type="number"
            aria-label="Canvas Width"
            min={100}
            max={2000}
            value={template.canvas.width}
            onChange={(e) =>
              updateTemplate(activeTemplateId, {
                canvas: { ...template.canvas, width: parseInt(e.target.value, 10) || 0 },
              })
            }
            className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-20 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="canvas-height" className="text-xs text-neutral-500">
            Canvas Height
          </label>
          <input
            id="canvas-height"
            type="number"
            aria-label="Canvas Height"
            min={100}
            max={2000}
            value={template.canvas.height}
            onChange={(e) =>
              updateTemplate(activeTemplateId, {
                canvas: { ...template.canvas, height: parseInt(e.target.value, 10) || 0 },
              })
            }
            className="bg-neutral-800 text-neutral-100 text-sm rounded px-2 py-1 w-20 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Snap"
            aria-pressed={snapGridEnabled}
            onClick={() => setSnapGridEnabled(!snapGridEnabled)}
            className={[
              'px-2 py-1 text-xs rounded border transition-colors',
              snapGridEnabled
                ? 'bg-indigo-600 border-indigo-500 text-white'
                : 'bg-neutral-800 border-neutral-700 text-neutral-400 hover:text-neutral-200',
            ].join(' ')}
          >
            Snap
          </button>
          <label htmlFor="grid-size" className="sr-only">Grid Size</label>
          <select
            id="grid-size"
            aria-label="Grid Size"
            value={String(snapGridSize)}
            onChange={(e) => setSnapGridSize(parseInt(e.target.value, 10))}
            className="bg-neutral-800 text-neutral-300 text-xs rounded px-2 py-1 outline-none border border-neutral-700"
          >
            {SNAP_SIZES.map((s) => (
              <option key={s} value={String(s)}>{s}px</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-neutral-500">Card Types</span>
          {CARD_TYPES.map((ct) => (
            <label key={ct} className="flex items-center gap-1 text-xs text-neutral-300">
              <input
                type="checkbox"
                aria-label={ct}
                checked={template.cardTypes.includes(ct)}
                onChange={(e) => handleCardTypeChange(ct, e.target.checked)}
                className="accent-indigo-500"
              />
              {ct}
            </label>
          ))}
        </div>
      </div>

      {/* Designer body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Layer panel (left) */}
        <div className="w-48 shrink-0 border-r border-neutral-800 flex flex-col overflow-y-auto">
          <div className="p-2 border-b border-neutral-800">
            <AddLayerMenu templateId={activeTemplateId} />
          </div>
          <LayerPanel templateId={activeTemplateId} />
        </div>

        {/* Canvas (center) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-neutral-950">
          <div className="flex items-center gap-3 px-3 py-1.5 border-b border-neutral-800 shrink-0">
            <PreviewCardSelector cardTypes={template.cardTypes} />
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <CanvasErrorBoundary>
              <DesignerCanvas templateId={activeTemplateId} />
            </CanvasErrorBoundary>
          </div>
        </div>

        {/* Properties panel (right) */}
        <div className="w-56 shrink-0 border-l border-neutral-800 overflow-y-auto">
          <PropertiesPanel templateId={activeTemplateId} />
        </div>
      </div>
    </div>
  )
}

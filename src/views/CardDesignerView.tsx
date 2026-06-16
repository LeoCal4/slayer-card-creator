import { useState, useEffect } from 'react'
import { Undo2, Redo2 } from 'lucide-react'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { performCardUndo, performCardRedo, pushCardSnapshot } from '@/lib/undoRedo'
import { computeEffectiveTemplate } from '@/lib/cardOverrides'
import { DesignerCanvas } from '@/components/designer/DesignerCanvas'
import { CanvasErrorBoundary } from '@/components/designer/CanvasErrorBoundary'
import { CardLayerPanel } from '@/components/designer/CardLayerPanel'
import { CardPropertiesPanel } from '@/components/designer/CardPropertiesPanel'
import type { TemplateLayer } from '@/types/template'

export function CardDesignerView() {
  const project = useProjectStore((s) => s.project)
  const updateCardLayerProps = useProjectStore((s) => s.updateCardLayerProps)
  const addCardExtraLayer = useProjectStore((s) => s.addCardExtraLayer)
  const activeCardId = useUiStore((s) => s.activeCardId)
  const setActiveCard = useUiStore((s) => s.setActiveCard)
  const setPreviewCard = useUiStore((s) => s.setPreviewCard)
  const cardUndoCount = useUiStore((s) => activeCardId ? (s.cardUndoStack[activeCardId]?.length ?? 0) : 0)
  const cardRedoCount = useUiStore((s) => activeCardId ? (s.cardRedoStack[activeCardId]?.length ?? 0) : 0)
  const [search, setSearch] = useState('')

  useEffect(() => {
    setPreviewCard(activeCardId)
  }, [activeCardId, setPreviewCard])

  if (!project) {
    return <div className="p-6 text-neutral-400 text-sm">No project loaded.</div>
  }

  const cards = project.cards
  const sorted = [...cards].sort((a, b) => a.name.localeCompare(b.name))
  const filtered = search
    ? sorted.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))
    : sorted

  const activeCard = cards.find((c) => c.id === activeCardId)

  const matchingTemplates = activeCard
    ? project.templates.filter((t) => t.cardTypes.includes(activeCard.type))
    : []
  const template = matchingTemplates[0] ?? null

  const cardOverride = activeCard ? project.cardOverrides?.[activeCard.id] : undefined
  const effectiveTemplate = template && activeCard
    ? computeEffectiveTemplate(template, cardOverride)
    : null

  function handleUpdateLayer(layerId: string, partial: Partial<TemplateLayer>) {
    if (!activeCard || !template) return
    updateCardLayerProps(activeCard.id, template.id, layerId, partial)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Multi-template warning */}
      {matchingTemplates.length > 1 && (
        <div
          role="alert"
          className="px-4 py-2 bg-yellow-900/40 border-b border-yellow-700/50 text-yellow-300 text-xs"
        >
          Multiple templates match this card type. Using the first match: &quot;{template?.name}&quot;.
        </div>
      )}

      {/* Top toolbar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
            disabled={cardUndoCount === 0}
            onClick={() => activeCardId && performCardUndo(activeCardId)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Undo2 size={14} />
          </button>
          <button
            type="button"
            aria-label="Redo"
            title="Redo (Ctrl+Y)"
            disabled={cardRedoCount === 0}
            onClick={() => activeCardId && performCardRedo(activeCardId)}
            className="p-1 rounded text-neutral-400 hover:text-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Redo2 size={14} />
          </button>
        </div>

        <label htmlFor="edit-card-search" className="text-xs text-neutral-500 whitespace-nowrap">
          Edit card
        </label>
        <input
          id="edit-card-search"
          type="text"
          aria-label="Search cards"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search…"
          className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none border border-neutral-700 w-20"
        />
        <select
          id="edit-card"
          aria-label="Edit card"
          value={activeCardId ?? ''}
          onChange={(e) => { setActiveCard(e.target.value || null); setSearch('') }}
          className="bg-neutral-800 text-neutral-200 text-xs rounded px-2 py-1 outline-none border border-neutral-700"
        >
          {filtered.length === 0 ? (
            <option value="">(none)</option>
          ) : (
            <>
              {!activeCardId && <option value="">(choose card)</option>}
              {filtered.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </>
          )}
        </select>
      </div>

      {/* Body */}
      {!activeCardId && (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          Select a card to start editing.
        </div>
      )}

      {activeCardId && !template && (
        <div className="flex-1 flex items-center justify-center text-neutral-500 text-sm">
          No template matches this card type.
        </div>
      )}

      {activeCardId && template && effectiveTemplate && (
        <div className="flex flex-1 overflow-hidden">
          {/* Layer panel (left) */}
          <div className="w-48 shrink-0 border-r border-neutral-800 flex flex-col overflow-y-auto">
            <div className="p-2 border-b border-neutral-800">
              <AddCardLayerMenu
                cardId={activeCard!.id}
                templateId={template.id}
                onAdd={(layer) => {
                    pushCardSnapshot(activeCard!.id)
                    addCardExtraLayer(activeCard!.id, template.id, layer)
                  }}
              />
            </div>
            <CardLayerPanel templateId={template.id} cardId={activeCard!.id} />
          </div>

          {/* Canvas (center) */}
          <div className="flex-1 flex items-center justify-center overflow-auto p-4 bg-neutral-950">
            <CanvasErrorBoundary>
              <DesignerCanvas
                templateId={template.id}
                templateOverride={effectiveTemplate}
                onUpdateLayer={handleUpdateLayer}
                onBeforeDrag={() => activeCard && pushCardSnapshot(activeCard.id)}
              />
            </CanvasErrorBoundary>
          </div>

          {/* Properties panel (right) */}
          <div className="w-64 shrink-0 border-l border-neutral-800 overflow-y-auto">
            <CardPropertiesPanel templateId={template.id} cardId={activeCard!.id} />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Add Card Layer Menu ────────────────────────────────────────────────────

type LayerType = 'rect' | 'text' | 'image' | 'badge' | 'phase-icons' | 'rarity-diamond'

const LAYER_TYPES: LayerType[] = ['rect', 'text', 'image', 'badge', 'phase-icons', 'rarity-diamond']

function defaultLayer(type: LayerType): TemplateLayer {
  const base = { id: crypto.randomUUID(), x: 0, y: 0, visible: true, locked: false }
  switch (type) {
    case 'rect':
      return { ...base, type: 'rect', width: 375, height: 50, fill: '#333333' }
    case 'text':
      return { ...base, type: 'text', x: 10, y: 10, width: 355, height: 30, fontSize: 18, fill: '#ffffff', align: 'left' }
    case 'image':
      return { ...base, type: 'image', width: 375, height: 523, imageSource: 'frame', imageFit: 'cover', opacity: 1 }
    case 'badge':
      return { ...base, type: 'badge', x: 10, y: 10, width: 50, height: 50, shape: 'circle', field: 'cost', fill: '#000000', textFill: '#ffffff', fontSize: 18 }
    case 'phase-icons':
      return { ...base, type: 'phase-icons', x: 10, y: 10, width: 200, height: 30, orientation: 'horizontal', iconSize: 24, gap: 4, fill: '#333333', textFill: '#ffffff' }
    case 'rarity-diamond':
      return { ...base, type: 'rarity-diamond', x: 10, y: 10, width: 40, height: 40 }
  }
}

function labelFor(type: LayerType): string {
  if (type === 'phase-icons') return 'Phase Icons'
  if (type === 'rarity-diamond') return 'Rarity Diamond'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

function AddCardLayerMenu({
  cardId: _cardId,
  templateId: _templateId,
  onAdd,
}: {
  cardId: string
  templateId: string
  onAdd: (layer: TemplateLayer) => void
}) {
  const [open, setOpen] = useState(false)

  function handleAdd(type: LayerType) {
    onAdd(defaultLayer(type))
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Add Layer"
        onClick={() => setOpen((v) => !v)}
        className="px-3 py-1.5 text-xs rounded bg-neutral-700 hover:bg-neutral-600 text-neutral-100 transition-colors"
      >
        + Add Layer
      </button>

      {open && (
        <div
          role="menu"
          className="absolute top-full left-0 mt-1 w-36 bg-neutral-800 border border-neutral-700 rounded shadow-lg z-10"
        >
          {LAYER_TYPES.map((type) => (
            <button
              key={type}
              role="menuitem"
              aria-label={labelFor(type)}
              onClick={() => handleAdd(type)}
              className="w-full text-left px-3 py-2 text-xs text-neutral-200 hover:bg-neutral-700"
            >
              {labelFor(type)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

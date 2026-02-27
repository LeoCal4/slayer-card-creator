import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import { pushSnapshot } from '@/lib/undoRedo'
import type { TemplateLayer } from '@/types/template'

interface Props {
  templateId: string
}

function layerLabel(layer: TemplateLayer): string {
  if (layer.label) return layer.label
  if ('field' in layer && layer.field) return String(layer.field)
  return layer.type
}

function EyeOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="9" ry="6" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="3" x2="21" y2="21" />
      <path d="M10.6 10.6A3 3 0 0 0 14.4 14.4" />
      <path d="M9.9 5.2A9 6 0 0 1 21 12" />
      <path d="M3 12s2.7-4.7 6.8-5.7" />
      <path d="M17.7 17.7A9 6 0 0 1 3 12" />
    </svg>
  )
}

function LockClosedIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  )
}

function LockOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 7.4-1" />
    </svg>
  )
}

export function LayerPanel({ templateId }: Props) {
  const templates = useProjectStore((s) => s.project?.templates)
  const updateLayer = useProjectStore((s) => s.updateLayer)
  const deleteLayer = useProjectStore((s) => s.deleteLayer)
  const reorderLayers = useProjectStore((s) => s.reorderLayers)
  const currentLayers = useProjectStore((s) => s.project?.templates.find((t) => t.id === templateId)?.layers ?? [])
  const selectedLayerId = useUiStore((s) => s.selectedLayerId)
  const setSelectedLayer = useUiStore((s) => s.setSelectedLayer)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  if (!templates) return null
  const template = templates.find((t) => t.id === templateId)
  if (!template) return null

  // Display bottom-to-top (last layer first in the list)
  const reversed = [...template.layers].reverse()

  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {reversed.map((layer) => (
        <li
          key={layer.id}
          role="listitem"
          aria-selected={layer.id === selectedLayerId}
          draggable
          onClick={() => setSelectedLayer(layer.id)}
          onDragStart={(e) => { e.stopPropagation(); setDraggingId(layer.id) }}
          onDragOver={(e) => { e.preventDefault(); setDragOverId(layer.id) }}
          onDragLeave={() => setDragOverId(null)}
          onDrop={(e) => {
            e.preventDefault()
            if (!draggingId || draggingId === layer.id) { setDragOverId(null); return }
            const fromIdx = reversed.findIndex((l) => l.id === draggingId)
            const toIdx = reversed.findIndex((l) => l.id === layer.id)
            const next = [...reversed]
            const [item] = next.splice(fromIdx, 1)
            next.splice(toIdx, 0, item)
            pushSnapshot(currentLayers)
            reorderLayers(templateId, [...next].reverse().map((l) => l.id))
            setDraggingId(null)
            setDragOverId(null)
          }}
          onDragEnd={() => { setDraggingId(null); setDragOverId(null) }}
          className={[
            'flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer select-none border-2',
            layer.id === draggingId ? 'opacity-40' : '',
            layer.id === dragOverId ? 'border-indigo-400' : 'border-transparent',
            layer.id === selectedLayerId
              ? 'bg-indigo-700 text-white'
              : 'hover:bg-neutral-700 text-neutral-300',
          ].join(' ')}
        >
          <span className="text-neutral-600 cursor-grab shrink-0" aria-hidden="true">⠿</span>
          <span className="flex-1 font-mono truncate">{layerLabel(layer)}</span>

          <button
            type="button"
            aria-label="Toggle visibility"
            onClick={(e) => {
              e.stopPropagation()
              updateLayer(templateId, layer.id, { visible: !layer.visible })
            }}
            className={[
              'w-5 h-5 flex items-center justify-center rounded',
              layer.visible !== false ? 'text-neutral-300' : 'text-neutral-600',
            ].join(' ')}
          >
            {layer.visible !== false ? <EyeOpenIcon /> : <EyeOffIcon />}
          </button>

          <button
            type="button"
            aria-label="Toggle lock"
            onClick={(e) => {
              e.stopPropagation()
              updateLayer(templateId, layer.id, { locked: !layer.locked })
            }}
            className={[
              'w-5 h-5 flex items-center justify-center rounded',
              layer.locked ? 'text-amber-400' : 'text-neutral-600',
            ].join(' ')}
          >
            {layer.locked ? <LockClosedIcon /> : <LockOpenIcon />}
          </button>

          <button
            type="button"
            aria-label="Delete layer"
            onClick={(e) => {
              e.stopPropagation()
              pushSnapshot(currentLayers)
              deleteLayer(templateId, layer.id)
            }}
            className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-red-400"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </li>
      ))}
    </ul>
  )
}

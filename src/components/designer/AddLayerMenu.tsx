import { useState } from 'react'
import { useProjectStore } from '@/store/projectStore'
import type { TemplateLayer } from '@/types/template'

interface Props {
  templateId: string
}

type LayerType = 'rect' | 'text' | 'image' | 'badge' | 'phase-icons'

const LAYER_TYPES: LayerType[] = ['rect', 'text', 'image', 'badge', 'phase-icons']

function defaultLayer(type: LayerType): TemplateLayer {
  const base = { id: crypto.randomUUID(), x: 0, y: 0, visible: true, locked: false }
  switch (type) {
    case 'rect':
      return { ...base, type: 'rect', width: 375, height: 50, fill: '#333333' }
    case 'text':
      return { ...base, type: 'text', x: 10, y: 10, width: 355, height: 30, field: 'name', fontSize: 18, fill: '#ffffff', align: 'left' }
    case 'image':
      return { ...base, type: 'image', width: 375, height: 523, imageSource: 'frame', imageFit: 'cover', opacity: 1 }
    case 'badge':
      return { ...base, type: 'badge', x: 10, y: 10, width: 50, height: 50, shape: 'circle', field: 'cost', fill: '#000000', textFill: '#ffffff', fontSize: 18 }
    case 'phase-icons':
      return { ...base, type: 'phase-icons', x: 10, y: 10, width: 200, height: 30, orientation: 'horizontal', iconSize: 24, gap: 4, align: 'left', fill: '#333333', textFill: '#ffffff' }
  }
}

function labelFor(type: LayerType): string {
  if (type === 'phase-icons') return 'Phase Icons'
  return type.charAt(0).toUpperCase() + type.slice(1)
}

export function AddLayerMenu({ templateId }: Props) {
  const addLayer = useProjectStore((s) => s.addLayer)
  const [open, setOpen] = useState(false)

  function handleAdd(type: LayerType) {
    addLayer(templateId, defaultLayer(type))
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

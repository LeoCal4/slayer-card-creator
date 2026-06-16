import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { TemplateLayer } from '@/types/template'

interface Props {
  templateId: string
  cardId: string
}

function layerLabel(layer: TemplateLayer): string {
  if (layer.label) return layer.label
  if ('field' in layer && layer.field) return String(layer.field)
  return layer.type
}

function EyeOpenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="9" ry="6" /><circle cx="12" cy="12" r="3" />
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

export function CardLayerPanel({ templateId, cardId }: Props) {
  const project = useProjectStore((s) => s.project)
  const toggleCardLayerHidden = useProjectStore((s) => s.toggleCardLayerHidden)
  const deleteCardExtraLayer = useProjectStore((s) => s.deleteCardExtraLayer)
  const selectedLayerId = useUiStore((s) => s.selectedLayerId)
  const setSelectedLayer = useUiStore((s) => s.setSelectedLayer)

  if (!project) return null

  const template = project.templates.find((t) => t.id === templateId)
  if (!template) return null

  const cardOverride = project.cardOverrides?.[cardId]
  const extraLayers = cardOverride?.extraLayers ?? []

  const reversed = [...template.layers].reverse()

  return (
    <ul className="flex flex-col gap-0.5 p-2">
      {reversed.map((layer) => {
        const isHidden = cardOverride?.layerOverrides?.[layer.id]?.hidden === true
        const isSelected = layer.id === selectedLayerId
        return (
          <li
            key={layer.id}
            role="listitem"
            aria-selected={isSelected}
            onClick={() => setSelectedLayer(layer.id)}
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer select-none border-2',
              isSelected ? 'bg-indigo-700 text-white' : 'hover:bg-neutral-700 text-neutral-300',
              'border-transparent',
              isHidden ? 'opacity-40' : '',
            ].join(' ')}
          >
            <span className="flex-1 font-mono truncate">{layerLabel(layer)}</span>
            <button
              type="button"
              aria-label={isHidden ? `Show ${layerLabel(layer)}` : `Hide ${layerLabel(layer)}`}
              onClick={(e) => {
                e.stopPropagation()
                toggleCardLayerHidden(cardId, templateId, layer.id, !isHidden)
              }}
              className={[
                'w-5 h-5 flex items-center justify-center rounded',
                isHidden ? 'text-neutral-600' : 'text-neutral-300',
              ].join(' ')}
            >
              {isHidden ? <EyeOffIcon /> : <EyeOpenIcon />}
            </button>
          </li>
        )
      })}

      {extraLayers.length > 0 && (
        <>
          <li className="px-2 py-1 text-xs text-neutral-600 uppercase tracking-wide mt-1">
            Card-only layers
          </li>
          {[...extraLayers].reverse().map((layer) => {
            const isSelected = layer.id === selectedLayerId
            return (
              <li
                key={layer.id}
                role="listitem"
                aria-selected={isSelected}
                onClick={() => setSelectedLayer(layer.id)}
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer select-none border-2',
                  isSelected ? 'bg-indigo-700 text-white' : 'hover:bg-neutral-700 text-neutral-300',
                  'border-transparent',
                ].join(' ')}
              >
                <span className="flex-1 font-mono truncate">{layerLabel(layer)}</span>
                <button
                  type="button"
                  aria-label={`Delete ${layerLabel(layer)}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteCardExtraLayer(cardId, layer.id)
                  }}
                  className="w-5 h-5 flex items-center justify-center rounded text-neutral-600 hover:text-red-400"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </li>
            )
          })}
        </>
      )}
    </ul>
  )
}

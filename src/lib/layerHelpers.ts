import type { CardData } from '@/types/card'
import type { ClassConfig } from '@/types/project'
import type { RectLayer, TextLayer } from '@/types/template'

const FALLBACK_FILL = '#555555'

export function shouldShowLayer(
  layer: { showIfField?: keyof CardData },
  previewCard: CardData | null,
): boolean {
  if (!layer.showIfField) return true
  if (!previewCard) return true
  const val = previewCard[layer.showIfField]
  return val !== undefined && val !== null && val !== '' && val !== 0
}

export function resolveFieldText(
  field: TextLayer['field'],
  card: CardData | null,
): string {
  if (!field) return ''
  if (!card) return `[${field}]`
  if (field === 'stats') return `${card.power ?? '-'}/${card.hp ?? '-'}`
  if (field === 'statsVP') return `${card.vp ?? '-'} VP`
  const val = card[field as keyof CardData]
  const str = val !== undefined && val !== null ? String(val) : `[${field}]`
  return str.replace(/\\n/g, '\n')
}

export function resolveRectFill(
  layer: RectLayer,
  classColors: Record<string, ClassConfig>,
  previewCard: CardData | null,
): string {
  if (!layer.fillSource) return layer.fill ?? FALLBACK_FILL
  if (!previewCard) return FALLBACK_FILL
  const config = classColors[previewCard.class]
  if (!config) return FALLBACK_FILL
  if (layer.fillSource === 'class.primary') return config.primary
  if (layer.fillSource === 'class.secondary') return config.secondary
  return layer.fill ?? FALLBACK_FILL
}

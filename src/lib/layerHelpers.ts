import type { CardData } from '@/types/card'
import type { ClassConfig } from '@/types/project'
import type { RectLayer, TextLayer } from '@/types/template'

const FALLBACK_FILL = '#555555'

function makeGradient(
  layer: { width: number; height: number; gradientAngle?: number },
  startColor: string,
  endColor: string,
): RectFillResult {
  const rad = ((layer.gradientAngle ?? 0) * Math.PI) / 180
  const cos = Math.cos(rad)
  const sin = Math.sin(rad)
  const cx = layer.width / 2
  const cy = layer.height / 2
  const r = (n: number) => Math.round(n * 1e10) / 1e10
  return {
    fillLinearGradientStartPoint: { x: r(cx * (1 - cos)), y: r(cy * (1 - sin)) },
    fillLinearGradientEndPoint:   { x: r(cx * (1 + cos)), y: r(cy * (1 + sin)) },
    fillLinearGradientColorStops: [0, startColor, 1, endColor],
  }
}

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

export interface RectFillResult {
  fill?: string
  fillLinearGradientStartPoint?: { x: number; y: number }
  fillLinearGradientEndPoint?: { x: number; y: number }
  fillLinearGradientColorStops?: (number | string)[]
}

export function resolveRectFill(
  layer: RectLayer,
  classColors: Record<string, ClassConfig>,
  previewCard: CardData | null,
): RectFillResult {
  if (!layer.fillSource) return { fill: layer.fill ?? FALLBACK_FILL }

  const classes = previewCard?.class
    ? previewCard.class.split(',').map((c) => c.trim()).filter(Boolean)
    : []

  // Dual-class: gradient of class1 → class2 colors (or secondary for class.secondary)
  if (classes.length === 2) {
    const config1 = classColors[classes[0]]
    const config2 = classColors[classes[1]]
    if (layer.fillSource === 'class.primary') {
      return makeGradient(layer, config1?.primary ?? FALLBACK_FILL, config2?.primary ?? FALLBACK_FILL)
    }
    if (layer.fillSource === 'class.secondary') {
      return makeGradient(layer, config1?.secondary ?? FALLBACK_FILL, config2?.secondary ?? FALLBACK_FILL)
    }
    if (layer.fillSource === 'class.gradient') {
      const startColor = layer.gradientStartColor ?? config1?.primary ?? FALLBACK_FILL
      const endColor = layer.gradientEndColor ?? config2?.primary ?? FALLBACK_FILL
      return makeGradient(layer, startColor, endColor)
    }
  }

  const config = classes.length >= 1 ? classColors[classes[0]] : undefined
  if (layer.fillSource === 'class.primary') return { fill: config?.primary ?? FALLBACK_FILL }
  if (layer.fillSource === 'class.secondary') return { fill: config?.secondary ?? FALLBACK_FILL }
  if (layer.fillSource === 'class.gradient') {
    const startColor = layer.gradientStartColor ?? config?.primary ?? FALLBACK_FILL
    const endColor = layer.gradientEndColor ?? config?.secondary ?? FALLBACK_FILL
    if (!layer.gradientStartColor && !layer.gradientEndColor && !config) return { fill: FALLBACK_FILL }
    return makeGradient(layer, startColor, endColor)
  }
  return { fill: layer.fill ?? FALLBACK_FILL }
}

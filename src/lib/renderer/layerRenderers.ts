import Konva from 'konva'
import { resolveRectFill, resolveFieldText } from '@/lib/layerHelpers'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer } from '@/types/template'
import type { RenderContext } from './cardRenderer'

export function renderRect(layer: RectLayer, ctx: RenderContext): Konva.Rect | null {
  if (layer.visible === false) return null
  return new (Konva.Rect as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    fill: resolveRectFill(layer, ctx.project.classColors, ctx.card),
    cornerRadius: layer.cornerRadius,
    stroke: layer.stroke,
    strokeWidth: layer.strokeWidth,
    opacity: layer.opacity ?? 1,
  })
}

export function renderText(layer: TextLayer, ctx: RenderContext): Konva.Text | null {
  if (layer.visible === false) return null
  return new (Konva.Text as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    text: resolveFieldText(layer.field, ctx.card),
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily ?? 'sans-serif',
    fontStyle: layer.fontStyle ?? 'normal',
    fill: layer.fill ?? '#ffffff',
    align: layer.align ?? 'left',
    lineHeight: layer.lineHeight ?? 1,
    wrap: layer.wrap ?? 'word',
  })
}

export function renderImage(layer: ImageLayer, ctx: RenderContext): Konva.Node | null {
  if (layer.visible === false) return null

  let image: HTMLImageElement | undefined
  if (layer.imageSource === 'frame') {
    image = ctx.frameImages.get(ctx.template.id)
  } else {
    image = ctx.artImages.get(ctx.card.name)
  }

  if (!image) {
    // Placeholder: grey rect + centered card name
    const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
    group.add(new (Konva.Rect as any)({ width: layer.width, height: layer.height, fill: '#888888' }))
    group.add(new (Konva.Text as any)({
      width: layer.width,
      height: layer.height,
      text: ctx.card.name,
      align: 'center',
      fill: '#ffffff',
    }))
    return group
  }

  return new (Konva.Image as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    image,
    opacity: layer.opacity ?? 1,
  })
}

export function renderBadge(layer: BadgeLayer, ctx: RenderContext): Konva.Group | null {
  if (layer.visible === false) return null
  const r = Math.min(layer.width, layer.height) / 2
  const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
  group.add(new (Konva.Circle as any)({
    x: layer.width / 2,
    y: layer.height / 2,
    radius: r,
    fill: layer.fill ?? '#000000',
  }))
  group.add(new (Konva.Text as any)({
    x: 0,
    y: 0,
    width: layer.width,
    height: layer.height,
    text: resolveFieldText(layer.field, ctx.card),
    fontSize: layer.fontSize ?? 18,
    fill: layer.textFill ?? '#ffffff',
    align: 'center',
  }))
  return group
}

export function renderPhaseIcons(layer: PhaseIconsLayer, ctx: RenderContext): Konva.Group | null {
  if (layer.visible === false) return null
  const phases = ctx.project.phaseMap[ctx.card.type] ?? []
  const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
  const { iconSize, gap } = layer
  phases.forEach((phase, i) => {
    const offset = i * (iconSize + gap)
    const px = layer.orientation === 'horizontal' ? offset : 0
    const py = layer.orientation === 'vertical' ? offset : 0
    const subGroup = new (Konva.Group as any)({ x: px, y: py })
    subGroup.add(new (Konva.Rect as any)({
      width: iconSize,
      height: iconSize,
      fill: layer.fill ?? '#333333',
      cornerRadius: layer.cornerRadius ?? 0,
    }))
    subGroup.add(new (Konva.Text as any)({
      width: iconSize,
      height: iconSize,
      text: ctx.project.phaseAbbreviations[phase] ?? phase[0],
      fontSize: Math.floor(iconSize * 0.6),
      fill: layer.textFill ?? '#ffffff',
      align: 'center',
    }))
    group.add(subGroup)
  })
  return group
}

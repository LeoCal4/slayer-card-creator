import Konva from 'konva'
import { shouldShowLayer } from '@/lib/layerHelpers'
import { renderRect, renderText, renderImage, renderBadge, renderPhaseIcons } from './layerRenderers'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

export interface RenderContext {
  card: CardData
  template: Template
  project: ProjectFile
  artImages: Map<string, HTMLImageElement>
  frameImages: Map<string, HTMLImageElement>
}

export async function renderCard(ctx: RenderContext): Promise<Blob> {
  const { template } = ctx
  const { width, height } = template.canvas

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer()

  for (const layerDef of template.layers) {
    if (!shouldShowLayer(layerDef, ctx.card)) continue
    let node: any = null
    if (layerDef.type === 'rect') node = renderRect(layerDef, ctx)
    else if (layerDef.type === 'text') node = renderText(layerDef, ctx)
    else if (layerDef.type === 'image') node = renderImage(layerDef, ctx)
    else if (layerDef.type === 'badge') node = renderBadge(layerDef, ctx)
    else if (layerDef.type === 'phase-icons') node = renderPhaseIcons(layerDef, ctx)
    if (node) layer.add(node)
  }

  stage.add(layer)
  stage.draw()

  const blob = await stage.toBlob({ mimeType: 'image/png' }) as Blob

  stage.destroy()
  document.body.removeChild(container)

  return blob
}

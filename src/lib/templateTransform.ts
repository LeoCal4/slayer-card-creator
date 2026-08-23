import type { Template } from '@/types/template'

/**
 * Rotates a template 90 degrees, swapping the canvas dimensions and remapping
 * every layer's box so the layout follows the new orientation (nothing ends up
 * offscreen). Layer content (text, images) is not visually rotated — only the
 * bounding boxes are repositioned, which is the expected behaviour when turning
 * a portrait card layout into a landscape one and vice-versa.
 *
 * Rotating 'cw' then 'ccw' (or vice-versa) returns the original layout exactly.
 */
export function rotateTemplate(template: Template, direction: 'cw' | 'ccw'): Template {
  const { width: w, height: h } = template.canvas
  const layers = template.layers.map((layer) =>
    direction === 'cw'
      ? { ...layer, x: h - layer.y - layer.height, y: layer.x, width: layer.height, height: layer.width }
      : { ...layer, x: layer.y, y: w - layer.x - layer.width, width: layer.height, height: layer.width },
  )
  return { ...template, canvas: { width: h, height: w }, layers }
}

export interface RenderTransform {
  /** Output image width — always portrait (<= height). */
  width: number
  /** Output image height — always portrait (>= width). */
  height: number
  /** Konva group rotation in degrees. */
  rotation: number
  /** Konva group x offset. */
  x: number
  /** Konva group y offset. */
  y: number
}

/**
 * Computes how a template's design maps onto its exported image. Output images
 * are ALWAYS portrait-sized: a portrait design renders as-is, while a landscape
 * (wide) design is rotated 90° counter-clockwise into a portrait frame so the
 * file keeps portrait dimensions. The physical card is simply turned sideways
 * (rotate clockwise) to be read as a horizontal card.
 */
export function getRenderTransform(canvas: { width: number; height: number }): RenderTransform {
  const landscape = canvas.width > canvas.height
  if (!landscape) {
    return { width: canvas.width, height: canvas.height, rotation: 0, x: 0, y: 0 }
  }
  return { width: canvas.height, height: canvas.width, rotation: 270, x: 0, y: canvas.width }
}

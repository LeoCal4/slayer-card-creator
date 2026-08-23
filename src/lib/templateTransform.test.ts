import { describe, it, expect } from 'vitest'
import { rotateTemplate, getRenderTransform } from './templateTransform'
import type { Template } from '@/types/template'

const TEMPLATE: Template = {
  id: 't1',
  name: 'T',
  cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 },
  layers: [
    { id: 'top', type: 'rect', x: 0, y: 0, width: 375, height: 50 },
    { id: 'bottom', type: 'rect', x: 10, y: 470, width: 100, height: 40 },
  ],
}

describe('rotateTemplate', () => {
  it('swaps the canvas dimensions', () => {
    expect(rotateTemplate(TEMPLATE, 'cw').canvas).toEqual({ width: 523, height: 375 })
    expect(rotateTemplate(TEMPLATE, 'ccw').canvas).toEqual({ width: 523, height: 375 })
  })

  it('keeps every layer inside the rotated canvas (nothing offscreen)', () => {
    const { canvas, layers } = rotateTemplate(TEMPLATE, 'cw')
    for (const l of layers) {
      expect(l.x).toBeGreaterThanOrEqual(0)
      expect(l.y).toBeGreaterThanOrEqual(0)
      expect(l.x + l.width).toBeLessThanOrEqual(canvas.width)
      expect(l.y + l.height).toBeLessThanOrEqual(canvas.height)
    }
  })

  it('swaps each layer width and height', () => {
    const bottom = rotateTemplate(TEMPLATE, 'cw').layers.find((l) => l.id === 'bottom')!
    expect(bottom.width).toBe(40)
    expect(bottom.height).toBe(100)
  })

  it('round-trips back to the original (cw then ccw)', () => {
    const restored = rotateTemplate(rotateTemplate(TEMPLATE, 'cw'), 'ccw')
    expect(restored.canvas).toEqual(TEMPLATE.canvas)
    expect(restored.layers).toEqual(TEMPLATE.layers)
  })

  it('round-trips back to the original (ccw then cw)', () => {
    const restored = rotateTemplate(rotateTemplate(TEMPLATE, 'ccw'), 'cw')
    expect(restored.canvas).toEqual(TEMPLATE.canvas)
    expect(restored.layers).toEqual(TEMPLATE.layers)
  })

  it('preserves non-geometry layer properties', () => {
    const tmpl: Template = {
      ...TEMPLATE,
      layers: [{ id: 'txt', type: 'text', x: 5, y: 5, width: 100, height: 30, fontSize: 18, field: 'name' }],
    }
    const rotated = rotateTemplate(tmpl, 'cw').layers[0]
    expect(rotated).toMatchObject({ type: 'text', fontSize: 18, field: 'name' })
  })
})

describe('getRenderTransform', () => {
  it('renders a portrait canvas unchanged (no rotation)', () => {
    expect(getRenderTransform({ width: 375, height: 523 })).toEqual({
      width: 375, height: 523, rotation: 0, x: 0, y: 0,
    })
  })

  it('renders a landscape canvas into a portrait-sized frame', () => {
    const t = getRenderTransform({ width: 523, height: 375 })
    // Output dimensions are portrait (taller than wide), not the swapped landscape size.
    expect(t.width).toBe(375)
    expect(t.height).toBe(523)
    expect(t.height).toBeGreaterThan(t.width)
  })

  it('rotates landscape content so it lands fully inside the portrait frame', () => {
    const t = getRenderTransform({ width: 523, height: 375 })
    // Map the four corners of the design through the Konva group transform and
    // confirm they all fall within [0, width] x [0, height] of the output.
    const rad = (t.rotation * Math.PI) / 180
    const cos = Math.round(Math.cos(rad))
    const sin = Math.round(Math.sin(rad))
    const corners = [[0, 0], [523, 0], [0, 375], [523, 375]]
    for (const [lx, ly] of corners) {
      const gx = t.x + lx * cos - ly * sin
      const gy = t.y + lx * sin + ly * cos
      expect(gx).toBeGreaterThanOrEqual(0)
      expect(gx).toBeLessThanOrEqual(t.width)
      expect(gy).toBeGreaterThanOrEqual(0)
      expect(gy).toBeLessThanOrEqual(t.height)
    }
  })
})

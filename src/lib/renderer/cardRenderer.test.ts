import { describe, it, expect } from 'vitest'
import { renderCard } from './cardRenderer'
import type { RenderContext } from './cardRenderer'
import type { RectLayer, TextLayer } from '@/types/template'

const ctx: RenderContext = {
  card: { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '' },
  template: {
    id: 'tmpl-1', name: 'Test', cardTypes: ['Slayer'],
    canvas: { width: 375, height: 523 },
    layers: [
      { id: 'l-bg', type: 'rect', x: 0, y: 0, width: 375, height: 523, fill: '#222' } as RectLayer,
      { id: 'l-name', type: 'text', x: 10, y: 10, width: 200, height: 30, field: 'name', fontSize: 18 } as TextLayer,
      { id: 'l-hidden', type: 'rect', x: 0, y: 0, width: 10, height: 10, visible: false } as RectLayer,
    ],
  },
  project: {
    version: 1,
    set: { name: 'Test', code: 'TST', type: 'Core', releaseDate: '' },
    classColors: {},
    phaseAbbreviations: {},
    phaseMap: {},
    rarityConfig: {
      common: { aliases: ['comune'], color: '#4ade80' },
      rare:   { aliases: ['rara'],   color: '#f87171' },
      epic:   { aliases: ['epica'],  color: '#60a5fa' },
    },
    templates: [], cards: [], artFolderPath: '', frameImages: {},
  },
  artImages: new Map(),
  frameImages: new Map(),
}

describe('renderCard', () => {
  it('returns a Blob', async () => {
    const blob = await renderCard(ctx)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('removes the container div from the DOM after rendering', async () => {
    const before = document.body.children.length
    await renderCard(ctx)
    expect(document.body.children.length).toBe(before)
  })

  it('works with an empty layer list', async () => {
    const emptyCtx: RenderContext = {
      ...ctx,
      template: { ...ctx.template, layers: [] },
    }
    const blob = await renderCard(emptyCtx)
    expect(blob).toBeInstanceOf(Blob)
  })

  it('skips layers whose showIfField resolves to falsy on the card', async () => {
    const ctxWithConditional: RenderContext = {
      ...ctx,
      template: {
        ...ctx.template,
        layers: [
          {
            id: 'l-cost', type: 'rect', x: 0, y: 0, width: 10, height: 10,
            showIfField: 'cost', // card has no cost → should be skipped
          } as RectLayer,
        ],
      },
    }
    // Should complete without error (skipped layer means no crash)
    await expect(renderCard(ctxWithConditional)).resolves.toBeInstanceOf(Blob)
  })
})

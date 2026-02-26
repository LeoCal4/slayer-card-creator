import { describe, it } from 'vitest'
import type {
  RectLayer, ImageLayer, TextLayer, BadgeLayer, PhaseIconsLayer,
  RarityDiamondLayer, TemplateLayer, Template,
} from './template'

describe('RectLayer', () => {
  it('has type discriminant "rect" and accepts fillSource variants', () => {
    void ({
      id: 'bg', type: 'rect', x: 0, y: 0, width: 375, height: 523,
      fillSource: 'class.primary',
    } satisfies RectLayer)

    void ({
      id: 'bg2', type: 'rect', x: 0, y: 0, width: 375, height: 523,
      fill: '#ff0000',
    } satisfies RectLayer)
  })
})

describe('ImageLayer', () => {
  it('accepts art and frame imageSources with all fit modes', () => {
    void ({
      id: 'art', type: 'image', x: 15, y: 50, width: 345, height: 210,
      imageSource: 'art', imageFit: 'cover',
    } satisfies ImageLayer)

    void ({
      id: 'frame', type: 'image', x: 0, y: 0, width: 375, height: 523,
      imageSource: 'frame', imageFit: 'stretch',
    } satisfies ImageLayer)
  })
})

describe('TextLayer', () => {
  it('accepts card fields and computed fields', () => {
    void ({
      id: 'name', type: 'text', x: 15, y: 10, width: 280, height: 35,
      field: 'name', fontSize: 18,
    } satisfies TextLayer)

    void ({
      id: 'stats', type: 'text', x: 15, y: 10, width: 100, height: 35,
      field: 'stats', fontSize: 14,
    } satisfies TextLayer)

    void ({
      id: 'statsVP', type: 'text', x: 15, y: 10, width: 100, height: 35,
      field: 'statsVP', fontSize: 14,
    } satisfies TextLayer)
  })
})

describe('BadgeLayer', () => {
  it('has type discriminant "badge" (not "icon")', () => {
    void ({
      id: 'cost', type: 'badge', x: 320, y: 8, width: 42, height: 42,
      shape: 'circle', field: 'cost',
    } satisfies BadgeLayer)
  })
})

describe('PhaseIconsLayer', () => {
  it('has orientation: horizontal | vertical', () => {
    void ({
      id: 'phases-h', type: 'phase-icons', x: 220, y: 265,
      width: 150, height: 30,
      orientation: 'horizontal', iconSize: 22, gap: 4,
    } satisfies PhaseIconsLayer)

    void ({
      id: 'phases-v', type: 'phase-icons', x: 220, y: 265,
      width: 30, height: 150,
      orientation: 'vertical', iconSize: 22, gap: 4,
    } satisfies PhaseIconsLayer)
  })
})

describe('RarityDiamondLayer', () => {
  it('has type discriminant "rarity-diamond"', () => {
    void ({
      id: 'diamond', type: 'rarity-diamond', x: 10, y: 10, width: 40, height: 40,
    } satisfies RarityDiamondLayer)
    void ({
      id: 'diamond2', type: 'rarity-diamond', x: 10, y: 10, width: 40, height: 40,
      stroke: '#ffffff', strokeWidth: 2, opacity: 0.8,
    } satisfies RarityDiamondLayer)
  })
})

describe('TemplateLayer union', () => {
  it('accepts all six layer types', () => {
    void ([
      { id: 'r', type: 'rect', x: 0, y: 0, width: 10, height: 10 },
      { id: 'i', type: 'image', x: 0, y: 0, width: 10, height: 10, imageSource: 'art', imageFit: 'cover' },
      { id: 't', type: 'text', x: 0, y: 0, width: 10, height: 10, field: 'name', fontSize: 14 },
      { id: 'b', type: 'badge', x: 0, y: 0, width: 10, height: 10, shape: 'circle', field: 'cost' },
      { id: 'p', type: 'phase-icons', x: 0, y: 0, width: 10, height: 10, orientation: 'horizontal', iconSize: 20, gap: 4 },
      { id: 'd', type: 'rarity-diamond', x: 0, y: 0, width: 10, height: 10 },
    ] satisfies TemplateLayer[])
  })
})

describe('Template', () => {
  it('has required fields', () => {
    void ({
      id: 'tmpl-1',
      name: 'Creature Template',
      cardTypes: ['Slayer', 'Errant'],
      canvas: { width: 375, height: 523 },
      layers: [],
    } satisfies Template)
  })
})

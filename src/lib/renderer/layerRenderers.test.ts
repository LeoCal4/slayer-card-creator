import { describe, it, expect } from 'vitest'
import Konva from 'konva'
import { renderRect, renderText, renderImage, renderBadge, renderPhaseIcons, renderRarityDiamond } from './layerRenderers'
import type { RenderContext } from './cardRenderer'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer, RarityDiamondLayer } from '@/types/template'

const baseCtx: RenderContext = {
  card: {
    id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
    rarity: 'common', effect: 'Charge.', cost: 3, power: 2, hp: 4,
  },
  template: {
    id: 'tmpl-1', name: 'Slayer', cardTypes: ['Slayer'],
    canvas: { width: 375, height: 523 }, layers: [],
  },
  project: {
    version: 1,
    set: { name: 'Test', code: 'TST', type: 'Core', releaseDate: '' },
    classColors: { Warrior: { primary: '#ff0000', secondary: '#880000', cockatriceColor: 'R' } },
    phaseAbbreviations: { Encounter: 'E', Preparation: 'P' },
    phaseMap: { Slayer: ['Encounter', 'Preparation'] },
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

const baseRect: RectLayer = {
  id: 'l-bg', type: 'rect', x: 0, y: 0, width: 375, height: 523,
  fill: '#222222',
}

const baseText: TextLayer = {
  id: 'l-name', type: 'text', x: 10, y: 10, width: 200, height: 30,
  field: 'name', fontSize: 18, fill: '#ffffff',
}

const baseImage: ImageLayer = {
  id: 'l-art', type: 'image', x: 0, y: 50, width: 375, height: 250,
  imageSource: 'art', imageFit: 'cover',
}

const baseBadge: BadgeLayer = {
  id: 'l-cost', type: 'badge', x: 10, y: 10, width: 40, height: 40,
  shape: 'circle', field: 'cost', fill: '#000099', textFill: '#ffffff', fontSize: 16,
}

const basePhaseIcons: PhaseIconsLayer = {
  id: 'l-phases', type: 'phase-icons', x: 10, y: 490, width: 200, height: 20,
  orientation: 'horizontal', iconSize: 20, gap: 4, align: 'left',
}

describe('renderRect', () => {
  it('returns a Konva.Rect with correct position and size', () => {
    const node = renderRect(baseRect, baseCtx)
    expect(node).toBeInstanceOf(Konva.Rect)
    expect(node!.attrs.x).toBe(0)
    expect(node!.attrs.y).toBe(0)
    expect(node!.attrs.width).toBe(375)
    expect(node!.attrs.height).toBe(523)
  })

  it('resolves class color fill when fillSource is set', () => {
    const layer: RectLayer = { ...baseRect, fillSource: 'class.primary' }
    const node = renderRect(layer, baseCtx)
    expect(node!.attrs.fill).toBe('#ff0000')
  })

  it('returns null for a hidden layer', () => {
    const node = renderRect({ ...baseRect, visible: false }, baseCtx)
    expect(node).toBeNull()
  })

  it('uses static fill when no fillSource', () => {
    const node = renderRect(baseRect, baseCtx)
    expect(node!.attrs.fill).toBe('#222222')
  })
})

describe('renderText', () => {
  it('returns a Konva.Text with field value from card', () => {
    const node = renderText(baseText, baseCtx)
    expect(node).toBeInstanceOf(Konva.Text)
    expect(node!.attrs.text).toBe('Axehand')
  })

  it('uses [field] placeholder when card field is missing', () => {
    const ctx = { ...baseCtx, card: { ...baseCtx.card, name: undefined as any } }
    const node = renderText(baseText, ctx)
    expect(node!.attrs.text).toBe('[name]')
  })

  it('returns null for a hidden layer', () => {
    expect(renderText({ ...baseText, visible: false }, baseCtx)).toBeNull()
  })

  it('renders stats synthetic field', () => {
    const layer: TextLayer = { ...baseText, field: 'stats' }
    const node = renderText(layer, baseCtx)
    expect(node!.attrs.text).toBe('2/4')
  })
})

describe('renderImage', () => {
  it('returns a Konva.Image when art image is available', () => {
    const img = new Image()
    const ctx = { ...baseCtx, artImages: new Map([['Axehand', img]]) }
    const node = renderImage(baseImage, ctx)
    expect(node).toBeInstanceOf(Konva.Image)
    expect((node as any).attrs.image).toBe(img)
  })

  it('returns a placeholder group when art image is missing', () => {
    const node = renderImage(baseImage, baseCtx)
    expect(node).toBeInstanceOf(Konva.Group)
  })

  it('returns a Konva.Image for frame source when frame image is available', () => {
    const img = new Image()
    const ctxWithFrame: RenderContext = {
      ...baseCtx,
      frameImages: new Map([['tmpl-1', img]]),
    }
    const layer: ImageLayer = { ...baseImage, imageSource: 'frame' }
    const node = renderImage(layer, ctxWithFrame)
    expect(node).toBeInstanceOf(Konva.Image)
  })

  it('returns null for a hidden layer', () => {
    expect(renderImage({ ...baseImage, visible: false }, baseCtx)).toBeNull()
  })
})

describe('renderBadge', () => {
  it('returns a Konva.Group with correct position', () => {
    const node = renderBadge(baseBadge, baseCtx)
    expect(node).toBeInstanceOf(Konva.Group)
    expect(node!.attrs.x).toBe(10)
    expect(node!.attrs.y).toBe(10)
  })

  it('returns null for a hidden layer', () => {
    expect(renderBadge({ ...baseBadge, visible: false }, baseCtx)).toBeNull()
  })
})

describe('renderPhaseIcons', () => {
  it('returns a Konva.Group at the layer position', () => {
    const node = renderPhaseIcons(basePhaseIcons, baseCtx)
    expect(node).toBeInstanceOf(Konva.Group)
    expect(node!.attrs.x).toBe(10)
    expect(node!.attrs.y).toBe(490)
  })

  it('returns null for a hidden layer', () => {
    expect(renderPhaseIcons({ ...basePhaseIcons, visible: false }, baseCtx)).toBeNull()
  })

  it('renders no icons when card type has no phase mapping', () => {
    const ctx: RenderContext = {
      ...baseCtx,
      card: { ...baseCtx.card, type: 'Action' },
      project: { ...baseCtx.project, phaseMap: {} },
    }
    const node = renderPhaseIcons(basePhaseIcons, ctx)
    expect(node).toBeInstanceOf(Konva.Group)
  })
})

const baseDiamond: RarityDiamondLayer = {
  id: 'l-diamond', type: 'rarity-diamond', x: 20, y: 20, width: 40, height: 40,
}

describe('renderRarityDiamond', () => {
  it('returns a Konva.RegularPolygon at the correct center position', () => {
    const node = renderRarityDiamond(baseDiamond, baseCtx)
    expect(node).toBeInstanceOf(Konva.RegularPolygon)
    // Center = x + width/2, y + height/2
    expect(node!.attrs.x).toBe(40)
    expect(node!.attrs.y).toBe(40)
  })

  it('fills with the rarity color from project.rarityConfig', () => {
    const node = renderRarityDiamond(baseDiamond, baseCtx)
    // card.rarity === 'common', rarityConfig.common.color === '#4ade80'
    expect(node!.attrs.fill).toBe('#4ade80')
  })

  it('fills with rare color when card rarity is rare', () => {
    const ctx: RenderContext = { ...baseCtx, card: { ...baseCtx.card, rarity: 'rare' } }
    const node = renderRarityDiamond(baseDiamond, ctx)
    expect(node!.attrs.fill).toBe('#f87171')
  })

  it('returns null for a hidden layer', () => {
    expect(renderRarityDiamond({ ...baseDiamond, visible: false }, baseCtx)).toBeNull()
  })
})

import { describe, it, expect } from 'vitest'
import { shouldShowLayer, resolveRectFill, resolveFieldText } from './layerHelpers'
import type { CardData } from '@/types/card'
import type { RectLayer } from '@/types/template'

const CARD: CardData = {
  id: 'c1', name: 'Fireball', class: 'Mage', type: 'Action',
  rarity: 'common', cost: 3, effect: 'Deal 3 damage.',
}

const CLASS_COLORS = {
  Mage: { primary: '#2980b9', secondary: '#1a5276', cockatriceColor: 'U' },
  Warrior: { primary: '#c0392b', secondary: '#7b241c', cockatriceColor: 'R' },
}

describe('shouldShowLayer', () => {
  it('returns true when showIfField is undefined', () => {
    expect(shouldShowLayer({ showIfField: undefined }, null)).toBe(true)
  })

  it('returns true when showIfField is set but no preview card', () => {
    expect(shouldShowLayer({ showIfField: 'cost' }, null)).toBe(true)
  })

  it('returns false when the card field is undefined', () => {
    const cardNoCost = { ...CARD, cost: undefined }
    expect(shouldShowLayer({ showIfField: 'cost' }, cardNoCost)).toBe(false)
  })

  it('returns false when the card field is 0', () => {
    const cardZeroCost = { ...CARD, cost: 0 }
    expect(shouldShowLayer({ showIfField: 'cost' }, cardZeroCost)).toBe(false)
  })

  it('returns false when the card field is an empty string', () => {
    const cardEmptyEffect = { ...CARD, effect: '' }
    expect(shouldShowLayer({ showIfField: 'effect' }, cardEmptyEffect)).toBe(false)
  })

  it('returns true when the card field has a truthy value', () => {
    expect(shouldShowLayer({ showIfField: 'cost' }, CARD)).toBe(true)
    expect(shouldShowLayer({ showIfField: 'effect' }, CARD)).toBe(true)
  })
})

describe('resolveFieldText', () => {
  const CARD_FULL: CardData = {
    id: 'c1', name: 'Fireball', class: 'Mage', type: 'Action',
    rarity: 'common', cost: 3, effect: 'Deal 3 damage.', power: 4, hp: 2, vp: 1,
  }

  it('returns [field] placeholder when no card provided', () => {
    expect(resolveFieldText('name', null)).toBe('[name]')
    expect(resolveFieldText('effect', null)).toBe('[effect]')
  })

  it('returns the string value for a standard field', () => {
    expect(resolveFieldText('name', CARD_FULL)).toBe('Fireball')
    expect(resolveFieldText('effect', CARD_FULL)).toBe('Deal 3 damage.')
  })

  it('stringifies numeric fields', () => {
    expect(resolveFieldText('cost', CARD_FULL)).toBe('3')
  })

  it('returns power/hp for the synthetic stats field', () => {
    expect(resolveFieldText('stats', CARD_FULL)).toBe('4/2')
  })

  it('uses dash when power or hp is undefined in stats', () => {
    const noStats = { ...CARD_FULL, power: undefined, hp: undefined }
    expect(resolveFieldText('stats', noStats)).toBe('-/-')
  })

  it('returns vp VP for the synthetic statsVP field', () => {
    expect(resolveFieldText('statsVP', CARD_FULL)).toBe('1 VP')
  })

  it('returns [field] when the field is undefined on the card', () => {
    const noCost = { ...CARD_FULL, cost: undefined }
    expect(resolveFieldText('cost', noCost)).toBe('[cost]')
  })

  it('converts literal \\n sequences in text to real newlines', () => {
    const card: CardData = { ...CARD_FULL, effect: 'Line one.\\nLine two.' }
    expect(resolveFieldText('effect', card)).toBe('Line one.\nLine two.')
  })
})

describe('resolveRectFill', () => {
  const baseRect: RectLayer = {
    id: 'r1', type: 'rect', x: 0, y: 0, width: 100, height: 100,
  }

  it('returns fill when no fillSource is set', () => {
    expect(resolveRectFill({ ...baseRect, fill: '#ff0000' }, CLASS_COLORS, null).fill).toBe('#ff0000')
  })

  it('returns fallback grey when fill and fillSource are both absent', () => {
    expect(resolveRectFill(baseRect, CLASS_COLORS, null).fill).toBe('#555555')
  })

  it('returns primary color when fillSource is "class.primary"', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      CARD,
    )
    expect(result.fill).toBe('#2980b9')
  })

  it('returns secondary color when fillSource is "class.secondary"', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.secondary' },
      CLASS_COLORS,
      CARD,
    )
    expect(result.fill).toBe('#1a5276')
  })

  it('falls back to grey when fillSource is set but class not found in classColors', () => {
    const cardUnknownClass = { ...CARD, class: 'Unknown' }
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      cardUnknownClass,
    )
    expect(result.fill).toBe('#555555')
  })

  it('falls back to grey when fillSource is set but no preview card', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      null,
    )
    expect(result.fill).toBe('#555555')
  })

  it('returns gradient attributes when fillSource is "class.gradient"', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.gradient' },
      CLASS_COLORS,
      CARD,
    )
    expect(result).toHaveProperty('fillLinearGradientColorStops', [0, '#2980b9', 1, '#1a5276'])
    // default angle 0° → left-to-right along the horizontal centre line
    expect(result).toHaveProperty('fillLinearGradientStartPoint', { x: 0, y: 50 })
    expect(result).toHaveProperty('fillLinearGradientEndPoint', { x: 100, y: 50 })
  })

  it('gradient angle 90° produces a top-to-bottom gradient', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.gradient', gradientAngle: 90 },
      CLASS_COLORS,
      CARD,
    )
    expect(result.fillLinearGradientStartPoint).toEqual({ x: 50, y: 0 })
    expect(result.fillLinearGradientEndPoint).toEqual({ x: 50, y: 100 })
  })

  it('uses gradientStartColor when set, keeps class.secondary as end', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.gradient', gradientStartColor: '#ff0000' },
      CLASS_COLORS,
      CARD,
    )
    expect(result.fillLinearGradientColorStops).toEqual([0, '#ff0000', 1, '#1a5276'])
  })

  it('uses gradientEndColor when set, keeps class.primary as start', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.gradient', gradientEndColor: '#00ff00' },
      CLASS_COLORS,
      CARD,
    )
    expect(result.fillLinearGradientColorStops).toEqual([0, '#2980b9', 1, '#00ff00'])
  })

  it('renders gradient without preview card when both custom colors are set', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.gradient', gradientStartColor: '#ff0000', gradientEndColor: '#0000ff' },
      CLASS_COLORS,
      null,
    )
    expect(result.fillLinearGradientColorStops).toEqual([0, '#ff0000', 1, '#0000ff'])
  })
})

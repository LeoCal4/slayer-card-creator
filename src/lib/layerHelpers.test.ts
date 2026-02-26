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
    expect(resolveRectFill({ ...baseRect, fill: '#ff0000' }, CLASS_COLORS, null)).toBe('#ff0000')
  })

  it('returns fallback grey when fill and fillSource are both absent', () => {
    expect(resolveRectFill(baseRect, CLASS_COLORS, null)).toBe('#555555')
  })

  it('returns primary color when fillSource is "class.primary"', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      CARD,
    )
    expect(result).toBe('#2980b9')
  })

  it('returns secondary color when fillSource is "class.secondary"', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.secondary' },
      CLASS_COLORS,
      CARD,
    )
    expect(result).toBe('#1a5276')
  })

  it('falls back to grey when fillSource is set but class not found in classColors', () => {
    const cardUnknownClass = { ...CARD, class: 'Unknown' }
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      cardUnknownClass,
    )
    expect(result).toBe('#555555')
  })

  it('falls back to grey when fillSource is set but no preview card', () => {
    const result = resolveRectFill(
      { ...baseRect, fillSource: 'class.primary' },
      CLASS_COLORS,
      null,
    )
    expect(result).toBe('#555555')
  })
})

import { describe, it } from 'vitest'
import type { CardData, CardType, Rarity } from './card'

describe('CardType', () => {
  it('is a string alias (card types are project-defined)', () => {
    void ('Slayer' satisfies CardType)
    void ('CustomType' satisfies CardType)
  })
})

describe('Rarity', () => {
  it('includes the three rarity levels', () => {
    void (['common', 'rare', 'epic'] satisfies Rarity[])
  })
})

describe('CardData', () => {
  it('requires id, name, class, type, rarity, effect; all stats optional', () => {
    void ({
      id: 'abc-123',
      name: 'Flame Serpent',
      class: 'Cleric',
      type: 'Slayer',
      rarity: 'common',
      effect: 'Haste.',
    } satisfies CardData)

    void ({
      id: 'abc-124',
      name: 'Shadow Stalker',
      class: 'Rogue',
      type: 'Errant',
      rarity: 'epic',
      effect: 'Stealth.',
      cost: 2,
      power: 2,
      hp: 1,
      vp: 3,
    } satisfies CardData)
  })

  it('accepts multi-class comma-separated string', () => {
    void ({
      id: 'abc-125',
      name: 'Iron Paladin',
      class: 'Cleric,Warrior',
      type: 'Slayer',
      rarity: 'rare',
      effect: 'Shield.',
    } satisfies CardData)
  })
})

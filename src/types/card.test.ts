import { describe, it } from 'vitest'
import type { CardData, CardType, Rarity } from './card'

describe('CardType', () => {
  it('includes all 9 game types', () => {
    void (['Slayer', 'Errant', 'Action', 'Ploy',
      'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase'] satisfies CardType[])
  })
})

describe('Rarity', () => {
  it('includes the four rarity levels', () => {
    void (['common', 'uncommon', 'rare', 'mythic'] satisfies Rarity[])
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
      rarity: 'uncommon',
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

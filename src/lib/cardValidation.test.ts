import { describe, it, expect } from 'vitest'
import { getMissingFields, getCardsWithNoTemplate } from './cardValidation'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'

const fullSlayer: CardData = {
  id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
  rarity: 'common', cost: 3, power: 4, hp: 5, effect: 'Strike.',
}
const fullErrant: CardData = {
  id: 'c2', name: 'Runner', class: 'Rogue', type: 'Errant',
  rarity: 'common', cost: 2, power: 2, hp: 3, vp: 1, effect: 'Evade.',
}
const fullAction: CardData = {
  id: 'c3', name: 'Fireball', class: 'Mage', type: 'Action',
  rarity: 'rare', cost: 3, effect: 'Deal 3 damage.',
}
const fullDungeon: CardData = {
  id: 'c4', name: 'Dark Keep', class: '', type: 'Dungeon', rarity: 'common', effect: 'Lurk.',
}

describe('getMissingFields', () => {
  it('returns empty array for a fully valid Slayer card', () => {
    expect(getMissingFields(fullSlayer)).toEqual([])
  })

  it('returns empty array for a fully valid Errant card', () => {
    expect(getMissingFields(fullErrant)).toEqual([])
  })

  it('returns empty array for a valid Action card', () => {
    expect(getMissingFields(fullAction)).toEqual([])
  })

  it('returns empty array for a valid Dungeon card (no class/cost required)', () => {
    expect(getMissingFields(fullDungeon)).toEqual([])
  })

  it('flags missing name', () => {
    const card = { ...fullSlayer, name: '' }
    expect(getMissingFields(card)).toContain('name')
  })

  it('flags missing power for Slayer', () => {
    const card = { ...fullSlayer, power: undefined }
    expect(getMissingFields(card)).toContain('power')
  })

  it('flags missing hp for Errant', () => {
    const card = { ...fullErrant, hp: undefined }
    expect(getMissingFields(card)).toContain('hp')
  })

  it('flags missing vp for Errant', () => {
    const card = { ...fullErrant, vp: undefined }
    expect(getMissingFields(card)).toContain('vp')
  })

  it('does not flag missing vp for Slayer', () => {
    const card = { ...fullSlayer, vp: undefined }
    expect(getMissingFields(card)).not.toContain('vp')
  })

  it('does not flag missing power/hp/cost for Dungeon', () => {
    const fields = getMissingFields(fullDungeon)
    expect(fields).not.toContain('power')
    expect(fields).not.toContain('hp')
    expect(fields).not.toContain('cost')
  })

  it('flags missing effect for Action', () => {
    const card = { ...fullAction, effect: '' }
    expect(getMissingFields(card)).toContain('effect')
  })

  it('flags missing cost for Action', () => {
    const card = { ...fullAction, cost: undefined }
    expect(getMissingFields(card)).toContain('cost')
  })
})

describe('getCardsWithNoTemplate', () => {
  const templates: Template[] = [
    { id: 't1', name: 'Creature', cardTypes: ['Slayer', 'Errant'], canvas: { width: 375, height: 523 }, layers: [] },
  ]

  it('returns empty array when all cards have a matching template', () => {
    const cards: CardData[] = [fullSlayer, fullErrant]
    expect(getCardsWithNoTemplate(cards, templates)).toHaveLength(0)
  })

  it('returns cards whose type has no matching template', () => {
    const cards: CardData[] = [fullSlayer, fullAction]
    const result = getCardsWithNoTemplate(cards, templates)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('Fireball')
  })

  it('returns empty array when both cards and templates are empty', () => {
    expect(getCardsWithNoTemplate([], [])).toHaveLength(0)
  })
})

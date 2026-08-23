import { describe, it, expect } from 'vitest'
import { getMissingFields, getCardsWithNoTemplate, getRetroIssues } from './cardValidation'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'

const fullSlayer: CardData = {
  id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer',
  rarity: 'common', effect: 'Strike.', extras: { cost: 3, power: 4, hp: 5, speed: 2 },
}
const fullErrant: CardData = {
  id: 'c2', name: 'Runner', class: 'Rogue', type: 'Errant',
  rarity: 'common', effect: 'Evade.', extras: { cost: 2, power: 2, hp: 3, vp: 1, speed: 3 },
}
const fullAction: CardData = {
  id: 'c3', name: 'Fireball', class: 'Mage', type: 'Action',
  rarity: 'rare', effect: 'Deal 3 damage.', extras: { cost: 3, speed: 1 },
}
const fullDungeon: CardData = {
  id: 'c4', name: 'Dark Keep', class: '', type: 'Dungeon', rarity: 'common', effect: 'Lurk.', extras: {},
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
    const card = { ...fullSlayer, extras: { ...fullSlayer.extras, power: undefined as unknown as number } }
    expect(getMissingFields(card)).toContain('power')
  })

  it('flags missing hp for Errant', () => {
    const card = { ...fullErrant, extras: { ...fullErrant.extras, hp: undefined as unknown as number } }
    expect(getMissingFields(card)).toContain('hp')
  })

  it('flags missing vp for Errant', () => {
    const card = { ...fullErrant, extras: { ...fullErrant.extras, vp: undefined as unknown as number } }
    expect(getMissingFields(card)).toContain('vp')
  })

  it('does not flag missing vp for Slayer', () => {
    const card = { ...fullSlayer, extras: { ...fullSlayer.extras, vp: undefined as unknown as number } }
    expect(getMissingFields(card)).not.toContain('vp')
  })

  it('does not flag missing power/hp/cost for Dungeon', () => {
    const fields = getMissingFields(fullDungeon)
    expect(fields).not.toContain('power')
    expect(fields).not.toContain('hp')
    expect(fields).not.toContain('cost')
  })

  it('flags missing speed for Slayer', () => {
    const card = { ...fullSlayer, extras: { ...fullSlayer.extras, speed: undefined as unknown as number } }
    expect(getMissingFields(card)).toContain('speed')
  })

  it('does not flag missing speed for Dungeon', () => {
    const fields = getMissingFields(fullDungeon)
    expect(fields).not.toContain('speed')
  })

  it('flags missing effect for Action', () => {
    const card = { ...fullAction, effect: '' }
    expect(getMissingFields(card)).toContain('effect')
  })

  it('flags missing cost for Action', () => {
    const card = { ...fullAction, extras: { ...fullAction.extras, cost: undefined as unknown as number } }
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

describe('getRetroIssues', () => {
  const front = (name: string, retro: string): CardData => ({
    id: name, name, class: 'Warrior', type: 'Errant', rarity: 'rare',
    effect: '', extras: { retro },
  })
  const plain = (name: string): CardData => ({
    id: name, name, class: 'Warrior', type: 'Errant', rarity: 'rare', effect: '', extras: {},
  })

  it('returns no issues for a valid front/back pair', () => {
    expect(getRetroIssues([front('Werewolf', 'Full Moon Beast'), plain('Full Moon Beast')])).toEqual([])
  })

  it('returns no issues for cards without any Retro links', () => {
    expect(getRetroIssues([plain('Axehand'), plain('Fireball')])).toEqual([])
  })

  it('flags a Retro pointing at a non-existent card', () => {
    const issues = getRetroIssues([front('Werewolf', 'Ghost Wolf')])
    expect(issues).toHaveLength(1)
    expect(issues[0]).toContain('Werewolf')
    expect(issues[0]).toContain('Ghost Wolf')
  })

  it('flags a card naming itself as its back face', () => {
    const issues = getRetroIssues([front('Werewolf', 'Werewolf')])
    expect(issues).toEqual(['"Werewolf" lists itself as its own back face (Retro)'])
  })

  it('flags a back face referenced by multiple fronts', () => {
    const issues = getRetroIssues([
      front('Werewolf', 'Beast'),
      front('Wolfman', 'Beast'),
      plain('Beast'),
    ])
    expect(issues.some((i) => i.includes('multiple cards') && i.includes('Werewolf') && i.includes('Wolfman'))).toBe(true)
  })

  it('flags a back face that also carries its own Retro', () => {
    const issues = getRetroIssues([
      front('Werewolf', 'Beast'),
      front('Beast', 'Something Else'),
      plain('Something Else'),
    ])
    expect(issues.some((i) => i.includes('"Beast" is used as a back face but also has its own Retro'))).toBe(true)
  })
})

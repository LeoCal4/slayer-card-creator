import { describe, it, expect } from 'vitest'
import { parseCSV, mergeByName, normalizeClass } from './csvParser'
import type { CardData } from '@/types/card'

const VALID_CSV = `name,class,type,rarity,effect
Fireball,Mage,Action,common,Deal 3 damage.
Heal Wave,Cleric,Ploy,rare,Restore 2 HP.`

const NUMERIC_CSV = `name,class,type,rarity,cost,power,hp,vp,speed,effect
Swordsman,Warrior,Slayer,common,3💰,5⚔️,8❤️,,2,Attack.`

describe('parseCSV', () => {
  it('parses a valid CSV into CardData', () => {
    const { cards, errors } = parseCSV(VALID_CSV)
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(2)
    expect(cards[0].name).toBe('Fireball')
    expect(cards[0].type).toBe('Action')
    expect(cards[1].name).toBe('Heal Wave')
  })

  it('assigns a unique id to each card', () => {
    const { cards } = parseCSV(VALID_CSV)
    expect(cards[0].id).toBeTruthy()
    expect(cards[0].id).not.toBe(cards[1].id)
  })

  it('trims whitespace from string fields', () => {
    const csv = 'name,class,type,rarity,effect\n  Fireball  , Mage ,Action,common,  Burn.  '
    const { cards } = parseCSV(csv)
    expect(cards[0].name).toBe('Fireball')
    expect(cards[0].class).toBe('Mage')
    expect(cards[0].effect).toBe('Burn.')
  })

  it('sanitizes numeric fields — strips emoji and non-numeric chars', () => {
    const { cards, errors } = parseCSV(NUMERIC_CSV)
    expect(errors).toHaveLength(0)
    expect(cards[0].cost).toBe(3)
    expect(cards[0].power).toBe(5)
    expect(cards[0].hp).toBe(8)
    expect(cards[0].vp).toBeUndefined()
    expect(cards[0].speed).toBe(2)
  })

  it('parses speed column as a number', () => {
    const csv = 'name,class,type,rarity,speed,effect\nRunner,Rogue,Slayer,common,3,Dash.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards[0].speed).toBe(3)
  })

  it('returns undefined for empty speed field', () => {
    const csv = 'name,class,type,rarity,speed,effect\nFoo,Mage,Action,common,,Draw.'
    const { cards } = parseCSV(csv)
    expect(cards[0].speed).toBeUndefined()
  })

  it('returns undefined for empty numeric fields', () => {
    const csv = 'name,class,type,rarity,cost,effect\nFoo,Mage,Action,common,,Draw.'
    const { cards } = parseCSV(csv)
    expect(cards[0].cost).toBeUndefined()
  })

  it('returns an error (and no cards) when required columns are missing', () => {
    const csv = 'name,class,rarity,effect\nFoo,Mage,common,Bar.'
    const { cards, errors } = parseCSV(csv)
    expect(cards).toHaveLength(0)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toMatch(/type/)
  })

  it('reports an error row for invalid card type when validTypes is provided', () => {
    const csv = 'name,class,type,rarity,effect\nFoo,Mage,InvalidType,common,Bar.'
    const validTypes = ['Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase', 'Status']
    const { errors } = parseCSV(csv, { validTypes })
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toMatch(/type/)
  })

  it('accepts any type when validTypes is not provided', () => {
    const csv = 'name,class,type,rarity,effect\nFoo,Mage,AnyCustomType,common,Bar.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
  })

  it('reports an error row for invalid rarity', () => {
    const csv = 'name,class,type,rarity,effect\nFoo,Mage,Action,legendary,Bar.'
    const { errors } = parseCSV(csv)
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toMatch(/rarity/)
  })

  it('defaults empty rarity to "common" without an error', () => {
    const csv = 'name,class,type,rarity,effect\nShadow Pact,,Dungeon,,Sacrifice a unit.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].rarity).toBe('common')
  })

  it('accepts capitalized header names (case-insensitive headers)', () => {
    const csv = 'Name,Type,Rarity,Cost,Effect\nAxehand,Slayer,Common,3,Strike.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].name).toBe('Axehand')
    expect(cards[0].rarity).toBe('common')
  })

  it('emits a warning but still imports rows with unknown types when validTypes is provided', () => {
    const csv = `name,class,type,rarity,effect
Good,Mage,Action,common,Draw.
Bad,Mage,INVALID,common,Nope.`
    const validTypes = ['Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase', 'Status']
    const { cards, errors } = parseCSV(csv, { validTypes })
    expect(cards).toHaveLength(2)
    expect(cards[1].name).toBe('Bad')
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0]).toMatch(/INVALID/)
  })

  it('accepts Status as a valid card type', () => {
    const csv = 'name,class,type,rarity,effect\nCursed Ground,,Status,common,Ongoing effect.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].type).toBe('Status')
  })

  it('normalises Italian rarity aliases to canonical values', () => {
    const csv = `name,class,type,rarity,effect
A,,Status,comune,Effect.
B,,Status,rara,Effect.
C,,Status,epica,Effect.`
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards[0].rarity).toBe('common')
    expect(cards[1].rarity).toBe('rare')
    expect(cards[2].rarity).toBe('epic')
  })

  it('treats a cell with exactly "||" as empty string', () => {
    const csv = 'name,class,type,rarity,effect\nFoo,||,Action,common,Draw.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards[0].class).toBe('')
  })

  it('does not treat "||" as empty when embedded in a longer value', () => {
    const csv = 'name,class,type,rarity,effect\nFoo,Mage||Rogue,Action,common,Draw.'
    const { cards } = parseCSV(csv)
    expect(cards[0].class).toBe('Mage||Rogue')
  })

  it('parses tab-delimited CSV when delimiter option is set to tab', () => {
    const tsv = 'name\tclass\ttype\trarity\teffect\nFireball\tMage\tAction\tcommon\tDraw.'
    const { cards, errors } = parseCSV(tsv, { delimiter: '\t' })
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].name).toBe('Fireball')
  })
})

describe('normalizeClass', () => {
  it('returns single class unchanged', () => {
    expect(normalizeClass('Mage')).toBe('Mage')
  })

  it('normalizes "Class1 - Class2" dash format to comma-separated', () => {
    expect(normalizeClass('Mage - Warrior')).toBe('Mage,Warrior')
  })

  it('normalizes "Class1, Class2" comma-space format to comma-separated', () => {
    expect(normalizeClass('Mage, Warrior')).toBe('Mage,Warrior')
  })

  it('trims surrounding whitespace', () => {
    expect(normalizeClass('  Mage  ')).toBe('Mage')
  })

  it('returns already comma-separated class unchanged', () => {
    expect(normalizeClass('Mage,Warrior')).toBe('Mage,Warrior')
  })

  it('returns empty string unchanged', () => {
    expect(normalizeClass('')).toBe('')
  })
})

describe('parseCSV dual-class', () => {
  it('parses "Class1 - Class2" dash format into comma-separated class', () => {
    const csv = 'name,class,type,rarity,effect\nDual Hero,Mage - Warrior,Action,common,Effect.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards[0].class).toBe('Mage,Warrior')
  })

  it('parses "Class1, Class2" comma-space format (quoted) into comma-separated class', () => {
    const csv = 'name,class,type,rarity,effect\nDual Hero,"Mage, Warrior",Action,common,Effect.'
    const { cards, errors } = parseCSV(csv)
    expect(errors).toHaveLength(0)
    expect(cards[0].class).toBe('Mage,Warrior')
  })
})

describe('parseCSV with csvColumns option', () => {
  const TEXT_COLS = [
    { id: 'c1', name: 'name',   type: 'text' as const },
    { id: 'c2', name: 'type',   type: 'text' as const },
    { id: 'c3', name: 'effect', type: 'text' as const },
  ]

  it('parses number columns using sanitizeNumber (strips emoji)', () => {
    const cols = [
      ...TEXT_COLS,
      { id: 'c4', name: 'cost', type: 'number' as const },
    ]
    const csv = 'name,type,effect,cost\nFireball,Action,Burn.,3💰'
    const { cards, errors } = parseCSV(csv, { csvColumns: cols })
    expect(errors).toHaveLength(0)
    expect(cards[0].cost).toBe(3)
  })

  it('stores text-column values as strings', () => {
    const csv = 'name,type,effect\nFireball,Action,Burn something.'
    const { cards } = parseCSV(csv, { csvColumns: TEXT_COLS })
    expect(cards[0].name).toBe('Fireball')
    expect(cards[0].effect).toBe('Burn something.')
  })

  it('does NOT skip rows with an unrecognised type when csvColumns is provided', () => {
    const csv = 'name,type,effect\nFoo,UNKNOWN_TYPE,Draw.'
    const { cards, errors } = parseCSV(csv, { csvColumns: TEXT_COLS })
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
    expect(cards[0].type).toBe('UNKNOWN_TYPE')
  })

  it('does NOT skip rows with an unrecognised rarity when csvColumns is provided', () => {
    const cols = [
      ...TEXT_COLS,
      { id: 'c4', name: 'rarity', type: 'text' as const },
    ]
    const csv = 'name,type,effect,rarity\nFoo,Action,Draw.,legendary'
    const { cards, errors } = parseCSV(csv, { csvColumns: cols })
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
  })

  it('returns error and empty cards when "name" column is absent', () => {
    const cols = [
      { id: 'c1', name: 'type',   type: 'text' as const },
      { id: 'c2', name: 'effect', type: 'text' as const },
    ]
    const csv = 'type,effect\nAction,Draw.'
    const { cards, errors } = parseCSV(csv, { csvColumns: cols })
    expect(errors.length).toBeGreaterThan(0)
    expect(cards).toHaveLength(0)
  })

  it('stores "select" column values as strings (no validation/skipping)', () => {
    const cols = [
      ...TEXT_COLS,
      { id: 'c4', name: 'rarity', type: 'select' as const, choices: ['common', 'rare', 'epic'] },
    ]
    const csv = 'name,type,effect,rarity\nFoo,Action,Draw.,legendary'
    const { cards, errors } = parseCSV(csv, { csvColumns: cols })
    expect(errors).toHaveLength(0)
    expect(cards).toHaveLength(1)
  })

  it('applies rarity aliases when csvColumns is provided', () => {
    const cols = [
      ...TEXT_COLS,
      { id: 'c4', name: 'rarity', type: 'text' as const },
    ]
    const csv = 'name,type,effect,rarity\nFoo,Action,Draw.,comune'
    const { cards } = parseCSV(csv, { csvColumns: cols })
    expect(cards[0].rarity).toBe('common')
  })

  it('normalises multi-class values when csvColumns is provided', () => {
    const cols = [
      ...TEXT_COLS,
      { id: 'c4', name: 'class', type: 'text' as const },
    ]
    const csv = 'name,type,effect,class\nHero,Action,Draw.,Mage - Warrior'
    const { cards } = parseCSV(csv, { csvColumns: cols })
    expect(cards[0].class).toBe('Mage,Warrior')
  })

  it('assigns unique ids to each card', () => {
    const csv = 'name,type,effect\nA,Action,x.\nB,Ploy,y.'
    const { cards } = parseCSV(csv, { csvColumns: TEXT_COLS })
    expect(cards[0].id).not.toBe(cards[1].id)
  })
})

describe('mergeByName', () => {
  const base: CardData = {
    id: 'orig-1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Old.',
  }

  it('keeps existing card with updated fields when names match', () => {
    const incoming: CardData = { ...base, id: 'new-1', effect: 'New.' }
    const result = mergeByName([base], [incoming])
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('orig-1')
    expect(result[0].effect).toBe('New.')
  })

  it('appends new cards that do not match any existing name', () => {
    const incoming: CardData = {
      id: 'new-2', name: 'Iceball', class: 'Mage', type: 'Action', rarity: 'rare', effect: 'Freeze.',
    }
    const result = mergeByName([base], [incoming])
    expect(result).toHaveLength(2)
    expect(result[1].name).toBe('Iceball')
  })

  it('handles empty existing array', () => {
    const incoming: CardData = { ...base, id: 'new-1' }
    const result = mergeByName([], [incoming])
    expect(result).toHaveLength(1)
  })
})

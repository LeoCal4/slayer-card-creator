import Papa from 'papaparse'
import type { CardData, CardType, Rarity } from '@/types/card'

const CARD_TYPES = new Set<string>([
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase',
])
const RARITIES = new Set<string>(['common', 'uncommon', 'rare', 'mythic'])
const REQUIRED_COLUMNS = ['name', 'type', 'effect'] as const

export interface ParseResult {
  cards: CardData[]
  errors: string[]
}

function sanitizeNumber(val: string | undefined): number | undefined {
  if (!val) return undefined
  const stripped = val.replace(/[^0-9.]/g, '')
  if (!stripped) return undefined
  const n = parseInt(stripped, 10)
  return isNaN(n) ? undefined : n
}

export function mergeByName(existing: CardData[], incoming: CardData[]): CardData[] {
  const result = [...existing]
  for (const card of incoming) {
    const idx = result.findIndex((c) => c.name === card.name)
    if (idx !== -1) {
      result[idx] = { ...result[idx], ...card, id: result[idx].id }
    } else {
      result.push(card)
    }
  }
  return result
}

export function parseCSV(raw: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
  })

  const errors: string[] = []
  const cards: CardData[] = []

  const headers = parsed.meta.fields ?? []
  const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
  if (missingCols.length > 0) {
    errors.push(`Missing required columns: ${missingCols.join(', ')}`)
    return { cards, errors }
  }

  parsed.data.forEach((row, i) => {
    const rowNum = i + 2
    const rowErrors: string[] = []

    const typeRaw = (row['type'] ?? '').trim()
    const rarityRaw = (row['rarity'] ?? '').trim().toLowerCase() || 'common'

    if (!CARD_TYPES.has(typeRaw)) {
      rowErrors.push(`Row ${rowNum}: invalid type "${typeRaw}"`)
    }
    if (!RARITIES.has(rarityRaw)) {
      rowErrors.push(`Row ${rowNum}: invalid rarity "${rarityRaw}"`)
    }

    errors.push(...rowErrors)
    if (rowErrors.length > 0) return

    cards.push({
      id: crypto.randomUUID(),
      name: (row['name'] ?? '').trim(),
      class: (row['class'] ?? '').trim(),
      type: typeRaw as CardType,
      rarity: rarityRaw as Rarity,
      cost: sanitizeNumber(row['cost']),
      power: sanitizeNumber(row['power']),
      hp: sanitizeNumber(row['hp']),
      vp: sanitizeNumber(row['vp']),
      effect: (row['effect'] ?? '').trim(),
    })
  })

  return { cards, errors }
}

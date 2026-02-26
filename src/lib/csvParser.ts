import Papa from 'papaparse'
import type { CardData, CardType, Rarity } from '@/types/card'

const CARD_TYPES = new Set<string>([
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase', 'Status',
])
const RARITY_ALIASES: Record<string, string> = {
  comune: 'common',
  rara: 'rare',
  epica: 'epic',
}
const RARITIES = new Set<string>(['common', 'rare', 'epic', ...Object.keys(RARITY_ALIASES)])
const REQUIRED_COLUMNS = ['name', 'type', 'effect'] as const

export interface ParseResult {
  cards: CardData[]
  errors: string[]
}

export interface ParseOptions {
  delimiter?: string
}

function cleanValue(val: string | undefined): string {
  const s = (val ?? '').trim()
  return s === '||' ? '' : s
}

function sanitizeNumber(val: string | undefined): number | undefined {
  const s = cleanValue(val)
  if (!s) return undefined
  const stripped = s.replace(/[^0-9.]/g, '')
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

export function parseCSV(raw: string, options: ParseOptions = {}): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
    ...(options.delimiter ? { delimiter: options.delimiter } : {}),
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

    const typeRaw = cleanValue(row['type'])
    const rarityInput = cleanValue(row['rarity']).toLowerCase() || 'common'
    const rarityRaw = (RARITY_ALIASES[rarityInput] ?? rarityInput) as Rarity

    if (!CARD_TYPES.has(typeRaw)) {
      rowErrors.push(`Row ${rowNum}: invalid type "${typeRaw}"`)
    }
    if (!RARITIES.has(rarityInput)) {
      rowErrors.push(`Row ${rowNum}: invalid rarity "${rarityInput}"`)
    }

    errors.push(...rowErrors)
    if (rowErrors.length > 0) return

    cards.push({
      id: crypto.randomUUID(),
      name: cleanValue(row['name']),
      class: cleanValue(row['class']),
      type: typeRaw as CardType,
      rarity: rarityRaw,
      cost: sanitizeNumber(row['cost']),
      power: sanitizeNumber(row['power']),
      hp: sanitizeNumber(row['hp']),
      vp: sanitizeNumber(row['vp']),
      effect: cleanValue(row['effect']),
    })
  })

  return { cards, errors }
}

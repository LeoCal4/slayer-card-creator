import Papa from 'papaparse'
import type { CardData, CardType, Rarity } from '@/types/card'
import type { CsvColumnDef } from '@/types/project'
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
  validTypes?: string[]
  csvColumns?: CsvColumnDef[]
}

function cleanValue(val: string | undefined): string {
  const s = (val ?? '').trim()
  return s === '||' ? '' : s
}

export function normalizeClass(raw: string): string {
  const trimmed = raw.trim()
  const parts = trimmed.split(/ - |, /).map((s) => s.trim()).filter(Boolean)
  if (parts.length <= 1) return trimmed
  return parts.join(',')
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
  const { validTypes, delimiter, csvColumns } = options
  const validTypesSet = validTypes ? new Set(validTypes) : null

  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
    ...(delimiter ? { delimiter } : {}),
  })

  const errors: string[] = []
  const cards: CardData[] = []
  const headers = parsed.meta.fields ?? []

  // ── Modular path: csvColumns provided ──────────────────────────────────────
  if (csvColumns) {
    if (!headers.includes('name')) {
      errors.push('Missing required column: name')
      return { cards, errors }
    }

    const colMap = new Map(csvColumns.map((c) => [c.name.toLowerCase(), c]))

    parsed.data.forEach((row, i) => {
      const rowNum = i + 2
      const typeRaw = cleanValue(row['type'])

      // If validTypes is provided, warn about unknown types but still import the row
      if (validTypesSet && !validTypesSet.has(typeRaw)) {
        errors.push(`Row ${rowNum}: unknown type "${typeRaw}" — imported with warning`)
      }

      function getNum(key: string): number | undefined {
        const colDef = colMap.get(key)
        return colDef?.type === 'number' ? sanitizeNumber(row[key]) : sanitizeNumber(row[key])
      }

      const rarityInput = cleanValue(row['rarity']).toLowerCase() || 'common'
      const rarity = ((RARITY_ALIASES[rarityInput] ?? rarityInput) || 'common') as Rarity

      cards.push({
        id: crypto.randomUUID(),
        name: cleanValue(row['name']),
        class: normalizeClass(cleanValue(row['class'])),
        type: typeRaw as CardType,
        rarity,
        cost: getNum('cost'),
        power: getNum('power'),
        hp: getNum('hp'),
        vp: getNum('vp'),
        speed: getNum('speed'),
        effect: cleanValue(row['effect']),
      })
    })

    return { cards, errors }
  }

  // ── Legacy path: hardcoded column handling ─────────────────────────────────
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

    // Unknown type is a warning — row still imported
    if (validTypesSet && !validTypesSet.has(typeRaw)) {
      errors.push(`Row ${rowNum}: unknown type "${typeRaw}" — imported with warning`)
    }
    if (!RARITIES.has(rarityInput)) {
      rowErrors.push(`Row ${rowNum}: invalid rarity "${rarityInput}"`)
    }

    errors.push(...rowErrors)
    if (rowErrors.length > 0) return

    cards.push({
      id: crypto.randomUUID(),
      name: cleanValue(row['name']),
      class: normalizeClass(cleanValue(row['class'])),
      type: typeRaw as CardType,
      rarity: rarityRaw,
      cost: sanitizeNumber(row['cost']),
      power: sanitizeNumber(row['power']),
      hp: sanitizeNumber(row['hp']),
      vp: sanitizeNumber(row['vp']),
      speed: sanitizeNumber(row['speed']),
      effect: cleanValue(row['effect']),
    })
  })

  return { cards, errors }
}

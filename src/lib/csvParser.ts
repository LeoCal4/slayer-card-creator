import Papa from 'papaparse'
import type { CardData, CardType, Rarity } from '@/types/card'
import { isCoreField } from '@/types/card'
import type { CardTypeColumnMap, CsvColumnDef } from '@/types/project'

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
  csvColumnRequirements?: CardTypeColumnMap
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
      const prev = result[idx]
      result[idx] = {
        ...prev,
        ...card,
        id: prev.id,
        extras: { ...prev.extras, ...card.extras },
      }
    } else {
      result.push(card)
    }
  }
  return result
}

function parseRarity(raw: string): Rarity {
  const rarityInput = raw.toLowerCase() || 'common'
  return ((RARITY_ALIASES[rarityInput] ?? rarityInput) || 'common') as Rarity
}

function checkColumnRequirements(
  row: Record<string, string>,
  rowNum: number,
  typeRaw: string,
  requirements: CardTypeColumnMap,
  errors: string[],
) {
  const requiredCols = requirements[typeRaw] ?? []
  for (const col of requiredCols) {
    if (!cleanValue(row[col.toLowerCase()])) {
      errors.push(`Row ${rowNum}: ${typeRaw} card is missing value for required column "${col}"`)
    }
  }
}

export function parseCSV(raw: string, options: ParseOptions = {}): ParseResult {
  const { validTypes, delimiter, csvColumns, csvColumnRequirements } = options
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

    parsed.data.forEach((row, i) => {
      const rowNum = i + 2
      const typeRaw = cleanValue(row['type'])

      if (validTypesSet && !validTypesSet.has(typeRaw)) {
        errors.push(`Row ${rowNum}: unknown type "${typeRaw}" — imported with warning`)
      }

      if (csvColumnRequirements) {
        checkColumnRequirements(row, rowNum, typeRaw, csvColumnRequirements, errors)
      }

      const extras: Record<string, string | number> = {}
      for (const col of csvColumns) {
        const key = col.name.toLowerCase()
        if (isCoreField(key)) continue
        const cellVal = row[key]
        if (col.type === 'number') {
          const n = sanitizeNumber(cellVal)
          if (n !== undefined) extras[key] = n
        } else {
          const s = cleanValue(cellVal)
          if (s) extras[key] = s
        }
      }

      cards.push({
        id: crypto.randomUUID(),
        name: cleanValue(row['name']),
        class: normalizeClass(cleanValue(row['class'])),
        type: typeRaw as CardType,
        rarity: parseRarity(cleanValue(row['rarity'])),
        effect: cleanValue(row['effect']),
        extras,
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

    if (validTypesSet && !validTypesSet.has(typeRaw)) {
      errors.push(`Row ${rowNum}: unknown type "${typeRaw}" — imported with warning`)
    }
    if (csvColumnRequirements) {
      checkColumnRequirements(row, rowNum, typeRaw, csvColumnRequirements, errors)
    }
    if (!RARITIES.has(rarityInput)) {
      rowErrors.push(`Row ${rowNum}: invalid rarity "${rarityInput}"`)
    }

    errors.push(...rowErrors)
    if (rowErrors.length > 0) return

    const extras: Record<string, string | number> = {}
    const cost = sanitizeNumber(row['cost']); if (cost !== undefined) extras['cost'] = cost
    const power = sanitizeNumber(row['power']); if (power !== undefined) extras['power'] = power
    const hp = sanitizeNumber(row['hp']); if (hp !== undefined) extras['hp'] = hp
    const vp = sanitizeNumber(row['vp']); if (vp !== undefined) extras['vp'] = vp
    const speed = sanitizeNumber(row['speed']); if (speed !== undefined) extras['speed'] = speed

    cards.push({
      id: crypto.randomUUID(),
      name: cleanValue(row['name']),
      class: normalizeClass(cleanValue(row['class'])),
      type: typeRaw as CardType,
      rarity: parseRarity(cleanValue(row['rarity'])),
      effect: cleanValue(row['effect']),
      extras,
    })
  })

  return { cards, errors }
}

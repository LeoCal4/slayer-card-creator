import type { CardData, CardType } from '@/types/card'
import { isCoreField, RETRO_FIELD } from '@/types/card'
import type { Template } from '@/types/template'

export const REQUIRED_FIELDS: Record<CardType, string[]> = {
  Slayer:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'speed', 'effect'],
  Errant:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'vp', 'speed', 'effect'],
  Action:       ['name', 'class', 'type', 'rarity', 'cost', 'speed', 'effect'],
  Ploy:         ['name', 'class', 'type', 'rarity', 'cost', 'speed', 'effect'],
  Intervention: ['name', 'class', 'type', 'rarity', 'cost', 'speed', 'effect'],
  Chamber:      ['name', 'class', 'type', 'rarity', 'cost', 'speed', 'effect'],
  Relic:        ['name', 'class', 'type', 'rarity', 'cost', 'speed', 'effect'],
  Dungeon:      ['name', 'type', 'effect'],
  Phase:        ['name', 'type', 'effect'],
  Status:       ['name', 'type', 'effect'],
}

export function getMissingFields(card: CardData): string[] {
  const required = REQUIRED_FIELDS[card.type] ?? []
  return required.filter((field) => {
    const val = isCoreField(field) ? card[field] : card.extras?.[field]
    return val === undefined || val === null || val === ''
  })
}

export function getCardsWithNoTemplate(cards: CardData[], templates: Template[]): CardData[] {
  return cards.filter(
    (card) => !templates.some((t) => t.cardTypes.includes(card.type)),
  )
}

function retroValue(card: CardData): string {
  return String(card.extras?.[RETRO_FIELD] ?? '').trim()
}

/**
 * Validates double-faced card links: each front card names its back face via
 * the "Retro" field. Returns a human-readable issue per broken link — a Retro
 * pointing at a missing card, a card naming itself, a back face claimed by
 * several fronts, or a back face that also carries its own Retro.
 */
export function getRetroIssues(cards: CardData[]): string[] {
  const issues: string[] = []
  const names = new Set(cards.map((c) => c.name))
  const frontsByBack = new Map<string, string[]>()

  for (const card of cards) {
    const retro = retroValue(card)
    if (!retro) continue
    if (retro === card.name) {
      issues.push(`"${card.name}" lists itself as its own back face (Retro)`)
      continue
    }
    if (!names.has(retro)) {
      issues.push(`"${card.name}" has Retro "${retro}", but no card with that name exists`)
    }
    const fronts = frontsByBack.get(retro) ?? []
    fronts.push(card.name)
    frontsByBack.set(retro, fronts)
  }

  for (const [back, fronts] of frontsByBack) {
    if (fronts.length > 1) {
      issues.push(`Back face "${back}" is referenced by multiple cards: ${fronts.join(', ')}`)
    }
    const backCard = cards.find((c) => c.name === back)
    if (backCard && retroValue(backCard)) {
      issues.push(`"${back}" is used as a back face but also has its own Retro value`)
    }
  }

  return issues
}

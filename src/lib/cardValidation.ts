import type { CardData, CardType } from '@/types/card'
import { isCoreField } from '@/types/card'
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

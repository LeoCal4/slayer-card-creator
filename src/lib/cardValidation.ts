import type { CardData, CardType } from '@/types/card'
import type { Template } from '@/types/template'

export const REQUIRED_FIELDS: Record<CardType, (keyof CardData)[]> = {
  Slayer:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'effect'],
  Errant:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'vp', 'effect'],
  Action:       ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Ploy:         ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Intervention: ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Chamber:      ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Relic:        ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Dungeon:      ['name', 'type', 'effect'],
  Phase:        ['name', 'type', 'effect'],
}

export function getMissingFields(card: CardData): (keyof CardData)[] {
  const required = REQUIRED_FIELDS[card.type] ?? []
  return required.filter((field) => {
    const val = card[field]
    return val === undefined || val === null || val === ''
  })
}

export function getCardsWithNoTemplate(cards: CardData[], templates: Template[]): CardData[] {
  return cards.filter(
    (card) => !templates.some((t) => t.cardTypes.includes(card.type)),
  )
}

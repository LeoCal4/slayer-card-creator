export type CardType = string

export type Rarity = 'common' | 'rare' | 'epic'

export const CORE_FIELDS = ['name', 'class', 'type', 'rarity', 'effect'] as const
export type CoreField = (typeof CORE_FIELDS)[number]

export function isCoreField(name: string): name is CoreField {
  return (CORE_FIELDS as readonly string[]).includes(name)
}

export interface CardData {
  id: string
  name: string
  class: string
  type: CardType
  rarity: Rarity
  effect: string
  extras: Record<string, string | number>
}

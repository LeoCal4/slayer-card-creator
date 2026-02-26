export type CardType =
  | 'Slayer' | 'Errant' | 'Action' | 'Ploy'
  | 'Intervention' | 'Chamber' | 'Relic' | 'Dungeon' | 'Phase' | 'Status'

export type Rarity = 'common' | 'rare' | 'epic'

export interface CardData {
  id: string
  name: string
  class: string
  type: CardType
  rarity: Rarity
  cost?: number
  power?: number
  hp?: number
  vp?: number
  effect: string
}

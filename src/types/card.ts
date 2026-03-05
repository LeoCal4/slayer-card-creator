export type CardType = string

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

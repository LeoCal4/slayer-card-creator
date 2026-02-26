import type { CardData, CardType } from './card'
import type { Template } from './template'

export interface ClassConfig {
  primary: string
  secondary: string
  cockatriceColor: string
}

export type PhaseMap = Partial<Record<CardType, string[]>>

export interface SetInfo {
  name: string
  code: string
  type: string
  releaseDate: string
}

export interface ProjectFile {
  version: number
  set: SetInfo
  classColors: Record<string, ClassConfig>
  phaseAbbreviations: Record<string, string>
  phaseMap: PhaseMap
  templates: Template[]
  cards: CardData[]
  artFolderPath: string
  frameImages: Record<string, string>
}

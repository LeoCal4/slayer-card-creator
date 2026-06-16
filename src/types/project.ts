import type { CardData, CardType, Rarity } from './card'
import type { Template, TemplateLayer } from './template'

export type CsvColumnType = 'text' | 'number' | 'select' | 'select-type' | 'select-rarity' | 'select-class'

export interface CsvColumnDef {
  id: string
  name: string
  type: CsvColumnType
  choices?: string[]
}

export interface ClassConfig {
  primary: string
  secondary: string
  cockatriceColor: string
}

export interface RarityConfig {
  aliases: string[]
  color: string
}

export type PhaseMap = Partial<Record<CardType, string[]>>
export type CardTypeColumnMap = Partial<Record<CardType, string[]>>

export interface LayerOverride {
  hidden?: boolean
  props?: Partial<TemplateLayer>
}

export interface CardTemplateOverride {
  templateId: string
  layerOverrides: Record<string, LayerOverride>
  extraLayers: TemplateLayer[]
}

export interface EffectFormatting {
  boldTerms: string[]
  italicTerms: string[]
}

export interface SetInfo {
  name: string
  code: string
  type: string
  releaseDate: string
  effectFormatting?: EffectFormatting
}

export interface ProjectFile {
  version: number
  set: SetInfo
  classColors: Record<string, ClassConfig>
  cardTypes: string[]
  phaseAbbreviations: Record<string, string>
  phaseMap: PhaseMap
  rarityConfig: Record<Rarity, RarityConfig>
  csvColumns?: CsvColumnDef[]
  csvColumnRequirements?: CardTypeColumnMap
  cardOverrides?: Record<string, CardTemplateOverride>
  templates: Template[]
  cards: CardData[]
  artFolderPath: string
  frameImages: Record<string, string>
}

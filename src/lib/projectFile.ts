import type { ProjectFile, RarityConfig } from '@/types/project'
import type { Rarity } from '@/types/card'

const DEFAULT_CARD_TYPES: string[] = [
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase', 'Status',
]

const REQUIRED_KEYS: (keyof ProjectFile)[] = [
  'version',
  'set',
  'classColors',
  'phaseAbbreviations',
  'phaseMap',
  'templates',
  'cards',
  'artFolderPath',
  'frameImages',
]

const DEFAULT_RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: { aliases: ['comune'], color: '#4ade80' },
  rare:   { aliases: ['rara'],   color: '#f87171' },
  epic:   { aliases: ['epica'],  color: '#60a5fa' },
}

export function serialize(project: ProjectFile): string {
  return JSON.stringify(project, null, 2)
}

export function deserialize(raw: string): ProjectFile {
  const parsed = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid project file: not an object')
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      throw new Error(`Invalid project file: missing required key "${key}"`)
    }
  }
  // Migrate: fill in cardTypes if absent (old project files)
  if (!parsed.cardTypes) {
    parsed.cardTypes = [...DEFAULT_CARD_TYPES]
  }
  // Migrate: fill in rarityConfig if absent (old project files)
  if (!parsed.rarityConfig) {
    parsed.rarityConfig = {
      common: { ...DEFAULT_RARITY_CONFIG.common, aliases: [...DEFAULT_RARITY_CONFIG.common.aliases] },
      rare:   { ...DEFAULT_RARITY_CONFIG.rare,   aliases: [...DEFAULT_RARITY_CONFIG.rare.aliases] },
      epic:   { ...DEFAULT_RARITY_CONFIG.epic,   aliases: [...DEFAULT_RARITY_CONFIG.epic.aliases] },
    }
  }
  return parsed as ProjectFile
}

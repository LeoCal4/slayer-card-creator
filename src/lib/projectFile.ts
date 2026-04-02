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
  'customImages',
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
  // Migrate: rename frameImages → customImages (old project files)
  if (!parsed.customImages && parsed.frameImages) {
    parsed.customImages = parsed.frameImages
    delete parsed.frameImages
  }
  // Migrate: rename imageSource 'frame' → 'custom' in template layers
  if (Array.isArray(parsed.templates)) {
    for (const tmpl of parsed.templates) {
      if (Array.isArray(tmpl.layers)) {
        for (const layer of tmpl.layers) {
          if (layer.type === 'image' && layer.imageSource === 'frame') {
            layer.imageSource = 'custom'
          }
        }
      }
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
  // Migrate: fill in effectFormatting if absent (old project files)
  if (!parsed.set.effectFormatting) {
    parsed.set.effectFormatting = { boldTerms: [], italicTerms: [] }
  }
  return parsed as ProjectFile
}

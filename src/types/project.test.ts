import { describe, it } from 'vitest'
import type { ClassConfig, SetInfo, ProjectFile, RarityConfig } from './project'

describe('RarityConfig', () => {
  it('has aliases array and color string', () => {
    void ({ aliases: ['comune'], color: '#4ade80' } satisfies RarityConfig)
    void ({ aliases: [], color: '#f87171' } satisfies RarityConfig)
  })
})

describe('ClassConfig', () => {
  it('accepts free-text cockatriceColor (not restricted to MTG letters)', () => {
    void ({ primary: '#d4ac0d', secondary: '#9a7d0a', cockatriceColor: 'W' } satisfies ClassConfig)
    void ({ primary: '#d4ac0d', secondary: '#9a7d0a', cockatriceColor: 'Custom1' } satisfies ClassConfig)
  })
})

describe('SetInfo', () => {
  it('has name, code, type, releaseDate', () => {
    void ({ name: 'Slayer Set 1', code: 'SNC', type: 'Custom', releaseDate: '2025-01-01' } satisfies SetInfo)
  })
})

describe('ProjectFile', () => {
  it('has all required top-level fields', () => {
    void ({
      version: 1,
      set: { name: 'Slayer', code: 'SNC', type: 'Custom', releaseDate: '2025-01-01' },
      classColors: {},
      phaseAbbreviations: { Encounter: 'E', Preparation: 'P', Combat: 'B', Camp: 'C' },
      phaseMap: {},
      rarityConfig: {
        common: { aliases: ['comune'], color: '#4ade80' },
        rare:   { aliases: ['rara'],   color: '#f87171' },
        epic:   { aliases: ['epica'],  color: '#60a5fa' },
      },
      templates: [],
      cards: [],
      artFolderPath: '',
      frameImages: {},
    } satisfies ProjectFile)
  })

  it('frameImages maps templateId to base64 string', () => {
    void ({
      version: 1,
      set: { name: 'S', code: 'S', type: 'Custom', releaseDate: '2025-01-01' },
      classColors: {},
      phaseAbbreviations: {},
      phaseMap: {},
      rarityConfig: {
        common: { aliases: [], color: '#4ade80' },
        rare:   { aliases: [], color: '#f87171' },
        epic:   { aliases: [], color: '#60a5fa' },
      },
      templates: [],
      cards: [],
      artFolderPath: '/art',
      frameImages: { 'template-creature': 'base64data==' },
    } satisfies ProjectFile)
  })
})

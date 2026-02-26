import { describe, it } from 'vitest'
import type { ClassConfig, SetInfo, ProjectFile } from './project'

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
      templates: [],
      cards: [],
      artFolderPath: '/art',
      frameImages: { 'template-creature': 'base64data==' },
    } satisfies ProjectFile)
  })
})

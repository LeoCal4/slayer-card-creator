import { describe, it, expect, vi, beforeEach } from 'vitest'
import { preloadArtImages, preloadFrameImages } from './imageLoader'
import type { ProjectFile } from '@/types/project'

const baseProject: ProjectFile = {
  version: 1,
  set: { name: 'Test', code: 'TST', type: 'Core', releaseDate: '' },
  classColors: {},
  phaseAbbreviations: {},
  phaseMap: {},
  rarityConfig: {
    common: { aliases: ['comune'], color: '#4ade80' },
    rare:   { aliases: ['rara'],   color: '#f87171' },
    epic:   { aliases: ['epica'],  color: '#60a5fa' },
  },
  templates: [],
  cards: [
    { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '' },
    { id: 'c2', name: 'Shadowblade', class: 'Rogue', type: 'Errant', rarity: 'rare', effect: '' },
  ],
  artFolderPath: '/art',
  frameImages: {
    'tmpl-1': 'data:image/png;base64,abc',
    'tmpl-2': 'data:image/png;base64,def',
  },
}

beforeEach(() => {
  vi.stubGlobal('window', {
    electronAPI: {
      readArtFile: vi.fn().mockImplementation((_folder: string, name: string) => {
        if (name === 'Axehand') return Promise.resolve('data:image/png;base64,art1')
        return Promise.resolve(null)
      }),
    },
  })
  // Make Image fire onload as a microtask after src is set
  vi.stubGlobal('Image', class {
    onload: (() => void) | null = null
    set src(_v: string) {
      Promise.resolve().then(() => this.onload?.())
    }
  })
})

describe('preloadArtImages', () => {
  it('returns an empty map when artFolderPath is empty', async () => {
    const result = await preloadArtImages({ ...baseProject, artFolderPath: '' })
    expect(result.size).toBe(0)
  })

  it('maps card name to HTMLImageElement when readArtFile returns a data URI', async () => {
    const result = await preloadArtImages(baseProject)
    expect(result.has('Axehand')).toBe(true)
    expect(result.has('Shadowblade')).toBe(false)
  })

  it('calls readArtFile once per card', async () => {
    await preloadArtImages(baseProject)
    expect(window.electronAPI.readArtFile).toHaveBeenCalledTimes(2)
    expect(window.electronAPI.readArtFile).toHaveBeenCalledWith('/art', 'Axehand')
    expect(window.electronAPI.readArtFile).toHaveBeenCalledWith('/art', 'Shadowblade')
  })
})

describe('preloadFrameImages', () => {
  it('returns a map with one entry per frame image', async () => {
    const result = await preloadFrameImages(baseProject)
    expect(result.size).toBe(2)
    expect(result.has('tmpl-1')).toBe(true)
    expect(result.has('tmpl-2')).toBe(true)
  })

  it('returns an empty map when project has no frame images', async () => {
    const result = await preloadFrameImages({ ...baseProject, frameImages: {} })
    expect(result.size).toBe(0)
  })
})

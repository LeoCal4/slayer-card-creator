import { describe, it, expect, vi, beforeEach } from 'vitest'
import { buildZip } from './zipBuilder'
import type { ProjectFile } from '@/types/project'

vi.mock('@/lib/renderer/cardRenderer', () => ({
  renderCard: vi.fn().mockResolvedValue(new Blob(['PNG'], { type: 'image/png' })),
}))
vi.mock('@/lib/renderer/imageLoader', () => ({
  preloadArtImages:  vi.fn().mockResolvedValue(new Map()),
  preloadFrameImages: vi.fn().mockResolvedValue(new Map()),
}))
vi.mock('@/lib/xmlGenerator', () => ({
  generateXML: vi.fn().mockReturnValue('<xml/>'),
}))

const project: ProjectFile = {
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
  templates: [
    { id: 'tmpl-1', name: 'Creature', cardTypes: ['Slayer', 'Errant'], canvas: { width: 375, height: 523 }, layers: [] },
  ],
  cards: [
    { id: 'c1', name: 'Axehand',    class: 'Warrior', type: 'Slayer',  rarity: 'common', effect: '' },
    { id: 'c2', name: 'Shadowblade', class: 'Rogue',   type: 'Errant',  rarity: 'rare',   effect: '' },
    { id: 'c3', name: 'Fireball',   class: 'Mage',    type: 'Action',  rarity: 'common', effect: '' },
  ],
  artFolderPath: '',
  frameImages: {},
}

describe('buildZip', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns a Blob', async () => {
    const { blob } = await buildZip(project, vi.fn())
    expect(blob).toBeInstanceOf(Blob)
  })

  it('calls renderCard for each card that has a matching template', async () => {
    const { renderCard } = await import('@/lib/renderer/cardRenderer')
    await buildZip(project, vi.fn())
    // Axehand (Slayer) and Shadowblade (Errant) match tmpl-1; Fireball (Action) has no template
    expect(renderCard).toHaveBeenCalledTimes(2)
  })

  it('skips cards with no matching template and reports them in warnings', async () => {
    const { renderCard } = await import('@/lib/renderer/cardRenderer')
    const { warnings } = await buildZip(project, vi.fn())
    expect(renderCard).toHaveBeenCalledTimes(2)
    expect(warnings).toHaveLength(1)
    expect(warnings[0]).toContain('Fireball')
  })

  it('calls onProgress with rendering phase for each card', async () => {
    const onProgress = vi.fn()
    await buildZip(project, onProgress)
    const renderingCalls = onProgress.mock.calls.filter(([p]) => p.phase === 'rendering')
    expect(renderingCalls).toHaveLength(project.cards.length)
  })

  it('calls onProgress with packing phase', async () => {
    const onProgress = vi.fn()
    await buildZip(project, onProgress)
    const packingCalls = onProgress.mock.calls.filter(([p]) => p.phase === 'packing')
    expect(packingCalls.length).toBeGreaterThanOrEqual(1)
  })

  it('calls preloadArtImages and preloadFrameImages', async () => {
    const { preloadArtImages } = await import('@/lib/renderer/imageLoader')
    const { preloadFrameImages } = await import('@/lib/renderer/imageLoader')
    await buildZip(project, vi.fn())
    expect(preloadArtImages).toHaveBeenCalledWith(project)
    expect(preloadFrameImages).toHaveBeenCalledWith(project)
  })

  it('calls generateXML with the project', async () => {
    const { generateXML } = await import('@/lib/xmlGenerator')
    await buildZip(project, vi.fn())
    expect(generateXML).toHaveBeenCalledWith(project)
  })
})

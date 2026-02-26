import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PreviewGrid } from './PreviewGrid'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

vi.mock('@/lib/renderer/cardRenderer', () => ({
  renderCard: vi.fn().mockResolvedValue(new Blob([''], { type: 'image/png' })),
}))

vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:fake'),
  revokeObjectURL: vi.fn(),
})

vi.stubGlobal('IntersectionObserver', class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
})

const cards: CardData[] = [
  { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '' },
  { id: 'c2', name: 'Shadowblade', class: 'Rogue', type: 'Errant', rarity: 'rare', effect: '' },
  { id: 'c3', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'epic', effect: '' },
]

const templates: Template[] = [
  { id: 'tmpl-1', name: 'Creature', cardTypes: ['Slayer', 'Errant'], canvas: { width: 375, height: 523 }, layers: [] },
  { id: 'tmpl-2', name: 'Spell', cardTypes: ['Action'], canvas: { width: 375, height: 523 }, layers: [] },
]

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
  templates, cards, artFolderPath: '', frameImages: {},
}

describe('PreviewGrid', () => {
  it('renders a tile for each card', () => {
    render(
      <PreviewGrid
        cards={cards} templates={templates} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.getByText('Axehand')).toBeInTheDocument()
    expect(screen.getByText('Shadowblade')).toBeInTheDocument()
    expect(screen.getByText('Fireball')).toBeInTheDocument()
  })

  it('renders a Render All button', () => {
    render(
      <PreviewGrid
        cards={cards} templates={templates} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.getByRole('button', { name: /render all/i })).toBeInTheDocument()
  })

  it('calls renderCard for each card with a template when Render All is clicked', async () => {
    const { renderCard } = await import('@/lib/renderer/cardRenderer')
    ;(renderCard as any).mockClear()
    render(
      <PreviewGrid
        cards={cards} templates={templates} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /render all/i }))
    await waitFor(() => {
      // 3 cards, all have templates
      expect(renderCard).toHaveBeenCalledTimes(3)
    })
  })

  it('renders empty state when no cards', () => {
    render(
      <PreviewGrid
        cards={[]} templates={templates} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.getByText(/no cards/i)).toBeInTheDocument()
  })
})

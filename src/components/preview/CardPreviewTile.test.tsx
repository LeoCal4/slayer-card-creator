import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { CardPreviewTile } from './CardPreviewTile'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

// Mock renderCard
vi.mock('@/lib/renderer/cardRenderer', () => ({
  renderCard: vi.fn().mockResolvedValue(new Blob([''], { type: 'image/png' })),
}))

// Mock URL.createObjectURL
vi.stubGlobal('URL', {
  createObjectURL: vi.fn().mockReturnValue('blob:fake-url'),
  revokeObjectURL: vi.fn(),
})

const card: CardData = {
  id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '',
}

const template: Template = {
  id: 'tmpl-1', name: 'Test', cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 }, layers: [],
}

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
  templates: [], cards: [], artFolderPath: '', frameImages: {},
}

let intersectCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null

beforeEach(() => {
  intersectCallback = null
  vi.stubGlobal('IntersectionObserver', class {
    constructor(cb: (entries: IntersectionObserverEntry[]) => void) {
      intersectCallback = cb
    }
    observe = vi.fn()
    unobserve = vi.fn()
    disconnect = vi.fn()
  })
})

function triggerIntersect(isIntersecting: boolean) {
  act(() => {
    intersectCallback?.([{ isIntersecting } as IntersectionObserverEntry])
  })
}

describe('CardPreviewTile', () => {
  it('renders the card name and type', () => {
    render(
      <CardPreviewTile
        card={card} template={template} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.getByText('Axehand')).toBeInTheDocument()
    expect(screen.getByText('Slayer')).toBeInTheDocument()
  })

  it('renders a placeholder box initially (no img)', () => {
    render(
      <CardPreviewTile
        card={card} template={template} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.queryByRole('img')).toBeNull()
  })

  it('shows "No template" message when template is undefined', () => {
    render(
      <CardPreviewTile
        card={card} template={undefined} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    expect(screen.getByText('No template')).toBeInTheDocument()
  })

  it('calls renderCard and shows img when tile enters viewport', async () => {
    const { renderCard } = await import('@/lib/renderer/cardRenderer')
    render(
      <CardPreviewTile
        card={card} template={template} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    await act(async () => { triggerIntersect(true) })
    expect(renderCard).toHaveBeenCalledWith(expect.objectContaining({ card, template }))
    expect(await screen.findByRole('img')).toBeInTheDocument()
  })

  it('does not call renderCard when tile is not intersecting', async () => {
    const { renderCard } = await import('@/lib/renderer/cardRenderer')
    ;(renderCard as any).mockClear()
    render(
      <CardPreviewTile
        card={card} template={template} project={project}
        artImages={new Map()} frameImages={new Map()}
      />
    )
    triggerIntersect(false)
    expect(renderCard).not.toHaveBeenCalled()
  })
})

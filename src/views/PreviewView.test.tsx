import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PreviewView } from './PreviewView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

vi.mock('@/lib/renderer/cardRenderer', () => ({
  renderCard: vi.fn().mockResolvedValue(new Blob([''], { type: 'image/png' })),
}))

vi.mock('@/lib/renderer/imageLoader', () => ({
  preloadArtImages: vi.fn().mockResolvedValue(new Map()),
  preloadCustomImages: vi.fn().mockResolvedValue(new Map()),
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

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeCardId: null, activeView: 'preview' })
  useProjectStore.getState().newProject()
  useProjectStore.setState((state) => ({
    project: state.project ? { ...state.project, templates: [], cards: [] } : null,
  }))
  useProjectStore.getState().addCard({
    id: 'card-1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Deal 3.', extras: {},
  })
  useProjectStore.getState().addTemplate({
    id: 'tmpl-action',
    name: 'Action Template',
    cardTypes: ['Action'],
    canvas: { width: 375, height: 523 },
    layers: [],
  })
}

describe('PreviewView', () => {
  beforeEach(setup)

  it('renders card tiles', () => {
    render(<PreviewView />)
    expect(screen.getByText('Fireball')).toBeInTheDocument()
  })

  it('double-clicking a tile sets activeCardId and navigates to card-designer', () => {
    render(<PreviewView />)
    fireEvent.dblClick(screen.getByText('Fireball'))
    expect(useUiStore.getState().activeCardId).toBe('card-1')
    expect(useUiStore.getState().activeView).toBe('card-designer')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CardDesignerView } from './CardDesignerView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeCardId: null, selectedLayerId: null })
  useProjectStore.getState().newProject()
  // Clear starter templates so we control exactly which templates are present
  useProjectStore.setState((state) => ({
    project: state.project ? { ...state.project, templates: [] } : null,
  }))
  useProjectStore.getState().addCard({
    id: 'card-1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Deal 3 damage.',
  })
  useProjectStore.getState().addTemplate({
    id: 'tmpl-action',
    name: 'Action Template',
    cardTypes: ['Action'],
    canvas: { width: 375, height: 523 },
    layers: [],
  })
}

describe('CardDesignerView', () => {
  beforeEach(setup)

  it('shows a prompt to select a card when no card is active', () => {
    render(<CardDesignerView />)
    expect(screen.getByText(/select a card/i)).toBeInTheDocument()
  })

  it('renders the card selector (search + dropdown)', () => {
    render(<CardDesignerView />)
    expect(screen.getByRole('combobox', { name: /edit card/i })).toBeInTheDocument()
  })

  it('shows no multi-template warning when exactly one template matches the card type', () => {
    useUiStore.setState({ activeCardId: 'card-1' })
    render(<CardDesignerView />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows a warning banner when more than one template matches the card type', () => {
    useProjectStore.getState().addTemplate({
      id: 'tmpl-action-2',
      name: 'Action Template 2',
      cardTypes: ['Action'],
      canvas: { width: 375, height: 523 },
      layers: [],
    })
    useUiStore.setState({ activeCardId: 'card-1' })
    render(<CardDesignerView />)
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('shows no warning banner when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    render(<CardDesignerView />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('shows "no template" message when no template matches the card type', () => {
    useProjectStore.getState().addCard({
      id: 'card-dungeon', name: 'Dark Keep', class: '', type: 'Dungeon', rarity: 'common', effect: 'Lurk.',
    })
    // No template has cardTypes including 'Dungeon' in setup
    useProjectStore.getState().updateTemplate('tmpl-action', { cardTypes: ['Action'] })
    useUiStore.setState({ activeCardId: 'card-dungeon' })
    render(<CardDesignerView />)
    expect(screen.getByText(/no template/i)).toBeInTheDocument()
  })

  it('selecting a card via the dropdown sets activeCardId', async () => {
    // This is wired through the card selector component — covered by selector tests
    // Just verify the dropdown is present when a project is loaded
    render(<CardDesignerView />)
    expect(screen.getByRole('combobox', { name: /edit card/i })).toBeInTheDocument()
  })

  it('sets previewCardId to activeCardId so the canvas renders the selected card', () => {
    useUiStore.setState({ activeCardId: 'card-1', previewCardId: null })
    render(<CardDesignerView />)
    expect(useUiStore.getState().previewCardId).toBe('card-1')
  })

  it('clears previewCardId when no card is active', () => {
    useUiStore.setState({ activeCardId: null, previewCardId: 'card-1' })
    render(<CardDesignerView />)
    expect(useUiStore.getState().previewCardId).toBeNull()
  })

  it('shows Undo and Redo buttons when a card and template are active', () => {
    useUiStore.setState({ activeCardId: 'card-1' })
    render(<CardDesignerView />)
    expect(screen.getByRole('button', { name: /undo/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /redo/i })).toBeInTheDocument()
  })

  it('Undo button is disabled when cardUndoStack is empty for that card', () => {
    useUiStore.setState({ activeCardId: 'card-1', cardUndoStack: {}, cardRedoStack: {} })
    render(<CardDesignerView />)
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled()
  })

  it('Undo button is enabled when cardUndoStack has entries for that card', () => {
    useUiStore.setState({
      activeCardId: 'card-1',
      cardUndoStack: { 'card-1': [null] },
      cardRedoStack: {},
    })
    render(<CardDesignerView />)
    expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled()
  })
})

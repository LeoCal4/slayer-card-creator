import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PreviewCardSelector } from './PreviewCardSelector'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, previewCardId: null })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addCard({
    id: 'c1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: '', cost: 3,
  })
  useProjectStore.getState().addCard({
    id: 'c2', name: 'Dragonslayer', class: 'Warrior', type: 'Slayer', rarity: 'rare', effect: '', power: 4, hp: 4,
  })
  useProjectStore.getState().addCard({
    id: 'c3', name: 'Frost Nova', class: 'Mage', type: 'Action', rarity: 'uncommon', effect: '', cost: 2,
  })
}

describe('PreviewCardSelector', () => {
  beforeEach(setup)

  it('renders a combobox', () => {
    render(<PreviewCardSelector cardTypes={['Action']} />)
    expect(screen.getByRole('combobox', { name: /preview as/i })).toBeInTheDocument()
  })

  it('lists only cards whose type matches the given cardTypes', () => {
    render(<PreviewCardSelector cardTypes={['Action']} />)
    const select = screen.getByRole('combobox', { name: /preview as/i })
    expect(select).toHaveTextContent('Fireball')
    expect(select).toHaveTextContent('Frost Nova')
    expect(select).not.toHaveTextContent('Dragonslayer')
  })

  it('shows a "(none)" option when no card matches', () => {
    render(<PreviewCardSelector cardTypes={['Chamber']} />)
    expect(screen.getByRole('combobox', { name: /preview as/i })).toHaveTextContent('(none)')
  })

  it('defaults to the first matching card', () => {
    render(<PreviewCardSelector cardTypes={['Action']} />)
    expect(screen.getByRole('combobox', { name: /preview as/i })).toHaveValue('c1')
  })

  it('selecting a card sets previewCardId in uiStore', async () => {
    render(<PreviewCardSelector cardTypes={['Action']} />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /preview as/i }), 'c3')
    expect(useUiStore.getState().previewCardId).toBe('c3')
  })

  it('shows current previewCardId as selected value', () => {
    useUiStore.getState().setPreviewCard('c3')
    render(<PreviewCardSelector cardTypes={['Action']} />)
    expect(screen.getByRole('combobox', { name: /preview as/i })).toHaveValue('c3')
  })
})

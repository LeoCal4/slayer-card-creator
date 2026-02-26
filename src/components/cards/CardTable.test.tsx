import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardTable } from './CardTable'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addCard({
    id: 'c1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Deal 3 damage.',
  })
  useProjectStore.getState().addCard({
    id: 'c2', name: 'Arrow Shot', class: 'Hunter', type: 'Ploy', rarity: 'rare', effect: 'Pierce armor.',
  })
}

describe('CardTable', () => {
  beforeEach(setupProject)

  it('renders column headers', () => {
    render(<CardTable />)
    expect(screen.getByRole('columnheader', { name: /name/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /class/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /type/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /rarity/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /effect/i })).toBeInTheDocument()
  })

  it('renders an input row per card', () => {
    render(<CardTable />)
    expect(screen.getByDisplayValue('Fireball')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Arrow Shot')).toBeInTheDocument()
  })

  it('filter input narrows rows by name', async () => {
    render(<CardTable />)
    await userEvent.type(screen.getByRole('searchbox'), 'Fireball')
    const nameInputs = screen.getAllByRole('textbox', { name: /^name$/i })
    expect(nameInputs).toHaveLength(1)
    expect(nameInputs[0]).toHaveValue('Fireball')
  })

  it('filter input narrows rows by effect text', async () => {
    render(<CardTable />)
    await userEvent.type(screen.getByRole('searchbox'), 'Pierce')
    expect(screen.queryByDisplayValue('Fireball')).not.toBeInTheDocument()
    expect(screen.getByDisplayValue('Arrow Shot')).toBeInTheDocument()
  })

  it('"Add Card" button adds a blank card to the store', async () => {
    const initial = useProjectStore.getState().project!.cards.length
    render(<CardTable />)
    await userEvent.click(screen.getByRole('button', { name: /add card/i }))
    expect(useProjectStore.getState().project!.cards).toHaveLength(initial + 1)
  })

  it('delete button removes the card after confirmation', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<CardTable />)
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    expect(useProjectStore.getState().project!.cards).toHaveLength(1)
  })

  it('delete button does nothing when confirmation is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    render(<CardTable />)
    await userEvent.click(screen.getAllByRole('button', { name: /delete/i })[0])
    expect(useProjectStore.getState().project!.cards).toHaveLength(2)
  })

  it('clicking Name header sets aria-sort to ascending then descending', async () => {
    render(<CardTable />)
    const nameHeader = screen.getByRole('columnheader', { name: /name/i })
    await userEvent.click(within(nameHeader).getByRole('button'))
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
    await userEvent.click(within(nameHeader).getByRole('button'))
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending')
  })

  it('updates card name in store on input change', async () => {
    render(<CardTable />)
    const nameInput = screen.getByDisplayValue('Fireball')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Inferno')
    expect(useProjectStore.getState().project!.cards.find((c) => c.id === 'c1')?.name).toBe('Inferno')
  })

  it('power and hp inputs are disabled for non-fighter card types', () => {
    render(<CardTable />)
    const powerInputs = screen.getAllByRole('spinbutton', { name: /power/i })
    const hpInputs = screen.getAllByRole('spinbutton', { name: /hp/i })
    powerInputs.forEach((input) => expect(input).toBeDisabled())
    hpInputs.forEach((input) => expect(input).toBeDisabled())
  })

  it('vp input is disabled for non-Errant card types', () => {
    render(<CardTable />)
    const vpInputs = screen.getAllByRole('spinbutton', { name: /vp/i })
    vpInputs.forEach((input) => expect(input).toBeDisabled())
  })

  it('shows empty state when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    render(<CardTable />)
    expect(screen.getByText(/no project/i)).toBeInTheDocument()
  })

  it('shows empty state message when project has no cards', () => {
    const p = useProjectStore.getState().project!
    useProjectStore.setState({ project: { ...p, cards: [] } })
    render(<CardTable />)
    expect(screen.getByText(/no cards yet/i)).toBeInTheDocument()
  })
})


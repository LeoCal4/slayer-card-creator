import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PhaseMapTable } from './PhaseMapTable'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('PhaseMapTable', () => {
  beforeEach(setupProject)

  it('renders an abbreviation input for each phase', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('textbox', { name: /encounter abbreviation/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /preparation abbreviation/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /combat abbreviation/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /camp abbreviation/i })).toBeInTheDocument()
  })

  it('abbreviation inputs show current values', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('textbox', { name: /encounter abbreviation/i })).toHaveValue('E')
    expect(screen.getByRole('textbox', { name: /preparation abbreviation/i })).toHaveValue('P')
  })

  it('changing an abbreviation updates the store', async () => {
    render(<PhaseMapTable />)
    const input = screen.getByRole('textbox', { name: /encounter abbreviation/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'X')
    expect(useProjectStore.getState().project?.phaseAbbreviations['Encounter']).toBe('X')
  })

  it('renders column headers for each card type', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('columnheader', { name: /slayer/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /action/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /dungeon/i })).toBeInTheDocument()
  })

  it('checkboxes reflect the current phaseMap (Slayer has Encounter checked)', () => {
    render(<PhaseMapTable />)
    const checkbox = screen.getByRole('checkbox', { name: /encounter.*slayer/i })
    expect(checkbox).toBeChecked()
  })

  it('an unchecked phase-type box is not checked', () => {
    render(<PhaseMapTable />)
    const checkbox = screen.getByRole('checkbox', { name: /preparation.*slayer/i })
    expect(checkbox).not.toBeChecked()
  })

  it('checking a box adds that phase to the type phaseMap', async () => {
    render(<PhaseMapTable />)
    const checkbox = screen.getByRole('checkbox', { name: /preparation.*slayer/i })
    await userEvent.click(checkbox)
    expect(useProjectStore.getState().project?.phaseMap['Slayer']).toContain('Preparation')
  })

  it('unchecking a box removes that phase from the type phaseMap', async () => {
    render(<PhaseMapTable />)
    const checkbox = screen.getByRole('checkbox', { name: /encounter.*slayer/i })
    await userEvent.click(checkbox)
    expect(useProjectStore.getState().project?.phaseMap['Slayer']).not.toContain('Encounter')
  })

  it('abbreviation input stores an emoji symbol', async () => {
    render(<PhaseMapTable />)
    const input = screen.getByRole('textbox', { name: /encounter abbreviation/i })
    await userEvent.clear(input)
    await userEvent.type(input, '⚔️')
    expect(useProjectStore.getState().project?.phaseAbbreviations['Encounter']).toBe('⚔️')
  })

  it('abbreviation input does not apply font-mono (emoji-friendly rendering)', () => {
    render(<PhaseMapTable />)
    const input = screen.getByRole('textbox', { name: /encounter abbreviation/i })
    expect(input.className).not.toContain('font-mono')
  })

  it('renders an editable name input for each phase', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('textbox', { name: /encounter name/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /preparation name/i })).toBeInTheDocument()
  })

  it('name inputs show the current phase name', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('textbox', { name: /encounter name/i })).toHaveValue('Encounter')
    expect(screen.getByRole('textbox', { name: /preparation name/i })).toHaveValue('Preparation')
  })

  it('editing a name and blurring renames the phase in the store', async () => {
    render(<PhaseMapTable />)
    const nameInput = screen.getByRole('textbox', { name: /encounter name/i })
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'Battling')
    await userEvent.tab()
    expect(useProjectStore.getState().project?.phaseAbbreviations).toHaveProperty('Battling')
    expect(useProjectStore.getState().project?.phaseAbbreviations).not.toHaveProperty('Encounter')
  })

  it('renders a delete button for each phase', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('button', { name: /delete encounter/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete preparation/i })).toBeInTheDocument()
  })

  it('clicking delete removes the phase from the store', async () => {
    render(<PhaseMapTable />)
    await userEvent.click(screen.getByRole('button', { name: /delete encounter/i }))
    expect(useProjectStore.getState().project?.phaseAbbreviations).not.toHaveProperty('Encounter')
  })

  it('renders an "Add Phase" button', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('button', { name: /add phase/i })).toBeInTheDocument()
  })

  it('clicking "Add Phase" adds a new phase to the store', async () => {
    render(<PhaseMapTable />)
    const before = Object.keys(useProjectStore.getState().project?.phaseAbbreviations ?? {}).length
    await userEvent.click(screen.getByRole('button', { name: /add phase/i }))
    const after = Object.keys(useProjectStore.getState().project?.phaseAbbreviations ?? {}).length
    expect(after).toBe(before + 1)
  })
})

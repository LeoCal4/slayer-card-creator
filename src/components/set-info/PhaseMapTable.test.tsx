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
    expect(screen.getByRole('textbox', { name: /^encounter$/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^preparation$/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^combat$/i })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /^camp$/i })).toBeInTheDocument()
  })

  it('abbreviation inputs show current values', () => {
    render(<PhaseMapTable />)
    expect(screen.getByRole('textbox', { name: /^encounter$/i })).toHaveValue('E')
    expect(screen.getByRole('textbox', { name: /^preparation$/i })).toHaveValue('P')
  })

  it('changing an abbreviation updates the store', async () => {
    render(<PhaseMapTable />)
    const input = screen.getByRole('textbox', { name: /^encounter$/i })
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
    const input = screen.getByRole('textbox', { name: /^encounter$/i })
    await userEvent.clear(input)
    await userEvent.type(input, '⚔️')
    expect(useProjectStore.getState().project?.phaseAbbreviations['Encounter']).toBe('⚔️')
  })

  it('abbreviation input does not apply font-mono (emoji-friendly rendering)', () => {
    render(<PhaseMapTable />)
    const input = screen.getByRole('textbox', { name: /^encounter$/i })
    expect(input.className).not.toContain('font-mono')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardTypeColumnTable } from './CardTypeColumnTable'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('CardTypeColumnTable', () => {
  beforeEach(setupProject)

  it('renders a row header for each card type', () => {
    render(<CardTypeColumnTable />)
    expect(screen.getByRole('rowheader', { name: /slayer/i })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /dungeon/i })).toBeInTheDocument()
    expect(screen.getByRole('rowheader', { name: /action/i })).toBeInTheDocument()
  })

  it('renders a column header for each csv column', () => {
    render(<CardTypeColumnTable />)
    expect(screen.getByRole('columnheader', { name: /^speed$/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /^power$/i })).toBeInTheDocument()
    expect(screen.getByRole('columnheader', { name: /^name$/i })).toBeInTheDocument()
  })

  it('default requirements pre-check the expected columns for each card type', () => {
    render(<CardTypeColumnTable />)
    // Spot-check a representative sample of the defaults
    expect(screen.getByRole('checkbox', { name: /action.*cost/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /action.*effect/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /slayer.*hp/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /errant.*power/i })).toBeChecked()
    // Columns that should NOT be required for a given type
    expect(screen.getByRole('checkbox', { name: /phase.*cost/i })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: /slayer.*effect/i })).not.toBeChecked()
  })

  it('checking a box adds that column to requirements for that type', async () => {
    render(<CardTypeColumnTable />)
    const checkbox = screen.getByRole('checkbox', { name: /dungeon.*speed/i })
    await userEvent.click(checkbox)
    const req = useProjectStore.getState().project?.csvColumnRequirements
    expect(req?.['Dungeon']).toContain('speed')
  })

  it('unchecking a box removes that column from requirements for that type', async () => {
    useProjectStore.getState().updateCsvColumnRequirements('Dungeon', ['speed'])
    render(<CardTypeColumnTable />)
    const checkbox = screen.getByRole('checkbox', { name: /dungeon.*speed/i })
    expect(checkbox).toBeChecked()
    await userEvent.click(checkbox)
    expect(useProjectStore.getState().project?.csvColumnRequirements?.['Dungeon']).not.toContain('speed')
  })

  it('checking a box for one type does not affect another type', async () => {
    render(<CardTypeColumnTable />)
    await userEvent.click(screen.getByRole('checkbox', { name: /dungeon.*speed/i }))
    const req = useProjectStore.getState().project?.csvColumnRequirements
    expect(req?.['Slayer'] ?? []).not.toContain('speed')
  })

  it('reflects existing requirements from the store', () => {
    useProjectStore.getState().updateCsvColumnRequirements('Slayer', ['power', 'speed'])
    render(<CardTypeColumnTable />)
    expect(screen.getByRole('checkbox', { name: /slayer.*power/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /slayer.*speed/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /slayer.*cost/i })).not.toBeChecked()
  })

  it('renders nothing when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    const { container } = render(<CardTypeColumnTable />)
    expect(container).toBeEmptyDOMElement()
  })
})

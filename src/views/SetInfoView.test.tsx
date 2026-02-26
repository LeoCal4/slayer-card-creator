import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetInfoView } from './SetInfoView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('SetInfoView — set metadata form', () => {
  beforeEach(setupProject)

  it('shows empty state when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    render(<SetInfoView />)
    expect(screen.getByText(/no project/i)).toBeInTheDocument()
  })

  it('renders labeled inputs for name, code, type, release date', () => {
    render(<SetInfoView />)
    expect(screen.getByLabelText(/set name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^code$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^type$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/release date/i)).toBeInTheDocument()
  })

  it('populates inputs from current project data', () => {
    render(<SetInfoView />)
    expect(screen.getByLabelText(/set name/i)).toHaveValue('New Set')
    expect(screen.getByLabelText(/^code$/i)).toHaveValue('NEW')
  })

  it('name change updates the store', async () => {
    render(<SetInfoView />)
    const input = screen.getByLabelText(/set name/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'My Awesome Set')
    expect(useProjectStore.getState().project?.set.name).toBe('My Awesome Set')
  })

  it('code input auto-uppercases typed characters', async () => {
    render(<SetInfoView />)
    const input = screen.getByLabelText(/^code$/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'abc')
    expect(useProjectStore.getState().project?.set.code).toBe('ABC')
  })

  it('code input has maxlength of 8', () => {
    render(<SetInfoView />)
    expect(screen.getByLabelText(/^code$/i)).toHaveAttribute('maxlength', '8')
  })

  it('type change updates the store', async () => {
    render(<SetInfoView />)
    const input = screen.getByLabelText(/^type$/i)
    await userEvent.clear(input)
    await userEvent.type(input, 'Expansion')
    expect(useProjectStore.getState().project?.set.type).toBe('Expansion')
  })

  it('release date change updates the store', async () => {
    render(<SetInfoView />)
    const input = screen.getByLabelText(/release date/i)
    await userEvent.type(input, '2025-01-15')
    expect(useProjectStore.getState().project?.set.releaseDate).toBeTruthy()
  })
})

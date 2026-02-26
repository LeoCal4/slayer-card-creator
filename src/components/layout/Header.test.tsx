import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Header } from './Header'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import type { ProjectFile } from '@/types/project'

const SAMPLE_PROJECT: ProjectFile = {
  version: 1,
  set: { name: 'My Awesome Set', code: 'MAS', type: 'Custom', releaseDate: '' },
  classColors: {}, phaseAbbreviations: {}, phaseMap: {},
  templates: [], cards: [], artFolderPath: '', frameImages: {},
}

function resetStores() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, projectFilePath: null })
}

beforeEach(() => {
  resetStores()
  window.electronAPI = {
    showOpenDialog: vi.fn().mockResolvedValue(null),
    showSaveDialog: vi.fn().mockResolvedValue(null),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readArtFile: vi.fn(),
    listArtFiles: vi.fn(),
    getRecentProjects: vi.fn(),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
  }
})

describe('Header', () => {
  it('renders the app title', () => {
    render(<Header />)
    expect(screen.getByText(/slayer/i)).toBeInTheDocument()
  })

  it('shows the project set name when a project is loaded', () => {
    useProjectStore.getState().loadProject(SAMPLE_PROJECT)
    render(<Header />)
    expect(screen.getByText('My Awesome Set')).toBeInTheDocument()
  })

  it('shows dirty indicator when isDirty is true', () => {
    useUiStore.setState({ isDirty: true })
    render(<Header />)
    expect(screen.getByTestId('dirty-indicator')).toBeInTheDocument()
  })

  it('hides dirty indicator when isDirty is false', () => {
    useUiStore.setState({ isDirty: false })
    render(<Header />)
    expect(screen.queryByTestId('dirty-indicator')).not.toBeInTheDocument()
  })

  it('New button calls newProject', async () => {
    const spy = vi.spyOn(useProjectStore.getState(), 'newProject')
    render(<Header />)
    await userEvent.click(screen.getByRole('button', { name: /new/i }))
    expect(spy).toHaveBeenCalled()
  })

  it('Open button calls openProject', async () => {
    const spy = vi.spyOn(useProjectStore.getState(), 'openProject')
    render(<Header />)
    await userEvent.click(screen.getByRole('button', { name: /open/i }))
    expect(spy).toHaveBeenCalled()
  })

  it('Save button calls saveProject', async () => {
    useProjectStore.getState().loadProject(SAMPLE_PROJECT)
    useUiStore.setState({ projectFilePath: '/p.json' })
    const spy = vi.spyOn(useProjectStore.getState(), 'saveProject')
    render(<Header />)
    await userEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(spy).toHaveBeenCalled()
  })
})

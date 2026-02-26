import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WelcomeModal } from './WelcomeModal'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { ProjectFile } from '@/types/project'

const SAMPLE_PROJECT: ProjectFile = {
  version: 1,
  set: { name: 'Existing', code: 'EX', type: 'Custom', releaseDate: '' },
  classColors: {}, phaseAbbreviations: {}, phaseMap: {},
  templates: [], cards: [], artFolderPath: '', frameImages: {},
}

beforeEach(() => {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, projectFilePath: null })
  window.electronAPI = {
    showOpenDialog: vi.fn().mockResolvedValue(null),
    showSaveDialog: vi.fn().mockResolvedValue(null),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readArtFile: vi.fn(),
    listArtFiles: vi.fn(),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
  }
})

describe('WelcomeModal', () => {
  it('is visible when no project is loaded', () => {
    render(<WelcomeModal />)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('is not visible when a project is loaded', () => {
    useProjectStore.getState().loadProject(SAMPLE_PROJECT)
    render(<WelcomeModal />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"New Project" button calls newProject', async () => {
    const spy = vi.spyOn(useProjectStore.getState(), 'newProject')
    render(<WelcomeModal />)
    await userEvent.click(screen.getByRole('button', { name: /new project/i }))
    expect(spy).toHaveBeenCalled()
  })

  it('"Open Project" button calls openProject', async () => {
    const spy = vi.spyOn(useProjectStore.getState(), 'openProject')
    render(<WelcomeModal />)
    await userEvent.click(screen.getByRole('button', { name: /open project/i }))
    expect(spy).toHaveBeenCalled()
  })

  it('lists recent projects returned by getRecentProjects', async () => {
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([
      { path: '/projects/my-set.scc', name: 'My Set', timestamp: Date.now() },
    ])
    render(<WelcomeModal />)
    expect(await screen.findByText('My Set')).toBeInTheDocument()
  })

  it('shows no recent projects section when list is empty', async () => {
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([])
    render(<WelcomeModal />)
    // wait for async load, then check
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText(/recent/i)).not.toBeInTheDocument()
  })

  it('loads a recent project when clicked', async () => {
    const PROJECT_JSON = JSON.stringify(SAMPLE_PROJECT)
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([
      { path: '/projects/my-set.scc', name: 'My Set', timestamp: Date.now() },
    ])
    window.electronAPI.readFile = vi.fn().mockResolvedValue(PROJECT_JSON)
    render(<WelcomeModal />)
    await userEvent.click(await screen.findByText('My Set'))
    expect(useProjectStore.getState().project).not.toBeNull()
  })

  it('shows error message when a recent project file cannot be loaded', async () => {
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([
      { path: '/projects/gone.scc', name: 'Gone Project', timestamp: Date.now() },
    ])
    window.electronAPI.readFile = vi.fn().mockRejectedValue(new Error('File not found'))
    render(<WelcomeModal />)
    await userEvent.click(await screen.findByText('Gone Project'))
    expect(await screen.findByText(/could not load/i)).toBeInTheDocument()
  })

  it('shows a Clear button when there are recent projects', async () => {
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([
      { path: '/projects/my-set.scc', name: 'My Set', timestamp: Date.now() },
    ])
    render(<WelcomeModal />)
    expect(await screen.findByRole('button', { name: /clear/i })).toBeInTheDocument()
  })

  it('Clear button removes the recent projects list', async () => {
    window.electronAPI.getRecentProjects = vi.fn().mockResolvedValue([
      { path: '/projects/my-set.scc', name: 'My Set', timestamp: Date.now() },
    ])
    render(<WelcomeModal />)
    await screen.findByText('My Set')
    await userEvent.click(screen.getByRole('button', { name: /clear/i }))
    expect(screen.queryByText('My Set')).not.toBeInTheDocument()
  })
})

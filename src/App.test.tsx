import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { App } from './App'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

beforeEach(() => {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
  window.electronAPI = {
    showOpenDialog: vi.fn().mockResolvedValue(null),
    showSaveDialog: vi.fn().mockResolvedValue(null),
    readFile: vi.fn(),
    writeFile: vi.fn().mockResolvedValue(undefined),
    readArtFile: vi.fn(),
    listArtFiles: vi.fn().mockResolvedValue([]),
    getRecentProjects: vi.fn().mockResolvedValue([]),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
  }
})

describe('App keyboard shortcuts', () => {
  it('Ctrl+S triggers saveProject', async () => {
    const spy = vi.spyOn(useProjectStore.getState(), 'saveProject')
    render(<App />)
    fireEvent.keyDown(window, { key: 's', ctrlKey: true })
    await waitFor(() => expect(spy).toHaveBeenCalled())
  })

  it('Ctrl+Z shows "Undo not yet available" toast', async () => {
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(await screen.findByText(/undo not yet available/i)).toBeInTheDocument()
  })

  it('Ctrl+Z toast is not visible before any shortcut press', () => {
    render(<App />)
    expect(screen.queryByText(/undo not yet available/i)).not.toBeInTheDocument()
  })
})

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent, waitFor } from '@testing-library/react'
import { App } from './App'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import * as undoRedo from '@/lib/undoRedo'

beforeEach(() => {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeView: 'set-info', activeTemplateId: null, undoStack: [], redoStack: [] })
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

  it('Ctrl+Z in designer view calls performUndo', () => {
    const undoSpy = vi.spyOn(undoRedo, 'performUndo')
    const templateId = useProjectStore.getState().project?.templates[0].id ?? ''
    useUiStore.setState({ activeView: 'designer', activeTemplateId: templateId })
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(undoSpy).toHaveBeenCalledWith(templateId)
  })

  it('Ctrl+Z in non-designer view does not call performUndo', () => {
    const undoSpy = vi.spyOn(undoRedo, 'performUndo')
    useUiStore.setState({ activeView: 'cards', activeTemplateId: null })
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true })
    expect(undoSpy).not.toHaveBeenCalled()
  })

  it('Ctrl+Y in designer view calls performRedo', () => {
    const redoSpy = vi.spyOn(undoRedo, 'performRedo')
    const templateId = useProjectStore.getState().project?.templates[0].id ?? ''
    useUiStore.setState({ activeView: 'designer', activeTemplateId: templateId })
    render(<App />)
    fireEvent.keyDown(window, { key: 'y', ctrlKey: true })
    expect(redoSpy).toHaveBeenCalledWith(templateId)
  })

  it('Ctrl+Shift+Z in designer view calls performRedo', () => {
    const redoSpy = vi.spyOn(undoRedo, 'performRedo')
    const templateId = useProjectStore.getState().project?.templates[0].id ?? ''
    useUiStore.setState({ activeView: 'designer', activeTemplateId: templateId })
    render(<App />)
    fireEvent.keyDown(window, { key: 'z', ctrlKey: true, shiftKey: true })
    expect(redoSpy).toHaveBeenCalledWith(templateId)
  })
})

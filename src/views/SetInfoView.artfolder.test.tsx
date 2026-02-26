import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SetInfoView } from './SetInfoView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

const mockElectronAPI = {
  showOpenDialog: vi.fn(),
}
Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true })

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('SetInfoView — art folder selector', () => {
  beforeEach(() => {
    setup()
    vi.clearAllMocks()
  })

  it('renders a "Select Art Folder" button', () => {
    render(<SetInfoView />)
    expect(screen.getByRole('button', { name: /select art folder/i })).toBeInTheDocument()
  })

  it('shows the current artFolderPath when set', () => {
    useProjectStore.getState().setArtFolderPath('/home/user/art')
    render(<SetInfoView />)
    expect(screen.getByText('/home/user/art')).toBeInTheDocument()
  })

  it('shows "(none)" when artFolderPath is empty', () => {
    render(<SetInfoView />)
    expect(screen.getByText('(none)')).toBeInTheDocument()
  })

  it('clicking button opens a directory dialog and stores the path', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue('/home/user/new-art')
    render(<SetInfoView />)
    await userEvent.click(screen.getByRole('button', { name: /select art folder/i }))
    expect(mockElectronAPI.showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ properties: expect.arrayContaining(['openDirectory']) }),
    )
    expect(useProjectStore.getState().project!.artFolderPath).toBe('/home/user/new-art')
  })

  it('does nothing if dialog is cancelled', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue(null)
    render(<SetInfoView />)
    await userEvent.click(screen.getByRole('button', { name: /select art folder/i }))
    expect(useProjectStore.getState().project!.artFolderPath).toBe('')
  })
})

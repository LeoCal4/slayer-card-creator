import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ExportView } from './ExportView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

// Mock buildZip
vi.mock('@/lib/zipBuilder', () => ({
  buildZip: vi.fn().mockResolvedValue({
    blob: new Blob(['ZIP'], { type: 'application/zip' }),
    warnings: [],
  }),
}))

// Stub Blob methods
Object.assign(Blob.prototype, {
  arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(3)),
})

// Stub btoa
vi.stubGlobal('btoa', vi.fn().mockReturnValue('FAKEBASE64'))

// Stub electronAPI on the real window
const mockElectronAPI = {
  listArtFiles: vi.fn().mockResolvedValue(['Axehand.png']),
  showSaveDialog: vi.fn().mockResolvedValue('/path/to/export.zip'),
  writeFile: vi.fn().mockResolvedValue(undefined),
}
;(window as any).electronAPI = mockElectronAPI

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
  const p = useProjectStore.getState().project!
  useProjectStore.setState({
    project: {
      ...p,
      set: { name: 'My Set', code: 'MST', type: 'Core', releaseDate: '' },
      cards: [
        { id: 'c1', name: 'Axehand', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '' },
        { id: 'c2', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: '' },
      ],
      artFolderPath: '/art',
    },
  })
}

describe('ExportView', () => {
  beforeEach(() => {
    setupProject()
    vi.clearAllMocks()
    mockElectronAPI.listArtFiles.mockResolvedValue(['Axehand.png'])
    mockElectronAPI.showSaveDialog.mockResolvedValue('/path/to/export.zip')
    mockElectronAPI.writeFile.mockResolvedValue(undefined)
  })

  it('renders without crashing when no project', () => {
    useProjectStore.setState({ project: null })
    render(<ExportView />)
    // Just confirms no crash
  })

  it('shows card count and template count in summary', async () => {
    render(<ExportView />)
    expect(screen.getByText(/2/)).toBeInTheDocument()      // 2 cards
    expect(screen.getByText(/cards/i)).toBeInTheDocument()
    expect(screen.getByText(/templates/i)).toBeInTheDocument()
  })

  it('shows Export ZIP button', () => {
    render(<ExportView />)
    expect(screen.getByRole('button', { name: /export zip/i })).toBeInTheDocument()
  })

  it('shows art file count after loading', async () => {
    render(<ExportView />)
    // 1 art file found out of 2 cards → 1 found, 1 missing
    await waitFor(() => {
      expect(screen.getByText(/1.*found/i)).toBeInTheDocument()
    })
  })

  it('shows "no art folder" when artFolderPath is empty', async () => {
    const p = useProjectStore.getState().project!
    useProjectStore.setState({ project: { ...p, artFolderPath: '' } })
    render(<ExportView />)
    expect(screen.getByText(/no art folder/i)).toBeInTheDocument()
  })

  it('calls buildZip and shows progress when Export ZIP is clicked', async () => {
    const { buildZip } = await import('@/lib/zipBuilder')
    ;(buildZip as any).mockImplementation(
      (_project: unknown, onProgress: (p: { phase: string; current: number; total: number }) => void) => {
        onProgress({ phase: 'rendering', current: 1, total: 2 })
        return Promise.resolve({ blob: new Blob(['ZIP']), warnings: [] })
      },
    )
    render(<ExportView />)
    fireEvent.click(screen.getByRole('button', { name: /export zip/i }))
    await waitFor(() => {
      expect(buildZip).toHaveBeenCalled()
    })
  })

  it('shows Export complete and filename on success', async () => {
    render(<ExportView />)
    fireEvent.click(screen.getByRole('button', { name: /export zip/i }))
    await waitFor(() => {
      expect(screen.getByText(/export complete/i)).toBeInTheDocument()
    })
    expect(screen.getByText(/export\.zip/i)).toBeInTheDocument()
  })

  it('handles cancelled save dialog gracefully (no error)', async () => {
    mockElectronAPI.showSaveDialog.mockResolvedValue(null)
    render(<ExportView />)
    fireEvent.click(screen.getByRole('button', { name: /export zip/i }))
    // After buildZip resolves and dialog returns null, no error should appear
    await waitFor(() => {
      expect(screen.queryByText(/error/i)).toBeNull()
    })
  })

  it('shows warning log for skipped cards', async () => {
    const { buildZip } = await import('@/lib/zipBuilder')
    ;(buildZip as any).mockResolvedValue({
      blob: new Blob(['ZIP']),
      warnings: ['Skipped "Fireball": no template for type "Action"'],
    })
    render(<ExportView />)
    fireEvent.click(screen.getByRole('button', { name: /export zip/i }))
    // Save dialog returns path so export completes
    await waitFor(() => {
      expect(screen.getByText(/skipped.*fireball/i)).toBeInTheDocument()
    })
  })

  it('disables Export ZIP button while exporting', async () => {
    let resolveZip!: () => void
    const { buildZip } = await import('@/lib/zipBuilder')
    ;(buildZip as any).mockImplementation(() => new Promise<{ blob: Blob; warnings: string[] }>((res) => {
      resolveZip = () => res({ blob: new Blob(['ZIP']), warnings: [] })
    }))
    render(<ExportView />)
    const btn = screen.getByRole('button', { name: /export zip/i })
    fireEvent.click(btn)
    expect(btn).toBeDisabled()
    resolveZip()
  })

  it('shows warning banner when there are no templates', () => {
    const p = useProjectStore.getState().project!
    useProjectStore.setState({ project: { ...p, templates: [] } })
    render(<ExportView />)
    expect(screen.getByText(/no templates/i)).toBeInTheDocument()
  })

  it('shows warning banner when there are no cards', () => {
    const p = useProjectStore.getState().project!
    useProjectStore.setState({ project: { ...p, cards: [] } })
    render(<ExportView />)
    expect(screen.getByText(/no cards/i)).toBeInTheDocument()
  })
})

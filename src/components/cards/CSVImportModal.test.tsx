import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CSVImportModal } from './CSVImportModal'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

const VALID_CSV = `name,class,type,rarity,effect
Fireball,Mage,Action,common,Deal 3 damage.
Iceball,Mage,Action,rare,Freeze.`

const ERROR_CSV = `name,class,type,rarity,effect
Fireball,Mage,Action,common,Deal 3 damage.
BadRow,Mage,INVALID,common,Nope.`

function resetStores() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, projectFilePath: null })
  useProjectStore.getState().newProject()
}

beforeEach(() => {
  resetStores()
  window.electronAPI = {
    showOpenDialog: vi.fn().mockResolvedValue('/data/cards.csv'),
    showSaveDialog: vi.fn(),
    readFile: vi.fn().mockResolvedValue(VALID_CSV),
    writeFile: vi.fn(),
    readArtFile: vi.fn(),
    listArtFiles: vi.fn(),
    getRecentProjects: vi.fn(),
    addRecentProject: vi.fn().mockResolvedValue(undefined),
  }
})

describe('CSVImportModal', () => {
  it('renders an "Import CSV" button', () => {
    render(<CSVImportModal />)
    expect(screen.getByRole('button', { name: /import csv/i })).toBeInTheDocument()
  })

  it('renders a delimiter selector with comma and tab options', () => {
    render(<CSVImportModal />)
    const select = screen.getByRole('combobox', { name: /delimiter/i })
    expect(select).toBeInTheDocument()
    expect(select).toHaveValue(',')
  })

  it('parses tab-delimited CSV when tab delimiter is selected', async () => {
    const tsv = 'name\tclass\ttype\trarity\teffect\nFireball\tMage\tAction\tcommon\tDraw.'
    ;(window.electronAPI.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(tsv)
    render(<CSVImportModal />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /delimiter/i }), '\t')
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await vi.waitFor(() =>
      expect(useProjectStore.getState().project!.cards).toHaveLength(1),
    )
  })

  it('calls showOpenDialog when "Import CSV" is clicked', async () => {
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    expect(window.electronAPI.showOpenDialog).toHaveBeenCalledWith(
      expect.objectContaining({ filters: expect.arrayContaining([expect.objectContaining({ extensions: ['csv'] })]) }),
    )
  })

  it('does nothing if dialog is cancelled', async () => {
    ;(window.electronAPI.showOpenDialog as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    expect(window.electronAPI.readFile).not.toHaveBeenCalled()
  })

  it('imports cards directly when no errors and no existing cards', async () => {
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await vi.waitFor(() =>
      expect(useProjectStore.getState().project!.cards).toHaveLength(2),
    )
  })

  it('shows error dialog when CSV has parse errors', async () => {
    ;(window.electronAPI.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(ERROR_CSV)
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    expect(screen.getByText(/INVALID/i)).toBeInTheDocument()
  })

  it('"Proceed" in error dialog imports the valid rows', async () => {
    ;(window.electronAPI.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(ERROR_CSV)
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /proceed/i }))
    expect(useProjectStore.getState().project!.cards).toHaveLength(1)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('"Cancel" in error dialog discards pending import', async () => {
    ;(window.electronAPI.readFile as ReturnType<typeof vi.fn>).mockResolvedValue(ERROR_CSV)
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(useProjectStore.getState().project!.cards).toHaveLength(0)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('shows merge dialog when existing cards are present', async () => {
    useProjectStore.getState().addCard({
      id: 'ex-1', name: 'Existing', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Old.',
    })
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    expect(screen.getByRole('button', { name: /replace all/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /merge/i })).toBeInTheDocument()
  })

  it('"Replace All" replaces all existing cards', async () => {
    useProjectStore.getState().addCard({
      id: 'ex-1', name: 'Existing', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Old.',
    })
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /replace all/i }))
    expect(useProjectStore.getState().project!.cards).toHaveLength(2)
    expect(useProjectStore.getState().project!.cards.every((c) => c.name !== 'Existing')).toBe(true)
  })

  it('"Merge by Name" updates matching cards and appends new ones', async () => {
    useProjectStore.getState().addCard({
      id: 'ex-1', name: 'Fireball', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Old effect.',
    })
    render(<CSVImportModal />)
    await userEvent.click(screen.getByRole('button', { name: /import csv/i }))
    await screen.findByRole('dialog')
    await userEvent.click(screen.getByRole('button', { name: /merge/i }))
    const cards = useProjectStore.getState().project!.cards
    expect(cards).toHaveLength(2)
    const fireball = cards.find((c) => c.name === 'Fireball')
    expect(fireball?.id).toBe('ex-1')
    expect(fireball?.effect).toBe('Deal 3 damage.')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CsvColumnEditor } from './CsvColumnEditor'
import { useProjectStore, DEFAULT_CSV_COLUMNS } from '@/store/projectStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useProjectStore.getState().newProject()
}

function getCols() {
  return useProjectStore.getState().project!.csvColumns ?? []
}

describe('CsvColumnEditor', () => {
  beforeEach(setupProject)

  // ── rendering ─────────────────────────────────────────────────────────────

  it('renders null when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    const { container } = render(<CsvColumnEditor />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders a row for each default csv column', () => {
    render(<CsvColumnEditor />)
    expect(screen.getByDisplayValue('name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('effect')).toBeInTheDocument()
    expect(screen.getByDisplayValue('cost')).toBeInTheDocument()
  })

  it('renders the column type dropdown for each column', () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects.length).toBe(DEFAULT_CSV_COLUMNS.length)
  })

  it('shows "text" as the selected type for the name column', () => {
    render(<CsvColumnEditor />)
    const typeSelect = screen.getAllByRole('combobox', { name: /column type/i })[0]
    expect(typeSelect).toHaveValue('text')
  })

  it('shows "number" as the selected type for the cost column', () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'cost')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects[colIndex]).toHaveValue('number')
  })

  it('shows "select-type" as the selected type for the type column', () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'type')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects[colIndex]).toHaveValue('select-type')
  })

  it('shows "select-rarity" as the selected type for the rarity column', () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'rarity')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects[colIndex]).toHaveValue('select-rarity')
  })

  // ── dropdown options ──────────────────────────────────────────────────────

  it('type dropdown contains all five type options', () => {
    render(<CsvColumnEditor />)
    const firstDropdown = screen.getAllByRole('combobox', { name: /column type/i })[0]
    const options = Array.from(firstDropdown.querySelectorAll('option')).map((o) => o.value)
    expect(options).toContain('text')
    expect(options).toContain('number')
    expect(options).toContain('select')
    expect(options).toContain('select-type')
    expect(options).toContain('select-rarity')
  })

  // ── select-type / select-rarity read-only display ─────────────────────────

  it('"select-type" column shows current card types as read-only indicators', () => {
    render(<CsvColumnEditor />)
    // The default project has card types including 'Slayer' and 'Action'
    const cardTypes = useProjectStore.getState().project!.cardTypes
    expect(cardTypes.length).toBeGreaterThan(0)
    // At least one card type should be visible as a read-only indicator
    expect(screen.getByText(cardTypes[0])).toBeInTheDocument()
  })

  it('"select-rarity" column shows rarity values as read-only indicators', () => {
    render(<CsvColumnEditor />)
    // common/rare/epic should appear from the read-only rarity display
    expect(screen.getByText('common')).toBeInTheDocument()
    expect(screen.getByText('rare')).toBeInTheDocument()
    expect(screen.getByText('epic')).toBeInTheDocument()
  })

  it('"select-type" and "select-rarity" columns do not show an editable "Add choice" input', () => {
    render(<CsvColumnEditor />)
    // No plain 'select' columns in defaults — only select-type and select-rarity
    const choiceInputs = screen.queryAllByPlaceholderText(/add choice/i)
    expect(choiceInputs).toHaveLength(0)
  })

  it('"select-type" read-only tags have no remove button', () => {
    render(<CsvColumnEditor />)
    const firstCardType = useProjectStore.getState().project!.cardTypes[0]
    // The card type label appears but has no associated "Remove" button
    expect(screen.queryByRole('button', { name: new RegExp(`remove.*${firstCardType}`, 'i') })).not.toBeInTheDocument()
  })

  it('"select-rarity" read-only tags have no remove button', () => {
    render(<CsvColumnEditor />)
    expect(screen.queryByRole('button', { name: /remove.*common/i })).not.toBeInTheDocument()
  })

  // ── add column ─────────────────────────────────────────────────────────────

  it('"Add Column" button appends a new column to the store', async () => {
    render(<CsvColumnEditor />)
    const before = getCols().length
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    expect(getCols()).toHaveLength(before + 1)
  })

  it('newly added column has type "text"', async () => {
    render(<CsvColumnEditor />)
    await userEvent.click(screen.getByRole('button', { name: /add column/i }))
    const cols = getCols()
    expect(cols[cols.length - 1].type).toBe('text')
  })

  // ── rename column ──────────────────────────────────────────────────────────

  it('blurring a changed name input updates the column name in the store', async () => {
    render(<CsvColumnEditor />)
    const nameInput = screen.getByDisplayValue('name')
    await userEvent.clear(nameInput)
    await userEvent.type(nameInput, 'card_name')
    await userEvent.tab()
    const col = getCols().find((c) => c.id === DEFAULT_CSV_COLUMNS[0].id)
    expect(col?.name).toBe('card_name')
  })

  it('blurring with empty input reverts to previous name', async () => {
    render(<CsvColumnEditor />)
    const nameInput = screen.getByDisplayValue('name')
    await userEvent.clear(nameInput)
    await userEvent.tab()
    expect(nameInput).toHaveValue('name')
  })

  // ── change type ────────────────────────────────────────────────────────────

  it('changing type dropdown to "number" updates the store', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    await userEvent.selectOptions(typeSelects[0], 'number')
    expect(getCols()[0].type).toBe('number')
  })

  it('changing type to "select" shows the choices editor', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    // change first column (name, text) to select
    await userEvent.selectOptions(typeSelects[0], 'select')
    // exactly 1 editable choices input (only the newly-changed column)
    expect(screen.getAllByPlaceholderText(/add choice/i)).toHaveLength(1)
  })

  it('changing type from "select" to "text" hides the choices editor', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    // switch first column to 'select' first, then back to 'text'
    await userEvent.selectOptions(typeSelects[0], 'select')
    expect(screen.getAllByPlaceholderText(/add choice/i)).toHaveLength(1)
    await userEvent.selectOptions(typeSelects[0], 'text')
    expect(screen.queryAllByPlaceholderText(/add choice/i)).toHaveLength(0)
  })

  it('changing type to "select-type" shows read-only card types and hides choices editor', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    // change 'name' column (text) to 'select-type'
    await userEvent.selectOptions(typeSelects[0], 'select-type')
    expect(screen.queryAllByPlaceholderText(/add choice/i)).toHaveLength(0)
    // card types should be visible
    const cardTypes = useProjectStore.getState().project!.cardTypes
    expect(screen.getAllByText(cardTypes[0]).length).toBeGreaterThan(0)
  })

  it('changing type to "select-rarity" shows read-only rarities and hides choices editor', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    await userEvent.selectOptions(typeSelects[0], 'select-rarity')
    expect(screen.queryAllByPlaceholderText(/add choice/i)).toHaveLength(0)
  })

  it('changing from "select-type" updates the store type', async () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'type')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    await userEvent.selectOptions(typeSelects[colIndex], 'text')
    expect(getCols().find((c) => c.name === 'type')?.type).toBe('text')
  })

  // ── plain "select" column choices editor ───────────────────────────────────

  describe('plain "select" column choices editor', () => {
    let selectColId: string

    beforeEach(async () => {
      useProjectStore.getState().addCsvColumn()
      const cols = getCols()
      const newCol = cols[cols.length - 1]
      selectColId = newCol.id
      useProjectStore.getState().updateCsvColumn(newCol.id, {
        name: 'status',
        type: 'select',
        choices: [],
      })
    })

    it('can add a choice to a select column via the Add button', async () => {
      render(<CsvColumnEditor />)
      const choiceInput = screen.getByPlaceholderText(/add choice/i)
      await userEvent.type(choiceInput, 'active')
      await userEvent.click(screen.getByRole('button', { name: /^add choice$/i }))
      expect(getCols().find((c) => c.id === selectColId)?.choices).toContain('active')
    })

    it('can add a choice via Enter key', async () => {
      render(<CsvColumnEditor />)
      const choiceInput = screen.getByPlaceholderText(/add choice/i)
      await userEvent.type(choiceInput, 'draft{Enter}')
      expect(getCols().find((c) => c.id === selectColId)?.choices).toContain('draft')
    })

    it('clears the choice input after adding', async () => {
      render(<CsvColumnEditor />)
      const choiceInput = screen.getByPlaceholderText(/add choice/i)
      await userEvent.type(choiceInput, 'active{Enter}')
      expect(choiceInput).toHaveValue('')
    })

    it('does not add duplicate choices', async () => {
      useProjectStore.getState().updateCsvColumn(selectColId, { choices: ['active'] })
      render(<CsvColumnEditor />)
      const choiceInput = screen.getByPlaceholderText(/add choice/i)
      await userEvent.type(choiceInput, 'active{Enter}')
      expect(getCols().find((c) => c.id === selectColId)?.choices?.filter((c) => c === 'active')).toHaveLength(1)
    })

    it('can remove a choice via its × button', async () => {
      useProjectStore.getState().updateCsvColumn(selectColId, { choices: ['active', 'draft'] })
      render(<CsvColumnEditor />)
      await userEvent.click(screen.getByRole('button', { name: /remove "active"/i }))
      expect(getCols().find((c) => c.id === selectColId)?.choices).not.toContain('active')
    })
  })

  // ── delete column ──────────────────────────────────────────────────────────

  it('"Delete" button removes the column from the store', async () => {
    render(<CsvColumnEditor />)
    const col = getCols()[0]
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`delete.*${col.name}`, 'i') }))
    expect(getCols().find((c) => c.id === col.id)).toBeUndefined()
  })
})

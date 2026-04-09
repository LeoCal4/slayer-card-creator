import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CsvColumnEditor } from './CsvColumnEditor'
import { useProjectStore } from '@/store/projectStore'
import { DEFAULT_CSV_COLUMNS } from '@/store/projectStore'

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
    // Each column has a name input; check that default column names appear
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
    // name column is type 'text'
    const nameInput = screen.getByDisplayValue('name')
    const row = nameInput.closest('[data-testid]') ?? nameInput.parentElement!.parentElement!
    // find the type select near the name input
    const typeSelect = screen.getAllByRole('combobox', { name: /column type/i })[0]
    expect(typeSelect).toHaveValue('text')
  })

  it('shows "number" as the selected type for the cost column', () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'cost')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects[colIndex]).toHaveValue('number')
  })

  it('shows "select" as the selected type for the rarity column', () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'rarity')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    expect(typeSelects[colIndex]).toHaveValue('select')
  })

  // ── choices editor visible for select type ─────────────────────────────────

  it('shows choices editor for the rarity column (default select type)', () => {
    render(<CsvColumnEditor />)
    // rarity column has choices: common, rare, epic
    expect(screen.getByText('common')).toBeInTheDocument()
    expect(screen.getByText('rare')).toBeInTheDocument()
    expect(screen.getByText('epic')).toBeInTheDocument()
  })

  it('does not show choices editor for text-type columns', () => {
    render(<CsvColumnEditor />)
    // 'Add choice' input should appear only for select columns (rarity by default)
    const choiceInputs = screen.queryAllByPlaceholderText(/add choice/i)
    // only 1 by default (rarity column)
    expect(choiceInputs).toHaveLength(1)
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
    // change first column (name, text) to number
    await userEvent.selectOptions(typeSelects[0], 'number')
    expect(getCols()[0].type).toBe('number')
  })

  it('changing type to "select" shows the choices editor', async () => {
    render(<CsvColumnEditor />)
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    // change first column (name, text) to select
    await userEvent.selectOptions(typeSelects[0], 'select')
    // now there should be 2 choice inputs (original rarity + new one)
    const choiceInputs = screen.getAllByPlaceholderText(/add choice/i)
    expect(choiceInputs.length).toBeGreaterThan(1)
  })

  it('changing type from "select" to "text" hides the choices editor', async () => {
    render(<CsvColumnEditor />)
    const colIndex = DEFAULT_CSV_COLUMNS.findIndex((c) => c.name === 'rarity')
    const typeSelects = screen.getAllByRole('combobox', { name: /column type/i })
    await userEvent.selectOptions(typeSelects[colIndex], 'text')
    // choices editor for rarity should now be hidden
    const choiceInputs = screen.queryAllByPlaceholderText(/add choice/i)
    expect(choiceInputs).toHaveLength(0)
  })

  // ── add / remove choices ───────────────────────────────────────────────────

  it('can add a choice to a select column via the Add button', async () => {
    render(<CsvColumnEditor />)
    const choiceInput = screen.getByPlaceholderText(/add choice/i)
    await userEvent.type(choiceInput, 'legendary')
    await userEvent.click(screen.getByRole('button', { name: /^add choice$/i }))
    const rarityCol = getCols().find((c) => c.name === 'rarity')
    expect(rarityCol?.choices).toContain('legendary')
  })

  it('can add a choice via Enter key', async () => {
    render(<CsvColumnEditor />)
    const choiceInput = screen.getByPlaceholderText(/add choice/i)
    await userEvent.type(choiceInput, 'mythic{Enter}')
    const rarityCol = getCols().find((c) => c.name === 'rarity')
    expect(rarityCol?.choices).toContain('mythic')
  })

  it('clears the choice input after adding', async () => {
    render(<CsvColumnEditor />)
    const choiceInput = screen.getByPlaceholderText(/add choice/i)
    await userEvent.type(choiceInput, 'legendary{Enter}')
    expect(choiceInput).toHaveValue('')
  })

  it('does not add duplicate choices', async () => {
    render(<CsvColumnEditor />)
    const choiceInput = screen.getByPlaceholderText(/add choice/i)
    await userEvent.type(choiceInput, 'common{Enter}')
    const rarityCol = getCols().find((c) => c.name === 'rarity')
    expect(rarityCol?.choices?.filter((c) => c === 'common')).toHaveLength(1)
  })

  it('can remove a choice via its × button', async () => {
    render(<CsvColumnEditor />)
    await userEvent.click(screen.getByRole('button', { name: /remove "common"/i }))
    const rarityCol = getCols().find((c) => c.name === 'rarity')
    expect(rarityCol?.choices).not.toContain('common')
  })

  // ── delete column ──────────────────────────────────────────────────────────

  it('"Delete" button removes the column from the store', async () => {
    render(<CsvColumnEditor />)
    const col = getCols()[0]
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`delete.*${col.name}`, 'i') }))
    expect(getCols().find((c) => c.id === col.id)).toBeUndefined()
  })
})

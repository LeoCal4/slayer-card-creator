import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { EffectFormattingEditor } from './EffectFormattingEditor'
import { useProjectStore } from '@/store/projectStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useProjectStore.getState().newProject()
}

function getFormatting() {
  return useProjectStore.getState().project!.set.effectFormatting!
}

describe('EffectFormattingEditor', () => {
  beforeEach(setupProject)

  // ── rendering ──────────────────────────────────────────────────────────────

  it('renders without crashing when project exists', () => {
    render(<EffectFormattingEditor />)
    expect(screen.getByText(/always bold/i)).toBeInTheDocument()
    expect(screen.getByText(/always italic/i)).toBeInTheDocument()
  })

  it('renders null when there is no project', () => {
    useProjectStore.setState({ project: null })
    const { container } = render(<EffectFormattingEditor />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows "No terms yet" placeholder when both lists are empty', () => {
    render(<EffectFormattingEditor />)
    const placeholders = screen.getAllByText(/no terms yet/i)
    expect(placeholders).toHaveLength(2)
  })

  it('displays the red-number hint text', () => {
    render(<EffectFormattingEditor />)
    expect(screen.getByText(/always rendered in red/i)).toBeInTheDocument()
  })

  // ── adding bold terms ──────────────────────────────────────────────────────

  it('adds a bold term when the Add button is clicked', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike')
    await userEvent.click(screen.getAllByRole('button', { name: /^add$/i })[0])
    expect(getFormatting().boldTerms).toContain('Strike')
  })

  it('adds a bold term when Enter is pressed', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Parry{Enter}')
    expect(getFormatting().boldTerms).toContain('Parry')
  })

  it('trims whitespace when adding a bold term', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, '  Guard  {Enter}')
    expect(getFormatting().boldTerms).toContain('Guard')
  })

  it('does not add a duplicate bold term', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike{Enter}')
    await userEvent.type(boldInput, 'Strike{Enter}')
    expect(getFormatting().boldTerms.filter((t) => t === 'Strike')).toHaveLength(1)
  })

  it('does not add an empty bold term', async () => {
    render(<EffectFormattingEditor />)
    await userEvent.click(screen.getAllByRole('button', { name: /^add$/i })[0])
    expect(getFormatting().boldTerms).toHaveLength(0)
  })

  it('clears the bold input field after adding', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike{Enter}')
    expect(boldInput).toHaveValue('')
  })

  // ── removing bold terms ────────────────────────────────────────────────────

  it('removes a bold term when the × button is clicked', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike{Enter}')
    expect(getFormatting().boldTerms).toContain('Strike')

    const removeBtn = screen.getByRole('button', { name: /remove "strike"/i })
    await userEvent.click(removeBtn)
    expect(getFormatting().boldTerms).not.toContain('Strike')
  })

  it('renders added bold term as a tag on screen', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Charge{Enter}')
    expect(screen.getByText('Charge')).toBeInTheDocument()
  })

  // ── adding italic terms ────────────────────────────────────────────────────

  it('adds an italic term when the Add button is clicked', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    const italicInput = inputs[1]
    await userEvent.type(italicInput, 'Haste')
    await userEvent.click(screen.getAllByRole('button', { name: /^add$/i })[1])
    expect(getFormatting().italicTerms).toContain('Haste')
  })

  it('adds an italic term when Enter is pressed', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Stealth{Enter}')
    expect(getFormatting().italicTerms).toContain('Stealth')
  })

  it('trims whitespace when adding an italic term', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], '  Evade  {Enter}')
    expect(getFormatting().italicTerms).toContain('Evade')
  })

  it('does not add a duplicate italic term', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Haste{Enter}')
    await userEvent.type(inputs[1], 'Haste{Enter}')
    expect(getFormatting().italicTerms.filter((t) => t === 'Haste')).toHaveLength(1)
  })

  it('does not add an empty italic term', async () => {
    render(<EffectFormattingEditor />)
    await userEvent.click(screen.getAllByRole('button', { name: /^add$/i })[1])
    expect(getFormatting().italicTerms).toHaveLength(0)
  })

  it('clears the italic input field after adding', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Haste{Enter}')
    expect(inputs[1]).toHaveValue('')
  })

  // ── removing italic terms ──────────────────────────────────────────────────

  it('removes an italic term when the × button is clicked', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Stealth{Enter}')
    expect(getFormatting().italicTerms).toContain('Stealth')

    const removeBtn = screen.getByRole('button', { name: /remove "stealth"/i })
    await userEvent.click(removeBtn)
    expect(getFormatting().italicTerms).not.toContain('Stealth')
  })

  it('renders added italic term as a tag on screen', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Haste{Enter}')
    expect(screen.getByText('Haste')).toBeInTheDocument()
  })

  // ── bold and italic lists stay independent ─────────────────────────────────

  it('adding a bold term does not affect the italic list', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike{Enter}')
    expect(getFormatting().italicTerms).toHaveLength(0)
  })

  it('adding an italic term does not affect the bold list', async () => {
    render(<EffectFormattingEditor />)
    const inputs = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(inputs[1], 'Haste{Enter}')
    expect(getFormatting().boldTerms).toHaveLength(0)
  })

  it('can add the same word to both bold and italic lists independently', async () => {
    render(<EffectFormattingEditor />)
    const [boldInput, italicInput] = screen.getAllByPlaceholderText(/add term/i)
    await userEvent.type(boldInput, 'Strike{Enter}')
    await userEvent.type(italicInput, 'Strike{Enter}')
    expect(getFormatting().boldTerms).toContain('Strike')
    expect(getFormatting().italicTerms).toContain('Strike')
  })
})

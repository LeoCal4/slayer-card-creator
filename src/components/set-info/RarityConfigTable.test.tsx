import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RarityConfigTable } from './RarityConfigTable'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('RarityConfigTable', () => {
  beforeEach(setupProject)

  it('renders a row for each rarity', () => {
    render(<RarityConfigTable />)
    expect(screen.getByText(/common/i)).toBeInTheDocument()
    expect(screen.getByText(/rare/i)).toBeInTheDocument()
    expect(screen.getByText(/epic/i)).toBeInTheDocument()
  })

  it('shows the aliases input for each rarity', () => {
    render(<RarityConfigTable />)
    const aliasInputs = screen.getAllByRole('textbox', { name: /aliases/i })
    expect(aliasInputs).toHaveLength(3)
  })

  it('shows a color picker swatch for each rarity', () => {
    render(<RarityConfigTable />)
    const swatches = screen.getAllByRole('button', { name: /open color picker/i })
    expect(swatches).toHaveLength(3)
  })

  it('displays default alias for common (comune)', () => {
    render(<RarityConfigTable />)
    const aliasInputs = screen.getAllByRole('textbox', { name: /aliases/i })
    const commonRow = aliasInputs[0]
    expect(commonRow).toHaveValue('comune')
  })

  it('updating aliases for common saves to store', async () => {
    render(<RarityConfigTable />)
    const aliasInputs = screen.getAllByRole('textbox', { name: /aliases/i })
    await userEvent.clear(aliasInputs[0])
    await userEvent.type(aliasInputs[0], 'comun')
    expect(useProjectStore.getState().project!.rarityConfig.common.aliases).toContain('comun')
  })

  it('updating color for rare saves to store', () => {
    render(<RarityConfigTable />)
    const swatches = screen.getAllByRole('button', { name: /open color picker/i })
    const rareColorInput = swatches[1].nextElementSibling as HTMLInputElement
    fireEvent.change(rareColorInput, { target: { value: '#ff0000' } })
    expect(useProjectStore.getState().project!.rarityConfig.rare.color).toBe('#ff0000')
  })
})

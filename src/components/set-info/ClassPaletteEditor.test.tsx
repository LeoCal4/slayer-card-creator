import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ClassPaletteEditor } from './ClassPaletteEditor'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

describe('ClassPaletteEditor', () => {
  beforeEach(setupProject)

  it('renders one row per class', () => {
    render(<ClassPaletteEditor />)
    const classes = Object.keys(useProjectStore.getState().project!.classColors)
    classes.forEach((name) => {
      expect(screen.getByDisplayValue(name)).toBeInTheDocument()
    })
  })

  it('changing the cockatrice color field updates the store', async () => {
    render(<ClassPaletteEditor />)
    const input = screen.getByRole('textbox', { name: /mage cockatrice/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'UU')
    expect(useProjectStore.getState().project!.classColors['Mage'].cockatriceColor).toBe('UU')
  })

  it('changing the primary color swatch updates the store', () => {
    render(<ClassPaletteEditor />)
    render(<ClassPaletteEditor />)
    // Test via the color input directly — find by aria-label on the swatch section
    const primaryColorInput = screen.getAllByRole('button', { name: /open color picker/i })[0]
      .nextElementSibling as HTMLInputElement
    fireEvent.change(primaryColorInput, { target: { value: '#aabbcc' } })
    const colors = Object.values(useProjectStore.getState().project!.classColors)
    expect(colors.some((c) => c.primary === '#aabbcc')).toBe(true)
  })

  it('"Add Class" button adds a new class entry', async () => {
    const initial = Object.keys(useProjectStore.getState().project!.classColors).length
    render(<ClassPaletteEditor />)
    await userEvent.click(screen.getByRole('button', { name: /add class/i }))
    expect(Object.keys(useProjectStore.getState().project!.classColors)).toHaveLength(initial + 1)
  })

  it('delete button removes the class', async () => {
    render(<ClassPaletteEditor />)
    const initial = Object.keys(useProjectStore.getState().project!.classColors).length
    await userEvent.click(screen.getByRole('button', { name: /delete mage/i }))
    expect(Object.keys(useProjectStore.getState().project!.classColors)).toHaveLength(initial - 1)
    expect(useProjectStore.getState().project!.classColors['Mage']).toBeUndefined()
  })
})

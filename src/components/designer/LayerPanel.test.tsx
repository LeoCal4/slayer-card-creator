import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LayerPanel } from './LayerPanel'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'

const TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Creature',
  cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 },
  layers: [
    { id: 'l1', type: 'rect', x: 0, y: 0, width: 375, height: 523, fill: '#222222', visible: true, locked: false },
    { id: 'l2', type: 'text', x: 10, y: 10, width: 200, height: 30, field: 'name', fontSize: 18, visible: true, locked: false },
    { id: 'l3', type: 'rect', x: 0, y: 400, width: 375, height: 123, fill: '#444444', visible: false, locked: true },
  ],
}

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: null })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('LayerPanel', () => {
  beforeEach(setup)

  it('renders a row for each layer', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    // 3 layers → 3 rows; check by visibility button count (one per layer)
    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(3)
  })

  it('shows field name as label for text layers, type for others', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    expect(screen.getAllByText(/rect/i)).toHaveLength(2)
    // text layer l2 has field='name' → label should be 'name', not 'text'
    expect(screen.getByText('name')).toBeInTheDocument()
  })

  it('clicking a row selects that layer', async () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const rows = screen.getAllByRole('listitem')
    await userEvent.click(rows[0])
    // layers are displayed bottom-to-top, so row[0] = last layer (l3)
    expect(useUiStore.getState().selectedLayerId).toBe('l3')
  })

  it('highlights the selected layer row', () => {
    useUiStore.getState().setSelectedLayer('l2')
    render(<LayerPanel templateId="tmpl-1" />)
    const rows = screen.getAllByRole('listitem')
    // l2 is index 1 from bottom = row index 1 (middle)
    const selectedRow = rows[1]
    expect(selectedRow).toHaveAttribute('aria-selected', 'true')
  })

  it('visibility toggle button is present for each layer', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    expect(screen.getAllByRole('button', { name: /toggle visibility/i })).toHaveLength(3)
  })

  it('clicking visibility toggle flips visible flag', async () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const buttons = screen.getAllByRole('button', { name: /toggle visibility/i })
    // row 0 = l3 (visible:false) — clicking makes it true
    await userEvent.click(buttons[0])
    const tmpl = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!
    expect(tmpl.layers.find((l) => l.id === 'l3')!.visible).toBe(true)
  })

  it('lock toggle button is present for each layer', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    expect(screen.getAllByRole('button', { name: /toggle lock/i })).toHaveLength(3)
  })

  it('clicking lock toggle flips locked flag', async () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const buttons = screen.getAllByRole('button', { name: /toggle lock/i })
    // row 0 = l3 (locked:true) — clicking makes it false
    await userEvent.click(buttons[0])
    const tmpl = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!
    expect(tmpl.layers.find((l) => l.id === 'l3')!.locked).toBe(false)
  })

  it('renders a delete button for each layer', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    expect(screen.getAllByRole('button', { name: /delete layer/i })).toHaveLength(3)
  })

  it('clicking delete button removes the layer', async () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const buttons = screen.getAllByRole('button', { name: /delete layer/i })
    await userEvent.click(buttons[0]) // row 0 = l3
    const tmpl = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!
    expect(tmpl.layers.find((l) => l.id === 'l3')).toBeUndefined()
  })
})

describe('LayerPanel snapshot (task 82)', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: null })
    useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: null, undoStack: [], redoStack: [] })
    useProjectStore.getState().newProject()
    useProjectStore.getState().addTemplate(TEMPLATE)
  })

  it('deleting a layer pushes a snapshot', async () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const buttons = screen.getAllByRole('button', { name: /delete layer/i })
    await userEvent.click(buttons[0])
    expect(useUiStore.getState().undoStack).toHaveLength(1)
  })

  it('reordering layers pushes a snapshot', () => {
    render(<LayerPanel templateId="tmpl-1" />)
    const rows = screen.getAllByRole('listitem')
    // simulate drag-drop: dragStart on row[0], drop on row[2]
    fireEvent.dragStart(rows[0])
    fireEvent.dragOver(rows[2])
    fireEvent.drop(rows[2])
    expect(useUiStore.getState().undoStack).toHaveLength(1)
  })
})

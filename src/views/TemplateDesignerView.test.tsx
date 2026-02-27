import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import * as undoRedo from '@/lib/undoRedo'
import { TemplateDesignerView } from './TemplateDesignerView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'

const TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Creature',
  cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 },
  layers: [],
}

function setupWithTemplate() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: null })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
  useUiStore.getState().setActiveTemplate('tmpl-1')
}

describe('TemplateDesignerView', () => {
  beforeEach(setupWithTemplate)

  it('shows "no template selected" when activeTemplateId is null', () => {
    useUiStore.getState().setActiveTemplate(null)
    render(<TemplateDesignerView />)
    expect(screen.getByText(/no template selected/i)).toBeInTheDocument()
  })

  it('renders the template name in an editable input', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('textbox', { name: /template name/i })).toHaveValue('Creature')
  })

  it('editing the template name updates the store', async () => {
    render(<TemplateDesignerView />)
    const input = screen.getByRole('textbox', { name: /template name/i })
    await userEvent.clear(input)
    await userEvent.type(input, 'Spell')
    expect(useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.name).toBe('Spell')
  })

  it('renders width and height inputs with current canvas values', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('spinbutton', { name: /canvas width/i })).toHaveValue(375)
    expect(screen.getByRole('spinbutton', { name: /canvas height/i })).toHaveValue(523)
  })

  it('editing canvas width updates the store', async () => {
    render(<TemplateDesignerView />)
    const input = screen.getByRole('spinbutton', { name: /canvas width/i })
    await userEvent.clear(input)
    await userEvent.type(input, '400')
    expect(useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.canvas.width).toBe(400)
  })

  it('renders a checkbox for each card type', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('checkbox', { name: /slayer/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /errant/i })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: /action/i })).toBeInTheDocument()
  })

  it('checked card types reflect the template cardTypes', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('checkbox', { name: /slayer/i })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: /errant/i })).not.toBeChecked()
  })

  it('checking a card type adds it to the template', async () => {
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('checkbox', { name: /errant/i }))
    expect(useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.cardTypes).toContain('Errant')
  })

  it('unchecking a card type removes it from the template', async () => {
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('checkbox', { name: /slayer/i }))
    expect(useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.cardTypes).not.toContain('Slayer')
  })
})

describe('TemplateDesignerView — undo/redo toolbar buttons (task 84)', () => {
  beforeEach(() => {
    useProjectStore.setState({ project: null })
    useUiStore.setState({ isDirty: false, activeTemplateId: null, undoStack: [], redoStack: [] })
    useProjectStore.getState().newProject()
    useProjectStore.getState().addTemplate(TEMPLATE)
    useUiStore.getState().setActiveTemplate('tmpl-1')
    vi.spyOn(undoRedo, 'performUndo').mockImplementation(() => {})
    vi.spyOn(undoRedo, 'performRedo').mockImplementation(() => {})
  })

  it('Undo button is disabled when undoStack is empty', () => {
    useUiStore.setState({ undoStack: [], redoStack: [] })
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled()
  })

  it('Undo button is enabled when undoStack has entries', () => {
    useUiStore.setState({ undoStack: [[]], redoStack: [] })
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /undo/i })).not.toBeDisabled()
  })

  it('clicking Undo button calls performUndo', async () => {
    useUiStore.setState({ undoStack: [[]], redoStack: [] })
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('button', { name: /undo/i }))
    expect(undoRedo.performUndo).toHaveBeenCalledWith('tmpl-1')
  })

  it('Redo button is disabled when redoStack is empty', () => {
    useUiStore.setState({ undoStack: [], redoStack: [] })
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /redo/i })).toBeDisabled()
  })

  it('Redo button is enabled when redoStack has entries', () => {
    useUiStore.setState({ undoStack: [], redoStack: [[]] })
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /redo/i })).not.toBeDisabled()
  })

  it('clicking Redo button calls performRedo', async () => {
    useUiStore.setState({ undoStack: [], redoStack: [[]] })
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('button', { name: /redo/i }))
    expect(undoRedo.performRedo).toHaveBeenCalledWith('tmpl-1')
  })
})

describe('TemplateDesignerView — undo history cleared on template switch (task 83)', () => {
  const TEMPLATE2: Template = {
    id: 'tmpl-2',
    name: 'Spell',
    cardTypes: ['Action'],
    canvas: { width: 375, height: 523 },
    layers: [],
  }

  beforeEach(() => {
    useProjectStore.setState({ project: null })
    useUiStore.setState({ isDirty: false, activeTemplateId: null, undoStack: [], redoStack: [] })
    useProjectStore.getState().newProject()
    useProjectStore.getState().addTemplate(TEMPLATE)
    useProjectStore.getState().addTemplate(TEMPLATE2)
    useUiStore.getState().setActiveTemplate('tmpl-1')
  })

  it('switching activeTemplateId clears undo/redo history', () => {
    render(<TemplateDesignerView />)
    // seed the stacks
    useUiStore.setState({ undoStack: [[]], redoStack: [[]] })
    // switch to a different template
    act(() => { useUiStore.getState().setActiveTemplate('tmpl-2') })
    expect(useUiStore.getState().undoStack).toEqual([])
    expect(useUiStore.getState().redoStack).toEqual([])
  })
})

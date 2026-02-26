import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: null, snapGridEnabled: false, snapGridSize: 5 })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
  useUiStore.getState().setActiveTemplate('tmpl-1')
}

describe('TemplateDesignerView — snap controls', () => {
  beforeEach(setup)

  it('renders a Snap toggle button', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /snap/i })).toBeInTheDocument()
  })

  it('snap button shows off state by default', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('button', { name: /snap/i })).toHaveAttribute('aria-pressed', 'false')
  })

  it('clicking snap button enables snap', async () => {
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('button', { name: /snap/i }))
    expect(useUiStore.getState().snapGridEnabled).toBe(true)
  })

  it('clicking snap button again disables snap', async () => {
    useUiStore.setState({ snapGridEnabled: true })
    render(<TemplateDesignerView />)
    await userEvent.click(screen.getByRole('button', { name: /snap/i }))
    expect(useUiStore.getState().snapGridEnabled).toBe(false)
  })

  it('renders a grid size selector', () => {
    render(<TemplateDesignerView />)
    expect(screen.getByRole('combobox', { name: /grid size/i })).toBeInTheDocument()
  })

  it('grid size selector shows current snapGridSize', () => {
    useUiStore.setState({ snapGridSize: 10 })
    render(<TemplateDesignerView />)
    expect(screen.getByRole('combobox', { name: /grid size/i })).toHaveValue('10')
  })

  it('changing grid size updates uiStore', async () => {
    render(<TemplateDesignerView />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /grid size/i }), '1')
    expect(useUiStore.getState().snapGridSize).toBe(1)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AddLayerMenu } from './AddLayerMenu'
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
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('AddLayerMenu', () => {
  beforeEach(setup)

  it('renders "Add Layer" button', () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    expect(screen.getByRole('button', { name: /add layer/i })).toBeInTheDocument()
  })

  it('clicking the button opens a dropdown with all layer type options', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    expect(screen.getByRole('menuitem', { name: /^rect$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^text$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^image$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^badge$/i })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /^phase.icons$/i })).toBeInTheDocument()
  })

  it('clicking "Image" adds an image layer', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^image$/i }))
    const layers = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers
    expect(layers[0].type).toBe('image')
  })

  it('clicking "Badge" adds a badge layer', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^badge$/i }))
    const layers = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers
    expect(layers[0].type).toBe('badge')
  })

  it('clicking "Phase Icons" adds a phase-icons layer', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /^phase.icons$/i }))
    const layers = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers
    expect(layers[0].type).toBe('phase-icons')
  })

  it('clicking "Rect" adds a rect layer to the template', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /rect/i }))
    const layers = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers
    expect(layers).toHaveLength(1)
    expect(layers[0].type).toBe('rect')
  })

  it('clicking "Text" adds a text layer to the template', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /text/i }))
    const layers = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers
    expect(layers).toHaveLength(1)
    expect(layers[0].type).toBe('text')
  })

  it('dropdown closes after selecting a layer type', async () => {
    render(<AddLayerMenu templateId="tmpl-1" />)
    await userEvent.click(screen.getByRole('button', { name: /add layer/i }))
    await userEvent.click(screen.getByRole('menuitem', { name: /rect/i }))
    expect(screen.queryByRole('menuitem', { name: /rect/i })).not.toBeInTheDocument()
  })
})

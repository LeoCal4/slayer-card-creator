import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PropertiesPanel } from './PropertiesPanel'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'

const TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Creature',
  cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 },
  layers: [
    {
      id: 'rect-1',
      type: 'rect',
      x: 0, y: 0, width: 100, height: 50,
      fill: '#ff0000',
      visible: true,
      locked: false,
    },
  ],
}

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: 'rect-1' })
  useProjectStore.getState().newProject()
  const p = useProjectStore.getState().project!
  useProjectStore.setState({ project: { ...p, templates: [] } })
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('PropertiesPanel — layer label', () => {
  beforeEach(setup)

  it('renders a Layer Label text input', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('textbox', { name: /layer label/i })).toBeInTheDocument()
  })

  it('shows empty value when no label is set', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('textbox', { name: /layer label/i })).toHaveValue('')
  })

  it('shows existing label value', () => {
    useProjectStore.getState().updateLayer('tmpl-1', 'rect-1', { label: 'Background' })
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('textbox', { name: /layer label/i })).toHaveValue('Background')
  })

  it('editing the label updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    const input = screen.getByRole('textbox', { name: /layer label/i })
    await userEvent.type(input, 'bg')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers[0]
    expect(layer.label).toBe('bg')
  })
})

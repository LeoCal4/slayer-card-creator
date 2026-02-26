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
      x: 10, y: 20, width: 100, height: 50,
      fill: '#ff0000',
      cornerRadius: 4,
      stroke: '#000000',
      strokeWidth: 2,
      opacity: 0.8,
      visible: true,
      locked: false,
    },
    {
      id: 'text-1',
      type: 'text',
      x: 5, y: 15, width: 200, height: 30,
      field: 'name',
      fontSize: 18,
      fontFamily: 'Arial',
      fontStyle: 'bold',
      fill: '#ffffff',
      align: 'center',
      lineHeight: 1.2,
      visible: true,
      locked: false,
    },
  ],
}

function setup(selectedId: string | null = null) {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: selectedId })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('PropertiesPanel — no selection', () => {
  beforeEach(() => setup(null))

  it('shows nothing when no layer is selected', () => {
    const { container } = render(<PropertiesPanel templateId="tmpl-1" />)
    expect(container.firstChild).toBeNull()
  })
})

describe('PropertiesPanel — rect layer', () => {
  beforeEach(() => setup('rect-1'))

  it('renders x, y, width, height inputs with current values', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('spinbutton', { name: /^x$/i })).toHaveValue(10)
    expect(screen.getByRole('spinbutton', { name: /^y$/i })).toHaveValue(20)
    expect(screen.getByRole('spinbutton', { name: /^width$/i })).toHaveValue(100)
    expect(screen.getByRole('spinbutton', { name: /^height$/i })).toHaveValue(50)
  })

  it('renders fill, cornerRadius, stroke, strokeWidth, opacity inputs', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('textbox', { name: /fill/i })).toHaveValue('#ff0000')
    expect(screen.getByRole('spinbutton', { name: /corner radius/i })).toHaveValue(4)
    expect(screen.getByRole('textbox', { name: /^stroke$/i })).toHaveValue('#000000')
    expect(screen.getByRole('spinbutton', { name: /stroke width/i })).toHaveValue(2)
    expect(screen.getByRole('spinbutton', { name: /opacity/i })).toHaveValue(0.8)
  })

  it('editing x updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    const input = screen.getByRole('spinbutton', { name: /^x$/i })
    await userEvent.clear(input)
    await userEvent.type(input, '50')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'rect-1')!
    expect(layer.x).toBe(50)
  })

  it('editing fill updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    const input = screen.getByRole('textbox', { name: /fill/i })
    await userEvent.clear(input)
    await userEvent.type(input, '#aabbcc')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'rect-1')! as any
    expect(layer.fill).toBe('#aabbcc')
  })

  it('renders showIfField dropdown', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /show if field/i })).toBeInTheDocument()
  })

  it('renders fillSource dropdown for rect layer', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /fill source/i })).toBeInTheDocument()
  })

  it('changing fillSource updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /fill source/i }), 'class.primary')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'rect-1')! as any
    expect(layer.fillSource).toBe('class.primary')
  })
})

describe('PropertiesPanel — text layer', () => {
  beforeEach(() => setup('text-1'))

  it('renders field dropdown with current value', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /^field$/i })).toHaveValue('name')
  })

  it('renders fontSize, fontFamily, fontStyle, fill, align, lineHeight inputs', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('spinbutton', { name: /font size/i })).toHaveValue(18)
    expect(screen.getByRole('textbox', { name: /font family/i })).toHaveValue('Arial')
    expect(screen.getByRole('combobox', { name: /font style/i })).toHaveValue('bold')
    expect(screen.getByRole('textbox', { name: /fill/i })).toHaveValue('#ffffff')
    expect(screen.getByRole('combobox', { name: /^align$/i })).toHaveValue('center')
    expect(screen.getByRole('spinbutton', { name: /line height/i })).toHaveValue(1.2)
  })

  it('editing fontSize updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    const input = screen.getByRole('spinbutton', { name: /font size/i })
    await userEvent.clear(input)
    await userEvent.type(input, '24')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'text-1')! as any
    expect(layer.fontSize).toBe(24)
  })

  it('renders showIfField dropdown', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /show if field/i })).toBeInTheDocument()
  })
})

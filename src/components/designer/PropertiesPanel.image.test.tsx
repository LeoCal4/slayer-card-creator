import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      id: 'img-1', type: 'image',
      x: 0, y: 0, width: 375, height: 523,
      imageSource: 'frame', imageFit: 'cover', opacity: 1,
    },
    {
      id: 'badge-1', type: 'badge',
      x: 10, y: 10, width: 50, height: 50,
      shape: 'circle', field: 'cost', fill: '#0000ff', textFill: '#ffffff', fontSize: 18,
    },
    {
      id: 'phase-1', type: 'phase-icons',
      x: 5, y: 5, width: 200, height: 30,
      orientation: 'horizontal', iconSize: 24, gap: 4, align: 'left',
      fill: '#333333', textFill: '#ffffff', cornerRadius: 4,
    },
  ],
}

function setup(selectedId: string) {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: selectedId })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
}

// Mock window.electronAPI for the upload button
const mockElectronAPI = {
  showOpenDialog: vi.fn().mockResolvedValue(null),
  readFile: vi.fn().mockResolvedValue(''),
}
Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true })

describe('PropertiesPanel — image layer', () => {
  beforeEach(() => setup('img-1'))

  it('renders imageSource dropdown with current value', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /image source/i })).toHaveValue('frame')
  })

  it('renders imageFit dropdown with current value', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /image fit/i })).toHaveValue('cover')
  })

  it('renders opacity input', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('spinbutton', { name: /opacity/i })).toHaveValue(1)
  })

  it('changing imageSource updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /image source/i }), 'art')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'img-1')! as any
    expect(layer.imageSource).toBe('art')
  })

  it('shows upload button when imageSource is "frame"', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('button', { name: /upload frame/i })).toBeInTheDocument()
  })
})

describe('PropertiesPanel — badge layer', () => {
  beforeEach(() => setup('badge-1'))

  it('renders field dropdown', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /^field$/i })).toHaveValue('cost')
  })

  it('renders fill, textFill, fontSize inputs', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('textbox', { name: /^fill$/i })).toHaveValue('#0000ff')
    expect(screen.getByRole('textbox', { name: /text fill/i })).toHaveValue('#ffffff')
    expect(screen.getByRole('spinbutton', { name: /font size/i })).toHaveValue(18)
  })

  it('changing fontSize updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    const input = screen.getByRole('spinbutton', { name: /font size/i })
    await userEvent.clear(input)
    await userEvent.type(input, '22')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'badge-1')! as any
    expect(layer.fontSize).toBe(22)
  })
})

describe('PropertiesPanel — phase-icons layer', () => {
  beforeEach(() => setup('phase-1'))

  it('renders orientation dropdown', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /orientation/i })).toHaveValue('horizontal')
  })

  it('renders iconSize, gap, cornerRadius inputs', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('spinbutton', { name: /icon size/i })).toHaveValue(24)
    expect(screen.getByRole('spinbutton', { name: /^gap$/i })).toHaveValue(4)
    expect(screen.getByRole('spinbutton', { name: /corner radius/i })).toHaveValue(4)
  })

  it('renders align dropdown', () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    expect(screen.getByRole('combobox', { name: /^align$/i })).toHaveValue('left')
  })

  it('changing orientation updates the store', async () => {
    render(<PropertiesPanel templateId="tmpl-1" />)
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /orientation/i }), 'vertical')
    const layer = useProjectStore.getState().project!.templates.find((t) => t.id === 'tmpl-1')!.layers.find((l) => l.id === 'phase-1')! as any
    expect(layer.orientation).toBe('vertical')
  })
})

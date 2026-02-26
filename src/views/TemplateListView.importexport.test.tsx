import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateListView } from './TemplateListView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'

const mockElectronAPI = {
  showSaveDialog: vi.fn(),
  showOpenDialog: vi.fn(),
  writeFile: vi.fn().mockResolvedValue(undefined),
  readFile: vi.fn(),
}
Object.defineProperty(window, 'electronAPI', { value: mockElectronAPI, writable: true })

const TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Creature',
  cardTypes: ['Slayer', 'Errant'],
  canvas: { width: 375, height: 523 },
  layers: [],
}

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: null, activeView: 'templates' })
  useProjectStore.getState().newProject()
  const p = useProjectStore.getState().project!
  useProjectStore.setState({ project: { ...p, templates: [] } })
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('TemplateListView — export', () => {
  beforeEach(() => { setup(); vi.clearAllMocks() })

  it('renders an "Export" button for each template', () => {
    render(<TemplateListView />)
    expect(screen.getByRole('button', { name: /export creature/i })).toBeInTheDocument()
  })

  it('clicking Export opens save dialog and writes JSON', async () => {
    mockElectronAPI.showSaveDialog.mockResolvedValue('/path/creature.json')
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /export creature/i }))
    expect(mockElectronAPI.showSaveDialog).toHaveBeenCalled()
    expect(mockElectronAPI.writeFile).toHaveBeenCalledWith(
      '/path/creature.json',
      expect.stringContaining('"name": "Creature"'),
    )
  })

  it('does nothing if save dialog is cancelled', async () => {
    mockElectronAPI.showSaveDialog.mockResolvedValue(null)
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /export creature/i }))
    expect(mockElectronAPI.writeFile).not.toHaveBeenCalled()
  })
})

describe('TemplateListView — import', () => {
  beforeEach(() => { setup(); vi.clearAllMocks() })

  it('renders an "Import Template" button', () => {
    render(<TemplateListView />)
    expect(screen.getByRole('button', { name: /import template/i })).toBeInTheDocument()
  })

  it('clicking Import opens open dialog, reads file, adds template with new id', async () => {
    const importedTemplate: Template = {
      id: 'old-id',
      name: 'Spell',
      cardTypes: ['Action'],
      canvas: { width: 375, height: 523 },
      layers: [],
    }
    mockElectronAPI.showOpenDialog.mockResolvedValue('/path/spell.json')
    mockElectronAPI.readFile.mockResolvedValue(JSON.stringify(importedTemplate))
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /import template/i }))
    const templates = useProjectStore.getState().project!.templates
    expect(templates).toHaveLength(2)
    const added = templates.find((t) => t.name === 'Spell')!
    expect(added).toBeDefined()
    expect(added.id).not.toBe('old-id')
  })

  it('does nothing if open dialog is cancelled', async () => {
    mockElectronAPI.showOpenDialog.mockResolvedValue(null)
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /import template/i }))
    expect(useProjectStore.getState().project!.templates).toHaveLength(1)
  })
})

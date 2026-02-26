import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TemplateListView } from './TemplateListView'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

function setupProject() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: null, activeView: 'templates' })
  useProjectStore.getState().newProject()
  const p = useProjectStore.getState().project!
  useProjectStore.setState({ project: { ...p, templates: [] } })
}

function addTemplate(name: string, id: string) {
  useProjectStore.getState().addTemplate({
    id,
    name,
    cardTypes: ['Slayer', 'Errant'],
    canvas: { width: 375, height: 523 },
    layers: [],
  })
}

describe('TemplateListView', () => {
  beforeEach(setupProject)

  it('shows empty state when no templates exist', () => {
    render(<TemplateListView />)
    expect(screen.getByText(/no templates/i)).toBeInTheDocument()
  })

  it('shows "New Template" button', () => {
    render(<TemplateListView />)
    expect(screen.getByRole('button', { name: /new template/i })).toBeInTheDocument()
  })

  it('clicking "New Template" adds a template and navigates to designer', async () => {
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /new template/i }))
    expect(useProjectStore.getState().project!.templates).toHaveLength(1)
    expect(useUiStore.getState().activeView).toBe('designer')
    expect(useUiStore.getState().activeTemplateId).not.toBeNull()
  })

  it('renders a card for each template', () => {
    addTemplate('Creature', 'tmpl-1')
    addTemplate('Spell', 'tmpl-2')
    render(<TemplateListView />)
    expect(screen.getByText('Creature')).toBeInTheDocument()
    expect(screen.getByText('Spell')).toBeInTheDocument()
  })

  it('shows card type badges on each template card', () => {
    addTemplate('Creature', 'tmpl-1')
    render(<TemplateListView />)
    expect(screen.getByText('Slayer')).toBeInTheDocument()
    expect(screen.getByText('Errant')).toBeInTheDocument()
  })

  it('clicking "Edit" sets activeTemplateId and navigates to designer', async () => {
    addTemplate('Creature', 'tmpl-1')
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /edit creature/i }))
    expect(useUiStore.getState().activeTemplateId).toBe('tmpl-1')
    expect(useUiStore.getState().activeView).toBe('designer')
  })

  it('clicking "Delete" with confirmation removes the template', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    addTemplate('Creature', 'tmpl-1')
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /delete creature/i }))
    expect(useProjectStore.getState().project!.templates).toHaveLength(0)
  })

  it('clicking "Delete" without confirmation keeps the template', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    addTemplate('Creature', 'tmpl-1')
    render(<TemplateListView />)
    await userEvent.click(screen.getByRole('button', { name: /delete creature/i }))
    expect(useProjectStore.getState().project!.templates).toHaveLength(1)
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'
import type { Template } from '@/types/template'


import { DesignerCanvas } from './DesignerCanvas'

const TEMPLATE: Template = {
  id: 'tmpl-1',
  name: 'Creature',
  cardTypes: ['Slayer'],
  canvas: { width: 375, height: 523 },
  layers: [
    { id: 'l-rect', type: 'rect', x: 0, y: 0, width: 375, height: 523, fill: '#222222', visible: true },
    { id: 'l-text', type: 'text', x: 10, y: 10, width: 200, height: 30, field: 'name', fontSize: 18, visible: true },
    { id: 'l-hidden', type: 'rect', x: 0, y: 0, width: 100, height: 100, fill: '#ff0000', visible: false },
    { id: 'l-image', type: 'image', x: 0, y: 0, width: 375, height: 523, imageSource: 'frame', imageFit: 'cover', visible: true },
    { id: 'l-badge', type: 'badge', x: 10, y: 10, width: 50, height: 50, shape: 'circle', field: 'cost', fill: '#000', textFill: '#fff', visible: true },
    { id: 'l-phase', type: 'phase-icons', x: 5, y: 5, width: 200, height: 30, orientation: 'horizontal', iconSize: 24, gap: 4, align: 'left', visible: true },
    { id: 'l-showif', type: 'rect', x: 0, y: 0, width: 100, height: 50, fill: '#abcdef', visible: true, showIfField: 'cost' },
  ],
}

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, activeTemplateId: 'tmpl-1', selectedLayerId: null })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate(TEMPLATE)
}

describe('DesignerCanvas', () => {
  beforeEach(setup)

  it('renders a Stage with template canvas dimensions', () => {
    render(<DesignerCanvas templateId="tmpl-1" />)
    const stage = screen.getByTestId('konva-stage')
    expect(stage).toHaveAttribute('data-width', '375')
    expect(stage).toHaveAttribute('data-height', '523')
  })

  it('renders rect, text, image, badge, phase-icons nodes', () => {
    render(<DesignerCanvas templateId="tmpl-1" />)
    // l-hidden excluded; l-showif visible (no preview card → always shown)
    expect(screen.getAllByTestId('konva-rect').length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByTestId('konva-text').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByTestId('konva-image')).toBeInTheDocument()
    expect(screen.getByTestId('konva-badge')).toBeInTheDocument()
    expect(screen.getByTestId('konva-phase-icons')).toBeInTheDocument()
  })

  it('hides a layer with showIfField when the preview card field is empty', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Slayer', rarity: 'common', effect: '', power: 3, hp: 3,
    })
    useUiStore.getState().setPreviewCard('c1')
    render(<DesignerCanvas templateId="tmpl-1" />)
    // l-showif has showIfField:'cost'; card has no cost → should be hidden
    const rects = screen.getAllByTestId('konva-rect')
    const ids = rects.map((r) => r.getAttribute('data-id'))
    expect(ids).not.toContain('l-showif')
  })

  it('shows a layer with showIfField when the preview card field is set', () => {
    useProjectStore.getState().addCard({
      id: 'c2', name: 'Fireball', class: 'Mage', type: 'Slayer', rarity: 'common', effect: '', power: 3, hp: 3, cost: 3,
    })
    useUiStore.getState().setPreviewCard('c2')
    render(<DesignerCanvas templateId="tmpl-1" />)
    const ids = screen.getAllByTestId('konva-rect').map((r) => r.getAttribute('data-id'))
    expect(ids).toContain('l-showif')
  })

  it('clicking the stage background deselects the layer', async () => {
    useUiStore.getState().setSelectedLayer('l-rect')
    render(<DesignerCanvas templateId="tmpl-1" />)
    const stage = screen.getByTestId('konva-stage')
    await userEvent.click(stage)
    expect(useUiStore.getState().selectedLayerId).toBeNull()
  })

  it('clicking a layer shape selects it', async () => {
    render(<DesignerCanvas templateId="tmpl-1" />)
    const rects = screen.getAllByTestId('konva-rect')
    const lRect = rects.find((r) => r.getAttribute('data-id') === 'l-rect')!
    await userEvent.click(lRect)
    expect(useUiStore.getState().selectedLayerId).toBe('l-rect')
  })

  it('text layer shows [field] placeholder when no preview card', () => {
    render(<DesignerCanvas templateId="tmpl-1" />)
    const texts = screen.getAllByTestId('konva-text')
    const nameText = texts.find((t) => t.getAttribute('data-id') === 'l-text')!
    expect(nameText).toHaveAttribute('data-text', '[name]')
  })

  it('text layer shows card value when preview card is set', () => {
    useProjectStore.getState().addCard({
      id: 'c3', name: 'Ace', class: 'Warrior', type: 'Slayer', rarity: 'common', effect: '',
    })
    useUiStore.getState().setPreviewCard('c3')
    render(<DesignerCanvas templateId="tmpl-1" />)
    const texts = screen.getAllByTestId('konva-text')
    const nameText = texts.find((t) => t.getAttribute('data-id') === 'l-text')!
    expect(nameText).toHaveAttribute('data-text', 'Ace')
  })
})

import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardLayerPanel } from './CardLayerPanel'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

const TEMPLATE_ID = 'tmpl-1'
const CARD_ID = 'card-1'

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, selectedLayerId: null })
  useProjectStore.getState().newProject()

  // Add a template with two layers
  useProjectStore.getState().addTemplate({
    id: TEMPLATE_ID,
    name: 'Test',
    cardTypes: ['Action'],
    canvas: { width: 375, height: 523 },
    layers: [
      { id: 'l1', type: 'text', x: 0, y: 0, width: 100, height: 20, fontSize: 16, field: 'name', label: 'Name Layer' },
      { id: 'l2', type: 'rect', x: 0, y: 0, width: 375, height: 523, label: 'Background' },
    ],
  })
}

describe('CardLayerPanel', () => {
  beforeEach(setup)

  it('renders a list item for each base template layer', () => {
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByText('Name Layer')).toBeInTheDocument()
    expect(screen.getByText('Background')).toBeInTheDocument()
  })

  it('renders a hide-for-card toggle per base layer', () => {
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('button', { name: /hide.*name layer|name layer.*hide/i })).toBeInTheDocument()
  })

  it('clicking the hide toggle calls toggleCardLayerHidden with hidden=true', async () => {
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    await userEvent.click(screen.getByRole('button', { name: /hide.*name layer|name layer.*hide/i }))
    const override = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]
    expect(override?.layerOverrides?.['l1']?.hidden).toBe(true)
  })

  it('clicking the hide toggle again un-hides the layer', async () => {
    useProjectStore.getState().toggleCardLayerHidden(CARD_ID, TEMPLATE_ID, 'l1', true)
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    await userEvent.click(screen.getByRole('button', { name: /show.*name layer|name layer.*show/i }))
    expect(useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.layerOverrides?.['l1']?.hidden).toBe(false)
  })

  it('renders a section for extra card layers when they exist', () => {
    useProjectStore.getState().addCardExtraLayer(CARD_ID, TEMPLATE_ID, {
      id: 'extra-1', type: 'rect', x: 0, y: 0, width: 10, height: 10, label: 'Extra Rect',
    })
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByText('Extra Rect')).toBeInTheDocument()
  })

  it('renders a delete button for each extra layer', () => {
    useProjectStore.getState().addCardExtraLayer(CARD_ID, TEMPLATE_ID, {
      id: 'extra-1', type: 'rect', x: 0, y: 0, width: 10, height: 10, label: 'Extra Rect',
    })
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('button', { name: /delete extra rect/i })).toBeInTheDocument()
  })

  it('clicking delete on an extra layer calls deleteCardExtraLayer', async () => {
    useProjectStore.getState().addCardExtraLayer(CARD_ID, TEMPLATE_ID, {
      id: 'extra-1', type: 'rect', x: 0, y: 0, width: 10, height: 10, label: 'Extra Rect',
    })
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    await userEvent.click(screen.getByRole('button', { name: /delete extra rect/i }))
    const extra = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.extraLayers
    expect(extra?.find((l) => l.id === 'extra-1')).toBeUndefined()
  })

  it('clicking a layer selects it', async () => {
    render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    await userEvent.click(screen.getByText('Name Layer'))
    expect(useUiStore.getState().selectedLayerId).toBe('l1')
  })

  it('renders nothing when no project is loaded', () => {
    useProjectStore.setState({ project: null })
    const { container } = render(<CardLayerPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(container).toBeEmptyDOMElement()
  })
})

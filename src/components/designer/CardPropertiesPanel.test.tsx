import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CardPropertiesPanel } from './CardPropertiesPanel'
import { useProjectStore } from '@/store/projectStore'
import { useUiStore } from '@/store/uiStore'

const TEMPLATE_ID = 'tmpl-1'
const CARD_ID = 'card-1'
const TEXT_LAYER = { id: 'l1', type: 'text' as const, x: 10, y: 20, width: 100, height: 20, fontSize: 16, field: 'name' as const, label: 'Name' }

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false, selectedLayerId: null })
  useProjectStore.getState().newProject()
  useProjectStore.getState().addTemplate({
    id: TEMPLATE_ID,
    name: 'Test',
    cardTypes: ['Action'],
    canvas: { width: 375, height: 523 },
    layers: [TEXT_LAYER],
  })
}

describe('CardPropertiesPanel', () => {
  beforeEach(setup)

  it('renders nothing when no layer is selected', () => {
    const { container } = render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows the layer properties when a layer is selected', () => {
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('spinbutton', { name: /font size/i })).toBeInTheDocument()
  })

  it('shows the effective (merged) value when an override exists', () => {
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 9 } as any)
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('spinbutton', { name: /font size/i })).toHaveValue(9)
  })

  it('shows the base template value when no override exists', () => {
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('spinbutton', { name: /font size/i })).toHaveValue(16)
  })

  it('shows an indicator dot on an overridden property', () => {
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 9 } as any)
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByTestId('override-dot-fontSize')).toBeInTheDocument()
  })

  it('does NOT show an indicator dot on a non-overridden property', () => {
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.queryByTestId('override-dot-fontSize')).not.toBeInTheDocument()
  })

  it('shows a reset button for an overridden property', () => {
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 9 } as any)
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    expect(screen.getByRole('button', { name: /reset font size/i })).toBeInTheDocument()
  })

  it('clicking reset removes that prop from the override', async () => {
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 9 } as any)
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    await userEvent.click(screen.getByRole('button', { name: /reset font size/i }))
    const props = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.layerOverrides?.['l1']?.props as any
    expect(props?.fontSize).toBeUndefined()
  })

  it('changing a property calls updateCardLayerProps', async () => {
    useUiStore.setState({ selectedLayerId: 'l1' })
    render(<CardPropertiesPanel templateId={TEMPLATE_ID} cardId={CARD_ID} />)
    const input = screen.getByRole('spinbutton', { name: /font size/i })
    await userEvent.clear(input)
    await userEvent.type(input, '8')
    const props = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.layerOverrides?.['l1']?.props as any
    expect(props?.fontSize).toBe(8)
  })
})

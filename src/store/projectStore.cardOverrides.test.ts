import { describe, it, expect, beforeEach } from 'vitest'
import { useProjectStore } from './projectStore'
import { useUiStore } from './uiStore'

function setup() {
  useProjectStore.setState({ project: null })
  useUiStore.setState({ isDirty: false })
  useProjectStore.getState().newProject()
}

const DUMMY_LAYER = { id: 'el1', type: 'rect' as const, x: 0, y: 0, width: 10, height: 10 }

describe('projectStore — card override actions', () => {
  beforeEach(setup)

  it('new project has an empty cardOverrides map', () => {
    expect(useProjectStore.getState().project?.cardOverrides).toEqual({})
  })

  describe('updateCardLayerProps', () => {
    it('creates an override entry for a card that has none', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { fontSize: 9 } as any)
      const overrides = useProjectStore.getState().project?.cardOverrides
      expect(overrides?.['card-1']).toBeDefined()
    })

    it('stores the partial props under layerOverrides[layerId].props', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { fontSize: 9 } as any)
      const props = useProjectStore.getState().project?.cardOverrides?.['card-1']?.layerOverrides?.['layer-1']?.props
      expect((props as any)?.fontSize).toBe(9)
    })

    it('merges props when called multiple times for the same layer', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { fontSize: 9 } as any)
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 50 } as any)
      const props = useProjectStore.getState().project?.cardOverrides?.['card-1']?.layerOverrides?.['layer-1']?.props as any
      expect(props?.fontSize).toBe(9)
      expect(props?.x).toBe(50)
    })

    it('stores the templateId on the CardTemplateOverride', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 0 } as any)
      expect(useProjectStore.getState().project?.cardOverrides?.['card-1']?.templateId).toBe('tmpl-1')
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 0 } as any)
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('toggleCardLayerHidden', () => {
    it('sets hidden to true for the given layer', () => {
      useProjectStore.getState().toggleCardLayerHidden('card-1', 'tmpl-1', 'layer-1', true)
      const hidden = useProjectStore.getState().project?.cardOverrides?.['card-1']?.layerOverrides?.['layer-1']?.hidden
      expect(hidden).toBe(true)
    })

    it('sets hidden to false for the given layer', () => {
      useProjectStore.getState().toggleCardLayerHidden('card-1', 'tmpl-1', 'layer-1', true)
      useProjectStore.getState().toggleCardLayerHidden('card-1', 'tmpl-1', 'layer-1', false)
      const hidden = useProjectStore.getState().project?.cardOverrides?.['card-1']?.layerOverrides?.['layer-1']?.hidden
      expect(hidden).toBe(false)
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().toggleCardLayerHidden('card-1', 'tmpl-1', 'layer-1', true)
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('addCardExtraLayer', () => {
    it('appends a layer to extraLayers for the given card', () => {
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', DUMMY_LAYER)
      const extra = useProjectStore.getState().project?.cardOverrides?.['card-1']?.extraLayers
      expect(extra).toHaveLength(1)
      expect(extra?.[0].id).toBe('el1')
    })

    it('appends without duplicating existing extra layers', () => {
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', DUMMY_LAYER)
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', { ...DUMMY_LAYER, id: 'el2' })
      const extra = useProjectStore.getState().project?.cardOverrides?.['card-1']?.extraLayers
      expect(extra).toHaveLength(2)
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', DUMMY_LAYER)
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('deleteCardExtraLayer', () => {
    it('removes the extra layer with the given id', () => {
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', DUMMY_LAYER)
      useProjectStore.getState().deleteCardExtraLayer('card-1', 'el1')
      const extra = useProjectStore.getState().project?.cardOverrides?.['card-1']?.extraLayers
      expect(extra).toHaveLength(0)
    })

    it('is a no-op when the card has no overrides', () => {
      expect(() =>
        useProjectStore.getState().deleteCardExtraLayer('no-such-card', 'el1')
      ).not.toThrow()
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().addCardExtraLayer('card-1', 'tmpl-1', DUMMY_LAYER)
      useUiStore.setState({ isDirty: false })
      useProjectStore.getState().deleteCardExtraLayer('card-1', 'el1')
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('clearCardOverrides', () => {
    it('removes all overrides for the given card', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 5 } as any)
      useProjectStore.getState().clearCardOverrides('card-1')
      expect(useProjectStore.getState().project?.cardOverrides?.['card-1']).toBeUndefined()
    })

    it('does not affect overrides of other cards', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 5 } as any)
      useProjectStore.getState().updateCardLayerProps('card-2', 'tmpl-1', 'layer-1', { x: 5 } as any)
      useProjectStore.getState().clearCardOverrides('card-1')
      expect(useProjectStore.getState().project?.cardOverrides?.['card-2']).toBeDefined()
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 5 } as any)
      useUiStore.setState({ isDirty: false })
      useProjectStore.getState().clearCardOverrides('card-1')
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('resetCardLayerProp', () => {
    it('removes the specified key from override.props', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { fontSize: 9, x: 5 } as any)
      useProjectStore.getState().resetCardLayerProp('card-1', 'layer-1', 'fontSize')
      const props = useProjectStore.getState().project?.cardOverrides?.['card-1']?.layerOverrides?.['layer-1']?.props as any
      expect(props?.fontSize).toBeUndefined()
      expect(props?.x).toBe(5) // other props untouched
    })

    it('is a no-op when the card or layer has no override', () => {
      expect(() =>
        useProjectStore.getState().resetCardLayerProp('no-card', 'no-layer', 'fontSize')
      ).not.toThrow()
    })

    it('marks the project as dirty', () => {
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { fontSize: 9 } as any)
      useUiStore.setState({ isDirty: false })
      useProjectStore.getState().resetCardLayerProp('card-1', 'layer-1', 'fontSize')
      expect(useUiStore.getState().isDirty).toBe(true)
    })
  })

  describe('deleteCard cleanup', () => {
    it('removes card overrides when the card is deleted', () => {
      useProjectStore.getState().addCard({ id: 'card-1', name: 'Test', class: '', type: 'Action', rarity: 'common', effect: '', extras: {} })
      useProjectStore.getState().updateCardLayerProps('card-1', 'tmpl-1', 'layer-1', { x: 5 } as any)
      useProjectStore.getState().deleteCard('card-1')
      expect(useProjectStore.getState().project?.cardOverrides?.['card-1']).toBeUndefined()
    })
  })
})

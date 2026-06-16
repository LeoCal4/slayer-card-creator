import { describe, it, expect, beforeEach } from 'vitest'
import { pushSnapshot, performUndo, performRedo, pushCardSnapshot, performCardUndo, performCardRedo } from './undoRedo'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import type { TemplateLayer } from '@/types/template'
import type { ProjectFile, CardTemplateOverride } from '@/types/project'

const BASE_LAYER: TemplateLayer = {
  id: 'l1', type: 'rect', x: 0, y: 0, width: 100, height: 50,
}
const LAYER_A: TemplateLayer = { ...BASE_LAYER, id: 'la', x: 10 }
const LAYER_B: TemplateLayer = { ...BASE_LAYER, id: 'lb', x: 20 }

const TEMPLATE_ID = 'tmpl-1'

const BASE_PROJECT: ProjectFile = {
  version: 1,
  set: { name: 'Test', code: 'TST', type: 'Custom', releaseDate: '' },
  classColors: {}, cardTypes: [], phaseAbbreviations: {}, phaseMap: {},
  rarityConfig: {
    common: { aliases: [], color: '#4ade80' },
    rare:   { aliases: [], color: '#f87171' },
    epic:   { aliases: [], color: '#60a5fa' },
  },
  templates: [{ id: TEMPLATE_ID, name: 'T', cardTypes: [], canvas: { width: 375, height: 523 }, layers: [LAYER_A] }],
  cards: [], artFolderPath: '', frameImages: {},
}

function freshStores() {
  useUiStore.setState({ undoStack: [], redoStack: [] })
  useProjectStore.setState({ project: JSON.parse(JSON.stringify(BASE_PROJECT)) })
}

describe('pushSnapshot', () => {
  beforeEach(freshStores)

  it('appends to undoStack', () => {
    pushSnapshot([LAYER_A])
    expect(useUiStore.getState().undoStack).toHaveLength(1)
    expect(useUiStore.getState().undoStack[0]).toEqual([LAYER_A])
  })

  it('clears redoStack when a new snapshot is pushed', () => {
    useUiStore.setState({ redoStack: [[LAYER_B]] })
    pushSnapshot([LAYER_A])
    expect(useUiStore.getState().redoStack).toEqual([])
  })

  it('stores a deep copy (not a reference)', () => {
    const layers: TemplateLayer[] = [{ ...LAYER_A }]
    pushSnapshot(layers)
    layers[0] = LAYER_B  // mutate original
    expect(useUiStore.getState().undoStack[0][0].id).toBe('la')
  })

  it('enforces MAX_UNDO = 50 by dropping the oldest entry', () => {
    for (let i = 0; i < 51; i++) {
      pushSnapshot([{ ...BASE_LAYER, id: `l${i}`, x: i }])
    }
    expect(useUiStore.getState().undoStack).toHaveLength(50)
    // oldest (l0) should be gone; newest should be l50
    expect(useUiStore.getState().undoStack[49][0].id).toBe('l50')
  })
})

describe('performUndo', () => {
  beforeEach(freshStores)

  it('is a no-op when undoStack is empty', () => {
    performUndo(TEMPLATE_ID)
    // layers unchanged
    expect(useProjectStore.getState().project?.templates[0].layers).toEqual([LAYER_A])
  })

  it('restores the snapshot to the template layers', () => {
    pushSnapshot([LAYER_B])  // snapshot state before some change
    // Now update the template to a different state
    useProjectStore.getState().setTemplateLayers(TEMPLATE_ID, [LAYER_A])
    performUndo(TEMPLATE_ID)
    expect(useProjectStore.getState().project?.templates[0].layers).toEqual([LAYER_B])
  })

  it('moves current layers to redoStack', () => {
    pushSnapshot([LAYER_B])
    performUndo(TEMPLATE_ID)
    expect(useUiStore.getState().redoStack).toHaveLength(1)
    expect(useUiStore.getState().redoStack[0]).toEqual([LAYER_A])
  })

  it('pops the snapshot from undoStack', () => {
    pushSnapshot([LAYER_B])
    expect(useUiStore.getState().undoStack).toHaveLength(1)
    performUndo(TEMPLATE_ID)
    expect(useUiStore.getState().undoStack).toHaveLength(0)
  })
})

describe('performRedo', () => {
  beforeEach(freshStores)

  it('is a no-op when redoStack is empty', () => {
    performRedo(TEMPLATE_ID)
    expect(useProjectStore.getState().project?.templates[0].layers).toEqual([LAYER_A])
  })

  it('applies the redo snapshot to the template layers', () => {
    useUiStore.setState({ redoStack: [[LAYER_B]] })
    performRedo(TEMPLATE_ID)
    expect(useProjectStore.getState().project?.templates[0].layers).toEqual([LAYER_B])
  })

  it('moves current layers to undoStack', () => {
    useUiStore.setState({ redoStack: [[LAYER_B]] })
    performRedo(TEMPLATE_ID)
    expect(useUiStore.getState().undoStack).toHaveLength(1)
    expect(useUiStore.getState().undoStack[0]).toEqual([LAYER_A])
  })

  it('pops the snapshot from redoStack', () => {
    useUiStore.setState({ redoStack: [[LAYER_B]] })
    performRedo(TEMPLATE_ID)
    expect(useUiStore.getState().redoStack).toHaveLength(0)
  })
})

describe('pushSnapshot after performUndo clears redoStack', () => {
  beforeEach(freshStores)

  it('redo history is cleared when a new action is taken', () => {
    pushSnapshot([LAYER_B])
    performUndo(TEMPLATE_ID)
    // now redoStack has LAYER_A; push a new snapshot (simulate new action)
    pushSnapshot([LAYER_B])
    expect(useUiStore.getState().redoStack).toEqual([])
  })
})

// ─── Card undo / redo ────────────────────────────────────────────────────────

const CARD_ID = 'card-1'

const BASE_OVERRIDE: CardTemplateOverride = {
  templateId: TEMPLATE_ID,
  layerOverrides: { l1: { props: { fontSize: 16 } as any } },
  extraLayers: [],
}

function freshCardStores() {
  useUiStore.setState({ cardUndoStack: {}, cardRedoStack: {} })
  useProjectStore.setState({
    project: {
      ...JSON.parse(JSON.stringify(BASE_PROJECT)),
      cardOverrides: { [CARD_ID]: JSON.parse(JSON.stringify(BASE_OVERRIDE)) },
    },
  })
}

describe('pushCardSnapshot', () => {
  beforeEach(freshCardStores)

  it('appends a copy of the current override to cardUndoStack[cardId]', () => {
    pushCardSnapshot(CARD_ID)
    const stack = useUiStore.getState().cardUndoStack[CARD_ID]
    expect(stack).toHaveLength(1)
    expect(stack[0]).toEqual(BASE_OVERRIDE)
  })

  it('clears cardRedoStack[cardId]', () => {
    useUiStore.setState({ cardRedoStack: { [CARD_ID]: [BASE_OVERRIDE] } })
    pushCardSnapshot(CARD_ID)
    expect(useUiStore.getState().cardRedoStack[CARD_ID]).toEqual([])
  })

  it('stores a deep copy, not a reference', () => {
    pushCardSnapshot(CARD_ID)
    // Mutate the live override
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 99 } as any)
    const snapshot = useUiStore.getState().cardUndoStack[CARD_ID][0]
    expect((snapshot as CardTemplateOverride).layerOverrides['l1'].props as any).toMatchObject({ fontSize: 16 })
  })

  it('stores null when no override exists for that card', () => {
    useProjectStore.setState({
      project: { ...JSON.parse(JSON.stringify(BASE_PROJECT)), cardOverrides: {} },
    })
    pushCardSnapshot(CARD_ID)
    const stack = useUiStore.getState().cardUndoStack[CARD_ID]
    expect(stack[0]).toBeNull()
  })
})

describe('performCardUndo', () => {
  beforeEach(freshCardStores)

  it('is a no-op when cardUndoStack is empty', () => {
    performCardUndo(CARD_ID)
    expect(useProjectStore.getState().project?.cardOverrides?.[CARD_ID]).toEqual(BASE_OVERRIDE)
  })

  it('restores the override from the snapshot', () => {
    // snapshot: fontSize 16 (BASE_OVERRIDE)
    pushCardSnapshot(CARD_ID)
    // make a change
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 24 } as any)
    performCardUndo(CARD_ID)
    const props = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.layerOverrides['l1']?.props as any
    expect(props.fontSize).toBe(16)
  })

  it('moves the current override to cardRedoStack', () => {
    pushCardSnapshot(CARD_ID)
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 24 } as any)
    performCardUndo(CARD_ID)
    const redoStack = useUiStore.getState().cardRedoStack[CARD_ID]
    expect(redoStack).toHaveLength(1)
    expect((redoStack[0] as CardTemplateOverride).layerOverrides['l1'].props as any).toMatchObject({ fontSize: 24 })
  })

  it('pops the snapshot from cardUndoStack', () => {
    pushCardSnapshot(CARD_ID)
    performCardUndo(CARD_ID)
    expect(useUiStore.getState().cardUndoStack[CARD_ID]).toHaveLength(0)
  })

  it('can undo to a null snapshot (no override)', () => {
    useProjectStore.setState({
      project: { ...JSON.parse(JSON.stringify(BASE_PROJECT)), cardOverrides: {} },
    })
    useUiStore.setState({ cardUndoStack: { [CARD_ID]: [null] }, cardRedoStack: {} })
    // restore some override first
    useProjectStore.getState().updateCardLayerProps(CARD_ID, TEMPLATE_ID, 'l1', { fontSize: 24 } as any)
    performCardUndo(CARD_ID)
    expect(useProjectStore.getState().project?.cardOverrides?.[CARD_ID]).toBeUndefined()
  })
})

describe('performCardRedo', () => {
  beforeEach(freshCardStores)

  it('is a no-op when cardRedoStack is empty', () => {
    performCardRedo(CARD_ID)
    expect(useProjectStore.getState().project?.cardOverrides?.[CARD_ID]).toEqual(BASE_OVERRIDE)
  })

  it('re-applies the redo snapshot', () => {
    // Set up: undo already done, redo stack has the "after" state
    const afterOverride: CardTemplateOverride = {
      ...BASE_OVERRIDE,
      layerOverrides: { l1: { props: { fontSize: 24 } as any } },
    }
    useUiStore.setState({ cardRedoStack: { [CARD_ID]: [afterOverride] } })
    performCardRedo(CARD_ID)
    const props = useProjectStore.getState().project?.cardOverrides?.[CARD_ID]?.layerOverrides['l1']?.props as any
    expect(props.fontSize).toBe(24)
  })

  it('moves the current override to cardUndoStack', () => {
    const afterOverride: CardTemplateOverride = {
      ...BASE_OVERRIDE,
      layerOverrides: { l1: { props: { fontSize: 24 } as any } },
    }
    useUiStore.setState({ cardRedoStack: { [CARD_ID]: [afterOverride] } })
    performCardRedo(CARD_ID)
    const undoStack = useUiStore.getState().cardUndoStack[CARD_ID]
    expect(undoStack).toHaveLength(1)
    expect((undoStack[0] as CardTemplateOverride).layerOverrides['l1'].props as any).toMatchObject({ fontSize: 16 })
  })

  it('pops the snapshot from cardRedoStack', () => {
    useUiStore.setState({ cardRedoStack: { [CARD_ID]: [BASE_OVERRIDE] } })
    performCardRedo(CARD_ID)
    expect(useUiStore.getState().cardRedoStack[CARD_ID]).toHaveLength(0)
  })
})

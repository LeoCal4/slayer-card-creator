import { describe, it, expect, beforeEach } from 'vitest'
import { pushSnapshot, performUndo, performRedo } from './undoRedo'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import type { TemplateLayer } from '@/types/template'
import type { ProjectFile } from '@/types/project'

const BASE_LAYER: TemplateLayer = {
  id: 'l1', type: 'rect', x: 0, y: 0, width: 100, height: 50,
}
const LAYER_A: TemplateLayer = { ...BASE_LAYER, id: 'la', x: 10 }
const LAYER_B: TemplateLayer = { ...BASE_LAYER, id: 'lb', x: 20 }

const TEMPLATE_ID = 'tmpl-1'

const BASE_PROJECT: ProjectFile = {
  version: 1,
  set: { name: 'Test', code: 'TST', type: 'Custom', releaseDate: '' },
  classColors: {}, phaseAbbreviations: {}, phaseMap: {},
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

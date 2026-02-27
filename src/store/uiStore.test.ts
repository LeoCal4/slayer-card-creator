import { describe, it, expect, beforeEach } from 'vitest'
import { useUiStore } from './uiStore'
import type { TemplateLayer } from '@/types/template'

function freshStore() {
  useUiStore.setState({
    activeView: 'set-info',
    activeTemplateId: null,
    selectedLayerId: null,
    previewCardId: null,
    exportStatus: 'idle',
    exportProgress: { current: 0, total: 0 },
    projectFilePath: null,
    isDirty: false,
    snapGridEnabled: false,
    snapGridSize: 5,
    undoStack: [],
    redoStack: [],
  })
}

describe('uiStore defaults', () => {
  beforeEach(freshStore)

  it('starts on set-info view', () => {
    expect(useUiStore.getState().activeView).toBe('set-info')
  })

  it('starts with snap grid disabled at 5px', () => {
    const { snapGridEnabled, snapGridSize } = useUiStore.getState()
    expect(snapGridEnabled).toBe(false)
    expect(snapGridSize).toBe(5)
  })

  it('starts clean (not dirty)', () => {
    expect(useUiStore.getState().isDirty).toBe(false)
  })
})

describe('setActiveView', () => {
  beforeEach(freshStore)

  it('changes the active view', () => {
    useUiStore.getState().setActiveView('cards')
    expect(useUiStore.getState().activeView).toBe('cards')
  })
})

describe('setSelectedLayer', () => {
  beforeEach(freshStore)

  it('sets the selected layer id', () => {
    useUiStore.getState().setSelectedLayer('layer-abc')
    expect(useUiStore.getState().selectedLayerId).toBe('layer-abc')
  })

  it('clears selection when passed null', () => {
    useUiStore.getState().setSelectedLayer('layer-abc')
    useUiStore.getState().setSelectedLayer(null)
    expect(useUiStore.getState().selectedLayerId).toBeNull()
  })
})

describe('setSnapGrid', () => {
  beforeEach(freshStore)

  it('toggles snap grid on', () => {
    useUiStore.getState().setSnapGridEnabled(true)
    expect(useUiStore.getState().snapGridEnabled).toBe(true)
  })

  it('changes snap grid size', () => {
    useUiStore.getState().setSnapGridSize(10)
    expect(useUiStore.getState().snapGridSize).toBe(10)
  })
})

describe('undoStack / redoStack / clearUndoHistory', () => {
  beforeEach(freshStore)

  it('starts with empty undoStack', () => {
    expect(useUiStore.getState().undoStack).toEqual([])
  })

  it('starts with empty redoStack', () => {
    expect(useUiStore.getState().redoStack).toEqual([])
  })

  it('clearUndoHistory empties both stacks when they contain entries', () => {
    const layer: TemplateLayer = {
      id: 'l1', type: 'rect', x: 0, y: 0, width: 10, height: 10,
    }
    useUiStore.setState({ undoStack: [[layer]], redoStack: [[layer]] })
    useUiStore.getState().clearUndoHistory()
    expect(useUiStore.getState().undoStack).toEqual([])
    expect(useUiStore.getState().redoStack).toEqual([])
  })
})

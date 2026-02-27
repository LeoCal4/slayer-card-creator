import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import type { TemplateLayer } from '@/types/template'

const MAX_UNDO = 50

/**
 * Call immediately before any undoable mutation.
 * Appends a deep copy of the current layers to undoStack (capped at MAX_UNDO).
 * Clears redoStack — a new action always invalidates redo.
 */
export function pushSnapshot(layers: TemplateLayer[]): void {
  const copy = layers.map((l) => ({ ...l }))
  useUiStore.setState((state) => {
    const next = [...state.undoStack, copy]
    if (next.length > MAX_UNDO) next.shift()
    return { undoStack: next, redoStack: [] }
  })
}

/**
 * Undoes the last action.
 * No-op when undoStack is empty or templateId is null.
 */
export function performUndo(templateId: string): void {
  const { undoStack, redoStack } = useUiStore.getState()
  if (undoStack.length === 0) return

  const project = useProjectStore.getState().project
  const template = project?.templates.find((t) => t.id === templateId)
  if (!template) return

  const currentCopy = template.layers.map((l) => ({ ...l }))
  const snapshot = undoStack[undoStack.length - 1]

  useUiStore.setState({
    undoStack: undoStack.slice(0, -1),
    redoStack: [...redoStack, currentCopy],
  })
  useProjectStore.getState().setTemplateLayers(templateId, snapshot.map((l) => ({ ...l })))
}

/**
 * Redoes the last undone action.
 * Symmetric inverse of performUndo.
 * No-op when redoStack is empty or templateId is null.
 */
export function performRedo(templateId: string): void {
  const { undoStack, redoStack } = useUiStore.getState()
  if (redoStack.length === 0) return

  const project = useProjectStore.getState().project
  const template = project?.templates.find((t) => t.id === templateId)
  if (!template) return

  const currentCopy = template.layers.map((l) => ({ ...l }))
  const snapshot = redoStack[redoStack.length - 1]

  useUiStore.setState({
    undoStack: [...undoStack, currentCopy],
    redoStack: redoStack.slice(0, -1),
  })
  useProjectStore.getState().setTemplateLayers(templateId, snapshot.map((l) => ({ ...l })))
}

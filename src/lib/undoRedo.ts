import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'
import type { TemplateLayer } from '@/types/template'
import type { CardTemplateOverride } from '@/types/project'

const MAX_UNDO = 50

// ─── Helpers ────────────────────────────────────────────────────────────────

function deepCopyOverride(override: CardTemplateOverride): CardTemplateOverride {
  return {
    templateId: override.templateId,
    layerOverrides: Object.fromEntries(
      Object.entries(override.layerOverrides).map(([k, v]) => [
        k,
        { hidden: v.hidden, props: v.props ? { ...v.props } : undefined },
      ])
    ),
    extraLayers: override.extraLayers.map((l) => ({ ...l })),
  }
}

// ─── Card override undo / redo ───────────────────────────────────────────────

/**
 * Capture a snapshot of the card's current override before a mutating action.
 * Stores null when no override exists (represents "clean" state).
 */
export function pushCardSnapshot(cardId: string): void {
  const override = useProjectStore.getState().project?.cardOverrides?.[cardId] ?? null
  const copy = override ? deepCopyOverride(override) : null
  useUiStore.setState((state) => {
    const current = state.cardUndoStack[cardId] ?? []
    const next = [...current, copy]
    if (next.length > MAX_UNDO) next.shift()
    return {
      cardUndoStack: { ...state.cardUndoStack, [cardId]: next },
      cardRedoStack: { ...state.cardRedoStack, [cardId]: [] },
    }
  })
}

export function performCardUndo(cardId: string): void {
  const { cardUndoStack, cardRedoStack } = useUiStore.getState()
  const stack = cardUndoStack[cardId] ?? []
  if (stack.length === 0) return

  const currentOverride = useProjectStore.getState().project?.cardOverrides?.[cardId] ?? null
  const currentCopy = currentOverride ? deepCopyOverride(currentOverride) : null
  const snapshot = stack[stack.length - 1]
  const redoStack = cardRedoStack[cardId] ?? []

  useUiStore.setState({
    cardUndoStack: { ...cardUndoStack, [cardId]: stack.slice(0, -1) },
    cardRedoStack: { ...cardRedoStack, [cardId]: [...redoStack, currentCopy] },
  })
  useProjectStore.getState().setCardOverride(cardId, snapshot ?? undefined)
}

export function performCardRedo(cardId: string): void {
  const { cardUndoStack, cardRedoStack } = useUiStore.getState()
  const stack = cardRedoStack[cardId] ?? []
  if (stack.length === 0) return

  const currentOverride = useProjectStore.getState().project?.cardOverrides?.[cardId] ?? null
  const currentCopy = currentOverride ? deepCopyOverride(currentOverride) : null
  const snapshot = stack[stack.length - 1]
  const undoStack = cardUndoStack[cardId] ?? []

  useUiStore.setState({
    cardUndoStack: { ...cardUndoStack, [cardId]: [...undoStack, currentCopy] },
    cardRedoStack: { ...cardRedoStack, [cardId]: stack.slice(0, -1) },
  })
  useProjectStore.getState().setCardOverride(cardId, snapshot ?? undefined)
}

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

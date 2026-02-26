import { create } from 'zustand'

export type ViewId = 'set-info' | 'templates' | 'designer' | 'cards' | 'preview' | 'export'

interface UiState {
  activeView: ViewId
  activeTemplateId: string | null
  selectedLayerId: string | null
  previewCardId: string | null
  exportStatus: 'idle' | 'running' | 'done' | 'error'
  exportProgress: { current: number; total: number }
  projectFilePath: string | null
  isDirty: boolean
  snapGridEnabled: boolean
  snapGridSize: number

  setActiveView: (view: ViewId) => void
  setActiveTemplate: (id: string | null) => void
  setSelectedLayer: (id: string | null) => void
  setPreviewCard: (id: string | null) => void
  setExportStatus: (status: UiState['exportStatus']) => void
  setExportProgress: (progress: { current: number; total: number }) => void
  setProjectFilePath: (path: string | null) => void
  setDirty: (dirty: boolean) => void
  setSnapGridEnabled: (enabled: boolean) => void
  setSnapGridSize: (size: number) => void
}

export const useUiStore = create<UiState>()((set) => ({
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

  setActiveView: (view) => set({ activeView: view }),
  setActiveTemplate: (id) => set({ activeTemplateId: id }),
  setSelectedLayer: (id) => set({ selectedLayerId: id }),
  setPreviewCard: (id) => set({ previewCardId: id }),
  setExportStatus: (status) => set({ exportStatus: status }),
  setExportProgress: (progress) => set({ exportProgress: progress }),
  setProjectFilePath: (path) => set({ projectFilePath: path }),
  setDirty: (dirty) => set({ isDirty: dirty }),
  setSnapGridEnabled: (enabled) => set({ snapGridEnabled: enabled }),
  setSnapGridSize: (size) => set({ snapGridSize: size }),
}))

import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'
import type { CardData, CardType, Rarity } from '@/types/card'
import type { ClassConfig, ProjectFile, RarityConfig, SetInfo } from '@/types/project'
import type { Template, TemplateLayer } from '@/types/template'
import { serialize, deserialize } from '@/lib/projectFile'
import { useUiStore } from '@/store/uiStore'
import slayerErrantTemplate from '@/assets/templates/slayer-errant.json'
import actionPloyTemplate from '@/assets/templates/action-ploy.json'
import chamberRelicTemplate from '@/assets/templates/chamber-relic.json'
import textHeavyTemplate from '@/assets/templates/text-heavy.json'

const STARTER_TEMPLATES: Template[] = [
  slayerErrantTemplate as unknown as Template,
  actionPloyTemplate as unknown as Template,
  chamberRelicTemplate as unknown as Template,
  textHeavyTemplate as unknown as Template,
]

const DEFAULT_CLASS_COLORS: Record<string, ClassConfig> = {
  Cleric:  { primary: '#d4ac0d', secondary: '#9a7d0a', cockatriceColor: 'W' },
  Hunter:  { primary: '#27ae60', secondary: '#1e8449', cockatriceColor: 'G' },
  Mage:    { primary: '#2980b9', secondary: '#1a5276', cockatriceColor: 'U' },
  Rogue:   { primary: '#5d6d7e', secondary: '#2c3e50', cockatriceColor: 'B' },
  Warlock: { primary: '#7d3c98', secondary: '#4a235a', cockatriceColor: 'B' },
  Warrior: { primary: '#c0392b', secondary: '#7b241c', cockatriceColor: 'R' },
}

const DEFAULT_PHASE_ABBREVIATIONS: Record<string, string> = {
  Encounter: 'E',
  Preparation: 'P',
  Combat: 'B',
  Camp: 'C',
}

const DEFAULT_PHASE_MAP: ProjectFile['phaseMap'] = {
  Slayer:       ['Encounter'],
  Errant:       ['Encounter'],
  Action:       ['Combat', 'Camp'],
  Ploy:         ['Preparation', 'Camp'],
  Intervention: ['Camp'],
  Chamber:      ['Encounter'],
  Relic:        ['Preparation', 'Combat'],
  Dungeon:      [],
  Phase:        [],
  Status:       [],
}

const DEFAULT_RARITY_CONFIG: ProjectFile['rarityConfig'] = {
  common: { aliases: ['comune'], color: '#4ade80' },
  rare:   { aliases: ['rara'],   color: '#f87171' },
  epic:   { aliases: ['epica'],  color: '#60a5fa' },
}

function createDefaultProject(): ProjectFile {
  return {
    version: 1,
    set: { name: 'New Set', code: 'NEW', type: 'Custom', releaseDate: '' },
    classColors: { ...DEFAULT_CLASS_COLORS },
    phaseAbbreviations: { ...DEFAULT_PHASE_ABBREVIATIONS },
    phaseMap: { ...DEFAULT_PHASE_MAP },
    rarityConfig: {
      common: { ...DEFAULT_RARITY_CONFIG.common, aliases: [...DEFAULT_RARITY_CONFIG.common.aliases] },
      rare:   { ...DEFAULT_RARITY_CONFIG.rare,   aliases: [...DEFAULT_RARITY_CONFIG.rare.aliases] },
      epic:   { ...DEFAULT_RARITY_CONFIG.epic,   aliases: [...DEFAULT_RARITY_CONFIG.epic.aliases] },
    },
    templates: STARTER_TEMPLATES.map((t) => ({ ...t })),
    cards: [],
    artFolderPath: '',
    frameImages: {},
  }
}

function markDirty() {
  useUiStore.getState().setDirty(true)
}

interface ProjectState {
  project: ProjectFile | null

  newProject: () => void
  loadProject: (data: ProjectFile) => void
  saveProject: () => Promise<void>
  openProject: () => Promise<void>

  updateSetInfo: (partial: Partial<SetInfo>) => void

  updateClassColor: (className: string, partial: Partial<ClassConfig>) => void
  addClassColor: (className: string, config: ClassConfig) => void
  deleteClassColor: (className: string) => void

  updatePhaseAbbreviation: (phase: string, letter: string) => void
  updatePhaseMap: (type: CardType, phases: string[]) => void
  updateRarityConfig: (rarity: Rarity, partial: Partial<RarityConfig>) => void

  addTemplate: (template: Template) => void
  updateTemplate: (id: string, partial: Partial<Template>) => void
  deleteTemplate: (id: string) => void
  addLayer: (templateId: string, layer: TemplateLayer) => void
  updateLayer: (templateId: string, layerId: string, partial: Partial<TemplateLayer>) => void
  deleteLayer: (templateId: string, layerId: string) => void
  reorderLayers: (templateId: string, orderedIds: string[]) => void
  setFrameImage: (templateId: string, base64: string) => void

  setCards: (cards: CardData[]) => void
  addCard: (card: CardData) => void
  updateCard: (id: string, partial: Partial<CardData>) => void
  deleteCard: (id: string) => void

  setArtFolderPath: (path: string) => void
}

export const useProjectStore = create<ProjectState>()(
  immer((set, get) => ({
    project: null,

    newProject: () => {
      set((state) => { state.project = createDefaultProject() })
      markDirty()
    },

    loadProject: (data) => set((state) => {
      state.project = data
    }),

    saveProject: async () => {
      const { project } = get()
      if (!project) return

      const ui = useUiStore.getState()
      let savePath = ui.projectFilePath

      if (!savePath) {
        savePath = await window.electronAPI.showSaveDialog({
          title: 'Save Project',
          filters: [{ name: 'Slayer Project', extensions: ['json'] }],
        })
      }
      if (!savePath) return

      const json = serialize(project)
      await window.electronAPI.writeFile(savePath, json)
      useUiStore.getState().setProjectFilePath(savePath)
      useUiStore.getState().setDirty(false)
      await window.electronAPI.addRecentProject({
        path: savePath,
        name: project.set.name,
        timestamp: Date.now(),
      })
    },

    openProject: async () => {
      const filePath = await window.electronAPI.showOpenDialog({
        title: 'Open Project',
        filters: [{ name: 'Slayer Project', extensions: ['json'] }],
        properties: ['openFile'],
      })
      if (!filePath) return

      const raw = await window.electronAPI.readFile(filePath)
      const data = deserialize(raw)
      set((state) => { state.project = data })
      useUiStore.getState().setProjectFilePath(filePath)
      useUiStore.getState().setDirty(false)
      await window.electronAPI.addRecentProject({
        path: filePath,
        name: data.set.name,
        timestamp: Date.now(),
      })
    },

    updateSetInfo: (partial) => {
      set((state) => { if (state.project) Object.assign(state.project.set, partial) })
      markDirty()
    },

    updateClassColor: (className, partial) => {
      set((state) => {
        if (!state.project) return
        Object.assign(state.project.classColors[className], partial)
      })
      markDirty()
    },

    addClassColor: (className, config) => {
      set((state) => { if (state.project) state.project.classColors[className] = config })
      markDirty()
    },

    deleteClassColor: (className) => {
      set((state) => { if (state.project) delete state.project.classColors[className] })
      markDirty()
    },

    updatePhaseAbbreviation: (phase, letter) => {
      set((state) => { if (state.project) state.project.phaseAbbreviations[phase] = letter })
      markDirty()
    },

    updatePhaseMap: (type, phases) => {
      set((state) => { if (state.project) state.project.phaseMap[type] = phases })
      markDirty()
    },

    updateRarityConfig: (rarity, partial) => {
      set((state) => {
        if (!state.project) return
        Object.assign(state.project.rarityConfig[rarity], partial)
      })
      markDirty()
    },

    addTemplate: (template) => {
      set((state) => { if (state.project) state.project.templates.push(template) })
      markDirty()
    },

    updateTemplate: (id, partial) => {
      set((state) => {
        if (!state.project) return
        const tmpl = state.project.templates.find((t) => t.id === id)
        if (tmpl) Object.assign(tmpl, partial)
      })
      markDirty()
    },

    deleteTemplate: (id) => {
      set((state) => {
        if (state.project) state.project.templates = state.project.templates.filter((t) => t.id !== id)
      })
      markDirty()
    },

    addLayer: (templateId, layer) => {
      set((state) => {
        if (!state.project) return
        const tmpl = state.project.templates.find((t) => t.id === templateId)
        if (tmpl) tmpl.layers.push(layer)
      })
      markDirty()
    },

    updateLayer: (templateId, layerId, partial) => {
      set((state) => {
        if (!state.project) return
        const tmpl = state.project.templates.find((t) => t.id === templateId)
        if (!tmpl) return
        const layer = tmpl.layers.find((l) => l.id === layerId)
        if (layer) Object.assign(layer, partial)
      })
      markDirty()
    },

    deleteLayer: (templateId, layerId) => {
      set((state) => {
        if (!state.project) return
        const tmpl = state.project.templates.find((t) => t.id === templateId)
        if (tmpl) tmpl.layers = tmpl.layers.filter((l) => l.id !== layerId)
      })
      markDirty()
    },

    reorderLayers: (templateId, orderedIds) => {
      set((state) => {
        if (!state.project) return
        const tmpl = state.project.templates.find((t) => t.id === templateId)
        if (!tmpl) return
        tmpl.layers = orderedIds
          .map((id) => tmpl.layers.find((l) => l.id === id))
          .filter((l): l is TemplateLayer => l !== undefined)
      })
      markDirty()
    },

    setFrameImage: (templateId, base64) => {
      set((state) => { if (state.project) state.project.frameImages[templateId] = base64 })
      markDirty()
    },

    setCards: (cards) => {
      set((state) => { if (state.project) state.project.cards = cards })
      markDirty()
    },

    addCard: (card) => {
      set((state) => { if (state.project) state.project.cards.push(card) })
      markDirty()
    },

    updateCard: (id, partial) => {
      set((state) => {
        if (!state.project) return
        const card = state.project.cards.find((c) => c.id === id)
        if (card) Object.assign(card, partial)
      })
      markDirty()
    },

    deleteCard: (id) => {
      set((state) => {
        if (state.project) state.project.cards = state.project.cards.filter((c) => c.id !== id)
      })
      markDirty()
    },

    setArtFolderPath: (path) => {
      set((state) => { if (state.project) state.project.artFolderPath = path })
      markDirty()
    },
  })),
)

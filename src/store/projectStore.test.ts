import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useProjectStore } from './projectStore'
import { useUiStore } from './uiStore'
import type { ProjectFile } from '@/types/project'

function freshUiStore() {
  useUiStore.setState({ isDirty: false, projectFilePath: null })
}

function freshStore() {
  useProjectStore.setState({ project: null })
}

describe('newProject', () => {
  beforeEach(freshStore)

  it('creates a project with version 1', () => {
    useProjectStore.getState().newProject()
    expect(useProjectStore.getState().project?.version).toBe(1)
  })

  it('creates a project with empty cards array', () => {
    useProjectStore.getState().newProject()
    expect(useProjectStore.getState().project?.cards).toEqual([])
  })

  it('creates a project with the 6 default classes', () => {
    useProjectStore.getState().newProject()
    const classes = Object.keys(useProjectStore.getState().project?.classColors ?? {})
    expect(classes).toEqual(['Cleric', 'Hunter', 'Mage', 'Rogue', 'Warlock', 'Warrior'])
  })

  it('creates a project with the 4 phase abbreviations', () => {
    useProjectStore.getState().newProject()
    const abbrevs = useProjectStore.getState().project?.phaseAbbreviations
    expect(abbrevs).toEqual({ Encounter: 'E', Preparation: 'P', Combat: 'B', Camp: 'C' })
  })

  it('creates a project with the 10 default card types', () => {
    useProjectStore.getState().newProject()
    const cardTypes = useProjectStore.getState().project?.cardTypes ?? []
    expect(cardTypes).toHaveLength(10)
    expect(cardTypes).toContain('Slayer')
    expect(cardTypes).toContain('Status')
  })
})

describe('updateSetInfo', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('updates the set name', () => {
    useProjectStore.getState().updateSetInfo({ name: 'New Name' })
    expect(useProjectStore.getState().project?.set.name).toBe('New Name')
  })

  it('does not change other set fields', () => {
    const before = useProjectStore.getState().project?.set.code
    useProjectStore.getState().updateSetInfo({ name: 'New Name' })
    expect(useProjectStore.getState().project?.set.code).toBe(before)
  })
})

describe('addCard / updateCard / deleteCard', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('addCard appends a card', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Draw.',
    })
    expect(useProjectStore.getState().project?.cards).toHaveLength(1)
  })

  it('updateCard modifies the matching card only', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Draw.',
    })
    useProjectStore.getState().updateCard('c1', { name: 'Updated' })
    expect(useProjectStore.getState().project?.cards[0].name).toBe('Updated')
  })

  it('deleteCard removes by id', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Action', rarity: 'common', effect: 'Draw.',
    })
    useProjectStore.getState().deleteCard('c1')
    expect(useProjectStore.getState().project?.cards).toHaveLength(0)
  })
})

describe('updateClassColor', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('updates the primary color of a class', () => {
    useProjectStore.getState().updateClassColor('Mage', { primary: '#ff0000' })
    expect(useProjectStore.getState().project?.classColors['Mage'].primary).toBe('#ff0000')
  })
})

describe('addCardType / deleteCardType / renameCardType', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('addCardType appends a new type', () => {
    useProjectStore.getState().addCardType('Trap')
    expect(useProjectStore.getState().project?.cardTypes).toContain('Trap')
  })

  it('deleteCardType removes the type', () => {
    useProjectStore.getState().deleteCardType('Action')
    expect(useProjectStore.getState().project?.cardTypes).not.toContain('Action')
  })

  it('deleteCardType reassigns cards of that type to the first remaining type', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Action', rarity: 'common', effect: 'x',
    })
    useProjectStore.getState().deleteCardType('Action')
    expect(useProjectStore.getState().project?.cards[0].type).not.toBe('Action')
  })

  it('deleteCardType removes the type from template cardTypes', () => {
    const tmplId = useProjectStore.getState().project!.templates[0].id
    useProjectStore.getState().updateTemplate(tmplId, { cardTypes: ['Slayer', 'Action'] })
    useProjectStore.getState().deleteCardType('Action')
    expect(useProjectStore.getState().project!.templates[0].cardTypes).not.toContain('Action')
  })

  it('renameCardType updates the name in the list', () => {
    useProjectStore.getState().renameCardType('Action', 'Spell')
    expect(useProjectStore.getState().project?.cardTypes).toContain('Spell')
    expect(useProjectStore.getState().project?.cardTypes).not.toContain('Action')
  })

  it('renameCardType updates card types in cards', () => {
    useProjectStore.getState().addCard({
      id: 'c1', name: 'Test', class: 'Mage', type: 'Action', rarity: 'common', effect: 'x',
    })
    useProjectStore.getState().renameCardType('Action', 'Spell')
    expect(useProjectStore.getState().project?.cards[0].type).toBe('Spell')
  })

  it('renameCardType migrates the phaseMap key', () => {
    useProjectStore.getState().updatePhaseMap('Action', ['Combat'])
    useProjectStore.getState().renameCardType('Action', 'Spell')
    expect(useProjectStore.getState().project?.phaseMap['Spell']).toEqual(['Combat'])
    expect(useProjectStore.getState().project?.phaseMap['Action']).toBeUndefined()
  })
})

describe('addPhase / deletePhase / renamePhase', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('addPhase adds a new phase with empty abbreviation', () => {
    useProjectStore.getState().addPhase('Rest')
    expect(useProjectStore.getState().project?.phaseAbbreviations['Rest']).toBe('')
  })

  it('addPhase sets isDirty', () => {
    freshUiStore()
    useProjectStore.getState().addPhase('Rest')
    expect(useUiStore.getState().isDirty).toBe(true)
  })

  it('deletePhase removes phase from phaseAbbreviations', () => {
    useProjectStore.getState().deletePhase('Encounter')
    expect(useProjectStore.getState().project?.phaseAbbreviations).not.toHaveProperty('Encounter')
  })

  it('deletePhase removes phase from all phaseMap entries', () => {
    useProjectStore.getState().deletePhase('Encounter')
    const phaseMap = useProjectStore.getState().project?.phaseMap
    expect(phaseMap?.['Slayer']).not.toContain('Encounter')
    expect(phaseMap?.['Errant']).not.toContain('Encounter')
  })

  it('deletePhase sets isDirty', () => {
    freshUiStore()
    useProjectStore.getState().deletePhase('Encounter')
    expect(useUiStore.getState().isDirty).toBe(true)
  })

  it('renamePhase updates the key in phaseAbbreviations preserving the abbreviation', () => {
    useProjectStore.getState().renamePhase('Encounter', 'Battling')
    const abbrevs = useProjectStore.getState().project?.phaseAbbreviations
    expect(abbrevs).not.toHaveProperty('Encounter')
    expect(abbrevs?.['Battling']).toBe('E')
  })

  it('renamePhase updates all references in phaseMap', () => {
    useProjectStore.getState().renamePhase('Encounter', 'Battling')
    const phaseMap = useProjectStore.getState().project?.phaseMap
    expect(phaseMap?.['Slayer']).toContain('Battling')
    expect(phaseMap?.['Slayer']).not.toContain('Encounter')
  })

  it('renamePhase sets isDirty', () => {
    freshUiStore()
    useProjectStore.getState().renamePhase('Encounter', 'Battling')
    expect(useUiStore.getState().isDirty).toBe(true)
  })
})

describe('updatePhaseMap', () => {
  beforeEach(() => {
    freshStore()
    useProjectStore.getState().newProject()
  })

  it('sets phases for a card type', () => {
    useProjectStore.getState().updatePhaseMap('Action', ['Combat'])
    expect(useProjectStore.getState().project?.phaseMap['Action']).toEqual(['Combat'])
  })
})

describe('dirty state tracking', () => {
  beforeEach(() => {
    freshStore()
    freshUiStore()
  })

  it('newProject sets isDirty', () => {
    useProjectStore.getState().newProject()
    expect(useUiStore.getState().isDirty).toBe(true)
  })

  it('updateSetInfo sets isDirty', () => {
    useProjectStore.getState().newProject()
    freshUiStore()
    useProjectStore.getState().updateSetInfo({ name: 'Changed' })
    expect(useUiStore.getState().isDirty).toBe(true)
  })

  it('addCard sets isDirty', () => {
    useProjectStore.getState().newProject()
    freshUiStore()
    useProjectStore.getState().addCard({
      id: 'c1', name: 'T', class: 'Mage', type: 'Action', rarity: 'common', effect: 'x',
    })
    expect(useUiStore.getState().isDirty).toBe(true)
  })

  it('loadProject does NOT set isDirty', () => {
    const data: ProjectFile = {
      version: 1,
      set: { name: 'Loaded', code: 'LD', type: 'Custom', releaseDate: '' },
      classColors: {}, cardTypes: [], phaseAbbreviations: {}, phaseMap: {},
      rarityConfig: {
        common: { aliases: ['comune'], color: '#4ade80' },
        rare:   { aliases: ['rara'],   color: '#f87171' },
        epic:   { aliases: ['epica'],  color: '#60a5fa' },
      },
      templates: [], cards: [], artFolderPath: '', frameImages: {},
    }
    useProjectStore.getState().loadProject(data)
    expect(useUiStore.getState().isDirty).toBe(false)
  })
})

describe('saveProject', () => {
  const validProject: ProjectFile = {
    version: 1,
    set: { name: 'Save Test', code: 'SV', type: 'Custom', releaseDate: '' },
    classColors: {}, cardTypes: [], phaseAbbreviations: {}, phaseMap: {},
    rarityConfig: {
      common: { aliases: ['comune'], color: '#4ade80' },
      rare:   { aliases: ['rara'],   color: '#f87171' },
      epic:   { aliases: ['epica'],  color: '#60a5fa' },
    },
    templates: [], cards: [], artFolderPath: '', frameImages: {},
  }

  beforeEach(() => {
    freshStore()
    freshUiStore()
    useProjectStore.getState().loadProject(validProject)
    useUiStore.setState({ projectFilePath: '/some/path.json', isDirty: true })
    window.electronAPI = {
      showOpenDialog: vi.fn(),
      showSaveDialog: vi.fn(),
      readFile: vi.fn(),
      writeFile: vi.fn().mockResolvedValue(undefined),
      readArtFile: vi.fn(),
      listArtFiles: vi.fn(),
      getRecentProjects: vi.fn(),
      addRecentProject: vi.fn().mockResolvedValue(undefined),
    }
  })

  it('calls writeFile with serialized JSON', async () => {
    await useProjectStore.getState().saveProject()
    expect(window.electronAPI.writeFile).toHaveBeenCalledWith(
      '/some/path.json',
      expect.stringContaining('"version"'),
    )
  })

  it('clears isDirty after saving', async () => {
    await useProjectStore.getState().saveProject()
    expect(useUiStore.getState().isDirty).toBe(false)
  })

  it('calls addRecentProject with the path and name', async () => {
    await useProjectStore.getState().saveProject()
    expect(window.electronAPI.addRecentProject).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/some/path.json', name: 'Save Test' }),
    )
  })

  it('opens save dialog when no path is set', async () => {
    useUiStore.setState({ projectFilePath: null })
    ;(window.electronAPI.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue('/new/path.json')
    await useProjectStore.getState().saveProject()
    expect(window.electronAPI.showSaveDialog).toHaveBeenCalled()
    expect(window.electronAPI.writeFile).toHaveBeenCalledWith('/new/path.json', expect.any(String))
  })

  it('does nothing if save dialog is cancelled', async () => {
    useUiStore.setState({ projectFilePath: null })
    ;(window.electronAPI.showSaveDialog as ReturnType<typeof vi.fn>).mockResolvedValue(null)
    await useProjectStore.getState().saveProject()
    expect(window.electronAPI.writeFile).not.toHaveBeenCalled()
  })

  it('does nothing if no project is loaded', async () => {
    freshStore()
    await useProjectStore.getState().saveProject()
    expect(window.electronAPI.writeFile).not.toHaveBeenCalled()
  })
})

describe('openProject', () => {
  const validProject: ProjectFile = {
    version: 1,
    set: { name: 'Opened Set', code: 'OP', type: 'Custom', releaseDate: '' },
    classColors: {}, cardTypes: [], phaseAbbreviations: {}, phaseMap: {},
    rarityConfig: {
      common: { aliases: ['comune'], color: '#4ade80' },
      rare:   { aliases: ['rara'],   color: '#f87171' },
      epic:   { aliases: ['epica'],  color: '#60a5fa' },
    },
    templates: [], cards: [], artFolderPath: '', frameImages: {},
  }

  beforeEach(() => {
    freshStore()
    freshUiStore()
    window.electronAPI = {
      showOpenDialog: vi.fn().mockResolvedValue('/path/to/file.json'),
      showSaveDialog: vi.fn(),
      readFile: vi.fn().mockResolvedValue(JSON.stringify(validProject)),
      writeFile: vi.fn(),
      readArtFile: vi.fn(),
      listArtFiles: vi.fn(),
      getRecentProjects: vi.fn(),
      addRecentProject: vi.fn().mockResolvedValue(undefined),
    }
  })

  it('loads the project data from the chosen file', async () => {
    await useProjectStore.getState().openProject()
    expect(useProjectStore.getState().project?.set.name).toBe('Opened Set')
  })

  it('sets the project file path', async () => {
    await useProjectStore.getState().openProject()
    expect(useUiStore.getState().projectFilePath).toBe('/path/to/file.json')
  })

  it('clears isDirty after opening', async () => {
    useUiStore.setState({ isDirty: true })
    await useProjectStore.getState().openProject()
    expect(useUiStore.getState().isDirty).toBe(false)
  })

  it('does nothing if dialog is cancelled', async () => {
    window.electronAPI = {
      ...window.electronAPI,
      showOpenDialog: vi.fn().mockResolvedValue(null),
    }
    await useProjectStore.getState().openProject()
    expect(useProjectStore.getState().project).toBeNull()
  })

  it('calls addRecentProject after opening', async () => {
    await useProjectStore.getState().openProject()
    expect(window.electronAPI.addRecentProject).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/path/to/file.json', name: 'Opened Set' }),
    )
  })
})

describe('undo history cleared on project lifecycle (task 83)', () => {
  const validProject: ProjectFile = {
    version: 1,
    set: { name: 'Loaded', code: 'LD', type: 'Custom', releaseDate: '' },
    classColors: {}, cardTypes: [], phaseAbbreviations: {}, phaseMap: {},
    rarityConfig: {
      common: { aliases: ['comune'], color: '#4ade80' },
      rare:   { aliases: ['rara'],   color: '#f87171' },
      epic:   { aliases: ['epica'],  color: '#60a5fa' },
    },
    templates: [], cards: [], artFolderPath: '', frameImages: {},
  }

  beforeEach(() => {
    freshStore()
    freshUiStore()
  })

  it('newProject clears undoStack and redoStack', () => {
    useUiStore.setState({ undoStack: [[]], redoStack: [[]] })
    useProjectStore.getState().newProject()
    expect(useUiStore.getState().undoStack).toEqual([])
    expect(useUiStore.getState().redoStack).toEqual([])
  })

  it('loadProject clears undoStack and redoStack', () => {
    useUiStore.setState({ undoStack: [[]], redoStack: [[]] })
    useProjectStore.getState().loadProject(validProject)
    expect(useUiStore.getState().undoStack).toEqual([])
    expect(useUiStore.getState().redoStack).toEqual([])
  })
})

describe('setTemplateLayers', () => {
  beforeEach(() => {
    freshStore()
    freshUiStore()
    useProjectStore.getState().newProject()
  })

  it('replaces the layers on the correct template', () => {
    const templates = useProjectStore.getState().project?.templates ?? []
    const firstId = templates[0].id
    const newLayers = [
      { id: 'l-new', type: 'rect' as const, x: 5, y: 5, width: 100, height: 50 },
    ]
    useProjectStore.getState().setTemplateLayers(firstId, newLayers)
    expect(useProjectStore.getState().project?.templates[0].layers).toEqual(newLayers)
  })

  it('does not affect other templates', () => {
    const templates = useProjectStore.getState().project?.templates ?? []
    const firstId = templates[0].id
    const secondLayersBefore = [...(templates[1]?.layers ?? [])]
    useProjectStore.getState().setTemplateLayers(firstId, [])
    expect(useProjectStore.getState().project?.templates[1].layers).toEqual(secondLayersBefore)
  })

  it('sets isDirty after setTemplateLayers', () => {
    freshUiStore()
    const firstId = useProjectStore.getState().project?.templates[0].id ?? ''
    useProjectStore.getState().setTemplateLayers(firstId, [])
    expect(useUiStore.getState().isDirty).toBe(true)
  })
})

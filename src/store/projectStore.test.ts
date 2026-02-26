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
      classColors: {}, phaseAbbreviations: {}, phaseMap: {},
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
    classColors: {}, phaseAbbreviations: {}, phaseMap: {},
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
    classColors: {}, phaseAbbreviations: {}, phaseMap: {},
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

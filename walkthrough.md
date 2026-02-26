# Slayer Card Creator — Code Walkthrough

*2026-02-26T09:51:32Z by Showboat 0.6.1*
<!-- showboat-id: e6a4f8c4-5cdb-48d2-bab3-d25acc813e8a -->

This document walks through the entire Slayer Card Creator codebase in execution order — from the moment Electron boots, through state management and UI, all the way to the export pipeline that produces a Cockatrice ZIP file.

The app uses Electron's two-process model. The **main process** (Node.js) owns the OS window, file system, and dialogs. The **renderer process** (Chromium + React) owns all UI. They communicate exclusively through a typed IPC bridge — the renderer never touches the file system directly.

## 1. Electron main process

`electron/main.ts` is the Node.js entry point. It disables GPU acceleration (required for WSL2 / Konva), creates the `BrowserWindow`, and hooks into the `will-prevent-unload` event to show a native "unsaved changes" dialog when the window is closed with a dirty project. The `requestSingleInstanceLock` call prevents duplicate windows.

```bash
cat electron/main.ts
```

```output
import { app, BrowserWindow, dialog } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { registerHandlers } from './ipc/index'

// WSL2 has no real GPU — disable GPU acceleration to prevent renderer crashes
// caused by Konva's canvas using the GPU process.
app.commandLine.appendSwitch('disable-gpu')
app.commandLine.appendSwitch('disable-software-rasterizer')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, 'public')
  : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  })

  // Use async dialog to avoid blocking the main-process event loop.
  // Not calling event.preventDefault() keeps the close cancelled by default;
  // if the user confirms, win.destroy() force-closes bypassing beforeunload.
  win.webContents.on('will-prevent-unload', () => {
    dialog.showMessageBox(win!, {
      type: 'question',
      buttons: ['Close anyway', 'Cancel'],
      defaultId: 0,
      cancelId: 1,
      title: 'Unsaved changes',
      message: 'You have unsaved changes. Close without saving?',
    }).then(({ response }) => {
      if (response === 0) {
        win?.destroy()
      }
    })
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (win) {
      if (win.isMinimized()) win.restore()
      win.focus()
    }
  })

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit()
      win = null
    }
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })

  app.whenReady().then(() => {
    registerHandlers()
    createWindow()
  })
}
```

## 2. The IPC bridge (contextBridge)

`electron/preload.ts` runs in a privileged context that can see both the Node.js `ipcRenderer` and the browser `window`. It uses Electron's `contextBridge.exposeInMainWorld` to attach a single typed object — `window.electronAPI` — to the renderer. This is the **only** communication channel the React app has to the OS. It cannot import Node.js modules or call `ipcRenderer` directly.

```bash
cat electron/preload.ts
```

```output
import { contextBridge, ipcRenderer } from 'electron'
import type { ElectronAPI, OpenDialogOptions, SaveDialogOptions, RecentProject } from '../src/types/electronApi'

const api: ElectronAPI = {
  showOpenDialog: (options: OpenDialogOptions) =>
    ipcRenderer.invoke('dialog:showOpenDialog', options),

  showSaveDialog: (options: SaveDialogOptions) =>
    ipcRenderer.invoke('dialog:showSaveDialog', options),

  readFile: (filePath: string) =>
    ipcRenderer.invoke('fs:readFile', filePath),

  writeFile: (filePath: string, data: string) =>
    ipcRenderer.invoke('fs:writeFile', filePath, data),

  readArtFile: (artFolderPath: string, filename: string) =>
    ipcRenderer.invoke('art:readArtFile', artFolderPath, filename),

  listArtFiles: (artFolderPath: string) =>
    ipcRenderer.invoke('art:listArtFiles', artFolderPath),

  getRecentProjects: () =>
    ipcRenderer.invoke('recent:getRecentProjects'),

  addRecentProject: (entry: RecentProject) =>
    ipcRenderer.invoke('recent:addRecentProject', entry),
}

contextBridge.exposeInMainWorld('electronAPI', api)
```

## 3. IPC handlers (main process side)

`electron/ipc/fileHandlers.ts` registers the main-process handlers that answer every `ipcRenderer.invoke` call. Key points:

- **`fs:writeFile`** detects a `data:` URI prefix and writes binary (base64-decoded) for ZIP files, or UTF-8 for plain text (JSON project files).
- **`art:readArtFile`** reads a card art image from the configured folder and returns it as a base64 data URI — the renderer never has a real file path to the image.
- **`recent:*`** handlers maintain an in-memory list (up to 5 entries) that persists for the lifetime of the process.

```bash
cat electron/ipc/fileHandlers.ts
```

```output
import { ipcMain, dialog } from 'electron'
import fs from 'node:fs/promises'
import path from 'node:path'
import type { RecentProject } from '../../src/types/electronApi'

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif'])
const MAX_RECENT = 5

let recentProjects: RecentProject[] = []

export function registerFileHandlers(): void {
  ipcMain.handle('dialog:showOpenDialog', async (_event, options) => {
    const result = await dialog.showOpenDialog(options)
    return result.canceled ? null : (result.filePaths[0] ?? null)
  })

  ipcMain.handle('dialog:showSaveDialog', async (_event, options) => {
    const result = await dialog.showSaveDialog(options)
    return result.canceled ? null : (result.filePath ?? null)
  })

  ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
    return fs.readFile(filePath, 'utf-8')
  })

  ipcMain.handle('fs:writeFile', async (_event, filePath: string, data: string) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    if (data.startsWith('data:')) {
      const base64 = data.split(',')[1] ?? ''
      await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
    } else {
      await fs.writeFile(filePath, data, 'utf-8')
    }
  })

  ipcMain.handle('art:readArtFile', async (_event, artFolderPath: string, filename: string) => {
    const fullPath = path.join(artFolderPath, filename)
    try {
      const buf = await fs.readFile(fullPath)
      const ext = path.extname(filename).toLowerCase().slice(1)
      return `data:image/${ext};base64,${buf.toString('base64')}`
    } catch {
      return null
    }
  })

  ipcMain.handle('art:listArtFiles', async (_event, artFolderPath: string) => {
    try {
      const entries = await fs.readdir(artFolderPath)
      return entries.filter((f) => IMAGE_EXTENSIONS.has(path.extname(f).toLowerCase()))
    } catch {
      return []
    }
  })

  ipcMain.handle('recent:getRecentProjects', () => recentProjects)

  ipcMain.handle('recent:addRecentProject', (_event, entry: RecentProject) => {
    recentProjects = [
      entry,
      ...recentProjects.filter((r) => r.path !== entry.path),
    ].slice(0, MAX_RECENT)
  })
}
```

## 4. Renderer entry and root component

`src/main.tsx` is the Vite/React entry point — the first file Chromium loads after the HTML shell. It mounts the React tree into `#root`.

```bash
cat src/main.tsx
```

```output
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { App } from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

`src/App.tsx` is the root component. Beyond rendering `AppShell`, it owns two global behaviours that must live at the top of the tree:

1. **Unsaved-changes guard** — a `beforeunload` listener checks `uiStore.isDirty` and triggers the browser's native "leave?" prompt (which Electron intercepts and replaces with the native dialog registered in `main.ts`).
2. **Keyboard shortcuts** — a `keydown` listener handles Ctrl+S (calls `saveProject`) and Ctrl+Z (shows a brief toast; undo is a post-MVP placeholder).

```bash
cat src/App.tsx
```

```output
import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { useUiStore } from '@/store/uiStore'
import { useProjectStore } from '@/store/projectStore'

export function App() {
  const saveProject = useProjectStore((s) => s.saveProject)
  const [showUndoToast, setShowUndoToast] = useState(false)

  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (useUiStore.getState().isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        void saveProject()
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        setShowUndoToast(true)
        setTimeout(() => setShowUndoToast(false), 2500)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [saveProject])

  return (
    <>
      <AppShell />
      {showUndoToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-neutral-800 text-neutral-100 text-sm px-4 py-2 rounded shadow-lg">
          Undo not yet available
        </div>
      )}
    </>
  )
}
```

## 5. State management — two Zustand stores

The app keeps all state in two Zustand stores with a clear separation of concerns:

- **`uiStore`** — transient UI state that should never be serialised to disk: which view is active, which layer is selected, export progress, the snap-grid settings, and the dirty/filepath flags.
- **`projectStore`** — the single source of truth for the project data that gets saved to disk: cards, templates, set info, class colours, phases. Every mutating action calls `markDirty()` which sets `uiStore.isDirty = true`.

```bash
cat src/store/uiStore.ts
```

```output
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
```

`projectStore` uses Zustand's Immer middleware so every action can mutate the draft directly. The full action interface below shows every operation the UI can perform — template layer CRUD, card CRUD, class/phase config, and save/open:

```bash
sed -n '66,98p' src/store/projectStore.ts
```

```output
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
```

When `newProject()` is called, the store creates a default `ProjectFile` prepopulated with six class colour configs, four phase abbreviations, a phase→card-type map, and — crucially — **four starter templates** imported as JSON assets. These templates give any new project an immediately usable card layout without requiring the user to build one from scratch.

```bash
sed -n '13,60p' src/store/projectStore.ts
```

```output
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
}

function createDefaultProject(): ProjectFile {
  return {
    version: 1,
    set: { name: 'New Set', code: 'NEW', type: 'Custom', releaseDate: '' },
    classColors: { ...DEFAULT_CLASS_COLORS },
    phaseAbbreviations: { ...DEFAULT_PHASE_ABBREVIATIONS },
    phaseMap: { ...DEFAULT_PHASE_MAP },
    templates: STARTER_TEMPLATES.map((t) => ({ ...t })),
    cards: [],
    artFolderPath: '',
    frameImages: {},
  }
}
```

## 6. App shell and view routing

`AppShell` is a pure CSS flex layout: a fixed 48-column sidebar on the left and a `flex-1` main area on the right. Navigation is implemented entirely in React — clicking a link calls `setActiveView` on `uiStore` and the `ActiveView` switch renders the corresponding view component. No router library is needed; all views are already mounted in the same Electron window.

```bash
cat src/components/layout/AppShell.tsx
```

```output
import { useUiStore, type ViewId } from '@/store/uiStore'
import { SetInfoView } from '@/views/SetInfoView'
import { TemplateListView } from '@/views/TemplateListView'
import { TemplateDesignerView } from '@/views/TemplateDesignerView'
import { CardListView } from '@/views/CardListView'
import { PreviewView } from '@/views/PreviewView'
import { ExportView } from '@/views/ExportView'
import { Header } from './Header'
import { WelcomeModal } from './WelcomeModal'

const NAV_LINKS: { id: ViewId; label: string }[] = [
  { id: 'set-info',   label: 'Set Info' },
  { id: 'templates',  label: 'Templates' },
  { id: 'designer',   label: 'Designer' },
  { id: 'cards',      label: 'Cards' },
  { id: 'preview',    label: 'Preview' },
  { id: 'export',     label: 'Export' },
]

function ActiveView() {
  const activeView = useUiStore((s) => s.activeView)
  switch (activeView) {
    case 'set-info':   return <SetInfoView />
    case 'templates':  return <TemplateListView />
    case 'designer':   return <TemplateDesignerView />
    case 'cards':      return <CardListView />
    case 'preview':    return <PreviewView />
    case 'export':     return <ExportView />
  }
}

export function AppShell() {
  const activeView = useUiStore((s) => s.activeView)
  const setActiveView = useUiStore((s) => s.setActiveView)

  return (
    <div className="flex flex-col h-screen bg-neutral-950 text-neutral-100">
      <Header />
      <WelcomeModal />
      <div className="flex flex-1 overflow-hidden">
      <nav className="w-48 shrink-0 border-r border-neutral-800 flex flex-col gap-1 p-3">
        {NAV_LINKS.map(({ id, label }) => (
          <a
            key={id}
            role="link"
            href="#"
            onClick={(e) => { e.preventDefault(); setActiveView(id) }}
            className={[
              'rounded px-3 py-2 text-sm transition-colors',
              activeView === id
                ? 'bg-neutral-700 text-white'
                : 'text-neutral-400 hover:bg-neutral-800 hover:text-white',
            ].join(' ')}
          >
            {label}
          </a>
        ))}
      </nav>

      <main className="flex-1 overflow-auto">
        <div data-testid="active-view" className="sr-only">{activeView}</div>
        <ActiveView />
      </main>
      </div>
    </div>
  )
}
```

## 7. Data types

Three TypeScript files define the entire domain model. Every other file in the codebase imports from these — they are the single source of truth for shapes.

```bash
cat src/types/card.ts
```

```output
export type CardType =
  | 'Slayer' | 'Errant' | 'Action' | 'Ploy'
  | 'Intervention' | 'Chamber' | 'Relic' | 'Dungeon' | 'Phase'

export type Rarity = 'common' | 'uncommon' | 'rare' | 'mythic'

export interface CardData {
  id: string
  name: string
  class: string
  type: CardType
  rarity: Rarity
  cost?: number
  power?: number
  hp?: number
  vp?: number
  effect: string
}
```

`CardData` is intentionally flat — no nested objects — so it round-trips through CSV and JSON losslessly. Numeric fields are `number | undefined` rather than `number | null` so that Papa Parse's `undefined`-for-missing-column behaviour maps directly onto them.

```bash
cat src/types/template.ts
```

```output
import type { CardData, CardType } from './card'

interface LayerBase {
  id: string
  x: number
  y: number
  width: number
  height: number
  label?: string
  visible?: boolean
  locked?: boolean
  showIfField?: keyof CardData
}

export interface RectLayer extends LayerBase {
  type: 'rect'
  fill?: string
  fillSource?: 'class.primary' | 'class.secondary' | 'class.gradient'
  cornerRadius?: number
  stroke?: string
  strokeWidth?: number
  opacity?: number
}

export interface ImageLayer extends LayerBase {
  type: 'image'
  imageSource: 'art' | 'frame'
  imageFit: 'cover' | 'contain' | 'fill' | 'stretch'
  opacity?: number
}

export interface TextLayer extends LayerBase {
  type: 'text'
  field: keyof CardData | 'stats' | 'statsVP'
  fontSize: number
  fontFamily?: string
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic'
  fill?: string
  align?: 'left' | 'center' | 'right'
  lineHeight?: number
  wrap?: 'word' | 'none'
}

export interface BadgeLayer extends LayerBase {
  type: 'badge'
  shape: 'circle'
  field: keyof CardData
  fill?: string
  textFill?: string
  fontSize?: number
}

export interface PhaseIconsLayer extends LayerBase {
  type: 'phase-icons'
  orientation: 'horizontal' | 'vertical'
  iconSize: number
  gap: number
  align: 'left' | 'right'
  fill?: string
  textFill?: string
  cornerRadius?: number
}

export type TemplateLayer =
  | RectLayer
  | ImageLayer
  | TextLayer
  | BadgeLayer
  | PhaseIconsLayer

export interface Template {
  id: string
  name: string
  cardTypes: CardType[]
  canvas: { width: number; height: number }
  layers: TemplateLayer[]
}
```

Each `TemplateLayer` subtype extends `LayerBase` which carries position, size, and the optional `showIfField` — a `keyof CardData` that hides the layer when the named field is absent on the current card. For example a `BadgeLayer` for `vp` can be set to `showIfField: 'vp'` so it only appears on Errant cards.

`RectLayer.fillSource` lets a rectangle's fill be driven by the rendered card's class palette (`class.primary` or `class.secondary`) without hardcoding a hex colour into the template.

```bash
cat src/types/project.ts
```

```output
import type { CardData, CardType } from './card'
import type { Template } from './template'

export interface ClassConfig {
  primary: string
  secondary: string
  cockatriceColor: string
}

export type PhaseMap = Partial<Record<CardType, string[]>>

export interface SetInfo {
  name: string
  code: string
  type: string
  releaseDate: string
}

export interface ProjectFile {
  version: number
  set: SetInfo
  classColors: Record<string, ClassConfig>
  phaseAbbreviations: Record<string, string>
  phaseMap: PhaseMap
  templates: Template[]
  cards: CardData[]
  artFolderPath: string
  frameImages: Record<string, string>
}
```

`ProjectFile` is the root type for everything saved to disk. `frameImages` is a `Record<templateId, base64DataURI>` — frame images are embedded directly in the project file so the file is fully portable. `artFolderPath` is deliberately an OS path stored as a string; art files are too large to embed and are looked up at render time via `art:readArtFile` IPC.

## 8. Project file serialization

`src/lib/projectFile.ts` is intentionally thin — JSON roundtrip with structural validation:

```bash
cat src/lib/projectFile.ts
```

```output
import type { ProjectFile } from '@/types/project'

const REQUIRED_KEYS: (keyof ProjectFile)[] = [
  'version',
  'set',
  'classColors',
  'phaseAbbreviations',
  'phaseMap',
  'templates',
  'cards',
  'artFolderPath',
  'frameImages',
]

export function serialize(project: ProjectFile): string {
  return JSON.stringify(project, null, 2)
}

export function deserialize(raw: string): ProjectFile {
  const parsed = JSON.parse(raw)
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('Invalid project file: not an object')
  }
  for (const key of REQUIRED_KEYS) {
    if (!(key in parsed)) {
      throw new Error(`Invalid project file: missing required key "${key}"`)
    }
  }
  return parsed as ProjectFile
}
```

## 9. CSV import

`src/lib/csvParser.ts` wraps Papa Parse. Notable design choices:

- **`transformHeader: (h) => h.toLowerCase().trim()`** — column names are normalised at parse time, so a spreadsheet with `Name`, `TYPE`, or `Effect` headers works identically to lowercase.
- **`rarityRaw || 'common'`** — blank rarity defaults to `'common'` rather than rejecting the row. Dungeon and Phase cards often have no rarity.
- **`mergeByName`** — importing a CSV into an existing card list updates cards matched by name instead of appending duplicates.

```bash
cat src/lib/csvParser.ts
```

```output
import Papa from 'papaparse'
import type { CardData, CardType, Rarity } from '@/types/card'

const CARD_TYPES = new Set<string>([
  'Slayer', 'Errant', 'Action', 'Ploy', 'Intervention', 'Chamber', 'Relic', 'Dungeon', 'Phase',
])
const RARITIES = new Set<string>(['common', 'uncommon', 'rare', 'mythic'])
const REQUIRED_COLUMNS = ['name', 'type', 'effect'] as const

export interface ParseResult {
  cards: CardData[]
  errors: string[]
}

function sanitizeNumber(val: string | undefined): number | undefined {
  if (!val) return undefined
  const stripped = val.replace(/[^0-9.]/g, '')
  if (!stripped) return undefined
  const n = parseInt(stripped, 10)
  return isNaN(n) ? undefined : n
}

export function mergeByName(existing: CardData[], incoming: CardData[]): CardData[] {
  const result = [...existing]
  for (const card of incoming) {
    const idx = result.findIndex((c) => c.name === card.name)
    if (idx !== -1) {
      result[idx] = { ...result[idx], ...card, id: result[idx].id }
    } else {
      result.push(card)
    }
  }
  return result
}

export function parseCSV(raw: string): ParseResult {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.toLowerCase().trim(),
  })

  const errors: string[] = []
  const cards: CardData[] = []

  const headers = parsed.meta.fields ?? []
  const missingCols = REQUIRED_COLUMNS.filter((c) => !headers.includes(c))
  if (missingCols.length > 0) {
    errors.push(`Missing required columns: ${missingCols.join(', ')}`)
    return { cards, errors }
  }

  parsed.data.forEach((row, i) => {
    const rowNum = i + 2
    const rowErrors: string[] = []

    const typeRaw = (row['type'] ?? '').trim()
    const rarityRaw = (row['rarity'] ?? '').trim().toLowerCase() || 'common'

    if (!CARD_TYPES.has(typeRaw)) {
      rowErrors.push(`Row ${rowNum}: invalid type "${typeRaw}"`)
    }
    if (!RARITIES.has(rarityRaw)) {
      rowErrors.push(`Row ${rowNum}: invalid rarity "${rarityRaw}"`)
    }

    errors.push(...rowErrors)
    if (rowErrors.length > 0) return

    cards.push({
      id: crypto.randomUUID(),
      name: (row['name'] ?? '').trim(),
      class: (row['class'] ?? '').trim(),
      type: typeRaw as CardType,
      rarity: rarityRaw as Rarity,
      cost: sanitizeNumber(row['cost']),
      power: sanitizeNumber(row['power']),
      hp: sanitizeNumber(row['hp']),
      vp: sanitizeNumber(row['vp']),
      effect: (row['effect'] ?? '').trim(),
    })
  })

  return { cards, errors }
}
```

## 10. Card validation

`src/lib/cardValidation.ts` defines which fields are required per card type. This is used purely as **warnings** in the UI (red outlines on blank cells in the card table) — it never blocks export. `getCardsWithNoTemplate` is used by the export view to warn when cards exist that no template can render.

```bash
cat src/lib/cardValidation.ts
```

```output
import type { CardData, CardType } from '@/types/card'
import type { Template } from '@/types/template'

export const REQUIRED_FIELDS: Record<CardType, (keyof CardData)[]> = {
  Slayer:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'effect'],
  Errant:       ['name', 'class', 'type', 'rarity', 'cost', 'power', 'hp', 'vp', 'effect'],
  Action:       ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Ploy:         ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Intervention: ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Chamber:      ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Relic:        ['name', 'class', 'type', 'rarity', 'cost', 'effect'],
  Dungeon:      ['name', 'type', 'effect'],
  Phase:        ['name', 'type', 'effect'],
}

export function getMissingFields(card: CardData): (keyof CardData)[] {
  const required = REQUIRED_FIELDS[card.type] ?? []
  return required.filter((field) => {
    const val = card[field]
    return val === undefined || val === null || val === ''
  })
}

export function getCardsWithNoTemplate(cards: CardData[], templates: Template[]): CardData[] {
  return cards.filter(
    (card) => !templates.some((t) => t.cardTypes.includes(card.type)),
  )
}
```

## 11. Layer helpers — the shared logic between designer and renderer

`src/lib/layerHelpers.ts` contains three pure functions used by both the live canvas in the Template Designer and the off-screen renderer during export. Keeping them in a separate module means the logic is tested once and shared:

- **`shouldShowLayer`** — returns `false` when a layer's `showIfField` names a field that is blank on the current card. Returns `true` when no card is available (designer preview without a card selected).
- **`resolveFieldText`** — resolves a layer's bound `field` to a display string. The synthetic fields `stats` and `statsVP` format power/hp and VP respectively.
- **`resolveRectFill`** — maps a rect layer's `fillSource` to a colour from the project's class palette using the current card's class.

```bash
cat src/lib/layerHelpers.ts
```

```output
import type { CardData } from '@/types/card'
import type { ClassConfig } from '@/types/project'
import type { RectLayer, TextLayer } from '@/types/template'

const FALLBACK_FILL = '#555555'

export function shouldShowLayer(
  layer: { showIfField?: keyof CardData },
  previewCard: CardData | null,
): boolean {
  if (!layer.showIfField) return true
  if (!previewCard) return true
  const val = previewCard[layer.showIfField]
  return val !== undefined && val !== null && val !== '' && val !== 0
}

export function resolveFieldText(
  field: TextLayer['field'],
  card: CardData | null,
): string {
  if (!card) return `[${field}]`
  if (field === 'stats') return `${card.power ?? '-'}/${card.hp ?? '-'}`
  if (field === 'statsVP') return `${card.vp ?? '-'} VP`
  const val = card[field as keyof CardData]
  return val !== undefined && val !== null ? String(val) : `[${field}]`
}

export function resolveRectFill(
  layer: RectLayer,
  classColors: Record<string, ClassConfig>,
  previewCard: CardData | null,
): string {
  if (!layer.fillSource) return layer.fill ?? FALLBACK_FILL
  if (!previewCard) return FALLBACK_FILL
  const config = classColors[previewCard.class]
  if (!config) return FALLBACK_FILL
  if (layer.fillSource === 'class.primary') return config.primary
  if (layer.fillSource === 'class.secondary') return config.secondary
  return layer.fill ?? FALLBACK_FILL
}
```

## 12. The rendering pipeline

The rendering pipeline is used in two places: the live Template Designer preview and the batch export. It has three files:

### 12a. Image loader — preloading art and frame images

Before rendering a batch of cards, `imageLoader.ts` loads all images into `HTMLImageElement` objects and caches them by key. Art images are fetched via the `art:readArtFile` IPC call (which returns a base64 data URI from the main process). Frame images are already stored as base64 data URIs in `project.frameImages`.

```bash
cat src/lib/renderer/imageLoader.ts
```

```output
import type { ProjectFile } from '@/types/project'

export async function preloadArtImages(
  project: ProjectFile,
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  if (!project.artFolderPath) return map

  for (const card of project.cards) {
    const base64 = await window.electronAPI?.readArtFile(project.artFolderPath, card.name)
    if (base64) {
      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => resolve()
        img.src = base64
      })
      map.set(card.name, img)
    }
  }
  return map
}

export async function preloadFrameImages(
  project: ProjectFile,
): Promise<Map<string, HTMLImageElement>> {
  const map = new Map<string, HTMLImageElement>()
  for (const [templateId, base64] of Object.entries(project.frameImages)) {
    const img = new Image()
    await new Promise<void>((resolve) => {
      img.onload = () => resolve()
      img.src = base64
    })
    map.set(templateId, img)
  }
  return map
}
```

### 12b. Card renderer — off-screen Konva stage

`renderCard` creates an invisible `div` off-screen at `x: -9999`, mounts a full `Konva.Stage` into it, iterates the template layers, delegates to a per-type render function, draws the stage, then calls `stage.toBlob()` to get a PNG. The stage and container are destroyed immediately afterward so memory is not leaked across a large batch.

```bash
cat src/lib/renderer/cardRenderer.ts
```

```output
import Konva from 'konva'
import { shouldShowLayer } from '@/lib/layerHelpers'
import { renderRect, renderText, renderImage, renderBadge, renderPhaseIcons } from './layerRenderers'
import type { CardData } from '@/types/card'
import type { Template } from '@/types/template'
import type { ProjectFile } from '@/types/project'

export interface RenderContext {
  card: CardData
  template: Template
  project: ProjectFile
  artImages: Map<string, HTMLImageElement>
  frameImages: Map<string, HTMLImageElement>
}

export async function renderCard(ctx: RenderContext): Promise<Blob> {
  const { template } = ctx
  const { width, height } = template.canvas

  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-9999px'
  container.style.top = '-9999px'
  document.body.appendChild(container)

  const stage = new Konva.Stage({ container, width, height })
  const layer = new Konva.Layer()

  for (const layerDef of template.layers) {
    if (!shouldShowLayer(layerDef, ctx.card)) continue
    let node: any = null
    if (layerDef.type === 'rect') node = renderRect(layerDef, ctx)
    else if (layerDef.type === 'text') node = renderText(layerDef, ctx)
    else if (layerDef.type === 'image') node = renderImage(layerDef, ctx)
    else if (layerDef.type === 'badge') node = renderBadge(layerDef, ctx)
    else if (layerDef.type === 'phase-icons') node = renderPhaseIcons(layerDef, ctx)
    if (node) layer.add(node)
  }

  stage.add(layer)
  stage.draw()

  const blob = await stage.toBlob({ mimeType: 'image/png' }) as Blob

  stage.destroy()
  document.body.removeChild(container)

  return blob
}
```

### 12c. Layer renderers — one Konva node per layer type

Each function takes a typed layer definition and the `RenderContext` (card + project) and returns a Konva node. Key behaviours:

- **`renderRect`** calls `resolveRectFill` so the colour can be driven by class palette.
- **`renderText`** calls `resolveFieldText` to convert the bound field to a string; `stats` synthesises `power/hp` and `statsVP` synthesises `vp VP`.
- **`renderImage`** tries the preloaded art or frame map; if the image is missing it renders a grey placeholder rect with the card name centred — export always produces a complete image.
- **`renderBadge`** builds a `Group` of a `Circle` plus centred `Text`.
- **`renderPhaseIcons`** reads `project.phaseMap[card.type]` and renders one chip per phase, using `phaseAbbreviations` for the label.

```bash
cat src/lib/renderer/layerRenderers.ts
```

```output
import Konva from 'konva'
import { resolveRectFill, resolveFieldText } from '@/lib/layerHelpers'
import type { RectLayer, TextLayer, ImageLayer, BadgeLayer, PhaseIconsLayer } from '@/types/template'
import type { RenderContext } from './cardRenderer'

export function renderRect(layer: RectLayer, ctx: RenderContext): Konva.Rect | null {
  if (layer.visible === false) return null
  return new (Konva.Rect as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    fill: resolveRectFill(layer, ctx.project.classColors, ctx.card),
    cornerRadius: layer.cornerRadius,
    stroke: layer.stroke,
    strokeWidth: layer.strokeWidth,
    opacity: layer.opacity ?? 1,
  })
}

export function renderText(layer: TextLayer, ctx: RenderContext): Konva.Text | null {
  if (layer.visible === false) return null
  return new (Konva.Text as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    text: resolveFieldText(layer.field, ctx.card),
    fontSize: layer.fontSize,
    fontFamily: layer.fontFamily ?? 'sans-serif',
    fontStyle: layer.fontStyle ?? 'normal',
    fill: layer.fill ?? '#ffffff',
    align: layer.align ?? 'left',
    lineHeight: layer.lineHeight ?? 1,
    wrap: layer.wrap ?? 'word',
  })
}

export function renderImage(layer: ImageLayer, ctx: RenderContext): Konva.Node | null {
  if (layer.visible === false) return null

  let image: HTMLImageElement | undefined
  if (layer.imageSource === 'frame') {
    image = ctx.frameImages.get(ctx.template.id)
  } else {
    image = ctx.artImages.get(ctx.card.name)
  }

  if (!image) {
    // Placeholder: grey rect + centered card name
    const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
    group.add(new (Konva.Rect as any)({ width: layer.width, height: layer.height, fill: '#888888' }))
    group.add(new (Konva.Text as any)({
      width: layer.width,
      height: layer.height,
      text: ctx.card.name,
      align: 'center',
      fill: '#ffffff',
    }))
    return group
  }

  return new (Konva.Image as any)({
    id: layer.id,
    x: layer.x,
    y: layer.y,
    width: layer.width,
    height: layer.height,
    image,
    opacity: layer.opacity ?? 1,
  })
}

export function renderBadge(layer: BadgeLayer, ctx: RenderContext): Konva.Group | null {
  if (layer.visible === false) return null
  const r = Math.min(layer.width, layer.height) / 2
  const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
  group.add(new (Konva.Circle as any)({
    x: layer.width / 2,
    y: layer.height / 2,
    radius: r,
    fill: layer.fill ?? '#000000',
  }))
  group.add(new (Konva.Text as any)({
    x: 0,
    y: 0,
    width: layer.width,
    height: layer.height,
    text: resolveFieldText(layer.field, ctx.card),
    fontSize: layer.fontSize ?? 18,
    fill: layer.textFill ?? '#ffffff',
    align: 'center',
  }))
  return group
}

export function renderPhaseIcons(layer: PhaseIconsLayer, ctx: RenderContext): Konva.Group | null {
  if (layer.visible === false) return null
  const phases = ctx.project.phaseMap[ctx.card.type] ?? []
  const group = new (Konva.Group as any)({ id: layer.id, x: layer.x, y: layer.y })
  const { iconSize, gap } = layer
  phases.forEach((phase, i) => {
    const offset = i * (iconSize + gap)
    const px = layer.orientation === 'horizontal' ? offset : 0
    const py = layer.orientation === 'vertical' ? offset : 0
    const subGroup = new (Konva.Group as any)({ x: px, y: py })
    subGroup.add(new (Konva.Rect as any)({
      width: iconSize,
      height: iconSize,
      fill: layer.fill ?? '#333333',
      cornerRadius: layer.cornerRadius ?? 0,
    }))
    subGroup.add(new (Konva.Text as any)({
      width: iconSize,
      height: iconSize,
      text: ctx.project.phaseAbbreviations[phase] ?? phase[0],
      fontSize: Math.floor(iconSize * 0.6),
      fill: layer.textFill ?? '#ffffff',
      align: 'center',
    }))
    group.add(subGroup)
  })
  return group
}
```

## 13. XML generation (Cockatrice format)

`generateXML` builds a Cockatrice v4 card database using the DOM API (`document.implementation.createDocument` + `XMLSerializer`). The DOM approach is used instead of string templating to guarantee valid XML escaping.

The two lookup tables map Slayer card types to the closest Cockatrice analogs — Slayer/Errant → Creature, Action/Ploy → Sorcery, Intervention → Instant, etc. — and to `tablerow` sort positions (0 = land/bottom, 3 = spell/top).

`prettyXml` post-processes the flat serializer output into indented human-readable XML by splitting on `><`, tracking depth by counting opening and closing tags.

```bash
cat src/lib/xmlGenerator.ts
```

```output
import type { CardType } from '@/types/card'
import type { ProjectFile } from '@/types/project'

const MAINTYPE: Record<CardType, string> = {
  Slayer:       'Creature',
  Errant:       'Creature',
  Action:       'Sorcery',
  Ploy:         'Sorcery',
  Intervention: 'Instant',
  Chamber:      'Enchantment',
  Relic:        'Artifact',
  Dungeon:      'Planeswalker',
  Phase:        'Land',
}

const TABLEROW: Record<CardType, number> = {
  Slayer:       2,
  Errant:       2,
  Action:       3,
  Ploy:         3,
  Intervention: 3,
  Chamber:      1,
  Relic:        1,
  Dungeon:      1,
  Phase:        0,
}

function appendText(doc: Document, parent: Element, tag: string, text: string): void {
  const el = doc.createElement(tag)
  el.textContent = text
  parent.appendChild(el)
}

export function generateXML(project: ProjectFile): string {
  const doc = document.implementation.createDocument('', 'cockatrice_carddatabase', null)
  const root = doc.documentElement
  root.setAttribute('version', '4')

  // <sets>
  const setsEl = doc.createElement('sets')
  root.appendChild(setsEl)
  const setEl = doc.createElement('set')
  setsEl.appendChild(setEl)
  appendText(doc, setEl, 'name', project.set.code)
  appendText(doc, setEl, 'longname', project.set.name)
  appendText(doc, setEl, 'settype', project.set.type)
  appendText(doc, setEl, 'releasedate', project.set.releaseDate)

  // <cards>
  const cardsEl = doc.createElement('cards')
  root.appendChild(cardsEl)

  for (const card of project.cards) {
    const cardEl = doc.createElement('card')
    cardsEl.appendChild(cardEl)

    appendText(doc, cardEl, 'name', card.name)

    // text = effect + optional phase label
    const phases = project.phaseMap[card.type] ?? []
    const phaseLabel = phases.length > 0 ? ` [${phases.join(', ')}]` : ''
    appendText(doc, cardEl, 'text', card.effect + phaseLabel)

    // <set rarity="...">code</set>
    const cardSetEl = doc.createElement('set')
    cardSetEl.setAttribute('rarity', card.rarity)
    cardSetEl.textContent = project.set.code
    cardEl.appendChild(cardSetEl)

    // <prop>
    const propEl = doc.createElement('prop')
    cardEl.appendChild(propEl)

    const maintype = MAINTYPE[card.type]
    appendText(doc, propEl, 'layout', 'normal')
    appendText(doc, propEl, 'type', `${maintype} — ${card.class} ${card.type}`)
    appendText(doc, propEl, 'maintype', maintype)

    if (card.type !== 'Dungeon' && card.type !== 'Phase') {
      const cost = card.cost !== undefined ? String(card.cost) : ''
      appendText(doc, propEl, 'manacost', cost)
      appendText(doc, propEl, 'cmc', cost)
    }

    // colors: split multi-class, look up each, join
    const classes = card.class.split(/[\s/]+/).filter(Boolean)
    const color = classes.map((c) => project.classColors[c]?.cockatriceColor ?? '').join('')
    appendText(doc, propEl, 'colors', color)
    appendText(doc, propEl, 'coloridentity', color)

    if (card.type === 'Slayer' || card.type === 'Errant') {
      appendText(doc, propEl, 'pt', `${card.power ?? 0}/${card.hp ?? 0}`)
    }

    appendText(doc, cardEl, 'tablerow', String(TABLEROW[card.type]))
    appendText(doc, cardEl, 'token', '0')
  }

  const raw = new XMLSerializer().serializeToString(doc)
  return '<?xml version="1.0" encoding="utf-8"?>\n' + prettyXml(raw)
}

function prettyXml(xml: string): string {
  const lines = xml.replace(/(>)(<)/g, '$1\n$2').split('\n')
  let depth = 0
  return lines
    .map((line) => {
      line = line.trim()
      if (!line) return null
      if (line.startsWith('</')) depth--
      const out = '  '.repeat(Math.max(0, depth)) + line
      if (line.startsWith('<') && !line.startsWith('</') && !line.endsWith('/>') && !line.includes('</')) {
        depth++
      }
      return out
    })
    .filter(Boolean)
    .join('\n')
}
```

## 14. ZIP builder — the full export pipeline

`buildZip` orchestrates everything and is the only function called by the Export view. The pipeline runs in six sequential steps:

1. **Preload art images** — fetch every card's art from the OS folder via IPC; cards with no matching file get a grey placeholder at render time.
2. **Preload frame images** — decode base64 data URIs from `project.frameImages`.
3. **Generate XML** — build the full Cockatrice XML string.
4. **Render each card** — for each card, find its template (by `cardTypes` membership), call `renderCard`, and add the resulting PNG blob to the ZIP at `pics/CUSTOM/<name>.png`. Cards with no matching template emit a warning and are skipped.
5. **Add XML** to the ZIP as `<set-code>.xml`.
6. **Pack** — call `JSZip.generateAsync` to produce the final `Blob`.

The caller (ExportView) converts the blob to a base64 data URI and passes it to `fs:writeFile` IPC, where the main process strips the header and writes the raw binary.

```bash
cat src/lib/zipBuilder.ts
```

```output
import JSZip from 'jszip'
import { preloadArtImages, preloadFrameImages } from './renderer/imageLoader'
import { renderCard } from './renderer/cardRenderer'
import { generateXML } from './xmlGenerator'
import type { ProjectFile } from '@/types/project'

export interface ZipProgress {
  phase: 'rendering' | 'packing'
  current: number
  total: number
}

export interface ZipResult {
  blob: Blob
  warnings: string[]
}

export async function buildZip(
  project: ProjectFile,
  onProgress: (progress: ZipProgress) => void,
): Promise<ZipResult> {
  const warnings: string[] = []

  // Step 1: pre-load images
  const artImages  = await preloadArtImages(project)
  const frameImages = await preloadFrameImages(project)

  // Step 2: generate XML
  const xml = generateXML(project)

  const zip = new JSZip()

  // Steps 3+4: render each card
  const total = project.cards.length
  let current = 0

  for (const card of project.cards) {
    const template = project.templates.find((t) => t.cardTypes.includes(card.type))
    if (!template) {
      warnings.push(`Skipped "${card.name}": no template for type "${card.type}"`)
      current++
      onProgress({ phase: 'rendering', current, total })
      continue
    }

    const blob = await renderCard({ card, template, project, artImages, frameImages })
    zip.file(`pics/CUSTOM/${card.name}.png`, blob)
    current++
    onProgress({ phase: 'rendering', current, total })
  }

  // Step 5: add XML
  zip.file(`${project.set.code}.xml`, xml)

  // Step 6: pack
  onProgress({ phase: 'packing', current: 0, total: 1 })
  const zipBlob = await zip.generateAsync({ type: 'blob' })
  onProgress({ phase: 'packing', current: 1, total: 1 })

  return { blob: zipBlob, warnings }
}
```

## 15. Test suite

The entire codebase is covered by unit and integration tests using Vitest and Testing Library. Tests run in jsdom (not a real browser or Electron instance), with `window.electronAPI` mocked in each file that needs it. The CI signal is a simple pass/fail on the exit code.

```bash
npm test 2>&1 | tail -10
```

```output
 ✓ src/store/uiStore.test.ts (8 tests) 4ms
 ✓ src/lib/layerHelpers.test.ts (19 tests) 5ms
 ✓ src/types/template.test.ts (7 tests) 3ms
 ✓ src/types/card.test.ts (4 tests) 2ms

 Test Files  45 passed (45)
      Tests  372 passed (372)
   Start at  10:56:55
   Duration  3.06s (transform 2.27s, setup 3.29s, collect 9.91s, tests 10.78s, environment 25.14s, prepare 3.84s)

```

372 tests across 45 test files, all green. Each layer of the stack has its own test file: types are tested with typecheck assertions, pure functions (csvParser, xmlGenerator, layerHelpers, cardValidation) with unit tests, React components with Testing Library render + user-event tests, and Zustand stores with direct state manipulation.

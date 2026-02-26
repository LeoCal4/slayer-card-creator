# Slayer Card Creator — Implementation Plan

> This document is the implementation blueprint for the Electron app described in RESEARCH.md.
> All design decisions have been resolved. Inline notes are for implementer guidance only.

---

## Table of Contents

1. [Milestones Overview](#1-milestones-overview)
2. [Project Setup](#2-project-setup)
3. [Folder Structure](#3-folder-structure)
4. [TypeScript Type System](#4-typescript-type-system)
5. [State Management (Zustand)](#5-state-management-zustand)
6. [Electron / IPC Layer](#6-electron--ipc-layer)
7. [Application Shell & Navigation](#7-application-shell--navigation)
8. [View: Set Info](#8-view-set-info)
9. [View: Card List & CSV Import](#9-view-card-list--csv-import)
10. [View: Template List](#10-view-template-list)
11. [View: Template Designer](#11-view-template-designer)
12. [View: Preview](#12-view-preview)
13. [View: Export](#13-view-export)
14. [Card Rendering Pipeline](#14-card-rendering-pipeline)
15. [Cockatrice XML Generator](#15-cockatrice-xml-generator)
16. [ZIP Builder](#16-zip-builder)
17. [Project File (.slayer)](#17-project-file-slayer)
18. [Build & Packaging](#18-build--packaging)
19. [Recommended Implementation Order](#19-recommended-implementation-order)
20. [Resolved Decisions Reference](#20-resolved-decisions-reference)

---

## 1. Milestones Overview

| # | Milestone | Deliverable |
|---|-----------|-------------|
| M1 | Scaffold | Electron + React + Vite boots; navigation between views |
| M2 | Data Layer | TypeScript types, Zustand stores, project file save/load |
| M3 | Card Entry | Card list view, manual row editing, CSV import |
| M4 | Set Info | Class palette editor, phase map editor |
| M5 | Template Designer (basic) | Add/move/resize layers on canvas; rect and text layers |
| M6 | Template Designer (advanced) | All layer types: image, badge, phase-icons; frame upload; snap grid |
| M7 | Preview | Off-screen render of a single card; lazy preview grid |
| M8 | Export | Full XML generation + batch card rendering + ZIP download |
| M9 | Polish | Validation, error messages, empty states, recently opened projects |
| M10 | Packaging | electron-builder → Windows `.exe` installer |

---

## 2. Project Setup

### Toolchain

Use **electron-vite** (`npm create electron-vite@latest`) as the project scaffold.
It configures Vite for both the main process and renderer in one step, avoiding manual
Vite + Electron glue.

```bash
npm create electron-vite@latest slayer-card-creator -- --template react-ts
cd slayer-card-creator
npm install
```

### Additional Dependencies

```bash
# Core runtime
npm install react-konva konva
npm install zustand
npm install papaparse
npm install jszip
npm install electron-store
npm install @tanstack/react-table   # card list table (sorting, filtering, virtual rows)

# Designer drag-to-reorder
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities

# UI / styling
npm install tailwindcss @tailwindcss/vite
npm install lucide-react            # icon set for the app UI chrome

# Dev / types
npm install -D @types/papaparse
npm install -D @types/jszip
```

### Tailwind Setup

Add `@tailwindcss/vite` to `vite.config.ts` (renderer config). No `tailwind.config.js` needed
with the Vite plugin.

### TypeScript Config

- `strict: true`
- `moduleResolution: "bundler"`
- Path alias: `@/` → `src/`

---

## 3. Folder Structure

```
slayer-card-creator/
├── electron/
│   ├── main.ts              # Electron main process — window creation, app lifecycle
│   ├── preload.ts           # contextBridge: exposes safe IPC API to renderer
│   └── ipc/
│       ├── fileHandlers.ts  # IPC handlers: open/save/dialog/art-folder
│       └── index.ts         # Registers all handlers
├── src/
│   ├── main.tsx             # React entry point
│   ├── App.tsx              # Root: layout shell + navigation
│   ├── types/
│   │   ├── card.ts          # CardData, CardType, Rarity enums
│   │   ├── template.ts      # Template, TemplateLayer discriminated union
│   │   └── project.ts       # ProjectFile, ClassConfig, PhaseMap, etc.
│   ├── store/
│   │   ├── projectStore.ts  # All project data (cards, templates, set info, etc.)
│   │   └── uiStore.ts       # Transient UI state (active view, selected layer, etc.)
│   ├── views/
│   │   ├── SetInfoView.tsx
│   │   ├── TemplateListView.tsx
│   │   ├── TemplateDesignerView.tsx
│   │   ├── CardListView.tsx
│   │   ├── PreviewView.tsx
│   │   └── ExportView.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Sidebar + main area wrapper
│   │   │   ├── Sidebar.tsx             # Nav links + project name
│   │   │   └── Header.tsx              # Save / Load / Export buttons
│   │   ├── designer/
│   │   │   ├── DesignerCanvas.tsx      # react-konva Stage + Layer; Transformer
│   │   │   ├── LayerPanel.tsx          # Ordered list of layers; drag-to-reorder
│   │   │   ├── PropertiesPanel.tsx     # Per-layer property editor
│   │   │   ├── AddLayerMenu.tsx        # Dropdown: Add rect/image/text/badge/phase-icons
│   │   │   └── konva-layers/
│   │   │       ├── RectKonvaLayer.tsx        # Rect (solid / class-driven / gradient)
│   │   │       ├── ImageKonvaLayer.tsx       # Frame or art image
│   │   │       ├── TextKonvaLayer.tsx        # Text bound to a field
│   │   │       ├── BadgeKonvaLayer.tsx       # Cost badge (circle + number overlay)
│   │   │       └── PhaseIconsKonvaLayer.tsx  # Row/column of phase squares
│   │   ├── cards/
│   │   │   ├── CardTable.tsx           # TanStack Table data grid of all cards
│   │   │   ├── CardRow.tsx             # A single editable row
│   │   │   └── CSVImportModal.tsx      # File picker + parse + conflict dialog
│   │   ├── set-info/
│   │   │   ├── ClassPaletteEditor.tsx  # Edit primary/secondary/cockatriceColor per class
│   │   │   └── PhaseMapTable.tsx       # Edit phaseMap + phaseAbbreviations
│   │   ├── preview/
│   │   │   ├── CardPreviewTile.tsx     # Renders one card via off-screen Konva
│   │   │   └── PreviewGrid.tsx         # Lazy grid of CardPreviewTile
│   │   └── common/
│   │       ├── ColorPicker.tsx         # Inline color swatch + hex input
│   │       ├── FileDropZone.tsx        # Drag-and-drop file target
│   │       ├── Modal.tsx               # Generic modal wrapper
│   │       └── EmptyState.tsx          # Placeholder when a list is empty
│   ├── lib/
│   │   ├── renderer/
│   │   │   ├── cardRenderer.ts         # Off-screen Konva stage; returns PNG blob
│   │   │   └── layerRenderers.ts       # One render function per layer type
│   │   ├── csvParser.ts                # Papa Parse wrapper + row validator
│   │   ├── xmlGenerator.ts             # Builds Cockatrice XML string from card list
│   │   ├── zipBuilder.ts               # Orchestrates render + XML + JSZip
│   │   └── projectFile.ts              # Serialize / deserialize .slayer JSON
│   └── assets/
│       ├── icons/
│       │   └── cost-circle.svg         # Built-in cost badge icon
│       └── templates/
│           ├── creature.json           # Starter Creature template (Slayer, Errant)
│           ├── spell.json              # Starter Spell template (Action, Ploy, Intervention)
│           ├── permanent.json          # Starter Permanent template (Chamber, Relic)
│           └── text-heavy.json         # Starter Text-Heavy template (Dungeon, Phase)
├── resources/
│   ├── icon.ico                        # App icon (placeholder until final design)
│   └── file-icon.ico                   # (optional, for future file association)
├── vite.config.ts
├── electron-builder.yml
├── tsconfig.json
├── tsconfig.node.json
└── package.json
```

---

## 4. TypeScript Type System

### 4.1 Card Types (`src/types/card.ts`)

```typescript
export type CardType =
  | "Slayer" | "Errant" | "Action" | "Ploy"
  | "Intervention" | "Chamber" | "Relic" | "Dungeon" | "Phase";

export type Rarity = "common" | "uncommon" | "rare" | "mythic";

export interface CardData {
  id: string;           // UUID — internal only, not exported
  name: string;
  class: string;        // e.g. "Cleric" or "Cleric,Warrior"
  type: CardType;
  rarity: Rarity;
  cost?: number;        // absent for Dungeon, Phase
  power?: number;       // Slayer, Errant
  hp?: number;          // Slayer, Errant
  vp?: number;          // Errant only
  effect: string;
}
```

### 4.2 Template Layers (`src/types/template.ts`)

The layer type is a **discriminated union** — the `type` field acts as the discriminant.
TypeScript narrows properties per-layer-type throughout the codebase.

Layer types:
- `rect` — background rectangle (solid color, class-driven, or gradient)
- `image` — frame overlay or card art
- `text` — a card data field rendered as text
- `badge` — a shape (currently: circle) with a data value overlaid (used for cost)
- `phase-icons` — a row or column of small squares, one per applicable phase

```typescript
interface LayerBase {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible?: boolean;
  locked?: boolean;
  showIfField?: keyof CardData;   // skip rendering if this field is blank
}

export interface RectLayer extends LayerBase {
  type: "rect";
  fill?: string;               // hex color; omit if using fillSource
  fillSource?: "class.primary" | "class.secondary" | "class.gradient";
  cornerRadius?: number;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
}

export interface ImageLayer extends LayerBase {
  type: "image";
  imageSource: "art" | "frame";  // "art" = card art by name; "frame" = template frame PNG
  imageFit: "cover" | "contain" | "fill" | "stretch";
  opacity?: number;
}

export interface TextLayer extends LayerBase {
  type: "text";
  field: keyof CardData | "stats" | "statsVP";
  fontSize: number;
  fontFamily?: string;
  fontStyle?: "normal" | "bold" | "italic" | "bold italic";
  fill?: string;
  align?: "left" | "center" | "right";
  lineHeight?: number;
  wrap?: "word" | "none";
}

// Renders a shape (e.g. circle) with a card field value overlaid.
// Named "badge" rather than "icon" to distinguish it from PhaseIconsLayer.
export interface BadgeLayer extends LayerBase {
  type: "badge";
  shape: "circle";              // extensible for future badge shapes
  field: keyof CardData;        // value overlaid (e.g. "cost")
  fill?: string;
  textFill?: string;
  fontSize?: number;
}

export interface PhaseIconsLayer extends LayerBase {
  type: "phase-icons";
  orientation: "horizontal" | "vertical";  // layout direction of the phase squares
  iconSize: number;
  gap: number;
  align: "left" | "right";     // horizontal anchor (relevant when orientation is horizontal)
  fill?: string;                // background of each square
  textFill?: string;
  cornerRadius?: number;
}

export type TemplateLayer =
  | RectLayer | ImageLayer | TextLayer | BadgeLayer | PhaseIconsLayer;

export interface Template {
  id: string;
  name: string;
  cardTypes: CardType[];        // exactly one template per card type
  canvas: { width: number; height: number };
  layers: TemplateLayer[];
}
```

### 4.3 Project File (`src/types/project.ts`)

```typescript
export interface ClassConfig {
  primary: string;          // hex color
  secondary: string;        // hex color (used for gradients)
  cockatriceColor: string;  // free-text Cockatrice color string (e.g. "W", "WR", "Custom1")
}

export type PhaseMap = Partial<Record<CardType, string[]>>;

export interface SetInfo {
  name: string;
  code: string;
  type: string;
  releaseDate: string;
}

export interface ProjectFile {
  version: number;          // schema version for future migration
  set: SetInfo;
  classColors: Record<string, ClassConfig>;
  phaseAbbreviations: Record<string, string>;
  phaseMap: PhaseMap;
  templates: Template[];
  cards: CardData[];
  artFolderPath: string;
  frameImages: Record<string, string>;  // templateId → base64 PNG
}
```

---

## 5. State Management (Zustand)

Two stores: one for project data (persisted to `.slayer`), one for UI state (ephemeral).

### 5.1 `projectStore.ts`

Holds the full `ProjectFile` content plus actions:

```
project: ProjectFile | null

// Set Info actions
updateSetInfo(partial: Partial<SetInfo>): void
updateClassColor(className: string, partial: Partial<ClassConfig>): void
addClassColor(className: string, config: ClassConfig): void
deleteClassColor(className: string): void
updatePhaseAbbreviation(phase: string, letter: string): void
updatePhaseMap(type: CardType, phases: string[]): void

// Template actions
addTemplate(template: Template): void
updateTemplate(id: string, partial: Partial<Template>): void
deleteTemplate(id: string): void
addLayer(templateId: string, layer: TemplateLayer): void
updateLayer(templateId: string, layerId: string, partial: Partial<TemplateLayer>): void
deleteLayer(templateId: string, layerId: string): void
reorderLayers(templateId: string, orderedIds: string[]): void
setFrameImage(templateId: string, base64: string): void

// Card actions
setCards(cards: CardData[]): void   // replaces all (post CSV import)
addCard(card: CardData): void
updateCard(id: string, partial: Partial<CardData>): void
deleteCard(id: string): void

// Art / project-level
setArtFolderPath(path: string): void

// Project file I/O (calls Electron IPC)
newProject(): void
loadProject(data: ProjectFile): void
saveProject(filePath?: string): Promise<void>   // saves to last path; prompts if none
```

The store uses `immer` middleware (included with Zustand) so nested updates are mutation-style.

Undo/redo is **post-MVP**. The designer does not have undo in the initial version.

### 5.2 `uiStore.ts`

Ephemeral — not persisted:

```
activeView: ViewId           // "set-info" | "templates" | "designer" | "cards" | "preview" | "export"
activeTemplateId: string | null
selectedLayerId: string | null
previewCardId: string | null
exportStatus: "idle" | "running" | "done" | "error"
exportProgress: { current: number; total: number }
projectFilePath: string | null    // path of the currently loaded file
isDirty: boolean                  // unsaved changes
snapGridEnabled: boolean          // snap-to-grid toggle in the template designer
snapGridSize: number              // grid cell size in px, default 5
```

---

## 6. Electron / IPC Layer

### 6.1 Security Model

- `nodeIntegration: false`, `contextIsolation: true` (Electron security defaults)
- All Node.js access goes through the preload script via `contextBridge`
- The renderer never imports `fs`, `path`, or `electron` directly

### 6.2 Preload Script (`electron/preload.ts`)

Exposes a typed `window.electronAPI` object:

```typescript
export interface ElectronAPI {
  // File dialogs
  showOpenDialog(options: Electron.OpenDialogOptions): Promise<string | null>;
  showSaveDialog(options: Electron.SaveDialogOptions): Promise<string | null>;

  // File I/O
  readFile(filePath: string): Promise<string>;    // returns UTF-8 string
  writeFile(filePath: string, content: string): Promise<void>;

  // Folder-based art lookup
  readArtFile(folderPath: string, cardName: string): Promise<string | null>; // base64 PNG or null
  listArtFiles(folderPath: string): Promise<string[]>;  // list of filenames

  // App settings (electron-store)
  getRecentProjects(): Promise<string[]>;
  addRecentProject(filePath: string): Promise<void>;
}
```

### 6.3 IPC Handlers (`electron/ipc/fileHandlers.ts`)

One `ipcMain.handle()` per method above. Art file reads return base64-encoded PNG strings
so they can be fed directly to Konva's `Image` node via `new Image()` in the renderer.

### 6.4 Main Process (`electron/main.ts`)

- Create `BrowserWindow` (1280×800, min 1024×700)
- Load Vite dev server in dev, `dist/index.html` in production
- Register all IPC handlers
- Handle `app.on('second-instance', ...)` to focus existing window if already open

File association for `.slayer` files is **not included** in the initial release (skipped
to avoid complexity). Users open projects via the in-app Open button or recent projects list.

---

## 7. Application Shell & Navigation

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Header: [Project name] [●unsaved]  [New] [Open] [Save] [Export] │
├──────────┬──────────────────────────────────────────────────┤
│ Sidebar  │  Main content area                               │
│          │                                                  │
│ Set Info │                                                  │
│ Templates│                                                  │
│ Cards    │                                                  │
│ Preview  │                                                  │
│ Export   │                                                  │
└──────────┴──────────────────────────────────────────────────┘
```

### `App.tsx`

- Renders `<AppShell>` which contains `<Sidebar>` + current view component
- `uiStore.activeView` drives which view is rendered (simple conditional, no router needed —
  Electron apps are single-page with no URL bar)
- On startup: show a "Welcome" modal prompting New Project or Open Project if no project loaded

### Dirty State / Unsaved Changes

- Every `projectStore` write action sets `uiStore.isDirty = true`
- Save resets `isDirty = false`
- Header shows `●` indicator when dirty
- Closing the window while dirty → Electron `before-unload` confirmation dialog

---

## 8. View: Set Info

**Purpose:** Edit the set metadata, class palette, and phase configuration.

### Sections

1. **Set Metadata** — Name, code (max 8 chars, auto-uppercased), type, release date. Simple
   form inputs.

2. **Class Palette** (`ClassPaletteEditor`) — One row per class:
   - Class name (editable text input)
   - Primary color swatch → `ColorPicker`
   - Secondary color swatch → `ColorPicker`
   - Cockatrice color string — **free-text input** (not a dropdown). Accepts any string
     (e.g. `"W"`, `"WR"`, `"Custom"`). This allows finer-grained filtering in Cockatrice
     beyond the standard 5 MTG letters.
   - Delete row button
   - "Add Class" button at bottom

3. **Phase Configuration** (`PhaseMapTable`) — **Editable** (the game is still evolving):
   - Phase abbreviation map: one row per phase name → single-character text input for the
     phase square letter
   - Phase-to-type assignment grid: rows = phases, columns = card types; each cell is a
     checkbox indicating whether that card type can be played in that phase. Changes write
     directly to `project.phaseMap`.

### `ColorPicker` Component

A small inline component: colored square, clicking opens a native `<input type="color">`
plus a hex text field. No external library needed.

---

## 9. View: Card List & CSV Import

### Card Table

Built with **`@tanstack/react-table` v8** (headless, tree-shakeable). Chosen because 250+
cards benefit from column sorting, text filtering, and optional pagination without building
those from scratch.

Columns: `name | class | type | rarity | cost | power | hp | vp | effect`

- Each cell renders as an inline `<input>` (clicking the cell focuses it)
- Cells irrelevant to the row's card type are rendered greyed-out and non-interactive
  (e.g. `power` on an Action card)
- Row has a delete button (confirm before delete)
- "Add Card" button appends a blank row, scrolls to it
- Column headers are clickable for sort

### CSV Import Modal

Triggered by "Import CSV" button. Flow:

1. User picks `.csv` file via `showOpenDialog`
2. Papa Parse parses it in the renderer (sync mode)
3. Validation: check required columns exist; flag rows with unknown `type` values
4. If cards already exist → show conflict dialog:
   - "Replace all" (discard existing)
   - "Merge by name" (update existing matched by name; append new)
5. Assign UUIDs to each imported card
6. Call `projectStore.setCards()` or merge

### CSV Parser (`src/lib/csvParser.ts`)

```typescript
interface ParseResult {
  cards: CardData[];
  errors: { row: number; message: string }[];
}

export function parseCSV(raw: string): ParseResult
```

- Uses Papa Parse with `{ header: true, skipEmptyLines: true }`
- Validates `type` against the `CardType` union; unknown types → error entry
- **Numeric field sanitization:** before parsing `cost`, `power`, `hp`, `vp`, strip all
  non-numeric characters (including emojis, stray letters, etc.) using
  `value.replace(/[^0-9.]/g, '')` before passing to `parseInt` / `parseFloat`.
  Empty string after stripping → `undefined`. This prevents emoji or formatting artifacts
  in the CSV from producing `NaN` values.
- Trims whitespace from all string fields

---

## 10. View: Template List

### Layout

- Grid of template cards, each showing:
  - Template name
  - Which card types use it (badges)
  - A static aspect-ratio box (375:523) as a visual placeholder
  - Edit / Duplicate / Delete buttons
  - "Export JSON" button for sharing the template file
- "New Template" button → creates a blank template, navigates to designer
- "Import Template" button → opens a `.json` file, validates, adds to project

### Default Templates

On "New Project", the app pre-populates **4 starter templates** bundled as JSON files in
`src/assets/templates/`. These are loaded and added to the project automatically so users
can immediately open and customize them rather than starting from a blank canvas.

The 4 templates follow the layer layout documented in RESEARCH.md §5:
- `creature.json` — Slayer, Errant
- `spell.json` — Action, Ploy, Intervention
- `permanent.json` — Chamber, Relic
- `text-heavy.json` — Dungeon, Phase

### Template–Type Exclusivity

Each card type belongs to **exactly one template**. The "Edit Template" UI enforces this:
when a card type checkbox is checked on template A, it is automatically unchecked on whatever
template previously held it (with a confirmation prompt).

---

## 11. View: Template Designer

This is the most complex view. Three-panel layout:

```
┌───────────────┬────────────────────────────┬───────────────┐
│ Layer Panel   │ Canvas                     │ Properties    │
│               │                            │               │
│ [+] Add Layer │  [Konva Stage]             │ (per-layer    │
│               │                            │  controls)    │
│ ↕ frame       │                            │               │
│ ↕ bg-class    │                            │               │
│ ↕ art-zone    │                            │               │
│ ↕ name-text   │                            │               │
│ ...           │                            │               │
└───────────────┴────────────────────────────┴───────────────┘
```

Above the canvas: template name (editable inline), card type checkboxes, canvas size inputs,
"Preview Card" selector, and snap-grid toggle.

### 11.1 Canvas (`DesignerCanvas.tsx`)

- `react-konva` `Stage` with one `Layer` containing all template layers
- Canvas is CSS-scaled to fit the available panel width via `transform: scale(factor)`,
  where `factor = panelWidth / 375`. This preserves Konva's internal pixel math.
- Konva `Transformer` wraps the selected shape — provides drag + resize handles
- Clicking a shape fires `uiStore.setSelectedLayer(id)`
- Clicking empty canvas deselects

### 11.2 Snap-to-Grid

The designer includes an **optional snap-to-grid** feature to make precise layer placement easier.

- Toggle button in the toolbar above the canvas: "Snap [ON/OFF]"
- Grid size is configurable in `uiStore.snapGridSize` (default: 5 px; common values: 1, 5, 10)
- Implementation: each draggable Konva node's `dragBoundFunc` rounds its position to the
  nearest multiple of `snapGridSize`:
  ```typescript
  dragBoundFunc: (pos) => ({
    x: Math.round(pos.x / snapGridSize) * snapGridSize,
    y: Math.round(pos.y / snapGridSize) * snapGridSize,
  })
  ```
- When snap is enabled, a faint grid overlay is drawn on the canvas background (using
  Konva `Line` nodes) to give visual feedback of the grid.
- Resize handles (via Transformer) also snap: after `transformend`, round the node's
  `x`, `y`, `width`, `height` to the grid.

### 11.3 Layer Panel (`LayerPanel.tsx`)

- Ordered list — index 0 is the bottommost layer (drawn first), displayed at the **bottom**
  of the list (Photoshop/Figma convention). The topmost layer in the list is rendered last
  (on top).
- Drag-to-reorder using `@dnd-kit/sortable`
- Each row: layer type icon + layer `id` label + visibility toggle + lock toggle
- Clicking a row selects the corresponding layer on the canvas

### 11.4 Properties Panel (`PropertiesPanel.tsx`)

Shows editable properties for the selected layer. Fields vary by type:

| Layer Type | Properties |
|------------|-----------|
| `rect` | x, y, width, height; fill (color or fillSource picker); cornerRadius; stroke + strokeWidth; opacity; showIfField |
| `image` | x, y, width, height; imageSource (art/frame); imageFit; opacity; (upload button when imageSource=frame) |
| `text` | x, y, width, height; field (dropdown); fontSize; fontFamily; fontStyle; fill; align; lineHeight; showIfField |
| `badge` | x, y, width, height; shape (currently "circle"); field (dropdown); fill; textFill; fontSize |
| `phase-icons` | x, y; orientation (horizontal/vertical toggle); iconSize; gap; align; fill; textFill; cornerRadius |

All numeric fields use `<input type="number">` with appropriate min/max guards.
Position and size can also be adjusted by dragging/resizing on the canvas.

`showIfField` is a dropdown: `["", "cost", "power", "hp", "vp", "effect"]`.

### 11.5 Konva Layer Components

Each layer type maps to a react-konva component. The same rendering logic is shared with
the off-screen card renderer via `layerRenderers.ts` (see §14).

**RectKonvaLayer:**
- `fillSource = "class.primary"` → resolve single class color from `classColors`
- `fillSource = "class.gradient"` → Konva `LinearGradientFill` between two class primary colors
- Otherwise: use `fill` directly

**ImageKonvaLayer:**
- `imageSource = "frame"` → display the base64 frame image from `frameImages[templateId]`
- `imageSource = "art"` → display the preview card's art from the art folder
- Fit modes (cover/contain/fill/stretch) implemented via Konva clipping + scaling

**TextKonvaLayer:**
- Looks up `field` value from the preview card (placeholder text if no preview card selected)
- Konva `Text` node with `wrap: "word"`

**BadgeKonvaLayer:**
- Draws a Konva `Circle` with `fill` color
- Overlays a centered `Text` node with the field value (e.g. cost number)

**PhaseIconsKonvaLayer:**
- Derives phases from `project.phaseMap[previewCard.type]`
- For each phase: draws a small `Rect` (square with optional `cornerRadius`), then a `Text`
  node with the phase abbreviation from `project.phaseAbbreviations`
- **Horizontal orientation:** squares arranged left-to-right; `align: "right"` anchors the
  group's right edge to `x + width`
- **Vertical orientation:** squares stacked top-to-bottom; `x` is the left edge of the column

### 11.6 Frame Image Upload

In the Properties panel for `image` layers with `imageSource = "frame"`: an upload button
opens a file dialog (`.png`, `.jpg` filter). The selected file is read via IPC → base64 →
stored in `projectStore.setFrameImage(templateId, base64)`.

### 11.7 Add Layer

`AddLayerMenu` is a dropdown listing all 5 layer types. Selecting one calls
`projectStore.addLayer(templateId, defaultLayerForType())`. Defaults place the new layer
in the center of the canvas at a reasonable size.

### 11.8 Preview Card Selector

A dropdown above the canvas: "Preview as: [card name]". Defaults to the first card whose
type matches one of `template.cardTypes`. Changing the selection immediately re-renders all
data-bound layers on the canvas with the new card's data.

---

## 12. View: Preview

### Layout

A responsive grid of rendered card images, one per card. Each tile:
- Rendered card image (`<img>`)
- Card name below
- Type badge

### Rendering

Rendering is **lazy-on-scroll** using `IntersectionObserver`. Each `CardPreviewTile`:
1. Starts as a grey placeholder box (correct aspect ratio)
2. When scrolled into view, calls `cardRenderer.renderCard(...)` (§14)
3. Replaces placeholder with the rendered `<img src={dataURL} />`
4. Re-renders if the card or its template changes (dependency comparison)

An additional "Render All" button triggers sequential batch rendering of all tiles with a
progress counter, for cases where the user wants to do a full review before export.

---

## 13. View: Export

### Layout

- Summary: "X cards · Y templates · Z art files found"
- "Export ZIP" button
- Progress bar (two phases: "Rendering cards…" and "Packing ZIP…")
- Scrollable log of warnings and errors (art files not found, cards without templates, etc.)
- Success message with filename when complete

### Flow

1. User clicks "Export ZIP"
2. `uiStore.exportStatus = "running"`
3. Call `zipBuilder.buildZip(project, onProgress)` (§16)
4. On completion: `showSaveDialog` with filter `{ name: "ZIP Archive", extensions: ["zip"] }`
5. Write ZIP bytes to the chosen path via IPC `writeFile`
6. `uiStore.exportStatus = "done"`

---

## 14. Card Rendering Pipeline

The same rendering code serves both the live Preview tiles and the Export batch. Nothing is
duplicated — `cardRenderer.ts` is called in both contexts.

### `src/lib/renderer/cardRenderer.ts`

```typescript
export interface RenderContext {
  card: CardData;
  template: Template;
  project: ProjectFile;
  artImages: Map<string, HTMLImageElement>;   // keyed by card name; pre-loaded
  frameImages: Map<string, HTMLImageElement>; // keyed by templateId; pre-loaded
}

export async function renderCard(ctx: RenderContext): Promise<Blob>
```

Implementation:
1. Create an invisible `div`, append to `document.body`
2. Create `Konva.Stage({ container: div, width, height })` from `template.canvas`
3. Create a Konva `Layer`
4. Iterate `template.layers` in order (index 0 = bottom):
   - Check `showIfField`: if the card field is empty/undefined/zero, skip this layer
   - Call `layerRenderers[layer.type](layer, ctx)` → returns a Konva `Node`
   - Add node to layer
5. Add layer to stage; call `stage.draw()`
6. Call `stage.toBlob({ mimeType: "image/png" })` → `Blob`
7. Destroy stage; remove div from DOM
8. Return blob

### `src/lib/renderer/layerRenderers.ts`

One function per layer type, mirroring the Konva component logic in §11.5.
Pure functions: `(layer: LayerType, ctx: RenderContext) => Konva.Node`.

### Art Image Pre-Loading

Before a batch render, the orchestrator (in `zipBuilder.ts` or `PreviewGrid`) pre-loads all
art images at once:

```typescript
for (const card of project.cards) {
  const base64 = await electronAPI.readArtFile(project.artFolderPath, card.name);
  if (base64) {
    const img = new Image();
    img.src = `data:image/png;base64,${base64}`;
    await new Promise(resolve => { img.onload = resolve; });
    artImages.set(card.name, img);
  }
}
```

**Placeholder art:** If `artImages.get(card.name)` is undefined, the art zone renders as a
solid grey `Rect` with the card name centered in white text.

### Class Color Resolution

```typescript
function resolveClassFill(layer: RectLayer, card: CardData, classColors: Record<string, ClassConfig>) {
  const classes = card.class.split(",").map(s => s.trim());
  if (layer.fillSource === "class.primary") {
    return classColors[classes[0]]?.primary ?? "#888888";
  }
  if (layer.fillSource === "class.gradient") {
    // Returns a Konva LinearGradientFill descriptor
    const c1 = classColors[classes[0]]?.primary ?? "#888888";
    const c2 = classColors[classes[1]]?.primary ?? "#444444";
    return { linearGradient: { start: {x:0,y:0}, end: {x:375,y:0}, colorStops: [0, c1, 1, c2] } };
  }
  return layer.fill ?? "#888888";
}
```

---

## 15. Cockatrice XML Generator

### `src/lib/xmlGenerator.ts`

```typescript
export function generateXML(project: ProjectFile): string
```

Uses `DOMParser` + `XMLSerializer` (available as browser APIs in the Electron renderer)
rather than template strings, ensuring special characters in card names and effect text are
properly escaped.

### Field Mapping

| CardData field | XML location | Notes |
|----------------|-------------|-------|
| `name` | `<name>` | |
| `effect` | `<text>` | Phase label appended: `"Haste. [Encounter]"` |
| `rarity` | `<set rarity="...">` | |
| `type` | `<prop><type>` | Game type string e.g. `"Slayer"` |
| `type` | `<prop><maintype>` | Cockatrice internal type (see MAINTYPE map below) |
| `cost` | `<prop><manacost>`, `<prop><cmc>` | Omitted for Dungeon and Phase |
| `class` | `<prop><colors>`, `<prop><coloridentity>` | Resolved to Cockatrice color strings; multiple classes concatenated |
| `power` + `hp` | `<prop><pt>` | Format: `"3/2"` |
| type → tablerow | `<tablerow>` | See TABLEROW map below |

### Phase Label Appended to Text

```typescript
const phases = project.phaseMap[card.type] ?? [];
const phaseLabel = phases.length > 0 ? ` [${phases.join(", ")}]` : "";
const xmlText = (card.effect ?? "") + phaseLabel;
```

### Cockatrice `tablerow` Map

```typescript
const TABLEROW: Record<CardType, number> = {
  Slayer: 2, Errant: 2,
  Action: 3, Ploy: 3, Intervention: 3,
  Chamber: 1, Relic: 1,
  Dungeon: 1,   // Planeswalker zone (permanent that stays in play)
  Phase: 0,     // Lands zone
};
```

### Cockatrice `maintype` Map

```typescript
const MAINTYPE: Record<CardType, string> = {
  Slayer: "Creature",     Errant: "Creature",
  Action: "Sorcery",      Ploy: "Sorcery",
  Intervention: "Instant",
  Chamber: "Enchantment", Relic: "Artifact",
  Dungeon: "Planeswalker",  // Dungeon cards appear in the planeswalker zone in Cockatrice
  Phase: "Land",
};
```

> **Note on Dungeon mapping:** Dungeons are persistent in-play cards with lots of text,
> similar in feel to planeswalkers. Mapping them to `maintype: "Planeswalker"` in Cockatrice
> places them in the permanents zone (tablerow=1) rather than the lands zone, which better
> reflects their gameplay role.

---

## 16. ZIP Builder

### `src/lib/zipBuilder.ts`

```typescript
export interface ZipProgress {
  current: number;
  total: number;
  phase: "rendering" | "packing";
}

export async function buildZip(
  project: ProjectFile,
  onProgress: (p: ZipProgress) => void
): Promise<Blob>
```

Implementation:
1. Generate XML string via `xmlGenerator.generateXML(project)`
2. Pre-load all art images in one pass (see §14)
3. Pre-load all frame images from `project.frameImages` (base64 → `HTMLImageElement`)
4. For each card (with progress callback at `phase: "rendering"`):
   a. Find the card's template: `templates.find(t => t.cardTypes.includes(card.type))`
   b. If no template found: log warning, skip card
   c. Call `renderCard(ctx)` → PNG blob
   d. Add to JSZip at path `pics/CUSTOM/<card.name>.png`
5. Add XML string to JSZip at `<set.code>.xml` (root level)
6. Call `zip.generateAsync({ type: "blob" })` at `phase: "packing"`
7. Return blob

---

## 17. Project File (.slayer)

### `src/lib/projectFile.ts`

```typescript
export function serialize(project: ProjectFile): string     // JSON.stringify with 2-space indent
export function deserialize(raw: string): ProjectFile       // JSON.parse + validation
```

`deserialize` guards:
- Checks `version` field is present and numeric (future migration hook)
- Verifies top-level required keys exist (`set`, `classColors`, `templates`, `cards`, etc.)
- Throws a descriptive `Error` on failure so the UI can show a friendly message

### Save Flow

1. `projectStore.saveProject()` is called (from header button or Ctrl+S)
2. If `uiStore.projectFilePath` is null → `showSaveDialog({ filters: [{ name: "Slayer Project", extensions: ["slayer"] }] })`
3. If user cancels the dialog → abort silently
4. Serialize project → write via IPC `writeFile(filePath, json)`
5. `electronAPI.addRecentProject(filePath)`
6. `uiStore.isDirty = false`; `uiStore.projectFilePath = filePath`

### Load Flow

1. User clicks "Open" or selects a recent project
2. `showOpenDialog({ filters: [...], properties: ["openFile"] })` → `filePath`
3. `electronAPI.readFile(filePath)` → raw JSON string
4. `deserialize(raw)` → `ProjectFile` (throws on parse error → show error modal)
5. `projectStore.loadProject(data)`; `uiStore.projectFilePath = filePath`; `uiStore.isDirty = false`
6. Navigate to Set Info view

### Recent Projects

`electron-store` persists `recentProjects: string[]` (max 5 file paths, most-recent first).
The Welcome screen and an "Open Recent" submenu in the header both surface this list.

---

## 18. Build & Packaging

### `electron-builder.yml`

```yaml
appId: com.slayer.card-creator
productName: Slayer Card Creator
directories:
  output: dist-electron
files:
  - "dist/**/*"
  - "electron/main.js"
  - "electron/preload.js"
win:
  target: nsis
  icon: resources/icon.ico
nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
```

File association for `.slayer` is not included in this release.

### Icons Required

- `resources/icon.ico` — app icon (multi-size ICO, 256×256 minimum)
- Placeholder solid-color icon used for development; final icon designed later

### Build Scripts (`package.json`)

```json
{
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "npm run build && electron-builder"
  }
}
```

### Distribution

Output: `dist-electron/Slayer Card Creator Setup.exe` (NSIS installer).
Distribute via USB stick, Google Drive, or any file-sharing method. No internet required to
install or run.

---

## 19. Recommended Implementation Order

Steps are numbered to minimize blocked work — each phase is self-contained and testable.

### Phase 1 — Scaffold (M1)
1. `npm create electron-vite@latest` → verify dev server boots
2. Install all dependencies
3. Configure Tailwind
4. Create full folder structure (empty placeholder files)
5. Write type files: `card.ts`, `template.ts`, `project.ts`
6. Stub out Zustand stores
7. Build `AppShell` + `Sidebar` (hardcoded nav links)
8. Stub out all 6 view components; navigation between them working

### Phase 2 — Electron IPC (M2 partial)
9. Write `preload.ts` with all `contextBridge` methods
10. Write `fileHandlers.ts` with all `ipcMain.handle()` calls
11. New Project / Open Project / Save Project flow working end-to-end with a minimal
    data structure

### Phase 3 — Card List (M3)
12. `CardTable` with `@tanstack/react-table` — columns, sorting, filtering
13. Inline cell editing; greyed-out irrelevant cells by card type
14. Add / delete card rows
15. `CSVImportModal` — file pick, Papa Parse, validation, conflict dialog
16. `csvParser.ts` with numeric sanitization

### Phase 4 — Set Info (M4)
17. Set metadata form (name, code, type, release date)
18. `ClassPaletteEditor` — add/edit/delete class rows; free-text Cockatrice color input
19. `ColorPicker` component
20. `PhaseMapTable` — editable abbreviation inputs + phase/type checkbox grid

### Phase 5 — Template Designer basics (M5)
21. `DesignerCanvas` with Konva Stage (hardcoded 375×523)
22. Render `rect` and `text` layers from a hardcoded test template
23. Click to select layer; Transformer for drag + resize
24. `PropertiesPanel` for `rect` and `text` layers
25. `LayerPanel` with static list; `@dnd-kit/sortable` drag-to-reorder
26. `AddLayerMenu` for rect + text layer types
27. Template create / rename / switch; layer changes persist to project store

### Phase 6 — Template Designer full (M6)
28. Snap-to-grid: `uiStore` snap settings; `dragBoundFunc` on all nodes; grid overlay lines
29. `ImageKonvaLayer` — frame upload + art preview; fit mode implementation
30. `BadgeKonvaLayer` — cost circle + number overlay
31. `PhaseIconsKonvaLayer` — horizontal and vertical orientation; phase abbreviation lookup
32. `showIfField` condition: skip layers with blank fields in the designer preview
33. Class color resolution in rect layers (`fillSource`)
34. Preview card selector dropdown above canvas
35. Template export / import JSON (share templates as files)
36. Bundle 4 starter templates as JSON; load on New Project

### Phase 7 — Card Rendering + Preview (M7)
37. `layerRenderers.ts` — off-screen render function per layer type
38. `cardRenderer.ts` — off-screen Konva stage → PNG blob pipeline
39. Art file pre-loading (IPC batch); placeholder art for missing files
40. `CardPreviewTile` — lazy render via `IntersectionObserver`
41. `PreviewGrid` — responsive tile layout; "Render All" batch button

### Phase 8 — Export (M8)
42. `xmlGenerator.ts` — full Cockatrice XML with all field mappings
43. `zipBuilder.ts` — batch render + XML + JSZip with progress callback
44. Export view: progress bar, warning log, success state
45. Save ZIP dialog on export completion

### Phase 9 — Polish (M9)
46. Validation warnings: cards without a matching template
47. Validation warnings: required fields blank for a given card type
48. Empty states for all views (no cards, no templates, no project loaded)
49. Recent projects on Welcome screen
50. Window close dirty-check (`before-unload`)
51. Error boundaries around the designer canvas (prevents full-app crash on Konva errors)

### Phase 10 — Packaging (M10)
52. Create placeholder `icon.ico`
53. Verify `electron-builder.yml` config
54. Test `npm run package` on Windows
55. Smoke-test install and uninstall
56. Smoke-test full workflow: New → Import CSV → Design template → Preview → Export ZIP

---

## 20. Resolved Decisions Reference

All design decisions from the review pass are captured here for quick reference.

| Topic | Decision |
|-------|----------|
| Undo/redo | Post-MVP; not in initial release |
| Phase map editability | Editable in Set Info |
| Starter templates | 4 templates bundled as JSON; auto-loaded on New Project |
| Preview rendering | Lazy-on-scroll via `IntersectionObserver` |
| Template–type exclusivity | One template per card type; enforced in UI |
| Missing template at export | Skip card, log warning; acceptable |
| Sets per project | Always exactly one |
| Art folders | One global art folder per project |
| Cockatrice color input | Free-text (not a dropdown); accepts any string |
| `IconLayer` naming | Renamed to `BadgeLayer` / `type: "badge"` |
| Phase icons orientation | `orientation: "horizontal" \| "vertical"` property added |
| Snap-to-grid | Optional, toggle in designer toolbar; configurable grid size |
| Card table library | `@tanstack/react-table` v8 |
| Numeric CSV parsing | Strip non-numeric characters before `parseInt` |
| Dungeon Cockatrice type | `maintype: "Planeswalker"`, `tablerow: 1` |
| File association (.slayer) | Skipped in initial release |
| ZIP save location | User chooses via `showSaveDialog` |
| XML generation | `DOMParser` + `XMLSerializer` |
| Placeholder icons | Solid-color square for dev; real icons later |

---

## 21. Phase 11 — Post-v1 Refinements

### 21.1 New card type: Status

`Status` cards represent temporary in-play effects generated by other cards (buffs, conditions, tokens). Template-wise they behave identically to Dungeon and Phase: no cost, power, hp, or vp.

**Type system changes (`src/types/card.ts`):**
```typescript
export type CardType =
  | 'Slayer' | 'Errant' | 'Action' | 'Ploy'
  | 'Intervention' | 'Chamber' | 'Relic' | 'Dungeon' | 'Phase' | 'Status'
```

**Required fields:** `name`, `type`, `effect` (same as Dungeon/Phase).

**Downstream changes:**
- `csvParser.ts` — add `'Status'` to `CARD_TYPES` set
- `cardValidation.ts` — add `Status: ['name', 'type', 'effect']` to `REQUIRED_FIELDS`
- `xmlGenerator.ts` — add MAINTYPE and TABLEROW entries; suggested mapping:
  `Status → maintype: 'Enchantment'`, `tablerow: 1` (permanent zone, like Chamber)
- `projectStore.ts` — add `Status: []` to `DEFAULT_PHASE_MAP`
- Starter templates — Status shares the Dungeon/Phase template (`text-heavy.json`); update
  `cardTypes` on that template to include `'Status'`

---

### 21.2 Rarity system overhaul

The rarity set is reduced to three values. `uncommon` and `mythic` are dropped.

**New `Rarity` type (`src/types/card.ts`):**
```typescript
export type Rarity = 'common' | 'rare' | 'epic'
```

**Italian aliases** (accepted during CSV import, resolved to canonical English):
| CSV value | Resolves to |
|-----------|-------------|
| `comune`  | `common`    |
| `rara`    | `rare`      |
| `epica`   | `epic`      |

`csvParser.ts` already updated to accept these values in `RARITIES`. The parser should
normalise alias values to their canonical form when constructing `CardData` (so stored data
always uses `'common'` / `'rare'` / `'epic'`, never the Italian alias).

---

### 21.3 Rarity Configuration in Set Info

A new section in `SetInfoView`, parallel to Phase Configuration, that lets the user configure
each rarity's display name aliases and render colour.

**`ProjectFile` schema addition:**
```typescript
export interface RarityConfig {
  aliases: string[]   // editable; accepted during CSV import
  color: string       // hex; used by the rarity-diamond layer
}

// In ProjectFile:
rarityConfig: Record<Rarity, RarityConfig>
```

**Default values:**
```typescript
const DEFAULT_RARITY_CONFIG: Record<Rarity, RarityConfig> = {
  common: { aliases: ['comune'],  color: '#4ade80' },  // green
  rare:   { aliases: ['rara'],    color: '#f87171' },  // red
  epic:   { aliases: ['epica'],   color: '#60a5fa' },  // blue
}
```

**UI (`RarityConfigTable` component, new):**
- One row per rarity
- Column 1: original English name — read-only label
- Column 2: aliases — editable text input (comma-separated); pre-filled from defaults
- Column 3: colour — `ColorPicker` component

**CSV import integration:** `csvParser.ts` should build the full alias→canonical map at parse
time by merging `DEFAULT_RARITY_CONFIG` aliases with any project-level overrides. Alias
matching is case-insensitive.

---

### 21.4 Rarity diamond layer type (`rarity-diamond`)

A new layer type that renders a rotated square (rhombus/diamond) coloured by the rendered
card's rarity.

**Type definition (`src/types/template.ts`):**
```typescript
export interface RarityDiamondLayer extends LayerBase {
  type: 'rarity-diamond'
  // fill is resolved from project.rarityConfig[card.rarity].color at render time
  size: number          // diameter of the bounding square (width = height = size)
  strokeWidth?: number
  stroke?: string
}
```

`width` and `height` on `LayerBase` remain the bounding box; `size` is a convenience alias
that keeps the diamond square. `TemplateLayer` union gains `| RarityDiamondLayer`.

**Rendering:**
- Use `Konva.RegularPolygon` with `sides: 4` and rotated 45°, or a `Konva.Line` with four
  computed corner points. Both approaches produce a diamond that fits inside the bounding box.
- Fill resolved from `ctx.project.rarityConfig[ctx.card.rarity].color`.
- If no rarity config entry exists, fall back to `'#888888'`.

**Designer integration:**
- `AddLayerMenu` gains a "Rarity Diamond" option
- `PropertiesPanel` shows: x, y, size, stroke, strokeWidth, showIfField
- Default label: `'rarity'`
- `LayerPanel` shows a diamond icon for this type

**Renderer integration (`layerRenderers.ts`):**
```typescript
export function renderRarityDiamond(layer: RarityDiamondLayer, ctx: RenderContext): Konva.Shape
```

---

### 21.5 Hide native menu bar

In `electron/main.ts`, remove the default Electron application menu so the File / Edit /
View / Window / Help bar does not appear:

```typescript
import { Menu } from 'electron'
// Inside app.whenReady():
Menu.setApplicationMenu(null)
```

This must be called before `createWindow()`.

---

### 21.6 CSV import improvements

#### Delimiter selector
`CSVImportModal` gains a radio toggle **before** the file-picker step:
- "Comma (CSV)" — `delimiter: ','` (default)
- "Tab (TSV)" — `delimiter: '\t'`

The selected delimiter is passed to Papa Parse's `delimiter` option.

#### `||` sentinel value
After Papa Parse returns, any field whose trimmed value equals exactly `'||'` is replaced with
`''` before validation and card construction. This allows spreadsheets to use `||` as an
explicit "leave blank" marker without triggering validation errors.

```typescript
// Applied to every string field in the row after parsing:
function cleanValue(v: string | undefined): string {
  const t = (v ?? '').trim()
  return t === '||' ? '' : t
}
```

---

### 21.7 Layer default name = field name

When a layer with a `field` property (TextLayer, BadgeLayer, RarityDiamondLayer) is first
created via `AddLayerMenu`, the `label` is initialised to the field name rather than a generic
fallback:

```typescript
// In the default-layer factory:
{ type: 'text', field: 'effect', label: 'effect', ... }
{ type: 'badge', field: 'cost',  label: 'cost',   ... }
{ type: 'rarity-diamond',        label: 'rarity', ... }
```

When the user changes `field` in `PropertiesPanel` and the current `label` still matches the
**previous** field name (i.e. the user has not manually renamed the layer), the label is
automatically updated to the new field name.

---

### 21.8 Literal `\n` in card text rendered as newlines

Card effect text may contain the two-character sequence `\n` (backslash + n) as a line-break
marker. Both the designer canvas and the export renderer must expand this to an actual newline
before passing text to Konva:

```typescript
// In resolveFieldText (layerHelpers.ts) or at the call site in layerRenderers.ts:
const displayText = rawText.replace(/\\n/g, '\n')
```

Konva's `Text` node renders newline characters as line breaks when `wrap: 'word'` (or
`wrap: 'none'`) is set, so no other change is needed.

---

### 21.9 Implementation order for Phase 11

| # | Task | Touches |
|---|------|---------|
| 57 | Add `Status` to `CardType`; update all downstream maps | types, csvParser, cardValidation, xmlGenerator, projectStore |
| 58 | Rarity overhaul: update `Rarity` type; alias normalisation in csvParser | types, csvParser |
| 59 | `RarityConfig` in `ProjectFile`; `RarityConfigTable` in Set Info | types, project, SetInfoView |
| 60 | `RarityDiamondLayer` type + renderer + designer integration | types, layerRenderers, designer components |
| 61 | Hide native menu bar | electron/main.ts |
| 62 | CSV delimiter selector + `\|\|` sentinel | CSVImportModal, csvParser |
| 63 | Layer default name = field name | AddLayerMenu, layer factory helpers |
| 64 | `\n` literal → newline in rendered text | layerHelpers, layerRenderers |

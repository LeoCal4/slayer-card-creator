# Slayer Card Creator — TODO

> Derived from PLAN.md §19. Check off tasks as they are completed.
> Each phase is self-contained and testable before moving to the next.

---

## Phase 1 — Scaffold (M1) ✅

### 1. Bootstrap project
- [x] Scaffolded project manually (electron-vite CLI is interactive; built equivalent structure)
- [x] Node.js v24 installed via nvm; all config files created

### 2. Install dependencies
- [x] All dependencies installed (react-konva, konva, zustand, immer, papaparse, jszip,
  electron-store, @tanstack/react-table, @dnd-kit/*, tailwindcss, lucide-react, vitest, etc.)

### 3. Configure Tailwind
- [x] `@tailwindcss/vite` added to `vite.config.ts`
- [x] `@import "tailwindcss"` in `src/index.css`

### 4. TypeScript config
- [x] `strict: true`, `noUnusedLocals`, `noUnusedParameters` in `tsconfig.json`
- [x] Path alias `@/` → `src/` in `tsconfig.json` and `vite.config.ts`
- [x] Separate `vitest.config.ts` (test config isolated from Vite's Electron plugin)

### 5. Create folder structure
- [x] All directories created per PLAN.md §3

### 6. Write type files (TDD — typecheck is the red/green signal)
- [x] `src/types/card.ts` — `CardData`, `CardType`, `Rarity`
- [x] `src/types/template.ts` — `RectLayer`, `ImageLayer`, `TextLayer`,
  `BadgeLayer`, `PhaseIconsLayer`, `TemplateLayer` union, `Template`
- [x] `src/types/project.ts` — `ClassConfig`, `PhaseMap`, `SetInfo`, `ProjectFile`

### 7. Zustand stores (full implementation, TDD)
- [x] `src/store/projectStore.ts` — full implementation with immer; all actions
- [x] `src/store/uiStore.ts` — full implementation with all UI state and setters

### 8. Application shell
- [x] `src/components/layout/AppShell.tsx` — sidebar nav + main content switcher
- [x] `src/App.tsx` — renders `AppShell`
- [x] `src/main.tsx` — React root mount
- [x] All 6 view stubs: `SetInfoView`, `TemplateListView`, `TemplateDesignerView`,
  `CardListView`, `PreviewView`, `ExportView`
- [x] Clicking sidebar links switches the active view (tested)

---

## Phase 2 — Electron IPC (M2) ✅

### 9. Preload script
- [x] `electron/preload.ts` — define `ElectronAPI` interface
- [x] Expose `showOpenDialog` via `contextBridge`
- [x] Expose `showSaveDialog` via `contextBridge`
- [x] Expose `readFile` via `contextBridge`
- [x] Expose `writeFile` via `contextBridge`
- [x] Expose `readArtFile` via `contextBridge`
- [x] Expose `listArtFiles` via `contextBridge`
- [x] Expose `getRecentProjects` via `contextBridge`
- [x] Expose `addRecentProject` via `contextBridge`
- [x] `src/types/electronApi.ts` — `ElectronAPI` interface + `Window` augmentation

### 10. IPC handlers
- [x] `electron/ipc/fileHandlers.ts` — `ipcMain.handle()` for all 8 methods
- [x] `electron/ipc/index.ts` — register all handlers
- [x] Call `registerHandlers()` from `electron/main.ts`
- [x] `readArtFile`: read file → return base64 data URI or `null` if not found
- [x] `listArtFiles`: read directory, return filenames filtered to image extensions
- [x] `getRecentProjects` / `addRecentProject`: in-memory store, max 5 entries

### 11. Main process
- [x] `electron/main.ts` — `BrowserWindow` (1280×800, min 1024×700)
- [x] Load Vite dev server URL in dev; `dist/index.html` in production
- [x] Register IPC handlers on app ready
- [x] Handle `second-instance` event to focus existing window

### 12. Project file I/O
- [x] `src/lib/projectFile.ts` — `serialize(project)` → JSON (2-space indent)
- [x] `src/lib/projectFile.ts` — `deserialize(raw)` → `ProjectFile` with validation
- [x] `deserialize`: checks `version` + all required top-level keys
- [x] `projectStore.newProject()` — sets default project, marks dirty
- [x] `projectStore.saveProject()` — serialize → writeFile → clear dirty, add to recent
- [x] `projectStore.openProject()` — dialog → readFile → deserialize → load, clear dirty
- [x] `src/components/layout/Header.tsx` — New / Open / Save buttons, dirty `●` indicator
- [x] Welcome modal (`WelcomeModal.tsx`) — shown when no project; New Project / Open Project
- [x] Dirty state: every write action calls `useUiStore.getState().setDirty(true)`
- [x] Window close dirty-check: `beforeunload` listener in `App.tsx`

---

## Phase 3 — Card List & CSV Import (M3) ✅

### 13. Card table
- [x] `src/components/cards/CardTable.tsx` — `@tanstack/react-table` with all card columns
- [x] Column definitions: name, class, type (select), rarity (select), cost, power, hp, vp, effect
- [x] Column header click → ascending / descending sort with `aria-sort` attribute
- [x] Text filter input (searchbox role) — filters by name and effect
- [x] `src/components/cards/CardRow.tsx` — renders row via tanstack `flexRender`
- [x] Disabled cells: power/hp unless Slayer/Errant; vp unless Errant; cost for Dungeon/Phase
- [x] Cell `onChange` → `projectStore.updateCard(id, { field: value })`

### 14. Add / delete cards
- [x] "Add Card" button → `projectStore.addCard(blankCard with UUID)`
- [x] Delete button per row → `window.confirm` → `projectStore.deleteCard(id)`

### 15. CSV import
- [x] `src/lib/csvParser.ts` — `parseCSV(raw): ParseResult` + `mergeByName(existing, incoming)`
- [x] Papa Parse `{ header: true, skipEmptyLines: true }`
- [x] Validates required columns; collects per-row errors for invalid type/rarity
- [x] Sanitizes numeric fields: `/[^0-9.]/g` strip → `parseInt`; empty → `undefined`
- [x] Assigns `crypto.randomUUID()` to each row; trims all string fields
- [x] `src/components/cards/CSVImportModal.tsx` — self-contained flow component:
  - [x] "Import CSV" button → `showOpenDialog` (.csv filter) → `readFile` → `parseCSV`
  - [x] Error step: shows invalid rows; Proceed (imports valid) or Cancel
  - [x] Merge step (when existing cards): Replace All or Merge by Name
  - [x] Merge by Name: preserves existing id, updates fields, appends new cards

---

## Phase 4 — Set Info (M4) ✅

### 16. Set metadata form
- [x] `SetInfoView.tsx` — form inputs for: name, code (max 8 chars, auto-uppercase), type,
  release date
- [x] Each field change → `projectStore.updateSetInfo({ field: value })`

### 17. Color picker component
- [x] `src/components/common/ColorPicker.tsx` — colored square swatch button
- [x] Clicking opens a hidden `<input type="color">` (native color picker)
- [x] Hex text input next to swatch for manual entry; validate `#RRGGBB` format
- [x] Both inputs stay in sync

### 18. Class palette editor
- [x] `src/components/set-info/ClassPaletteEditor.tsx` — one row per class in `classColors`
- [x] Each row: class name input, primary `ColorPicker`, secondary `ColorPicker`,
  free-text Cockatrice color string input (any string allowed)
- [x] Row changes → `projectStore.updateClassColor(className, partial)`
- [x] "Add Class" button → `projectStore.addClassColor(newName, defaultConfig)`
- [x] Delete button per row → `projectStore.deleteClassColor(className)`

### 19. Phase configuration table
- [x] `src/components/set-info/PhaseMapTable.tsx`
- [x] Phase abbreviation section: one row per phase (Encounter, Preparation, Combat, Camp) →
  single-character text input; change → `projectStore.updatePhaseAbbreviation(phase, letter)`
- [x] Phase–type assignment grid: rows = phases, columns = card types
- [x] Each cell is a checkbox; checked = that card type plays in that phase
- [x] Checkbox change → `projectStore.updatePhaseMap(type, updatedPhaseList)`
- [x] Pre-populated from `project.phaseMap` on load

---

## Phase 5 — Template Designer: Basics (M5) ✅

### 20. Konva canvas setup
- [x] `src/components/designer/DesignerCanvas.tsx` — mount `react-konva` `Stage` + `Layer`
- [x] Canvas dimensions from `template.canvas` (default 375×523)
- [x] Clicking the empty stage background → deselect (`uiStore.selectedLayerId = null`)

### 21. Render rect and text layers
- [x] Render all `rect` layers as Konva `Rect` nodes (solid fill only for now)
- [x] Render all `text` layers as Konva `Text` nodes using placeholder text if no preview card
- [x] Layers rendered in array order (index 0 = bottom); hidden layers skipped

### 22. Layer selection
- [x] Clicking a layer shape → `uiStore.setSelectedLayer(id)`

### 23. Properties panel — rect and text
- [x] `src/components/designer/PropertiesPanel.tsx` — renders nothing when no layer selected
- [x] When a `rect` layer is selected: show x, y, width, height, fill, cornerRadius,
  stroke, strokeWidth, opacity, showIfField dropdown
- [x] When a `text` layer is selected: show x, y, width, height, field dropdown, fontSize,
  fontFamily, fontStyle, fill, align, lineHeight, showIfField dropdown
- [x] All numeric inputs: `<input type="number">` with appropriate min/max
- [x] Each field change → `projectStore.updateLayer(templateId, layerId, partial)`

### 24. Layer panel
- [x] `src/components/designer/LayerPanel.tsx` — list of layers in template
- [x] Layers displayed bottom-to-top in the list
- [x] Clicking row → `uiStore.setSelectedLayer(id)`; highlights selected row
- [x] Visibility toggle → `projectStore.updateLayer(templateId, layerId, { visible: !current })`
- [x] Lock toggle → `projectStore.updateLayer(templateId, layerId, { locked: !current })`

### 25. Add layer menu
- [x] `src/components/designer/AddLayerMenu.tsx` — dropdown button for rect and text layer types
- [x] Selecting a type calls `projectStore.addLayer(templateId, defaultLayer)`

### 26. Template management
- [x] `TemplateListView.tsx` — show template cards (name + card type badges + edit/delete buttons)
- [x] "New Template" → create blank `Template`, add to store, navigate to designer
- [x] "Edit" button → set `uiStore.activeTemplateId`, navigate to `TemplateDesignerView`
- [x] "Delete" → confirm dialog → `projectStore.deleteTemplate(id)`
- [x] `TemplateDesignerView.tsx` — shows template name (inline editable), designer panels
- [x] Template name edit → `projectStore.updateTemplate(id, { name })`
- [x] Canvas size inputs (width/height) → `projectStore.updateTemplate(id, { canvas })`
- [x] Card type checkboxes → `projectStore.updateTemplate(id, { cardTypes })`

---

## Phase 6 — Template Designer: Full (M6) ✅

### 27. Snap-to-grid
- [x] Add "Snap" toggle button above the canvas; reads `uiStore.snapGridEnabled`
- [x] Add grid size selector (e.g. 1, 5, 10 px) → `uiStore.snapGridSize`
- [x] Apply `dragBoundFunc` to all draggable Konva nodes when snap is enabled
- [x] When snap is enabled, draw a faint grid overlay on the canvas using Konva `Line` nodes

### 28. Image layer
- [x] `imageSource = "frame"`: load base64 from `project.frameImages[templateId]` → `HTMLImageElement`
- [x] Properties panel for image layer: imageSource, imageFit, opacity
- [x] Upload button (visible when `imageSource = "frame"`): `showOpenDialog` → read file →
  base64 → `projectStore.setFrameImage(templateId, base64)`
- [x] Add `image` type to `AddLayerMenu`

### 29. Badge layer (cost circle)
- [x] Render a Konva `Circle` with `fill` color + centered `Text` with field value
- [x] Properties panel for badge layer: shape, field, fill, textFill, fontSize
- [x] Add `badge` type to `AddLayerMenu`

### 30. Phase icons layer
- [x] Derive phases from `project.phaseMap[previewCard.type]`
- [x] Render small Konva `Rect` + `Text` with abbreviation per phase
- [x] Properties panel for phase-icons: orientation, iconSize, gap, align, fill, textFill, cornerRadius
- [x] Add `phase-icons` type to `AddLayerMenu`

### 31. `showIfField` condition in designer
- [x] `shouldShowLayer()` helper in `src/lib/layerHelpers.ts`
- [x] Applied before rendering each layer on the canvas

### 32. Class color resolution in rect layers
- [x] `resolveRectFill()` helper in `src/lib/layerHelpers.ts`
- [x] `fillSource = "class.primary"` / `"class.secondary"` resolved from `project.classColors`
- [x] Falls back to neutral grey if no preview card
- [x] `fillSource` dropdown in PropertiesPanel for rect layers

### 33. Preview card selector
- [x] `PreviewCardSelector` dropdown above the canvas: "Preview as: [card name]"
- [x] Populated with cards whose `type` matches `template.cardTypes`
- [x] Auto-defaults to first matching card

### 34. Art folder selector
- [x] "Select Art Folder" button in Set Info view
- [x] Opens `showOpenDialog({ properties: ["openDirectory"] })`
- [x] Path → `projectStore.setArtFolderPath(path)`

### 35. Template import / export
- [x] "Export" button per template → `showSaveDialog` → `writeFile(JSON.stringify(tmpl, 2))`
- [x] "Import Template" button → `showOpenDialog` → `readFile` → parse → `addTemplate`
- [x] Assigns new `id` to imported template

### 36. Starter templates
- [x] `src/assets/templates/slayer-errant.json` — Slayer / Errant (creature-like)
- [x] `src/assets/templates/action-ploy.json` — Action / Ploy (spell-like)
- [x] `src/assets/templates/chamber-relic.json` — Chamber / Relic (permanent-like)
- [x] `src/assets/templates/text-heavy.json` — Dungeon / Phase (text-heavy)
- [x] `projectStore.newProject()` includes all 4 starter templates

---

## Phase 7 — Card Rendering & Preview (M7) ✅

### 37. Layer renderers
- [x] `src/lib/renderer/layerRenderers.ts` — one function per layer type
- [x] `renderRect(layer, ctx)` → Konva `Rect` node with class color resolution
- [x] `renderImage(layer, ctx)` → Konva `Image` node (placeholder group when art missing)
- [x] `renderText(layer, ctx)` → Konva `Text` node with field value lookup
- [x] `renderBadge(layer, ctx)` → Konva `Circle` + `Text` nodes in a Group
- [x] `renderPhaseIcons(layer, ctx)` → Konva Group of `Rect` + `Text` nodes per phase
- [x] Each renderer respects `layer.visible`; returns `null` if `visible === false`

### 38. Off-screen card renderer
- [x] `src/lib/renderer/cardRenderer.ts` — implement `renderCard(ctx): Promise<Blob>`
- [x] Create invisible `div`, append to `document.body`
- [x] Create `Konva.Stage` on the div with template canvas dimensions
- [x] Create Konva `Layer`
- [x] Iterate layers in order; check `showIfField`; call layer renderer; add node to layer
- [x] Call `stage.draw()`
- [x] Call `stage.toBlob({ mimeType: "image/png" })` → `Blob`
- [x] Destroy stage; remove div from DOM

### 39. Art and frame image pre-loading
- [x] `src/lib/renderer/imageLoader.ts` — `preloadArtImages(project)` via IPC `readArtFile`
- [x] `preloadFrameImages(project)` — loads base64 frame images from `project.frameImages`
- [x] **Placeholder art**: if art file missing → grey `Rect` with centered card name text

### 40. Card preview tile
- [x] `src/components/preview/CardPreviewTile.tsx`
- [x] Renders as a grey placeholder box initially (correct 375:523 aspect ratio)
- [x] Uses `IntersectionObserver` — starts render when tile enters viewport
- [x] Calls `renderCard(ctx)` → displays `<img>` on completion
- [x] Shows card name and type below the image
- [x] Loading state: spinner overlay while rendering

### 41. Preview grid
- [x] `src/components/preview/PreviewGrid.tsx` — responsive CSS grid of `CardPreviewTile`
- [x] `PreviewView.tsx` — renders `PreviewGrid` with image preloading
- [x] "Render All" button — sequential batch render with progress counter
- [x] Filter bar — filter by card type (dropdown)

---

## Phase 8 — Export (M8) ✅

### 42. Cockatrice XML generator
- [x] `src/lib/xmlGenerator.ts` — implement `generateXML(project): string`
- [x] Use `document.implementation.createDocument` + `XMLSerializer` to serialize to string
- [x] Build `<cockatrice_carddatabase version="4">` root
- [x] Build `<sets>` block from `project.set`
- [x] For each card in `project.cards`, build a `<card>` element:
  - `<name>` from `card.name`
  - `<text>` from `card.effect` + appended phase label `[Phase1, Phase2]`
  - `<set rarity="...">` from `card.rarity` and `project.set.code`
  - `<prop>`:
    - `<layout>normal</layout>`
    - `<type>` = game type string
    - `<maintype>` = from `MAINTYPE` map
    - `<manacost>` + `<cmc>` = `card.cost` (omit for Dungeon, Phase)
    - `<colors>` + `<coloridentity>` = Cockatrice color strings from `classColors`
    - `<pt>` = `"power/hp"` (Slayer, Errant only)
  - `<tablerow>` from `TABLEROW` map
  - `<token>0</token>`
- [x] `MAINTYPE` map: Slayer/Errant=Creature, Action/Ploy=Sorcery, Intervention=Instant,
  Chamber=Enchantment, Relic=Artifact, Dungeon=Planeswalker, Phase=Land
- [x] `TABLEROW` map: Slayer/Errant=2, Action/Ploy/Intervention=3, Chamber/Relic/Dungeon=1, Phase=0
- [x] Multi-class: join Cockatrice color strings (e.g. `"W"` + `"R"` → `"WR"`)

### 43. ZIP builder
- [x] `src/lib/zipBuilder.ts` — implement `buildZip(project, onProgress): Promise<{ blob, warnings }>`
- [x] Step 1: pre-load art images and frame images
- [x] Step 2: generate XML string
- [x] Step 3: for each card, find its template; if none → collect warning, skip card
- [x] Step 4: `renderCard(ctx)` → add PNG blob to JSZip at `pics/CUSTOM/<card.name>.png`
- [x] Report progress: `onProgress({ current, total, phase: "rendering" })`
- [x] Step 5: add XML to JSZip at `<set.code>.xml`
- [x] Step 6: `zip.generateAsync({ type: "blob" })` → report `phase: "packing"`
- [x] Return `{ blob, warnings }`

### 44. Export view
- [x] `ExportView.tsx` — summary section: card count, template count, art files found/missing
- [x] "Export ZIP" button → calls `zipBuilder.buildZip` → shows progress label
- [x] Progress label: two phases ("Rendering cards…", "Packing ZIP…") with `current/total`
- [x] Scrollable warning/error log (cards skipped, art files not found)
- [x] Success state: filename and "Export complete" message

### 45. ZIP save dialog
- [x] On `buildZip` completion: call `showSaveDialog({ filters: [{ name: "ZIP", extensions: ["zip"] }] })`
- [x] Write blob bytes to chosen path via IPC `writeFile` (base64 data-URI; IPC handler detects and writes binary)
- [x] Handle user cancelling the save dialog gracefully (no error shown)

---

## Phase 9 — Polish (M9) ✅

### 46. Card validation warnings ✅
- [x] On export and in the export view summary: list cards whose `type` has no matching template
- [x] In the card list view: flag rows where required fields for the card's type are blank
  (e.g. Slayer card missing `power` or `hp`)

### 47. Required field validation per card type ✅
- [x] Define `REQUIRED_FIELDS: Record<CardType, (keyof CardData)[]>` map
- [x] Slayer/Errant: name, class, type, rarity, cost, power, hp, effect
- [x] Errant additionally: vp
- [x] Action/Ploy/Intervention/Chamber/Relic: name, class, type, rarity, cost, effect
- [x] Dungeon/Phase: name, type, effect
- [x] Show inline red outline on blank required cells in the card table

### 48. Empty states ✅
- [x] Card list: "No cards yet. Import a CSV or add cards manually." with action buttons
- [x] Template list: "No templates yet. Templates will be created from New Project or manually."
- [x] Preview grid: "No cards to preview." when card list is empty
- [x] Export view: warning banner when no templates or no cards are set up
- [x] `src/components/common/EmptyState.tsx` — reusable empty state component

### 49. Recent projects ✅
- [x] Welcome modal: list of up to 5 recent projects with filename and last-modified date
- [x] Clicking a recent project item → load it (handle file-not-found gracefully with error message)
- [x] Clear recent projects button

### 50. Error boundaries ✅
- [x] Wrap `DesignerCanvas` in a React error boundary to prevent canvas crashes from
  propagating to the rest of the UI
- [x] Error boundary shows a "Canvas error — please reload the template" message with a
  "Reload" button

### 51. Miscellaneous polish ✅
- [x] `src/components/common/Modal.tsx` — generic overlay modal (used by import, confirm dialogs)
- [x] `src/components/common/FileDropZone.tsx` — drag-and-drop zone for CSV and JSON imports
- [x] Keyboard shortcut: Ctrl+S → save project
- [x] Keyboard shortcut: Ctrl+Z placeholder (shows "Undo not yet available" toast) for post-MVP
- [ ] All destructive actions (delete card, delete template, replace all on import) use confirm dialog

---

## Phase 10 — Packaging (M10) ✅

### 52. App icons ✅
- [x] Create placeholder `resources/icon.ico` (solid colour square, multi-size ICO)
  — 16, 32, 48, 256 px, indigo #4f46e5; generated by `scripts/create-icon.mjs`
- [x] *(Final icon design deferred — placeholder used for initial distribution)*

### 53. electron-builder config ✅
- [x] Created `electron-builder.yml` with the config from PLAN.md §18
- [x] Set `appId: com.slayer.card-creator`, `productName: Slayer Card Creator`
- [x] Set `win.target: nsis`, `win.icon: resources/icon.ico`
- [x] Set `nsis.oneClick: false`, `allowToChangeInstallationDirectory: true`
- [x] Split `build` script (`tsc -b && vite build`) from `package` script (`npm run build && electron-builder`)

### 54. Build verification ✅
- [x] `npm run build` — 0 TypeScript or Vite errors; outputs `dist/` + `dist-electron/`
- [x] `npm run package` — electron-builder packages successfully; on WSL produces
  Linux AppImage + snap; on Windows would produce NSIS `.exe`

### 55. Windows install / uninstall smoke-test
- [ ] Install via the generated `.exe` on a Windows machine
- [ ] Verify app launches, the dev tools are not open (production mode)
- [ ] Uninstall via Windows Add/Remove Programs — verify no leftover files

### 56. Full workflow smoke-test
- [ ] New project → confirm 4 starter templates pre-loaded
- [ ] Import a sample CSV (250 cards) → verify all rows appear in card list
- [ ] Open Set Info → edit a class color → verify it reflects in the template designer
- [ ] Open Template Designer → move a layer, resize it, change a property → save project
- [ ] Reopen the saved project → verify all changes persisted correctly
- [ ] Open Preview → scroll through, verify cards render with correct colors and text
- [ ] Export ZIP → verify ZIP contains `<setcode>.xml` and one PNG per card
- [ ] Load ZIP into Cockatrice → verify cards appear with correct names, types, and images

---

## Phase 22 — Designer Polish Round F

### 65. No auto-label on new layers
- [ ] In `AddLayerMenu.tsx` `defaultLayer()`, remove `label: 'name'` from the `text` case
- [ ] In `AddLayerMenu.tsx` `defaultLayer()`, remove `label: 'cost'` from the `badge` case

### 66. ColorPicker for all colour inputs in PropertiesPanel
- [ ] Import `ColorPicker` from `@/components/common/ColorPicker` in `PropertiesPanel.tsx`
- [ ] `RectProps`: replace `<TextInput label="Fill" ...>` with `<ColorPicker>`
- [ ] `RectProps`: replace `<TextInput label="Stroke" ...>` with `<ColorPicker>` (covered by task 67 below — kept here for tracking)
- [ ] `TextProps`: replace `<TextInput label="Fill" ...>` with `<ColorPicker>`
- [ ] `BadgeProps`: replace `<TextInput label="Fill" ...>` with `<ColorPicker>`
- [ ] `BadgeProps`: replace `<TextInput label="Text Fill" ...>` with `<ColorPicker>`
- [ ] `PhaseIconsProps`: replace `<TextInput label="Fill" ...>` with `<ColorPicker>`
- [ ] `PhaseIconsProps`: replace `<TextInput label="Text Fill" ...>` with `<ColorPicker>`

### 67. Font Family fixed dropdown in TextProps
- [ ] In `PropertiesPanel.tsx` `TextProps`, replace `<TextInput label="Font Family" ...>` with a `<select>` dropdown
- [ ] Options: `sans-serif`, `serif`, `monospace`, `Arial`, `Georgia`, `Impact`, `Verdana`, `Tahoma`

### 68. Properties panel for Rarity Diamond
- [ ] Import `RarityDiamondLayer` type in `PropertiesPanel.tsx`
- [ ] Add `RarityDiamondProps` component with fields: X, Y, Width, Height (NumInput); Stroke (`ColorPicker`); Stroke Width (NumInput, min 0); Opacity (NumInput, min 0 max 1 step 0.1); Show If Field (dropdown, same options as Rect/Text)
- [ ] Wire `{layer.type === 'rarity-diamond' && <RarityDiamondProps layer={layer} templateId={templateId} />}` in `PropertiesPanel`

### 69. Vertically centre text in Cost badge
- [ ] In `DesignerCanvas.tsx` `BadgeNode`, add `verticalAlign="middle"` to the inner `<Text>` node

### 70. Selection border follows layer during drag
- [ ] In `DesignerCanvas.tsx`, add `useState<{ id: string; x: number; y: number } | null>(null)` as `dragLayerPos`
- [ ] Add `onDragMove: (x: number, y: number) => void` prop to `RectNode`, `TextNode`, `ImageNode`, `BadgeNode`, `PhaseIconsNode`
- [ ] Add `onDragMove: (x: number, y: number) => void` prop to `RarityDiamondNode` (applies center offset: `e.target.x() - layer.width/2`, `e.target.y() - layer.height/2`)
- [ ] In each node, wire Konva's `onDragMove` to call the `onDragMove` prop
- [ ] Add `onDragMove` to `LayerNode` props interface and pass through to each node
- [ ] In `DesignerCanvas`, pass `onDragMove={(x, y) => setDragLayerPos({ id: layer.id, x, y })}` to each `LayerNode`
- [ ] In `DesignerCanvas`, clear `dragLayerPos` on drag end: call `setDragLayerPos(null)` inside the `onDragEnd` handler (before or after store update)
- [ ] The selection overlay `<Rect>` uses `dragLayerPos.x / .y` when `dragLayerPos?.id === selectedLayerId`; otherwise uses `selectedVisible.x / .y`

### 71. More visible hover border
- [ ] In `DesignerCanvas.tsx`, on the hover overlay `<Rect>`: change `strokeWidth={1}` → `strokeWidth={2}` and `opacity={0.35}` → `opacity={0.6}`

### 72. Remove non-functional `align` from Phase Icons
- [ ] In `src/types/template.ts`, remove `align: 'left' | 'right'` from `PhaseIconsLayer`
- [ ] In `PropertiesPanel.tsx` `PhaseIconsProps`, remove the Align `<select>` block
- [ ] In `AddLayerMenu.tsx` `defaultLayer()` `phase-icons` case, remove `align: 'left'`
- [ ] In `src/assets/templates/action-ploy.json`, remove `"align"` from the `ap-phases` layer object
- [ ] In `src/assets/templates/slayer-errant.json`, remove `"align"` from the `se-phases` layer object
- [ ] In `src/assets/templates/chamber-relic.json`, remove `"align"` from the `cr-phases` layer object
- [ ] In `src/assets/templates/text-heavy.json`, remove `"align"` from the `th-phases` layer object

### 73. Configurable font size for Phase Icons
- [ ] In `src/types/template.ts`, add `fontSize?: number` to `PhaseIconsLayer`
- [ ] In `PropertiesPanel.tsx` `PhaseIconsProps`, add `<NumInput label="Font Size" ...>` (min 6) wired to `layer.fontSize`
- [ ] In `DesignerCanvas.tsx` `PhaseIconsNode`, replace hardcoded `Math.floor(iconSize * 0.6)` with `layer.fontSize ?? Math.floor(iconSize * 0.6)`

### 74. Vertically centre text in Phase Icon squares
- [ ] In `DesignerCanvas.tsx` `PhaseIconsNode`, add `verticalAlign="middle"` to each inner `<Text>` node

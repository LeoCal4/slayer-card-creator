# Slayer Card Creator — Research Document

> Complete design research for a local Electron webapp that helps a card game group
> generate Cockatrice-compatible XML files and rendered card images from a CSV,
> with a built-in visual card template designer.

---

## 1. Project Goals

| Goal | Description |
|------|-------------|
| CSV → XML | Import a CSV describing all cards → export Cockatrice-compatible XML |
| Template → Images | Render each card as a PNG (frame + art + text) for Cockatrice's `pics/CUSTOM/` |
| Template Designer | Visual "Canva-lite" drag-and-drop editor to design card layouts per card type |
| Project File | Save/load all work (set info + templates + cards) as a portable project file |
| Export | Download a single `.zip` ready to extract into Cockatrice |
| Distribution | Self-contained **Electron app** (.exe) for Windows — works fully offline |

---

## 2. The Card Game

### Overview

MTG-like game with a multi-phase turn structure. Cards of different types can only be
played in specific phases (determined by card type, not a per-card property). Cards
belong to one or more **classes** (analogous to MTG colors), expressed visually through
the card's background color rather than a symbol.

### Turn Phases

| # | Phase | Note |
|---|-------|------|
| 1 | **Exploration** | Non-card-play phase (movement, searching, etc.) |
| 2 | **Encounter** | |
| 3 | **Preparation** | |
| 4 | **Combat** | |
| 5 | **Camp** | |

Since Exploration is not a card-play phase, no card type maps to it and it never
appears on cards.

### Card Types, Phases, and Cockatrice Mapping

| Type | MTG Equivalent | Stats | Phase(s) | Cockatrice maintype | tablerow |
|------|---------------|-------|----------|--------------------|---------:|
| **Slayer** | Creature | Power / HP | Encounter | Creature | 2 |
| **Errant** | Creature | Power / HP / VP | Encounter | Creature | 2 |
| **Action** | Sorcery | — | Combat, Camp | Sorcery | 3 |
| **Ploy** | Sorcery | — | Preparation, Camp | Sorcery | 3 |
| **Intervention** | Instant | — | Camp | Instant | 3 |
| **Chamber** | Enchantment | — | Encounter | Enchantment | 1 |
| **Relic** | Artifact | — | Preparation, Combat | Artifact | 1 |
| **Dungeon** | Land | — | *(no phase)* | Land | 0 |
| **Phase** | Special | — | *(chosen at turn start)* | Land | 0 |

The `<type>` field in Cockatrice XML shows the game type (e.g. `"Slayer"`); `<maintype>`
is the MTG equivalent used for Cockatrice's internal sorting and display.

### Stats

| Field | Applies to | Notes |
|-------|-----------|-------|
| **Cost** | All except Dungeon, Phase | Single integer |
| **Power** | Slayer, Errant | Offensive strength |
| **HP** | Slayer, Errant | Hit points |
| **VP** | Errant | Victory points awarded when this card is killed |

### Classes

Cards belong to one or more **classes**. The six initial classes are:

| Class | Default BG color | Cockatrice color letter |
|-------|-----------------|------------------------|
| **Cleric** | Gold `#d4ac0d` | W |
| **Hunter** | Green `#27ae60` | G |
| **Mage** | Blue `#2980b9` | U |
| **Rogue** | Grey `#5d6d7e` | B |
| **Warlock** | Purple `#7d3c98` | B |
| **Warrior** | Red `#c0392b` | R |

*(Names and colors may change as the game evolves. Colors are editable in the app.)*

- Class names and background colors are **different** (class name ≠ a color name)
- Multi-class cards **exist** in the current set — comma-separated in CSV: `"Cleric,Warrior"`
- Multi-class card background: linear gradient between the two classes' primary colors
- Rogue and Warlock both map to `B` in Cockatrice (acceptable — Cockatrice uses it for filtering only)

---

## 3. Cockatrice XML Format

### File Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<cockatrice_carddatabase version="4">
  <sets>
    <set>
      <name>SNC</name>
      <longname>Slayer Set 1</longname>
      <settype>Custom</settype>
      <releasedate>2025-01-01</releasedate>
    </set>
  </sets>
  <cards>
    <card>
      <name>Flame Serpent</name>
      <text>Haste. When this enters, deal 1 damage. [Encounter]</text>
      <set rarity="common">SNC</set>
      <prop>
        <layout>normal</layout>
        <type>Slayer</type>
        <maintype>Creature</maintype>
        <manacost>3</manacost>        <!-- single integer cost -->
        <cmc>3</cmc>
        <colors>W</colors>            <!-- class Cockatrice letter(s) -->
        <coloridentity>W</coloridentity>
        <pt>3/2</pt>                  <!-- Power/HP -->
      </prop>
      <tablerow>2</tablerow>
      <token>0</token>
    </card>
  </cards>
</cockatrice_carddatabase>
```

**Notes:**
- Phase info is appended to `<text>` since Cockatrice has no native phase field
- Dungeon and Phase cards have no `<manacost>` or `<cmc>`
- Power/HP stored in `<pt>` (Cockatrice's power/toughness field)
- Dungeon and Phase cards both use `maintype=Land` (tablerow=0) — appears in the "lands" zone in Cockatrice hand display, which is acceptable

### Image Organization

- Folder: `<CockatriceData>/pics/CUSTOM/`
- Format: `.png`
- Naming: **Exact card name** (case-sensitive; colons omitted)
- Art matched by card name from a user-selected art folder (no `art` column in CSV)
- Cards without art → placeholder PNG generated by the app

### Export Package Structure

```
SlayerSet.zip
├── SlayerSet.xml
└── pics/
    └── CUSTOM/
        ├── Flame Serpent.png
        └── ...
```

---

## 4. CSV Input Format

Fixed column structure:

```csv
name,class,type,rarity,cost,power,hp,vp,effect
"Flame Serpent","Cleric","Slayer","common",3,3,2,,"Haste."
"Smoke Step","Mage","Action","uncommon",1,,,,"-2/-1 to target until end of turn."
"Vault of Ages","Warrior","Dungeon","rare",,,,,"Whenever you play an Action, draw a card."
"Shadow Stalker","Rogue","Errant","uncommon",2,2,1,3,"Stealth."
"Iron Paladin","Cleric,Warrior","Slayer","rare",4,4,3,,"Shield."
```

### Column Definitions

| Column | Type | Required | Notes |
|--------|------|----------|-------|
| `name` | string | Yes | Card display name; also used as art filename lookup |
| `class` | string | Yes | Class name(s), comma-separated for multi-class |
| `type` | string | Yes | Game type (Slayer, Action, Dungeon, etc.) |
| `rarity` | string | Yes | common / uncommon / rare / mythic |
| `cost` | integer | Most types | Omit for Dungeon and Phase cards |
| `power` | integer | Slayer/Errant | Omit for non-creature types |
| `hp` | integer | Slayer/Errant | Omit for non-creature types |
| `vp` | integer | Errant only | Victory points when killed |
| `effect` | string | No | Rules/ability text |

**Notes:**
- No `subtype` column — types are flat for now
- No `phase` column — phases are derived from `type` via the phase map in the project file
- No `art` column — art files matched from folder by card name (`<name>.png`)
- No `flavor` column — no flavor text in this game

---

## 5. Template Designer

### 4 Templates

| Template | Used For | Key Zones |
|----------|---------|-----------|
| **Creature** | Slayer, Errant | Name, Cost badge, Art, Type, Phase icons, Effect, Power/HP box, VP box *(Errant only)*, Rarity, Class BG |
| **Spell** | Action, Ploy, Intervention | Name, Cost badge, Art *(optional)*, Type, Phase icons, Effect, Rarity, Class BG |
| **Permanent** | Chamber, Relic | Name, Cost badge, Art *(optional)*, Type, Phase icons, Effect, Rarity, Class BG |
| **Text-Heavy** | Dungeon, Phase | Name, Type, Large Effect body, Class BG *(no cost, no phase icons, minimal/no art)* |

### Class-Based Background Color System

The `class` field drives the card's background color. A `rect` layer with
`"fillSource": "class.primary"` gets the class's configured primary color at render time.

For **multi-class cards**, the background uses a linear gradient between the two
classes' primary colors.

The **class palette** is stored in the project file and editable in the app:
```json
"classColors": {
  "Cleric":  { "primary": "#d4ac0d", "secondary": "#9a7d0a", "cockatriceColor": "W" },
  "Hunter":  { "primary": "#27ae60", "secondary": "#1e8449", "cockatriceColor": "G" },
  "Mage":    { "primary": "#2980b9", "secondary": "#1a5276", "cockatriceColor": "U" },
  "Rogue":   { "primary": "#5d6d7e", "secondary": "#2c3e50", "cockatriceColor": "B" },
  "Warlock": { "primary": "#7d3c98", "secondary": "#4a235a", "cockatriceColor": "B" },
  "Warrior": { "primary": "#c0392b", "secondary": "#7b241c", "cockatriceColor": "R" }
}
```

### Designer Capabilities

Each template is a **layered Konva.js canvas**. Users can:

**Layer types (drag, resize, reorder):**
- `rect` — fill: solid color, class-driven color, or gradient; corner radius, stroke
- `image (frame)` — uploaded card frame PNG as background overlay
- `image (art)` — bound to the card's art image; configurable fit mode
- `text` — bound to a card data field
- `icon` — predefined symbol shape (cost circle, phase square), overlaid with a data value
- `phase-icons` — composite layer: renders one small square per applicable phase

**Bindable data fields:**
`name`, `class`, `type`, `rarity`, `cost`, `phase`, `effect`, `power`, `hp`, `vp`,
`stats` (= `Power / HP`), `statsVP` (= `Power / HP  ·  VP`)

**Per-layer styling:**
- Background: solid color, class-driven, gradient, or uploaded PNG
- Text: font family, size, weight, style, color, alignment, line height
- Image: fit mode (cover / contain / fill / stretch), opacity

**Template metadata:**
- Name, which card types use this template, canvas dimensions

**Import / Export:**
- Templates saved as `.json` files — share to keep the group in sync

### Symbol / Icon Support

| Icon | Use | Style |
|------|-----|-------|
| **Cost badge** | Displays integer cost | Simple circle with number inside |
| **Phase icons** | Displays applicable phases | Row of small squares, one letter each |
| *(Type icons)* | Not used — type shown as text | — |

The app ships with a **built-in icon set** and also accepts **custom uploaded icons** for
future use. Icons are referenced by ID in the template JSON.

**Phase letter abbreviations** (one letter per square icon):

| Phase | Letter |
|-------|--------|
| Encounter | E |
| Preparation | P |
| Combat | B *(for Battle — avoids conflict with Camp)* |
| Camp | C |

A card with phases Combat + Camp shows: `[B][C]`

### Template JSON Format (draft)

```json
{
  "id": "template-creature",
  "name": "Creature Template",
  "cardTypes": ["Slayer", "Errant"],
  "canvas": { "width": 375, "height": 523 },
  "layers": [
    {
      "id": "bg-class", "type": "rect",
      "x": 0, "y": 0, "width": 375, "height": 523,
      "fillSource": "class.primary", "cornerRadius": 12
    },
    {
      "id": "frame", "type": "image", "imageSource": "frame",
      "x": 0, "y": 0, "width": 375, "height": 523, "imageFit": "stretch"
    },
    {
      "id": "art-zone", "type": "image", "field": "art",
      "x": 15, "y": 50, "width": 345, "height": 210, "imageFit": "cover"
    },
    {
      "id": "name-text", "type": "text", "field": "name",
      "x": 15, "y": 10, "width": 280, "height": 35,
      "fontSize": 18, "fontFamily": "Georgia", "fill": "#fff", "fontStyle": "bold"
    },
    {
      "id": "cost-badge", "type": "icon", "icon": "cost-circle", "field": "cost",
      "x": 320, "y": 8, "width": 42, "height": 42
    },
    {
      "id": "type-text", "type": "text", "field": "type",
      "x": 15, "y": 265, "width": 200, "height": 25,
      "fontSize": 13, "fill": "#fff", "fontStyle": "italic"
    },
    {
      "id": "phase-icons", "type": "phase-icons",
      "x": 220, "y": 265, "iconSize": 22, "gap": 4, "align": "right",
      "fill": "#ffffff33", "textFill": "#fff", "cornerRadius": 3
    },
    {
      "id": "effect-text", "type": "text", "field": "effect",
      "x": 15, "y": 295, "width": 345, "height": 130,
      "fontSize": 13, "fill": "#fff"
    },
    {
      "id": "stats-bg", "type": "rect",
      "x": 210, "y": 475, "width": 90, "height": 38,
      "fill": "#00000066", "cornerRadius": 6
    },
    {
      "id": "stats-text", "type": "text", "field": "stats",
      "x": 210, "y": 478, "width": 90, "height": 32,
      "fontSize": 16, "fill": "#fff", "align": "center", "fontStyle": "bold"
    },
    {
      "id": "vp-bg", "type": "rect",
      "x": 310, "y": 475, "width": 55, "height": 38,
      "fill": "#8B000066", "cornerRadius": 6,
      "showIfField": "vp"
    },
    {
      "id": "vp-text", "type": "text", "field": "vp",
      "x": 310, "y": 478, "width": 55, "height": 32,
      "fontSize": 16, "fill": "#faa", "align": "center", "fontStyle": "bold",
      "showIfField": "vp"
    }
  ]
}
```

*(Layers with `"showIfField": "vp"` are skipped if `vp` is blank — so the VP box
only appears on Errant cards. The `phase-icons` layer automatically renders
the correct set of squares for the card's type.)*

---

## 6. Project File Format

All user work is persisted as a single `.slayer` (JSON) project file:

```json
{
  "version": 1,
  "set": {
    "name": "Slayer Set 1",
    "code": "SNC",
    "type": "Custom",
    "releaseDate": "2025-01-01"
  },
  "classColors": {
    "Cleric":  { "primary": "#d4ac0d", "secondary": "#9a7d0a", "cockatriceColor": "W" },
    "Hunter":  { "primary": "#27ae60", "secondary": "#1e8449", "cockatriceColor": "G" },
    "Mage":    { "primary": "#2980b9", "secondary": "#1a5276", "cockatriceColor": "U" },
    "Rogue":   { "primary": "#5d6d7e", "secondary": "#2c3e50", "cockatriceColor": "B" },
    "Warlock": { "primary": "#7d3c98", "secondary": "#4a235a", "cockatriceColor": "B" },
    "Warrior": { "primary": "#c0392b", "secondary": "#7b241c", "cockatriceColor": "R" }
  },
  "phaseAbbreviations": {
    "Encounter": "E", "Preparation": "P", "Combat": "B", "Camp": "C"
  },
  "phaseMap": {
    "Slayer":       ["Encounter"],
    "Errant":       ["Encounter"],
    "Action":       ["Combat", "Camp"],
    "Ploy":         ["Preparation", "Camp"],
    "Intervention": ["Camp"],
    "Chamber":      ["Encounter"],
    "Relic":        ["Preparation", "Combat"],
    "Dungeon":      [],
    "Phase":        []
  },
  "templates": [ /* array of template JSON objects */ ],
  "cards": [ /* array of card objects matching CSV columns */ ],
  "artFolderPath": "/path/to/art/folder",
  "frameImages": {
    "template-creature": "<base64 PNG>",
    "template-spell": "<base64 PNG>"
  }
}
```

---

## 7. Architecture & Tech Stack

### Distribution: Electron App

Must work **fully offline** and be distributable to Windows users as a `.exe`.

| Technology | Role |
|-----------|------|
| **Electron** | Desktop wrapper; native file I/O; .exe packaging |
| **React + TypeScript** | UI framework |
| **Vite** | Build tool + dev server |
| **Konva.js / react-konva** | Canvas-based drag-and-drop template designer + card rendering |
| **Papa Parse** | CSV import and parsing |
| **JSZip** | ZIP file generation |
| **Tailwind CSS** | Styling |
| **Zustand** | Lightweight global state |
| **electron-store** | Persistent app settings (recently opened projects, etc.) |
| **electron-builder** | Packages the app into a Windows `.exe` installer |

### Application Layout

```
┌──────────────────────────────────────────────────────────────┐
│  Header: Project name + Save / Load / Export buttons         │
│  ┌──────────┐  ┌───────────────────────────────────────────┐ │
│  │ Sidebar  │  │                Main Area                  │ │
│  │          │  │                                           │ │
│  │ ▸ Set    │  │  • Set Info + class palette + phase map   │ │
│  │ ▸ Templs │  │  • Template List / Designer               │ │
│  │ ▸ Cards  │  │  • Card List + CSV import                 │ │
│  │ ▸ Preview│  │  • Card Preview grid (live render)        │ │
│  │ ▸ Export │  │  • Export → download ZIP                  │ │
│  └──────────┘  └───────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Views

1. **Set Info** — Set name, code, release date; class color palette editor; phase-to-type map; phase abbreviations
2. **Template List** — All templates; create/delete/edit
3. **Template Designer** — Konva canvas + layer panel + properties panel
4. **Card List** — Import CSV; tabular view of all cards
5. **Preview** — Grid of all rendered card images (live)
6. **Export** — Generate XML + render all images → download ZIP

---

## 8. Image Rendering Pipeline

For each card:
1. Look up the card's `type` → find assigned template
2. Instantiate an off-screen Konva stage (375×523)
3. Parse the card's `class` (split on comma for multi-class)
4. Resolve class color(s) from the class palette
5. Render each layer in z-order:
   - `fillSource: "class.primary"` rects: single class color, or gradient for multi-class
   - `image (frame)`: composite the frame PNG on top
   - `image (art)`: look up `<card name>.png` in the art folder; placeholder if missing
   - `text` layers: inject card field values
   - `icon` layers: render built-in symbol + field value overlay (e.g. cost circle)
   - `phase-icons` layer: derive phase list from `phaseMap[type]`; render one square per phase using `phaseAbbreviations`
   - Layers with `showIfField`: skip if the referenced field is blank/zero (e.g. VP box on Slayer)
6. Export to PNG → add to ZIP as `pics/CUSTOM/<card name>.png`

### Target Resolution

**375 × 523 px** — standard Cockatrice / MPC card size.

---

## Future Considerations

- Custom icon art (e.g. custom cost circle design) — currently using built-in circle; user can upload custom icons later
- Additional classes beyond the initial six
- Double-faced or split card support (not planned for current set)
- Phase abbreviation letters (B for Battle/Combat, C for Camp) can be changed in project settings if they conflict

---

## References

- [Cockatrice Custom Cards & Sets Wiki](https://github.com/Cockatrice/Cockatrice/wiki/Custom-Cards-&-Sets)
- [Cockatrice XML Schema PR (XSD)](https://github.com/Cockatrice/Cockatrice/pull/244)
- [Guide: Creating a Custom Cockatrice Plugin](https://www.mtgsalvation.com/forums/magic-fundamentals/custom-card-creation/588295-guide-creating-a-custom-cockatrice-plugin-for)
- [Grand Archive on Cockatrice (non-MTG example)](https://anoda.substack.com/p/grand-archive-on-cockatrice)
- [Konva.js — Canvas library for editors](https://konvajs.org/)
- [JSZip — In-browser ZIP generation](https://stuk.github.io/jszip/)
- [Papa Parse — CSV parsing](https://www.papaparse.com/)
- [electron-builder — Electron packaging](https://www.electron.build/)

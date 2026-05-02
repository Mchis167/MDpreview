# Project Map (Mini-map / Minimap Navigator)

**Module:** `renderer/js/components/molecules/project-map.js`  
**Type:** Molecule (composite component)  
**Purpose:** Real-time mini-map preview of current document with scroll sync and zoom controls  
**Status:** Fully implemented (v1.1.0+)

---

## User-Facing Features

### 1. Mini-map Preview
- Shows scaled-down 1:1 view of entire document
- Updates in real-time as you scroll or edit
- Hover to see viewport indicator (highlighted region in document)

### 2. Viewport Indicator
- Thin highlighted bar showing current view area
- Position = `scrollTop * scale` (mathematically accurate)
- Auto-scrolls mini-map to keep indicator centered

### 3. Zoom Controls
- Zoom Out button (`−`) — decrease from 100% to 20%
- Zoom Label — displays current zoom percentage
- Zoom In button (`+`) — increase from 100% to 100%
- Buttons auto-disable at min/max limits

### 4. Click to Navigate
- Click on mini-map to jump to that position in document
- Smooth scroll animation
- Drag to scroll document continuously

---

## How It Works Technically

### Architecture: SSR + Scaled Transform

The Project Map uses a **Server-Side Rendering (SSR) mirror strategy**:

```
Main Content (800px wide)
      ↓
    [Fetch /api/render-raw]
      ↓
Mirror Container (800px wide)
      ↓
   [Apply scale transform]
      ↓
Mini-map Panel (e.g. 150px wide @ 0.15 scale)
```

**Why SSR?**
- 100% fidelity — uses same render engine as main viewer
- Supports Mermaid diagrams, syntax highlighting, complex layouts
- No CSS breakage or missing styles
- Single source of truth for content rendering

### Content Width Synchronization

**CRITICAL:** Mirror width must match main viewer width exactly.

**How it works:**
1. JavaScript measures main viewer's `.md-content-inner` width (includes 80px padding on each side)
2. Sets CSS variable `--_mirror-width` on mirror element
3. Mirror CSS constrains mirror body width to `--_mirror-width`
4. Content renders identically to main viewer (same width, padding, layout)
5. Scale applied: `scale = (panelWidth - 24) / internalWidth`
6. ResizeObserver detects main content width changes → auto-recalculate

**Synchronization tokens (tokens.css):**
```css
--ds-content-padding-x: 80px;   /* Horizontal padding */
--ds-content-padding-y: 80px;   /* Vertical padding */
--ds-content-width: 800px;      /* Max content width */
```

Both main viewer and mirror use these tokens, ensuring padding is always in sync.

### Viewport Indicator Calculation

The viewport indicator bar position is calculated as:

```javascript
const clientHeight = _mainViewer.clientHeight;      // Visible area height
const scrollTop = _mainViewer.scrollTop;            // Current scroll position

const vHeight = clientHeight * _scale;              // Indicator height
const vTop = scrollTop * _scale;                    // Indicator position

viewport.style.height = `${vHeight}px`;
viewport.style.top = `${vTop}px`;
```

This creates a **mathematically accurate minimap** where:
- Indicator bar height ∝ visible viewport in main viewer
- Indicator bar position ∝ scroll position
- Scrolling in map = scrolling main viewer

---

## Component API

### Public Methods

#### `ProjectMap.render(mount, viewerEl)`
Initialize the component.

**Parameters:**
- `mount` — DOM element to insert project map into
- `viewerEl` — The main viewer element (scrollable area)

**Returns:** Root DOM element of project map

#### `ProjectMap.update(mapEl, viewerEl)`
Refetch and re-render content (e.g., when document changes).

**Parameters:**
- `mapEl` — Project map root element
- `viewerEl` — Main viewer element

#### `ProjectMap.syncScroll(mapEl)`
Update viewport indicator position based on current scroll.

**Parameters:**
- `mapEl` — Project map root element

#### `ProjectMap.destroy()`
Clean up resources (timers, observers, abort signals).

#### `ProjectMap.reset(mapEl)`
Clear mirror content and show skeleton (loading state).

**Parameters:**
- `mapEl` — Project map root element

---

## CSS Structure

### Class Hierarchy

```
.ds-project-map                    Root container
├── .ds-project-map__body         Scrollable area
│   └── .ds-project-map__track    Total content height
│       └── .ds-project-map__mirror     Scaled mirror (absolute positioned)
│           └── .md-render-body         Server-rendered HTML
│               └── .md-content-inner   Actual content (with padding)
│       └── .ds-project-map__viewport   Indicator bar (position: absolute)
│       └── .ds-project-map__overlay    Interaction layer (click/drag)
└── .ds-project-map__footer       Zoom controls bar
    ├── .ds-project-map__btn-out  Zoom out button
    ├── .ds-project-map__zoom-label  Zoom percentage label
    └── .ds-project-map__btn-in   Zoom in button
```

---

## Related Architecture Decisions

- **[20260428-project-map-mirror-fidelity.md](../../decisions/20260428-project-map-mirror-fidelity.md)** — SSR mirror strategy
- **[20260502-content-padding-width-synchronization.md](../../decisions/20260502-content-padding-width-synchronization.md)** — Padding/width token sync

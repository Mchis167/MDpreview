# Feature Documentation

**Last Updated:** May 12, 2026 (Wiki Reader)  
**Total Features:** 40+ modules documented  
**Status:** Organized by category

> **Recent Update (May 12):** Hoàn thiện **Wiki Reader** — vault indexer, link interception, side drawer, backlinks panel, và scanner control. Xem [WIKI_READER.md](WIKI_READER.md) để hiểu toàn bộ kiến trúc.

---

## 📚 Quick Navigation
| Category | Purpose | Files |
|----------|---------|-------|
| [**Core**](#core--application-foundation) | App state, boot, lifecycle | 2 files |
| [**Editor & Rendering**](#editor--rendering) | Markdown editing and display | 2 files |
| [**Components**](#components--ui-elements) | UI components and design system | 10 files |
| [**Publishing**](#publishing--cloudflare-workers) | Publishing to Workers | 3 files |
| [**Services**](#services--data-business-logic) | Data, search, settings services | 6 files |
| [**File Management**](#file-management--workspace) | Files, tabs, workspace | 5 files |
| [**Utilities**](#utilities--helpers) | Helper modules and bridges | 3 files |
| [**Advanced Features**](#advanced-features) | Shortcuts, TOC, preview | 6 files |
| [**Wiki Reader**](#wiki-reader) | Vault indexer, link navigation, backlinks | 1 overview |

---

## 🔧 Core — Application Foundation

**Core modules for app initialization and state management**

| Module | Purpose | Type |
|--------|---------|------|
| [**CORE_APP.md**](CORE_APP.md) | Global AppState, boot sequence, theme, socket.io | Singleton Service |
| [**ELECTRON_BRIDGE.md**](ELECTRON_BRIDGE.md) | Unified Electron ↔ Browser API bridge (File System, Clipboard, Rasterization) | API Layer |

**Key Concepts:**
- AppState is the single source of truth
- Boot sequence initializes all modules
- Electron bridge handles platform-specific operations

---

## ✏️ Editor & Rendering

**Markdown editing and display in all modes**

| Module | Purpose | Type |
|--------|---------|------|
| [**EDITOR.md**](EDITOR.md) | Textarea editor, undo/redo, dirty tracking, autosave | Component |
| [**MARKDOWN_VIEWER.md**](MARKDOWN_VIEWER.md) | Mode switching (read/edit/comment/collect), sub-component lifecycle | Organism |

**Key Concepts:**
- Editor handles text manipulation with undo/redo
- MarkdownViewer manages mode switching and rendering
- Dirty flag prevents data loss

---

## 🎨 Components — UI Elements

**Reusable UI components and design system**

| Module | Purpose | Type |
|--------|---------|------|
| [**DESIGN_SYSTEM.md**](DESIGN_SYSTEM.md) | Centralized UI factory (Buttons, Segmented, Radius, Colors) | Factory |
| [**DESIGN_SYSTEM_ICONS.md**](DESIGN_SYSTEM_ICONS.md) | Registry of all SVG icons (Modular Icons) | Registry |
| [**BASE_FORM_MODAL.md**](BASE_FORM_MODAL.md) | Standard modal form template (Header, Body, Footer) | Template |
| [**MENU_SHIELD.md**](MENU_SHIELD.md) | Floating menu shell (positioning, glassmorphism, singleton) | Organism |
| [**SETTINGS_COMPONENT.md**](SETTINGS_COMPONENT.md) | Global settings interface (Floating Popover) | Organism |
| [**EXPLORER_SETTINGS.md**](EXPLORER_SETTINGS.md) | Explorer preferences menu (show hidden, flat view) | Component |
| [**SIDEBAR_LEFT.md**](SIDEBAR_LEFT.md) | Left sidebar frame (Explorer, Search, Footer) | Organism |
| [**SCROLL_CONTAINER.md**](SCROLL_CONTAINER.md) | Smart scroll area with mask-fade and safe zone | Component |
| [**PROJECT_MAP.md**](PROJECT_MAP.md) | Mini-map displaying document outline | Component |
| [**EDIT_TOOLBAR.md**](EDIT_TOOLBAR.md) | Editor toolbar (Heading levels, formatting) | Component |
| [**QUICK_COMMAND_PALETTE.md**](components/QUICK_COMMAND_PALETTE.md) | Context-aware command palette for slash mode | Component |

**Key Concepts:**
- Design System is the single source of UI patterns
- All components extend base templates
- Glassmorphism and backdrop-blur for premium feel

---

## 📤 Publishing — Cloudflare Workers

**Publishing markdown to distributed edge network**

| Module | Purpose | Type |
|--------|---------|------|
| [**PUBLISH_SERVICE.md**](PUBLISH_SERVICE.md) | Centralized publish service (lifecycle, rename, delete) | Service |
| [**PUBLISH_COMPONENTS.md**](PUBLISH_COMPONENTS.md) | Publish UI (config, management, settings) | Components |
| [**PUBLISH_WORKER.md**](PUBLISH_WORKER.md) | Cloudflare Worker architecture, asset serving | Edge Worker |

**Key Concepts:**
- Publish service handles all publishing operations
- Worker serves published pages globally
- One-click publishing workflow

---

## 📦 Services — Data & Business Logic

**Centralized services for data management and operations**

| Module | Purpose | Type |
|--------|---------|------|
| [**SETTINGS_SERVICE.md**](SETTINGS_SERVICE.md) | Centralized settings management | Service |
| [**SEARCH_SERVICE.md**](SEARCH_SERVICE.md) | Fuzzy search and scoring engine | Service |
| [**SHORTCUT_SERVICE.md**](SHORTCUT_SERVICE.md) | Keyboard shortcut registry and execution | Service |
| [**PUBLISH_SERVICE.md**](PUBLISH_SERVICE.md) | Publishing operations (lifecycle, sync) | Service |
| [**GDOC_UTIL.md**](GDOC_UTIL.md) | HTML to Google Docs conversion (styling, rasterization) | Utility |
| [**SYNC_SERVICE.md**](SYNC_SERVICE.md) | Position sync (scroll, cursor) between views | Service |
| [**MARKDOWN_LOGIC_SERVICE.md**](services/MARKDOWN_LOGIC_SERVICE.md) | Headless Markdown logic and smart selection | Service |

**Key Concepts:**
- Each service manages a domain
- Services expose clean APIs to components
- Centralization prevents data inconsistency

---

## 🗂️ File Management — Workspace

**File tree, tabs, workspace operations**

| Module | Purpose | Type |
|--------|---------|------|
| [**WORKSPACE.md**](WORKSPACE.md) | Workspace CRUD, switching, Electron integration | Module |
| [**TREE.md**](TREE.md) | File tree render, sort, search, drag-drop | Component |
| [**TABS.md**](TABS.md) | Tab management, multi-select, batch close | Module |
| [**TREE_DRAG_MANAGER.md**](TREE_DRAG_MANAGER.md) | Drag-drop engine for Sidebar (Alphabet & VIP) | Engine |
| [**WORKSPACE_SWITCHER.md**](WORKSPACE_SWITCHER.md) | Workspace name display in Sidebar header | Molecule |

**Key Concepts:**
- Tree is the file browser
- Tabs manage open files
- Workspace is the root directory context
- Dirty check prevents data loss on workspace switch

---

## 🛠️ Utilities — Helpers

**Helper modules and bridge layers**

| Module | Purpose | Type |
|--------|---------|------|
| [**ELECTRON_BRIDGE.md**](ELECTRON_BRIDGE.md) | Electron API bridge (file system, clipboard) | API Layer |
| [**GDOC_UTIL.md**](GDOC_UTIL.md) | HTML to Google Docs conversion | Utility |
| [**RECENTLY_VIEWED.md**](RECENTLY_VIEWED.md) | File history and recent files indicator | Utility |

**Key Concepts:**
- Utilities provide cross-cutting functionality
- Bridges abstract platform differences
- Utilities are stateless or cache-only

---

## ⚡ Advanced Features

**Specialized features and advanced interactions**

| Module | Purpose | Type |
|--------|---------|------|
| [**SHORTCUTS.md**](SHORTCUTS.md) | Global keyboard shortcut management | System |
| [**SHORTCUTS_COMPONENT.md**](SHORTCUTS_COMPONENT.md) | Shortcut registry and definitions | Registry |
| [**SEARCH_PALETTE.md**](SEARCH_PALETTE.md) | Global quick search (Quick Open) | Component |
| [**TAB_BAR_COMPONENT.md**](TAB_BAR_COMPONENT.md) | Tab bar organism (drag, context menu) | Organism |
| [**TAB_PREVIEW.md**](TAB_PREVIEW.md) | Hover preview with Render Window | Component |
| [**TOC_COMPONENT.md**](TOC_COMPONENT.md) | Floating table of contents and scroll sync | Component |

**Key Concepts:**
- Shortcuts are global system-wide
- Search Palette provides quick navigation
- Tab Preview shows file preview on hover
- TOC auto-syncs with scroll position

---

## 📖 Wiki Reader

**Vault indexer, smart link navigation, and backlinks**

| Module | Purpose | Type |
|--------|---------|------|
| [**WIKI_READER.md**](WIKI_READER.md) | Architecture overview, data flow, index format, all APIs | Feature Overview |
| [**WIKI_SERVICE.md**](services/WIKI_SERVICE.md) | WikiIndexer (server), REST API, WikiService (renderer) | Service |

**Key Concepts:**
- Opt-in per workspace via Wiki Scanner state machine (`off → scanning → active`)
- Index build: 3-pass (frontmatter → body mentions → backlinks)
- Link interception: click `.md` link → WikiDrawer mở file bên phải, không navigate away
- Resizable drawer, anchor navigation, internal link chaining

---

## 🔄 Data Flow

```
User Action (Click, Shortcut, Drag)
    ↓
Component Handler
    ↓
Service Operation (Settings, Search, Publish, etc.)
    ↓
AppState Update
    ↓
MarkdownViewer.setState()
    ↓
Re-render Views (Editor, Preview, Tree, etc.)
```

---

## 🛡️ Critical Patterns

### Dirty Check Pattern

Before any operation that could lose data:

```javascript
if (EditorModule.isDirty()) {
  // Show save/discard/cancel dialog
  // Only proceed if user confirms
}
```

**Applied in:** `loadFile()`, `switchWorkspace()`, `removeTab()`, `onModeChange()`

### Service Pattern

Each domain gets a centralized service:

```javascript
// ✅ Centralized
SettingsService.get(key)
SettingsService.set(key, value)

SearchService.search(query)
ShortcutService.execute(shortcutId)
```

### AppState Pattern

Single source of truth for app state:

```javascript
AppState.currentFile      // Current file path
AppState.currentMode      // read/edit/comment/collect
AppState.isDirty          // Unsaved changes
AppState.theme            // light/dark
```

---

## 📊 Module Statistics

| Category | Count | Purpose |
|----------|-------|---------|
| Core | 2 | App initialization and state |
| Editor & Rendering | 2 | Content editing and display |
| Components | 10 | UI elements |
| Publishing | 3 | Worker and publish ops |
| Services | 6 | Business logic and data |
| File Management | 5 | Files, tabs, workspace |
| Utilities | 3 | Helper modules |
| Advanced Features | 6 | Specialized interactions |
| **Total** | **37+** | **All features documented** |

---

## 🎯 Where to Look

### "How do I understand...?"

**The editor system?**
→ EDITOR.md + MARKDOWN_VIEWER.md

**How publishing works?**
→ PUBLISH_SERVICE.md + PUBLISH_WORKER.md

**The file tree and workspace?**
→ WORKSPACE.md + TREE.md + TABS.md

**The design system and UI?**
→ DESIGN_SYSTEM.md + DESIGN_SYSTEM_ICONS.md + (Component docs)

**Keyboard shortcuts?**
→ SHORTCUTS.md + SHORTCUT_SERVICE.md + SHORTCUTS_COMPONENT.md

**Search and quick navigation?**
→ SEARCH_SERVICE.md + SEARCH_PALETTE.md

**Settings and preferences?**
→ SETTINGS_SERVICE.md + SETTINGS_COMPONENT.md + EXPLORER_SETTINGS.md

**File history and previews?**
→ RECENTLY_VIEWED.md + TAB_PREVIEW.md + PROJECT_MAP.md

---

## 🔍 Search by Concept

| Concept | Files |
|---------|-------|
| **State Management** | CORE_APP.md, SETTINGS_SERVICE.md |
| **UI Components** | DESIGN_SYSTEM.md, All component docs |
| **Data Services** | *_SERVICE.md files |
| **File Operations** | WORKSPACE.md, TREE.md, TABS.md |
| **Publishing** | PUBLISH_*.md |
| **Rendering** | EDITOR.md, MARKDOWN_VIEWER.md |
| **User Input** | SHORTCUTS.md, SEARCH_PALETTE.md, EDIT_TOOLBAR.md |
| **Preferences** | SETTINGS_COMPONENT.md, EXPLORER_SETTINGS.md |

---

## 📖 Related Documentation

- **[README.md](../../README.md)** — Project overview
- **[Architecture](../guides/development/architecture.md)** — Markdown rendering system
- **[Security Policy](../security/policy.md)** — Security and XSS protection
- **[Setup Guide](../guides/getting-started/setup.md)** — Development setup
- **[Design Tokens](../guides/development/design-tokens.md)** — CSS system and layout tokens

---

## 🚀 Contributing

When adding new features:

1. **Document the module** with:
   - Purpose (1 sentence)
   - Type (Component, Service, Utility, etc.)
   - Key exports/APIs
   - Integration points
   - Examples

2. **Update this README** with the new module

3. **Follow naming conventions**:
   - Components: PascalCase (e.g., `EDITOR.md`)
   - Services: camelCase with `_SERVICE` (e.g., `SETTINGS_SERVICE.md`)
   - Utilities: camelCase (e.g., `GDOC_UTIL.md`)

4. **Include diagrams** if complex interactions

---

**Last Updated:** May 6, 2026 (Smart Typing Stabilization)  
**Status:** Organized and complete  
**Next:** Triển khai thêm các kịch bản kiểm thử Edge Case cho bảng biểu (Table) lồng trong danh sách.

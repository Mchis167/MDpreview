# Feature Documentation

**Last Updated:** May 14, 2026 (Monaco Migration & Audit)  
**Total Features:** 45+ modules documented  
**Status:** Organized by category

> **Recent Update (May 14):** Đã hoàn tất audit toàn diện hệ thống documentation sau đợt di cư sang **Monaco Editor**. Cập nhật cơ chế **Absolute Sync Engine** và hệ thống **Design Tokens** lập trình.

---

## 📚 Quick Navigation
| Category | Purpose | Files |
|----------|---------|-------|
| [**Core**](#core--application-foundation) | App state, boot, lifecycle | 2 files |
| [**Editor & Rendering**](#editor--rendering) | Monaco Editor, actions, and display | 4 files |
| [**Components**](#components--ui-elements) | UI components and design system | 10 files |
| [**Publishing**](#publishing--cloudflare-workers) | Publishing to Workers | 3 files |
| [**Services**](#services--data-business-logic) | Data, search, settings, and tokens | 12 files |
| [**File Management**](#file-management--workspace) | Files, tabs, workspace | 5 files |
| [**Utilities**](#utilities--helpers) | Helper modules and bridges | 3 files |
| [**Advanced Features**](#advanced-features) | Shortcuts, TOC, preview | 6 files |
| [**Wiki Reader**](#wiki-reader) | Vault indexer, link navigation, backlinks | 1 overview |

---

## 🔧 Core — Application Foundation

**Core modules for app initialization and state management**

| Module | Purpose | Type |
|--------|---------|------|
| [**CORE_APP.md**](core/CORE_APP.md) | Global AppState, boot sequence, theme, socket.io | Singleton Service |
| [**ELECTRON_BRIDGE.md**](core/ELECTRON_BRIDGE.md) | Unified Electron ↔ Browser API bridge (File System, Clipboard, Rasterization) | API Layer |

**Key Concepts:**
- AppState is the single source of truth
- Boot sequence initializes all modules
- Electron bridge handles platform-specific operations

---

## ✏️ Editor & Rendering

**Markdown editing and display in all modes**

| Module | Purpose | Type |
|--------|---------|------|
| [**EDITOR.md**](editor/EDITOR.md) | Monaco Editor integration, dirty tracking, autosave, safety guards | Component |
| [**MONACO_SERVICE.md**](services/MONACO_SERVICE.md) | Monaco Editor lifecycle and instance management | Service |
| [**MONACO_ACTION_SERVICE.md**](services/MONACO_ACTION_SERVICE.md) | Markdown formatting actions for Monaco | Service |
| [**MARKDOWN_VIEWER.md**](editor/MARKDOWN_VIEWER.md) | Mode switching (read/edit/comment/collect), sub-component lifecycle | Organism |

**Key Concepts:**
- Editor handles text manipulation using Monaco Editor API
- Formatting actions are decoupled into MonacoActionService
- MarkdownViewer manages mode switching and rendering

---

## 🎨 Components — UI Elements

**Reusable UI components and design system**

| Module | Purpose | Type |
|--------|---------|------|
| [**DESIGN_SYSTEM.md**](components/DESIGN_SYSTEM.md) | Centralized UI factory (Buttons, Segmented, Radius, Colors) | Factory |
| [**DESIGN_SYSTEM_ICONS.md**](components/DESIGN_SYSTEM_ICONS.md) | Registry of all SVG icons (Modular Icons) | Registry |
| [**BASE_FORM_MODAL.md**](components/BASE_FORM_MODAL.md) | Standard modal form template (Header, Body, Footer) | Template |
| [**MENU_SHIELD.md**](components/MENU_SHIELD.md) | Floating menu shell (positioning, glassmorphism, singleton) | Organism |
| [**SETTINGS_COMPONENT.md**](components/SETTINGS_COMPONENT.md) | Global settings interface (Floating Popover) | Organism |
| [**EXPLORER_SETTINGS.md**](components/EXPLORER_SETTINGS.md) | Explorer preferences menu (show hidden, flat view) | Component |
| [**SIDEBAR_LEFT.md**](components/SIDEBAR_LEFT.md) | Left sidebar frame (Explorer, Search, Footer) | Organism |
| [**SCROLL_CONTAINER.md**](components/SCROLL_CONTAINER.md) | Smart scroll area with mask-fade and safe zone | Component |
| [**PROJECT_MAP.md**](components/PROJECT_MAP.md) | Mini-map displaying document outline (SVG Cloning) | Component |
| [**EDIT_TOOLBAR.md**](components/EDIT_TOOLBAR.md) | Editor toolbar (Heading levels, formatting) | Component |
| [**QUICK_COMMAND_PALETTE.md**](components/QUICK_COMMAND_PALETTE.md) | Context-aware command palette with scoring and slash mode | Component |

**Key Concepts:**
- Design System is the single source of UI patterns
- All components extend base templates
- Glassmorphism and backdrop-blur for premium feel

---

## 📤 Publishing — Cloudflare Workers

**Publishing markdown to distributed edge network**

| Module | Purpose | Type |
|--------|---------|------|
| [**PUBLISH_SERVICE.md**](services/PUBLISH_SERVICE.md) | Centralized publish service (lifecycle, rename, delete) | Service |
| [**PUBLISH_COMPONENTS.md**](publishing/PUBLISH_COMPONENTS.md) | Publish UI (config, management, settings) | Components |
| [**PUBLISH_WORKER.md**](publishing/PUBLISH_WORKER.md) | Cloudflare Worker architecture, asset serving | Edge Worker |

---

## 📦 Services — Data & Business Logic

**Centralized services for data management and operations**

| Module | Purpose | Type |
|--------|---------|------|
| [**SETTINGS_SERVICE.md**](services/SETTINGS_SERVICE.md) | Centralized settings management | Service |
| [**SEARCH_SERVICE.md**](services/SEARCH_SERVICE.md) | Fuzzy search and scoring engine | Service |
| [**SHORTCUT_SERVICE.md**](services/SHORTCUT_SERVICE.md) | Keyboard shortcut registry and execution | Service |
| [**SYNC_SERVICE.md**](services/SYNC_SERVICE.md) | **Absolute Sync Engine** (Character-offset sync) | Service |
| [**DESIGN_TOKEN_PROVIDER.md**](services/DESIGN_TOKEN_PROVIDER.md) | Programmatic access to Design Tokens | Service |
| [**ATTACHMENT_SERVICE.md**](services/ATTACHMENT_SERVICE.md) | Asset management, deduplication, and compression | Service |
| [**WIKI_SERVICE.md**](services/WIKI_SERVICE.md) | Wiki Indexer, Graph, and Backlinks | Service |
| [**FILE_SERVICE.md**](services/FILE_SERVICE.md) | Low-level file I/O and safety | Service |
| [**MARKDOWN_LOGIC_SERVICE.md**](services/MARKDOWN_LOGIC_SERVICE.md) | Text transformation library (Smart Enter/Indent) | Service |
| [**GDOC_UTIL.md**](services/GDOC_UTIL.md) | HTML to Google Docs conversion | Utility |

---

## 🗂️ File Management — Workspace

**File tree, tabs, workspace operations**

| Module | Purpose | Type |
|--------|---------|------|
| [**WORKSPACE.md**](file-management/WORKSPACE.md) | Workspace CRUD, switching, Electron integration | Module |
| [**TREE.md**](file-management/TREE.md) | File tree render, sort, search, drag-drop | Component |
| [**TABS.md**](file-management/TABS.md) | Tab management, multi-select, batch close | Module |
| [**TREE_DRAG_MANAGER.md**](file-management/TREE_DRAG_MANAGER.md) | Drag-drop engine for Sidebar (Alphabet & VIP) | Engine |
| [**WORKSPACE_SWITCHER.md**](file-management/WORKSPACE_SWITCHER.md) | Workspace name display in Sidebar header | Molecule |

---

## ⚡ Advanced Features

**Specialized features and advanced interactions**

| Module | Purpose | Type |
|--------|---------|------|
| [**SHORTCUTS.md**](advanced/SHORTCUTS.md) | Global keyboard shortcut management | System |
| [**SHORTCUTS_COMPONENT.md**](advanced/SHORTCUTS_COMPONENT.md) | Shortcut registry and definitions | Registry |
| [**SEARCH_PALETTE.md**](advanced/SEARCH_PALETTE.md) | Global quick search (Quick Open) | Component |
| [**TAB_BAR_COMPONENT.md**](advanced/TAB_BAR_COMPONENT.md) | Tab bar organism (drag, context menu) | Organism |
| [**TAB_PREVIEW.md**](advanced/TAB_PREVIEW.md) | Hover preview with Render Window | Component |
| [**TOC_COMPONENT.md**](advanced/TOC_COMPONENT.md) | Floating table of contents and scroll sync | Component |

---

## 📖 Wiki Reader

**Vault indexer, smart link navigation, and backlinks**

| Module | Purpose | Type |
|--------|---------|------|
| [**WIKI_READER.md**](WIKI_READER.md) | Architecture overview, data flow, index format, all APIs | Feature Overview |
| [**WIKI_SERVICE.md**](services/WIKI_SERVICE.md) | WikiIndexer (server), REST API, WikiService (renderer) | Service |

---

## 🛡️ Critical Patterns

### Absolute Sync Engine
Uses `data-src-start` attributes and character offsets for 1:1 scroll synchronization between Read and Edit views.

### Atomic Design System
UI is built using Atoms, Molecules, and Organisms. Programmatic tokens are provided via `DesignTokenProvider`.

---

**Last Updated:** May 14, 2026 (Documentation Audit)  
**Status:** Organized and complete  

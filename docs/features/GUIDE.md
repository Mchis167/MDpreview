# Feature Documentation Guide

**How to find and understand features in MDpreview**

**Last Updated:** May 2, 2026

---

## 🎯 Quick Links by Role

### 👨‍💻 Developer (Understanding the Codebase)

1. **Start here:** [README.md](README.md) — Overview of all 37+ features
2. **Find the module:** Use the category table to locate your feature
3. **Understand it:** Read the module's documentation file
4. **Related modules:** Check the integration points

**Example: Understanding the Editor**
```
1. Read: README.md (under "Editor & Rendering")
2. Read: EDITOR.md (how editor works)
3. Read: MARKDOWN_VIEWER.md (display modes)
4. Understand: Data flow from EDITOR → AppState → MARKDOWN_VIEWER
```

### 🎨 UI/Component Developer

1. **Start:** [README.md](README.md) → Components section
2. **Design System:** Read [DESIGN_SYSTEM.md](components/DESIGN_SYSTEM.md)
3. **Icons:** Check [DESIGN_SYSTEM_ICONS.md](components/DESIGN_SYSTEM_ICONS.md)
4. **Layout & Padding:** Read [Design Tokens Guide](../guides/development/design-tokens.md)
5. **Project Map (Minimap):** See [PROJECT_MAP.md](components/PROJECT_MAP.md)
6. **Specific Component:** Find the module in Components list

### 🚀 Feature Implementer

1. **Understand related domains:** Find all related modules using the cross-reference table in [README.md](README.md)
2. **Read data flow:** See how data flows in and out
3. **Check patterns:** Look for similar implementations
4. **Understand AppState:** How does it affect app state?

### 🧪 QA/Tester

1. **Feature List:** All features documented in [README.md](README.md)
2. **Feature Name:** Search for it in [README.md](README.md)
3. **How it Works:** Read the module documentation
4. **Integration:** Understand what it depends on

---

## 🔍 Finding What You Need

### "I want to understand how [Feature] works"

**Step 1:** Find the feature in [README.md](README.md)

**Step 2:** Read the module documentation (e.g., `EDITOR.md`)

**Step 3:** Check the "Type" column (Component, Service, Module, etc.)

**Step 4:** Look at the integration points section

### "I need to modify [Feature]"

**Step 1:** Understand the current implementation (read its module doc)

**Step 2:** Find related modules (data flow, dependencies)

**Step 3:** Check if it's a Pattern (Dirty Check, Service, AppState)

**Step 4:** Make changes following existing patterns

### "I'm adding a new feature"

**Step 1:** Determine what type it is (Component, Service, Utility)

**Step 2:** Find similar existing features

**Step 3:** Follow the same pattern

**Step 4:** Document it following the template

### "What features do we have?"

→ Look at [README.md](README.md) categories

---

## 📋 Documentation Structure

```
features/
├── README.md                    ← START HERE (37+ modules)
├── GUIDE.md                     ← This file
├── components/
│   ├── DESIGN_SYSTEM.md         ← UI factory
│   ├── DESIGN_SYSTEM_ICONS.md   ← Icon registry
│   ├── PROJECT_MAP.md           ← Minimap component (NEW)
│   └── [9 other components]
├── [other categories...]
    ├── CORE_APP.md              ← App state and lifecycle
    ├── EDITOR.md                ← Editor module
    ├── MARKDOWN_VIEWER.md       ← Display and modes
    ├── BASE_FORM_MODAL.md       ← Modal template
├── PUBLISH_SERVICE.md           ← Publishing logic
├── PUBLISH_COMPONENTS.md        ← Publish UI
├── PUBLISH_WORKER.md            ← Cloudflare Worker
├── WORKSPACE.md                 ← Workspace management
├── TREE.md                      ← File tree
├── TABS.md                      ← Tab management
├── SHORTCUTS.md                 ← Keyboard shortcuts
├── SETTINGS_SERVICE.md          ← Settings management
├── SEARCH_SERVICE.md            ← Search engine
├── SEARCH_PALETTE.md            ← Quick search UI
├── ... (20+ more files)
└── (Each file has same structure)
```

---

## 📖 Each Module Document Contains

### 1. Module Info
- **Name:** EDITOR.md
- **Type:** Component / Service / Utility / Module
- **Purpose:** One-line description

### 2. Core Responsibilities
- What does this module do?
- What problems does it solve?

### 3. Key Exports/APIs
- Main functions/methods
- Expected parameters
- Return values

### 4. State Management
- Does it use AppState?
- Does it manage local state?
- How does it store data?

### 5. Integration Points
- What other modules does it depend on?
- What modules depend on it?
- How is it initialized?

### 6. Patterns Used
- Dirty check?
- Service pattern?
- Factory pattern?

### 7. Examples
- Usage examples
- Common operations
- Integration examples

### 8. Architecture Diagram
- Data flow diagram if complex
- State flow diagram
- Component hierarchy

---

## 🧭 Navigation by Category

### Core — Foundation (2 files)
[CORE_APP.md](function-docs/CORE_APP.md) | [ELECTRON_BRIDGE.md](function-docs/ELECTRON_BRIDGE.md)

Start here to understand app initialization and global state.

### Editor & Rendering (2 files)
[EDITOR.md](function-docs/EDITOR.md) | [MARKDOWN_VIEWER.md](function-docs/MARKDOWN_VIEWER.md)

Understand how markdown is edited and displayed.

### Components (10 files)
[DESIGN_SYSTEM.md](function-docs/DESIGN_SYSTEM.md) | [BASE_FORM_MODAL.md](function-docs/BASE_FORM_MODAL.md) | [MENU_SHIELD.md](function-docs/MENU_SHIELD.md) | [SETTINGS_COMPONENT.md](function-docs/SETTINGS_COMPONENT.md) | [EXPLORER_SETTINGS.md](function-docs/EXPLORER_SETTINGS.md) | [SIDEBAR_LEFT.md](function-docs/SIDEBAR_LEFT.md) | [SCROLL_CONTAINER.md](function-docs/SCROLL_CONTAINER.md) | [PROJECT_MAP.md](function-docs/PROJECT_MAP.md) | [EDIT_TOOLBAR.md](function-docs/EDIT_TOOLBAR.md) | [DESIGN_SYSTEM_ICONS.md](function-docs/DESIGN_SYSTEM_ICONS.md)

All UI components and design system.

### Publishing (3 files)
[PUBLISH_SERVICE.md](function-docs/PUBLISH_SERVICE.md) | [PUBLISH_COMPONENTS.md](function-docs/PUBLISH_COMPONENTS.md) | [PUBLISH_WORKER.md](function-docs/PUBLISH_WORKER.md)

Understand publishing to Cloudflare Workers.

### Services (6 files)
[SETTINGS_SERVICE.md](function-docs/SETTINGS_SERVICE.md) | [SEARCH_SERVICE.md](function-docs/SEARCH_SERVICE.md) | [SHORTCUT_SERVICE.md](function-docs/SHORTCUT_SERVICE.md) | [SYNC_SERVICE.md](function-docs/SYNC_SERVICE.md) | [GDOC_UTIL.md](function-docs/GDOC_UTIL.md) | [PUBLISH_SERVICE.md](function-docs/PUBLISH_SERVICE.md)

Business logic and data services.

### File Management (5 files)
[WORKSPACE.md](function-docs/WORKSPACE.md) | [TREE.md](function-docs/TREE.md) | [TABS.md](function-docs/TABS.md) | [TREE_DRAG_MANAGER.md](function-docs/TREE_DRAG_MANAGER.md) | [WORKSPACE_SWITCHER.md](function-docs/WORKSPACE_SWITCHER.md)

File tree, tabs, workspace operations.

### Utilities (3 files)
[ELECTRON_BRIDGE.md](function-docs/ELECTRON_BRIDGE.md) | [GDOC_UTIL.md](function-docs/GDOC_UTIL.md) | [RECENTLY_VIEWED.md](function-docs/RECENTLY_VIEWED.md)

Helper modules and utilities.

### Advanced Features (6 files)
[SHORTCUTS.md](function-docs/SHORTCUTS.md) | [SHORTCUTS_COMPONENT.md](function-docs/SHORTCUTS_COMPONENT.md) | [SEARCH_PALETTE.md](function-docs/SEARCH_PALETTE.md) | [TAB_BAR_COMPONENT.md](function-docs/TAB_BAR_COMPONENT.md) | [TAB_PREVIEW.md](function-docs/TAB_PREVIEW.md) | [TOC_COMPONENT.md](function-docs/TOC_COMPONENT.md)

Specialized interactions and advanced features.

---

## 🔗 Common Questions → Documentation Map

| Question | Read This |
|----------|-----------|
| **How does the app start?** | [CORE_APP.md](function-docs/CORE_APP.md) |
| **How does editing work?** | [EDITOR.md](function-docs/EDITOR.md) → [MARKDOWN_VIEWER.md](function-docs/MARKDOWN_VIEWER.md) |
| **How do I add a UI component?** | [DESIGN_SYSTEM.md](function-docs/DESIGN_SYSTEM.md) |
| **How does publishing work?** | [PUBLISH_SERVICE.md](function-docs/PUBLISH_SERVICE.md) → [PUBLISH_WORKER.md](function-docs/PUBLISH_WORKER.md) |
| **How does file management work?** | [WORKSPACE.md](function-docs/WORKSPACE.md) → [TREE.md](function-docs/TREE.md) → [TABS.md](function-docs/TABS.md) |
| **How do keyboard shortcuts work?** | [SHORTCUTS.md](function-docs/SHORTCUTS.md) → [SHORTCUT_SERVICE.md](function-docs/SHORTCUT_SERVICE.md) |
| **How does search work?** | [SEARCH_SERVICE.md](function-docs/SEARCH_SERVICE.md) → [SEARCH_PALETTE.md](function-docs/SEARCH_PALETTE.md) |
| **How does the Electron bridge work?** | [ELECTRON_BRIDGE.md](function-docs/ELECTRON_BRIDGE.md) |
| **How are settings managed?** | [SETTINGS_SERVICE.md](function-docs/SETTINGS_SERVICE.md) → [SETTINGS_COMPONENT.md](function-docs/SETTINGS_COMPONENT.md) |
| **How does Google Docs export work?** | [GDOC_UTIL.md](function-docs/GDOC_UTIL.md) |
| **What's the table of contents feature?** | [TOC_COMPONENT.md](function-docs/TOC_COMPONENT.md) |
| **How does the sidebar work?** | [SIDEBAR_LEFT.md](function-docs/SIDEBAR_LEFT.md) |

---

## 🎓 Learning Path for New Developers

### Level 1: Core Understanding (1-2 hours)
1. Read: [function-docs/README.md](function-docs/README.md) — Get overview
2. Read: [CORE_APP.md](function-docs/CORE_APP.md) — Understand app state
3. Read: [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) — Understand rendering

### Level 2: UI Understanding (2-3 hours)
4. Read: [DESIGN_SYSTEM.md](function-docs/DESIGN_SYSTEM.md) — Learn UI patterns
5. Read: [EDITOR.md](function-docs/EDITOR.md) + [MARKDOWN_VIEWER.md](function-docs/MARKDOWN_VIEWER.md)
6. Explore one Component: [SETTINGS_COMPONENT.md](function-docs/SETTINGS_COMPONENT.md) or [SEARCH_PALETTE.md](function-docs/SEARCH_PALETTE.md)

### Level 3: File Management (2-3 hours)
7. Read: [WORKSPACE.md](function-docs/WORKSPACE.md) → [TREE.md](function-docs/TREE.md) → [TABS.md](function-docs/TABS.md)
8. Understand data flow

### Level 4: Services (2-3 hours)
9. Pick a service: [SETTINGS_SERVICE.md](function-docs/SETTINGS_SERVICE.md) or [SEARCH_SERVICE.md](function-docs/SEARCH_SERVICE.md)
10. Understand how services integrate with UI

### Level 5: Publishing (1-2 hours)
11. Read: [PUBLISH_SERVICE.md](function-docs/PUBLISH_SERVICE.md) → [PUBLISH_WORKER.md](function-docs/PUBLISH_WORKER.md)
12. Understand Worker architecture

**Total time:** ~10-14 hours to understand the full system

---

## 📝 Documentation Template

When adding new feature docs, use this structure:

```markdown
# [FEATURE_NAME].md

## Purpose
One-line description of what this does.

## Type
Component / Service / Utility / Module

## Key Responsibilities
- What does it do?
- What problems does it solve?

## Core APIs

### Main Export
```typescript
export function/class MyFeature() { }
```

## State Management
- AppState usage
- Local state
- Data persistence

## Integration Points
- Dependencies
- Dependents
- Lifecycle hooks

## Patterns Used
- Service Pattern
- Dirty Check
- etc.

## Examples

### Basic Usage
\`\`\`javascript
// Example code
\`\`\`

### Common Operations
\`\`\`javascript
// More examples
\`\`\`

## Architecture Diagram
\`\`\`
[Diagram]
\`\`\`

## Related Features
- [FEATURE_A.md](FEATURE_A.md)
- [FEATURE_B.md](FEATURE_B.md)
```

---

## ✅ Feature Documentation Checklist

When reviewing or adding documentation:

- [ ] Purpose is clear (one sentence)
- [ ] Type is specified (Component, Service, etc.)
- [ ] Key APIs are documented
- [ ] State management is explained
- [ ] Integration points are listed
- [ ] Related features are linked
- [ ] Examples are provided
- [ ] Architecture is diagrammed (if complex)
- [ ] Module is in the correct category in README
- [ ] README.md is updated

---

## 🚀 Next Steps

1. **Browse:** Start with [function-docs/README.md](function-docs/README.md)
2. **Search:** Use Ctrl+F to find what you need
3. **Read:** Click on the feature documentation
4. **Understand:** Study the architecture diagram
5. **Connect:** Follow related features
6. **Contribute:** Add or update docs as you learn

---

**Last Updated:** May 1, 2026  
**Total Features Documented:** 37+  
**Categories:** 8  
**Status:** Complete and organized

Start with [function-docs/README.md](function-docs/README.md)!

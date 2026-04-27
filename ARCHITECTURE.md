# MDpreview Architecture Guide

**Last Updated:** April 25, 2026  
**Version:** 1.0.0

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Token System (Design Tokens)](#token-system-design-tokens)
3. [CSS Architecture](#css-architecture)
4. [JavaScript Module System](#javascript-module-system)
5. [Component Hierarchy](#component-hierarchy)
6. [Development Workflow](#development-workflow)
7. [Maintenance & Scaling](#maintenance--scaling)

---

## System Overview

MDpreview is a **vanilla JS Electron app** with a **no-build pipeline** architecture. It uses:
- **CSS:** 3-tier design token system + atomic/semantic naming
- **JS:** 41 modules organized as IIFEs with `window.*` global bus
- **HTML:** Single-entry script pipeline with `defer` attribute for non-blocking load

### Key Characteristics
- ✓ Zero bundler = instant dev server
- ✓ Explicit global exports = no hidden dependencies
- ✓ Token-driven theming = easy dark/light mode
- ✓ Linting gates (`npm run lint`) = 0 errors enforced
- ⚠ Scales to ~50–60 modules before needing Vite

---

## Token System (Design Tokens)

**File:** `renderer/css/design-system/tokens.css`

### 3-Tier Architecture

#### Tier 1: Primitives (Raw Values)
Define atomic building blocks—no abstractions.

```css
/* Colors */
--ds-primitive-orange: #ffbf48;
--ds-primitive-base: #151515;

/* RGB for alpha blending */
--ds-primitive-orange-rgb: 255, 191, 72;

/* Spacing */
--ds-space-xs: 4px;
--ds-space-sm: 8px;
--ds-space-md: 12px;
--ds-space-lg: 16px;
--ds-space-xl: 24px;

/* Radius */
--ds-radius-xs: 4px;
--ds-radius-sm: 6px;
--ds-radius-md: 8px;
--ds-radius-lg: 12px;
--ds-radius-xl: 16px;
--ds-radius-xxl: 24px;
--ds-radius-full: 999px;
```

**Rule:** Add here only when you need a new raw value. Never use Tier 1 directly in components—always use Tier 2 or 3.

#### Tier 2: Alpha Palette (Pre-computed Opacity Variants)
Every common opacity level gets its own token. Prevents `rgba(255,255,255,0.3)` hardcodes from spreading.

```css
/* White with opacity */
--ds-white-a02: rgba(255, 255, 255, 0.02);
--ds-white-a05: rgba(255, 255, 255, 0.05);
--ds-white-a10: rgba(255, 255, 255, 0.10);
--ds-white-a20: rgba(255, 255, 255, 0.20);
--ds-white-a30: rgba(255, 255, 255, 0.30);
--ds-white-a40: rgba(255, 255, 255, 0.40);
--ds-white-a90: rgba(255, 255, 255, 0.90);

/* Black with opacity */
--ds-black-a20: rgba(0, 0, 0, 0.20);
--ds-black-a40: rgba(0, 0, 0, 0.40);
--ds-black-a60: rgba(0, 0, 0, 0.60);
--ds-black-a80: rgba(0, 0, 0, 0.80);

/* Color-specific alpha tokens for status states */
--ds-green-a15: rgba(76, 175, 80, 0.15);
--ds-green-a20: rgba(76, 175, 80, 0.20);
--ds-red-a10: rgba(244, 67, 54, 0.10);
--ds-orange-a08: rgba(255, 191, 72, 0.08);
```

**Rule:** When you need a semi-transparent color, add it here first. Check if `--ds-[color]-a[opacity]` already exists before using `rgba()`.

#### Tier 3: Semantic (Named by Purpose)
These tokens describe **intent**, not implementation. Change one token, update entire theme.

```css
/* Backgrounds */
--ds-bg-base: #151515;
--ds-bg-surface: #1a1a1a;
--ds-bg-overlay: rgba(21, 21, 21, 0.95);
--ds-bg-backdrop: var(--ds-black-a60);
--ds-bg-toolbar: rgba(21, 21, 21, 0.8);

/* Text Colors */
--ds-text-primary: #ffffff;
--ds-text-secondary: #b8b8b8;
--ds-text-tertiary: #808080;
--ds-text-disabled: #4d4d4d;
--ds-text-inverse: #000000;
--ds-text-on-accent: #000000;

/* Interactive */
--ds-accent: var(--ds-primitive-orange);
--ds-accent-hover: #ffaa00;
--ds-accent-green: #4cb150;
--ds-accent-red: #f44336;
--ds-accent-blue: #2196f3;

/* Hover States */
--ds-hover-sm: var(--ds-white-a05);
--ds-hover-md: var(--ds-white-a10);
--ds-hover-lg: var(--ds-white-a20);

/* Status */
--ds-status-success: #4cb150;
--ds-status-success-bg: rgba(76, 175, 80, 0.15);
--ds-status-danger: #f44336;
--ds-status-danger-bg: rgba(244, 67, 54, 0.15);

/* Semantic Radius (Concentric Design) */
--ds-radius-shell: var(--ds-radius-xxl);    /* 24px — containers */
--ds-radius-panel: var(--ds-radius-lg);     /* 12px — inner panels */
--ds-radius-widget: var(--ds-radius-md);    /* 8px  — buttons, inputs */
--ds-radius-chip: var(--ds-radius-xs);      /* 4px  — small tags */
--ds-radius-pill: var(--ds-radius-full);    /* 999px — pills, badges */

/* Inset Formula: auto-adjust inner radius based on padding */
--ds-radius-shell-inset: max(0, calc(var(--ds-radius-shell) - var(--ds-space-xl)));
--ds-radius-panel-inset: max(0, calc(var(--ds-radius-panel) - var(--ds-space-sm)));

/* Shadows */
--ds-shadow-sm: 0 2px 8px var(--ds-black-a20);
--ds-shadow-md: 0 4px 16px var(--ds-black-a30);
--ds-shadow-lift: 0 8px 32px var(--ds-black-a40);

/* Transitions */
--ds-transition-fast: 0.15s cubic-bezier(0.16, 1, 0.3, 1);
--ds-transition-main: 0.25s cubic-bezier(0.16, 1, 0.3, 1);
--ds-ease-spring: cubic-bezier(0.16, 1, 0.3, 1);
```

**Rule:** Components use ONLY Tier 3 tokens. If a color isn't defined in Tier 3, add it—don't reach back to Tier 1 or 2.

### Adding a New Token

1. **Decide: Is this Tier 1, 2, or 3?**
   - Tier 1: Only a primitive value used many places (new color, new spacing, new radius)
   - Tier 2: An opacity variant missing from alpha palette
   - Tier 3: A semantic purpose (new status state, new hover variant)

2. **Add to `tokens.css`** in the appropriate section

3. **Run linter**: `npm run lint` — ESLint will catch undefined token usage

4. **Update components** to use the new token instead of hardcoded values

**Example: Adding dark mode support**
```css
/* In Tier 3: Define light/dark variants */
@media (prefers-color-scheme: dark) {
  --ds-bg-base: #151515;
  --ds-text-primary: #ffffff;
}

@media (prefers-color-scheme: light) {
  --ds-bg-base: #ffffff;
  --ds-text-primary: #151515;
}
```

---

## CSS Architecture

**Base Files:**
- `renderer/css/design-system/tokens.css` — All token definitions
- `renderer/css/design-system/atoms/*.css` — Buttons, inputs, switches
- `renderer/css/design-system/molecules/*.css` — Popovers, menus, toggles
- `renderer/css/design-system/organisms/*.css` — Sidebars, toolbars, viewers
- `renderer/css/styles.css` — Master import file

### CSS Local Variables (`--_` Pattern)

Every component uses CSS custom properties (`--_*`) scoped to itself. This allows variants to override only what changes.

**File:** `renderer/css/design-system/atoms/button.css`

```css
.ds-btn {
  /* Component-level CSS custom properties */
  --_radius:          var(--ds-radius-widget);
  --_pad-x:           var(--ds-space-md);
  --_height:          28px;
  --_bg:              transparent;
  --_color:           var(--ds-text-primary);
  --_bg-hover:        var(--ds-hover-md);

  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: var(--_height);
  padding: 0 var(--_pad-x);
  border-radius: var(--_radius);
  background: var(--_bg);
  color: var(--_color);
  /* ... */
}

/* Variant: only override what changes */
.ds-btn-primary {
  --_bg:       var(--ds-accent);
  --_color:    var(--ds-text-on-accent);
  --_bg-hover: var(--ds-accent-hover);
}

/* Variant: ghost style */
.ds-btn-ghost {
  --_bg-hover: var(--ds-white-a05);
}
```

**Rule:** Use `--_varname` for all component-internal properties. Never write the same property twice—always use a local variable first.

### Inset Radius Formula

For nested containers with padding, the inner border-radius should be inset to maintain visual alignment.

**Formula:** `inner-radius = max(0, outer-radius - padding)`

**Example:** A shell container with 24px radius and 24px padding has flush inner edge:
```css
.shell-container {
  border-radius: var(--ds-radius-shell);  /* 24px */
  padding: var(--ds-space-xl);            /* 24px */
}

.shell-inner {
  border-radius: max(0, calc(var(--ds-radius-shell) - var(--ds-space-xl)));
  /* = max(0, 24px - 24px) = 0px */
}
```

**When to use:** Any time you have a bordered container with padding and need to nest another element. The inset tokens are pre-calculated in `tokens.css`.

### Stylelint Rules

**File:** `.stylelintrc.json`

Run with: `npm run lint:css`

Key enforced rules:
- `color-no-invalid-hex: true` — Catches typos like `#ff99qq`
- `no-duplicate-selectors: true` — Prevents accidental duplication
- `length-zero-no-unit: true` — Enforce `0` not `0px`
- `function-calc-no-unspaced-operator: true` — Enforce spaces in `calc()`

**Rule:** Never override these rules unless you have a very specific reason. They exist to catch bugs early.

---

## JavaScript Module System

**Architecture:** 41 modules organized as Immediately-Invoked Function Expressions (IIFEs) exporting to `window.*`.

### Module Categories

#### 1. Core (`renderer/js/core/`)
- `app.js` — Global AppState, boot sequence, socket init
- `electron-bridge.js` — Electron IPC wrapper, file ops

#### 2. Components (`renderer/js/components/`)

**Atoms:** `icon-action-button.js`, `switch-toggle.js`, `textarea.js`
```javascript
const IconActionButton = (() => {
  'use strict';
  
  function create(options) {
    const btn = document.createElement('button');
    btn.className = 'ds-icon-action-btn';
    // ... initialize element
    return btn;
  }
  
  return { create };
})();

window.IconActionButton = IconActionButton;
```

**Molecules:** `context-menu.js`, `search-component.js`, `sidebar-section-header.js`, `setting-toggle-item.js`
- **ContextMenu**: Floating context menu with support for icons, labels, and shortcuts.
- **ScrollContainer**: Reusable scroll view with mask-fading and automatic safe zone for sidebar lists.
- **SettingToggleItem**: Specialized row with label and switch toggle for settings menus.

**Organisms:** `tab-bar.js`, `sidebar-left.js`, `markdown-viewer-component.js`, etc.

#### 3. Services (`renderer/js/services/`)
- `file-service.js` — File I/O wrapper
- `markdown-logic-service.js` — Parsing + rendering logic
- `tree-drag-manager.js` — D&D state machine
- `sidebar-controller.js` — Sidebar DOM controller
- `recently-viewed-service.js` — Recently viewed files list

#### 4. Modules (`renderer/js/modules/`)
Business logic that orchestrates components + services.

- `tabs.js` — Tab bar state + logic
- `tree.js` — File tree state + logic
- `editor.js` — Edit mode + undo/redo
- `comments.js` — Comment mode state
- `collect.js` — Collect mode state
- `workspace.js` — Workspace switching
- `settings.js` — Settings panel state
- `sidebar.js` — Sidebar resize + state
- `draft.js` — Draft file handling
- `toolbar.js` — Keyboard shortcuts

#### 5. Utils (`renderer/js/utils/`)
Standalone utilities with no state.

- `zoom.js` — Diagram zoom modal
- `mermaid.js` — Mermaid init + rendering
- `code-blocks.js` — Syntax highlighting + copy buttons
- `scroll.js` — Scroll event helpers

### IIFE Pattern (Why?)

Each module wraps in IIFE to **prevent global namespace pollution**:

```javascript
// ✗ Bad: pollutes window
function initWidget() { }
// Later: what if another lib has initWidget()?

// ✓ Good: isolated scope
const WidgetModule = (() => {
  'use strict';
  
  function init() { }
  
  return { init };
})();

window.WidgetModule = WidgetModule;
```

### Creating a New Module

1. **Decide: Is this a Component, Service, or Module?**
   - Component: Renders UI elements
   - Service: Handles business logic (no UI rendering)
   - Module: Orchestrates components + services

2. **Create file** in appropriate directory: `renderer/js/[category]/my-widget.js`

3. **Wrap in IIFE**:
   ```javascript
   const MyWidget = (() => {
     'use strict';
     
     // Private state
     let state = {};
     
     // Private functions
     function _handleClick(e) { }
     
     // Public API
     function init(options) { }
     function destroy() { }
     
     return { init, destroy };
   })();
   
   window.MyWidget = MyWidget;
   ```

4. **Add to `renderer/index.html`** in correct position:
   - Components before modules that use them
   - Services before modules that use them
   - Modules near end, before `app.js`

5. **Export to window** at the end of file

6. **Run linter**: `npm run lint:js` — ESLint will flag if undefined

### Cross-Module Communication

**Pattern: Check existence before calling**
```javascript
if (typeof TabsModule !== 'undefined') {
  TabsModule.selectFile(path);
}
```

**Why:** Prevents hard dependencies, allows optional modules.

**Central State: `window.AppState`**
```javascript
window.AppState = {
  currentFile: null,
  currentMode: 'read',
  settings: { /* ... */ },
  
  savePersistentState() { /* ... */ }
};
```

All modules read from + write to `AppState`. It's the single source of truth.

### ESLint Rules

**File:** `eslint.config.mjs`

Run with: `npm run lint:js`

Key enforced rules:
- `no-unused-vars` with `caughtErrorsIgnorePattern: '^_'` — Catch dead code, allow intentional ignores
- `no-undef` — Catch typos in global references
- `eqeqeq` — Always use `===` not `==`
- `no-var` — Use `const`/`let` not `var`
- `no-console` except `warn` and `error` — Prevent debug logs in prod

**Rule:** All 41 modules must pass ESLint. This gate is enforced before any commit.

---

## Component Hierarchy

```
app.js (Core)
├── AppState (global state)
├── TabBar (organism)
│   ├── TabBarComponent (atom)
│   └── ContextMenu (molecule)
├── SidebarLeft (organism)
│   ├── TreeView (organism)
│   │   └── TreeItem (molecule)
│   └── SearchComponent (molecule)
├── MarkdownViewer (organism)
│   ├── MarkdownLogicService
│   └── CodeBlockModule (util)
├── RightSidebar (organism)
│   ├── CommentsPanel
│   └── CollectPanel
└── Modals
    ├── SettingsComponent
    ├── WorkspacePickerComponent
    └── ZoomModal (util)
```

**Rules:**
1. Components only render UI—business logic lives in Services/Modules
2. Atoms don't import organisms; organisms import atoms
3. Services have no DOM dependencies
4. Modules orchestrate everything

---

## Development Workflow

### Before Touching Code

1. **Create feature branch**: `git checkout -b feature/my-feature`
2. **Read relevant files** to understand current state
3. **Identify token/component gaps** — Do I need a new token? A new component?

### Making Changes

#### Adding a Feature
1. If new token needed → Add to `tokens.css` (Tier 1/2/3)
2. If new component needed → Create in `renderer/js/components/[level]/`
3. If new business logic → Create in `renderer/js/modules/` or `renderer/js/services/`
4. Export to `window.*`
5. Add to `renderer/index.html` script pipeline
6. Run: `npm run lint` — Fix any errors

#### Modifying Existing Component
1. Only change `--_` local variables—don't repeat properties
2. If adding a variant → Extend the component's `--_` definitions
3. Never add new hardcoded colors/spacing—use tokens
4. Run: `npm run lint` — Verify no regressions

#### Styling Changes
1. Always use `--ds-*` tokens, never hardcoded values
2. Use inset radius formula for nested containers
3. Use `--_` local variables for component variants
4. Run: `npm run lint:css` — Verify no color/calc errors

### Testing Locally

1. **Run dev server**: `npm run dev` (Electron) or `npm run serve` (Node server)
2. **Test in Electron**: `npm run start`
3. **Run tests**: `npm run test`
4. **Check linting**: `npm run lint`

### Committing

```bash
git add renderer/css renderer/js renderer/index.html
git commit -m "feat: add feature description

- Changed what
- Why it matters

Relates to: #123"
```

**Rule:** Every commit must pass `npm run lint`. Linting is a gate.

---

## Maintenance & Scaling

### Monitoring Token Usage

Find unused tokens:
```bash
grep -rh "var(--ds-" renderer/css renderer/js | \
  grep -o "--ds-[a-z0-9-]*" | sort -u
```

Find tokens defined but never used:
```bash
grep -o "^  --ds-[a-z0-9-]*:" renderer/css/design-system/tokens.css | \
  while read token; do
    grep -q "$token" renderer/css renderer/js || echo "Unused: $token"
  done
```

### When to Refactor

**Red flags:**
- More than 10 similar CSS properties → Extract a Tier 3 token
- Repeated `rgba(255,255,255,...)` → Add to Tier 2 alpha palette
- Module > 500 lines → Split into smaller modules
- 3+ similar components → Create atomic design pattern

### Scaling Beyond 50 Modules

Once you hit ~50–60 modules, the `window.*` global bus becomes unwieldy:
- No tree-shaking → All 41 modules load always
- No lazy loading → Can't defer non-critical features
- Hard to track dependencies → Risk of circular references

**Solution: Migrate to Vite**
1. Keep token system intact ✓
2. Keep component hierarchy intact ✓
3. Add bundling + code splitting
4. Replace `window.*` with ES6 imports
5. Add lazy loading for modal components

This is a 1-day refactor when the time comes.

### Performance Checklist

Every release, verify:
- [ ] `npm run lint` passes (0 errors)
- [ ] No new global leaks (`window.debugVar`, etc.)
- [ ] All new tokens are documented here
- [ ] Script `defer` attributes in place
- [ ] No hardcoded colors/spacing in components
- [ ] All Tier 3 tokens actually used

---

## Quick Reference

### Token Naming Convention
```
--ds-[category]-[value]-[variant]

Examples:
--ds-bg-base            (backgrounds)
--ds-text-primary       (text colors)
--ds-accent-hover       (interactive)
--ds-space-lg           (spacing)
--ds-radius-shell       (semantic radius)
--ds-white-a05          (alpha palette)
--ds-shadow-md          (shadows)
--ds-transition-fast    (animations)
```

### File Organization
```
renderer/
├── css/
│   ├── design-system/
│   │   ├── tokens.css           ← All token definitions
│   │   ├── atoms/               ← Button, Input, Switch
│   │   ├── molecules/           ← Menu, Popover, Header
│   │   └── organisms/           ← Sidebar, Toolbar, Viewer
│   └── styles.css               ← Master import
├── js/
│   ├── core/                    ← app.js, electron-bridge.js
│   ├── components/              ← UI elements (atoms/molecules/organisms)
│   ├── modules/                 ← Business logic orchestrators
│   ├── services/                ← Pure logic (no UI)
│   └── utils/                   ← Standalone helpers
└── index.html                   ← Script pipeline (defer on all)
```

### Linting Command Reference
```bash
npm run lint           # CSS + JS (both fail if error)
npm run lint:css       # CSS only
npm run lint:js        # JS only
```

---

## Questions?

Refer back to this document when:
- Adding a new color or spacing value
- Creating a new component
- Wondering where to place business logic
- Scaling to more modules
- Setting up theming (dark mode, accent color)

**Keep this document updated** as the architecture evolves.

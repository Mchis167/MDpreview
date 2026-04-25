# MDpreview — AI Rules & Architecture Guide

**Single source of truth** for AI agents. Reference: [ARCHITECTURE.md](../../ARCHITECTURE.md), [Workflows README](../workflows/README.md)

---

## 🎯 Agent Workflow (5 Steps)

1. **Research** — Check GitHub project: `gh project item-list 3 --owner Mchis167 --format json`
2. **Plan** — Create implementation_plan artifact using `/plan` workflow → STOP
3. **Wait** — Do NOT proceed without user approval ("proceed", "approve", or feedback)
4. **Execute** — Use `/smart-edit` workflow with surgical edits
5. **Verify & Document** — Test, update `/changelog`, run `npm run lint`

**Anti-patterns:**
- ❌ Auto-proceed after plan (wait for approval)
- ❌ Leave task "In progress" after code changes (move to "In review")
- ❌ Auto-update CHANGELOG (only when explicitly requested)
- ❌ Bypass linting gates
- ❌ Hardcode colors/spacing in CSS
- ❌ Create global variables in JS

---

## 🏗️ Project Architecture

```
Electron App (MDpreview)
├── main.js           ← Electron main process
├── server.js         ← Express server (file API, socket.io)
└── renderer/         ← UI (Vanilla JS + CSS)
    ├── index.html    ← Single entry point (no fragments)
    ├── css/
    │   ├── design-system.css  ← Component imports
    │   └── design-system/
    │       ├── tokens.css     ← 3-tier tokens
    │       ├── atoms/         ← Atomic components
    │       ├── molecules/     ← Molecule components
    │       └── organisms/     ← Organism components
    └── js/
        ├── core/       ← app.js, electron-bridge.js
        ├── components/ ← atoms, molecules, organisms (IIFE modules)
        ├── services/   ← Business logic (IIFE modules)
        ├── modules/    ← Feature controllers (IIFE modules)
        └── utils/      ← Pure functions (IIFE modules)
```

---

## 📐 CSS: 3-Tier Token System

| Tier | Purpose | Format | Example |
|------|---------|--------|---------|
| **1: Primitives** | Raw values | `--ds-primitive-*` | `--ds-primitive-orange: #ffbf48` |
| **2: Alpha Palette** | Opacity variants | `--ds-*-a[10-90]` | `--ds-white-a30: rgba(255,255,255,0.30)` |
| **3: Semantic** | Purpose-named | `--ds-[category]-*` | `--ds-accent: var(--ds-primitive-orange)` |

### CSS Component Pattern

```css
.ds-button {
  --_bg: var(--ds-bg-base);      /* Local variable for variants */
  --_color: var(--ds-text-primary);
  
  display: flex;
  background: var(--_bg);        /* Use tokens only, never hardcode */
  color: var(--_color);
  transition: all var(--ds-transition-smooth);
}

.ds-button.ds-button--primary {
  --_bg: var(--ds-accent);       /* Variant: override only what changes */
  --_color: var(--ds-text-on-accent);
}
```

### CSS Rules (Enforced)
- ✅ Always use tokens: `var(--ds-...)`
- ✅ Use local variables for variants: `--_varname`
- ✅ Semantic naming: `--ds-[category]-[value]-[variant]`
- ✅ Run `npm run lint:css` (0 errors mandatory)
- ❌ No hardcoded colors/spacing
- ❌ No CSS in styles.css (use `@import` only)

---

## 🔌 JavaScript: IIFE Module System

### 5 Module Categories

| Type | Path | Export | Example |
|------|------|--------|---------|
| **Components** | `renderer/js/components/[level]/[name].js` | `window.[Name]Component` | `IconActionButton` |
| **Services** | `renderer/js/services/[name]-service.js` | `window.[Name]Service` | `FileService` |
| **Modules** | `renderer/js/modules/[name].js` | `window.[Name]Module` | `TabsModule` |
| **Utilities** | `renderer/js/utils/[name].js` | `window.[Name]Util` | `ZoomUtil` |
| **Core** | `renderer/js/core/[name].js` | `window.[Name]` | `AppState` |

### IIFE Pattern (Mandatory)

```javascript
const ModuleName = (() => {
  'use strict';
  let _state = {};
  function _helper() { /* ... */ }
  return { init() { /* ... */ } };
})();
window.ModuleName = ModuleName;  // Explicit export
```

### Script Pipeline (Correct Load Order)
```
Core (app.js)
  ↓
Atoms → Molecules → Organisms
  ↓
Services → Utilities
  ↓
Modules → Boot sequence
```

### JS Rules (Enforced)
- ✅ IIFE pattern mandatory
- ✅ Explicit `window.*` exports
- ✅ Private functions prefix `_`: `function _helper() {}`
- ✅ `const`/`let` only (no `var`)
- ✅ Strict equality: `===` (never `==`)
- ✅ `console.warn`/`console.error` only (no `console.log`)
- ✅ Run `npm run lint:js` (0 errors mandatory)
- ❌ No global state outside IIFE
- ❌ No duplicated state (use `AppState`)

---

## 📚 Workflows (Use These!)

**9 Core Workflows** + **4 Specialized** — Reference: [Workflows README](../workflows/README.md)

| Workflow | Use | Command |
|----------|-----|---------|
| Smart Edit | Fix/update code | `/smart-edit` |
| Discuss | Analyze without changes | `/discuss` |
| Changelog | Document changes | `/changelog` |
| GitHub | Release automation | `/github` |
| Artifact Docs | Plan/test artifacts | `/artifact-docs` |
| Console Test | Browser automation test | `/console-test` |
| Token Mgmt | Add/update tokens | `/token-management` |
| Module Creation | Create new module | `/module-creation` |
| Linting Gates | Verify code quality | `/linting-gates` |
| Atomic Gen | Create component | `/atomic-gen [name] [level]` |
| Planning | Implementation plan | `/plan` |
| Refactor | Legacy → Atomic | `/refactor-to-atomic` |
| Test Cases | Design test suite | `/test [feature]` |

---

## ✅ Adding New Features — Checklist

### New Atomic Component
- [ ] Run `/atomic-gen [name] [level]` workflow
- [ ] CSS: `renderer/css/design-system/[level]/[name].css` (use tokens only)
- [ ] JS: `renderer/js/components/[level]/[name].js` (IIFE pattern if interactive)
- [ ] Register: CSS import + script in index.html + init in app.js
- [ ] Verify: `npm run lint` → 0 errors
- [ ] Update: ARCHITECTURE.md + `/changelog`

### New Feature Module
- [ ] Use `/module-creation [name]` workflow
- [ ] IIFE pattern + dependencies declared + window.* export
- [ ] Register in index.html (correct order) + app.js init call
- [ ] Verify: `npm run lint` → 0 errors
- [ ] Update: ARCHITECTURE.md + `/changelog`

### Bug Fix / Code Update
- [ ] Use `/smart-edit` workflow (surgical edits, minimal diffs)
- [ ] `npm run lint` after each edit
- [ ] Use `/console-test` if interactive
- [ ] Update `/changelog`

---

## 🛡️ Linting Gates (Zero-Error Policy)

### CSS Linting (`npm run lint:css`)
**Enforced rules:**
- `color-no-invalid-hex` — Valid hex only
- `no-duplicate-selectors` — No duplication
- `length-zero-no-unit` — Use `0` not `0px`
- `function-calc-no-unspaced-operator` — Space in `calc()`
- `import-notation` — Use string form `@import "..."`

### JavaScript Linting (`npm run lint:js`)
**Enforced rules:**
- `no-unused-vars` — Prefix unused with `_` (e.g., `_unused`, `_err`)
- `no-undef` — Variables must be defined
- `eqeqeq` — Use `===` never `==`
- `no-console` — Only `warn`/`error` allowed
- `no-var` — Use `const`/`let` only

---

## 🚫 Hard Rules (Never Do This)

### CSS
- ❌ Hardcode colors: Use `var(--ds-...)`
- ❌ Hardcode spacing: Use `var(--ds-space-...)`
- ❌ Write CSS in styles.css: Use `@import` only
- ❌ Duplicate selectors: Merge into one definition
- ❌ Unspaced operators in calc(): Add spaces

### JavaScript
- ❌ Global variables: Use IIFE + `window.*` exports
- ❌ Duplicate state: Use `AppState` only
- ❌ Use `var`: Use `const`/`let`
- ❌ Loose equality `==`: Use `===`
- ❌ `console.log`: Use `console.warn`/`console.error`

### HTML
- ❌ New HTML files: Only use `index.html`
- ❌ Wrong sections: Respect section order

### General
- ❌ Bypass linting: `npm run lint` must pass
- ❌ Skip `/changelog`: Always document
- ❌ Assume plan correct: Wait for approval
- ❌ Auto-proceed: Wait for explicit approval

---

## 🔗 References & Quick Links

| File | Purpose |
|------|---------|
| [ARCHITECTURE.md](../../ARCHITECTURE.md) | Complete system documentation |
| [Workflows README](../workflows/README.md) | All 13 workflows explained |
| [.stylelintrc.json](../../.stylelintrc.json) | CSS linting rules (documented) |
| [eslint.config.mjs](../../eslint.config.mjs) | JS linting rules (documented) |
| [package.json](../../package.json) | npm scripts: `lint`, `lint:css`, `lint:js` |

---

## 📱 GitHub Project Status

```bash
# Project ID: PVT_kwHOBots8c4BTH09

Status IDs:
- Backlog:    f75ad846
- Ready:      61e4505c
- In progress: 47fc9ee4
- In review:  df73e18b (set after code changes)
- Done:       98236657
```

---

## 🎓 Summary: 3 Core Principles

1. **Analysis-First** — Plan before code, wait for approval
2. **Quality Gates** — Zero linting errors, mandatory
3. **Minimal Diffs** — Surgical edits, no cleanup/reformat

**Development Cycle:**
```
/discuss (analyze)
  ↓
/plan (create plan artifact)
  ↓
Wait for approval
  ↓
/smart-edit (implement per plan)
  ↓
/console-test (verify)
  ↓
/changelog (document)
  ↓
npm run lint (0 errors mandatory)
  ↓
Commit & PR
```

---

**Last Updated:** 2026-04-25 | **Version:** 2.0 | **Status:** Current ✅

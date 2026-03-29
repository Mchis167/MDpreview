# MDpreview — AI Rules & Architecture Guide

> This is the **single source of truth** for all AI agents working on this project.
> All AI tools (Claude Code, Cursor, Windsurf, Copilot, Antigravity, etc.) must follow these rules.

---

## Agent Workflow (All AI Tools)

For every non-trivial task (implementation, refactoring, bug fix):

1. **Research** — Check the GitHub Project for relevant tasks: `gh project item-list 3 --owner Mchis167 --format json`
2. **Plan** — Present an `implementation_plan` with proposed changes before touching code
3. **Wait** — STOP after presenting the plan. Do NOT proceed until the user says "proceed", "approve", or gives feedback
4. **Execute** — Only then make code changes
5. **Status Update** — Immediately move the task to **"In review"** after changes are applied
6. **Verify** — Present a `walkthrough` confirming the change works

**Anti-patterns to avoid:**
- Auto-proceeding after writing a plan
- Leaving a task in "In progress" after code is changed
- Assuming the plan is correct without user approval

---

## GitHub Project Management

**Project ID:** `PVT_kwHOBots8c4BTH09`

### Finding & prioritizing tasks
```bash
gh project item-list 3 --owner Mchis167 --format json
gh issue view <number> --repo Mchis167/MDpreview
```
Priority order: `In progress` → `Ready` (P0 > P1 > P2) → `Backlog`

### Updating task status
```bash
gh project item-edit --project-id PVT_kwHOBots8c4BTH09 \
  --id <ITEM_ID> \
  --field-id PVTSSF_lAHOBots8c4BTH09zhAdKGY \
  --single-select-option-id <OID>
```

| Status | Option ID | When to use |
|--------|-----------|-------------|
| Backlog | `f75ad846` | Not yet started |
| Ready | `61e4505c` | Scoped and ready to pick up |
| In progress | `47fc9ee4` | Agent starts planning/researching |
| In review | `df73e18b` | Code changes applied — set this IMMEDIATELY |
| Done | `98236657` | Human user confirms satisfied |

---

## Project Architecture

MDpreview is an Electron desktop app for previewing Markdown files.

```
main.js          ← Electron main process (window, IPC, tray)
server.js        ← Express local server (file API, socket.io, hot reload)
renderer/        ← UI (HTML + CSS + vanilla JS — no bundler)
```

### HTML — `renderer/index.html`

Single file, no fragments. Section order:
1. Overlay modals (workspace panel, add-workspace modal)
2. `#app-layout` (left sidebar → main → right sidebar)
3. Comment form popup (fixed position)
4. Zoom modal (fixed position)
5. `<script>` tags in load order

**Rules:**
- Add new HTML into the correct section (sidebar → inside `<aside id="sidebar-left">`, modal → before `#app-layout`)
- Do NOT create new HTML files — only `index.html`

---

### CSS — `renderer/css/`

`styles.css` is the entry point — **`@import` only**, never write CSS directly into it.

| File | Owns |
|------|------|
| `tokens.css` | `:root` variables, reset, `.btn` / `.btn-primary` / `.btn-ghost`, `.hidden` |
| `layout.css` | `#app-layout`, `<main>`, `.glass-main` |
| `sidebar.css` | Left sidebar: logo, mode switcher, workspace picker, tree, search, recently viewed, footer |
| `toolbar.css` | `#toolbar`, breadcrumb, segmented control, `.toolbar-btn` |
| `markdown.css` | `#md-viewer`, empty state, `#md-content`, mermaid, `.md-line`, `.comment-trigger` |
| `comments.css` | Right sidebar, comment list, comment form popup |
| `modals.css` | Workspace panel (`.ws-*`), add-workspace modal (`.aws-*`), zoom modal (`.zoom-ctrl-*`) |

**Rules:**
- New styles → find the correct file from the table above, never write into `styles.css`
- New UI component → add a section with a `/* ── Name ── */` comment header
- Always use CSS variables (`var(--accent-orange)`, `var(--border-main)`, etc.) — no hardcoded colors
- New CSS file → add `@import url('filename.css');` to `styles.css` (keep `tokens.css` first)

---

### JavaScript — `renderer/js/`

No bundler, no module system. Each file is a global script. Load order = dependency order:

```
tree.js → workspace.js → comments.js → zoom.js → mermaid.js → toolbar.js → sidebar.js → app.js
```

| File | Domain | Global exports |
|------|--------|----------------|
| `tree.js` | File tree render, folder toggle, search | `TreeModule` |
| `workspace.js` | Workspace CRUD, localStorage | `WorkspaceModule` |
| `comments.js` | Comment form, list, save/load | `CommentsModule` |
| `zoom.js` | Zoom modal: pan, zoom, controls | `openZoom`, `closeZoom`, `fitZoom`, `initZoom` |
| `mermaid.js` | Mermaid config, diagram render, click-to-zoom | `initMermaid`, `processMermaid` |
| `toolbar.js` | Toolbar buttons, Read/Comment toggle | `initToolbarBtns`, `initSegmentedControl` |
| `sidebar.js` | Mode switcher, search enter/exit, resizer | `initSidebarModeSwitcher`, `initSidebarRevamp`, `initSidebarResizer` |
| `app.js` | Central state, file loading, socket, boot | `AppState`, `loadFile`, `setNoFile` |

**Global contract:**
- `AppState` — shared state object, read by all modules. Never duplicate state elsewhere.
- `loadFile(path)` — load and render a markdown file
- `setNoFile()` — reset to no-file state
- `openZoom(svgEl)` — called from `mermaid.js` to open zoom modal
- `processMermaid(container)` — called from `app.js` after rendering HTML

**Rules:**
- New UI logic → write `init*()` in the correct domain file, call it from the boot sequence in `app.js` with a `// filename.js` comment
- Shared state → add to `AppState`. Module-local state → keep local, don't pollute globals
- New JS file → add `<script src="js/filename.js"></script>` in `index.html` before `app.js`, in dependency order

---

## Adding New Features — Checklist

### New UI behavior
- [ ] Identify domain (toolbar / sidebar / modal / markdown viewer)
- [ ] Write `init*()` in the correct JS file
- [ ] Call it from `app.js` DOMContentLoaded with `// file.js` comment
- [ ] Add styles to the correct CSS file

### New modal
- [ ] HTML before `#app-layout` in `index.html`
- [ ] Styles in `modals.css`
- [ ] JS in relevant domain file or new file

### New JS file
- [ ] Create in `renderer/js/`
- [ ] Add `<script>` tag in `index.html` before `app.js`
- [ ] Position after any files this one depends on
- [ ] Update the table above

### New CSS file
- [ ] Create in `renderer/css/`
- [ ] Add `@import` to `styles.css`
- [ ] Keep `tokens.css` as the first import

---

## Hard Rules — Never Do This

- Write CSS directly into `styles.css`
- Put toolbar logic in `sidebar.js` or vice versa (keep domains clean)
- Hardcode colors like `#ffbf48`, `#0e0e12` — use `var(--accent-orange)`, `var(--bg-base)`, etc.
- Create new HTML files in `renderer/` — only `index.html`
- Add frameworks or bundlers — vanilla JS is intentional
- Duplicate shared state — everything goes through `AppState`
- Modify `main.js` or `server.js` for UI-only changes

---

## Dependency Diagram

```
index.html
├── css/styles.css
│   ├── tokens.css     ← CSS variables (always first)
│   ├── layout.css
│   ├── sidebar.css
│   ├── toolbar.css
│   ├── markdown.css
│   ├── comments.css
│   └── modals.css
│
└── js/ (load order)
    ├── tree.js        → TreeModule
    ├── workspace.js   → WorkspaceModule  (needs TreeModule, setNoFile)
    ├── comments.js    → CommentsModule   (needs AppState)
    ├── zoom.js        → openZoom
    ├── mermaid.js     → processMermaid   (needs openZoom)
    ├── toolbar.js     (needs AppState.commentMode)
    ├── sidebar.js     (needs DOM)
    └── app.js         → AppState, loadFile, setNoFile
                          (needs processMermaid, CommentsModule, TreeModule)
```

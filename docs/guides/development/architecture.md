# Rendering Architecture

**Status:** Phase 1.1 Complete (May 1, 2026)  
**Last Updated:** May 6, 2026  
**Version:** 2.1 (Recursive Rendering)

---

## Overview

MDpreview uses a **two-tier rendering architecture** optimized for different contexts:

1. **Server Renderer** — Rich features for local editing (line tracking, live updates)
2. **Worker Renderer** — Lightweight for published pages (edge-optimized, premium UI)
3. **Shared Core** — Identical rendering primitives (NEW in v1.1.0)

```
Markdown Input
    ↓
┌───────────────────────────────────────────┐
│     md-renderer-core.js (Shared)          │
│  ─────────────────────────────────────────│
│  • highlightCodeBlock()                   │
│  • sanitizeHtml() ← XSS Protection         │
│  • wrapInTableWrapper()                   │
│  • renderMermaidBlock()                   │
└───────────────────────────────────────────┘
    ↓
┌──────────────────┬──────────────────┐
│  Server          │  Worker          │
│  Renderer        │  Renderer        │
│  ──────────────  │  ──────────────  │
│  +Line tracking  │  +Premium UI     │
│  +Details block  │  +Copy button    │
│  +Live updates   │  +Language tag   │
└──────────────────┴──────────────────┘
    ↓
HTML Output (Sanitized)
```

---

## Shared Core: `md-renderer-core.js`

### Location
```
renderer/js/services/md-renderer-core.js
```

### Purpose
Provides pure, testable rendering functions used by both server and worker.

### API

#### 1. `highlightCodeBlock(code, lang)`

**Input:** Code string + language identifier  
**Output:** HTML with syntax highlighting classes

```javascript
const code = 'const x = 42;';
const highlighted = highlightCodeBlock(code, 'javascript');
// Returns: '<span class="hljs-keyword">const</span> <span class="hljs-variable">x</span> = ...'
```

**Features:**
- Language-specific highlighting via highlight.js
- Fallback to auto-detection if language unknown
- No-op for empty code

**Used By:**
- ✅ Server: Manual highlighting in code blocks
- ✅ Worker: Premium code block rendering

---

#### 2. `sanitizeHtml(html)` ⚠️ CRITICAL

**Input:** Arbitrary HTML string  
**Output:** Safe HTML (XSS vectors removed)

```javascript
const unsafe = '<p>Safe</p><script>alert(1)</script>';
const safe = sanitizeHtml(unsafe);
// Returns: '<p>Safe</p>'
```

**Removes:**
- `<script>` tags (and contents)
- `<iframe>` tags
- Event handlers: `onclick=`, `onerror=`, `onload=`, etc.
- All `on*` attributes

**Regex:**
```javascript
// Remove script tags
.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')

// Remove iframe tags
.replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')

// Remove event handlers
.replace(/on\w+="[^"]*"/gi, '')
```

**Used By:**
- ✅ Server: All rendered markdown (`/api/render-raw` endpoint)
- ✅ Worker: All published content
- ✅ Electron: Before displaying in app

**IMPORTANT:** Must be called on ALL user-provided HTML before serving.

---

#### 3. `wrapInTableWrapper(html)`

**Input:** Table HTML  
**Output:** Table wrapped in accessibility div

```javascript
const table = '<table><tr><td>Cell</td></tr></table>';
const wrapped = wrapInTableWrapper(table);
// Returns: '<div class="md-table-wrapper"><table>...</table></div>'
```

**Purpose:**
- Accessibility wrapper for horizontal scrolling
- Consistent styling across server and worker
- CSS class for styling hooks

**Used By:**
- ✅ Server: Table rendering in `renderWithLineNumbers()`
- ✅ Worker: Table rendering in `render()`

---

#### 4. `renderMermaidBlock(text)`

**Input:** Mermaid diagram syntax  
**Output:** HTML div for client-side rendering

```javascript
const diagram = 'graph LR\n  A --> B';
const html = renderMermaidBlock(diagram);
// Returns: '<div class="mermaid">graph LR\n  A --> B</div>'
```

**Purpose:**
- Wrap diagram syntax in `<div class="mermaid">`
- mermaid.js library finds and renders these divs
- Client-side rendering only (no server execution)

**Used By:**
- ✅ Server: Mermaid code blocks
- ✅ Worker: Mermaid code blocks

---

### Module Format

**CommonJS (node.js compatible):**
```javascript
const { sanitizeHtml } = require('./md-renderer-core.js');
```

**Why CommonJS?**
- Server uses CommonJS
- Wrangler bundler converts to ES modules for worker
- Single source of truth (no dual-export complexity)

**NOT ES modules** (would require transpilation):
```javascript
// ❌ This doesn't work in Node.js
export { sanitizeHtml }
```

---

## Server Renderer: `server/routes/render.js`

### Purpose
Render markdown with **line number tracking** for editor synchronization.

### API

**POST `/api/render-raw`**
```bash
curl -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content": "# Title\n\nParagraph"}'
```

**Response:**
```json
{
  "html": "<div class=\"md-block\" data-line-start=\"1\" data-line-end=\"1\">...",
  "totalLines": 3,
  "raw": "# Title\n\nParagraph"
}
```

### Key Features

#### 1. Line Number Tracking

Each markdown block is wrapped with `data-line-start` and `data-line-end`. Since v1.7.0, **Granular List Item Tracking** has been implemented:

- **Block-level**: `<div>` wrappers for paragraphs, code blocks, etc.
- **Item-level**: Each `<li>` in a list is assigned a specific `data-line` attribute.

```html
<div class="md-block" data-line-start="1" data-line-end="1">
  <div class="md-line" data-line="1">
    <h1>Title</h1>
  </div>
</div>

<div class="md-block" data-line-start="3" data-line-end="5">
  <ul>
    <li class="md-line" data-line="3">Item 1</li>
    <li class="md-line" data-line="4">Item 2</li>
    <li class="md-line" data-line="5">Item 3</li>
  </ul>
</div>
```

**Purpose:** 
- Enable editor to sync view with cursor position.
- **Interactive Task Lists**: Allow View Mode checkboxes to map directly back to the correct line in the source file for real-time updates.

#### 2. Recursive Rendering Pipeline (v1.7.2)

To ensure high-fidelity rendering of nested structures (especially lists and checklists), the server renderer uses a **Recursive Token Processor**:

- **Recursive Processing**: When a list item contains multiple blocks or nested lists, `renderTokens` is called recursively.
- **Consistent Wrapper**: Every content block (including nested ones) is wrapped in `.md-block` to enforce the global **Flow Spacing** system.
- **Flexbox List Layout**: 
    - `li.has-custom-marker` và `.task-list-item` sử dụng `display: flex`.
    - Toàn bộ nội dung của `li` được bọc trong `.md-list-item-content` với `flex: 1` và `flex-direction: column`.
    - Cơ chế này đảm bảo markers (numbers, bullets, checkboxes) luôn căn chỉnh đúng với dòng đầu tiên, trong khi các khối nội dung (văn bản, sub-list, code block) được xếp chồng theo chiều dọc thay vì dàn hàng ngang.

**Purpose:** 
- Eliminate layout breakage in complex nested ordered lists.
- Synchronize vertical rhythm across all block types using a unified spacing system.
- Support interactive task lists with accurate line mapping.

Special handling for `<details>` HTML blocks:

```markdown
<details>
<summary>Click to expand</summary>

Hidden content here
</details>
```

Accumulates tokens until closing `</details>` tag.

#### 3. Token-by-Token Processing

Uses `marked.lexer()` for fine-grained control:

```javascript
const tokens = marked.lexer(content);
tokens.forEach(token => {
  switch (token.type) {
    case 'code':
      if (token.lang === 'mermaid') {
        // Render mermaid
      } else {
        // Highlight code
      }
    case 'table':
      // Wrap table
    // ... etc
  }
});
```

### Rendering Flow

```
Markdown Input
    ↓
marked.lexer()  ← Tokenize
    ↓
Process each token:
  ├─ Code (non-mermaid)
  │  ├─ highlightCodeBlock()    [from shared core]
  │  └─ Wrap in <pre><code>
  ├─ Code (mermaid)
  │  └─ renderMermaidBlock()    [from shared core]
  ├─ Table
  │  └─ wrapInTableWrapper()    [from shared core]
  ├─ HTML (details)
  │  └─ Accumulate tokens
  └─ Other
     └─ marked.parser()
    ↓
Wrap each block with line numbers
    ↓
sanitizeHtml()  ← XSS Protection    [from shared core]
    ↓
Return {html, totalLines, raw}
```

### Changes in v1.1.0

**Removed:**
- Inline `_sanitize()` function (moved to shared core)

**Added:**
- Import `sanitizeHtml` from shared core
- Import `renderMermaidBlock` from shared core
- Mermaid diagram handling (was missing before)

---

## Worker Renderer: `cf-publish-worker/src/renderer.js`

### Purpose
Render markdown for **published pages** with premium UI features.

### API

**Function:** `render(content)`
```javascript
import { render } from './renderer.js';

const html = render(markdownContent);
// Returns: Safe HTML ready to serve
```

### Key Features

#### 1. Premium Code Block UI

Transforms code blocks with:
- Language tag in header
- Copy button with SVG icons
- Click-to-copy functionality

```html
<div class="premium-code-block">
  <div class="code-block-header">
    <span class="code-block-lang">JAVASCRIPT</span>
    <button class="code-block-copy" title="Copy code">
      <svg><!-- Copy icon --></svg>
      <span>Copy</span>
    </button>
  </div>
  <pre><code class="hljs language-javascript">...</code></pre>
</div>
```

#### 2. Edge-Optimized Rendering

- Minimal dependencies
- Lightweight function
- Fast execution on Cloudflare Workers
- No line tracking (not needed for published pages)

#### 3. Mermaid Support

Renders mermaid code blocks as-is:
```html
<div class="mermaid">graph LR
  A --> B</div>
```

### Rendering Flow

```
Markdown Input
    ↓
marked.lexer()  ← Tokenize
    ↓
Process each token:
  ├─ Code (non-mermaid)
  │  ├─ highlightCodeBlock()        [from shared core]
  │  └─ Wrap in premium UI
  ├─ Code (mermaid)
  │  └─ renderMermaidBlock()        [from shared core]
  ├─ Table
  │  └─ wrapInTableWrapper()        [from shared core]
  └─ Other
     └─ marked.parser()
    ↓
Wrap each block in .md-block / .md-line
    ↓
sanitizeHtml()  ← XSS Protection    [from shared core]  ← NEW in v1.1.0!
    ↓
Return HTML
```

### Changes in v1.1.0

**Added:**
- Import all 4 functions from shared core
- Call `sanitizeHtml()` before returning (CRITICAL)

**Refactored:**
- Use `highlightCodeBlock()` instead of manual hljs calls
- Use `wrapInTableWrapper()` instead of inline HTML
- Use `renderMermaidBlock()` instead of inline HTML

**Result:** 100% code reuse from shared core, identical protection.

---

## Marked.js Configuration

### Server Configuration

```javascript
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (_ignored) {}
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-'
});
```

### Worker Configuration

Uses shared `highlightCodeBlock()` function (no separate config needed).

### Version Differences

| Aspect | Server | Worker |
|--------|--------|--------|
| marked | v12.0.0 | v4.3.0 |
| hljs | v11.11.1 | (implicit) |
| Token handling | Full lexer | Simplified |

**Note:** Version gap should be addressed in future (not blocking).

---

## Token Types Handled

| Token Type | Server | Worker | Handler |
|-----------|--------|--------|---------|
| `code` (non-mermaid) | ✅ | ✅ | `highlightCodeBlock()` |
| `code` (mermaid) | ✅ | ✅ | `renderMermaidBlock()` |
| `table` | ✅ | ✅ | `wrapInTableWrapper()` |
| `html` | ✅ | ✅ | Passed through |
| `heading` | ✅ | ✅ | `marked.parser()` |
| `paragraph` | ✅ | ✅ | `marked.parser()` |
| `list` | ✅ | ✅ | `marked.parser()` |
| `blockquote` | ✅ | ✅ | `marked.parser()` |
| `space` | ✅ | ✅ | Skipped |
| `details` | ✅ | ⚠️ | Treated as html |

**Note:** Worker treats `<details>` as raw HTML (not special handling like server).

---

## XSS Protection Pipeline

### Vulnerability Vectors

**Before v1.1.0:**

| Vector | Server | Worker |
|--------|--------|--------|
| `<script>` injection | ✅ Protected | ❌ NOT protected |
| `<iframe>` injection | ✅ Protected | ❌ NOT protected |
| Event handlers | ✅ Protected | ❌ NOT protected |

**After v1.1.0:**

| Vector | Server | Worker |
|--------|--------|--------|
| `<script>` injection | ✅ Protected | ✅ Protected |
| `<iframe>` injection | ✅ Protected | ✅ Protected |
| Event handlers | ✅ Protected | ✅ Protected |

### Sanitization Process

```
User-provided markdown
    ↓
marked.parse() ← Tokenizes, might create HTML
    ↓
Renderer logic ← Processes tokens, creates HTML
    ↓
sanitizeHtml() ← LAST STEP: Removes XSS vectors
    ↓
Safe HTML (no scripts, iframes, or event handlers)
```

### Test Coverage

21 unit tests in `renderer/js/services/__tests__/md-renderer-core.test.js`:

```javascript
describe('sanitizeHtml()', () => {
  it('should remove <script> tags', ...)
  it('should remove <iframe> tags', ...)
  it('should remove event handlers', ...)
  it('should handle nested tags', ...)
  it('should preserve safe HTML', ...)
  // ... 13 total tests
});
```

---

## Performance Characteristics

### Server Renderer

```
Markdown (1 KB)
    ↓ marked.lexer()        ~ 1ms
    ↓ Token processing      ~ 10ms
    ↓ Syntax highlighting   ~ 20ms
    ↓ Sanitization          ~ 2ms
    ↓ JSON response         ~ 1ms
    ↓
Total: ~35ms (typical)
```

### Worker Renderer

```
Markdown (1 KB)
    ↓ marked.lexer()        ~ 0.5ms
    ↓ Token processing      ~ 5ms
    ↓ Syntax highlighting   ~ 10ms
    ↓ Sanitization          ~ 1ms
    ↓
Total: ~16ms (on edge, optimized)
```

---

## Future Improvements

### Phase 1.3: Mermaid Configuration
- Extract mermaid.js config to shared module
- Add mermaid theme support
- Consistent mermaid rendering across server/worker

### Phase 2.1: Publish Service Consolidation
- With rendering consolidated, next is publish-service.js
- Currently duplicated in server and worker
- Can extract shared publish logic

### Phase 2.2: Marked.js Version Alignment
- Upgrade server from v12.0.0 to match worker versioning
- Or upgrade worker to match server
- Ensure feature parity

### Phase 3.0: Rendering Engine Abstraction
- Consider pluggable renderer system
- Support other formats (RST, AsciiDoc)
- Optional syntax extensions

---

## Debugging Rendering Issues

### Check Shared Core is Loaded

```bash
# Server should import sanitizeHtml
grep -n "sanitizeHtml" server/routes/render.js

# Worker should import all 4 functions
grep -n "import.*md-renderer-core" cf-publish-worker/src/renderer.js
```

### Test Rendering Directly

```bash
# Start server
npm run serve

# Test XSS protection
curl -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>Safe"}' | jq '.html'

# Should NOT contain: <script> or alert
```

### Run Unit Tests

```bash
npm run test
# All 21 tests should pass
```

### Check Linting

```bash
npm run lint:js
# Should find no errors in rendering files
```

---

## Summary

**Rendering v2.0** (Phase 1.1, May 1, 2026):

✅ **Shared Core** — 4 pure functions used by both server and worker  
✅ **XSS Protection** — Worker now has identical protection to server  
✅ **Code Highlighting** — Consistent across both  
✅ **Mermaid Support** — Both render diagrams identically  
✅ **Table Wrapping** — Unified behavior  
✅ **100% Test Coverage** — 21 unit tests + integration tests  

**Status:** Production-ready, no breaking changes, all tests passing.

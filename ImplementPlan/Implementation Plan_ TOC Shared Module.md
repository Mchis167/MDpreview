# Implementation Plan: TOC Shared Module

Mục tiêu là tách TOC thành **3 lớp**: shared logic (pure JS), shared UI core (DOM rendering), và adapter riêng cho từng môi trường (web app vs publish).

***

## Kiến trúc tổng quan

```
renderer/js/services/toc-service.js     ← NEW: Pure logic, zero dependencies
renderer/css/shared/toc-core.css        ← NEW: Shared CSS tokens & item styles
        ↓                                       ↓
toc-component.js (web app)              shell.js + toc-publish.js (publish)
  - Floating panel, animations            - Sticky sidebar, anchor links
  - Segmented control (Map/Outline)       - No app dependencies
  - Scroll sync, active highlight         - SSR-injected HTML
  - DesignSystem dependency               - Runtime scroll + active highlight
```

***

## Phase 1 — Extract `toc-service.js`

**File mới:** `renderer/js/services/toc-service.js`

Đây là bước quan trọng nhất. Lấy ra 2 pure functions từ `toc-component.js` hiện tại và export theo cả CommonJS (cho Worker) lẫn global (cho browser).

```js
// renderer/js/services/toc-service.js

const SCROLL_OFFSET = 240; // ADR 20260428-toc-scroll-sync-strategy

/**
 * Scans headings (H2–H6) in a container, returns flat list then
 * builds a hierarchy tree. Filters out H1.
 * @param {HTMLElement|string} source - DOM element OR raw HTML string
 * @returns {Array} tree
 */
function scanHeadings(source) {
  let headingNodes;
  if (typeof source === 'string') {
    // SSR context: parse from HTML string (for Worker build-time)
    const tmp = document.createElement('div');
    tmp.innerHTML = source;
    headingNodes = Array.from(tmp.querySelectorAll('h2,h3,h4,h5,h6'));
  } else {
    headingNodes = Array.from(source.querySelectorAll('h2,h3,h4,h5,h6'));
  }

  const flatList = headingNodes.map(node => {
    const lineEl = node.closest?.('.md-line');
    return {
      text: node.textContent.trim(),
      level: parseInt(node.nodeName.substring(1)),
      line: lineEl ? parseInt(lineEl.getAttribute('data-line')) : 0,
      id: node.id || null,      // ← publish uses anchor id
      element: node,            // null in SSR context
    };
  });

  return buildTree(flatList);
}

/**
 * Converts flat heading list into nested tree structure.
 * @param {Array} flatList
 * @returns {Array} tree
 */
function buildTree(flatList) {
  const tree = [];
  const stack = [];
  flatList.forEach(item => {
    const node = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }
    if (stack.length === 0) {
      tree.push(node);
    } else {
      stack[stack.length - 1].children.push(node);
    }
    stack.push(node);
  });
  return tree;
}

/**
 * Renders a TOC item as an <li> element with anchor href.
 * Used by BOTH web app (click-based scroll) and publish (anchor links).
 * @param {Object} node - tree node
 * @param {Object} opts - { mode: 'app'|'publish', depth: number }
 * @returns {HTMLElement}
 */
function renderTocItem(node, opts = {}) {
  const { mode = 'app', depth = 0 } = opts;
  const item = document.createElement('div');
  item.className = `ds-toc-item level-${node.level}`;
  if (node.line) item.setAttribute('data-line', node.line);

  const content = document.createElement('div');
  content.className = 'item-content';

  const label = document.createElement('span');
  label.className = 'item-label';
  label.textContent = node.text;
  content.appendChild(label);

  if (mode === 'publish' && node.id) {
    // Publish: wrap as real anchor link
    const link = document.createElement('a');
    link.href = `#${node.id}`;
    link.className = 'item-link';
    link.appendChild(content);
    item.appendChild(link);
  } else {
    item.appendChild(content);
  }

  if (node.children.length > 0) {
    const children = document.createElement('div');
    children.className = 'item-children is-expanded'; // expanded by default in publish
    node.children.forEach(child => {
      children.appendChild(renderTocItem(child, { ...opts, depth: depth + 1 }));
    });
    item.appendChild(children);
    item.classList.add('is-expanded');
  }

  return item;
}

// Export dual: CommonJS (Worker) + global (browser)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { scanHeadings, buildTree, renderTocItem, SCROLL_OFFSET };
} else {
  window.TocService = { scanHeadings, buildTree, renderTocItem, SCROLL_OFFSET };
}
```

**Thay đổi trong `toc-component.js`:** Xóa `scanHeadings()` và `buildTree()` nội bộ, thay bằng:
```js
// Đầu file toc-component.js
const { scanHeadings, buildTree, renderTocItem, SCROLL_OFFSET } = window.TocService;
```

***

## Phase 2 — Tạo `toc-core.css` (shared styles)

**File mới:** `renderer/css/shared/toc-core.css`

Tách phần CSS không phụ thuộc vào layout context khỏi `toc-panel.css`:

```css
/* toc-core.css — Shared TOC item styles
   Used by: web app (toc-panel.css) + publish (toc-publish.css) */

/* TOC Items */
.ds-toc-item { display: flex; flex-direction: column; }

.item-content {
  display: flex; align-items: center; justify-content: space-between;
  padding: var(--ds-space-xs) var(--ds-space-xs) var(--ds-space-xs) var(--ds-space-md);
  border-radius: var(--ds-radius-widget);
  cursor: pointer;
  transition: all var(--ds-transition-fast);
  gap: var(--ds-space-sm);
}
.item-content:hover { background: var(--ds-layer-subtle-hover); }
.item-label {
  flex: 1; font-size: var(--ds-font-md);
  color: var(--ds-text-secondary); white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.item-content:hover .item-label { color: var(--ds-text-primary); }
.ds-toc-item.is-active .item-content .item-label {
  color: var(--ds-text-accent); font-weight: 700;
}
.ds-toc-item.is-active .item-content { background: var(--ds-layer-subtle-active-hover); }

/* Indentation — identical to current toc-panel.css */
.ds-toc-item.level-2 { padding-left: 0; }
.ds-toc-item.level-2:not(:first-child) {
  border-top: 1px solid var(--ds-border-subtle);
  margin-top: var(--ds-space-sm); padding-top: var(--ds-space-sm);
}
.ds-toc-item.level-3 { padding-left: var(--ds-space-md); }
.ds-toc-item.level-4 { padding-left: var(--ds-space-xl); }
.ds-toc-item.level-5 { padding-left: calc(var(--ds-space-xl) + var(--ds-space-md)); }
.ds-toc-item.level-6 { padding-left: var(--ds-space-4xl); }

/* Children */
.item-children { display: none; overflow: hidden; }
.ds-toc-item.is-expanded > .item-children { display: block; }
```

**Cập nhật `toc-panel.css`:** Thêm `@import './toc-core.css'` hoặc include trong build script, xóa các selector trùng lặp.

***

## Phase 3 — Tạo `toc-publish.css`

**File mới:** `cf-publish-worker/src/toc-publish.css`

```css
/* toc-publish.css — Publish-specific TOC layout
   Sticky sidebar, no glass panel, no animation dependencies */

.publish-layout {
  display: flex;
  max-width: 1100px;
  margin: 0 auto;
  padding: 100px 24px 60px;
  gap: 48px;
  align-items: flex-start;
}

/* TOC Sidebar */
.publish-toc-sidebar {
  width: var(--ds-toc-width, 280px);
  flex-shrink: 0;
  position: sticky;
  top: 60px;           /* Below fixed header */
  max-height: calc(100vh - 80px);
  overflow-y: auto;
  scrollbar-width: none;
}
.publish-toc-sidebar::-webkit-scrollbar { display: none; }

.publish-toc-header {
  font-size: var(--ds-font-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ds-text-disabled);
  padding: 0 var(--ds-space-md) var(--ds-space-sm);
  font-family: var(--ds-font-family-code);
}

/* Anchor links — override item-content cursor */
.publish-toc-sidebar .item-link {
  text-decoration: none; display: block;
}
.publish-toc-sidebar .item-content { cursor: pointer; }

/* Active highlight via JS */
.publish-toc-sidebar .ds-toc-item.is-active .item-label {
  color: var(--ds-accent); font-weight: 700;
}

/* Main content area */
.publish-main-content { flex: 1; min-width: 0; }

/* Responsive: hide sidebar on mobile */
@media (max-width: 768px) {
  .publish-layout { flex-direction: column; padding: 60px 16px 40px; }
  .publish-toc-sidebar { display: none; }
}
```

***

## Phase 4 — Tạo `toc-publish.js` (runtime cho publish page)

**File mới:** `cf-publish-worker/public/toc-publish.js`

Script nhỏ (~50 LOC), zero dependencies, chỉ cần chạy trên trang publish sau khi HTML đã load:

```js
// toc-publish.js — TOC runtime for published documents
// Handles: scroll sync active highlight, smooth scroll on click
(function () {
  'use strict';

  const SCROLL_OFFSET = 240; // Must match ADR 20260428-toc-scroll-sync-strategy
  const sidebar = document.querySelector('.publish-toc-sidebar');
  if (!sidebar) return;

  // Wire up click → smooth scroll (fallback for anchor links)
  sidebar.addEventListener('click', e => {
    const item = e.target.closest('.ds-toc-item[data-line]');
    // anchor links handle navigation natively; this handles line-based fallback
  });

  // Active highlight on scroll
  const headings = Array.from(
    document.querySelectorAll('.md-render-body h2, h3, h4, h5, h6')
  );
  const tocItems = Array.from(sidebar.querySelectorAll('.ds-toc-item[data-heading-id]'));

  function updateActive() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    let active = null;
    for (const h of headings) {
      if (h.getBoundingClientRect().top <= SCROLL_OFFSET) {
        active = h;
      } else {
        break;
      }
    }
    tocItems.forEach(item => item.classList.remove('is-active'));
    if (active) {
      const match = sidebar.querySelector(
        `.ds-toc-item[data-heading-id="${active.id}"]`
      );
      if (match) {
        match.classList.add('is-active');
        // Auto-scroll TOC sidebar to keep active item visible
        const itemTop = match.offsetTop;
        const sidebarH = sidebar.clientHeight;
        if (itemTop < sidebar.scrollTop || itemTop > sidebar.scrollTop + sidebarH - 40) {
          sidebar.scrollTo({ top: itemTop - 40, behavior: 'smooth' });
        }
      }
    }
  }

  window.addEventListener('scroll', updateActive, { passive: true });
  updateActive(); // run once on load
})();
```

***

## Phase 5 — Inject TOC trong `shell.js` (Worker build-time)

**Cập nhật `cf-publish-worker/src/shell.js`:**

Thêm function `buildTocHtml(renderedHtml)` để scan headings từ HTML string đã render và inject HTML tĩnh của TOC vào shell — không cần JS runtime để tạo items:

```js
// Thêm vào shell.js

import { buildTree } from '../../../renderer/js/services/toc-service.js';
// Hoặc dùng require nếu CommonJS: const { buildTree } = require(...)

/**
 * Parse headings from rendered HTML string (server-side, no DOM).
 * Dùng regex đơn giản vì Worker không có DOM.
 */
function extractHeadingsSSR(html) {
  const headingRegex = /<h([2-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-6]>/gi;
  const flat = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    flat.push({
      level: parseInt(match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/0f335843-14dd-4f8a-bc03-a7da30ed855a/05-renderer.md)),
      id: match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/843bbfee-7b90-448a-bf03-c07c02254a84/00-PROJECT-MAP.md),
      text: match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/97918106-7ece-461d-aa03-93415a69bee6/06-worker.md).replace(/<[^>]+>/g, '').trim(), // strip inner tags
      children: [],
    });
  }
  return buildTree(flat);
}

function renderTocItemSSR(node, depth = 0) {
  const indent = `level-${node.level}`;
  const children = node.children.length > 0
    ? `<div class="item-children is-expanded">
        ${node.children.map(c => renderTocItemSSR(c, depth + 1)).join('')}
       </div>`
    : '';
  return `
    <div class="ds-toc-item ${indent} is-expanded" data-heading-id="${node.id}">
      <a class="item-link" href="#${node.id}">
        <div class="item-content">
          <span class="item-label">${node.text}</span>
        </div>
      </a>
      ${children}
    </div>`;
}

export function buildTocHtml(renderedHtml) {
  const tree = extractHeadingsSSR(renderedHtml);
  if (tree.length === 0) return '';
  return `
    <nav class="publish-toc-sidebar" aria-label="Table of Contents">
      <div class="publish-toc-header">On this page</div>
      ${tree.map(n => renderTocItemSSR(n)).join('')}
    </nav>`;
}
```

**Cập nhật `buildShell()`** để dùng layout mới:

```js
// Trong buildShell(), thay ds-publish-content-wrapper bằng:
const tocHtml = buildTocHtml(html);
const hasToc = tocHtml.length > 0;

// Trong HTML template:
`<div class="${hasToc ? 'publish-layout' : 'ds-publish-content-wrapper'}">
  ${tocHtml}
  <main class="publish-main-content">
    <div id="md-content" class="md-content md-render-body">
      <div class="md-content-inner">${html}</div>
    </div>
  </main>
</div>`

// Thêm script:
`<script src="toc-publish.js"></script>`
```

***

## Phase 6 — Cập nhật build script

**Cập nhật `scripts/build-publish-assets.js`:**

```js
// Thêm toc-publish.css và toc-publish.js vào pipeline
const sources = [
  'renderer/css/design-system/tokens.css',
  'renderer/css/shared/toc-core.css',      // ← NEW
  'cf-publish-worker/src/toc-publish.css', // ← NEW
  'renderer/css/shared/markdown-render.css',
  'cf-publish-worker/src/publish-styles.css',
];

// toc-publish.js được copy sang public/ (không bundle vào CSS)
fs.copyFileSync(
  'cf-publish-worker/src/toc-publish.js',
  'cf-publish-worker/public/toc-publish.js'
);
```

***

## Tóm tắt thay đổi theo file

| File | Thay đổi |
|---|---|
| `renderer/js/services/toc-service.js` | **NEW** — `scanHeadings`, `buildTree`, `renderTocItem` |
| `renderer/css/shared/toc-core.css` | **NEW** — Shared item styles |
| `renderer/js/components/organisms/toc-component.js` | Xóa `scanHeadings`/`buildTree` nội bộ, import từ `TocService` |
| `renderer/css/design-system/organisms/toc-panel.css` | Import `toc-core.css`, xóa selector trùng |
| `cf-publish-worker/src/shell.js` | Thêm `buildTocHtml()`, cập nhật layout template |
| `cf-publish-worker/src/toc-publish.css` | **NEW** — Publish layout + sticky sidebar |
| `cf-publish-worker/public/toc-publish.js` | **NEW** — Runtime scroll sync cho publish |
| `cf-publish-worker/public/publish.css` | Include `toc-core.css` + `toc-publish.css` qua build script |
| `scripts/build-publish-assets.js` | Thêm source mới, copy `toc-publish.js` |
| `renderer/index.html` | Thêm `<script src="js/services/toc-service.js">` trước `toc-component.js` |

***

## Thứ tự thực hiện

1. **Phase 1** trước — extract service, verify web app vẫn hoạt động bình thường.
2. **Phase 2** — tách CSS, không có breaking change.
3. **Phase 5 + 6** — inject TOC vào shell, chạy `wrangler dev` kiểm tra.
4. **Phase 3 + 4** — CSS layout publish + runtime JS.
5. Chạy `npm run build-publish-assets` để rebuild `publish.css`.
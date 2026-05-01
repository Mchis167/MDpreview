# Module: WORKER


<file path="cf-publish-worker/package.json">
```json
{
  "name": "mdpreview-publish-worker",
  "version": "1.0.0",
  "description": "Self-hosted publish engine for MDpreview",
  "main": "src/index.js",
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev"
  },
  "devDependencies": {
    "wrangler": "^4.86.0"
  },
  "dependencies": {
    "highlight.js": "^11.8.0",
    "marked": "^4.3.0"
  }
}

```
</file>

<file path="cf-publish-worker/public/publish.css">
```css
/**
 * publish.css
 * High-fidelity styles for published MDpreview documents.
 * Synchronized with the main app's Design System.
 */

:root {
    /* ── Core Tokens (Synced with App) ── */
    --ds-bg-main: #131313;
    --ds-accent: #ffbf48; /* Default Orange */
    --ds-accent-rgb: 255, 191, 72;
    
    --ds-text-primary: rgba(255, 255, 255, 0.90);
    --ds-text-secondary: rgba(255, 255, 255, 0.60);
    --ds-text-inverse: #ffffff;
    
    --ds-white-a02: rgba(255, 255, 255, 0.02);
    --ds-white-a04: rgba(255, 255, 255, 0.04);
    --ds-white-a05: rgba(255, 255, 255, 0.05);
    --ds-white-a08: rgba(255, 255, 255, 0.08);
    --ds-white-a10: rgba(255, 255, 255, 0.10);
    --ds-white-a20: rgba(255, 255, 255, 0.20);
    
    --ds-black-a20: rgba(0, 0, 0, 0.20);
    --ds-black-a30: rgba(0, 0, 0, 0.30);
    --ds-black-a40: rgba(0, 0, 0, 0.40);
    --ds-black-a50: rgba(0, 0, 0, 0.50);

    --ds-font-family-text: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    --ds-font-family-code: 'Roboto Mono', monospace;
    
    --ds-radius-panel: 12px;
    --ds-radius-widget: 8px;
    --ds-radius-sm: 6px;
    
    --ds-transition-smooth: 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    
    --ds-layer-surface-default: rgba(255, 255, 255, 0.04);
    --ds-layer-surface-hover: rgba(255, 255, 255, 0.08);
    --ds-border-default: rgba(255, 255, 255, 0.10);
}

* { box-sizing: border-box; }

body {
    margin: 0;
    padding: 0;
    background-color: var(--ds-bg-main);
    color: var(--ds-text-secondary);
    font-family: var(--ds-font-family-text);
    line-height: 1.8;
    -webkit-font-smoothing: antialiased;
}

.md-publish-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 60px 24px;
}

/* ── Markdown Content Typography ── */
.md-render-body {
    font-size: 15px;
}

.md-render-body h1, 
.md-render-body h2, 
.md-render-body h3, 
.md-render-body h4, 
.md-render-body h5, 
.md-render-body h6 {
    color: var(--ds-text-inverse);
    font-weight: 700;
    line-height: 1.4;
    margin-bottom: 1.25rem;
    margin-top: 2.5rem;
}

.md-render-body h1 {
    font-size: 32px;
    margin-top: 0;
    margin-bottom: 2rem;
    padding-bottom: 1rem;
    border-bottom: 1px solid var(--ds-white-a20);
    letter-spacing: -0.05em;
}

.md-render-body h2 {
    font-size: 24px;
    position: relative;
    padding-left: 20px;
}

.md-render-body h2::before {
    content: '';
    position: absolute;
    left: 0;
    top: 0.6em;
    width: 8px;
    height: 8px;
    background: var(--ds-accent);
    border-radius: 2px;
}

.md-render-body h3 {
    font-size: 18px;
    font-weight: 600;
    color: var(--ds-accent);
}

.md-render-body p { margin-bottom: 1.25rem; }

.md-render-body a {
    color: var(--ds-accent);
    text-decoration: none;
    font-weight: 600;
}

.md-render-body a:hover { text-decoration: underline; }

.md-render-body hr {
    border: none;
    border-bottom: 1px solid var(--ds-border-default);
    margin: 3rem 0;
}

.md-render-body blockquote {
    border-left: 2px solid var(--ds-accent);
    padding: 16px 24px;
    margin: 2rem 0;
    background: var(--ds-white-a02);
    border-radius: 0 var(--ds-radius-panel) var(--ds-radius-panel) 0;
    color: var(--ds-text-secondary);
}

.md-render-body ul, .md-render-body ol { padding-left: 1.5rem; margin-bottom: 1.25rem; }
.md-render-body li { margin-bottom: 0.5rem; }

/* ── Premium Block System ── */
.premium-code-block,
.md-table-wrapper,
.mermaid {
    background: transparent !important;
    backdrop-filter: blur(40px) !important;
    -webkit-backdrop-filter: blur(40px) !important;
    border: 1px solid var(--ds-white-a08) !important;
    border-radius: var(--ds-radius-panel) !important;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15) !important;
    margin: 2rem 0 !important;
    overflow: hidden !important;
    isolation: isolate;
}

/* ── Premium Code Blocks ── */
.code-block-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    background: var(--ds-black-a30);
    border-bottom: 1px solid var(--ds-white-a10);
}

.code-block-lang {
    font-size: 10px;
    font-weight: 800;
    color: var(--ds-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-family: var(--ds-font-family-code);
}

.code-block-copy {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--ds-layer-surface-default);
    border: 1px solid var(--ds-white-a10);
    color: var(--ds-text-secondary);
    padding: 4px 10px;
    border-radius: var(--ds-radius-sm);
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all var(--ds-transition-smooth);
}

.code-block-copy:hover {
    background: var(--ds-layer-surface-hover);
    color: var(--ds-text-inverse);
}

.code-block-copy.copied {
    background: rgba(var(--ds-accent-rgb), 0.15);
    color: var(--ds-accent);
}

.code-block-copy .hidden { display: none; }

.md-render-body pre {
    margin: 0;
    padding: 20px;
    background: transparent;
    overflow-x: auto;
}

/* Premium Scrollbar */
.md-render-body pre::-webkit-scrollbar,
.md-table-wrapper::-webkit-scrollbar {
    height: 6px;
    width: 6px;
}

.md-render-body pre::-webkit-scrollbar-thumb,
.md-table-wrapper::-webkit-scrollbar-thumb {
    background: var(--ds-white-a10);
    border-radius: 10px;
}

.md-render-body pre::-webkit-scrollbar-thumb:hover,
.md-table-wrapper::-webkit-scrollbar-thumb:hover {
    background: var(--ds-white-a20);
}

.md-render-body pre code {
    display: block;
    font-family: var(--ds-font-family-code);
    font-size: 13.5px;
    line-height: 1.6;
    color: #fff;
    white-space: pre-wrap;
    overflow-wrap: break-word;
}

/* ── Premium Tables ── */
.md-table-wrapper { background: transparent !important; }

.md-render-body table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.95em;
    min-width: 600px;
}

.md-render-body th {
    background: var(--ds-white-a04);
    color: var(--ds-accent);
    padding: 16px 24px;
    text-align: left;
    font-weight: 700;
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    border-bottom: 1px solid var(--ds-white-a08);
    font-family: var(--ds-font-family-code);
}

.md-render-body td {
    padding: 16px 24px;
    border-bottom: 1px solid var(--ds-white-a05);
    border-right: 1px solid var(--ds-white-a02);
    color: var(--ds-text-secondary);
    line-height: 1.6;
}

.md-render-body td:last-child { border-right: none; }
.md-render-body tr:last-child td { border-bottom: none; }

/* ── Atomic Blocks (Shared with App) ── */
.md-block { margin-bottom: 0.5rem; }
.md-line { width: 100%; }

/* ── Mermaid Diagrams ── */
.mermaid {
    background: transparent !important;
    padding: 32px !important;
    display: flex;
    align-items: center;
    justify-content: center;
}

.mermaid svg {
    max-width: 100% !important;
    height: auto !important;
}

/* Force Mermaid text visibility and standardize strokes */
.mermaid text, .mermaid span, .mermaid .label {
    fill: #fff !important;
    color: #fff !important;
}

.mermaid path, .mermaid rect, .mermaid circle, .mermaid polygon {
    stroke: var(--ds-white-a20) !important;
}

/* ── Syntax Highlighting (Xcode Exact Palette) ── */
.hljs-comment, .hljs-quote { color: #a1c659; font-style: italic; }
.hljs-keyword, .hljs-selector-tag, .hljs-literal { color: #d0a8ff; }
.hljs-string, .hljs-regexp, .hljs-attribute { color: #ff8170; }
.hljs-built_in, .hljs-title, .hljs-name, .hljs-type { color: #6bdfff; }
.hljs-number, .hljs-variable, .hljs-attr { color: #d0a8ff; }
.hljs-symbol, .hljs-bullet, .hljs-meta { color: #ffa14f; }
.hljs-strong { font-weight: bold; }
.hljs-emphasis { font-style: italic; }

```
</file>

<file path="cf-publish-worker/src/handlers/auth.js">
```js
/**
 * Authentication helpers
 */
export function checkAdminSecret(request, env) {
  const secret = request.headers.get('X-Admin-Secret');
  return secret === env.ADMIN_SECRET;
}

export async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

```
</file>

<file path="cf-publish-worker/src/handlers/delete.js">
```js
import { checkAdminSecret } from './auth.js';

export async function handleDelete(request, env, slug) {
  if (!checkAdminSecret(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  await env.PUB_STORE.delete(`pub:${slug}:html`);
  await env.PUB_STORE.delete(`pub:${slug}:meta`);

  return new Response(JSON.stringify({ success: true }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

```
</file>

<file path="cf-publish-worker/src/handlers/publish.js">
```js
import { render } from '../renderer.js';
import { buildShell } from '../shell.js';
import { checkAdminSecret, hashPassword } from './auth.js';
import { isValidSlug } from '../utils/slug.js';

export async function handlePublish(request, env) {
  if (!checkAdminSecret(request, env)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  const body = await request.json();
  let { slug, content, password, title, filePath } = body;
  if (slug) slug = slug.toLowerCase();

  if (!isValidSlug(slug)) {
    return new Response(JSON.stringify({ error: 'Invalid slug' }), { 
      status: 400, 
      headers: { 'Content-Type': 'application/json' } 
    });
  }

  // Render
  const renderedHtml = render(content);
  const fullHtml = buildShell({ slug, html: renderedHtml, title });

  // Password hash
  const passwordHash = password ? await hashPassword(password) : null;

  const meta = {
    slug,
    title,
    filePath,
    passwordHash,
    updatedAt: new Date().toISOString()
  };

  // Save to KV
  await env.PUB_STORE.put(`pub:${slug}:html`, fullHtml);
  await env.PUB_STORE.put(`pub:${slug}:meta`, JSON.stringify(meta));

  return new Response(JSON.stringify({ 
    success: true, 
    slug, 
    updatedAt: meta.updatedAt 
  }), { 
    headers: { 'Content-Type': 'application/json' } 
  });
}

```
</file>

<file path="cf-publish-worker/src/handlers/serve.js">
```js
export async function handleServe(request, env, slug) {
  const metaRaw = await env.PUB_STORE.get(`pub:${slug}:meta`);
  if (!metaRaw) {
    return new Response('Not Found', { status: 404 });
  }

  const meta = JSON.parse(metaRaw);

  // Simple password check (query param for now, can be improved to cookie)
  if (meta.passwordHash) {
    const url = new URL(request.url);
    const providedPass = url.searchParams.get('p');
    
    if (!providedPass) {
      return new Response('Password required. Use ?p=PASSWORD', { status: 401 });
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(providedPass);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hash = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    if (hash !== meta.passwordHash) {
      return new Response('Invalid password', { status: 403 });
    }
  }

  const html = await env.PUB_STORE.get(`pub:${slug}:html`);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60'
    }
  });
}

```
</file>

<file path="cf-publish-worker/src/index.js">
```js
import { handlePublish } from './handlers/publish.js';
import { handleServe } from './handlers/serve.js';
import { handleDelete } from './handlers/delete.js';
import { checkAdminSecret } from './handlers/auth.js';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Secret',
        }
      });
    }

    try {
      // API Routes
      if (request.method === 'POST' && path === '/publish') {
        const res = await handlePublish(request, env);
        _addCors(res);
        return res;
      }

      if (request.method === 'GET' && path === '/check-slug') {
        const slug = url.searchParams.get('slug');
        if (!slug) return new Response(JSON.stringify({ error: 'Missing slug' }), { status: 400 });
        
        const exists = await env.PUB_STORE.get(`pub:${slug}:meta`);
        const res = new Response(JSON.stringify({ exists: !!exists }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      if (request.method === 'DELETE' && path.startsWith('/publish/')) {
        const slug = path.split('/')[2];
        const res = await handleDelete(request, env, slug);
        _addCors(res);
        return res;
      }

      if (request.method === 'GET' && path === '/list') {
        if (!checkAdminSecret(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        
        const list = await env.PUB_STORE.list({ prefix: 'pub:' });
        const slugs = new Set();
        list.keys.forEach(k => {
          const parts = k.name.split(':');
          if (parts[1]) slugs.add(parts[1]);
        });
        
        const res = new Response(JSON.stringify({ slugs: Array.from(slugs) }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      if (request.method === 'POST' && path === '/rename') {
        if (!checkAdminSecret(request, env)) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        
        const { oldSlug, newSlug } = await request.json();
        if (!oldSlug || !newSlug) return new Response(JSON.stringify({ error: 'Missing slugs' }), { status: 400 });

        // 1. Check if newSlug is taken
        const exists = await env.PUB_STORE.get(`pub:${newSlug}:meta`);
        if (exists) return new Response(JSON.stringify({ error: 'New slug already taken' }), { status: 400 });

        // 2. Get old data
        const html = await env.PUB_STORE.get(`pub:${oldSlug}:html`);
        const metaStr = await env.PUB_STORE.get(`pub:${oldSlug}:meta`);
        if (!html || !metaStr) return new Response(JSON.stringify({ error: 'Source slug not found' }), { status: 404 });

        const meta = JSON.parse(metaStr);
        meta.slug = newSlug; // Update internal slug

        // 3. Put new data
        await env.PUB_STORE.put(`pub:${newSlug}:html`, html);
        await env.PUB_STORE.put(`pub:${newSlug}:meta`, JSON.stringify(meta));

        // 4. Delete old data
        await env.PUB_STORE.delete(`pub:${oldSlug}:html`);
        await env.PUB_STORE.delete(`pub:${oldSlug}:meta`);

        const res = new Response(JSON.stringify({ success: true, newSlug }), {
          headers: { 'Content-Type': 'application/json' }
        });
        _addCors(res);
        return res;
      }

      // Try to serve static assets from the ASSETS binding (e.g., /publish.css)
      if (request.method === 'GET') {
        const assetResponse = await env.ASSETS.fetch(request.clone());
        if (assetResponse.status !== 404) {
          return assetResponse;
        }
      }

      // Serve Published Documents (Slugs)
      if (request.method === 'GET' && path !== '/') {
        const slug = path.slice(1);
        return handleServe(request, env, slug);
      }

      return new Response('MDpreview Publish Worker is Running', { status: 200 });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};

function _addCors(response) {
  response.headers.set('Access-Control-Allow-Origin', '*');
}

```
</file>

<file path="cf-publish-worker/src/renderer.js">
```js
import { marked } from 'marked';
import hljs from 'highlight.js';

/**
 * High-fidelity renderer port from MDpreview server.
 * Ensures 100% parity with app structure by using lexer/parser manually.
 */
export function render(content) {
  const tokens = marked.lexer(content);
  let html = '';

  tokens.forEach(token => {
    if (token.type === 'space') return;

    let tokenHtml = '';
    
    // ── 1. Handle Premium Code Blocks ──
    if (token.type === 'code' && token.lang !== 'mermaid') {
      const lang = token.lang || 'text';
      const language = lang.toUpperCase();
      let highlighted = token.text;
      
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(token.text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(token.text).value;
        }
      } catch (_) { highlighted = token.text; }

      tokenHtml = `
        <div class="premium-code-block">
          <div class="code-block-header">
            <span class="code-block-lang">${language}</span>
            <button class="code-block-copy" title="Copy code" onclick="window.copyCode(this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="icon-check hidden"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
        </div>`;
    } 
    // ── 2. Handle Tables ──
    else if (token.type === 'table') {
      const tableHtml = marked.parser([token]);
      tokenHtml = `<div class="md-table-wrapper">${tableHtml}</div>`;
    } 
    // ── 3. Handle Mermaid ──
    else if (token.type === 'code' && token.lang === 'mermaid') {
      tokenHtml = `<div class="mermaid">${token.text}</div>`;
    }
    // ── 4. Standard Blocks ──
    else {
      tokenHtml = marked.parser([token]);
    }

    // Wrap in standard MDpreview block structure for 100% CSS parity
    html += `<div class="md-block"><div class="md-line">${tokenHtml}</div></div>\n`;
  });

  return html;
}
```
</file>

<file path="cf-publish-worker/src/shell.js">
```js
/**
 * HTML Shell for published documents
 */
export function buildShell({ slug, html, title = 'Document', assetsUrl = '/publish.css' }) {
  const escapedTitle = title.replace(/[&<>"']/g, m => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[m]));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedTitle}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Roboto+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${assetsUrl}">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', () => {
      // 1. Initialize Mermaid
      mermaid.initialize({ 
        startOnLoad: true, 
        theme: 'dark',
        securityLevel: 'loose'
      });

      // 2. Setup Code Copy Logic
      window.copyCode = (btn) => {
        const codeEl = btn.closest('.premium-code-block').querySelector('code');
        if (!codeEl) return;

        const text = codeEl.innerText;
        navigator.clipboard.writeText(text).then(() => {
          const iconCopy = btn.querySelector('.icon-copy');
          const iconCheck = btn.querySelector('.icon-check');
          const textSpan = btn.querySelector('span');
          
          btn.classList.add('copied');
          iconCopy.classList.add('hidden');
          iconCheck.classList.remove('hidden');
          textSpan.innerText = 'Copied!';
          
          setTimeout(() => {
            btn.classList.remove('copied');
            iconCopy.classList.remove('hidden');
            iconCheck.classList.add('hidden');
            textSpan.innerText = 'Copy';
          }, 2000);
        });
      };
    });
  </script>
</head>
<body class="md-publish-body">
  <div class="md-publish-container">
    <div id="md-content" class="md-content md-render-body">
      <div class="md-content-inner">
        ${html}
      </div>
    </div>
  </div>
  <footer style="text-align: center; padding: 60px; color: #666; font-size: 12px; font-family: sans-serif;">
    Published with <a href="https://github.com/Mchis167/MDpreview" style="color: #888; text-decoration: none;">MDpreview</a>
  </footer>
</body>
</html>`;
}

```
</file>

<file path="cf-publish-worker/src/utils/slug.js">
```js
/**
 * Simple slug validator
 */
export function isValidSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  // Allow a-z, 0-9, hyphens, and underscores. 1-100 chars.
  const regex = /^[a-z0-9-_]{1,100}$/i;
  return regex.test(slug);
}

```
</file>

<file path="cf-publish-worker/wrangler.toml">
```toml
name = "mdpreview-publish"
main = "src/index.js"
compatibility_date = "2024-01-01"

# [vars]
# ADMIN_SECRET = "your-secret-here" # Set via wrangler secret put ADMIN_SECRET

[[kv_namespaces]]
binding = "PUB_STORE"
id = "7a0bbe734fa64dd7b292163a4c290abe"

[assets]
directory = "./public"
binding = "ASSETS"

```
</file>

# Implementation Plan: Self-Hosted Publish Engine (Cloudflare Workers + KV)

**Project:** MDpreview — Thay thế Handoff bằng publish engine tự quản lý  
**Date:** 2026-04-30  
**Status:** Draft  
**Scope:** Backend Worker, Storage, Frontend integration, Migration

---

## 1. Tổng quan kiến trúc

Giải pháp thay thế Handoff.host bằng một stack tự kiểm soát hoàn toàn, tận dụng lại engine render đã có sẵn của MDpreview.

```
MDpreview App (Electron / Web)
         │
         │  POST /publish  { slug, content (md), password?, assets[] }
         ▼
Cloudflare Worker (Edge)
         │
         ├─ Validate slug + password
         ├─ Run renderWithLineNumbers (marked + hljs) — reuse logic từ server/routes/render.js
         ├─ Inject vào HTML shell (CSS, Mermaid, fonts)
         │
         ├─ KV Store ──► { "pub:{slug}:html"   → rendered HTML }
         │                { "pub:{slug}:meta"   → { password_hash, createdAt, updatedAt, filePath } }
         │                { "pub:{slug}:assets" → { "img/foo.png": base64 } }
         │
         └─ Response: { url: "https://pub.yourdomain.com/{slug}" }
```

**Domain layout đề xuất:**
- Worker API: `https://api-pub.yourdomain.com` (hoặc dùng route trên Workers.dev)
- Published pages: `https://pub.yourdomain.com/{slug}`
- Có thể dùng cùng một Worker xử lý cả upload lẫn serve.

---

## 2. Cấu trúc thư mục dự án Worker

```
cf-publish-worker/
├── src/
│   ├── index.js              ← Entry point, router chính
│   ├── renderer.js           ← Port từ server/routes/render.js (marked + hljs)
│   ├── shell.js              ← HTML shell template
│   ├── handlers/
│   │   ├── publish.js        ← POST /publish
│   │   ├── serve.js          ← GET /{slug}
│   │   ├── delete.js         ← DELETE /publish/{slug}
│   │   └── auth.js           ← Password check helper
│   └── utils/
│       ├── hash.js           ← bcrypt-lite / SHA-256 password hash
│       └── slug.js           ← Validate slug format
├── wrangler.toml
└── package.json
```

---

## 3. Chi tiết từng Phase

### Phase 1 — Cloudflare Worker Core

**Mục tiêu:** Worker hoạt động độc lập, nhận upload và serve trang.

#### 3.1 Thiết lập `wrangler.toml`

```toml
name = "mdpreview-publish"
main = "src/index.js"
compatibility_date = "2024-01-01"

[[kv_namespaces]]
binding = "PUB_STORE"
id = "<KV_NAMESPACE_ID>"

[vars]
ADMIN_SECRET = ""   # Đặt qua wrangler secret put ADMIN_SECRET
```

#### 3.2 Router chính (`src/index.js`)

```javascript
import { handlePublish }  from './handlers/publish.js';
import { handleServe }    from './handlers/serve.js';
import { handleDelete }   from './handlers/delete.js';

export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (request.method === 'OPTIONS') return corsHeaders();

    // API Routes
    if (request.method === 'POST' && path === '/publish')
      return handlePublish(request, env);

    if (request.method === 'DELETE' && path.startsWith('/publish/'))
      return handleDelete(request, env, path.split('/')[2]);

    // Serve published page
    if (request.method === 'GET' && path !== '/')
      return handleServe(request, env, path.slice(1));

    return new Response('MDpreview Publish Worker', { status: 200 });
  }
};
```

#### 3.3 Renderer (`src/renderer.js`)

Port trực tiếp logic từ `server/routes/render.js` vào Worker runtime. Lưu ý: Worker edge runtime hỗ trợ đầy đủ `marked` và `highlight.js` — cả hai đều là pure JS, không cần Node.js API.

```javascript
import { marked }   from 'marked';
import hljs         from 'highlight.js';

marked.setOptions({
  highlight(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try { return hljs.highlight(code, { language: lang }).value; }
      catch (_) {}
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-'
});

// Giữ nguyên hàm renderWithLineNumbers từ server/routes/render.js
export function render(content) {
  return marked.parse(content); // simplified — hoặc port đầy đủ renderWithLineNumbers nếu cần line sync
}
```

> **Quyết định:** Phase 1 dùng `marked.parse()` đơn giản. Việc port toàn bộ `renderWithLineNumbers` (kèm `data-line-start`) là optional — chỉ cần thiết nếu muốn publish page hỗ trợ scroll-sync trong tương lai.

#### 3.4 HTML Shell (`src/shell.js`)

Shell phải tái hiện đúng CSS của MDpreview để bản publish trông giống hệt viewer.

```javascript
export function buildShell({ slug, html, title = 'Document' }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <!-- Fonts — giữ nguyên như createStandaloneBundle hiện tại -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300..700&family=Roboto+Mono:wght@400;500&display=swap" rel="stylesheet">
  <!-- MDpreview Design System CSS — host trên Cloudflare R2 hoặc CDN riêng -->
  <link rel="stylesheet" href="https://assets.yourdomain.com/publish/v1/publish.css">
  <!-- Mermaid — cần client-side vì Worker không có DOM -->
  <script src="https://cdn.jsdelivr.net/npm/mermaid@10/dist/mermaid.min.js"></script>
  <script>mermaid.initialize({ startOnLoad: true, theme: 'neutral' });</script>
</head>
<body class="md-publish-body">
  <div class="md-publish-container">
    <div class="md-content">${html}</div>
  </div>
  <script>
    // Syntax highlight fallback nếu hljs chưa chạy server-side
    document.querySelectorAll('pre code').forEach(el => {
      if (window.hljs) hljs.highlightElement(el);
    });
  </script>
</body>
</html>`;
}
```

**`publish.css`** — File này được build từ CSS hiện tại của MDpreview (extract `markdown.css` + `tokens.css` + `hljs theme`), bundle thành 1 file tĩnh, upload lên Cloudflare R2 hoặc bất kỳ CDN nào. Đây là file **versioned** (`v1/publish.css`, `v2/publish.css`...) để kiểm soát breaking change.

#### 3.5 Handler Upload (`src/handlers/publish.js`)

```javascript
import { render }    from '../renderer.js';
import { buildShell } from '../shell.js';
import { hashPassword, checkAdminSecret } from './auth.js';
import { isValidSlug } from '../utils/slug.js';

export async function handlePublish(request, env) {
  // 1. Authenticate — dùng ADMIN_SECRET header từ app
  if (!checkAdminSecret(request, env))
    return json({ error: 'Unauthorized' }, 401);

  const body = await request.json();
  const { slug, content, password, title, filePath } = body;

  // 2. Validate slug
  if (!isValidSlug(slug))
    return json({ error: 'Invalid slug. Only a-z, 0-9, hyphens allowed.' }, 400);

  // 3. Render markdown → HTML
  const renderedHtml = render(content);
  const fullHtml     = buildShell({ slug, html: renderedHtml, title });

  // 4. Hash password nếu có
  const passwordHash = password ? await hashPassword(password) : null;

  // 5. Lưu vào KV
  const meta = {
    slug,
    title,
    filePath,
    passwordHash,
    createdAt: (await env.PUB_STORE.get(`pub:${slug}:meta`))
                 ? JSON.parse(await env.PUB_STORE.get(`pub:${slug}:meta`)).createdAt
                 : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await Promise.all([
    env.PUB_STORE.put(`pub:${slug}:html`, fullHtml),
    env.PUB_STORE.put(`pub:${slug}:meta`, JSON.stringify(meta)),
  ]);

  const publicUrl = `https://pub.yourdomain.com/${slug}`;
  return json({ success: true, url: publicUrl, updatedAt: meta.updatedAt });
}
```

#### 3.6 Handler Serve (`src/handlers/serve.js`)

```javascript
export async function handleServe(request, env, slug) {
  const metaRaw = await env.PUB_STORE.get(`pub:${slug}:meta`);
  if (!metaRaw) return new Response('Not Found', { status: 404 });

  const meta = JSON.parse(metaRaw);

  // Password-protected page
  if (meta.passwordHash) {
    const provided = getPasswordFromRequest(request); // query param hoặc cookie
    if (!provided) return servePasswordPrompt(slug);
    const ok = await verifyPassword(provided, meta.passwordHash);
    if (!ok) return servePasswordPrompt(slug, true); // show error
  }

  const html = await env.PUB_STORE.get(`pub:${slug}:html`);
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=60', // cache 60s ở edge
    }
  });
}
```

> **Password UX:** Trang password prompt là một HTML nhỏ inline trong Worker (không cần request KV) — form POST slug + password dưới dạng query param, Worker verify rồi set cookie session tạm.

---

### Phase 2 — Asset Handling (Ảnh local)

Đây là điểm cải tiến lớn nhất so với Handoff hiện tại — web version hiện tại không upload được ảnh do giới hạn browser.

#### Chiến lược:
- Ảnh nhỏ (< 512KB sau base64): Lưu thẳng vào KV cùng slug, inline vào HTML dưới dạng `data:image/...;base64,...`
- Ảnh lớn (> 512KB): Upload riêng lên **Cloudflare R2**, lưu URL vào meta, thay thế src trong HTML shell.

#### Flow upload ảnh:

```
MDpreview gatherAssets(html)
    │
    ├─ Nhỏ (< 512KB) → base64 → gộp vào payload JSON field "assets"
    │                             Worker inline thẳng vào <img src="data:...">
    │
    └─ Lớn (> 512KB) → Worker nhận binary qua FormData
                        → PUT vào R2: r2.put(`assets/${slug}/${filename}`, blob)
                        → URL: https://assets.yourdomain.com/assets/{slug}/{filename}
```

#### Thay đổi trong `publish.js`:

```javascript
// Sau khi render HTML, replace img src từ relative path → hosted URL
function rewriteAssetUrls(html, assets, slug) {
  return html.replace(/src="([^"]+)"/g, (match, src) => {
    if (src.startsWith('http') || src.startsWith('data:')) return match;
    // Tìm trong assets map
    const asset = assets[src];
    if (asset?.type === 'inline') return `src="${asset.dataUrl}"`;
    if (asset?.type === 'r2') return `src="https://assets.yourdomain.com/assets/${slug}/${asset.filename}"`;
    return match;
  });
}
```

---

### Phase 3 — Thay đổi phía MDpreview App

Đây là phần thay đổi **ít nhất** trong codebase hiện tại, theo nguyên tắc thay đổi một chỗ.

#### 3.1 Thêm config trong SettingsService

```javascript
// Thêm vào SettingsService — các key mới
PUBLISH_WORKER_URL:  'publishWorkerUrl',   // https://api-pub.yourdomain.com
PUBLISH_ADMIN_SECRET: 'publishAdminSecret', // Thay thế handoffToken
```

Giao diện Settings: Thêm một section "Publish Settings" mới, thay thế section "Handoff Token" hiện tại. Các field:
- Worker URL (text input)
- Admin Secret (password input, masked)

#### 3.2 Refactor `publish-service.js`

Thay vì `createStandaloneBundle` (bundle CSS inline vào HTML), service mới chỉ cần gửi raw markdown:

```javascript
// publish-service.js — NEW flow
async publish(slug, password) {
  const content = await this._getRawMarkdown();  // lấy AppState.currentFile raw content
  const assets  = await this.gatherAssets();     // giữ nguyên logic hiện tại
  const title   = this._inferTitle(content);

  const payload = {
    slug,
    content,      // raw markdown — Worker tự render
    password,
    title,
    filePath: AppState.currentFile,
    assets,       // { "relative/path.png": { type: "inline", dataUrl: "..." } }
  };

  const workerUrl = SettingsService.get(SettingsService.PUBLISH_WORKER_URL);
  const secret    = SettingsService.get(SettingsService.PUBLISH_ADMIN_SECRET);

  const response = await fetch(`${workerUrl}/publish`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Secret': secret,
    },
    body: JSON.stringify(payload),
  });

  return response.json(); // { success, url, updatedAt }
}
```

> **Lưu ý:** `gatherAssets()` và logic resolve ảnh local vẫn giữ nguyên. Chỉ thay đổi **destination** — từ FormData upload lên Handoff → JSON payload gửi lên Worker.

#### 3.3 Cập nhật `electron-bridge.js`

Route `publishToHandoff` → `publishToWorker`. Trên Desktop (Electron), không cần proxy qua server nữa vì Worker đã xử lý CORS. Có thể gọi thẳng từ renderer.

```javascript
// electron-bridge.js
window.electronAPI = {
  // ...existing methods...
  publishToWorker: async (payload) => {
    // Electron: gọi thẳng Worker URL (không cần IPC proxy)
    const workerUrl = await ipcRenderer.invoke('get-setting', 'publishWorkerUrl');
    const secret    = await ipcRenderer.invoke('get-setting', 'publishAdminSecret');
    const res = await fetch(`${workerUrl}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
      body: JSON.stringify(payload),
    });
    return res.json();
  }
};
```

**Web version:** Gọi qua server proxy `/api/worker-publish` (tương tự `/api/handoff/publish` hiện tại) để giữ secret phía server, không expose cho client.

#### 3.4 Cập nhật `server/routes/handoff.js` → `worker-publish.js`

```javascript
// server/routes/worker-publish.js
router.post('/worker-publish', async (req, res) => {
  const { payload, workerUrl } = req.body;
  const secret = process.env.PUBLISH_ADMIN_SECRET || req.body.secret;

  const response = await fetch(`${workerUrl}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Admin-Secret': secret },
    body: JSON.stringify(payload),
  });
  const result = await response.json();
  res.json(result);
});
```

#### 3.5 Cập nhật `PublishConfigComponent`

UI thay đổi tối thiểu — giữ nguyên form Slug + Password. Chỉ cần:
- Thay label "Publish to Handoff" → "Publish"
- Xóa dependency vào `handoffToken` — dùng `publishAdminSecret` thay thế
- Thêm link "Manage published pages" → mở một modal danh sách (xem Phase 4)

---

### Phase 4 — Publish Manager (Quản lý trang đã publish)

Tính năng mới không có trong Handoff: xem, cập nhật, xóa các trang đã publish.

#### Worker endpoint bổ sung:

```
GET  /manage               → List tất cả slugs (yêu cầu Admin Secret)
GET  /manage/{slug}        → Metadata của một trang
DELETE /publish/{slug}     → Xóa trang
```

#### KV List pattern:

```javascript
// Lưu index riêng để list nhanh
await env.PUB_STORE.put('index:slugs', JSON.stringify([...existingSlugs, slug]));
```

> **Lưu ý KV limit:** Cloudflare KV `list()` có limit 1000 keys per call — đủ dùng cho hầu hết use case. Nếu vượt quá, dùng cursor pagination.

#### UI trong MDpreview:

Thêm tab "Published" trong `PublishConfigComponent` hoặc một panel riêng trong Settings, hiển thị danh sách:

```
Slug             | Last Updated       | URL                    | Actions
-----------------|--------------------|------------------------|------------------
my-document      | 2026-04-30 06:00   | pub.domain.com/my-doc  | [Open] [Update] [Delete]
project-notes    | 2026-04-29 14:22   | pub.domain.com/proj... | [Open] [Update] [Delete]
```

**"Update"** = Publish lại file hiện tại lên slug đã chọn (không cần nhập lại slug).

---

### Phase 5 — `publish.css` Build Pipeline

CSS bundle cho published pages phải độc lập với app và versioned.

#### Các file cần extract từ MDpreview renderer:

| File nguồn | Nội dung cần giữ |
|---|---|
| `renderer/css/tokens.css` | Tất cả (Design System tokens) |
| `renderer/css/markdown.css` | Tất cả (MD content styles) |
| `renderer/css/hljs-theme.css` | Syntax highlight theme |
| `renderer/css/fonts.css` | Font declarations (hoặc dùng Google Fonts CDN) |

#### Build command (thêm vào `package.json`):

```json
"scripts": {
  "build:publish-css": "cat renderer/css/tokens.css renderer/css/markdown.css renderer/css/hljs-theme.css > cf-publish-worker/public/publish.css && echo Build complete"
}
```

Mỗi khi CSS thay đổi có ảnh hưởng đến published page, chạy lệnh này và upload `publish.css` lên R2/CDN, bump version trong `shell.js`.

---

## 4. Checklist triển khai

### Cloudflare Setup

- [ ] Tạo KV Namespace `MDpreview-PUB-STORE` trên Cloudflare Dashboard
- [ ] `wrangler secret put ADMIN_SECRET` — đặt secret mạnh
- [ ] Deploy Worker: `wrangler deploy`
- [ ] (Optional) Tạo R2 bucket `mdpreview-assets` cho ảnh lớn
- [ ] Bind custom domain `pub.yourdomain.com` → Worker route

### Worker (`cf-publish-worker/`)

- [ ] `src/renderer.js` — port `renderWithLineNumbers` từ `server/routes/render.js`
- [ ] `src/shell.js` — HTML shell với CSS + Mermaid CDN
- [ ] `src/handlers/publish.js` — nhận JSON, render, lưu KV
- [ ] `src/handlers/serve.js` — serve page, xử lý password
- [ ] `src/handlers/delete.js` — xóa slug khỏi KV
- [ ] `src/utils/hash.js` — SHA-256 password hash (Web Crypto API — available trong Worker)
- [ ] `src/utils/slug.js` — validate `/^[a-z0-9][a-z0-9-]{0,62}[a-z0-9]$/`
- [ ] Test với Wrangler local dev: `wrangler dev`

### MDpreview App

- [ ] `renderer/css/` — build `publish.css`, upload lên CDN, update URL trong `shell.js`
- [ ] `SettingsService` — thêm `publishWorkerUrl`, `publishAdminSecret`
- [ ] `publish-service.js` — refactor để gửi raw markdown thay vì bundle HTML
- [ ] `electron-bridge.js` — thêm `publishToWorker`, giữ `publishToHandoff` với deprecation notice
- [ ] `server/routes/` — thêm `worker-publish.js` route cho web proxy
- [ ] `server/index.js` — mount route mới
- [ ] `PublishConfigComponent` — cập nhật UI, xóa Handoff token dependency
- [ ] `HandoffTokenForm` — đổi thành `PublishSettingsForm` (Worker URL + Admin Secret)
- [ ] Cập nhật `docsfunction-docsPUBLISHHANDOFF.md` thành `PUBLISH.md`

---

## 5. Migration từ Handoff

Không cần breaking change. Chiến lược:

1. **Song song:** Giữ nguyên Handoff flow trong `electron-bridge.js`. Thêm Worker flow mới. `PublishConfigComponent` detect xem user đang dùng loại nào dựa trên settings (`handoffToken` vs `publishAdminSecret`).
2. **Deprecation notice:** Nếu detect `handoffToken` còn tồn tại, hiển thị banner "Upgrade to self-hosted publish" trong Settings.
3. **Remove:** Sau khi confirm ổn định, xóa `handoff.js` route và `HandoffTokenForm`.

---

## 6. So sánh trước/sau

| Tiêu chí | Handoff (hiện tại) | Worker + KV (mới) |
|---|---|---|
| Kiểm soát infrastructure | ❌ Bên thứ 3 | ✅ Hoàn toàn tự quản lý |
| Upload ảnh local (web) | ❌ Bị block bởi browser | ✅ Qua server proxy → Worker |
| Render fidelity | ⚠️ Bundle CSS inline (drift theo thời gian) | ✅ Versioned `publish.css` từ source |
| Mermaid diagrams | ⚠️ Pre-rendered trong bundle | ✅ Mermaid CDN client-side (đúng hơn) |
| Versioning / history | ❌ Không | ✅ `updatedAt` trong meta, có thể mở rộng |
| Quản lý published pages | ❌ Không | ✅ List / Update / Delete qua Manager UI |
| Password protection | ✅ Có (qua Handoff) | ✅ Tự implement, kiểm soát hoàn toàn |
| Chi phí | Phụ thuộc Handoff pricing | ✅ CF KV Free: 100K reads/day, 1K writes/day |
| Latency | Server Handoff | ✅ Cloudflare Edge (< 50ms toàn cầu) |
| Offline fallback | ❌ | ⚠️ Cần internet để serve (có thể cache PWA sau) |

---

## 7. Rủi ro và cách xử lý

| Rủi ro | Mức độ | Xử lý |
|---|---|---|
| KV size limit 25MB/value | Thấp (MD files nhỏ) | Nếu HTML > 1MB → split assets sang R2 |
| Mermaid không render SSR | Trung bình | Chấp nhận client-side render qua CDN, đủ cho publish |
| Worker cold start latency | Thấp | Cloudflare Workers không có cold start thực sự |
| `marked` version drift giữa app và Worker | Trung bình | Pin cùng version trong `package.json` của cả hai, dùng shared renderer package nếu cần |
| KV eventually consistent | Thấp | Sau publish, show URL ngay — page sẵn sàng trong < 1s |
| Admin Secret bị lộ (web client) | Trung bình | Web version luôn proxy qua server, **không bao giờ** expose secret ra browser |

---

*Document — 2026-04-30*

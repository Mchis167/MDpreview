# Publishing Worker (`cf-publish-worker/`)

> Công cụ xuất bản tài liệu Markdown lên Edge (Cloudflare Workers) với hiệu ứng thị giác Premium.

---

## Kiến trúc Runtime

Worker hoạt động dựa trên 3 thành phần chính:
1. **Asset Router (`index.js`)**: 
    - Ưu tiên phục vụ các tài nguyên tĩnh từ thư mục `./public` (ví dụ: `publish.css`).
    - Các yêu cầu không phải asset sẽ được chuyển hướng sang trình xử lý `serve.js` để lấy nội dung Markdown từ KV.
2. **Renderer (`renderer.js`)**: 
    - Sử dụng `marked` kết hợp với `highlight.js` và `mermaid`.
    - **Fidelity Lock**: Tái tạo chính xác cấu trúc DOM nguyên tử (`.md-block > .md-line`) để đảm bảo style tương thích 100% với App.
3. **Shell Generator (`shell.js`)**: 
    - Tạo khung HTML hoàn chỉnh bao gồm các thẻ Meta, Font (Inter, Roboto Mono) và các thư viện cần thiết (Mermaid).

---

## Asset Serving Logic

Mọi tài nguyên tĩnh trong `/public` đều được ánh xạ thông qua binding `ASSETS`:

```javascript
// index.js priority logic
const asset = await env.ASSETS.fetch(request);
if (asset.status !== 404) return asset;

// Fallback to document serving
return handleServe(request, env);
```

---

## Visual Parity Standards

Để đạt được hiệu ứng Premium, Worker phải tuân thủ:

### 1. CSS Design Tokens (Auto-Generated)
File `public/publish.css` được **auto-generated** từ hai nguồn:
- **`renderer/css/design-system/tokens.css`** — Tất cả 173 design tokens từ App (colors, spacing, radius, typography, shadows, transitions)
- **`cf-publish-worker/src/publish-styles.css`** — Publish-specific styles (layout, code blocks, tables)

Build pipeline: `npm run build:publish-css` → `publish.css` (21 kB, AUTO-GENERATED)

**Tokens bao gồm:**
- `--ds-bg-main`: auto-aliased từ `--ds-bg-base` (App background)
- `--ds-accent`: `#ffbf48` (Brand orange, hoặc được override)
- Hệ thống màu `white-alpha` cho viền và nền mờ
- Toàn bộ 3-tier token system (Primitives, Alpha, Semantic)

**Cách thay đổi:**
1. Edit `tokens.css` hoặc `publish-styles.css`
2. Run: `npm run build:publish-css`
3. publish.css tự động sync → không cần hand-edit

### 2. Glassmorphism Blocks
Mọi block đặc biệt phải có:
```css
background: transparent !important;
backdrop-filter: blur(40px);
border: 1px solid var(--ds-white-a08);
```

### 3. Mermaid Optimization
Worker tự động override các style mặc định của Mermaid để đảm bảo chữ luôn trắng và các đường nối mờ ảo, đồng bộ với dark theme.

---

## CSS Build Pipeline

Worker phục vụ `public/publish.css` như một asset tĩnh. Để giữ CSS luôn sync với App tokens:

```bash
# Sau khi sửa tokens.css hoặc publish-styles.css
npm run build:publish-css

# Hoặc: tự động khi build app
npm run build  # Chạy build:publish-css trước electron-builder
```

**Quy tắc:**
- ✅ Edit `renderer/css/design-system/tokens.css` khi thay đổi tokens dùng chung
- ✅ Edit `cf-publish-worker/src/publish-styles.css` khi thay đổi giao diện publish-page
- ❌ KHÔNG edit `public/publish.css` trực tiếp (auto-generated, AUTO-GENERATED header)

**Chi tiết:** Xem [`docs/css-pipeline.md`](../../css-pipeline.md) hoặc [`docs/phase-1-2-completion.md`](../../phase-1-2-completion.md)

---

## Deployment

**Local testing:**
```bash
# Regenerate CSS từ tokens mới nhất
npm run build:publish-css

# Test locally
npm run serve
```

**Cloudflare Worker deployment:**
```bash
# Đảm bảo CSS up-to-date
npm run build:publish-css

# Deploy
cd cf-publish-worker
npm run deploy
# hoặc
wrangler deploy
```

---

*Document — 2026-05-01 (Updated for CSS Build Pipeline)*

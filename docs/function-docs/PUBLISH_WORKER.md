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

### 1. CSS Design Tokens
File `public/publish.css` chứa bản sao chính xác các tokens từ App:
- `--ds-bg-main`: `#131313`
- `--ds-accent`: `#ffbf48`
- Hệ thống màu `white-alpha` cho viền và nền mờ.

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

## Deployment

Sử dụng Wrangler để triển khai:
```bash
cd cf-publish-worker
npm run deploy
```

---

*Document — 2026-05-01*

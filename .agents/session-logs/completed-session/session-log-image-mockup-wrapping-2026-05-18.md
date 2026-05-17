# [Image Mockup Wrapping] Session Log — 2026-05-18

## 🔗 Liên kết
- **Log trước**: [session-log-image-mockup-wrapping-2026-05-17.md](session-log-image-mockup-wrapping-2026-05-17.md)
- **Log kế tiếp**: Chưa có

---

## 📝 Tổng quan

**Phase 6**: Bring carousel + mockup lên published site (Cloudflare Worker).

Các file liên quan:
- `cf-publish-worker/src/shell.js` — HTML template của published page
- `scripts/build-publish-assets.js` — Build script sync JS/CSS vào worker public/
- `renderer/js/services/publishing/worker-publish-adapter.js` — Asset gathering + URL replacement
- `renderer/js/workers/image-encoder.worker.js` + `.bundle.js` — WASM image encoder worker
- `renderer/js/utils/image-processor-util.js` — Image compression pipeline

---

## ✅ Đã hoàn thành

### [10:00] Phase 6 — Publish pipeline integration

#### 6.1 Bundle CSS + JS vào published page
- **`scripts/build-publish-assets.js`**: Thêm `mockup-frames.css`, `carousel.css` vào CSS bundle; thêm `design-system.js`, `design-system-icons.js`, `mockup-images.js`, `carousel.js` vào JS sync list
- **`cf-publish-worker/src/shell.js`**: Thêm 5 `<script>` tags theo đúng dependency order; thêm `MockupImageModule.process()` và `CarouselModule.process()` vào init script

#### 6.2 Fix PNG decoder crash trong image encoder worker
- **Bug**: Khi PNG nhỏ (không cần resize), `_encodeViaWorkerFromBlob` gửi `rawInput: true, rawMime: 'image/png'`. Worker's `_decodeRaw()` chỉ handle `webp`/`jpeg` → throw **trước** `try` block → uncaught promise reject.
- **Fix A** (`image-processor-util.js`): Với PNG, skip `rawInput` path, gửi thẳng `pngBuffer` cho oxipng
- **Fix B** (`image-encoder.worker.js` + `.bundle.js`): Move `_decodeRaw` call vào bên trong `try` block → errors được catch và report về main thread

#### 6.3 Fix `DesignSystem is not defined` trên published page
- **Bug**: `design-system-icons.js` gọi `DesignSystem.registerIcons()` — cần `design-system.js` load trước. Shell chỉ có icons, không có core.
- **Fix**: Thêm `design-system.js` vào JS sync list và `<script>` tag **trước** `design-system-icons.js`

#### 6.4 Fix mockup frames không wrap trên published page (root cause)
- **Bug**: Published HTML dùng `viewer.state.html` (raw markdown HTML, không có frames). Frames được wrap client-side bởi `MockupImageModule.process()`. Nhưng trong asset URL replacement, hash fragment bị mất:
  - `originalSrc = "assets/img.png#phone"` → CDN URL = `"https://cdn.../img-abc.webp"` (no hash)
  - `MockupImageModule._extractMockupMeta(src)` → `src.indexOf('#') === -1` → skip → không wrap
- **Fix** (`worker-publish-adapter.js`): Sau khi lookup CDN URL, extract hash từ originalSrc và append lại:
  ```js
  const hashIdx = src.indexOf('#');
  const hash = hashIdx !== -1 ? src.slice(hashIdx) : '';
  img.setAttribute('src', assetMapping[src] + hash);
  ```

---

## ⚠️ Quyết định quan trọng

### 26. Published HTML dùng state.html (raw), không phải DOM innerHTML
- **Quyết định**: `PublishService` capture từ `viewer.state.html` — raw HTML từ markdown renderer, chưa qua MockupImageModule/CarouselModule processing
- **Tại sao quan trọng**: Mọi post-processing (wrap frames, carousel init) phải chạy lại trên published page client-side. Không có gì được "baked in" từ live preview DOM.
- **How to apply**: Khi thêm feature mới có client-side DOM mutation → phải thêm init call vào `shell.js` inline script

### 27. Hash fragment làm carrier cho mockup type — phải preserve qua asset pipeline
- **Quyết định**: `#phone`, `#browser`, `#browser:scroll` trong image src là data, không phải navigation anchor → phải preserve khi replace CDN URL
- **Tại sao quan trọng**: `fetch()` và browser đều ignore hash khi request → file tải đúng, nhưng nếu hash bị strip khỏi HTML src → type info mất → MockupImageModule không nhận ra
- **How to apply**: Bất kỳ URL replacement nào trong publish pipeline cần check và re-append hash fragment

### 28. Script load order trong shell.js — dependency chain phải đúng thứ tự
- **Thứ tự bắt buộc**: `design-system.js` → `design-system-icons.js` → `mockup-images.js` → `carousel.js`
- **Lý do**: `design-system-icons.js` gọi `DesignSystem.registerIcons()` (cần core); `carousel.js` gọi `DesignSystem.getIcon()` (cần icons đã register)
- **How to apply**: Khi thêm script mới vào shell.js, luôn map dependency chain trước

#### 6.5 Fix MockupImageModule không được gọi trên published page
- **Bug**: `shell.js` init script chỉ gọi `CarouselModule.process()`, không gọi `MockupImageModule.process()`. Published HTML có raw `<img src="...#phone">` (chưa wrap) nhưng không có code nào trigger wrapping.
- **Fix** (`shell.js`): Thêm `MockupImageModule.process(_mdContent)` trước `CarouselModule.process()` — thứ tự bắt buộc vì carousel type-detection đọc `.mockup-phone-frame` class.

#### 6.6 Debug log tạm thời để xác nhận 404 + hash hypothesis
- Thêm `console.warn` tại 2 điểm: cache hit path và img replacement path
- Sau khi user confirm bug đã fix, debug logs được xóa sạch
- **Kết quả**: Bug đã được fix (user confirm) — root cause xác nhận là stale cache + missing hash

---

## ⚠️ Quyết định quan trọng

### 29. MockupImageModule.process() phải chạy trước CarouselModule.process() trên published page
- **Quyết định**: Trong shell.js init script, thứ tự là: MockupImageModule → CarouselModule
- **Lý do**: `CarouselModule._detectType()` đọc `.mockup-phone-frame` / `.mockup-browser-frame` trong slide đầu tiên. Nếu frames chưa được wrap → detect sai → carousel treat tất cả là `'default'` type

### 30. Cache hit với stale R2 URL → 404 — không tự heal
- **Vấn đề**: `PublishImageCache` dùng `SHA-256(blob)` làm key, cached value là `r2Url`. Khi R2 bị clear hoặc environment reset, cached URL trở thành dead link. Cache hit → skip upload → published page 404.
- **How to apply**: Nếu gặp 404 assets trên published page sau khi publish, xóa `{workspace}/.mdpreview/publish-cache.json` rồi publish lại. Xem xét thêm HEAD validation trong tương lai.

---

## 🐛 Vấn đề đã gặp

- **Lint warning về `/* global */` comment trong worker**: Worker source file dùng `import` statements (ES module) — ESLint config nhận diện đúng, 0 violations
- **`inputImageData` là const**: Khi move `_decodeRaw` vào try block, không thể reassign `inputImageData` (destructured const). Fix: dùng `let imageData = inputImageData` rồi reassign `imageData`
- **404 assets trên published page**: Stale `publish-cache.json` trỏ tới R2 objects không còn tồn tại. Fix tức thời: xóa cache file → publish lại.

---

#### 6.7 Fix mirror desync: ProjectMap + TabPreview không render mockup frames/carousel

- **Bug**: `project-map.js` và `tab-preview.js` đều render raw HTML từ `/api/render-raw`. Raw HTML có `<img src="...#phone">` nhưng post-processing pipeline của cả 2 không gọi `MockupImageModule.process()` hay `CarouselModule.process()` → mirror hiển thị `<img>` trần, sai height → scroll indicator lệch.
- **Analogy**: `<details>` được sync bởi ProjectMap (lines 384–392 + toggle event listener) — mockup/carousel cần tương tự nhưng là one-time transform, không cần live sync.
- **Fix** (`project-map.js` line 407–410): Thêm `MockupImageModule.process(innerEl)` + `CarouselModule.process(innerEl)` trước `CodeBlockModule.process()` trong post-processing `requestAnimationFrame` block.
- **Fix** (`tab-preview.js` line 139–140): Thêm 2 dòng tương tự sau `CodeBlockModule.process()` trong `_showPreview()`.
- **Thứ tự**: MockupImage → Carousel → CodeBlock (bắt buộc, quyết định #29).
- **ResizeObserver**: Đã có sẵn trong ProjectMap → tự recalculate height khi img.onload async fires.

---

## ⚠️ Quyết định quan trọng

### 31. Mirror post-processing pipeline phải mirror live preview pipeline
- **Quyết định**: Mọi client-side DOM transform trong live preview (`MockupImageModule`, `CarouselModule`) phải được replicate trong tất cả mirror contexts: `project-map.js`, `tab-preview.js`, và `shell.js` (published page).
- **Lý do**: Tất cả mirror contexts nhận raw HTML từ `/api/render-raw` — không có wrapper nào. Nếu live preview thêm feature mới qua client-side mutation → phải thêm init call vào cả 3 nơi.
- **How to apply**: Checklist khi thêm client-side post-processor mới: (1) `markdown-viewer-component.js` render/update path, (2) `project-map.js` post-processing RAF block, (3) `tab-preview.js` `_showPreview()`, (4) `shell.js` inline init script.

---

## 🔄 Trạng thái hiện tại

✅ TASK HOÀN THÀNH — 2026-05-18

**Last Updated**: 2026-05-18

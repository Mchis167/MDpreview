# Content Padding & Width Token Synchronization

**Date:** 2026-05-02  
**Status:** accepted  
**Author:** session 2026-05-02  

---

## Bối cảnh

Sau khi triển khai Project Map mirror dùng SSR + scaled transform, phát hiện ra rằng padding không nhất quán giữa main viewer, editor, và project map khiến:
1. Viewport indicator position không đúng (misaligned)
2. Text content trong map render rộng hơn main viewer → viewport indicator không biểu diễn chính xác vị trí scroll
3. Khó maintain khi muốn thay đổi padding toàn cục

### Vấn đề cụ thể:
- Main viewer: `.md-content-inner` có `padding: 80px 80px` (từ CSS gốc)
- Mirror: `.md-content-inner` có `padding: 120px 0 !important` (hardcoded, sai!)
- Result: Mirror text area = `internalWidth`, Main text area = `internalWidth - 160px` → mismatch 160px

---

## Các lựa chọn đã cân nhắc

### Option 1: Hardcoded CSS per component
- **Ưu:** Nhanh để implement.
- **Nhược:** Khó maintain, dễ bị inconsistent khi thay đổi padding/width.

### Option 2: Centralized CSS tokens (Chosen)
- **Ưu:** Single source of truth, dễ maintain, automatic sync giữa tất cả views.
- **Nhược:** Cần update token definitions.

---

## Quyết định

**Chọn: Option 2 — Centralized CSS Tokens**

Tạo 3 core layout tokens trong `tokens.css`:
```css
--ds-content-padding-x: 80px;
--ds-content-padding-y: 80px;
--ds-content-width: 800px;
```

Update tất cả views dùng tokens này:
- **markdown-viewer.css**: `.md-content-inner` → `padding: var(--ds-content-padding-y) var(--ds-content-padding-x)`
- **editor.css**: `#edit-textarea` → `padding: var(--ds-content-padding-y) var(--ds-content-padding-x)`
- **project-map.css**: Mirror → `padding: var(--ds-content-padding-y) var(--ds-content-padding-x)` (removed hardcoded `120px 0`)
- **project-map.js**: Dynamic width measurement từ main viewer, sync qua CSS variable `--_mirror-width`

---

## Hệ quả

**Tích cực:**
- ✅ Content padding nhất quán toàn bộ app
- ✅ Viewport indicator position = `scrollTop * scale` → **chính xác 100%**
- ✅ Text area = `internalWidth - 160px` trong cả main và mirror
- ✅ Dễ maintain: chỉ thay đổi token, tất cả views tự động sync
- ✅ Responsive: Mirror automatically detect main viewer width changes via ResizeObserver

**Tiêu cực / Trade-off:**
- Cần update CSS thay vì chỉ update JavaScript

**Constraint tương lai:**
- Mọi thay đổi padding hoặc content width phải:
  1. Update tokens trong `tokens.css`
  2. Update HTML structure nếu cần (nếu padding không phù hợp với visual design)
  3. **KHÔNG** hardcode padding trong component CSS
- Mirror padding PHẢI khớp main viewer padding (dùng cùng token)
- Scale calculation formula: `baseScale = (panelWidth - 24) / internalWidth` (where internalWidth includes padding)

---

## Liên quan

- [20260428-project-map-mirror-fidelity.md](20260428-project-map-mirror-fidelity.md) — SSR mirror strategy
- [20260428-project-map-scroll-stabilization.md](20260428-project-map-scroll-stabilization.md) — Scroll position sync
- [20260428-project-map-zoom-interaction-strategy.md](20260428-project-map-zoom-interaction-strategy.md) — Zoom logic

---

## Implementation Details

### CSS Variable Setup

**tokens.css (Tier 3 — Semantic):**
```css
/* ── Layout & Sizing ────────────────────────────────────── */
--ds-content-padding-x: 80px;
--ds-content-padding-y: 80px;
--ds-content-width: 800px;
```

### View-specific Updates

**Main Viewer (markdown-viewer.css):**
```css
.md-content-inner {
  padding: var(--ds-content-padding-y) var(--ds-content-padding-x);
  max-width: calc(var(--ds-content-width) + (var(--ds-content-padding-x) * 2));
  margin: 0 auto;
}
```

**Editor (editor.css):**
```css
#edit-textarea {
  padding: var(--ds-content-padding-y) var(--ds-content-padding-x);
  max-width: calc(var(--ds-content-width) + (var(--ds-content-padding-x) * 2));
  margin: 0 auto;
}
```

**Mirror (project-map.css):**
```css
.ds-project-map__mirror .md-content-inner {
  padding: var(--ds-content-padding-y) var(--ds-content-padding-x) !important;
  max-width: var(--_mirror-width, var(--ds-content-width)) !important;
  margin: 0 !important;
}
```

**Mirror Width Sync (project-map.js):**
```javascript
// Measure actual content width from main viewer
let internalWidth = CONFIG.baseWidth;
if (_mainViewer) {
  const mainContent = _mainViewer.querySelector(SELECTORS.content);
  if (mainContent) {
    internalWidth = mainContent.offsetWidth || CONFIG.baseWidth;
  }
}
// Sync to CSS variable for mirror width
mirror.style.setProperty('--_mirror-width', `${internalWidth}px`);

// Add ResizeObserver to detect main content width changes
const mainContent = _mainViewer.querySelector(SELECTORS.content);
if (mainContent) {
  _mainContentWidthObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => _applyZoom(mapEl));
  });
  _mainContentWidthObserver.observe(mainContent);
}
```

---

## Testing Checklist

- [ ] Main viewer and editor have identical padding
- [ ] Project map mirror renders text with same width as main viewer
- [ ] Viewport indicator position matches scroll position (visual check)
- [ ] Resize main viewer → project map scale adjusts automatically
- [ ] Edit mode maintains same padding as preview mode

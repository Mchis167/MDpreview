# [Image Mockup Wrapping] Session Log — 2026-05-17

## 🔗 Liên kết
- **Log trước**: Không có (task mới)
- **Log kế tiếp**: [session-log-image-mockup-wrapping-2026-05-18.md](session-log-image-mockup-wrapping-2026-05-18.md)

---

## 📝 Tổng quan

**Mục tiêu**: Triển khai tính năng Image Mockup Wrapping — wrap ảnh trong các UI frame (browser, phone) dựa trên URL hash fragment.

**Phạm vi đã làm**:
- Phase 1: Hash-based wrapper (`#browser`, `#phone`) — client-only post-processing
- Phase 2: Hash palette trigger trong Monaco (gõ `#` → palette gợi ý `#browser`, `#phone`)
- Phase 3: Scroll modifier, Monaco IntelliSense, drag-to-scroll, tap-to-zoom, disable native drag

**Ngoài phạm vi (Phase 1)**: Fenced blocks (`:::carousel`), server-side preprocessing

---

## ✅ Đã hoàn thành

### Phase 1 — Core Implementation (16:10)
Tạo 4 files:

| File | Hành động | Nội dung |
|------|-----------|---------|
| `renderer/js/utils/mockup-images.js` | CREATE | MockupImageModule IIFE — `process()`, `_buildBrowserFrame()`, `_buildPhoneFrame()`, `_extractMockupMeta()` |
| `renderer/css/design-system/molecules/mockup-frames.css` | CREATE | Style browser frame + phone frame dùng DS tokens |
| `renderer/js/components/organisms/markdown-viewer-component.js` | MODIFY | Thêm `MockupImageModule.process(inner)` vào `render()` và `update()` |
| `renderer/index.html` | MODIFY | Thêm `<script>` + `<link>` cho mockup-images.js và mockup-frames.css |

**Syntax**: `![Alt](image.png#browser)` / `![Alt](image.png#phone)`

---

### Phase 2 — Hash Palette Trigger (17:00)
Palette gợi ý mockup type khi gõ `#` bên trong `![...](path#`.

| File | Hành động | Nội dung |
|------|-----------|---------|
| `renderer/js/components/molecules/quick-command-palette.js` | MODIFY | Inject `options.commands`, thêm `_activeCommands` state, `show()` nhận commands từ ngoài |
| `renderer/js/modules/editor.js` | MODIFY | `_isHashMode` + `_hashStartPos` state; `MOCKUP_HASH_COMMANDS`; hash detection trong `_handleContentChange()`; key handling trong `_handleKeyDown()`; `_applyHashCommand()`; `_showHashPalette()` với `hideInput: true` |

**UX**: Palette không có input box — user tiếp tục gõ trong Monaco, palette filter realtime qua `updateQuery(textAfterHash)`.

---

### Phase 3 — Scroll Modifier + IntelliSense + Interactions (18:10)

#### 3.1 Scroll modifier
**Syntax**: `#browser:scroll` / `#phone:scroll`

| File | Thay đổi |
|------|---------|
| `mockup-images.js` | `_extractMockupMeta` trả `{ type, modifiers: Set }` thay vì chỉ `type`; builders nhận `modifiers`, thêm `is-scrollable` class; bỏ JS height calc khi scroll mode |
| `mockup-frames.css` | Thêm `.is-scrollable` với `aspect-ratio: 16/10` (browser) và `393/852` (phone — iPhone 16 logical res); thêm `.is-dragging` cursor |

#### 3.2 Monaco IntelliSense cho `:` modifier
**Trigger**: Gõ `:` sau `#browser` hoặc `#phone` → gợi ý `scroll`

| File | Thay đổi |
|------|---------|
| `monaco-service.js` | Thêm `_registerLanguageProviders()` gọi một lần trong `init()`; `registerCompletionItemProvider` trigger `:`, regex `/(#browser\|#phone):$/`; bật `suggestOnTriggerCharacters: true`; đổi `fixedOverflowWidgets: false` |
| `monaco-editor.css` | Tách `.suggest-widget` khỏi block CSS chung với `.hover-widget` (để Monaco dùng style gốc) |

#### 3.3 Disable native drag preview
| File | Thay đổi |
|------|---------|
| `mockup-images.js` | `_disableNativeDrag(imgEl)` — set `draggable=false` + `preventDefault` trên `dragstart`; gọi trên mọi mockup image |
| `zoom.js` | Thêm `img.draggable = false` + `dragstart` preventDefault khi mở image trong zoom overlay |

#### 3.4 Drag-to-scroll + tap-to-zoom (scroll mockup)
| File | Thay đổi |
|------|---------|
| `mockup-images.js` | `_enableDragToScroll(imgEl, scrollEl)` — threshold 5px để phân biệt click vs drag; mouseup không di chuyển → gọi `ZoomSystem.open(src, 'image')` |

---

## ⚠️ Quyết định quan trọng

### 1. Hash parsing — từ DOM `src` attribute
- **Quyết định**: Extract hash từ `src` trên DOM, không từ server
- **Lý do**: Browser tự strip URL hash cho `<img src>`, cần capture sau innerHTML

### 2. CSS tokens — không hardcode
- **Quyết định**: Dùng `--ds-*` tokens cho tất cả colors/spacing/radius/shadow
- **Lý do**: Consistency với Design System V2, tự động hỗ trợ dark/light mode

### 3. Frame sizing — dynamic height từ `naturalWidth/naturalHeight`
- **Quyết định**: Listen `img.onload` → tính height = `(naturalH / naturalW) * containerW`
- **Lý do**: Ảnh tỷ lệ đa dạng, frame phải adapt — không dùng fixed aspect-ratio cho non-scroll

### 4. Scroll frame sizing — aspect-ratio CSS (không JS)
- **Quyết định**: `aspect-ratio: 16/10` (browser) và `393/852` (phone)
- **Lý do**: Responsive tự động theo width, không cần magic pixels; JS height calc bị skip hoàn toàn ở scroll mode

### 5. Palette inject strategy — `options.commands`
- **Quyết định**: Inject `options.commands` vào `show()`, không tách factory/package
- **Lý do**: 2 use cases chưa đủ để justify refactor; minimal invasive, backward compatible
- **Khi nào refactor**: Khi có trigger thứ 3 (e.g., `@mention`, `::snippet`)

### 6. Hash palette UX — `hideInput: true`
- **Quyết định**: Palette không có input box, user gõ trực tiếp trong Monaco
- **Lý do**: Giữ nguyên typing flow, không force user chuyển focus sang palette input

### 7. Hash detection context guard
- **Quyết định**: Chỉ trigger khi `#` nằm trong `![...](path#` — regex `/!\[[^\]]*\]\([^)]*$/`
- **Lý do**: Tránh conflict với heading `# Title` và anchor link `[text](#id)`

### 8. Monaco completion — one-time registration
- **Quyết định**: `_registerLanguageProviders()` gọi trong `init()`, KHÔNG trong `mount()`
- **Lý do**: `registerCompletionItemProvider` là global language-level — gọi trong `mount()` sẽ stack providers mỗi lần remount → widget position sai

### 9. `fixedOverflowWidgets: false`
- **Quyết định**: Đổi từ `true` → `false`
- **Lý do**: `backdrop-filter` trên `.hover-widget` tạo stacking context mới → `position: fixed` tính sai gốc tọa độ → widget hiện xa cursor

### 10. Click vs drag — 5px threshold
- **Quyết định**: `Math.abs(deltaY) < 5px` on mouseup = click = zoom; `>= 5px` = drag = scroll
- **Lý do**: Không conflict — quyết định tại `mouseup` dựa trên actual movement, không phải intent

---

## 🐛 Vấn đề đã gặp

### BUG: DOM swap logic sai — img không được wrap
- **Triệu chứng**: Ảnh có `#browser` vẫn render là `<img>` bình thường
- **Root cause**: Builder dùng `content.appendChild(imgEl)` move imgEl vào frame → `imgEl.replaceWith(wrapper)` replace sai vị trí (bên trong wrapper, không phải vị trí gốc)
- **Fix**: Lưu `parent = imgEl.parentNode` và `nextSibling = imgEl.nextSibling` TRƯỚC khi gọi builder → dùng `parent.insertBefore(wrapper, nextSibling)`

### BUG: `update()` path thiếu MockupImageModule call
- **Triệu chứng**: Mockup không hoạt động khi content reload (Draft live preview)
- **Fix**: Thêm `MockupImageModule.process(inner)` vào `MarkdownPreview.update()`

### BUG: Monaco completion widget hiện xa cursor
- **Triệu chứng**: Widget xuất hiện ở góc màn hình thay vì dưới cursor
- **Root cause 1**: Provider đăng ký trong `mount()` → stack providers khi remount
- **Root cause 2**: `fixedOverflowWidgets: true` + `backdrop-filter` → stacking context sai
- **Fix**: Chuyển provider ra `_registerLanguageProviders()` trong `init()`; đổi `fixedOverflowWidgets: false`

### BUG: Monaco suggest widget UI trông lạ
- **Triệu chứng**: Widget có backdrop-filter, border-radius không phù hợp với Monaco internal layout
- **Root cause**: `.suggest-widget` bị include vào block CSS chung với `.hover-widget`
- **Fix**: Tách `.suggest-widget` ra khỏi block, để Monaco render bằng theme `mdpreview-dark` gốc

### BUG: Completion không trigger
- **Root cause**: `suggestOnTriggerCharacters: false` được set explicit trong editor options
- **Fix**: Đổi thành `true`

---

## 🔄 Trạng thái hiện tại

**Phase 1 + 2 + 3 DONE ✅** — end-to-end working, lint 0 errors 0 warnings

---

## 🗂️ Phase 4 — Carousel Block (thiết kế xong, chưa implement)

### Đã chốt trong phiên thảo luận /discuss

**Syntax**:
```markdown
:::carousel
![Màn hình chính](screen1.png#browser)
![Đăng nhập](screen2.png#phone:scroll)
:::
```
Mỗi dòng `![alt](src)` = một slide. Kết hợp tự nhiên với mockup hash.

**UX**: Chỉ arrow trái/phải (`ds-icon-action-btn is-large` + icon `chevron-left/right`). Không dots, không auto-play. Tap ảnh → ZoomSystem. Keyboard `←/→` khi focus carousel.

**Cursor sync**: Slide-level — mỗi `.md-carousel-slide` có `data-line` + `data-src-start` riêng trỏ về đúng dòng `![](img)` trong source. Click slide 2 → cursor nhảy về dòng img2.

---

## ⚠️ Quyết định quan trọng (Phase 4)

### 11. Carousel xử lý trong `renderTokens()`, không phải extension renderer
- **Quyết định**: Dùng `marked.use({ extensions: [{ tokenizer }] })` để marked nhận ra `:::carousel` token, **nhưng KHÔNG dùng extension renderer**. Thay vào đó xử lý `token.type === 'carousel'` bên trong `renderTokens()` như mermaid/code.
- **Lý do**: Extension renderer của marked không có access vào `tokenStartLine` / `tokenStartOffset` — không thể inject `data-line`/`data-src-start`. Chỉ `renderTokens()` mới có các giá trị này.
- **Pattern tham chiếu**: Giống mermaid — `renderer.code` chỉ được dùng nếu không cần line metadata. Carousel cần metadata → phải handle trong `renderTokens()`.

### 12. Per-slide offset tính từ `token.raw`
- **Quyết định**: Parse từng dòng trong `token.raw` để tính `charOffset` lũy tiến cho từng slide
- **Cách tính**:
  ```
  charOffset = tokenStartOffset + length(':::carousel\n')
  cho mỗi dòng content:
    slideStart = charOffset
    slideEnd   = charOffset + line.length
    slideLineNum = tokenStartLine + lineIndex + 1
    charOffset += line.length + 1  // +1 cho \n
  ```
- **Kết quả**: Mỗi slide có `data-line`, `data-src-start`, `data-src-end` chính xác → SyncService hoạt động không cần sửa.

### 13. MockupImageModule chạy TRƯỚC CarouselModule
- **Quyết định**: Thứ tự trong post-processing pipeline: `CodeBlock → MockupImage → Carousel`
- **Lý do**: Carousel cần đọc `.md-carousel-slide` children để gắn arrow và activate JS. Nếu chạy trước MockupImage, `<img>` chưa được wrap → CarouselModule gắn arrow đúng nhưng click handler trên img có thể bị ảnh hưởng sau khi MockupImage move img vào frame.
- **Lưu ý**: SyncService vẫn hoạt động đúng sau khi MockupImage move img, vì walk-up từ img → mockup-frame → `.md-carousel-slide[data-src-start]` không bị chặn.

### 14. Arrow button không trigger sync
- **Quyết định**: Arrow button phải `stopPropagation()` trên click event để không bubble lên carousel và trigger sync khi user chỉ muốn navigate
- **Lý do**: Click arrow → không phải intent "edit slide này", chỉ là navigate

---

## 📋 Files cần thay đổi (Phase 4)

| File | Hành động | Chi tiết |
|------|-----------|---------|
| `server/routes/render.js` | MODIFY | Thêm extension tokenizer cho `:::carousel`; thêm case `token.type === 'carousel'` trong `renderTokens()` với per-slide metadata |
| `renderer/js/utils/carousel.js` | CREATE | `CarouselModule` IIFE — `process(container)`, `_activate(el)`: arrows, keyboard nav, tap-to-zoom |
| `renderer/css/design-system/molecules/carousel.css` | CREATE | Flex track, slide 100% width, arrows absolute với `--ds-z-index-elevated`, transition transform |
| `renderer/js/components/organisms/markdown-viewer-component.js` | MODIFY | Thêm `CarouselModule.process(inner)` SAU MockupImageModule ở cả 2 path: `render()` ~line 1038 và `update()` ~line 1175 |
| `renderer/index.html` | MODIFY | Thêm `<script>` + `<link>` |

---

## ✅ Đã hoàn thành (Phase 4)

### Phase 4.1 — Carousel Block core (20:00)

| File | Hành động |
|------|-----------|
| `server/routes/render.js` | Thêm `carouselExtension` tokenizer + case `token.type === 'carousel'` trong `renderTokens()` với per-slide `data-line`/`data-src-start` |
| `renderer/css/design-system/molecules/carousel.css` | CREATE — flex track, absolute arrows fade-on-hover, `--ds-z-index-elevated` |
| `renderer/js/utils/carousel.js` | CREATE — `CarouselModule` IIFE: `process()`, `_activate()`, arrows, keyboard ←→, tap-to-zoom |
| `renderer/js/components/organisms/markdown-viewer-component.js` | Thêm `CarouselModule.process(inner)` sau MockupImageModule ở cả 2 path |
| `renderer/index.html` | Thêm `<link>` + `<script>` |

### Phase 4.2 — Context menu "Wrap in carousel" (20:15)

- MODIFY `renderer/js/services/monaco-service.js`:
  - Thêm selection detection song song với `foundImage` detection
  - Khi selection chứa ≥1 `![alt](src)` → hiện action "Wrap in carousel" đầu menu
  - Expand selection về full lines trước khi wrap
  - Guard `foundImage`-specific items với early return khi chỉ có selection

### Phase 4.3 — Quick Command Palette "carousel" (20:20)

- MODIFY `renderer/js/components/molecules/quick-command-palette.js`: thêm entry `{ id: 'carousel', label: 'Carousel', icon: 'layout-panel-left', hint: '/carousel', tags: [...] }`
- MODIFY `renderer/js/services/monaco-action-service.js`: thêm `case 'carousel'` — wrap selection hoặc insert template `:::carousel\n![Image 1]()\n![Image 2]()\n:::`

---

## ⚠️ Quyết định quan trọng (bổ sung Phase 4)

### 15. `carouselExtension` dùng empty renderer
- **Quyết định**: Extension định nghĩa `renderer() { return ''; }` để marked không tự render — toàn bộ HTML được build trong `renderTokens()` case `'carousel'`
- **Lý do**: Nếu để extension renderer build HTML, token sẽ không có `tokenStartLine`/`tokenStartOffset` → mất sync metadata

### 16. Context menu — early return khi chỉ có selection (không có foundImage)
- **Quyết định**: Khi `carouselImageCount >= 1` nhưng `foundImage` là null → sau khi push carousel item, gọi `ContextMenuComponent.open()` rồi `return` ngay
- **Lý do**: Phần code phía dưới dùng `foundImage.url`, `foundImage.range` — sẽ crash nếu `foundImage` là null

### 17. Slash command carousel — wrap hoặc insert template
- **Quyết định**: Nếu có text bôi đen → `:::carousel\n{selectedText}\n:::`; nếu không → insert template `:::carousel\n![Image 1]()\n![Image 2]()\n:::`
- **Lý do**: Consistent với pattern của `cb` (code block) — luôn có placeholder khi không có selection

---


## ✅ Phase 5 — Carousel UI: Mockup-aware Peek Layout (21:45)

### Hoàn thành
Centered peek carousel với dynamic mask thích nghi mockup type. Slide active luôn ở center, peek slides lộ 2 bên với gradient fade mask.

**Files thay đổi:**

| File | Hành động | Chi tiết |
|------|-----------|---------|
| `renderer/js/utils/carousel.js` | MODIFY | Type detection, fit-content (phone) / 80% (browser) slide width, .md-carousel-clip wrapper, center-offset calc include gap, dynamic mask-image on clip, ResizeObserver, custom button, remove click-to-navigate |
| `renderer/css/design-system/molecules/carousel.css` | MODIFY | `--md-carousel-gap` variable, `.md-carousel-clip`, overflow: visible on carousel, custom `.md-carousel-btn` style (no ds-btn, hover color-only) |
| `renderer/js/components/design-system-icons.js` | MODIFY | Thêm `chevron-left` icon |

**DOM structure:**
```
.md-carousel (overflow: visible, position: relative, mask-image on .md-carousel-clip via JS)
  ├── .md-carousel-clip (overflow: hidden — clip thực sự)
  │    └── .md-carousel-track (display: flex, gap: var(--md-carousel-gap))
  │          └── .md-carousel-slide × N
  ├── .md-carousel-btn.is-prev (position: absolute, left)
  └── .md-carousel-btn.is-next (position: absolute, right)
```

**Behavior:**
- Type detection: đọc `.mockup-phone-frame` / `.mockup-browser-frame` từ slide[0]
- Phone: slide width `max-content`, mask stop = `(containerW - frameW) / 2 / containerW`
- Browser/default: slide width `80%`, mask stop = `10%`
- Center offset: `offset = current * (slideW + gap) - (containerW - slideW) / 2`
- Mask: gradient set trên `.md-carousel-clip`, không affect buttons trên `.md-carousel`
- ResizeObserver: recalc offset + mask mỗi lần container resize

---

## ⚠️ Quyết định quan trọng (Phase 5)

### 18. Mask set trên .md-carousel-clip, không phải .md-carousel
- **Quyết định**: `mask-image` được set trên `.md-carousel-clip` thay vì `.md-carousel`
- **Lý do**: Arrow buttons là children của `.md-carousel` (overflow: visible) nên không bị clip/mask. Mask chỉ effect track + slides trong clip.

### 19. Type detection — từ slide đầu tiên
- **Quyết định**: Đọc class `.mockup-phone-frame` / `.mockup-browser-frame` từ slide đầu tiên → apply behavior cho toàn carousel
- **Lý do**: Mixed type hiếm; baseline từ slide[0] để xác định phone vs browser behavior

### 20. Remove click-to-navigate, giữ tap-to-zoom
- **Quyết định**: Xóa click handler `if (i !== current) go(i)` — giờ click bất kỳ slide nào cũng chỉ zoom ảnh
- **Lý do**: Click trên peek slide gây conflict với tap-to-zoom intent. Navigation dùng arrow/keyboard đủ rồi.

### 21. DOM structure tách .md-carousel-clip
- **Quyết định**: Thêm `.md-carousel-clip` (overflow: hidden) wrapper bên trong `.md-carousel` (overflow: visible)
- **Lý do**: Overflow: hidden trên parent sẽ clip cả absolute button children. Tách layer cho buttons không bị clip.

### 22. Custom button style — không dùng ds-btn
- **Quyết định**: Bỏ `ds-btn` classes, viết custom `.md-carousel-btn` CSS: 32×32px, backdrop-filter, hover chỉ thay color (không translateY)
- **Lý do**: `ds-btn:hover` có `translateY(-1px)` mặc định → button nhảy lên. Custom style để hover smooth color-only.

### 23. CSS variable cho gap — --md-carousel-gap
- **Quyết định**: Thêm `--md-carousel-gap: var(--ds-space-2xl)` vào `.md-carousel`, track dùng `gap: var(--md-carousel-gap)`
- **Lý do**: User có thể tinh chỉnh gap dễ dàng bằng cách override variable, không cần sửa JS

### 24. Offset calc include gap
- **Quyết định**: Formula: `offset = current * (slideW + gap) - (containerW - slideW) / 2`
- **Lý do**: Gap làm thay đổi slide position trong track. Phải include gap để center formula vẫn đúng.

### 25. Chevron-left icon thêm vào DS
- **Quyết định**: Thêm `chevron-left` vào design-system-icons.js (mirror của chevron-right)
- **Lý do**: Icon set chỉ có chevron-right, left arrow không hiển thị

---

## 🔄 Trạng thái hiện tại

✅ TASK HOÀN THÀNH — 2026-05-18 (Phase 1–5 done, Phase 6 tiếp tục tại log 2026-05-18)

---

## 📋 Đề xuất tương lai (chưa thảo luận)

### Mockup types bổ sung
- `#tablet` — iPad Pro ratio (4:3)
- `#ipad` — iPad với notch + home bar

### Wiki-drawer-component integration
- Có rendering path riêng, chưa test
- Xem xét nếu user dùng mockup trong wiki drawer

### Hash palette — refactor sang factory API
- Khi có trigger thứ 3 (e.g., `@mention`, `::snippet`) → thiết kế factory API đúng

**Last Updated**: 2026-05-17 21:45

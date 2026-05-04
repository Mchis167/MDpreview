## Giải pháp "Slugify trong extractHeadingsSSR" — Có tối ưu chưa?

**Ngắn gọn: Đúng hướng, nhưng chưa đủ.** Giải pháp đó giải quyết được 80% vấn đề, nhưng còn một điểm yếu kiến trúc quan trọng mà nếu bỏ qua sẽ phát sinh bug khó debug sau này.

***

## Vấn đề gốc rễ cần hiểu rõ

Nhìn vào `renderer.js` của Worker hiện tại, hàm `render()` chỉ trả về HTML thô qua `marked.parser()` — **không inject `id` vào thẻ heading**. Trong khi đó `extractHeadingsSSR` trong `shell.js` dùng regex đọc `id` từ HTML đó: [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/9f395e7e-24c9-465c-88e0-20364294792a/06-worker.md)

```js
// shell.js — regex hiện tại
const headingRegex = /<h([2-6])[^>]*id="([^"]*)"[^>]*>(.*?)<\/h[2-6]>/gi;
```

Nếu heading không có `id` sẵn (mà `marked` v4 không tự sinh), regex này sẽ **không match được gì cả** → TOC rỗng, `toc-publish.js` không tìm được element để highlight.

***

## So sánh các phương án

| Phương án | Mô tả | Điểm mạnh | Điểm yếu |
|---|---|---|---|
| **A — Slugify trong `extractHeadingsSSR`** (đang được gợi ý) | Regex scan heading → sinh slug → patch HTML string bằng `.replace()` | Đơn giản, ít thay đổi | Regex patch HTML string dễ sai edge case (heading có tag con `<code>`, `<em>`); 2 lần pass qua HTML string |
| **B — Slug trong `renderer.js` (marked heading renderer)** ⭐ | Override `marked` Renderer để tự inject `id` ngay lúc render | Slug được sinh tại nguồn, HTML luôn có `id` sẵn; `extractHeadingsSSR` chỉ cần đọc không cần patch | Cần thay đổi `renderer.js` |
| **C — Client-side slug** | `toc-publish.js` tự sinh slug từ text, không cần `id` trong HTML | Không đụng Worker | Sync giữa TOC và heading dễ lệch nếu text có unicode/ký tự đặc biệt |

**Phương án B là tối ưu nhất** vì nó giải quyết vấn đề tại *điểm sinh ra HTML*, không phải vá ở giai đoạn sau.

***

## Implement Plan: Phương án B (Khuyến nghị)

### Bước 1 — Tạo `slugify` util trong Worker

**File:** `cf-publish-worker/src/utils/slug.js` (thêm vào file đã có)

```js
// Thêm vào cf-publish-worker/src/utils/slug.js

/**
 * Convert heading text to a URL-safe slug.
 * Handles Vietnamese, emoji, and special characters.
 * @param {string} text - Raw heading text (HTML stripped)
 * @param {Map} usedSlugs - Track duplicate slugs for deduplication
 * @returns {string}
 */
export function slugifyHeading(text, usedSlugs = new Map()) {
  let slug = text
    .toLowerCase()
    .normalize('NFD')                        // Decompose: "ề" → "e" + combining
    .replace(/[\u0300-\u036f]/g, '')         // Strip combining diacritics
    .replace(/đ/g, 'd').replace(/Đ/g, 'd')  // Vietnamese đ → d
    .replace(/[^\w\s-]/g, '')               // Remove non-word chars
    .replace(/[\s_]+/g, '-')               // Spaces/underscores → hyphen
    .replace(/^-+|-+$/g, '')               // Trim hyphens
    || 'section';                           // Fallback if empty

  // Deduplication: heading-2, heading-3, ...
  if (usedSlugs.has(slug)) {
    const count = usedSlugs.get(slug) + 1;
    usedSlugs.set(slug, count);
    slug = `${slug}-${count}`;
  } else {
    usedSlugs.set(slug, 1);
  }

  return slug;
}
```

> **Lưu ý về tiếng Việt:** `normalize('NFD')` + xóa diacritics sẽ ra `chao-buoi-sang` từ `Chào buổi sáng`. Nếu muốn giữ tiếng Việt trong URL (SEO-friendly), bỏ 2 dòng normalize — slug sẽ là `chào-buổi-sáng`, hoàn toàn hợp lệ theo RFC 3986.

***

### Bước 2 — Override `marked` Renderer trong `renderer.js`

Đây là thay đổi cốt lõi. **Inject `id` ngay khi render heading**, không cần patch sau:

```js
// cf-publish-worker/src/renderer.js
import { marked } from 'marked';
import hljs from 'highlight.js';
import { highlightCodeBlock, sanitizeHtml, wrapInTableWrapper, renderMermaidBlock }
  from '../../../renderer/js/services/md-renderer-core.js';
import { slugifyHeading } from './utils/slug.js';

export function render(content) {
  // Override heading renderer để inject id
  const usedSlugs = new Map(); // Reset per-document
  const renderer = new marked.Renderer();

  renderer.heading = (text, level) => {
    // Strip HTML tags để lấy pure text cho slug
    const plainText = text.replace(/<[^>]+>/g, '').trim();
    const id = slugifyHeading(plainText, usedSlugs);
    return `<h${level} id="${id}">${text}</h${level}>`;
  };

  const tokens = marked.lexer(content);
  let html = '';
  tokens.forEach(token => {
    // ... logic hiện tại giữ nguyên, chỉ thêm renderer option
    if (token.type === 'heading') {
      // Dùng renderer override
      html += marked.parser([token], { renderer });
    } else if (token.type === 'code' && token.lang !== 'mermaid') {
      // ... giữ nguyên
    }
    // ... rest giữ nguyên
  });

  return sanitizeHtml(html);
}
```

> **Quan trọng:** `usedSlugs` phải được khởi tạo **mỗi lần gọi `render()`**, không dùng module-level variable — tránh state leak giữa các document trong cùng 1 Worker instance.

***

### Bước 3 — Đơn giản hóa `extractHeadingsSSR` trong `shell.js`

Sau khi Bước 2 xong, HTML đã có `id` sẵn. `shell.js` chỉ cần **đọc**, không cần **patch**:

```js
// cf-publish-worker/src/shell.js

function extractHeadingsSSR(html) {
  // HTML đã có id từ renderer.js — chỉ cần đọc
  // Regex giờ reliable vì id luôn tồn tại
  const headingRegex = /<h([2-6])[^>]+id="([^"]*)"[^>]*>(.*?)<\/h[2-6]>/gi;
  const flat = [];
  let match;
  while ((match = headingRegex.exec(html)) !== null) {
    const level = parseInt(match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/9f395e7e-24c9-465c-88e0-20364294792a/06-worker.md), 10);
    const id = match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/bfbd2b0a-9bce-4cd0-94bb-56c2c57e142a/09-misc.md);
    const text = match [ppl-ai-file-upload.s3.amazonaws](https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_1762174b-47b6-4cda-8e09-0554d6d5097b/c783f7c3-b5b5-4b5a-8ed8-507b2218a98c/08-tests.md).replace(/<[^>]+>/g, '').trim(); // strip inner tags
    if (text) flat.push({ level, id, text, children: [] });
  }
  return buildTree(flat);
}
```

**Không cần patch HTML, không cần 2 lần pass** → sạch và an toàn hơn hẳn.

***

### Bước 4 — Cập nhật `toc-publish.js` (giữ nguyên, nhưng bỏ fallback)

`toc-publish.js` hiện tại đã query `[data-heading-id]` để match. Sau Bước 2, heading trong DOM luôn có `id`, nên logic trong `updateActive()` và click handler hoạt động chuẩn — **không cần thay đổi** file này.

***

## Vì sao không dùng phương án A (Patch HTML string)?

Xét đoạn HTML thực tế này từ marked:

```html
<h3>Cách dùng <code>async/await</code> trong JS</h3>
```

Regex patch kiểu `replace(/<h3>(.*?)<\/h3>/, '<h3 id="slug">$1</h3>')` sẽ **sai** vì `.*?` sẽ không match qua thẻ `<code>`. Phải dùng non-greedy multi-line regex phức tạp hơn — và vẫn có edge case với heading nhiều dòng hoặc HTML entities. Trong khi đó, override `marked.Renderer` xử lý đúng 100% vì nó nhận `text` đã là string đã render xong.

***

## Tóm tắt thứ tự thực hiện

1. Thêm `slugifyHeading()` vào `utils/slug.js` — 15 phút
2. Override `renderer.heading` trong `renderer.js` — 20 phút, test với tài liệu có heading trùng tên
3. Đơn giản hóa `extractHeadingsSSR` trong `shell.js` — 10 phút
4. `wrangler dev` → mở document → inspect DOM xem heading có `id` chưa → scroll để test highlight
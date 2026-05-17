## Image Mockup Wrapping — Phương thức triển khai

Tính năng này cho phép hiển thị ảnh được bọc trong một lớp UI mockup định sẵn (browser window, phone frame, v.v.) thay vì render ảnh thuần túy. Toàn bộ quá trình được chia làm 3 tầng xử lý độc lập.

***

### Tầng 1 — Markdown Authoring (Signal Convention)

Người dùng đánh dấu loại mockup ngay trong cú pháp markdown thông qua **URL hash fragment**:

```markdown
![Mô tả ảnh](screenshot.png#browser)
![Mô tả ảnh](screenshot.png#phone)
![Mô tả ảnh](screenshot.png)         ← không wrap
```

Hash fragment (`#browser`, `#phone`) **không ảnh hưởng đến việc load ảnh** và hoàn toàn tương thích với các markdown parser khác — nếu render trên môi trường không hỗ trợ, ảnh vẫn hiển thị bình thường, chỉ thiếu phần frame bọc ngoài.

Với nhóm ảnh cần wrap chung trong một layout (carousel, grid), sử dụng **fenced block directive**:

```markdown
:::carousel
![Screen 1](a.png)
![Screen 2](b.png)
![Screen 3](c.png)
:::
```

***

### Tầng 2 — Server-side Pre-processing

Trước khi markdown được parse, server chạy một bước **pre-processor** để transform fenced block directive thành raw HTML container mà markdown parser có thể hiểu:

```
:::carousel ... :::
        ↓
<div data-block="carousel">...</div>
```

Bước này diễn ra tại `render.js` bằng một regex replace đơn giản, trước khi gọi markdown parser. Các ảnh bên trong vẫn được parse bình thường thành thẻ `<img>` chuẩn.

***

### Tầng 3 — Client-side Post-processing

Sau khi HTML được inject vào DOM, module `MockupImageModule.process(container)` quét toàn bộ container và thực hiện transform:

1. **Với ảnh đơn lẻ** — kiểm tra hash trong `src` attribute, nếu khớp với một loại mockup đã định nghĩa thì `replaceChild()` bằng một mockup wrapper element tương ứng, ảnh gốc được giữ nguyên bên trong.

2. **Với nhóm ảnh** — tìm các `[data-block]` container, thu thập tất cả `<img>` bên trong, khởi tạo layout tương ứng (carousel, grid...) rồi replace toàn bộ block.

Mockup wrapper được build hoàn toàn bằng `DesignSystem.createElement()` và CSS custom properties của design system hiện có, đảm bảo nhất quán với toàn bộ UI.

***

### Luồng tổng thể

```
Raw Markdown
    ↓  [Pre-processor]  :::block → <div data-block>
Markdown Parser
    ↓  HTML output
Inject vào DOM
    ↓  [MockupImageModule.process()]
Final rendered view với mockup frames
```

***

### Tính tương thích & mở rộng

- Ảnh vẫn render bình thường trên mọi markdown viewer khác — không có breaking change
- Thêm loại mockup mới chỉ cần định nghĩa thêm một hash key và một hàm `buildWrapper()`
- Thêm loại block layout mới chỉ cần thêm một `data-block` handler ở client — không cần sửa server
# Design System Icons (`renderer/js/components/design-system-icons.js`)

> Module độc lập lưu trữ registry toàn bộ icon SVG của dự án, tách biệt khỏi logic render của Design System.

---

## Kiến trúc

Module này đóng vai trò là một "Data Provider" cho `DesignSystem`. Nó không chứa logic UI mà chỉ chứa các chuỗi SVG được tối ưu hóa.

```
DesignSystemIcons
├── ICONS (Registry)
└── init() — tự động đăng ký vào DesignSystem
```

---

## API

### `DesignSystem.registerIcons(icons)`
Hàm này (nằm trong `design-system.js`) được gọi để nạp thêm icon vào registry nội bộ.

**Input:** Object với key là tên icon và value là chuỗi SVG.

---

## Danh sách Icon tiêu biểu

Hệ thống sử dụng các icon từ bộ **Remix Icon** và **Lucide**, được tinh chỉnh để:
- Không có `width`/`height` cứng (dùng CSS điều khiển).
- Sử dụng `stroke="currentColor"` để tự động đổi màu theo text.
- Stroke width mặc định: `2px`.

---

## Cách thêm Icon mới

1. Mở `renderer/js/components/design-system-icons.js`.
2. Thêm entry mới vào object `ICONS`.
3. Tên key nên tuân theo định dạng kebab-case (ví dụ: `file-plus`, `sort-alpha-asc`).
4. Sử dụng icon bằng cách gọi: `DesignSystem.getIcon('tên-icon')`.

---

## Lợi ích của việc tách module

- **Giảm dung lượng core**: `DesignSystem` trở nên nhẹ hơn, chỉ tập trung vào việc tạo component.
- **Dễ quản lý**: Toàn bộ icon nằm tại một file duy nhất, dễ dàng audit hoặc thay thế bộ icon mới.
- **Tính modular**: Có thể đăng ký thêm icon cho các plugin hoặc module mở rộng mà không cần sửa file core.

---

*Document — 2026-04-29*

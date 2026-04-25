# Decision Log

Ghi lại các quyết định thiết kế và kỹ thuật quan trọng trong quá trình phát triển MDpreview.

> **Mục đích:** Khi đọc lại code sau vài tháng — hoặc AI agent vào session mới — hiểu ngay **tại sao** lại làm như vậy, không phải chỉ **làm gì**.

---

## Quy ước

- Mỗi quyết định = 1 file riêng, đặt tên `YYYYMMDD-[slug].md`
- Slug ngắn gọn, dùng dấu `-`, mô tả vấn đề (không mô tả giải pháp)
- Status: `accepted` | `superseded` | `deprecated`
- Khi quyết định bị thay thế → đánh dấu `superseded by [file mới]`, không xóa file cũ

---

## Index

| Date | File | Vấn đề | Status |
|---|---|---|---|
| 2026-04-26 | [20260426-unified-menu-shield.md](20260426-unified-menu-shield.md) | Kiến trúc lớp vỏ menu nổi hợp nhất | accepted |
| 2026-04-26 | [20260426-unified-sidebar-structure.md](20260426-unified-sidebar-structure.md) | Nhất quán hóa cấu trúc khung Sidebar | accepted |
| 2026-04-26 | [20260426-tab-space-optimization.md](20260426-tab-space-optimization.md) | Tối ưu không gian Tab qua tái cấu trúc Layout | accepted |
| 2026-04-26 | [20260426-singleton-ui-pattern.md](20260426-singleton-ui-pattern.md) | Singleton Pattern cho Global UI Components | accepted |

---

*Dùng lệnh `/decision` để thêm entry mới.*

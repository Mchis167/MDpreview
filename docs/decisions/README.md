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
| 2026-04-26 | [20260426-settings-service-architecture.md](20260426-settings-service-architecture.md) | Kiến trúc Settings Service tập trung | superseded |
| 2026-04-26 | [20260426-settings-ui-molecule.md](20260426-settings-ui-molecule.md) | Phân tách phân tử UI cho bảng cài đặt | accepted |
| 2026-04-26 | [20260426-centralized-settings-architecture.md](20260426-centralized-settings-architecture.md) | Kiến trúc Registry trung tâm cho toàn bộ Settings | accepted |
| 2026-04-26 | [20260426-hidden-paths-strategy.md](20260426-hidden-paths-strategy.md) | Chiến lược lưu trữ và quản lý file bị ẩn | accepted |
| 2026-04-26 | [20260426-adaptive-sidebar-scrolling.md](20260426-adaptive-sidebar-scrolling.md) | Kiến trúc vùng cuộn thích ứng cho Sidebar | accepted |
| 2026-04-26 | [20260426-drag-sensitivity-shield.md](20260426-drag-sensitivity-shield.md) | Tăng độ nhạy kéo thả qua Shield và Deep Scan | accepted |
| 2026-04-26 | [20260426-hidden-section-restrictions.md](20260426-hidden-section-restrictions.md) | Hạn chế thao tác tạo mới tại vùng Hidden | accepted |
| 2026-04-26 | [20260426-drag-visual-minimalism.md](20260426-drag-visual-minimalism.md) | Thẩm mỹ kéo thả tối giản, giảm xao nhãng | accepted |
| 2026-04-26 | [20260426-sidebar-hidden-behavior.md](20260426-sidebar-hidden-behavior.md) | Đồng bộ Tabs và trạng thái khi ẩn/hiện file | accepted |
| 2026-04-27 | [20260427-search-palette-strategy.md](20260427-search-palette-strategy.md) | Chiến lược tìm kiếm và tối ưu trải nghiệm Quick Open | accepted |
| 2026-04-27 | [20260427-tab-preview-rendering.md](20260427-tab-preview-rendering.md) | Chiến lược render "cửa sổ" nội dung cho Tab Preview | superseded |
| 2026-04-27 | [20260427-tab-preview-mirror-strategy.md](20260427-tab-preview-mirror-strategy.md) | Chiến lược Mirror Viewport và Scaling cho Tab Preview | accepted |
| 2026-04-27 | [20260427-hybrid-tab-close-positioning.md](20260427-hybrid-tab-close-positioning.md) | Logic vị trí Hybrid (Absolute/Static) cho nút Close Tab | accepted |
| 2026-04-27 | [20260427-tab-filename-masking.md](20260427-tab-filename-masking.md) | Sử dụng Gradient Masking để xử lý chồng đè tên file | accepted |
| 2026-04-27 | [20260427-server-payload-limit.md](20260427-server-payload-limit.md) | Nâng giới hạn Payload Server lên 50MB cho file lớn | accepted |
| 2026-04-27 | [20260427-tab-management-strategy.md](20260427-tab-management-strategy.md) | Chiến lược quản lý Tab: Ghim, Phân vùng và Co giãn | accepted |
| 2026-04-27 | [20260427-tab-logic-visual-sync.md](20260427-tab-logic-visual-sync.md) | Đồng bộ logic tab với thứ tự hiển thị trực quan | accepted |
| 2026-04-27 | [20260427-explicit-selection-closure.md](20260427-explicit-selection-closure.md) | Ưu tiên lựa chọn thủ công hơn tính bảo vệ của tab ghim | accepted |
| 2026-04-27 | [20260427-systems-based-token-refactor.md](20260427-systems-based-token-refactor.md) | Tái cấu trúc Semantic Token theo Hệ thống (Systems-based) | accepted |
| 2026-04-27 | [20260427-smart-button-spacing-logic.md](20260427-smart-button-spacing-logic.md) | Tự động hóa khoảng cách nút qua logic :only-child | accepted |
| 2026-04-27 | [20260427-search-palette-height-logic.md](20260427-search-palette-height-logic.md) | Kiến trúc dãn nở chiều cao và tích hợp phím tắt cho Search Palette | accepted |
| 2026-04-27 | [20260427-command-palette-evolution.md](20260427-command-palette-evolution.md) | Chiến lược tiến hóa Command Palette và tìm kiếm ngữ nghĩa | accepted |
| 2026-04-28 | [20260428-adaptive-concentric-radius.md](20260428-adaptive-concentric-radius.md) | Chiến lược bo góc đồng tâm và thích ứng cho nested components | accepted |
| 2026-04-28 | [20260428-edit-toolbar-layout-evolution.md](20260428-edit-toolbar-layout-evolution.md) | Tiến hóa Layout và chuẩn hóa Icon Scaling cho Edit Toolbar | accepted |
| 2026-04-28 | [20260428-optimized-file-loading.md](20260428-optimized-file-loading.md) | Tối ưu hóa logic tải file và ổn định UI | accepted |
| 2026-04-28 | [20260428-centralized-shortcut-strategy.md](20260428-centralized-shortcut-strategy.md) | Chiến lược Phím tắt Tập trung và Đánh chặn Toàn cục | accepted |


---

*Dùng lệnh `/decision` để thêm entry mới.*

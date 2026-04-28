# Architecture Polish and Legacy Pruning Strategy

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Sau nhiều đợt nâng cấp tính năng, codebase của MDpreview xuất hiện các dấu hiệu của "Technical Debt":
1. Logic đồng bộ (Sync Scroll/Cursor) bị phân tán rải rác trong các Organism (ví dụ `ChangeActionViewBar`), vi phạm nguyên tắc Single Responsibility.
2. Tồn tại nhiều file di sản (`toolbar.js`, `sidebar.js`, `sidebar-controller.js`) không còn thực hiện đúng vai trò hoặc đã bị thay thế bởi các Component mới nhưng vẫn được load vào `index.html`.
3. Phụ thuộc vào bên thứ 3 (Lucide CDN) gây chậm trễ khi khởi động và khó quản lý offline.

Cần một đợt "tổng vệ sinh" kiến trúc để đưa dự án về trạng thái technical purity.

---

## Các lựa chọn đã cân nhắc

### Option 1: Giữ nguyên và chỉ dọn dẹp logic bên trong
- **Ưu:** Rủi ro thấp, không làm thay đổi cấu trúc file.
- **Nhược:** Vẫn load các file thừa, kiến trúc bị phân mảnh, khó bảo trì về lâu dài.

### Option 2: Tái cấu trúc tập trung và xóa bỏ hoàn toàn Legacy
- **Ưu:** Codebase sạch, giảm dung lượng load, logic tập trung (SyncService), dễ mở rộng.
- **Nhược:** Cần cập nhật nhiều file core (`app.js`, `index.html`, `tree.js`), rủi ro làm gãy các tham chiếu ẩn.

---

## Quyết định

**Chọn: Option 2 — Tái cấu trúc tập trung và xóa bỏ hoàn toàn Legacy**

Dự án đang tiến tới phiên bản ổn định cao, việc duy trì code di sản sẽ cản trở việc tối ưu hiệu năng và triển khai các tính năng phức tạp hơn (như Offline Mode hoặc Plugins). Việc tạo `SyncService` giúp đóng gói thuật toán đồng bộ cực kỳ quan trọng vào một nơi duy nhất.

---

## Hệ quả

**Tích cực:**
- **Zero Technical Debt**: Loại bỏ hoàn toàn các file mồ côi.
- **Improved Performance**: Không còn request tới CDN bên ngoài, giảm số lượng file JS được load.
- **Architectural Clarity**: Logic đồng bộ được tách biệt hoàn toàn khỏi UI layer.

**Tiêu cực / Trade-off:**
- Phải cập nhật thủ công các file khởi tạo (`app.js`) và đăng ký global.
- Đòi hỏi quy trình linting nghiêm ngặt để đảm bảo không còn tham chiếu tới module cũ.

**Constraint tương lai:**
- KHÔNG được thêm logic nghiệp vụ phức tạp vào các Organism UI. Mọi logic xử lý dữ liệu hoặc đồng bộ phải nằm trong thư mục `services/`.
- Mọi module mới phải đăng ký icons qua `DesignSystem.registerIcons` thay vì hardcode SVG.

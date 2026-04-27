# Chiến lược lưu trữ và quản lý file bị ẩn (Hidden from Tree)

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Người dùng cần ẩn các file hoặc thư mục không quan trọng (như `node_modules`, `.git`, hoặc các file rác) để làm sạch không gian làm việc. Tính năng này yêu cầu:
1. Phải bền vững (persistent) qua các phiên làm việc.
2. Phải được đồng bộ hóa giữa các thiết bị (nếu dùng server sync).
3. Phải được tích hợp sâu vào logic hiển thị (Tree) và tìm kiếm (Search).

---

## Các lựa chọn đã cân nhắc

### Option 1: Lưu trữ thuần túy tại LocalStorage
- **Ưu:** Triển khai cực nhanh, không phụ thuộc server.
- **Nhược:** Không đồng bộ được khi người dùng chuyển sang máy tính khác hoặc dùng bản Web. Dễ mất dữ liệu khi xóa cache trình duyệt.

### Option 2: Sử dụng metadata trong FileSystem (ví dụ: file `.mdpreview_hidden`)
- **Ưu:** Gắn liền với workspace, di chuyển folder đi đâu file ẩn đi theo đó.
- **Nhược:** Làm bẩn thư mục của người dùng bằng các file ẩn mới. Tốn tài nguyên quét đĩa.

### Option 3: Tích hợp vào SettingsService (AppState + Server Sync)
- **Ưu:** Tận dụng được hạ tầng đồng bộ hiện có. Dữ liệu tập trung, dễ quản lý. Có cơ chế self-healing và validation JSON chuẩn.
- **Nhược:** Tăng dung lượng file cấu hình `app_state.json`.

---

## Quyết định

**Chọn: Option 3 — Tích hợp vào SettingsService**

Lý do: Tính nhất quán (Consistency) là ưu tiên hàng đầu của MDpreview. Việc đưa `hiddenPaths` thành một phần của App Settings giúp người dùng có trải nghiệm đồng bộ 100% trên mọi nền tảng (Electron/Web). Ngoài ra, `SettingsService` đã có sẵn cơ chế Registry giúp việc bảo trì code sạch sẽ hơn.

---

## Hệ quả

**Tích cực:**
- Hỗ trợ đồng bộ hóa tự động lên server.
- Tận dụng được cơ chế lắng nghe thay đổi (reactive) của `SettingsService` để vẽ lại UI ngay lập tức.
- Dễ dàng mở rộng thêm các cài đặt liên quan (ví dụ: `showHiddenInSearch`).

**Tiêu cực / Trade-off:**
- Danh sách `hiddenPaths` có thể phình to nếu người dùng ẩn quá nhiều file, làm tăng nhẹ payload khi đồng bộ.

**Constraint tương lai:**
- Khi thực hiện `load()` cây thư mục, LUÔN PHẢI kiểm tra `AppState.settings.hiddenPaths` để thực hiện lọc (filtering) ở mức Logic thay vì mức UI.
- Các file bị ẩn phải được loại bỏ khỏi danh sách "Recently Viewed" để đảm bảo tính riêng tư/gọn gàng triệt để.

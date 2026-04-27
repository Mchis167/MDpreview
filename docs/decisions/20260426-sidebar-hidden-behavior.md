# Sidebar Hidden Items Behavior (Selection, Tabs, and Recent)

**Date:** 2026-04-26
**Status:** accepted
**Author:** session ee5244d5-46b5-4089-ac09-e3d37617980e

---

## Bối cảnh

Việc tích hợp thêm vùng "Hidden Items" vào Sidebar tạo ra nhiều kịch bản tương tác mới giữa vùng quản lý (Hidden) và vùng làm việc chính (All Files). Cần thống nhất các quy tắc xử lý trạng thái (Selection, Tabs, Recently Viewed) để đảm bảo trải nghiệm người dùng mượt mà và không gây nhầm lẫn.

---

## Các lựa chọn đã cân nhắc

### Về Selection (Lựa chọn) sau khi di chuyển:
- **Option 1: Reset Selection**: Xóa sạch lựa chọn sau khi di chuyển item.
- **Option 2: Persist Selection**: Cập nhật đường dẫn mới và giữ nguyên trạng thái được chọn.

### Về Tabs (Cửa sổ mở):
- **Option 1: Keep Tabs Open**: Giữ nguyên tab kể cả khi file bị ẩn.
- **Option 2: Close Tabs on Hide**: Tự động đóng tab của file/folder khi chúng bị ẩn (bao gồm đóng đệ quy cho con của folder).

### Về Recently Viewed (Lịch sử):
- **Option 1: Remove Hidden Items**: Xóa file ẩn khỏi lịch sử truy cập nhanh.
- **Option 2: Keep with Indicator**: Giữ lại file ẩn nhưng hiển thị với độ mờ (opacity) làm dấu hiệu nhận biết.

---

## Quyết định

**Chọn: Các phương án tối ưu trải nghiệm (Selection Persistence, Recursive Tab Closing, Recent Indicator)**

1. **Persist Selection**: Giúp người dùng thực hiện tiếp các thao tác hàng loạt ngay sau khi di chuyển mà không cần chọn lại.
2. **Recursive Tab Closing**: Đảm bảo file "invisible" trong sidebar thì cũng phải "invisible" trong không gian làm việc chính để tránh mâu thuẫn trạng thái.
3. **Recent Indicator**: Cho phép truy cập nhanh các file vừa ẩn để chỉnh sửa nốt nhưng vẫn phân biệt rõ với file đang hiện.

---

## Hệ quả

**Tích cực:**
- Trải nghiệm người dùng nhất quán, chuyên nghiệp (Premium feel).
- Logic đóng Tab đệ quy giúp làm sạch workspace triệt để khi ẩn thư mục lớn.
- Indicator độ mờ tạo ra sự cân bằng tốt giữa tính riêng tư (ẩn file) và tính tiện dụng (truy cập nhanh).

**Tiêu cực / Trade-off:**
- Logic đóng Tab đệ quy đòi hỏi quét danh sách Tab mỗi lần ẩn/hiện (overhead tối thiểu nhưng cần lưu ý).
- Selection Persistence yêu cầu logic cập nhật path phức tạp hơn trong DND engine.

**Constraint tương lai:**
- Mọi thao tác ẩn/hiện phải đi qua `_handleBatchToggleHidden` để đảm bảo Tab Sync hoạt động.
- Trạng thái `isHidden` phải được truyền đầy đủ vào các component render danh sách (Tree, Recently Viewed).

# Search Palette Architecture and Morphing Strategy

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

Search Palette (Thanh tìm kiếm nhanh) cần hỗ trợ nhiều chế độ (Files, Folders, Shortcuts) với khối lượng dữ liệu khác nhau. Để mang lại trải nghiệm premium, UI cần có hiệu ứng "biến hình" (morphing) chiều cao mượt mà thay vì thay đổi cứng nhắc. Ngoài ra, việc tích hợp Shortcuts từ một component cũ vào Palette cũng đặt ra yêu cầu về tái cấu trúc.

---

## Các lựa chọn đã cân nhắc

### Chế độ đo chiều cao (Height Measurement)
*   **Option 1: Đo `box.scrollHeight`**: Đơn giản nhưng bị lỗi "co rút" 2px mỗi lần render do `border-box` và `max-height` tự triệt tiêu lẫn nhau.
*   **Option 2: Cộng dồn chiều cao con (Sum of Children)**: Đo `header + options + results.scrollHeight + footer`. Chính xác tuyệt đối và không phụ thuộc vào trạng thái của container cha.

### Quản lý dữ liệu Shortcut
*   **Option 1: Render ShortcutComponent bên trong Palette**: Quá nặng và khó tùy biến giao diện list.
*   **Option 2: Refactor Shortcut thành Data Provider**: Chuyển đổi logic phím tắt thành static data để Search Palette tự render theo style riêng.

---

## Quyết định

**Chọn: Option 2 cho cả hai vấn đề.**

1.  **Cơ chế Morphing**: Sử dụng phép cộng dồn chiều cao con + 2px border. Kết quả được gán vào biến CSS `--_target-h` và transition bằng `cubic-bezier(0.2, 0.8, 0.2, 1)`.
2.  **Tích hợp Shortcuts**: Tách logic Shortcuts thành 2 hàm static: `getShortcutData()` và `executeAction(id)`.
3.  **Context-Aware**: Palette tự động lọc danh sách "Recent" và đổi các nhãn Empty State/Header dựa trên `_searchMode`.

---

## Hệ quả

**Tích cực:**
- Hiệu ứng Morph mượt mà, không bị khựng hay co rút lỗi.
- Giao diện Search Palette thông minh, đúng ngữ cảnh cho từng tab.
- Tái sử dụng được logic phím tắt cũ mà không làm hỏng kiến trúc component mới.

**Tiêu cực / Trade-off:**
- Logic JS phức tạp hơn một chút do phải quản lý việc cộng dồn chiều cao thủ công.
- Cần cẩn thận khi thêm thành phần UI mới vào Palette (phải cập nhật logic cộng dồn).

**Constraint tương lai:**
- Mọi thành phần UI mới thêm vào `ds-search-palette-box` PHẢI được tính toán trong hàm `_updateMorphHeight`.
- Không được gán `max-height` cứng vào `.palette-results` dựa trên biến morph để tránh lỗi phụ thuộc vòng.

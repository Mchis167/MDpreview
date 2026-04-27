# Command Palette Evolution & Semantic Search Strategy

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

Hệ thống phím tắt cũ (`ShortcutsComponent` UI) rời rạc và khó bảo trì. Người dùng cũng gặp khó khăn khi muốn thực hiện một hành động nhưng không nhớ tên chính xác của chức năng đó (vấn đề Discoverability).
Chúng ta cần một giải pháp thống nhất để người dùng vừa tìm thấy file, vừa tìm thấy và thực thi lệnh một cách nhanh chóng, ngay cả khi chỉ nhớ mang máng mục đích.

---

## Các lựa chọn đã cân nhắc

### Option 1: Duy trì Shortcuts Popover cũ và nâng cấp fuzzy search
- **Ưu:** Giữ nguyên giao diện quen thuộc.
- **Nhược:** Code bị phân mảnh (duplicate logic tìm kiếm), fuzzy search chỉ giải quyết được lỗi gõ (typo) chứ không giải quyết được ý định (intent).

### Option 2: Hợp nhất vào Search Palette + AI Semantic Search
- **Ưu:** Trải nghiệm hiện đại, hiểu ý người dùng tuyệt đối.
- **Nhược:** Yêu cầu hạ tầng phức tạp (LLM hoặc Embedding), làm chậm tốc độ phản hồi của ứng dụng vanilla JS.

### Option 3: Hợp nhất vào Search Palette + Tag-based Indexing (Chọn)
- **Ưu:** Nhẹ, tốc độ phản hồi tức thì, hỗ trợ đa ngôn ngữ (tiếng Việt/Anh) thông qua thủ công gán từ khóa (tags).
- **Nhược:** Tốn công định nghĩa tag ban đầu cho mỗi phím tắt.

---

## Quyết định

**Chọn: Option 3 — Hợp nhất vào Search Palette + Tag-based Indexing**

Chúng ta khai tử UI của `ShortcutsComponent` và chuyển toàn bộ việc hiển thị/tìm kiếm lệnh vào `SearchPalette` (chế độ `/4`). Sử dụng cơ chế gán `tags` (ví dụ: "trash" cho "Delete Selected") để hỗ trợ người dùng tìm kiếm theo ý định thay vì tên chính xác.

---

## Hệ quả

**Tích cực:**
- **Centralized UI**: Chỉ còn một nơi duy nhất để tìm kiếm mọi thứ (Files, Folders, Commands).
- **Improved UX**: Người dùng gõ "xóa", "lưu", "xem" vẫn ra đúng chức năng tiếng Anh.
- **Visual Consistency**: Sử dụng hệ thống icon riêng biệt cho từng lệnh giúp nhận diện nhanh hơn.

**Tiêu cực / Trade-off:**
- Cần duy trì danh sách `tags` thủ công trong `shortcuts-component.js`.
- Logic scoring của `SearchService` phức tạp hơn do phải cân bằng giữa `label` match và `tag` match.

**Constraint tương lai:**
- Mọi phím tắt mới được thêm vào PHẢI bao gồm mảng `tags` chứa ít nhất 2-3 từ khóa phổ biến (bao gồm cả tiếng Việt nếu cần).
- Không được tạo thêm các UI popover phím tắt rời rạc khác.

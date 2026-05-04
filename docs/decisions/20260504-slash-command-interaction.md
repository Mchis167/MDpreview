# Slash Command Interaction Model

**Date:** 2026-05-04
**Status:** accepted
**Author:** session 2026-05-04

---

## Bối cảnh

Hệ thống định dạng Markdown hiện tại chủ yếu dựa vào Toolbar hoặc phím tắt. Tuy nhiên, việc rời tay khỏi bàn phím để dùng chuột (Toolbar) hoặc ghi nhớ hàng chục phím tắt gây đứt mạch suy nghĩ (context switch). Chúng ta cần một giải pháp "tại chỗ" (in-context) cho phép người dùng kích hoạt lệnh ngay khi đang gõ.

---

## Các lựa chọn đã cân nhắc

### Option 1: Palette truyền thống (có ô input riêng)
- **Ưu:** Dễ hiểu, quen thuộc.
- **Nhược:** Người dùng phải gõ `/`, sau đó focus vào palette, gõ lệnh, rồi lại focus ngược lại editor. Gây gián đoạn luồng viết.

### Option 2: Slash Command "Input-less" (Drive by editor)
- **Ưu:** Người dùng gõ trực tiếp trong editor. Palette chỉ là một lớp hiển thị kết quả. Không cần chuyển focus.
- **Nhược:** Phức tạp khi xử lý logic đánh chặn phím mũi tên và đồng bộ trạng thái.

---

## Quyết định

**Chọn: Option 2 — Slash Command "Input-less"**

Chúng ta ưu tiên trải nghiệm "Flow" — người dùng không bao giờ phải rời khỏi Textarea. `QuickCommandPalette` sẽ hoạt động ở chế độ ẩn input (`hideInput: true`) và nhận query trực tiếp từ nội dung sau dấu `/` trong Editor.

---

## Hệ quả

**Tích cực:**
- Trải nghiệm gõ lệnh tự nhiên như gõ văn bản.
- Giảm thiểu context switch.

**Tiêu cực / Trade-off:**
- Đòi hỏi logic đồng bộ phức tạp giữa `EditorModule` và `QuickCommandPalette`.

**Constraint tương lai:**
- `QuickCommandPalette` phải luôn hỗ trợ chế độ không có input.
- `EditorModule` phải quản lý chặt chẽ biến trạng thái `_isSlashMode` để không đánh chặn phím sai ngữ cảnh.

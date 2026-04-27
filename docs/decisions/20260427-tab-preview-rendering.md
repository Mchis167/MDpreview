# Tab Preview Rendering Strategy

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

MDpreview cho phép người dùng xem trước nội dung của một Tab khi di chuột qua (hover). Tuy nhiên, việc render toàn bộ nội dung của các file Markdown lớn (hàng nghìn dòng) kèm theo syntax highlighting cho mỗi lần hover gây ra gánh nặng lớn cho CPU/GPU, dẫn đến hiện tượng lag UI và trải nghiệm người dùng không mượt mà. Khung preview có kích thước cố định nhỏ (320x240) nên phần lớn nội dung render đầy đủ sẽ bị lãng phí.

---

## Các lựa chọn đã cân nhắc

### Option 1: Render toàn bộ nội dung (Full Render)
- **Ưu:** Hiển thị được đầy đủ file, người dùng có thể cuộn trong preview.
- **Nhược:** CPU/Memory cao, tốc độ phản hồi chậm khi hover, gây lag ứng dụng với file lớn.

### Option 2: Render đoạn đầu file (Top Slicing)
- **Ưu:** Tốc độ render cực nhanh, tốn ít tài nguyên.
- **Nhược:** Không cung cấp được thông tin về khu vực người dùng đang thực sự làm việc nếu file dài.

### Option 3: Render theo cửa sổ cuộn (Windowed Render - Slicing around scroll)
- **Ưu:** Tốc độ render nhanh (chỉ ~60 dòng), nội dung hiển thị đúng ngữ cảnh người dùng đang xem dở (Relevant Context).
- **Nhược:** Người dùng không thể cuộn xem các phần khác của file trong khung preview (chỉ là ảnh chụp tĩnh tại vị trí đó).

---

## Quyết định

**Chọn: Option 3 — Render theo cửa sổ cuộn (Windowed Render)**

Chúng tôi quyết định ưu tiên tính "đúng ngữ cảnh" và "hiệu năng tức thì". Bằng cách lấy vị trí cuộn hiện tại từ `ScrollModule` và chỉ lấy ra một lát cắt nội dung (khoảng 60 dòng) xung quanh vị trí đó, ứng dụng có thể render preview gần như ngay lập tức mà vẫn cho người dùng thấy chính xác họ đang làm gì trong file đó.

---

## Hệ quả

**Tích cực:**
- Tốc độ hiển thị preview cực nhanh (< 50ms).
- Tiết kiệm tài nguyên hệ thống, không bị ảnh hưởng bởi độ dài của file.
- Trải nghiệm người dùng cao cấp với nội dung preview luôn khớp với vị trí đang xem.

**Tiêu cực / Trade-off:**
- Khung preview là tĩnh, không cho phép cuộn tự do bên trong.
- Nếu file chưa từng được mở (không có dữ liệu scroll), nó sẽ mặc định render từ dòng đầu tiên.

**Constraint tương lai:**
- Mọi thay đổi về logic render preview phải duy trì giới hạn số lượng dòng (Max lines) để đảm bảo tính ổn định.
- Logic lấy `scrollKey` phải nhất quán giữa `ScrollModule` và `TabPreview` để đảm bảo đồng bộ vị trí.

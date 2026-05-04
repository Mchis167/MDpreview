# Vietnamese-ready Slugification Strategy

**Date:** 2026-05-04
**Status:** accepted
**Author:** session 2026-05-04

---

## Bối cảnh

MDpreview có lượng lớn người dùng Việt Nam. Các thuật toán sinh Slug mặc định (để làm ID cho heading) thường chỉ giữ lại ký tự `a-z` và `0-9`. 
Đối với Tiếng Việt, điều này dẫn đến việc các tiêu đề có dấu bị biến dạng hoặc mất chữ (ví dụ: "Chào buổi sáng" trở thành "chao-buoi-sang" hoặc tệ hơn là "cho-bi-sang" tùy thư viện).

Cần một thuật toán đồng nhất để tạo ra các ID vừa đẹp (SEO-friendly), vừa giữ được ngữ nghĩa của Tiếng Việt.

---

## Các lựa chọn đã cân nhắc

### Option 1: Dùng thư viện slugify bên ngoài
- **Ưu:** Đầy đủ tính năng.
- **Nhược:** Tăng kích thước bundle của Worker, khó tùy chỉnh chính xác các trường hợp chữ `đ`, `ư`, `ơ`.

### Option 2: Giữ nguyên Unicode trong ID (không slugify)
- **Ưu:** Giữ nguyên 100% nội dung.
- **Nhược:** Gây lỗi trên một số trình duyệt cũ hoặc khi chia sẻ link qua các nền tảng không hỗ trợ URL chứa ký tự đặc biệt (vị lỗi encoding).

### Option 3: Custom Slugify với Unicode Normalization (Lựa chọn hiện tại)
- **Ưu:** Nhẹ, không phụ thuộc thư viện, xử lý tốt Tiếng Việt và các ký tự đặc biệt.

---

## Quyết định

**Chọn: Option 3 — Custom Slugify với Unicode Normalization**

Chúng ta triển khai hàm `slugifyHeading` với các bước:
1. `normalize('NFD')` để tách các dấu ra khỏi chữ cái gốc.
2. Dùng Regex `[\u0300-\u036f]` để xóa các dấu vừa tách.
3. Xử lý thủ công các trường hợp đặc biệt của Tiếng Việt như `đ` -> `d`.
4. Loại bỏ ký tự đặc biệt và thay khoảng trắng bằng dấu gạch ngang.
5. Triển khai cơ chế **Deduplication** (thêm số thứ tự `-1`, `-2`) bằng `Map` để đảm bảo ID trong cùng một trang luôn là duy nhất.

---

## Hệ quả

**Tích cực:**
- URL mỏ neo trông chuyên nghiệp và dễ đọc đối với người Việt.
- Tránh được các lỗi encoding khi chia sẻ link.
- Đảm bảo tính duy nhất của ID trên toàn document.

**Tiêu cực / Trade-off:**
- Mất một chút ngữ nghĩa so với việc giữ nguyên dấu (nhưng là tiêu chuẩn chung của web).

**Constraint tương lai:**
- Hàm này phải được dùng chung cho cả bộ Renderer và bộ Shell Builder của Worker để đảm bảo tính nhất quán.

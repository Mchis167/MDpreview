# Smart Button Spacing Logic

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

Trong hệ thống Design System, các nút (`ds-btn`) thường chứa nhãn văn bản (`ds-btn-text`) và có thể có icon đi kèm.
Trước đây, `.ds-btn-text` luôn có `margin` trái/phải cố định để tạo khoảng cách với icon. 
Tuy nhiên, khi một nút chỉ có chữ (không có icon), phần margin này cộng dồn với `padding` của nút làm cho văn bản trông không được căn giữa hoàn hảo và chiếm dụng diện tích thừa không cần thiết.

---

## Các lựa chọn đã cân nhắc

### Option 1: Dùng class bổ trợ (Modifier class)
- **Ưu:** Tường minh, dễ kiểm soát thủ công.
- **Nhược:** Yêu cầu lập trình viên phải nhớ thêm class (ví dụ: `ds-btn--text-only`) mỗi khi tạo nút không có icon. Dễ gây sai sót và thiếu nhất quán.

### Option 2: Logic CSS tự động với `:only-child`
- **Ưu:** Hoàn toàn tự động. Nếu hệ thống nhận diện nhãn là phần tử duy nhất trong nút, nó sẽ tự bỏ margin.
- **Nhược:** Phụ thuộc vào cấu trúc DOM chuẩn (nhãn phải nằm trong span `.ds-btn-text`).

---

## Quyết định

**Chọn: Option 2 — Logic CSS tự động với `:only-child`**

Chúng ta ưu tiên sự tự động hóa để giảm tải gánh nặng ghi nhớ cho nhà phát triển. Bằng cách sử dụng `:only-child`, giao diện sẽ luôn đảm bảo tính cân đối thị giác (visual balance) cho cả nút có icon và nút thuần văn bản mà không cần can thiệp thủ công.

---

## Hệ quả

**Tích cực:**
- Giao diện các nút thuần văn bản (như bộ lọc trong Search Palette) trông gọn gàng và chuyên nghiệp hơn.
- Nhất quán hóa khoảng cách trên toàn bộ ứng dụng.

**Tiêu cực / Trade-off:**
- Nếu một nút được xây dựng thủ công (không dùng `DesignSystem.createButton`) và chèn thêm các phần tử ẩn hoặc text node trần, logic `:only-child` có thể không hoạt động như ý.

**Constraint tương lai:**
- Mọi nút trong Design System phải tuân thủ cấu trúc DOM: `button > .ds-btn-text` và các icon phải là anh em của nhãn này.
- Khuyến khích sử dụng `DesignSystem.createButton` để đảm bảo cấu trúc này luôn đúng.

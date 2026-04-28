# Stable Layout Pattern via Transparent Borders

**Date:** 2026-04-29
**Status:** accepted
**Author:** session 2026-04-29

---

## Bối cảnh

Trong thiết kế UI hiện đại, các phần tử tương tác (Buttons, Inputs, Cards) thường thay đổi border để biểu thị trạng thái (Hover, Active, Focused, Selected). Nếu một phần tử không có border ở trạng thái mặc định nhưng lại có border ở trạng thái tương tác, kích thước của nó sẽ tăng lên 2px (1px mỗi cạnh), gây ra hiện tượng "nhảy" layout (layout shift) hoặc "giật" pixel rất khó chịu.

---

## Các lựa chọn đã cân nhắc

### Option 1: Sử dụng `outline` thay cho `border`
- **Ưu:** Outline không chiếm không gian trong box model, không gây layout shift.
- **Nhược:** Outline không hỗ trợ bo góc (`border-radius`) hoàn hảo trên mọi trình duyệt (đặc biệt là các trình duyệt cũ hoặc một số bản webkit), và bị giới hạn về kiểu dáng.

### Option 2: Sử dụng `box-shadow` (inset hoặc outset)
- **Ưu:** Không gây layout shift, hỗ trợ bo góc tốt.
- **Nhược:** Cần tính toán độ mờ (blur) và spread để giả lập border, đôi khi trông không sắc nét bằng border thật.

### Option 3: Sử dụng `border: 1px solid transparent` (Transparent Border Hack)
- **Ưu:** Giữ nguyên box model ổn định từ đầu. Khi chuyển trạng thái, chỉ cần thay đổi `border-color`. Hỗ trợ bo góc và hiệu ứng chuyển cảnh (`transition`) hoàn hảo.
- **Nhược:** Tăng 2px vào kích thước tổng thể ngay từ đầu (cần điều chỉnh padding nếu cần độ chính xác cao).

---

## Quyết định

**Chọn: Option 3 — Transparent Border Hack**

Đây là giải pháp ổn định nhất để xử lý các trạng thái UI phức tạp. Bằng cách luôn duy trì một viền tàng hình (opacity: 0), chúng ta đảm bảo layout luôn "tĩnh" (stable), mang lại trải nghiệm người dùng cao cấp và mượt mà hơn.

---

## Hệ quả

**Tích cực:**
- Loại bỏ hoàn toàn hiện tượng "nhảy" pixel khi tương tác.
- Hiệu ứng transition của border-color mượt mà hơn nhiều so với việc border xuất hiện đột ngột.

**Tiêu cực / Trade-off:**
- Cần lưu ý khi tính toán khoảng cách (spacing) vì border 1px tàng hình thực chất vẫn chiếm không gian.

**Constraint tương lai:**
- Tất cả các Atoms tương tác (Buttons, Inputs, v.v.) trong Design System **PHẢI** áp dụng pattern này: luôn có border (có thể là transparent) ở trạng thái mặc định nếu chúng có border ở bất kỳ trạng thái nào khác.

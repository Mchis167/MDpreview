# TOC Scroll and Highlight Synchronization Strategy

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Tính năng Table of Contents (TOC) cần một cơ chế chính xác để xác định chương nào đang "active" khi người dùng cuộn trang. 
Nếu dùng mép trên trình duyệt (0px) làm ngưỡng:
1. Gây cảm giác trễ (phải cuộn qua hẳn heading thì TOC mới nhảy).
2. Không khớp với vùng tập trung của mắt người dùng (thường ở khoảng 1/3 phía trên màn hình).
3. Gây mâu thuẫn khi người dùng click vào mục lục (mục lục nhảy đến 0px nhưng hệ thống highlight có thể chưa nhận diện kịp).

---

## Các lựa chọn đã cân nhắc

### Option 1: Viewport Edge (0px)
- **Ưu:** Dễ tính toán.
- **Nhược:** Cảm giác bị trễ, không tự nhiên.

### Option 2: Fixed Offset Threshold (240px)
- **Ưu:** Khớp với vùng tập trung thị giác, tạo cảm giác nhạy bén (responsive).
- **Nhược:** Cần tính toán vị trí tương đối (relative) so với scroll container thay vì viewport.

---

## Quyết định

**Chọn: Option 2 — Fixed Offset Threshold (SCROLL_OFFSET = 240px)**

Thiết lập một hằng số `SCROLL_OFFSET = 240` làm "vạch đích ảo". Khi bất kỳ Heading nào vượt qua vạch này (tính từ đỉnh container), nó sẽ trở thành Active.
Đồng thời, khi click vào TOC, hệ thống sẽ cuộn Heading đó đến vị trí `SCROLL_OFFSET - 10px` để đảm bảo nó chắc chắn nằm trong vùng Active ngay lập tức.

---

## Hệ quả

**Tích cực:**
- Hành vi highlight và hành vi cuộn (scroll-to) hoàn toàn đồng bộ.
- Trải nghiệm tự nhiên, heading được highlight ngay khi vừa đi vào vùng mắt đọc chủ đạo.

**Tiêu cực / Trade-off:**
- Cần duy trì hằng số này đồng nhất trong toàn bộ logic của `TOCComponent`.

**Constraint tương lai:**
- Mọi thay đổi về vị trí Toolbar hoặc Header ảnh hưởng đến vùng nhìn đều phải cân nhắc cập nhật lại `SCROLL_OFFSET`.
- CSS Scroll Snap cũng phải được cấu hình tương ứng với giá trị này để đảm bảo tính thẩm mỹ.

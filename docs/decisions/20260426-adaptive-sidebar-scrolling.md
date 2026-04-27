# Adaptive Sidebar Scrolling Architecture

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Sidebar Trái chứa nhiều danh sách động (Recently Viewed, Explorer, Hidden Items) có thể thay đổi kích thước tùy thuộc vào số lượng file và trạng thái đóng/mở. 
Trước đây, các danh sách này sử dụng chiều cao cố định hoặc cuộn thủ công, dẫn đến:
1. Nhảy layout khi chuyển đổi giữa các mục.
2. Xuất hiện "Safe Zone" (khoảng trống 100px ở cuối) ngay cả khi danh sách rất ngắn, làm lãng phí diện tích.
3. Hiệu ứng làm mờ (Mask Fade) xuất hiện không đúng lúc, làm chữ bị mờ khi không cần thiết.

Cần một giải pháp quản lý vùng cuộn thông minh, tự động phản ứng với sự thay đổi của nội dung.

---

## Các lựa chọn đã cân nhắc

### Option 1: Manual CSS Flex Splitting (flex: 1)
- **Ưu:** Rất đơn giản, không cần JavaScript.
- **Nhược:** Các danh sách luôn chia đều không gian ngay cả khi một bên trống rỗng. Không thể tự động bật/tắt các hiệu ứng trang trí dựa trên nội dung.

### Option 2: ScrollContainer Molecule + ResizeObserver
- **Ưu:** UX cực kỳ mượt mà. Tự động hiện vùng đệm an toàn và hiệu ứng fade chỉ khi thực sự có cuộn (overflow). Cho phép danh sách "fit-content" cho đến khi đạt ngưỡng giới hạn.
- **Nhược:** Cần xử lý JavaScript (`ResizeObserver`), có thể ảnh hưởng nhẹ đến performance nếu có quá nhiều container.

---

## Quyết định

**Chọn: Option 2 — ScrollContainer Molecule + ResizeObserver**

Chúng tôi chọn giải pháp này vì nó mang lại trải nghiệm "premium" và tiết kiệm diện tích tối đa cho người dùng. Việc sử dụng `ResizeObserver` cho phép chúng ta tách biệt logic hiển thị (CSS) khỏi việc tính toán trạng thái cuộn, giúp code sạch và dễ bảo trì hơn.

---

## Hệ quả

**Tích cực:**
- Layout Sidebar ổn định, không còn hiện tượng nhảy vị trí header.
- Tiết kiệm không gian: Danh sách ngắn sẽ ôm sát nội dung (fit-content).
- Hiệu ứng thị giác (Fade/Safe Zone) chỉ xuất hiện khi cần thiết, tăng tính chuyên nghiệp.

**Tiêu cực / Trade-off:**
- Phụ thuộc vào `ResizeObserver` API.
- Cần quản lý vòng đời component chặt chẽ (re-mount) vì Sidebar thường xuyên render lại DOM.

**Constraint tương lai:**
- Tất cả các vùng cuộn trong ứng dụng (kể cả Sidebar Phải hoặc Search Results) NÊN sử dụng `ScrollContainer` molecule thay vì `overflow: auto` thuần túy.
- Tuyệt đối không hardcode `padding-bottom` cho nội dung cuộn, hãy sử dụng `--ds-scroll-safe-height` của `ScrollContainer`.

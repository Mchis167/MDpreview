# Minimalist Visual Feedback for Drag and Drop

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trong quá trình phát triển tính năng kéo thả, chúng ta đã thử nghiệm việc sử dụng các hiệu ứng Highlight phủ vùng (ví dụ: làm sáng toàn bộ cây All Files khi chuột ở vùng trống, hoặc làm sáng toàn bộ panel Hidden). Tuy nhiên, các phản hồi cho thấy việc highlight các vùng diện tích lớn gây ra sự xao nhãng về thị giác và không mang lại cảm giác chuyên nghiệp như các IDE hiện đại (VS Code, Sublime Text).

---

## Các lựa chọn đã cân nhắc

### Option 1: Full Area Highlights
- **Ưu:** Rất rõ ràng cho người mới bắt đầu, cho biết chính xác "vùng an toàn" để thả.
- **Nhược:** Gây "ô nhiễm thị giác", cảm giác UI bị giật và thô kệch khi các khối màu lớn xuất hiện liên tục.

### Option 2: Minimalist Highlights (Target-only)
- **Ưu:** Sạch sẽ, chuyên nghiệp, tập trung vào mục tiêu cuối cùng của hành động kéo thả.
- **Nhược:** Cần logic nhận diện vùng trống (Root/Hidden) cực kỳ tốt vì người dùng không có dấu hiệu thị giác rõ ràng để biết mình đã vào vùng "thả được" hay chưa.

---

## Quyết định

**Chọn: Option 2 — Minimalist Highlights (Target-only)**

Chúng ta quyết định gỡ bỏ mọi highlight phủ vùng (Area Highlights). MDpreview hướng tới một trải nghiệm người dùng cao cấp và tinh tế. Chúng ta bù đắp cho việc thiếu hụt dấu hiệu thị giác bằng cách tối ưu hóa logic "Root Detection" và đảm bảo file được thả đúng vị trí ngay cả khi không có hiệu ứng phát sáng vùng.

---

## Hệ quả

**Tích cực:**
- Giao diện Sidebar đồng nhất và chuyên nghiệp.
- Giảm tải cho engine render của Browser khi không phải vẽ lại các khối màu lớn liên tục trong khi dragging.

**Tiêu cực / Trade-off:**
- Người dùng có thể cảm thấy hơi "thiếu tự tin" trong những lần kéo thả đầu tiên vì không thấy vùng Root phát sáng.

**Constraint tương lai:**
- Tuyệt đối không thêm các class `drag-hover-root` hay `drag-hover-section` mang tính chất highlight toàn vùng vào CSS. Các highlight chỉ được phép áp dụng cho từng item cụ thể (folder, file).

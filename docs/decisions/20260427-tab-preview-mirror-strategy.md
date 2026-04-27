# ADR: Mirror Viewport Strategy cho Tab Preview

**Date:** 2026-04-27
**Status:** accepted (supersedes [20260427-tab-preview-rendering.md](file:///Users/mchisdo/MDpreview/docs/decisions/20260427-tab-preview-rendering.md))
**Author:** session 2026-04-27 09:55

---

## Bối cảnh

Tính năng Tab Preview trước đây sử dụng chiến lược "Slicing" (chỉ lấy 60 dòng) để render nhanh. Tuy nhiên, phương pháp này gặp khó khăn trong việc duy trì tính trung thực về bố cục (layout fidelity) khi file có các thành phần phức tạp như Mermaid diagrams, tables lớn hoặc hình ảnh. Người dùng yêu cầu một trải nghiệm "True Mirror" — tức là preview phải trông y hệt như viewer chính nhưng ở kích thước nhỏ hơn.

## Các lựa chọn đã cân nhắc

### Option 1: Fragmented Rendering (Slicing)
- **Ưu**: Tốc độ render cực nhanh.
- **Nhược**: Mất tính trung thực về bố cục, không đảm bảo vị trí cuộn (scroll parity) chính xác 1:1.

### Option 2: True Mirror Viewport (Scaling)
- **Ưu**: Đảm bảo 100% trung thực về bố cục. Vị trí cuộn khớp hoàn hảo với viewer chính.
- **Nhược**: Yêu cầu render nhiều nội dung hơn để đảm bảo layout không bị nhảy (đã được tối ưu bằng Windowed Slicing 2000 dòng thay vì 60 dòng).

## Quyết định

**Chọn: Option 2 — True Mirror Viewport Strategy**

Chúng tôi triển khai cơ chế "Cửa sổ ảo":
1.  **Fixed Width**: Cố định chiều rộng container preview ở mức **800px** (khớp với max-width của main viewer).
2.  **Scaling**: Sử dụng `transform: scale(0.38)` để thu nhỏ toàn bộ viewport vào khung preview 352px.
3.  **Scroll Parity**: Đồng bộ hóa `scrollTop` trực tiếp từ dữ liệu lưu trữ, đảm bảo vị trí hiển thị chính xác từng pixel.
4.  **Caching**: Triển khai bộ nhớ đệm (Map-based Cache) với TTL 60s để tránh render lặp lại khi di chuyển chuột qua lại giữa các tab.

## Hệ quả

- **Tích cực**: Trải nghiệm xem trước cực kỳ chuyên nghiệp và đáng tin cậy. Người dùng nhận diện ngay lập tức vị trí họ đang đứng trong file.
- **Tích cực**: Giảm thiểu lỗi layout do không phải tính toán lại kích thước cho khung preview nhỏ.
- **Thách thức**: Cần quản lý bộ nhớ đệm thông minh để tránh rò rỉ nếu người dùng hover hàng trăm file (đã giới hạn bởi cơ chế dọn dẹp theo thời gian).

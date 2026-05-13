# Decision: Monaco Active Line Styling Refinement

## Context
Người dùng gặp phải vấn đề một đường viền (border) bao quanh dòng đang soạn thảo trong Monaco Editor, tạo cảm giác giống như trạng thái "active" của một ô nhập liệu thông thường. Điều này gây khó chịu và không phù hợp với thẩm mỹ cao cấp (premium) của ứng dụng.

Mặc dù đã có các thiết lập theme và CSS để ẩn border, nhưng do cơ chế kế thừa (inheritance) và cách Monaco render lớp phủ (overlay), đường viền này vẫn xuất hiện trong một số tình huống focus.

## Decision
Chúng tôi quyết định thực hiện các thay đổi sau để kiểm soát và tinh tế hóa đường viền này thay vì xóa bỏ hoàn toàn:

1.  **Sử dụng Alpha Color cho Border**: Thay vì để màu xanh mặc định (opaque blue), chúng tôi chuyển sang sử dụng màu trắng với độ trong suốt thấp (`--ds-white-a10`, khoảng 10-15%). Điều này giúp đường viền vẫn tồn tại như một chỉ báo "active" nhưng không gây chói mắt hay khó chịu.
2.  **Cập nhật `_toHex` helper**: Nâng cấp hàm chuyển đổi màu sắc để hỗ trợ định dạng Hex 8 ký tự (`#RRGGBBAA`), cho phép truyền các giá trị Alpha từ Design System vào Monaco Theme.
3.  **Đồng bộ `focusBorder`**: Ghi đè cả `focusBorder` (viền bao quanh toàn bộ editor khi tập trung) bằng cùng một mức alpha tinh tế để đảm bảo tính nhất quán thị giác.
4.  **Linh hoạt CSS**: Xóa bỏ `border: none !important` trong CSS để cho phép các quy tắc của Theme được hiển thị chính xác.

## Status
`accepted`

## Consequences
- **Ưu điểm**: Giữ được tính năng chỉ báo dòng đang edit (một tiêu chuẩn của IDE) nhưng với thẩm mỹ hiện đại, tinh tế. Đồng bộ hoàn hảo với hệ thống Semantic Tokens.
- **Nhược điểm**: Cần đảm bảo hàm `_toHex` luôn parse đúng các giá trị biến CSS để không bị fallback về màu mặc định của Monaco.
- **Phạm vi**: Ảnh hưởng trực tiếp đến trải nghiệm soạn thảo trong `MonacoService`.

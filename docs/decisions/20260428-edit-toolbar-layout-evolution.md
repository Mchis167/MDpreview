# Edit Toolbar Layout and Icon Scaling

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Thanh công cụ chỉnh sửa Markdown (Edit Toolbar) trước đây sử dụng layout căn giữa (centered) và các icon có kích thước lớn (`isLarge: true`, 20px). Khi số lượng công cụ tăng lên (ví dụ: việc tách riêng H1-H6), layout căn giữa trở nên chật chội và không phân biệt rõ ràng giữa "công cụ định dạng" (Formatting Tools) và "hành động form" (Save/Cancel). Điều này làm giảm tính chuyên nghiệp và sự rõ ràng của giao diện người dùng.

---

## Các lựa chọn đã cân nhắc

### Option 1: Giữ nguyên Layout căn giữa (Status Quo)
- **Ưu:** Không cần thay đổi code hiện tại.
- **Nhược:** Cồng kềnh, không có phân cấp thị giác rõ ràng, khó mở rộng khi thêm nhiều nút mới.

### Option 2: Layout dàn trải (Spread) với Spacer và Icon nhỏ gọn
- **Ưu:** Phân biệt rõ ràng nhóm công cụ (bên trái) và nhóm hành động (bên phải). Giao diện trông tinh tế và chuyên nghiệp hơn nhờ icon 16px.
- **Nhược:** Cần thêm component spacer và điều chỉnh lại CSS của container.

### Option 3: Toolbar nhiều dòng
- **Ưu:** Chứa được rất nhiều icon.
- **Nhược:** Chiếm quá nhiều diện tích theo chiều dọc của trình soạn thảo.

---

## Quyết định

**Chọn: Option 2 — Layout dàn trải (Spread) với Spacer và Icon nhỏ gọn**

Việc sử dụng `.ds-edit-toolbar-spacer { flex: 1 }` giúp đẩy các nút Save/Cancel về bên phải, tạo ra luồng thị giác từ trái (soạn thảo) sang phải (hoàn tất). Icon 16px mang lại cảm giác hiện đại và cao cấp hơn so với kích thước 20px cũ.

---

## Hệ quả

**Tích cực:**
- Giao diện chuyên nghiệp, thoáng đạt.
- Phân cấp chức năng rõ ràng: nhóm định dạng bên trái, nhóm hành động/trợ giúp bên phải.
- Dễ dàng thêm các nhóm công cụ mới vào phía bên trái mà không làm xô lệch các nút hành động chính.

**Tiêu cực / Trade-off:**
- Cần quản lý chặt chẽ vị trí của các nút mới để không làm mất đi sự cân bằng.

**Constraint tương lai:**
- Mọi công cụ định dạng văn bản mới PHẢI được thêm vào nhóm bên trái.
- Các nút hành động toàn cục (Global Actions) hoặc bổ trợ (Help) nên được đặt ở phía bên phải sau spacer.
- Sử dụng kích thước icon mặc định (16px) cho mọi nút trên toolbar này để đảm bảo tính nhất quán.

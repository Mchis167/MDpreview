# Adaptive & Concentric Radius System

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Trong thiết kế hiện đại, khi một component con nằm trong một container có bo góc lớn (như toolbar, card), bo góc của con cần phải nhỏ hơn của cha theo một tỷ lệ nhất định để tạo hiệu ứng thị giác **đồng tâm (concentric)**. 
Nếu dùng các giá trị fix cứng (như `radius-panel` cho mọi nơi), các góc sẽ trông bị lệch và không thẩm mỹ khi đặt trong các lớp vỏ (shell) có độ bo lớn (`radius-shell`). 
Cần một cơ chế linh hoạt để các component nguyên tử (Atoms/Molecules) có thể thích ứng với radius của cha nó mà không làm hỏng tính nhất quán của Design System.

---

## Các lựa chọn đã cân nhắc

### Option 1: Fix cứng giá trị theo Token
- **Ưu:** Đơn giản, dễ code.
- **Nhược:** Không đạt được hiệu ứng đồng tâm. Nếu cha thay đổi radius, phải đi sửa tay từng con.

### Option 2: Tính toán thủ công trong JS
- **Ưu:** Chính xác tuyệt đối.
- **Nhược:** JS bị phụ thuộc (coupled) vào giá trị cụ thể của token CSS. Code JS trở nên phức tạp với các chuỗi `calc` dài.

### Option 3: Kế thừa động thông qua CSS Variables (Dynamic Inheritance)
- **Ưu:** Decoupling hoàn toàn JS khỏi Token. Chỉ cần thay đổi 1 biến ở cha, tất cả con tự động thay đổi theo. Đảm bảo tính đồng tâm qua công thức `calc(var(--parent-radius) - padding)`.
- **Nhược:** Cần quản lý tốt các biến local (`--_radius`) để tránh xung đột.

---

## Quyết định

**Chọn: Option 3 — Dynamic Inheritance**

Chúng tôi triển khai cơ chế "Adaptive Radius" bằng cách:
1.  Cho phép `DesignSystem.createButton` và `createSegmentedControl` nhận một tham số `radius` (có giá trị mặc định là init token).
2.  Ở cấp độ Organism (như `ChangeActionViewBar`), định nghĩa một biến "Single Source of Truth" là `--_bar-radius`.
3.  Các con bên trong sẽ tham chiếu đến biến này để tính toán radius của mình.

---

## Hệ quả

**Tích cực:**
- Giao diện đạt độ hoàn thiện cao (premium feel) với các đường cong đồng tâm hoàn hảo.
- Khả năng bảo trì cực tốt: Thay đổi radius của toàn bộ toolbar chỉ bằng 1 dòng CSS.
- JS không còn chứa các giá trị logic của CSS.

**Tiêu cực / Trade-off:**
- Các component nguyên tử cần được thiết kế hỗ trợ override biến `--_radius`.

**Constraint tương lai:**
- Khi tạo Organism mới có chứa các Moleclue/Atom bo góc, CẦN định nghĩa biến radius ở root của Organism đó và truyền xuống cho các con thông qua cơ chế này.
- Luôn sử dụng công thức `calc(var(--_parent-radius) - padding)` để giữ tính đồng tâm.

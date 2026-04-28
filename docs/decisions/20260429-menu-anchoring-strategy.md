# Anchored Positioning Strategy for Floating Menus

**Date:** 2026-04-29
**Status:** accepted
**Author:** session 2026-04-29

---

## Bối cảnh

MDpreview sử dụng các thành phần nổi (Floating UI) như Dropdowns, Context Menus và Tooltips. Trước đây, các menu này chủ yếu dựa vào tọa độ chuột (mouse cursor) để hiển thị. Tuy nhiên, khi phát triển các Molecule phức tạp như Combo Button, chúng ta cần các menu có thể "neo" (anchor) vào một phần tử DOM cố định và hỗ trợ các chế độ căn lề (alignment) khác nhau (trái, phải).

---

## Các lựa chọn đã cân nhắc

### Option 1: Sử dụng thư viện ngoài (như Popper.js hoặc Floating UI)
- **Ưu:** Xử lý tốt các trường hợp phức tạp (overflow, flip, shift).
- **Nhược:** Tăng kích thước bundle, thêm dependency vào project vốn đang hướng tới vanilla JS tối giản.

### Option 2: Sử dụng tọa độ Absolute (top/left) dựa trên `getBoundingClientRect`
- **Ưu:** Đơn giản, dễ implement.
- **Nhược:** Khi căn lề phải (align: right), nếu chiều rộng menu thay đổi sau khi render (ví dụ do icon tải chậm hoặc text động), menu sẽ bị lệch khỏi cạnh của nút bấm.

### Option 3: Sử dụng tọa độ Edge-based (right/bottom) và `requestAnimationFrame`
- **Ưu:** Menu luôn bám sát cạnh của phần tử neo bất kể chiều rộng của menu là bao nhiêu. `rAF` đảm bảo DOM đã được tính toán kích thước thật trước khi áp dụng vị trí.
- **Nhược:** Logic tính toán tọa độ phức tạp hơn một chút.

---

## Quyết định

**Chọn: Option 3 — Edge-based Positioning + rAF**

Chúng ta sẽ sử dụng thuộc tính `right` và `bottom` thay vì `left` và `top` cho các menu căn lề phải/dưới. Kết hợp với `requestAnimationFrame` để đo đạc kích thước menu ngay sau khi nó được thêm vào DOM nhưng trước khi hiển thị (opacity: 0), đảm bảo độ chính xác tuyệt đối.

---

## Hệ quả

**Tích cực:**
- Menu luôn thẳng hàng hoàn hảo với phần tử neo.
- Không bị phụ thuộc vào thư viện bên ngoài.
- Hiệu suất cao vì tính toán trực tiếp trên native DOM.

**Tiêu cực / Trade-off:**
- Cần xử lý thủ công các trường hợp menu bị tràn ra ngoài viewport (viewport collision).

**Constraint tương lai:**
- Mọi module menu nổi (như `MenuShield`) phải ưu tiên logic neo theo cạnh thay vì tọa độ chuột nếu có `anchor` element.

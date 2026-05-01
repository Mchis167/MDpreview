# ShortcutService (`renderer/js/services/shortcut-service.js`)

> Hệ thống quản lý phím tắt tập trung (Centralized Keyboard Shortcut Management). Đóng vai trò là "bộ não" điều phối toàn bộ tương tác bàn phím, giải quyết xung đột và quản lý quyền ưu tiên phím tắt.

---

## Mục đích

Giải quyết các vấn đề về phím tắt phân tán, xung đột phím giữa các module, và quản lý hành vi phím tắt thông minh khi người dùng đang ở trong các ô nhập liệu (`input`, `textarea`).

---

## Lifecycle

### `init()`
Khởi tạo trình lắng nghe sự kiện `keydown` toàn cục trên `document` với cơ chế **Capture Phase** (`capture: true`) để đánh chặn sự kiện trước khi nó tới các thành phần UI con.

---

## Key Functions

### `registerGroups(groups)`
Đăng ký danh sách các nhóm phím tắt vào hệ thống.
- **Input**: Mảng các object group (thường lấy từ `ShortcutsComponent.getShortcutData()`).

### `execute(id)`
Kích hoạt trực tiếp một hành động thông qua ID phím tắt mà không cần giả lập sự kiện bàn phím.

### `getShortcutData()`
Trả về toàn bộ dữ liệu phím tắt đang được đăng ký trong registry.

---

## Cơ chế Đánh chặn & Bảo vệ (Security & UX)

Hệ thống áp dụng các quy tắc sau để đảm bảo trải nghiệm người dùng không bị gián đoạn:

1. **Capture Phase**: Lắng nghe sự kiện sớm nhất có thể để chặn các phím tắt mặc định của trình duyệt hoặc các xử lý riêng của ô nhập liệu.
2. **Input Detection**: Tự động nhận diện khi người dùng đang focus vào `input`, `textarea` hoặc `contenteditable`.
3. **Whitelist (`allowedInInput`)**: Chỉ các phím tắt quan trọng (Save, Undo, Redo, Navigation với phím Mod) mới được phép kích hoạt khi đang gõ văn bản.
4. **Standard Editing Keys Bubbling**: Khi đang focus vào input, các phím tắt soạn thảo cơ bản (`Mod + A, C, V, X, Z, Y`) sẽ không bị chặn bởi các shortcut hệ thống (ví dụ: "Select All Tabs") để đảm bảo hành vi chọn văn bản mặc định của trình duyệt hoạt động bình thường.
5. **Numeric Override**: Phím số `1, 2, 3, 4` khi nhấn đơn lẻ sẽ ưu tiên nhập liệu, nhưng khi nhấn kèm `Mod` hoặc `Alt` sẽ kích hoạt chuyển Mode ngay cả khi đang gõ.

---

## Định dạng Dữ liệu Shortcut

Mỗi shortcut item trong registry có cấu trúc:
```js
{
  id: 'action-id',       // ID định danh duy nhất
  label: 'Label',        // Nhãn hiển thị
  keys: ['Mod', 'S'],    // Tổ hợp phím (Mod = Cmd trên Mac, Ctrl trên Windows)
  handler: () => {},     // Hàm thực thi (tùy chọn)
  allowInInput: false,   // Có cho phép chạy khi đang gõ văn bản không
  requireMod: true       // Bắt buộc phải có phím Mod mới kích hoạt
}
```

---

## Lưu ý quan trọng

- **Không dùng `e.stopPropagation()`**: `ShortcutService` dùng Capture Phase nên nó sẽ nhận sự kiện trước. Nếu module con muốn chặn phím tắt, nó phải được thực hiện ở phase sau.
- **Browser Conflict**: Các phím `Cmd + 1-4` thường bị trình duyệt chiếm dụng để chuyển Tab, nên Service hỗ trợ thêm `Alt + 1-4` làm phương án dự phòng mặc định.

---

*Document — 2026-04-30*

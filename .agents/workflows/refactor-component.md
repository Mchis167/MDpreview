---
description: 
---

✂️ Workflow: Refactor to Atomic (`/refactor-to-atomic`)

Workflow này dùng để bóc tách các đoạn HTML/CSS/JS cũ (legacy) và chuyển đổi chúng thành các Component chuẩn trong Design System.

## 📥 Input Requirements
- **Target Selector**: ID hoặc Class của khối HTML cần refactor (ví dụ: `#expanded-comment-modal`).
- **Target Level**: `atoms`, `molecules`, hoặc `organisms`.
- **New Name**: Tên mới cho component (ví dụ: `expanded-modal`).

---

## 🛠️ Execution Steps (Dành cho Agent)

### Bước 1: Phân tích & Thu thập (Audit)
1.  **HTML**: Đọc khối HTML từ `index.html`.
2.  **CSS**: Sử dụng `grep_search` để tìm tất cả các style liên quan đến selector đó trong thư mục `renderer/css/`.
3.  **JS**: Tìm các event listener hoặc logic điều khiển selector đó trong `renderer/js/`.

### Bước 2: Khởi tạo Component mới
Sử dụng workflow `/atomic-gen` để tạo các file:
- Chuyển HTML tĩnh thành cấu trúc `DesignSystem.createElement` bên trong hàm `render()` hoặc `init()` của JS.
- Chuyển CSS cũ sang file CSS mới, **bắt buộc** thay thế mã màu/spacing bằng `var(--ds-*)`.

### Bước 3: Di chuyển Logic
1.  Cắt (Cut) đoạn logic từ file JS cũ (ví dụ: `app.js`) và dán (Paste) vào hàm `init()` của component mới.
2.  Đảm bảo các tham chiếu đến `AppState` được giữ nguyên hoặc cập nhật cho đúng.

### Bước 4: Thay thế & Dọn dẹp (Cleanup)
1.  Xóa khối HTML cũ trong `index.html`.
2.  Nếu khối đó là tĩnh, để lại một thẻ `div` trống làm điểm gắn (Mount Point).
3.  Xóa các dòng CSS cũ trong các file `layout.css`, `modals.css`, v.v.
4.  Đăng ký component mới vào `design-system.css` và `index.html`.

---

## 🧪 Verification Checklist
- [ ] Giao diện giống hệt 100% so với trước khi refactor.
- [ ] Các sự kiện (click, input) vẫn hoạt động bình thường.
- [ ] Không còn mã màu hardcode trong file CSS mới.
- [ ] File JS cũ đã được làm sạch, không còn code thừa.

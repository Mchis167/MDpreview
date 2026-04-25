# MDpreview — Architecture Guide

Tài liệu này quy định cấu trúc thư mục và nguyên tắc tổ chức mã nguồn cho phần Renderer (Frontend) của MDpreview, dựa trên tư duy **Modular Monolith** và **Atomic Design V2**.

## 📁 Cấu trúc thư mục (renderer/js)

Mọi file Javascript mới phải được đặt vào đúng các thư mục chức năng sau:

### 1. `core/` — Nền tảng ứng dụng
Chứa các file khởi tạo và cầu nối hệ thống.
- `app.js`: Entry point, quản lý vòng đời và boot sequence.
- `electron-bridge.js`: Định nghĩa các API giao tiếp với Main Process (IPC).

### 2. `components/` — Giao diện (Atomic Design)
Chứa các thành phần UI có thể tái sử dụng.
- `atoms/`: Các thành phần nhỏ nhất (nút bấm, input, toggle).
- `molecules/`: Nhóm các atom (item trong list, header nhỏ).
- `organisms/`: Các khối giao diện lớn, phức tạp (Sidebar, TabBar, Toolbar).

### 3. `modules/` — Nghiệp vụ chính (Controllers)
Chứa logic điều khiển các tính năng cụ thể. Đây là nơi xử lý "State" và điều phối dữ liệu.
- `editor.js`, `tree.js`, `tabs.js`, `workspace.js`.

### 4. `services/` — Dịch vụ dữ liệu & Hệ thống
Chứa logic tương tác với API, File System hoặc các engine phức tạp.
- `file-service.js`, `tree-drag-manager.js`.

### 5. `utils/` — Tiện ích & Renderers
Chứa các hàm helper hoặc logic tích hợp thư viện bên thứ 3.
- `mermaid.js`, `zoom.js`, `code-blocks.js`.

---

## 📜 Nguyên tắc phát triển

1. **Component-First**: Khi tạo một thành phần giao diện mới, hãy đóng gói nó vào `components/` thay vì viết HTML tĩnh vào `index.html`.
2. **Logic Separation**: 
   - UI Logic (hiệu ứng, render) nằm trong **Component**.
   - Business Logic (lưu trữ, xử lý dữ liệu) nằm trong **Module** hoặc **Service**.
3. **Naming Convention**:
   - File Component: PascalCase hoặc kebab-case (ưu tiên kebab-case cho đồng bộ: `tab-bar.js`).
   - Class Component: Luôn dùng PascalCase (`TabBarComponent`).
   - Modules/Services: Luôn dùng kebab-case (`file-service.js`).
4. **Dependency Order**: Luôn khai báo script trong `index.html` theo thứ tự: `Core` -> `Design System` -> `Atoms` -> `Molecules` -> `Organisms` -> `Services` -> `Utils` -> `Modules` -> `App.js`.

---

## 🧪 Testing
Mọi Organism mới nên đi kèm với một file test tương ứng trong thư mục `tests/` sử dụng **Vitest** và **JSDOM**.

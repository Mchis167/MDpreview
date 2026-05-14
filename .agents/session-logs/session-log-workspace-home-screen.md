# [Workspace Home Screen] Session Log

## 📝 Tổng quan (Overview)
Thiết lập giao diện Home View mới cho ứng dụng MDpreview khi không có file nào được mở. Thay thế trạng thái trống (empty state) đơn điệu bằng một dashboard hữu ích bao gồm Search Bar trung tâm, Quick Actions (New file, Draft, Shortcuts) và danh sách Recent Files (2 cột). Task này cũng bao gồm việc giải quyết các lỗi phát sinh về quản lý trạng thái Tab và đồng bộ hóa hiển thị giữa Home và Markdown Viewer.

## ✅ Đã hoàn thành
- [Session 1 - 2026-05-14]
  - [14:45] Thiết lập kiến trúc và đăng ký icon `house` trong `design-system-icons.js`.
  - [14:50] Tạo Organism `HomeComponent` (JS + CSS) hỗ trợ Search, Quick Actions và Recent Files.
  - [15:10] Tích hợp logic điều phối hiển thị trong `app.js` (ẩn/hiện giữa Home và Markdown Viewer).
  - [15:20] Thêm nút Home vào `TabBarComponent`, tách biệt với nút Toggle Sidebar bằng divider.
  - [15:22] Fix lỗi `HomeComponent` bị shadowing do trùng tên class/singleton bằng cách đổi tên singleton thành `Home`.
  - [15:25] Sửa lỗi tab vẫn hiển thị active khi về Home bằng cách thêm `TabsModule.clearActive()`.
  - [15:28] Sửa lỗi Tab Preview bị trắng (0px height) khi Viewer đang ẩn bằng cách thêm fallback height 600px.
  - [15:30] Sửa lỗi treo Skeleton vô tận khi mở lại cùng một file sau khi về Home (reset viewer state).

- [Session 2 - 2026-05-14]
  - [15:40] Khôi phục hệ thống Scroll bị break do lỗi `display: block` ghi đè Flexbox layout.
  - [15:45] Sửa lỗi Project Map Viewport indicator bao trùm toàn bộ tài liệu.
  - [15:52] Tối ưu hóa ScrollModule: Chuyển sang theo dõi trực tiếp viewport thay vì mount container tĩnh.
  - [15:53] Chuẩn hóa CSS layout cho `#home-mount` và `#md-viewer-mount`.
  - [16:10] Sửa lỗi mất vị trí cuộn khi về Home bằng cách bảo toàn `activeFile` và chặn "ghost scroll" trong `ScrollModule`.
  - [16:15] Triển khai cơ chế `Visibility Guard` và đồng bộ Scroll Container giữa Monaco/Viewport.
  - [16:20] Sửa lỗi Draft/File creation: Chuyển hướng mọi hành động tạo mới qua `window.loadFile` (Orchestrator).
  - [16:25] Refactor `home.css`: Sử dụng local variables và chuẩn hóa prefix `ds-` cho toàn bộ component.
  - [16:27] Đồng bộ hóa `HomeComponent.js` với hệ thống class name mới.

- [Session 3 - 2026-05-14]
  - [20:50] Nâng cấp Recent Section: Triển khai trailing icon tự động hiển thị khi hover kèm hiệu ứng slide.
  - [20:55] Fix lỗi layout: Xử lý triệt để vấn đề tràn nội dung (overflow) trong Grid 2 cột bằng `minmax(0, 1fr)`.
  - [21:00] Tinh chỉnh UI: Cập nhật hover state cho label (primary color), tăng chiều rộng recent section lên 880px, sử dụng `border-strong` cho phân cách item.
  - [21:05] Cải thiện Typography: Ép metadata (đường dẫn file) hiển thị trên 1 dòng duy nhất với ellipsis.
  - [21:45] Sửa lỗi reload: Triển khai cơ chế lưu trạng thái "no active file" (Home View) khi người dùng chủ động nhấn nút Home.
  - [21:50] Fix lỗi Shortcuts: Chuyển hướng nút Shortcuts trên Home Dashboard sang `SearchPalette.show('shortcut')`.

- [Session 4 - 2026-05-14]
  - [21:55] Khắc phục triệt để lỗi Home View đè lên Editor (Overlap).
  - [21:56] Triển khai cơ chế `Async Guard` (_isHiding) trong `HomeComponent` để chặn việc render "ma" sau khi đã bị ẩn.
  - [21:57] Vá lỗ hổng điều phối (Orchestrator Bypass) trong `onModeChange('draft')` tại `app.js`.
  - [21:58] Tối ưu hóa transition cho "New File": Ẩn Home ngay lập tức để người dùng tập trung đặt tên file ở Sidebar.

## ⚠️ Quyết định quan trọng
- **Tách biệt HomeComponent**: Không thêm variant vào `MarkdownViewerComponent` để giữ nguyên tắc Single Responsibility. Home là một trạng thái ứng dụng cấp cao hơn là một mode của viewer.
- **Naming Convention (Home singleton)**: Sử dụng pattern `Home` cho singleton bridge thay vì `HomeComponent` để tránh shadowing với tên Class và đồng bộ với `MarkdownViewer`, `TabBar`.
- **Divider-first layout**: Các action trên TabBar bên trái (Sidebar toggle, Home) được đặt độc lập và phân tách bằng divider thay vì wrap chung, giúp giao diện trông chuyên nghiệp và dễ click hơn.
- **Dynamic Scroll Registration**: Thay vì gán Scroll container một lần lúc boot, hệ thống giờ đây tự động đăng ký lại container mỗi khi Viewer render. Điều này đảm bảo ScrollModule luôn trỏ vào phần tử DOM thực sự đang hiển thị (viewportk thay vì mount).
- **Component-Scoped Variables**: Sử dụng pattern local variables (`--_padding`, `--_gap-section`) trong `home.css` để dễ dàng tinh chỉnh layout mà không làm loãng hệ thống token toàn cục.
- **Strict DS Prefixing**: Áp dụng tiền tố `ds-` cho mọi class trong HomeComponent để phân biệt rõ ràng giữa logic của dự án và các thành phần third-party.
- **Grid Track Hardening**: Sử dụng `minmax(0, 1fr)` thay vì `1fr` thuần túy để ngăn chặn việc nội dung (như tên file dài) làm phình to cột Grid, phá vỡ layout 50/50.
- **UI-triggered Persistence for Home**: Quyết định không đặt lệnh `saveToStorage()` trong hàm `clearActive()` của `TabsModule`. Lý do: `clearActive()` được gọi trong nhiều ngữ cảnh tự động (như khi đang chuyển workspace). Nếu lưu vào lúc này, nó có thể ghi đè trạng thái trống vào storage của workspace mới trước khi dữ liệu thực tế được nạp, dẫn đến mất tab. Việc đặt ở nút Home đảm bảo tính chủ đích của người dùng.
- **Async Render Guarding**: Mọi Component có phương thức `render()` bất đồng bộ đều phải triển khai cờ hiệu `_isHiding` (hoặc tương đương) để tự hủy tiến trình nếu component bị ẩn trước khi render xong. Điều này cực kỳ quan trọng để tránh "UI ghosting" trong các ứng dụng SPA phức tạp.
- **Centralized View Orchestration**: Khẳng định `app.js` là nơi duy nhất quản lý việc ẩn/hiện giữa Home và Editor. Mọi module khác (Tabs, Tree) không được phép tự ý thay đổi visibility của các mount point mà phải thông qua `loadFile` hoặc `onModeChange` của orchestrator.

## 🐛 Vấn đề đã gặp & cách giải quyết
- ** shadowing class name**: `window.HomeComponent = ...` xung đột với `class HomeComponent`. Giải pháp: Đổi tên singleton xuất ra global thành `Home`.
- **Tab Preview height crash**: Khi `md-viewer-mount` bị `display: none`, `clientHeight` trả về 0. Giải pháp: Thêm kiểm tra `viewer.clientHeight > 0 ? ... : 600`.
- **Z-Index & Orchestration**: Việc ẩn hoàn toàn Viewer (`display: none`) là cách tốt nhất để giải phóng tài nguyên và tránh xung đột phím tắt của Monaco khi ở Home.
- **State Reset on Home**: Ép `MarkdownViewer` reset `file: null` khi về Home là bắt buộc để tránh `fileChanged` check chặn việc re-render khi mở lại cùng một file.
- **Scroll regression (display: block)**: Việc dùng `style.display = 'block'` trong JS vô tình ghi đè `display: flex` trong CSS, làm `.md-viewer-viewport` giãn nở vô hạn. Giải pháp: Ép kiểu `display: flex` trong JS hoặc đảm bảo CSS luôn thắng.
- **Project Map indicator crash**: Do viewport giãn nở vô hạn nên `clientHeight == scrollHeight`. Giải pháp: Khôi phục flex layout để viewport có chiều cao giới hạn, từ đó khôi phục lại tính chính xác của map.
- **Home Draft/File Creation bug**: Tạo draft/file mới từ Home bị lỗi không ẩn Home và không hiện Editor. Giải pháp: Ép mọi hành động tạo mới quay lại sử dụng `window.loadFile` (Orchestrator) thay vì gọi trực tiếp module cấp thấp.
- **Ghost Scroll (Reset về 0)**: Khi ẩn Viewer để về Home, trình duyệt kích hoạt sự kiện scroll cuối cùng với giá trị 0. Giải pháp: Thêm `Visibility Guard` vào `ScrollModule`, tuyệt đối không lưu nếu phần tử đang ẩn (`offsetParent === null`).
- **Lệch nhịp Scroll Container**: Khi chuyển mode Read/Edit, `ScrollModule` vẫn nhìn vào container cũ. Giải pháp: Ép `ScrollModule.setContainer()` đồng bộ lại container (Monaco vs Viewport) ngay khi thay đổi mode.
- **Add Tab Orchestrator Bypass**: Nút "+" trong Tab Bar gọi trực tiếp `onModeChange('draft')`, bỏ qua `loadFile()` dẫn đến không ẩn Home View. Giải pháp: Vá logic ẩn Home vào thẳng khối xử lý `draft` của `onModeChange`.
- **Async Render Race Condition**: `HomeComponent.render()` hoàn tất sau khi `hide()` đã chạy, ghi đè nội dung vào mount point đã bị ẩn. Giải pháp: Kiểm tra `this._isHiding` sau mỗi lần `await`.
- **Race Condition (Double Save)**: `setState` của viewer gọi `save` sau khi `app.js` đã ẩn viewer, gây ghi đè số 0. Giải pháp: Chặn `save` trong `setState` nếu đang chuyển sang mode `empty`.
- **Grid Item Overflow**: Tên file dài phá vỡ chiều rộng cột Grid. Giải pháp: Kết hợp `minmax(0, 1fr)` trên Grid container và `min-width: 0` trên các Flex item (`.ds-home-recent-name`) để kích hoạt `text-overflow: ellipsis`.
- **CSS Syntax typo**: Lỗi `font- color` gây mất style. Giải pháp: Audit và sửa lại thành `color` chuẩn.
- **Race Condition (Tab Loss)**: Việc thêm `saveToStorage()` vào `TabsModule.clearActive()` gây ra lỗi mất toàn bộ tab khi reload hoặc chuyển workspace. Giải pháp: Revert thay đổi trong `TabsModule`, export hàm `saveToStorage` và chuyển việc gọi lưu trạng thái sang click handler của nút Home trong `TabBarComponent`.
- **TypeError (Shortcuts Button)**: Nút Shortcuts trên Home gọi `ShortcutsComponent.open()` không tồn tại. Giải pháp: Chuyển hướng sang `SearchPalette.show('shortcut')`.


## 🔄 Đang dở / Session tiếp theo bắt đầu từ đây
- Task **Workspace Home Screen** đã hoàn thành các mục tiêu cốt lõi (UI, Orchestration, Persistence, Bug Fixes).
- Sẵn sàng cho việc triển khai thêm các widget bổ sung trên Home Dashboard nếu có yêu cầu (như Pin Documents, Workspace Stats).
- Cần theo dõi thêm hiệu năng render của Recent Files khi danh sách trở nên cực lớn (> 100 items).

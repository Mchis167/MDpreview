# Changelog

All notable changes to this project will be documented in this file.

## [1.17.0] — 2026-05-01 07:30

### 🎉 Added
- **StatusBadge Atom**: Triển khai thành phần chỉ báo trạng thái mới (Dot + Label) siêu tối giản, hỗ trợ đa dạng variant (`success`, `warning`, `error`, `info`), thay thế cho hệ thống InlineMessage cồng kềnh.
- **Unified Input Component (JS Factory)**: 
    - Triển khai `InputComponent` hoàn chỉnh với Label, Action Button và hệ thống Status Indicator tích hợp.
    - Hỗ trợ API động (`setStatus`, `setVariant`, `setLoading`) giúp điều khiển trạng thái input minh bạch từ script.
    - **Interactive Tooltips**: Tích hợp tooltip tương tác ngay trên nhãn input để cung cấp thông tin hướng dẫn mà không chiếm dụng không gian layout.
    - **Link Variant**: Bổ sung `.ds-input--link` chuyên biệt để hiển thị URL với font chữ code và cơ chế tự động truncate chuyên nghiệp.
- **Publish Configuration V2**: Tái cấu trúc toàn bộ giao diện cấu hình Publish dựa trên hệ thống Atom mới, tối ưu hóa không gian hiển thị và độ tinh tế của UI.
- **Standardized Icons**: Đăng ký các icon mới `circle-x` và `circle-check` phục vụ phản hồi trực quan cho quá trình xác thực (validation).

### 🔧 Changed
- **Publish Workflow Refinement**: 
    - Chuyển đổi ngôn ngữ sang hệ thuật ngữ chuyên nghiệp hơn (**Go Live**, **Public Address**, **Customize Link**).
    - Đồng bộ hóa nhãn nút bấm (**Update Link**) xuyên suốt quá trình kiểm tra Slug.
    - Nâng cấp luồng Unpublish: Đảm bảo bảng cấu hình luôn mở và chuyển về trạng thái chờ thay vì đóng sập popover.
- **Tooltip System Optimization**: Giảm độ trễ hiển thị tooltip từ **500ms** xuống còn **150ms**, mang lại cảm giác phản hồi tức thì (snappy).
- **Premium UI Polish**: 
    - Cố định chiều rộng Panel cấu hình để tránh hiện tượng nhảy layout khi chuyển đổi trạng thái.
    - Đồng bộ hóa khoảng cách lề Panel thông qua hằng số nội bộ `--_panel-px`.
    - Nâng cấp định dạng ngày giờ "Live since" sang format Medium Date + Short Time thân thiện.
- **MenuShield Enhancement**: Cập nhật cơ chế đóng menu thông minh, không tự động đóng khi người dùng tương tác với các Modal con.
- **Slug Validation UX**: Chuyển đổi cơ chế hiển thị lỗi/thành công khi kiểm tra Slug sang hệ thống Status Indicator tích hợp trong Input, đi kèm icon và text chuyên nghiệp.
- **Input Visibility Optimization**: Cập nhật CSS để tự động ẩn (`display: none`) vùng status khi không có nội dung, tránh tạo khoảng trống thừa trong các form.
- **Design System Factory Expansion**: Mở rộng `DesignSystem.js` với các phương thức `createInput`, `createInputGroup` và `createStatusBadge` làm proxy cho các Atom components.

### 🗑 Removed
- **Legacy UI Elements**: 
    - Xóa bỏ hoàn toàn hệ thống **Legacy Success Modal** và mã nguồn liên quan.
    - Loại bỏ nút "View all active links" và các subtitle trợ giúp dư thừa để tối giản hóa chân trang (footer).
    - Loại bỏ 100% debug loggers và `console.warn` trong luồng xử lý Publish.

### 🐞 Fixed
- **Modal Atom (Label Sync)**: Khắc phục lỗi mất nhãn trên các nút bấm trong `confirm` và `prompt` modal do sai lệch tên thuộc tính.
- **Input Alignment**: Sửa lỗi lệch lề của nhãn khi chuyển đổi giữa chế độ có và không có wrapper.
- **Input Padding Jumps**: Khắc phục lỗi rung lắc giao diện khi hiển thị thông báo trạng thái bên dưới ô nhập liệu.
- **Linting Compliance**: Đạt trạng thái **Zero Errors / Zero Warnings** sau đợt refactor lớn về hệ thống input và publish UI.

## [Not Commited] — 2026-04-30 07:50

### 🎉 Added
- **Self-Hosted Publishing Engine**: Hoàn thiện tích hợp hệ thống xuất bản tự lưu trữ (Self-Hosted) dựa trên **Cloudflare Workers & KV**, cho phép kiểm soát 100% dữ liệu và bảo mật document.
- **Global Publish Manager (Organism)**: 
    - Triển khai giao diện quản lý tập trung toàn bộ các tài liệu đã đăng trên Edge.
    - Hỗ trợ liệt kê, tìm kiếm và quản lý vòng đời Slug trực tiếp từ Cloudflare KV.
- **Smart Slug Lifecycle Management**: 
    - **Availability Check**: Tự động kiểm tra tính khả dụng của Slug trong thời gian thực khi cấu hình.
    - **Slug Renaming**: Cho phép đổi tên (move) Slug đã đăng mà không mất dữ liệu, tự động đồng bộ hóa trạng thái cục bộ.
    - **Force Overwrite**: Hỗ trợ ghi đè nội dung lên Slug cũ với cảnh báo trực quan, giúp người dùng linh hoạt tái sử dụng link.
- **Stale State Cleanup**: Tự động đối chiếu trạng thái cục bộ với Server khi mở bảng cấu hình; tự động gỡ bỏ trạng thái "Đã đăng" nếu dữ liệu thực tế không còn trên Cloudflare.
- **Full URL Preview**: Hiển thị đường dẫn công khai đầy đủ (Full Link) ngay trong UI cấu hình, hỗ trợ truy cập nhanh và sao chép.
- **Publish Management Shortcut**: Tích hợp lối tắt **"Manage Slugs"** trực tiếp vào menu **Settings** chính (nhóm Integrations).
- **Draft Publishing Support**: Cho phép xuất bản các bản nháp (**Drafts**) trực tiếp từ bộ nhớ ứng dụng mà không cần lưu thành file vật lý.

### 🔧 Changed
- **Publish UI Refactor**: 
    - Tái cấu trúc nút **Publish** nổi (Floating) để sử dụng hoàn toàn chuẩn **Design System** (`Button` & `ComboButton`).
    - Loại bỏ 100% các class CSS tùy biến (`floating-publish-btn`, `is-published`) và chuyển sang dùng hệ thống Token mặc định.
    - Cải tiến trải nghiệm: Trạng thái chưa đăng dùng nút đơn, trạng thái đã đăng dùng **ComboButton (Subtitle variant)** mang lại giao diện tinh tế hơn.
- **PublishService Infrastructure**: 
    - Tái cấu trúc toàn bộ logic xuất bản hỗ trợ cơ chế bất đồng bộ (async).
    - Triển khai hệ thống API proxy phía Server (`/api/worker-publish`) để bảo vệ **Admin Secret** không bị lộ dưới trình duyệt.
- **Cloudflare Worker Core**: Nâng cấp mã nguồn Worker hỗ trợ các endpoint quản trị: `/list`, `/rename`, `/check-slug`.
- **PublishConfigComponent Enhancements**: Tích hợp các chỉ báo trạng thái (Success/Warning/Error), thanh trạng thái "Checking...", và quản lý nút hành động theo ngữ cảnh khả dụng của Slug.

### 🐞 Fixed
- **Publish State Desync**: Khắc phục lỗi nút Publish không tự động quay lại trạng thái ban đầu sau khi Unpublish do thiếu `await` trong tiến trình bất đồng bộ.
- **Success Modal Logic**: Sửa lỗi modal "Thành công" tự động hiện ra khi người dùng gỡ bài (Unpublish) từ bảng cấu hình.
- **Settings Persistence Bug**: Sửa lỗi `SettingsService` không lưu được các phím cấu hình mới (`publishWorkerUrl`, `publishAdminSecret`) vào `AppState`.
- **Unpublish Desync**: Khắc phục tình trạng nhấn Unpublish chỉ xóa trạng thái cục bộ nhưng vẫn để lại nội dung trên Cloudflare; hiện đã đồng bộ xóa sạch dữ liệu trên KV.
- **Draft 404/500 Error**: Sửa lỗi Server không thể đọc nội dung của các file có đường dẫn ảo (`__DRAFT_...`) khi thực hiện xuất bản.
- **Slug Validation Regex**: Nới lỏng quy tắc kiểm tra Slug, hỗ trợ dấu gạch dưới (`_`), độ dài ngắn và tự động chuẩn hóa chữ thường.
- **Action Buttons Visibility**: Sửa lỗi mất icon và nút bấm trong Publish Manager do sai tên thuộc tính Design System (`icon` vs `leadingIcon`).

## [Not Commited] — 2026-04-30 05:25

### 🎉 Added
- **Publish Configuration Workflow**: Tách riêng tính năng Publish thành một quy trình cấu hình chuyên sâu (**PublishConfigComponent**), hỗ trợ tùy chỉnh **Slug (URL Link)** và **Mật khẩu** bảo mật tài liệu.
- **Advanced Input Group Atom**: Triển khai `DesignSystem.createInputGroup()` cho phép tích hợp các nút hành động (như **Copy Slug**) trực tiếp vào trong trường nhập liệu.
- **Enhanced Button Atom**: Bổ sung helper `setLoading()` và `setIcon()` cho phép cập nhật trạng thái và icon động cho nút bấm mà không cần render lại.
- **BaseFormModal Component (Organism)**: Triển khai component template tái sử dụng cho toàn bộ các form modal trong ứng dụng. Hỗ trợ phân nhóm ngữ nghĩa (Header, Body, Footer) và tích hợp sẵn hệ thống đường kẻ phân cách (Dividers).
- **Standardized Input Atom**: 
    - Triển khai `renderer/css/design-system/atoms/input.css` với các trạng thái hover, focus (accent glow) và error chuẩn.
    - Bổ sung helper `DesignSystem.createInput()` giúp khởi tạo nhanh các ô nhập liệu đồng nhất.
- **Web-based Publishing (Handoff.host)**: Triển khai cơ chế `publishToHandoff` trong `electron-bridge.js` sử dụng Fetch API, cho phép xuất bản tài liệu ngay trên môi trường trình duyệt (kèm thông báo toast về giới hạn tài nguyên cục bộ).
- **InlineMessage Molecule**: 
    - Thành phần hiển thị thông báo/hướng dẫn nội khối chuyên nghiệp với 4 biến thể: `info`, `success`, `warning`, `error`.
    - Tích hợp sẵn icon trạng thái và background bám sát Design System.

### 🔧 Changed
- **State-aware Publishing UI**: 
    - Tích hợp **Loading state** trên nút bấm trong quá trình gửi dữ liệu lên host.
    - Hiển thị thông báo trạng thái xuất bản cuối cùng kèm theo nút **Unpublish** để quản lý trạng thái cục bộ.
- **Integrated Label Management**: Tự động hóa việc khởi tạo nhãn (**Label**) cho Input/InputGroup thông qua tùy chọn `label`, đồng bộ hóa thẩm mỹ với hệ thống modal gốc.
- **Smart Popover Positioning**: Nâng cấp `MenuShield` ưu tiên định vị theo phần tử neo (**Anchor**), đảm bảo menu luôn hiển thị ngay dưới nút bấm và không đè lên UI kích hoạt.
- **Standardized Button Variants**: Chuẩn hóa các biến thể màu sắc `danger` và `danger-ghost` vào hệ thống core CSS (`button.css`).
- **Handoff API Configuration UI**: Tái cấu trúc hoàn toàn `HandoffTokenFormComponent.js` để sử dụng bộ ba `BaseFormModal`, `Input` và `InlineMessage`, loại bỏ 100% mã render DOM thủ công.
- **Modal Architectural Refinement**:
    - Triển khai cơ chế **Local Variable Padding** (`--_modal-px`) giúp quản lý khoảng cách ngang đồng nhất.
    - Cấu trúc lại DOM để các đường kẻ ngang (`.ds-form-divider`) tự động tràn 100% chiều ngang modal mà không cần dùng margin âm.
- **Design System Helper Expansion**: Cập nhật `DesignSystem.js` với các phương thức khởi tạo linh hoạt và refactor `showPrompt` để sử dụng chuẩn `createInput` mới.
- **Popover Interaction Logic**: Tinh chỉnh logic click-away trong `DesignSystem.js` để xử lý chính xác các tương tác trên modal con, ngăn chặn việc đóng popover cha ngoài ý muốn.

### 🐞 Fixed
- **Shortcut Collision Fix**: Sửa lỗi phím tắt `Mod + A` (Chọn tất cả tab) chặn hành vi bôi đen văn bản trong các ô nhập liệu.
- **Handoff Proxy Password Support**: Cập nhật route proxy server hỗ trợ truyền tham số mật khẩu khi upload tài liệu.
- **Form Action Alignment**: Cập nhật các nút hành động trong modal sử dụng `fit-content` (thay vì fill-width) và căn lề phải (`justify-content: right`) theo đúng quy chuẩn UX chuyên nghiệp.

## [1.16.0] — 2026-04-29 11:20

### 🎉 Added
- **Editor Floating Actions**: Triển khai nhóm nút hành động nổi (**Import** và **Append**) trong chế độ Editor, cho phép người dùng nhanh chóng chèn nội dung từ file Markdown bên ngoài.
- **Xcode-Inspired Syntax Highlighting**: 
    - Thay thế palette màu cũ bằng hệ màu Xcode Exact Palette chuyên nghiệp, mang lại độ tương phản cao và thẩm mỹ cao cấp cho Code Blocks.
    - **Premium Code Block Features**: Bổ sung thanh cuộn (scrollbar) siêu mỏng, padding chuẩn và nút Copy tích hợp Design System.
- **Native File Reading IPC & Web Cache**: 
    - Bổ sung trình xử lý `read-file` trong nhân Electron và cơ chế `FILE_CACHE` trong `electron-bridge.js` cho bản Web. 
    - Cho phép đọc bất kỳ file nào người dùng chọn mà không bị giới hạn bởi Workspace (bypassing Express security).
- **"Edit Selection" Action**: 
    - Bổ sung hành động chỉnh sửa nhanh đoạn văn bản đang chọn vào Menu chuột phải.
    - Triển khai cơ chế **Selection Persistence & Forced Sync**: Tự động chụp lại vị trí vùng chọn và ép xung trình soạn thảo highlight đúng dải ký tự đó khi chuyển mode.
- **Toast Progress System**: Nâng cấp hệ thống thông báo hỗ trợ **Progress Bar** (thanh tiến trình) và trạng thái `sticky`, giúp theo dõi các tác vụ dài như Rasterization hoặc File Copy.
- **Undo/Redo Support for Injections**: Nâng cấp `EditorModule.insertContent()` để tự động chụp snapshot lịch sử, đảm bảo các thao tác Import/Append có thể Undo/Redo hoàn hảo.
- **Markdown Editor Shortcuts**: Bổ sung phím tắt **Import Markdown** (`Mod + Alt + I`) và **Append Markdown** (`Mod + Alt + A`).

### 🔧 Changed
- **Premium UI Layering**: 
    - Áp dụng `isolation: isolate` cho container chính của viewer để tạo stacking context độc lập.
    - Nâng cấp `z-index: 9999` cho nhóm nút nổi, đảm bảo luôn hiển thị trên mọi lớp UI khác.
- **Flat Design Tooltips**: Loại bỏ phần "miếng tam giác" (anchor/arrow) của Tooltip theo yêu cầu tối giản hóa giao diện, tạo cảm giác phẳng và hiện đại hơn.
- **Persistent Floating Group**: Tái cấu trúc `MarkdownViewerComponent` để quản lý nhóm nút nổi như một singleton bền vững.
- **Icon Registry Expansion**: Đăng ký các icon mới `panel-left` (Sidebar) và `file-stack` (Copy as File).
- **Shortcut Icon Standardization**: Cập nhật và đồng bộ hóa icon phím tắt trên toàn bộ hệ thống (Guide, Search Palette, TOC Panel).

### 🐞 Fixed
- **Internal Server Error (500)**: Khắc phục triệt để lỗi server từ chối đọc file nằm ngoài Workspace.
- **DOM Reference Ghosting**: Sửa lỗi mất tham chiếu container khiến các nút hành động không hiển thị sau khi chuyển mode.
- **Bridge Syntax Error**: Sửa lỗi cú pháp và trùng lặp code trong `electron-bridge.js` gây crash bản Web.

## [1.15.0] — 2026-04-29 07:10

### 🎉 Added
- **Google Docs Integration (Smart Copy)**: 
    - Triển khai hệ thống sao chép thông minh chuyên biệt cho Google Docs, bảo toàn định dạng Rich Text, bảng biểu và blockquote.
    - **Inlining CSS Engine**: Tự động nhúng trực tiếp phong cách vào HTML để giữ đúng layout khi paste vào trình soạn thảo văn bản.
- **Retina-ready SVG Rasterization**: 
    - Cơ chế render biểu đồ Mermaid chất lượng cao trực tiếp tại Renderer-side bằng Canvas (2.0 scale).
    - Tự động thêm khung nền tối (`#1e1e1e`) cho biểu đồ khi xuất, đảm bảo các nét vẽ sáng màu luôn hiển thị rõ nét trên nền văn bản trắng.
- **Progressive UI Feedback**: Nâng cấp hệ thống Toast hỗ trợ **Progress Bar** và trạng thái `sticky`, hiển thị tiến trình xử lý biểu đồ theo thời gian thực (ví dụ: "Processing 3/10 charts...").
- **Copy as File (Native Electron)**: Tính năng sao chép trực tiếp file vật lý vào clipboard (hỗ trợ macOS `filenames`, `file-url`) để dán vào Slack, ChatGPT hoặc Finder.
- **Advanced Clipboard IPC**: Triển khai các handler `write-clipboard-advanced`, `copy-file-to-clipboard` và `rasterize-svg` để tận dụng tối đa sức mạnh hệ điều hành.
- **GDoc Copy Diagnostic Logging**: Hệ thống log chuyên sâu (`[✓] Success` / `[✗] Failed`) ghi lại chi tiết hiệu năng và kết quả render của từng biểu đồ trong Console.

### 🔧 Changed
- **Advanced Copy Menu UI**: Nâng cấp nút "Share" thành **Combo Button** với menu tùy chọn linh hoạt: Copy Markdown, Copy for GDocs, Copy as File, và Copy Absolute Path.
- **Sequential Chart Processing**: Tái cấu trúc luồng xử lý từ song song sang tuần tự (Sequential) để đảm bảo độ ổn định tối đa cho Clipboard và tránh treo ứng dụng khi xử lý tài liệu cực lớn.
- **High-Fidelity Style Inlining**: Mở rộng danh sách thuộc tính CSS nội suy (`text-anchor`, `dominant-baseline`, `letter-spacing`, v.v.) giúp biểu đồ giữ đúng định dạng văn bản gốc.
- **GDoc Copy Optimization**: Tinh chỉnh tỷ lệ scale (2.0x) để cân bằng giữa độ sắc nét Retina và kích thước bộ nhớ clipboard.

### 🗑 Removed
- **Unreliable Native Rasterization**: Gỡ bỏ cơ chế render SVG qua IPC của Electron do không tương thích tốt với cấu trúc CSS phức tạp của Mermaid.
- **"Copy Charts as Files" Feature**: Gỡ bỏ tính năng copy ảnh rời để tập trung hoàn toàn vào quy trình "Copy for Google Docs" đồng bộ.

### 🐞 Fixed
- **Mermaid Box Text Clipping**: Khắc phục triệt để lỗi mất chữ trong biểu đồ bằng cách ép font `Arial` và thuộc tính `white-space: pre` cho các thẻ văn bản SVG.
- **"Tainted Canvas" Security Error**: Giải quyết lỗi bảo mật trình duyệt khi xuất ảnh bằng kỹ thuật Unicode-safe Base64 encoding.
- **ViewBox & Scaling Alignment**: Sửa lỗi biểu đồ bị cắt hoặc sai tỷ lệ bằng cách bảo toàn thuộc tính `viewBox` gốc trong quá trình rasterization.
- **Chart Stuck Protection**: Thêm cơ chế Timeout 5s và bộ xử lý lỗi cho từng biểu đồ, ngăn chặn việc tiến trình copy bị treo vô hạn.
- **Parallel GDoc Transformation**: Nâng cấp `GDocUtil` hỗ trợ xử lý song song (`Promise.all`) các biểu đồ, giúp tăng tốc độ xử lý cho các tài liệu lớn (>70k ký tự).

### 🐞 Fixed
- **Tainted Canvas & Security Errors**: Khắc phục lỗi bảo mật khi render biểu đồ Mermaid bằng kỹ thuật Base64 kết hợp Native Image API.
- **SVG Blurriness**: Giải quyết triệt để vấn đề biểu đồ bị mờ khi paste vào văn bản bằng cơ chế render 4x và tối ưu hóa `viewBox` XML.
- **Clipboard Format Conflicts**: Sửa lỗi không paste được file trên MacOS bằng cách bổ sung đa định dạng URL/Text/Filenames.

## [1.14.0] — 2026-04-29 03:40

### 🎉 Added
- **Floating Action Group**: Triển khai nhóm các nút hành động nổi (Floating Group) giúp quản lý tập trung toàn bộ overlay buttons (TOC, Share, Sync) tại một vị trí, giải quyết xung đột layout và sự kiện.
- **Menu Shield & Anchored Positioning**: 
    - Nâng cấp `MenuShield` với chiến lược định vị theo phần tử neo (Anchor).
    - **Smart Flip & Bounds**: Tự động lật hướng (top/bottom/left/right) và giữ menu luôn nằm trong vùng an toàn của Viewport.
    - **Frame Synchronization**: Sử dụng `requestAnimationFrame` để đảm bảo định vị chính xác tuyệt đối sau khi DOM được render.
- **Combo Button Evolution**:
    - Tái cấu trúc `ComboButton` theo mô hình **Local Variables Pattern**, cho phép ghi đè mọi thuộc tính (màu sắc, kích thước, hiệu ứng) theo từng variant.
    - **High-Fidelity Transitions**: Bổ sung hiệu ứng xoay icon toggle khi mở menu và trạng thái `.is-open` chuyên nghiệp.
- **Stable Layout Border Pattern**: Triển khai kỹ thuật **Transparent Border** trên toàn bộ hệ thống Button để triệt tiêu hiện tượng rung lắc layout (Layout Shift) khi chuyển đổi giữa các trạng thái hover/active.
- **Share Icon Suite**: Bổ sung các icon `share` và `share-2` vào Registry nội bộ.
- **Architecture ADRs**: 
    - `menu-anchoring-strategy.md`: Quy định về cơ chế định vị menu thông minh.
    - `stable-layout-border-pattern.md`: Quy chuẩn kỹ thuật về việc sử dụng border tàng hình để ổn định giao diện.

### 🔧 Changed
- **Design Tokens Polish**: Tái cấu trúc file `tokens.css` với định dạng thụt lề chuẩn và bổ sung các token border chuyên biệt (`--ds-border-selected-subtle`, `--ds-border-xsubtle`).
- **Project Map Refinement**: 
    - Tối ưu hóa màu sắc vùng highlight (viewport indicator) để tăng độ tương phản và thẩm mỹ.
    - Tinh chỉnh khoảng cách thanh Zoom footer giúp giao diện gọn gàng hơn.
- **TOC Header Center Alignment**: Chuyển đổi tiêu đề TOC sang định dạng căn giữa tuyệt đối (Absolute Centering), tạo sự cân bằng thị giác khi kết hợp với nút đóng và switcher.

### 🐞 Fixed
- **Menu Clipping**: Khắc phục triệt để lỗi menu bị mất một phần khi mở ở sát mép màn hình thông qua cơ chế Safe Padding mới.
- **Layout Shift on Interaction**: Sửa lỗi giao diện bị nhảy 1px khi click hoặc hover vào các nút có viền trong hệ thống Design System.

## [1.13.0] — 2026-04-29 00:50

### 🎉 Added
- **Project Map (Mini-map)**: Triển khai bản đồ thu nhỏ tài liệu với chiến lược **True Optical Mirror** (SSR-based) đạt độ chính xác 1:1, hỗ trợ đầy đủ các thành phần phức tạp như Mermaid và CodeBlocks.
- **Instant Zoom Optimization**: Triển khai cơ chế phóng đại bản đồ tức thì (0ms latency) bằng CSS Transform, loại bỏ hoàn toàn việc gọi API render lại khi thay đổi tỉ lệ.
- **Dedicated Zoom Footer**: Bổ sung thanh điều khiển Zoom cố định ở đáy bản đồ với hiển thị phần trăm trực quan.
- **Interaction Polishing**: Hỗ trợ hai chế độ cuộn: **Smooth Scroll** cho thao tác click điều hướng và **Snappy Scroll** cho thao tác kéo (dragging) vùng highlight.
- **Auto-scrolling & Viewport Centering**: Cơ chế tự động cuộn bản đồ thông minh giúp vùng highlight luôn được giữ ở trung tâm vùng nhìn thấy của thanh bên khi người dùng cuộn tài liệu chính.
- **Project Map Diagnostic Logger**: Hệ thống giám sát và cảnh báo tàng hình (Diagnostic System) giúp phát hiện các lỗi giãn nở layout và mất dấu vùng highlight trong thời gian thực.
- **Architecture Documentation**: Bổ sung các ADRs mới về chiến lược phản chiếu hình ảnh (`mirror-fidelity`), ổn định thanh cuộn (`scroll-stabilization`) và tương tác Zoom (`zoom-interaction-strategy`).

### 🔧 Changed
- **Architecture Refactor**: Tái cấu trúc DOM của Project Map thành mô hình Flexbox (Body cuộn + Footer cố định) để tối ưu hóa trải nghiệm người dùng và độ ổn định của UI.
- **Standardized UI Components**: Chuyển đổi toàn bộ nút điều khiển sang sử dụng Design System atoms (`.ds-btn`) và Icon Registry tập trung.
- **TOC View Switching**: Tích hợp Project Map vào `TOCComponent`, hỗ trợ chuyển đổi linh hoạt giữa chế độ Outline và Map thông qua Segmented Control.
- **Unified Layout Constraints**: Áp dụng class `.is-map` lên `TOC Body` để tối ưu hóa không gian hiển thị (padding: 0) và kiểm soát tràn viền cho bản đồ.

### 🐞 Fixed
- **JS Height Enforcement Regression**: Khôi phục và nâng cấp lớp bảo vệ ép chiều cao dựa trên `parentElement.clientHeight`, đảm bảo bản đồ luôn hoạt động ổn định trên các tài liệu cực dài và chống giãn nở layout ngoài ý muốn.
- **High-Fidelity Clipping**: Khắc phục triệt để lỗi mất nội dung (clipping) khi tài liệu quá dài bằng kiến trúc **Track & Rail**.
- **Zoom Limits**: Tự động vô hiệu hóa các nút điều khiển khi đạt giới hạn tỉ lệ (20% - 100%).
- **TOC Panel Layout Expansion**: Khắc phục triệt để lỗi Flexbox tự động giãn nở chiều cao ngoài ý muốn bằng kỹ thuật **JS Height Enforcement**, đảm bảo Project Map luôn có thanh cuộn độc lập và hoạt động ổn định.
- **Viewport Indicator Sync**: Sửa lỗi lệch tọa độ vùng highlight trên các tài liệu có dung lượng lớn và cấu trúc phức tạp.

## [1.12.0] — 2026-04-28 14:40

### 🎉 Added
- **Modular Icon System**: Tách rời bộ icon SVG ra khỏi core logic của Design System sang module độc lập `design-system-icons.js`. Bổ sung API `DesignSystem.registerIcons(icons)` để hỗ trợ đăng ký icon động.
- **SyncService**: Triển khai service chuyên biệt quản lý việc đồng bộ hóa vị trí cuộn và con trỏ (Sync Scroll/Cursor) giữa các chế độ Read và Edit.
- **Smart Singleton Tooltip System**: 
    - Triển khai kiến trúc **Singleton Tooltip** (một phần tử duy nhất gắn vào `body`) giúp loại bỏ hoàn toàn vấn đề tooltip bị cắt (clipping) bởi các container cha có `overflow: hidden`.
    - **Smart Positioning Logic**: Tự động tính toán tọa độ và lật hướng (flip) tooltip giữa `top` và `bottom` để đảm bảo luôn hiển thị trọn vẹn trong Viewport.
    - **Flicker-free Interaction**: Sử dụng cơ chế theo dõi `currentTarget` và lọc `relatedTarget` giúp tooltip hiển thị ổn định 100%, không bị ẩn hiện khi di chuyển chuột qua các phần tử con (icon) bên trong nút bấm.
- **Design System Tooltip API**: 
    - Bổ sung `DesignSystem.initSmartTooltips()` để quản lý tập trung toàn bộ tooltip qua sự kiện delegation.
    - Cập nhật `DesignSystem.applyTooltip()` sử dụng hệ thống attribute `data-ds-tooltip` tinh gọn.
- **TOC Skeleton Loading**: Thay thế trạng thái "No headings found" bằng hiệu ứng skeleton shimmering (6 dòng với độ dài ngẫu nhiên) mang lại trải nghiệm chuyên nghiệp hơn.
- **Floating TOC Refinements**:
    - Triển khai hiệu ứng **Full Slide-in** từ biên phải màn hình với gia tốc nảy (spring physics) mượt mà.
    - **Content Offset Logic**: Tự động dịch chuyển nội dung văn bản (`padding-right`) khi TOC mở để tránh chồng đè.
    - **TOC Semantic Tokens**: Bổ sung bộ token Tier 3 chuyên biệt (`--ds-toc-width`, `--ds-toc-offset`, `--ds-transition-slow`) giúp quản lý tập trung.
    - **Active Button State**: Nút kích hoạt TOC hiện có trạng thái `.is-active` tinh tế với viền mỏng và nền trắng mờ 5%.

### 🔧 Changed
- **Architecture Polish**: Thực hiện đợt nâng cấp kiến trúc tổng thể, loại bỏ các thành phần trung gian và module di sản.
- **SearchPalette Integration**: Cập nhật `app.js` và `tree.js` để gọi trực tiếp `SearchPalette` thay vì đi qua `SidebarModule`.
- **Organism Decoupling**: Giải phóng `ChangeActionViewBar` khỏi logic nghiệp vụ đồng bộ, chuyển sang sử dụng `SyncService`.
- **Premium Tooltip Integration**: Nâng cấp toàn bộ các thành phần Design System (`IconActionButton`, `createButton`, `createHeaderAction`, `createSegmentedControl`) sang hệ thống tooltip thông minh mới.
- **Smart Orientation**: Tự động cấu hình hướng `top` cho các thanh công cụ ở đáy màn hình (`ChangeActionViewBar`) và hướng `bottom` cho thanh công cụ phía trên.
- **Tooltip CSS Refactor**: Chuyển đổi sang `position: fixed` và tối ưu hóa hiệu ứng Glassmorphism với `backdrop-filter: blur(12px)`.
- **Global Spacing Refactor**: Tái cấu trúc toàn bộ hệ thống Spacing sang chuẩn T-shirt scale đồng nhất (từ `3xs` đến `4xl`). 
    - Bổ sung các nấc quan trọng: `6px` (`--ds-space-xs`) và `28px` (`--ds-space-2xl`).
    - Tự động cập nhật toàn bộ tham chiếu trong 40+ module CSS/JS và tài liệu kiến trúc.
- **TOC Layout Evolution**:
    - **Trailing Chevron**: Di chuyển nút đóng/mở (toggle) từ đầu dòng sang cuối dòng, giúp nhãn nội dung được căn lề trái thẳng hàng.
    - **H2 Section Dividers**: Bổ sung đường kẻ phân cách tinh tế (`border-top`) giữa các mục cấp 2 để phân chia khối nội dung rõ ràng hơn.
- **TOC Component Standardization**:
    - Chuyển đổi nút đóng TOC sang atom `IconActionButton` để đồng bộ UI với hệ thống.
    - Refactor hệ thống thụt lề (Indentation): Bắt đầu từ `level-2` ở mức 0 và tăng tiến theo bước `12px` (`var(--ds-space-md)`).
    - **Positioning Sync**: Đồng bộ vị trí TOC Panel với Button thông qua hệ thống biến CSS nội bộ (`--_toc-top`, `--_toc-right`), đảm bảo logic layout tập trung tại một nơi.
- **Semantic Token Migration**: Hoàn tất việc chuyển đổi 100% các giá trị hardcoded trong `toc-panel.css` sang Tier 3 Semantic Tokens.
- **Layered Viewport Architecture**: Tái cấu trúc `MarkdownViewer` với một scrolling viewport chuyên biệt, cho phép các Overlay (như TOC) hoạt động ổn định ở vị trí `absolute` mà không bị ảnh hưởng bởi quá trình cuộn trang.
- **TOC Header Filtering**: Tự động loại bỏ thẻ `H1` khỏi danh sách mục lục để tập trung vào các mục chính của tài liệu.
- **Explicit Toggle Interaction**: Chuyển đổi sang cơ chế đóng/mở chủ động, không còn tự đóng khi click ra ngoài để tối ưu việc đối chiếu nội dung.
- **Transition Synchronization**: Đồng bộ hoàn toàn thời gian chuyển động (0.5s) và hàm số `cubic-bezier` giữa mục lục và nội dung văn bản.

### 🗑 Removed
- **Lucide Dependency**: Gỡ bỏ Lucide CDN khỏi dự án, thay thế hoàn toàn bằng hệ thống SVG registry nội bộ để tăng tốc độ tải và tính ổn định.
- **Legacy Components**: Xóa bỏ các module và file di sản không còn sử dụng: `toolbar.js`, `sidebar.js`, `sidebar-controller.js`.
- **Legacy CSS**: Loại bỏ `mode-switcher.css` và các selector mồ côi liên quan đến hệ thống sidebar cũ.

### 🐞 Fixed
- **White Screen on Mode Switch**: Sửa lỗi màn hình trắng khi chuyển đổi Mode sau khi chuyển Tab bằng cách đảm bảo các component con (Preview/Editor) luôn được cập nhật nội dung ngay cả khi đang bị ẩn.
- **Missing Tooltips**: Khôi phục các tooltip bị mất trên `TabBar` (nút New Draft, Sidebar Toggle) và `EditToolbar`.
- **Clipping Issues**: Giải quyết triệt để lỗi tooltip bị biến mất khi nằm trong các vùng nội dung bị giới hạn (Sidebar, Toolbar).
- **Double Sticky Conflict**: Giải quyết triệt để lỗi vỡ layout do xung đột nhiều thành phần `sticky` trong container viewer.
- **Token Typo**: Sửa lỗi tham chiếu token `--ds-white-a08` trong hệ thống màu.

## [1.11.0] — 2026-04-28 07:00

### 🎉 Added
- **Centralized Shortcut System**: Triển khai `ShortcutService` làm "bộ não" điều phối toàn bộ phím tắt trong ứng dụng, tách biệt hoàn toàn logic đăng ký và thực thi.
- **Shortcut Validation Suite**: 
    - **V2 Audit Script**: Công cụ phân tích tĩnh kiểm tra tính toàn vẹn của handler và sự tồn tại của DOM.
    - **Functional Stress Test**: Hệ thống kiểm tra tự động giả lập nhấn phím thực tế cho 30+ phím tắt, hỗ trợ quản lý focus (`blur()`) và kiểm tra trạng thái AppState.
- **Multi-layer Mode Switching**: Hỗ trợ đồng thời phím số đơn (`1, 2, 3, 4`) và tổ hợp `Mod/Alt + Số` để chuyển chế độ xem linh hoạt trong mọi ngữ cảnh.
- **Design System Icons**: Bổ sung bộ icon Lucide chuẩn cho `heading-1` đến `heading-6` vào `DesignSystem.ICONS`.
- **Edit Toolbar Granularity**: Chia nhỏ công cụ Header thành 6 mức độ chọn trực tiếp (H1-H6) trong một nhóm riêng biệt.
- **Design System Spacer**: Triển khai `.ds-edit-toolbar-spacer` (Molecule) hỗ trợ tạo khoảng trống linh hoạt để đẩy các nhóm hành động về phía bên phải.
- **Extended Tokens**: Bổ sung các token mới: `--ds-space-3xs` (2px), `--ds-shadow-xl` (đổ bóng lớn cho popover), và hệ thống `Z-Index` định danh.
- **Design System Component**: Bổ sung `DesignSystem.createSegmentedControl` hỗ trợ khởi tạo nhanh Molecule với bộ chỉ báo trượt (sliding indicator) và logic đồng bộ mode.
- **Silent Loading Mode**: Cơ chế `silent` loading cho phép cập nhật nội dung file (sau khi save hoặc qua socket) mà không gây nhấp nháy Skeleton, mang lại trải nghiệm mượt mà.

### 🔧 Changed
- **Adaptive Radius System**: Chuẩn hoá toàn bộ các thành phần con trong `ChangeActionViewBar` và `SegmentedControl` theo công thức bo góc đồng tâm `calc(var(--_radius) - var(--_padding))`.
- **Global Search Shortcut Evolution**: Chuyển đổi phím tắt tìm kiếm toàn cục từ `Mod+F` sang `Mod+P` để phù hợp với quy chuẩn Command Palette hiện đại (VS Code style).
- **Edit Toolbar Evolution**:
    - Chuyển đổi sang Layout dàn trải (Spread) giúp phân cấp rõ ràng nhóm công cụ và nhóm hành động (Save/Cancel).
    - Giảm kích thước icon xuống mức mặc định (16px) cho toàn bộ thanh công cụ để tăng độ tinh tế.
    - Cập nhật toàn bộ các nút bấm sang variant `primary` tiêu chuẩn (thay thế variant cũ).
- **Toolbar Repositioning**:
    - **ChangeActionViewBar**: Di chuyển xuống cạnh dưới màn hình (`bottom: 24px`) với hiệu ứng trượt lên (Slide Up).
    - **EditToolbar**: Di chuyển lên phía trên trình soạn thảo (`top: 20px`), tích hợp Tooltip Premium đảo ngược hướng.
- **Event Interception Upgrade**: Chuyển đổi sang `capture: true` cho listener toàn cục, cho phép `ShortcutService` đánh chặn phím tắt trước khi bị trình duyệt xử lý.
- **Intelligent Input Bypass**: Mở rộng danh sách trắng cho phép điều hướng ứng dụng (Sidebar, Mode Switch) ngay cả khi đang soạn thảo văn bản.
- **Markdown Viewer Masking**: Nâng cấp hệ thống Premium Scroll Mask cho trình xem Markdown, tối ưu hóa điểm dừng (stops) để tránh che khuất nội dung quan trọng.
- **CSS Architecture Cleanup**: Tái cấu trúc `editor.css` và `markdown.css`, loại bỏ hoàn toàn các màu sắc/spacing hardcode, đồng bộ hóa 100% với Tier 3 Semantic Tokens.
- **Tree Click Optimization**: Bổ sung cơ chế chặn tải lại file nếu người dùng click vào file đang mở trong sidebar.

### 🐛 Fixed
- **Shortcut Blocking Bug**: Khắc phục lỗi các phím tắt điều hướng bị chặn hoàn toàn khi người dùng đang focus vào trình soạn thảo.
- **Infinite Skeleton Bug**: Khắc phục triệt để lỗi kẹt màn hình chờ vô hạn khi người dùng hủy bỏ việc chuyển file lúc đang có thay đổi chưa lưu.
- **Sidebar Toggle Sync**: Sửa lỗi phím tắt `Mod+B` hoạt động không ổn định do phụ thuộc vào trạng thái click của phần tử UI ẩn.
- **Loading Error Handling**: Bổ sung xử lý lỗi khi render Markdown thất bại, tự động xóa Skeleton và hiển thị thông báo lỗi.
- **UI Alignment**: Khắc phục lỗi co giãn chiều cao (fill height) của các nút bấm bên trong `ChangeActionViewBar`.
- **Concentric Radius Consistency**: Sửa lỗi bo góc không đồng bộ tại các góc của container thanh công cụ hành động.

### 🗑 Removed
- **Legacy Components**: Xoá bỏ hoàn toàn variant `.ds-btn-primary-pill` và các tàn dư bo tròn tuyệt đối (pill shape).
- **Legacy CSS Trash**: Xoá file di sản `toolbar.css` và các selector mồ côi (`.footer-icon-btn`, `.btn` aliases).


## [1.10.0] — 2026-04-28 00:05
### 🎉 Added
- **Systems-Based Design Tokens**: Triển khai kiến trúc Semantic Token 3-tier mới giúp quản lý màu sắc theo ngữ cảnh sử dụng (Subtle, Accent, Surface, Control, Danger).
- **Semantic Shortcut Search**: Hỗ trợ tìm kiếm phím tắt thông qua từ khóa đồng nghĩa (tags), giúp người dùng dễ dàng tìm thấy lệnh ngay cả khi không nhớ tên chính xác (ví dụ: gõ "xem" ra "Read Mode", "xóa" ra "Delete Selected").
- **Extended Design System Icons**: Bổ sung bộ icon Lucide mới (`save`, `undo`, `redo`, `sidebar`, `maximize`, `mouse-pointer`, `arrow-up/down`, `briefcase`, `pin`) để hỗ trợ hiển thị trực quan hơn.
- **Surface & Subtle Dark Systems**: Bổ sung hệ thống Layer Surface và Subtle Dark hỗ trợ các biến thể tương phản cao và ghost buttons.
- **Search Result Count**: Bổ sung chỉ báo số lượng kết quả tìm thấy trong Palette, hỗ trợ hiển thị chính xác số ít/số nhiều.
- **Architecture Decisions**: Ghi lại các quyết định kiến trúc quan trọng tại `docs/decisions/` (Systems-based Tokens, Command Palette Evolution, Height Logic).

### 🔧 Changed
- **Search Palette Morphing**: Tái cấu trúc `SearchPalette` (Organism) với khả năng dãn nở chiều cao động, hiệu ứng mờ (blur) và smart scroll mask.
- **Shortcut Logic Refactor**: Chuyển đổi toàn bộ hệ thống phím tắt sang `SearchPalette`, hỗ trợ icon riêng biệt cho từng lệnh thay vì dùng chung icon bàn phím.
- **Bulk Token Migration**: Di chuyển hơn 20 file CSS (Atoms, Molecules, Organisms) sang hệ thống Semantic Token mới, chuẩn hóa trạng thái hover/active/selected.
- **TabBar Polish**: Cập nhật logic hiển thị tab (Active-wins) và tự động hóa khoảng cách nút qua logic `:only-child`.
- **Integrated Filter Badge**: Chuyển đổi `.palette-badge` sang phong cách "text highlight" tích hợp thẳng vào ô input.

### 🐛 Fixed
- **Folder Search Logic**: Khắc phục lỗi hàm `_flatten` bỏ qua các node thư mục, giúp tính năng tìm kiếm Folder hoạt động chính xác.
- **UI Consistency**: Hợp nhất các selector trùng lặp, triệt tiêu hiện tượng nhảy layout và đạt trạng thái **Zero Lint Errors**.
- **Ghost Spacing**: Sửa lỗi khoảng trắng thừa trong header của Palette khi không có filter badge nào đang được kích hoạt.

### 🗑 Removed
- **Legacy Components**: Xóa bỏ hoàn toàn UI `ShortcutsComponent` cũ và các tàn dư CSS/JS (`modals-misc.css`, `toolbar.js`) để tối ưu hóa codebase.
- **Legacy Tokens**: Loại bỏ hoàn toàn các token cũ (`hover-sm/md/lg`, `bg-overlay`, `bg-surface`) sau khi hoàn tất migration.


## [1.9.1] — 2026-04-27 12:35

### 🎉 Added
- **Pin Tab Shortcut**: Bổ sung phím tắt `Mod+Shift+P` giúp ghim/bỏ ghim tab đang active nhanh chóng.
- **Tabs API**: Export hàm `togglePin` hỗ trợ đảo ngược trạng thái ghim của tab.

### 🔧 Changed
- **Pinned Tab Closure**: Cho phép lệnh "Close Selected" (Cmd+W khi chọn nhiều) đóng cả các tab đang được ghim nếu người dùng chủ động chọn chúng.
- **Shortcuts Popover**: Tổ chức lại bảng hướng dẫn phím tắt chuyên nghiệp hơn, thêm phím tắt Pin Tab và loại bỏ các mục trùng lặp.

### 🐛 Fixed
- **Tab Selection Bug**: Sửa lỗi chọn dải tab (Shift+Click) hoạt động không chính xác khi danh sách có tab ghim. Logic đã được đồng bộ hóa hoàn toàn với thứ tự hiển thị trực quan.

## [1.9.0] — 2026-04-27 10:40

### 🎉 Added
- **Pin Tab Feature**: Triển khai khả năng ghim tab (Pin Tab) chuyên nghiệp:
    - **Persistent State**: Trạng thái ghim được lưu trữ và khôi phục tự động theo từng Workspace.
    - **Visual Branding**: Tự động hiển thị icon `pin` và áp dụng màu sắc nhấn (accent) cho viền dưới.
    - **Resilient Tabs**: Các tab đã ghim không bị đóng bởi lệnh "Close All" hoặc "Close Others".
- **Premium Tab Preview**: Nâng cấp tính năng hover preview với độ chính xác cao:
    - **Mirror Viewport**: Sử dụng cơ chế 1:1 scroll parity, đồng bộ hoàn hảo với vị trí cuộn.
    - **Smart Caching**: Hiển thị Preview tức thì (60s TTL) khi di chuyển giữa các tab.
    - **High-Fidelity**: Hỗ trợ render lên đến 10,000 dòng cho các file cực lớn.
- **Global Search Palette**: Nâng cấp toàn diện hệ thống tìm kiếm nhanh (Quick Open):
    - Tích hợp **Recently Viewed** và **Smart Path Truncation**.
    - **Debounce Logic**: Áp dụng độ trễ 150ms giúp tối ưu hiệu suất CPU.
- **Hidden Items Management**: Tính năng **"Hidden from Tree"** giúp làm sạch không gian làm việc:
    - Phím tắt **`Cmd + H`** để ẩn/hiện nhanh file và thư mục.
    - Tự động đóng Tab khi file bị ẩn và hỗ trợ hiển thị mờ trong kết quả tìm kiếm.
- **Centralized Settings Service**: Chuyển đổi sang mô hình quản lý cấu hình tập trung (`SettingsService`):
    - Quản lý Mapping, Persistence (LocalStorage) và Side-effects tại một nơi duy nhất.
    - Hỗ trợ **Dynamic Fonts** và **Accent Color** phản hồi tức thì.
- **Design System Expansion**:
    - **Atom ds-kbd**: Thành phần phím vật lý 3D chuẩn cho phím tắt.
    - **Molecule ScrollContainer**: Vùng cuộn tái sử dụng với hiệu ứng mask-fade mượt mà.
    - **Molecule SettingRow**: Thành phần dòng cài đặt chuẩn "Label | Control".
- **Interaction Enhancements**:
    - Hỗ trợ **Middle-click** để đóng tab và **Double-click** để toggle Pin.
    - Bổ sung chỉ báo **"Dấu chấm vàng"** (Modified Indicator) cho file chưa lưu.
- **Server Metadata API**: Bổ sung endpoint `/api/file/meta` truy xuất nhanh thông tin file (mtime, size).
- **Advanced Tree Navigation**: Thêm lệnh **Collapse All** (`Cmd + [`) và **Collapse Others** (`Shift + Cmd + [`).

### 🔧 Changed
- **Elastic Tab Layout**: Tab tự động co giãn theo độ dài tên file (`flex: 0 1 auto`) và tối ưu diện tích cho tab ghim.
- **Standardized DND**: Nâng cấp cơ chế **"Deep Scan"** và **"Invisible Shield"** tăng độ nhạy kéo thả.
- **Sidebar UX**: Tái cấu trúc phân bổ không gian Sidebar, tự động ẩn section Hidden khi trống.
- **Refined Masking**: Chuyển đổi hiệu ứng trailing mask sang trạng thái chỉ hiển thị khi hover.
- **Architecture Refactor**: Tách biệt hoàn toàn Business Logic khỏi UI Components (Settings, Search).
- **Performance Tuning**: Giảm thời gian chờ Preview (Debounce) xuống **300ms**.

### 🐛 Fixed
- **Server Payload Limit**: Khắc phục lỗi **`413 Payload Too Large`** bằng cách nâng giới hạn Express lên **50MB**.
- **UI Consistency**: Hợp nhất các selector trùng lặp, triệt tiêu hiện tượng nhảy layout và đạt trạng thái **Zero Lint Errors**.
- **Stability**: Sửa lỗi crash trong `tree.js` và `SearchPalette` liên quan đến null-safe checks.


### [1.8.0] — 2026-04-26 03:05

### Added
- **Molecule**: Triển khai **`MenuShield`** (Molecule) — hệ thống vỏ bọc menu nổi (Floating Glass Shell) hợp nhất, hỗ trợ Glassmorphism, hiệu ứng Blur cao cấp và quản lý singleton.
- **Molecule**: Triển khai **`SettingToggleItem`** (Molecule) — thành phần dòng cài đặt chuẩn với nhãn và nút gạt (label + toggle).
- **Molecule**: Triển khai **`sidebar-base.css`** giúp nhất quán hóa cấu trúc và phong cách Glassmorphism cho cả Sidebar Trái và Phải.
- **Molecule**: Tạo thành phần **`WorkspaceSwitcherComponent`** (Molecule) chuyên biệt, thay thế mã HTML hardcode cũ.
- **Component**: Tách biệt logic cài đặt Explorer sang **`ExplorerSettingsComponent`** chuyên biệt, hiển thị dưới dạng menu nổi.
- **UI/UX**: Nâng cấp **Smart Positioning Engine** cho `MenuShield` với cơ chế auto-positioning và toggle thông minh.
- **UI/UX**: Thêm nút **Scroll to Top** dạng floating mượt mà trong `MarkdownViewerComponent`.
- **Design System**: Triển khai hệ thống **Alignment Presets** (`center`, `bottom-left`, `custom`) cho Popover Shield.
- **Design System**: Triển khai hệ thống **Semantic Layer Tokens** mới (`--ds-bg-layer-main`, `--ds-bg-layer-sidebar`, etc.) quản lý độ sâu giao diện.
- **Icons**: Đăng ký các icon mới `sliders`, `check`, `chevron-right` vào `DesignSystem.ICONS`.

### Changed
- **Architecture**: Tái cấu trúc **`ContextMenuComponent`** sử dụng `MenuShield` làm lớp vỏ hợp nhất.
- **Architecture**: Tái cấu trúc **Sidebar Left** và **Right Sidebar** sử dụng chung phân tử `sidebar-base`, giảm 40% mã CSS lặp lại.
- **UI/UX**: Footer Sidebar Trái được tổ chức lại: `[Settings] [Shortcuts] [Spacer] [Explorer Preferences]`.
- **Shortcuts & Settings**: Chuyển đổi sang dạng **Floating Popover** neo ở góc dưới bên trái (`bottom-left` preset).
- **Design System**: Cập nhật **`SwitchToggle`** (Atom) hỗ trợ khởi tạo trực tiếp từ DOM element.
- **Visuals**: Tinh chỉnh viền menu xuống mức **Ultra-thin** (4% opacity) và đồng bộ bo góc `ds-radius-panel` (12px).
- **Tokens**: Loại bỏ hoàn toàn các "màu mồ côi" (orphan colors), đưa 100% về hệ thống 3-tier tokens.

### Fixed
- **Stability**: Khắc phục lỗi "phải click 2 lần mới mở được popover" bằng cách đồng bộ hóa trạng thái singleton.
- **UI/UX**: Khắc phục hiện tượng "viền dày" do trùng lặp class CSS và sửa lỗi hiển thị nút xóa trong `TreeItem`.
- **Tokens**: Sửa lỗi triệt để thông báo "token is not defined" và lỗi typo trong công thức tính toán `inset`.
- **Bug**: Sửa lỗi `InvalidCharacterError` trong `createElement` và lỗi hiển thị `line-clamp` trong `right-sidebar.css`.
- **Linting**: Đạt trạng thái **Zero Errors/Warnings** cho toàn bộ hệ thống (JS & CSS).
orkspace thành một phân tử độc lập.
- **Architecture**: Phân tách logic (Decoupling) giữa `WorkspaceModule` và UI thông qua hệ thống đăng ký instance linh hoạt.
- **Design System**: Loại bỏ hoàn toàn các "màu mồ côi" (orphan colors - mã rgba viết tay) trong `tokens.css`, đưa 100% về hệ thống 3-tier tokens.
- **Visuals**: Đồng bộ hóa toàn bộ bo góc và nền của Sidebars (Trái/Phải) và Main Glass theo hệ thống Layer và Surface mới.
- **Visuals**: Cập nhật `Context Menu` và `Tree View` sử dụng đúng các token semantic radius (`surface` và `widget`).

### Fixed
- **Linting**: Đạt trạng thái **Zero Errors/Warnings** cho toàn bộ hệ thống (JS & CSS).
- **CSS Architecture**: Khắc phục cảnh báo về thuộc tính không chuẩn trong `right-sidebar.css` bằng cách bổ sung `line-clamp` standard.
- **Tokens**: Sửa lỗi typo quan trọng trong công thức tính toán `inset` tại `tokens.css`.

## [1.7.0] — 2026-04-25 23:20

### Added
- **ContextMenuComponent (Molecule)**: Tái cấu trúc Menu chuột phải thành thành phần nguyên tử (Atomic Component) độc lập, hỗ trợ render động, phân tách logic và tái sử dụng dễ dàng.
- **Global Sidebar Shortcuts**: Kích hoạt hệ thống phím tắt toàn cục cho Workspace Explorer: `⌘N` (New File), `⇧⌘N` (New Folder), `⌘D` (Duplicate), `⌘⌫` (Delete) và `Enter` (Rename).
- **Import/Move from System**: Triển khai tính năng **Import (Copy)** và **Move** file từ hệ điều hành vào Workspace, hỗ trợ chọn nhiều file cùng lúc từ cửa sổ hệ thống.
- **System IPC Bridge**: Bổ sung `open-file-dialog` IPC handler và API `openFiles` hỗ trợ multi-selections và tùy chỉnh tiêu đề cửa sổ chọn file.
- **Smooth Sidebar Transitions**: Triển khai hiệu ứng đóng/mở mượt mà cho các mục Sidebar sử dụng `max-height` và `opacity`, mang lại cảm giác premium và tự nhiên.
- **Auto-Expand on Drag**: Tự động mở các mục sidebar đang đóng khi người dùng kéo file đè lên trên (hover) trong khoảng 600ms, giúp thao tác kéo thả thuận tiện hơn.
- **Premium KBD Styling**: Triển khai phong cách phím vật lý (KBD) nổi khối 3D cho các phím tắt trong Context Menu và bảng hướng dẫn, mang lại giao diện chuyên nghiệp như macOS.
- **Sidebar & Workspace Guide**: Bổ sung mục quản lý file vào bảng hướng dẫn phím tắt (`ShortcutsComponent`) với đầy đủ các tổ hợp phím mới.
- **Global Tab Deselect**: Thêm trình lắng nghe sự kiện click toàn cục và phím tắt **Escape** cho Tab Bar, giúp tự động bỏ chọn các tab khi click ra ngoài hoặc nhấn Esc.
- **Recently Viewed History**: Cải tiến logic "Recently Viewed" để loại bỏ file đang mở hiện tại khỏi danh sách hiển thị.
- **Full Codebase Audit Post-Refactor**: Thực hiện kiểm tra toàn bộ codebase để xác nhận tính toàn vẹn logic sau refactor.

### Changed
- **Code Cleanup & Documentation**: Xóa hoàn toàn tất cả các debug logger (`console.group`, `console.log`, `console.error`) và bổ sung JSDoc chi tiết cho các hàm sync (`syncCursor`, `scrollReadViewToLine`, etc.).
- **Smart Selection Display**: Chỉ bôi đen text khi user thực sự highlight (isRealSelection: true). Fallback scroll-by-line không tạo ra selection giả.
- **CSS Architecture Cleanup**: Hoàn tất token migration — chuyển CSS reset, scrollbar, `.btn` legacy aliases vào đúng các file module.
- **Unified Context Menu API**: Đồng bộ hóa cách khởi tạo menu chuột phải trên toàn bộ ứng dụng thông qua `DesignSystem.createContextMenu()`.
- **Smart Positioning Engine**: Nâng cấp thuật toán nhận diện biên cửa sổ, tự động lật (flip) hoặc đẩy (shift) menu.
- **Fluid Drag Physics**: Nâng cấp công cụ kéo thả cho cả Tab Bar và Sidebar Tree hỗ trợ di chuyển tự do trên cả hai trục (X và Y).
- **Header Action Button Wiring**: Nâng cấp `createHeaderAction()` để hỗ trợ `data-action-id` attribute.
- **SVG Consolidation**: Chuyển đổi toàn bộ các mã SVG cứng sang sử dụng tập trung qua `DesignSystem.getIcon()`.
- **Independent Tab/Tree Selection**: Tách biệt hoàn toàn logic chọn nhiều mục (Multi-selection) giữa Tab Bar và Sidebar.

### Fixed
- **Critical: Fuzzy Match Logic Broken After Refactor**: Lỗi cấu trúc if/else trong `syncCursor()` khiến fuzzy match bị skip khi exact match fail.
- **Critical: scrollReadViewToLine maxAttempts Bug**: Sửa lỗi forced scroll không fire ở lần retry cuối cùng.
- **Critical: ScrollModule ResizeObserver Race Condition**: Ngăn ResizeObserver override vị trí sync sau khi sync scroll thành công.
- **Cmd+↑/Cmd+↓ Broken Scroll-to-Top/Bottom**: Sửa Element ID sai (`md-viewer` → `md-viewer-mount`) khiến shortcuts không hoạt động.
- **Mermaid Zoom Modal % Label Not Updating**: Zoom via wheel giờ đây cập nhật đúng nhãn phần trăm.
- **Memory Leak & Event Safety**: Khắc phục lỗi rò rỉ bộ nhớ trong Context Menu và thêm Guard Clauses.
- **Workspace Switcher Squashing**: Khắc phục lỗi hiển thị khiến bộ chọn workspace bị bóp nghẹt.
- **Sidebar Layout Jumps**: Giải quyết hiện tượng nhảy layout khi đóng mở sidebar.
- **Infinite Skeleton Loading**: Khắc phục lỗi kẹt trạng thái loading khi click vào tab active.

### Removed
- **Legacy tokens.css**: Xóa hoàn toàn file `renderer/css/tokens.css` sau khi hoàn tất migration.


## [1.6.0] — 2026-04-25 07:55O

### Added
- **EditorModule.revert()**: Cơ chế khôi phục nội dung về trạng thái ban đầu (`_originalContent`) và làm sạch Undo/Redo stack.
- **MarkdownEditor._handleCancel()**: Phương thức điều phối việc khôi phục dữ liệu trước khi chuyển mode, đảm bảo tính nhất quán cho nút Cancel.
- **Console Test Workflow**: Thêm `6.console-test.md` để quy định tiêu chuẩn tạo script automation test trên trình duyệt.
- **Delta Cache Per-File**: Triển khai `syncCursor._deltaCache` để lưu trữ line offset bias riêng từng file, cho phép self-correction engine tự động điều chỉnh predictions dựa trên lịch sử đồng bộ.
- **Precise DOM Selection (TreeWalker)**: Thay thế `selectNodeContents` bằng `TreeWalker` để tìm vị trí text chính xác từng kí tự, hỗ trợ đầy đủ selection trong các cấu trúc HTML lồng nhau phức tạp.
- **End Extension Algorithm**: Thêm logic mở rộng match tới từ cuối cùng (length > 3) để tránh truncation khi bôi đen bị cắt ngắn so với dự kiến.
- **Smart Quote Normalization**: Normalize curly/smart quotes thành space trước word splitting, ngăn chặn ký tự đính kèm vào từ tiếp theo.
- **Resilient Scroll Restoration**: Tích hợp cơ chế khôi phục vị trí cuộn sử dụng `ResizeObserver`, đảm bảo cuộn chính xác 100% kể cả khi nội dung (ảnh, code block) có độ trễ khi render.
- **Render Lock Protection**: Triển khai hệ thống khóa trạng thái (`window._isMDViewerRendering`) và **Smart Guard**, ngăn chặn hoàn toàn việc trình duyệt tự ý ghi đè vị trí 0px trong quá trình chuyển đổi giữa các Tab và View Mode.
- **View Mode Integration**: Hỗ trợ đầy đủ chế độ `comment` (bình luận) và `collect` (gom nhóm) trong kiến trúc Atomic Viewer.
- **Scroll Position Persistence**: Tích hợp cơ chế tự động ghi nhớ và khôi phục vị trí cuộn trang cho từng file.
- **MarkdownLogicService**: Chiết xuất thuật toán xử lý văn bản và đồng bộ cursor (Sandwich Strategy) vào một Service độc lập.
- **Logic Unit Testing**: Bổ sung bộ Unit Test tự động cho `MarkdownLogicService` (8 kịch bản) và Sidebar (5 kịch bản).
- **Professional Loading States**: Triển khai hệ thống Skeleton Screen với hiệu ứng Shimmer cho toàn bộ ứng dụng.
- **SidebarLeftComponent**: Đóng gói Left Sidebar thành một Organism chuyên biệt.

### Changed
- **Smart Selection Display**: Chỉ highlight selection khi user thực sự bôi đen.
- **Removed Debug Logging**: Xóa hoàn toàn tất cả `console.group`, `console.log`, `console.error` dùng cho tracing.
- **Sync Loop Prevention**: Tách riêng `_suppressScrollSync` token để ngăn chặn scroll listener trigger re-sync trong cùng frame.
- **Mermaid Re-alignment Strategy**: Thay thế `setTimeout` bằng `MutationObserver` để đảm bảo scroll sau khi Mermaid render xong.
- **Word Tokenization**: Mở rộng regex split và giảm min word length để hỗ trợ Tiếng Việt tốt hơn.
- **Scroll Logic Decoupling**: Tách biệt việc quản lý scroll khỏi `AppState` toàn cục, mỗi container tự quản lý vị trí cuộn.
- **Selection Sync (Sandwich Strategy)**: Nâng cấp thuật toán sử dụng `TreeWalker` và bảo toàn `Match Length`.
- **Mermaid & Diagram Stability**: Nâng cấp trình xử lý Mermaid sử dụng `requestAnimationFrame`.
- **Advanced Code Block Header**: Tái cấu trúc `CodeBlockModule` với giao diện Header chuyên nghiệp và nút Copy.
- **Logic/UI Decoupling**: Hoàn thành việc tách biệt "bộ não" xử lý Markdown khỏi giao diện.
- **Dynamic Scroll Container**: Refactor `ScrollModule` để hỗ trợ container động thông qua `setContainer()`.
- **Architectural Modularization**: Hợp nhất và chuyển đổi logic sang cấu trúc hướng thành phần (Component-based).
- **Directory Restructuring**: Đại tu cấu trúc thư mục `renderer/js` thành `core`, `modules`, `services`, `utils`, `components`.

### Fixed
- **Edit Mode Cancel Bug**: Khắc phục lỗi tự động gọi `save()` hoặc hiện Confirm Dialog khi nhấn Cancel.
- **Critical: _isSyncing Permanent Lock**: Loại bỏ duplicate `hasFile` check gây lock khi khởi động app.
- **Triple DOM Query Inefficiency**: Cache `viewerMount` element để tối ưu hiệu năng.
- **Stale Element ID References**: Thay thế `md-viewer` → `md-viewer-mount` trên toàn hệ thống.
- **Unguarded Component Callbacks**: Thêm check tồn tại cho các callback trong TreeItemComponent.
- **Selection Flags Ignored**: Sửa lỗi flags `window._isGlobalSyncing` không được sử dụng hiệu quả.
- **Zero-Scroll Overwrite**: Loại bỏ hiện tượng reset scroll về 0px khi chuyển mode hoặc tab.
- **MarkdownPreview Crash**: Khắc phục lỗi `TypeError` khi truy cập file trong quá trình render.
- **Boot Sequence Stabilization**: Tối ưu hóa trình tự khởi động trong `app.js`.

### Removed
- **Legacy Click Sync Handler**: Xóa `_setupClickTracker()` và logic đồng bộ dựa trên click cũ.
- **Dead Code in Sync Timeout**: Xóa `_isSyncing_Internal` flag không sử dụng.
- **Legacy UI & Static HTML**: Loại bỏ ~70 dòng HTML tĩnh khỏi `index.html`, chuyển sang render động.

### Verified
- ✅ All element IDs fixed (md-viewer → md-viewer-mount)
- ✅ All component callbacks guarded
- ✅ All debug logs removed
- ✅ Sync lock issue resolved
- ✅ Error handling comprehensive
- ✅ Logic integrity via Unit Tests

## [1.5.0] — 2026-04-25 02:41

### Added
- **Workspace Integration**: Bổ sung tính năng "Open Workspace in Finder" vào menu chuột phải tại vùng trống của cây thư mục, hỗ trợ tối đa cho ứng dụng Electron.
- **FileService Module**: Triển khai `FileService.js` tập trung hóa toàn bộ các lệnh Electron IPC (fetch, create, delete, rename, move), giúp tách biệt hoàn toàn logic nghiệp vụ file khỏi UI.
- **Design System V2 Standardization**:
    - **IconActionButton Expansion**: Bổ sung các variant `isPrimary` (nền accent, chữ dark) và `isLarge` (32x32px) để phục vụ các thành phần giao diện nổi bật.
    - **Global Design Tokens**: Khai báo `--accent-hover-layer` và `--accent-hover` cho phép tạo hiệu ứng sáng lên 10% đồng nhất cho mọi thành phần dùng màu accent.
    - **SidebarActionButton & SidebarSectionHeader**: Triển khai các Component nguyên tử và phân tử cho Sidebar, hỗ trợ icon động và quản lý tooltip tập trung.
    - **Centralized Icon Registry**: Tích hợp các icon chuẩn (`search`, `sort`, `chevron-down`, `file`, `message-circle-plus`) vào `DesignSystem` để phục vụ kiến trúc Component mới.
- **Full Session Persistence (Server Sync)**:
    - Triển khai đồng bộ trạng thái cây thư mục (**Expanded Folders**) và thứ tự sắp xếp tùy chỉnh (**Custom Order**).
    - Tích hợp ghi nhớ vị trí cuộn trang (**Scroll Position**) cho từng file, đồng bộ xuyên suốt các phiên làm việc và tab.
    - Đồng bộ chế độ xem (**View Modes**: Read/Edit/Comment) riêng biệt cho từng file, không bị reset khi tải lại trang.
- **Enhanced Draft Content Persistence**: Nâng cấp cơ chế lưu trữ nội dung bản nháp (**Draft Content**), đảm bảo toàn bộ văn bản soạn thảo được đồng bộ lên server.
- **UI Layout Persistence**: Ghi nhớ và đồng bộ độ rộng của **Sidebar (Trái & Phải)** cùng trạng thái đóng/mở của các mục chức năng.
- **UI Extension Masking & Smart Rename**: 
    - Khởi tạo cơ chế tự động ẩn đuôi file `.md` trên toàn bộ giao diện và khi đổi tên, giúp không gian làm việc gọn gàng.
    - Tự động thêm lại đuôi `.md` khi lưu nếu người dùng không nhập, tránh xóa nhầm extension.
- **Advanced DND Engine (Drag and Drop)**:
    - **Area-Aware DND Detection**: Kết hợp `elementFromPoint` với tính toán tọa độ để nhận diện vùng thả file chính xác (70% "Into", 15% Reorder).
    - **Root-Drop Support**: Cho phép kéo thả file ra vùng trống của sidebar để di chuyển ra thư mục gốc (`.drag-hover-root`).
    - **Multi-select Drag**: Hỗ trợ kéo thả cùng lúc nhiều file đã chọn trong cả chế độ Standard và Custom order.
- **Professional Rename UX**: Hỗ trợ "Smart Click" (click vào item đang chọn để đổi tên), phím tắt **Enter/F2** và lưu giữ input đổi tên ngay cả khi file system re-render ngầm.

### Changed
- **Sidebar UX & Architecture Refactor (V2)**:
    - **UI/Logic Decoupling**: Chuyển đổi `TreeModule` sang sử dụng `FileService` cho mọi thao tác dữ liệu. Tách logic UI khỏi core logic của Tree (`_handleClick`, `_handleRename`, `_handleMouseDown`).
    - **Centralization**: Hợp nhất hoàn toàn kiến trúc hiển thị của **File Explorer** và **Recently Viewed** qua `TreeItemComponent` và `SidebarSectionHeader`.
    - **CSS Modularization**: Chuyển logic styling từ `sidebar.css` sang `tree-view.css` và trích xuất style của **Workspace Picker** sang module Design System chuyên biệt. Đơn giản hóa `index.html`.
    - **Layout Refinement**: Tối ưu hóa chế độ tìm kiếm (ẩn Header), tinh chỉnh margin/padding và dọn dẹp các đường kẻ phân cách để đạt được giao diện hiện đại.
- **Premium Drag-and-Drop Fidelity**:
    - **Zero-Artifact Dragging**: Thiết lập `visibility: hidden` cho item gốc khi kéo (VIP Drag) để không bị chồng lấp. Cố định hiệu ứng dãn khoảng trống ở mức **1 item**.
    - **Smart Indentation Guide**: Tự động ẩn thanh kẻ dọc khi một thư mục trở nên "trống tạm thời".
    - **Improved Detection Robustness**: Thay thế việc phụ thuộc vào `elementFromPoint` bằng tính toán tọa độ hình học, xóa bỏ dead zones.
    - **Automatic Cleanup**: Tự động dọn dẹp "Custom Order" trong thư mục nguồn khi di chuyển file.
- **Enhanced Multi-selection & Interaction Logic**:
    - **Smart Shift+Click**: Tự động dùng file đang mở làm mốc bắt đầu nếu chưa chọn file nào.
    - **Non-destructive Selection**: Chọn nhiều file (Cmd/Shift + Click) giờ đây không tự động mở file, tránh gián đoạn luồng công việc.
    - **Zero-Latency Navigation**: Tách tính năng Rename khỏi double-click để ưu tiên mở file ngay lập tức. Khôi phục logic Mouse Leave mượt mà.
- **Unified Floating Triggers & UI Cleanup**:
    - Chuẩn hóa **Comment Trigger** và **Bookmark Trigger** sang dùng `IconActionButton`.
    - Loại bỏ hiệu ứng `box-shadow` mặc định để mang đến thiết kế "Flat & Minimalist".
    - Hợp nhất cấu hình giao diện vào `AppState.settings` để quản lý tập trung.

### Fixed
- **Critical System Crash Stabilization**: Khắc phục triệt để lỗi `ReferenceError: getSessionModes/saveSessionModes is not defined`, lỗi `SyntaxError` khai báo trùng biến trong `tree.js`, và lỗi `TreeModule is not defined`.
- **View Mode Persistence**: Sửa lỗi đồng bộ `sessionModes` để giữ lại chế độ Read/Edit khi reload trang.
- **Sidebar UI & DND Regressions**:
    - Khắc phục các lỗi hiển thị: giao diện tìm kiếm bị bóp méo, thanh đường dẫn dọc của thư mục bị lệch trong lúc kéo, icon file bị mất hoặc sai tỉ lệ.
    - Giải quyết lỗi `ReferenceError: nearBottom` để tính toán offset DND hiển thị chuẩn xác.
    - Sửa lỗi click vào thư mục để kéo gây ra hiệu ứng đóng/mở ngoài ý muốn; giải quyết tình trạng kẹt trạng thái `.drag-hover` sau khi thả chuột.
    - Sửa lỗi mất chọn nhiều file bằng Cmd/Shift + Click.
- **Auto-rename Focus Loss**: Khắc phục vấn đề ô nhập liệu đổi tên bị mất focus khi File Watcher re-render tree ở dưới nền.
- **Module Compatibility Hotfix**: Khôi phục `setActiveFile` trong `RecentlyViewedModule` và hướng gọi `SidebarModule.activateSearch` để chặn lỗi crash ứng dụng.
- **debug-v2.js Persistence**: Phục hồi file `debug-v2.js` để ổn định việc A/B testing giao diện Sidebar V2.

### Removed
- **Legacy Draft & File Hygiene**: 
    - Xóa hoàn toàn bộ chuyển đổi Mode (Markdown/Draft) cũ, "New Draft" trong menu chuột phải, và các state/helper dư thừa ở `app.js`.
    - Di chuyển các file `.legacy` vào mục `.legacy_backup` để dọn kho.
- **Redundant Style & CSS Pruning**: Xóa bỏ các class CSS rác, Dead Code liên quan đến Drag-over cũ (hơn 100 dòng), và logic chèn SVG cứng (chuyển qua Icon Registry tập trung).


## [1.4.0] — 2026-04-23 22:45

### Added
- **Standard Move Drag Engine**: Implemented a dedicated "Move" mode for non-custom sort methods, featuring semi-transparent source items and a compact, glassy ghost proxy with accent color.
- **Intelligent Drop Detection**: Supports dropping onto folders, specific files (moving to their parent), and empty spaces (moving to root) with elegant visual highlights.
- **Proactive Metadata Sync**: Added `_syncCustomOrder` helper to automatically update custom order metadata during Move, Rename, and Create operations, eliminating "ghost" entries.
- **Global Flattened Level-based Drag Engine**: Replaced the sibling-only drag logic with a global mapping system that supports cross-parent reordering and level-based (indentation) targeting via X-axis movement.
- **Hybrid Spreading Effect**: Re-implemented the physical spreading gap where items slide up to fill holes and slide down to create new ones, supporting non-contiguous multi-selections.
- **Performance Optimizations**: Implemented **Binary Search ($O(\log N)$)** for nearest target detection and **Hardware Acceleration** (`will-change: transform`) for smooth 60fps rendering in large trees.
- **Auto-Collapse on Drag**: Folders now automatically collapse when they start being dragged to keep the UI clean and prevent layout clutter.
- **Server-side State API**: Triển khai lớp lưu trữ `/api/state` để lưu cài đặt, tab và bản nháp vào file `app_state.json` phía server.
- **Premium Tab Bar Reordering**: Implemented a "Zero-Destruction" horizontal drag-and-drop engine for tabs with VIP physics and auto-scroll.
- **Đồng bộ xuyên môi trường**: Đạt được sự thống nhất dữ liệu giữa Electron, Trình duyệt và Chế độ ẩn danh bằng cách sử dụng server làm nguồn dữ liệu duy nhất (Source of Truth).
- **Logic tự động khởi tạo**: Thêm quy trình di chuyển dữ liệu tự động giúp đẩy dữ liệu từ `localStorage` cũ lên server trong lần đầu khởi chạy.
- **Khóa thực thể duy nhất (Single Instance Lock)**: Triển khai `requestSingleInstanceLock` trong `main.js` để ngăn chặn xung đột cổng và đảm bảo tính nhất quán cho bản Electron.
- **Zero-Destruction DND Engine**: Re-engineered the sidebar reordering system to use surgical DOM manipulation instead of destructive re-renders, achieving flicker-free Apple-style movement.
- **Global Render Lock**: Implemented `isGlobalDragging` state to suppress background socket/timer updates during active drag operations, preventing UI interference.
- **Surgical Position Audit**: Developed an internal layout tracking system (`JUMP-TRACKER` and `Identity Audit`) to detect and eliminate sub-pixel layout shifts and node recreations.
- **Advanced Sidebar Sorting**: Implemented multi-mode sorting for the file explorer (Name, Last Updated, and Custom). Supports bidirectional toggling with visual indicators (Arrow/Checkmark).
- **Custom Drag-and-Drop Reordering**: Enabled manual file arrangement in "Custom Order" mode. Includes a minimalist horizontal drop indicator and an "empty spot" effect for a premium physical movement feel.
- **Global Keyboard Shortcuts**: Added `Escape` for instant deselection of files/tabs and `Delete`/`Backspace` for batch item removal.
- **Adaptive Sorting Icons**: Integrated exact Lucide SVG paths (`a-arrow-up`, `calendar-arrow-down`, `layers`) that dynamically update based on the active sort method.
- **Smart Custom Order Persistence**: Implemented automatic custom-order updates during file renaming to preserve manual sorting positions.
- **Workspace Metadata Enhancement**: Updated backend to include `mtime` (modified time) in the file tree response for precise time-based sorting.

### Fixed
- **Recursive Folder Deletion**: Resolved a critical UI hang by implementing recursive directory deletion using `fs.rmSync` in the backend.
- **UI Resilience**: Hardened the Design System's confirmation modal and tree deletion handlers with `try...finally` blocks to ensure the UI remains interactive on errors.
- **Path Resolution Security**: Hardened server-side path resolution for macOS/Windows to handle case-insensitivity and prevent partial directory name traversal.
- **Custom Sort Type Bias**: Fixed a bug where folders were always forced to the top even in "Custom Sort" mode, which caused items to "snap back" to the folder group.
- **Scattered Multi-drag Gaps**: Improved logic to correctly fill multiple gaps when dragging non-contiguous items.
- **Scroll Coordinate Accuracy**: Integrated `scrollDelta` into all coordinate calculations to prevent UI drift and indicator misalignment during auto-scrolling.
- **Critical Reference Errors**: Resolved various syntax and reference errors (e.g., orphaned `dragIndicator`) that caused the UI to freeze during drag operations.
- **Lỗi Settings Regression**: Khắc phục hàng loạt lỗi UI bao gồm mất color picker, các nút gạt không hoạt động và hiển thị sai grid ảnh nền.
- **Tính ổn định của TabBar**: Sửa lỗi `ReferenceError` và khôi phục các hàm persistence bị mất giúp hệ thống Tab hoạt động tin cậy hơn.
- **Xung đột phím tắt Search**: Thắt chặt điều kiện kích hoạt `Cmd+F` để không làm gián đoạn các tổ hợp phím hệ thống của macOS.
- **Icon Dropdown động**: Sửa lỗi mất mũi tên dropdown bằng hệ thống biến CSS SVG động, tự động thay đổi màu theo `accentColor`.
- **Scaling Text Zoom**: Sửa lỗi thanh trượt zoom không cập nhật nhãn phần trăm và không thay đổi kích thước văn bản thực tế.
- **Lưu trữ Electron**: Giải quyết triệt để vấn đề mất tab và cài đặt khi khởi động lại Electron do thay đổi origin cổng port.
- **Structural DND Jump**: Resolved a critical layout bug by moving the entire `tree-node-wrapper` instead of just the inner `tree-item`, preserving DOM integrity and CSS spacing.
- **Micro-flicker and Flash**: Eliminated visual artifacts by removing the redundant `render(true)` call and implementing invisible placeholders (`opacity: 0`).
- **Sorting Reliability**: Resolved issues with sorting stale metadata by ensuring the Node.js server correctly extracts and serves file modification timestamps.
- **Shortcut Context Safety**: Restricted global keyboard shortcuts to prevent interference when typing in input fields or textareas.

### Changed
- **Decoupled Drag Logic**: Reverted and decoupled the "VIP Reorder" engine from standard move operations to preserve the high-precision reordering calibration.
- **Refined Indicators**: Replaced layout-shifting borders and rough dashed outlines with non-intrusive `box-shadow` rings for a more "thanh thoát" aesthetic.
- **Professional Minimalist UI**: Removed the horizontal line and circle indicator in favor of the more intuitive physical gap (Spreading effect) for a cleaner "Zero-Clutter" aesthetic.
- **Improved Root Move Detection**: Simplified the "Move to Root" logic to use explicit targets (Header and Bottom Dead-zone) to avoid conflicts with in-folder reordering.
- **Tái cấu trúc Settings**: Chuyển logic zoom và toggle vào bên trong `SettingsComponent` để tăng tính đóng gói và độ tin cậy.
- **Phím tắt macOS chuẩn**: Cập nhật phím tắt Toàn màn hình hỗ trợ `⌘+⌃+F` và `⌘+⇧+F` cùng hệ thống biểu tượng phím premium (`⌘`, `⇧`, `⌥`).
- **Lưu trạng thái Debounced**: Áp dụng kỹ thuật debounce 500ms cho tất cả các thao tác lưu lên server để tối ưu hóa hiệu năng mạng và I/O.
- **Chuẩn hóa quy trình khởi động**: Sắp xếp lại trình tự boot trong `app.js` để đảm bảo trạng thái toàn cục được khôi phục trước khi các module UI khởi tạo.
- **Premium Drag Physics**: Refined the reordering feel with custom fluid `cubic-bezier(0.2, 0, 0, 1)` curves, creating a high-end "floaty" tactile experience for sibling displacement.
- **Instant UI Experience**: Removed item entrance animations and hover offsets in `sidebar.css` to achieve immediate visual feedback and zero-latency navigation.
- **Intelligent Hand-off Logic**: Optimized the final 'drop' sequence with a temporary transition lock (`is-handing-off`) to prevent siblings from "floating back" to old positions, ensuring they snap instantly to their new locations.
- **Selection Continuity**: Upgraded the drag proxy to inherit exact background colors from the source item, ensuring a seamless visual transition during the pick-up and drop phases.
- **Unified Multi-Selection System**: Achieved full feature parity between the **Sidebar** and **Tab Bar**. Both modules now support synchronized multi-selection via `Cmd/Ctrl` and `Shift` modifiers.
- **Advanced Tab Management**:
  - Implemented **Batch Closing**: Context menu on tabs now features a dynamic "Close Selected (X items)" action when multiple tabs are active.
  - Bidirectional Selection Bridge: Selecting items in the Sidebar instantly highlights corresponding tabs and vice-versa.
  - Enhanced Deselection: Integrated global `Escape` and "Click-to-Deselect" logic for both Sidebar and Tab Bar.
- **Global UI Polishing**: Applied consistent accent-color highlighting across all selected components for a unified workspace aesthetic.

## [1.3.0] — 2026-04-23 09:30

### Added
- **Hybrid Mode Persistence**: Implemented a sophisticated state-restoration system. Drafts now persist their view mode (`Read/Edit/Comment`) in `localStorage` across app restarts, while regular files maintain their mode within the current session's memory (defaulting to safe `Read` mode on restart).
- **Persistent Draft Naming**: Assigned permanent `displayName` metadata to drafts upon creation. This prevents drafts from being renamed (e.g., "Draft 3" becoming "Draft 2") when intermediate tabs are closed.
- **Smart Enumeration (Gap Filling)**: Refined the draft naming logic to automatically find the smallest available positive integer, ensuring a compact and organized draft list.
- **Atomic Tooltip Component**: Created a reusable `ds-tooltip` atom in the Design System with smooth animations and flexible positioning, replacing legacy browser tooltips.
- **Draft Limit Visual Feedback**: Added a premium helper tooltip and error-state hover effect to the "Add Tab" button when the 20-draft limit is reached.
- **Smart Markdown Logic**: Upgraded `EditorModule` with intelligent wrapping/unwrapping for styles (Bold, Italic) and smart block-prefix replacement (e.g., instantly switching between H1-H6, Lists, and Quotes).
- **Smart Filename Generation**: Implemented auto-incrementing default names (e.g., `untitled 1.md`) by scanning the workspace directory before saving.
- **File Conflict Detection**: Added a proactive check and confirmation modal to warn users before overwriting existing files during the save flow.
- **File Existence API**: Created a new server endpoint `/api/file/exists` to support safe saving workflows.

### Changed
- **Draft-to-File Workflow**: Optimized the save-to-workspace flow to bypass redundant "Unsaved Changes" dialogs and automatically transition to `View` mode.
- **File Deletion Lifecycle**: Refined the tab removal logic to always return to a clean **Empty State** when the active file is deleted, ensuring a predictable user experience.
- **Recently Viewed Filtering**: Explicitly excluded `__DRAFT_MODE__` from the Recently Viewed sidebar to keep the history focused on actual files.
- **Hardened State Sync**: Updated `setNoFile` to reset `AppState.currentMode` to `read`, eliminating "ghost" dirty states and unexpected unsaved changes warnings.

### Fixed
- **Button Styling Regressions**: Resolved a major UI bug where global buttons appeared abnormally large and rounded by removing conflicting CSS overrides in `popover-shield.css`.
- **Workspace Context Leakage**: Fixed a data corruption bug where switching workspaces caused stale tab/draft state to leak into the new context by hardening the boot sequence.
- **Focus Persistence**: Resolved a bug in `MarkdownHelperComponent` where clicking help items would steal focus from the editor, using `onmousedown` prevention.
- **Path Traversal Protection**: Hardened the server-side rendering route with a safe path resolution helper to prevent 404 errors and security risks with relative paths.
- **Tab Sync Syntax Error**: Fixed a critical syntax error in `tabs.js` related to duplicated function closures during state updates.

## [1.2.1] — 2026-04-23 08:05 (Previous Session Summary)

### Added
- **Multi-line Selection Sync (TC-13)**: Upgraded the `Edit` mode transition to support multi-line selection matching, searching within a 500-character context window for 100% accurate cursor restoration.
- **Focus-Persistence Mechanism**: Implemented `mousedown` prevention on toolbar items to stop the browser from clearing document selection during mode transitions.
- **Safe Rebuild Prompt**: Added a Design System confirmation modal for the "Rebuild & Relaunch" action to prevent accidental data loss.

### Changed
- **Instant Interaction Pipeline**: Globally eliminated "Smooth Scroll" behavior in both CSS and JavaScript modules (`tabs.js`, `collect.js`, `comments.js`, `toolbar.js`) to achieve immediate, snappier UI transitions.
- **Viewport-Aware Sync**: Replaced legacy scroll-percentage syncing with a precise, line-based line scanning algorithm that identifies the exact topmost visible element in `Read` mode.
- **Dynamic "Add Tab" Placement**: Relocated the Plus button to follow the tab list dynamically (`flex: 0 1 auto`), ensuring it stays next to the last tab when few are open and pins to the right edge during overflow without overlapping content.
- **Transparency-Optimized Borders**: Refactored the Tab Bar to use `border-left` logic (excluding first-child), eliminating the "double-opacity" visual bug caused by overlapping semi-transparent dividers.
- **Markdown Helper Interactivity**: Refined the Markdown Helper popover to prevent focus theft from the editor, allowing seamless style application without losing the cursor.
- **Draft-to-File Lifecycle**: Automated the UI state transition to hide Draft actions immediately after a successful "Save to Workspace" event.

### Fixed
- **TC-13 "Jump to End" Bug**: Resolved a critical regression where switching to `Edit` mode would incorrectly default the scroll position to the bottom of the document.
- **TabBar Layout Squashing**: Fixed a responsive bug where right-side action buttons were being crushed or overlapping tabs on narrow windows using `flex-shrink: 0` and `min-width: 0`.
- **Right Sidebar Syntax Error**: Fixed a `ReferenceError` in `right-sidebar.js` caused by a stray character during component initialization.
- **Workspace Delete Persistence**: Ensured all destructive workspace actions utilize the standardized `DesignSystem.showConfirm` flow for UI consistency.

## [1.2.0] — 2026-04-23 05:44

### Added
- **Inline Workspace Renaming**: Implemented seamless renaming by double-clicking the workspace name within the picker, featuring a focused input state and keyboard support (Enter/Esc).
- **Modernized Folder Browsing**: Integrated a native-feel folder picker in `WorkspaceFormComponent` using `webkitdirectory` for web fallbacks, eliminating manual path entry.
- **Ghost Folder Prevention**: Added `TreeModule.clear()` to ensure the sidebar file tree is instantly wiped during workspace transitions.
- **Context-Aware Highlighting**: Implemented a robust "Global Offset" search logic in `comments.js` that uses surrounding text fingerprints to accurately distinguish between identical keywords, especially within complex structures like Markdown tables.
- **Line-Wide Selection Context**: Upgraded `_getSelectionContext` to capture surrounding text from the entire `.md-line` instead of just the immediate text node, ensuring uniqueness for short, repeated words.

### Changed
- **Popover Shield Migration**: Fully transitioned Workspace Management from legacy modals to the premium Popover Shield Design System.
- **Standardized Action Buttons**: Migrated workspace delete buttons to the global `ds-item-delete-btn` class for unified hover aesthetics across the app.
- **Stateful UI Refresh**: Refactored `workspace.js` to use a dynamic `refreshContent` logic, ensuring the UI stays in sync after adding, renaming, or deleting workspaces.
- **Optimized Comment Export**: Updated the `copyAll` feature to normalize whitespace and newlines in exported reports, producing a cleaner, more professional output while maintaining raw data for internal highlighting.
- **Component Modernization**: Refactored the `RightSidebarComponent` empty state to utilize the centralized `DesignSystem.getIcon` registry, ensuring reliable icon rendering.
- **Sidebar Search UI**: Refined `.sidebar-search-container` padding in `sidebar.css` to improve visual balance.

### Removed
- **Legacy UI Pruning**: Deleted ~150 lines of obsolete rendering logic (`_renderList`), old event bindings, and redundant variables from `workspace.js`.
- **Deprecated Style Rules**: Removed workspace-specific delete/edit button CSS in favor of global Design System tokens.

### Fixed
- **Module Reference Errors**: Resolved multiple `ReferenceError` bugs (`_closeModal`, `_closePanel`) caused by deprecated modal function calls.
- **UI Synchronization**: Fixed a bug where the workspace listing failed to update its content after data modifications without a manual reload.
- **Highlight Visibility Gating**: Resolved a regression where comment highlights were visible in all application modes by removing redundant, ungated CSS rules in `markdown.css`.
- **DOM Runtime Error**: Fixed a `TypeError` in `_getSelectionContext` by ensuring `.closest()` is only called on Element nodes, correctly handling selections that start within Text nodes.

## [1.1.0] — 2026-04-23 01:40

### Added
- **Design System Icon Registry**: Implemented a central `ICONS` registry in `design-system.js` for instant, reliable SVG rendering without DOM scanning delays.
- **Icon Aliasing**: Added support for standard Lucide names (e.g., `trash-2`, `message-square`, `book-open`, `pen-line`) within the registry for better developer experience and compatibility.
- **Word-Level Highlighting**: Implemented precise, robust text range highlighting for both **Comments** and **Collect** (Bookmark) modules using a `DocumentFragment` wrapping system.
- **Auto-Fix Legacy Data**: Added a server-side routine to automatically repair null IDs in existing comment/bookmark files, ensuring data integrity.
- **Mode-Aware UI Filtering**: Implemented a `data-active-mode` gating system to only show relevant highlights (Comment vs Collect) when the specific mode is active.
- **Interactive Navigation**: Added automatic scrolling and pulse-highlight feedback when clicking on items in the Right Sidebar.
- **Floating Design System Triggers**: Restored and upgraded the floating `comment-trigger` and `collect-trigger` with premium Glassmorphism and animation.
- **Agent Rule: Mandatory Changelog Review**: Updated `.agents/rules/readchangelog.md` to force all AI agents to read `CHANGELOG.md` at the start of every session for better context retention.
- **Atomic TabBar Component**: Implemented a fully modular `TabBarComponent` (Organism) with a dynamic "Right Action" configuration system.
- **Scalable Action System**: Added support for extensible header actions (Rebuild, Fullscreen, Settings) within the new TabBar architecture.
- **Mutual Exclusion Sidebar Logic**: Implemented a "Single Sidebar" rule to ensure only one right-hand panel (Comment or Collect) is open at a time.
- **Premium Scroll Experience**: Implemented a smooth alpha-mask fade on the top and bottom edges of the Markdown viewer (`#md-viewer`).
- **Flexible Mask Configuration**: Added CSS variables for independent control of edge fading:
  - `--mask-top`: Controls the fade depth at the top edge (currently optimized at `240px`).
  - `--mask-bottom`: Controls the fade depth at the bottom edge (currently set to `80px`).
- **Edge Polish**: Eliminated "hard cuts" (chém cứng) where content meets the container boundaries, improving overall aesthetic fluidity.

### Changed
- **Sidebar Action Architecture**: Fully migrated Right Sidebar module headers to use the `DesignSystem.createHeaderAction` component, ensuring unified 48x48 action buttons.
- **Component Modernization**: Refactored `TabBarComponent` and `ChangeActionViewBarComponent` to utilize the new Icon Registry, eliminating "text-as-icon" rendering bugs and improving performance.
- **Floating Selection Triggers**: Updated `CommentsModule` and `CollectModule` triggers to use the registry, ensuring visual consistency and 100% rendering reliability.
- **Standardized Delete Styling**: Updated `ds-item-delete-btn` with unified padding and SVG injection via `DesignSystem.getIcon('x')`.
- **Right Sidebar Architecture**: Fully migrated `CommentsModule` and `CollectModule` to the unified `RightSidebar` (Organism) component, reducing redundant UI logic.
- **Design System Compliance**: Updated sidebar list items with `Roboto Mono` labels, `ds-text-clamp-5` for snippets, and consistent multi-layered shadows.
- **Architectural Decoupling**: Refactored `TabsModule` to act as a pure state controller, syncing application state with the `TabBarComponent` via an observer-style pattern.
- **Keyboard Shortcut Unification**: Updated global listeners in `toolbar.js` to target new Design System class names, ensuring 100% functional parity for `Mod+1/2/3/4` and `Mod+B`.
- **Legacy Pruning**: Deleted `renderer/css/tabs.css` and removed obsolete event listeners from `renderer/js/toolbar.js`, reducing JS bloat by ~150 lines.
- **Renamed Component**: Completed the migration from `SecondaryToolbar` to **`ChangeActionViewBar`**, updating all CSS, JS, and HTML references.
- **State Globalization**: Moved `AppState` to `window.AppState` to resolve cross-script visibility issues.
- **Boot Sequence Optimization**: Reordered the application initialization in `app.js` to guarantee UI components (like the Action Bar) are ready before the first workspace load.
- **Sidebar UI Reliability**: Added `!important` CSS overrides for sidebar widths to prevent manual resizer values from blocking the collapse transition.
- Updated `renderer/css/markdown.css` to integrate the linear-gradient masking system.
- Adjusted `#md-viewer` layout properties to support hardware-accelerated masking.

### Removed
- **Legacy SVG Constants**: Deleted dozens of redundant SVG string constants across `comments.js` and `collect.js`, significantly cleaning up the codebase.

### Fixed
- **Icon Rendering Regressions**: Resolved issues where icons (specifically `trash-2`) were displaying as raw text due to improper manual gán `innerHTML`.
- **Sidebar Header Alignment**: Refined Right Sidebar header padding (`0 0 0 16px`) and action group alignment to ensure a perfectly balanced, premium UI.
- **Comment Duplication Bug**: Resolved a critical regression where editing a comment created a duplicate record due to missing ID preservation in the frontend.
- **Web Version API Parity**: Fixed a server-side spread operator bug in the Express routes that caused ID corruption (`null` IDs) in the web environment.
- **Functional Sidebar Regressions**: Fixed missing SVG constants (`svgTrash`, `svgMsg`) and event binding failures in the sidebar boot sequence.
- **Interactive "X" Button**: Fixed the delete button failure by resolving the underlying null-ID issue.
- **Sidebar Selection Persistence**: Resolved a bug in `sidebar.js` where the "Recently Viewed" highlight remained active even when the workspace had no open tabs.
- **Editor Mode Synchronization**: Updated `editor.js` to correctly switch back to Read Mode using the new component selectors after saving or canceling edits.
- **Mode Switching Regression**: Resolved the issue where "New Draft" (`__DRAFT_MODE__`) failed to automatically trigger 'Edit' mode.
- **Ghost Toolbar Fix**: Ensured the `ChangeActionViewBar` strictly hides when no file is active or during `setNoFile` triggers.
- **Edge Browser Support**: Fixed "Invalid Property" warnings for `backdrop-filter` by refining CSS property ordering.
- **Overlapping Sidebar Bug**: Fixed a UI collision where both Comment and Collect sidebars could appear simultaneously.

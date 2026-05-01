# Publish to Handoff Feature

> Tính năng xuất bản tài liệu Markdown hiện tại lên dịch vụ hosting **Handoff.host** dưới dạng một trang web standalone, bảo toàn toàn bộ phong cách của Design System.

---

## Các module liên quan

| Module | File | Vai trò |
|---|---|---|
| `PublishService` | `renderer/js/services/publish-service.js` | Đóng gói nội dung và điều phối luồng upload. |
| `PublishConfig` | `renderer/js/components/organisms/publish-config-component.js` | Giao diện cấu hình Slug, Mật khẩu và trạng thái xuất bản. |
| `HandoffTokenForm` | `renderer/js/components/organisms/handoff-token-form-component.js` | Giao diện cấu hình API Token. |
| `Electron Bridge` | `renderer/js/core/electron-bridge.js` | Điều hướng yêu cầu upload giữa môi trường Desktop (IPC) và Web (Fetch). |
| `Handoff IPC` | `electron/ipc/handoff.js` | Xử lý upload thực tế trên Desktop, hỗ trợ đọc và đính kèm ảnh cục bộ. |

---

## Flow tổng thể

```
User Click Publish Button
    ↓
PublishConfigComponent.toggle() — Người dùng nhập Slug/Password
    ↓
PublishService.publish({ slug, password })
    ↓
_gatherAssets() & _createStandaloneBundle()
    ↓
window.electronAPI.publishToHandoff()
    ↓ (Electron)            ↓ (Web)
IPC Handler (Main)      Direct Fetch API
    ↓                       ↓
    https://handoff.host/api/upload/
```

---

## Chi tiết kỹ thuật

### 1. Đóng gói nội dung (Bundling)
**File:** `publish-service.js`

*   **`_gatherAssets(html)`**: Quét toàn bộ thẻ `<img>` trong tài liệu. Nếu là ảnh cục bộ (không phải URL http/data), nó sẽ phân giải thành đường dẫn tuyệt đối để chuẩn bị upload.
*   **`_bundleStyles()`**: Duyệt qua toàn bộ `document.styleSheets` để trích xuất các CSS rules của dự án, gộp lại thành một khối `<style>` duy nhất.
*   **`_createStandaloneBundle()`**: Tạo một file HTML hoàn chỉnh bao gồm:
    *   Nội dung đã render.
    *   Toàn bộ CSS đã đóng gói.
    *   Fonts (Inter, Roboto Mono) từ Google Fonts CDN.
    *   Các lớp CSS hỗ trợ theme (ví dụ: `ds-theme-dark`).

### 2. Upload Logic
**File:** `handoff.js` (IPC) & `electron-bridge.js` (Web)

*   **Dữ liệu gửi đi**: Sử dụng `FormData` (`multipart/form-data`) bao gồm:
    *   `file`: Nội dung HTML.
    *   `slug`: Tên URL tùy chỉnh (Custom Slug).
    *   `password`: Mật khẩu bảo vệ (tùy chọn).
    *   `assets[]`: Danh sách các file ảnh đính kèm (chỉ hỗ trợ trên Desktop).
    *   `note`: Thông tin phiên bản ứng dụng.
*   **Xác thực**: Sử dụng Bearer Token trong Header `Authorization`.

---

## Trạng thái & Persistence

| Thông tin | Vị trí lưu trữ | Key |
|---|---|---|
| API Token | `SettingsService` (localStorage) | `handoffToken` |
| Publish Info | `SettingsService` (localStorage) | `handoff_publish_info` (Object map by filePath) |

---

## Lưu ý quan trọng

- **Giới hạn bản Web**: Do hạn chế về bảo mật trình duyệt, bản Web không thể tự động đọc và upload các ảnh cục bộ từ đĩa cứng. Hệ thống sẽ hiển thị cảnh báo thông qua Toast khi thực hiện.
- **Copy URL**: Sau khi upload thành công, URL của tài liệu sẽ tự động được sao chép vào Clipboard.
- **Design System Consistency**: Tài liệu xuất bản sẽ có giao diện giống 99% so với trình xem trong ứng dụng nhờ cơ chế đóng gói CSS toàn phần.

---

*Document — 2026-04-30*

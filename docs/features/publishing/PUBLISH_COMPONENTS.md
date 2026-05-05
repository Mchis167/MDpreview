# Publish Components (`renderer/js/components/organisms/`)

> Bộ 3 thành phần UI quản lý trải nghiệm xuất bản và cấu hình Edge Worker.

---

## Kiến trúc

```
SettingsComponent (Trigger)
    ↓
PublishSettingsFormComponent   — [Cấu hình hạ tầng: URL, Secret]
    ↓
PublishConfigComponent         — [Cấu hình bài viết: Slug, Password, Unpublish]
    ↓
PublishManagerComponent        — [Quản lý tổng thể: List, Rename, Delete All]
```

---

## PublishConfigComponent

Popover điều khiển việc xuất bản một file cụ thể. Tích hợp trực tiếp vào thanh toolbar của Markdown Viewer.

### `init()` & `_checkSlug(slug)`
- **Advanced Validation UX**: 
    - **Error (Đỏ)**: Khi sai định dạng slug. Nút hành động chính bị vô hiệu hóa.
    - **Warning (Vàng)**: Khi slug đã tồn tại (Taken). Hiển thị icon `help-circle`, cho phép người dùng ghi đè.
- **Contextual Action Labels**:
    - **`Publish Changes`**: Hiển thị khi người dùng chỉ cập nhật nội dung (slug không đổi).
    - **`Update Link`**: Hiển thị khi người dùng thay đổi slug (đổi URL).
    - **`Unpublish`**: Nút gỡ bài (thay thế cho "Remove from Web").
- **Slug Redundancy**: Tự động ẩn trạng thái "Available" nếu slug nhập vào trùng khớp với slug hiện tại để giảm nhiễu giao diện.
- **Enter-to-Publish**: Hỗ trợ phím `Enter` khi đang focus vào ô nhập slug để kích hoạt lệnh đăng tải nhanh chóng.

### `Stale Check (Logic khởi tạo)`
Khi mở bảng, nếu App ghi nhận file đã đăng, nó sẽ tự đối chiếu với server. Nếu slug không còn tồn tại trên Cloudflare, App sẽ tự động xóa trạng thái cục bộ (**Self-Healing**).

---

## PublishManagerComponent

Modal quản lý tập trung toàn bộ tài liệu đã xuất bản trên Cloudflare KV.

### `_loadAndRender()`
1. Gọi `PublishService.listAllPublished()` để lấy danh sách từ Edge.
2. Hiển thị danh sách Slugs kèm các nút hành động nhanh.

### Các hành động:
- **Rename (Edit)**: Prompt nhập tên mới và thực hiện `renameSlug`.
- **Delete (Trash)**: Xác nhận và xóa vĩnh viễn nội dung khỏi KV.

---

## PublishSettingsFormComponent

Form cấu hình hạ tầng cho người dùng (Endpoint URL và Admin Secret).

- **Persistence**: Lưu trữ trực tiếp vào `localStorage` thông qua `SettingsService`.
- **Validation**: Yêu cầu đầy đủ URL và Secret để kích hoạt engine xuất bản tự lưu trữ.

---

## Cơ chế Đồng bộ trạng thái (State Sync)

Hệ thống sử dụng các callback và cơ chế `await` để đảm bảo UI luôn nhất quán:
1. **Callback `onPublished`**: Khi xuất bản hoặc gỡ bài từ `PublishConfigComponent`, nó sẽ kích hoạt callback để `MarkdownViewerComponent` vẽ lại các nút hành động nổi.
2. **Await Unpublish**: Các thao tác gỡ bài đều được `await` để đảm bảo dữ liệu đã được xóa sạch trong `AppState` trước khi UI thực hiện re-render.
3. **Global Refresh**: Mọi thay đổi về Slug (Rename/Delete) trong `PublishManagerComponent` đều kích hoạt sự kiện cập nhật để các bảng cấu hình đang mở có thể đối chiếu lại dữ liệu ngay lập tức.

---

---

*Document — 2026-05-06 (v1.8.1 - Advanced Publish UX & Button Labeling)*

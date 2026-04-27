# Tab Bar Component (`renderer/js/components/organisms/tab-bar.js`)

> Organism trung tâm quản lý giao diện thanh Tab, xử lý kéo thả (drag & drop), context menu và điều hướng file.

---

## Kiến trúc

```
TabBarComponent (container)
├── SidebarToggle       — Nút đóng/mở sidebar trái
├── TabList             — Danh sách các Tab (Molecules)
├── AddTabButton        — Nút tạo mới Draft
└── ActionGroup         — Nhóm nút hành động bên phải (Fullscreen, v.v.)
```

---

## TabBarComponent — Main Container

### `constructor(options)`
Khởi tạo instance với các callback điều hướng:
- `onTabSwitch`: Chuyển file active
- `onTabClose`: Đóng tab
- `onAddTab`: Tạo draft mới
- `onToggleSidebar`: Thu gọn/mở rộng sidebar

### `init()`
Thiết lập mount point và render lần đầu.

### `setState(newState)`
Cập nhật trạng thái và re-render toàn bộ thanh tab.
**State shape:**
```js
{
  openFiles: string[],     // danh sách đường dẫn file
  pinnedFiles: string[],   // danh sách file đã ghim
  dirtyFiles: string[],    // danh sách file chưa lưu
  activeFile: string,      // file đang hiển thị
  selectedFiles: string[]  // danh sách file đang được chọn (multi-select)
}
```

### `render()`
Hàm render chính, xây dựng cấu trúc DOM sử dụng các phương thức private (`_createTabItem`, `_createActionBtn`).

---

## Tính năng nổi bật

### 1. VIP Drag & Drop Engine (`_initTabDrag`)
Hệ thống kéo thả tab mượt mà, chuyên nghiệp:
- **Horizontal Lock**: Khóa chặt trục Y, chỉ cho phép tab trượt ngang dọc theo thanh Bar.
- **Group Partitioning**: Giới hạn phạm vi hoán đổi vị trí — Tab Ghim chỉ kéo trong vùng Ghim, Tab Thường chỉ kéo trong vùng Thường.
- **Drag Proxy**: Sử dụng bản clone của phần tử để đảm bảo 60fps khi kéo.
- **Dynamic Spreading**: Tự động tính toán vị trí và đẩy các tab xung quanh (`translateX`) tạo không gian trống một cách vật lý.
- **Auto-scroll**: Tự động cuộn thanh tab khi kéo sát lề trái/phải.
- **Sync**: Gọi `TabsModule.reorder()` để cập nhật dữ liệu sau khi thả.

### 2. Context Menu (`_showContextMenu`)
Menu chuột phải cho Tab cung cấp các lệnh nhanh:
- **Close Tab** (`⌘W`)
- **Close Others**: Đóng các tab khác
- **Close All**: Đóng toàn bộ tab
- **Close Selected**: Chỉ hiển thị khi có nhiều tab đang chọn

### 3. Pin Tab Feature
Cho phép "ghim" các tab quan trọng lên đầu danh sách:
- **Pin Icon**: Hiển thị icon ghim ở vị trí leading của tab.
- **Priority Rendering**: Các tab được ghim luôn nằm ở đầu thanh Tab, giữ nguyên thứ tự ghim (cái nào ghim trước nằm trước).
- **Resilience**: Pinned tabs không bị ảnh hưởng bởi lệnh **Close All**, **Close Others**, hoặc **Close Selected**.
- **Removal**: Chỉ bị đóng bởi lệnh đóng tab đơn lẻ hoặc khi được **Unpin**.
- **Context Menu**: Bổ sung hành động **Pin/Unpin Tab** vào menu chuột phải.

### 4. Elastic Fit-content Layout
Bố cục thanh Tab linh hoạt (`flex: 0 1 auto`):
- **Fit-content Width**: Các tab tự động co giãn theo độ dài tên file (lên đến `max-width: 280px`), tạo cảm giác hiện đại và tiết kiệm diện tích.
- **Adjacent Plus Button**: Nút "+" luôn bám sát tab cuối cùng thay vì nằm cố định bên phải.
- **Smart Shrinking**: Các tab sẽ tự động co lại đến `min-width: 100px` (tab thường) hoặc `44px` (tab ghim) khi danh sách quá dài.

### 5. Interaction Shortcuts
- **Middle-click**: Đóng tab tức thì bằng nút cuộn chuột.
- **Double-click**: Nhanh chóng chuyển đổi trạng thái Pin/Unpin tab.

---

## Tab Item Molecule

Each tab contains:
- **Draft Dot**: Chấm tròn xanh cho file nháp.
- **Dirty Dot**: Chấm tròn vàng cho file thông thường có thay đổi chưa lưu.
- **Display Label**: Tên file tự động co giãn.
- **Hover Mask**: Hiệu ứng mờ đuôi (Gradient Mask) chỉ hiển thị khi hover, giúp giao diện sạch sẽ khi nghỉ.
- **Hybrid Close Button**: 
    - **Inactive Tabs**: Sử dụng `absolute` positioning để triệt tiêu hiện tượng "nhảy" layout.
    - **Active Tab**: Sử dụng `static` flow để hiển thị hoàn hảo.
- **Selection Support**: Highlight khi nằm trong `state.selectedFiles`.
- **Identification**: Thuộc tính `data-path` giúp TabPreview nhận diện file.

---

## Lưu ý quan trọng

- Tab Bar sử dụng **Singleton Pattern** qua `window.TabBar`.
- Thuộc tính `data-path` là bắt buộc cho tính năng Hover Preview hoạt động.
- Không được can thiệp trực tiếp vào DOM của Tab Bar từ bên ngoài, luôn sử dụng `TabsModule` để điều khiển qua `setState`.

---

*Document — 2026-04-27 10:30*

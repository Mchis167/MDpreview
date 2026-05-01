# WorkspaceSwitcherComponent (`renderer/js/components/molecules/workspace-switcher.js`)

> Molecule hiển thị tên workspace hiện tại và nút mở workspace picker — thay thế HTML hardcode cũ trong Sidebar.

---

## Mục đích

Tách biệt UI của workspace switcher khỏi `WorkspaceModule` và `SidebarLeft`. Module chịu trách nhiệm logic, component chịu trách nhiệm render.

---

## Sử dụng

```js
const switcher = new WorkspaceSwitcherComponent({
  onClick: () => WorkspaceModule.openPanel()
});
container.appendChild(switcher.render());

// Cập nhật tên sau khi workspace load xong:
switcher.update('My Project');
```

---

## Methods

### `constructor(options)`

| Option | Type | Mô tả |
|---|---|---|
| `onClick` | `function` | Callback khi user click vào switcher button |

### `render()`

Tạo và trả về DOM structure:

```
.ds-workspace-switcher-outer
└── button.ds-workspace-switcher
    ├── .ws-info
    │   ├── span.ws-label  ("WORKSPACE")
    │   └── div.ds-workspace-name  ← nameLabel (cập nhật qua update())
    └── div.ws-chevron  (icon chevron-right)
```

Trả về container element. Gọi `render()` một lần, sau đó dùng `update()` / `setLoading()` để cập nhật.

### `update(name)`

Cập nhật tên workspace hiển thị và xóa skeleton state.

```js
switcher.update('Design Notes');   // → hiển thị tên
switcher.update('');               // → hiển thị "Add Workspace"
```

### `setLoading()`

Đặt lại skeleton state (shimmer animation) khi workspace đang load.

```js
switcher.setLoading();
// ... sau khi load xong:
switcher.update(workspace.name);
```

---

## State

Component tự quản lý `this.nameLabel` (reference đến DOM node) để update không cần re-render toàn bộ. Không có external state.

---

## Tích hợp với WorkspaceModule

`SidebarLeft` tạo instance và truyền `onClick` callback:

```js
// Trong SidebarLeft._initWorkspaceSwitcher()
this._switcher = new WorkspaceSwitcherComponent({
  onClick: () => WorkspaceModule.openPanel()
});
```

`WorkspaceModule._renderSwitcher()` gọi `switcher.update(name)` sau mỗi lần workspace thay đổi.

---

*Document — 2026-04-26*

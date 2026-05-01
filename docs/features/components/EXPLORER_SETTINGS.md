# ExplorerSettingsComponent (`renderer/js/components/organisms/explorer-settings-component.js`)

> Organism quản lý các tùy chọn hiển thị của File Explorer, hiển thị dưới dạng floating menu gắn với nút trong Sidebar footer.

---

## Kiến trúc

Triển khai **Singleton Pattern** thông qua `static toggle()` + `MenuShield`:

```
User click Explorer Preferences button
    ↓
ExplorerSettingsComponent.toggle({ anchor })
    ↓
Kiểm tra MenuShield.active (có phải ds-explorer-settings-shield không?)
    ↓ có → MenuShield.close()  (toggle off)
    ↓ không → render() + MenuShield.open(...)  (toggle on)
```

> **Quyết định thiết kế:** Xem [`docs/decisions/20260426-singleton-ui-pattern.md`](../decisions/20260426-singleton-ui-pattern.md)

---

## Methods

### `static toggle(options)`

Mở hoặc đóng Explorer Settings menu. **Đây là entry point duy nhất từ bên ngoài.**

| Option | Type | Mô tả |
|---|---|---|
| `event` | `MouseEvent` | Optional — dùng cho cursor-based positioning |
| `anchor` | `HTMLElement` | Optional — button kích hoạt, dùng cho smart positioning |

```js
// Từ SidebarLeft footer button:
ExplorerSettingsComponent.toggle({ anchor: explorerSettingsBtn });
```

### `render()`

Tạo DOM content của menu: danh sách `SettingToggleItem` rows cho từng setting.

Settings hiển thị:
| Label | `AppState.settings` key | Side Effect |
|---|---|---|
| Show Hidden Files | `showHidden` | `TreeModule.load()` |
| Hide Empty Folders | `hideEmptyFolders` | `TreeModule.load()` |
| Flat View | `flatView` | `TreeModule.load()` |
| Show Hidden in Search | `showHiddenInSearch` | Hiển thị file ẩn (làm mờ) khi tìm kiếm |

Khi một giá trị thay đổi, component gọi **`SettingsService.update(key, value)`**. Toàn bộ logic lưu trữ, refresh tree và đồng bộ server đã được tập trung hóa vào service này.

---

## Dependency

| Module | Vai trò |
|---|---|
| `MenuShield` | Lớp vỏ hiển thị floating menu |
| `SettingToggleItem` | Molecule render từng dòng label + toggle |
| `AppState` | Đọc/ghi settings |
| `TreeModule` | Reload tree sau khi setting thay đổi |

---

## Constraint

- Không gọi `render()` trực tiếp từ bên ngoài — luôn dùng `static toggle()`
- Không tự mở PopoverShield hay container riêng — phải dùng `MenuShield`
- Mỗi setting change phải gọi `TreeModule.load()` để UI phản ánh ngay lập tức

---

*Document — 2026-04-26*

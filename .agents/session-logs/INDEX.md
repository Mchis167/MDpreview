# Session Log Index

> File này là **single source of truth** cho toàn bộ session logs đã hoàn thành.
> Được cập nhật tự động bởi lệnh `/session-log close`.
> Được đọc bởi `/startup` để xác định log liên quan trước khi hành động.

---

## 📋 Completed Sessions

| Từ khóa trong yêu cầu | Session Log |
|------------------------|-------------|
| Monaco / editor / typing / focus / sync | `completed-session/session-log-editor-block-typing-debug-2026-05-15.md` |
| Read-only / edit mode / sync debug | `completed-session/session-log-read-to-edit-sync-debug-2026-05-16.md` |
| Draft / tab switching / modal / unsaved | `completed-session/session-log-draft-switch-bug-2026-05-16.md` |
| Draft management / persistence / sync | `completed-session/session-log-draft-management-fix-2026-05-15.md` |
| Asset / replace image / broken link / validation | `completed-session/session-log-broken-link-validation-2026-05-16.md` |
| Asset replace / upload / image panel | `completed-session/session-log-replace-broken-asset-2026-05-15.md` |
| Asset panel / utility bar / toolbar | `completed-session/session-log-asset-panel-utility-bar-2026-05-15.md` |
| Asset management / assets system | `completed-session/session-log-assets-management-system-2026-05-15.md` |
| Zoom / universal zoom | `completed-session/session-log-universal-zoom-system-2026-05-15.md` |
| Workspace / home screen | `completed-session/session-log-workspace-home-screen-2026-05-14.md` |
| Reset state / close tab / tab mode / identity guard / session mode | `completed-session/session-log-reset-tab-state-2026-05-16.md` |

---

> **Cách thêm dòng mới:** Chạy `/session-log close` — lệnh sẽ tự append vào bảng trên.

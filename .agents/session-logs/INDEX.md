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
| Path normalization / asset routing / workspace path / file access / server path | `completed-session/session-log-path-normalization-and-asset-routing-fixes-2026-05-16.md` |
| Context menu / image replacement / valid vs broken asset / global replacement / Monaco Editor / dialog title | `completed-session/session-log-smart-image-context-menu-2026-05-16.md` |
| Asset management / stale data / broken link count / tabs render / socket events / registry sync | `completed-session/session-log-asset-management-stale-data-fix-2026-05-16.md` |
| Monaco / block typing / new file / empty editor / beforeinput / browser text input routing / setTimeout warm-up | `completed-session/session-log-block-typing-new-file-2026-05-16.md` |
| scroll sync / first load / Read Edit mode switch / smooth scroll / ScrollType.Immediate / setSelection / revealPositionInCenter | `completed-session/session-log-scroll-sync-first-load-fix-2026-05-16.md` |
| publish / image management / R2 upload / image compression / WASM / jSquash / WebP / content hash / image cache / quality / canvas bypass | `completed-session/session-log-publish-image-management-2026-05-16.md` |
| Home Dashboard / Continue Edit / Pinned Documents / Context Menu / HomeCard / HomeSection / recently viewed | `completed-session/session-log-continue-edit-home-section-2026-05-17.md` |
| Z-index / stacking / semantic tokens / drawer / tab-bar / modal / CSS design system | `completed-session/session-log-z-index-system-revamp-2026-05-17.md` |
| Asset refactor / palette / asset picker / replacement dialog / input icon / atomic design | `completed-session/session-log-asset-refactor-palette-2026-05-17.md` |
| Asset drag-drop / Monaco drop / overlay blockade / capture phase / smart newline / attachment service | `completed-session/session-log-asset-drag-drop-and-ux-refinement-2026-05-17.md` |

---

> **Cách thêm dòng mới:** Chạy `/session-log close` — lệnh sẽ tự append vào bảng trên.

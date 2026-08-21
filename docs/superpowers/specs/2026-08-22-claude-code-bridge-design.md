# MDpreview ↔ Claude Code Bridge — Design

**Ngày:** 2026-08-22
**Trạng thái:** Đã duyệt thiết kế, chờ lập kế hoạch triển khai

---

## 1. Mục tiêu

Thay thế vòng lặp "Claude tạo artifact → publish → đọc trên trình duyệt" bằng vòng lặp cục bộ:

> Claude Code viết `.md` → tự mở trong MDpreview → người dùng đọc và comment → bấm **Copy for Claude** → paste vào Claude Code → Claude đọc comment qua MCP, sửa file, trả lời, resolve → app tự reload.

Không dùng hook, không polling, không đọc file comment trực tiếp. Mọi trao đổi đi qua MCP tool gọi vào Express server đang chạy của app — app là nguồn sự thật duy nhất.

## 2. Ràng buộc đã xác định

- Claude Code **không có API đẩy tin nhắn vào session đang chạy từ bên ngoài**. Vì vậy chiều comment → Claude do người dùng khởi xướng bằng thao tác paste một ref ngắn.
- MDpreview phải đang chạy thì tool mới hoạt động. Khi không chạy, tool trả lỗi rõ ràng, không treo.
- Kiến trúc hiện tại: Electron + Express + socket.io, vanilla JS không bundler, module IIFE export qua `window.*`. Bridge phải theo đúng quy ước này ở phía renderer.

## 3. Kiến trúc

```
Claude Code session
        │  stdio
        ▼
  mdpreview-mcp  ──HTTP──►  Express :PORT  ──socket.io──►  renderer
   (mcp/)                   (server/)                      (mở file, hiện reply)
        │                        │
        └── đọc runtime.json ◄───┘  (port + pid)
```

### 3.1 Phát hiện port — `runtime.json`

`server/index.js:233` cho thấy cổng 3737 có thể rơi về cổng ngẫu nhiên khi bị chiếm. MCP server không thể giả định 3737.

Khi lắng nghe thành công, server ghi `<dataDir>/runtime.json`:

```json
{ "port": 3737, "pid": 12345, "startedAt": "2026-08-22T09:00:00.000Z" }
```

`dataDir` lấy theo `getDefaultDataDir()` đã có (`server/index.js:22`). Xoá file khi tắt (`stop()`), và trong quá trình khởi động ghi đè file cũ. MCP server đọc file này, kiểm tra pid còn sống (`process.kill(pid, 0)`); nếu file thiếu hoặc pid chết thì trả lỗi `MDPREVIEW_NOT_RUNNING` kèm hướng dẫn mở app.

### 3.2 Ref token

Nút Copy đặt lên clipboard một dòng vừa đọc được vừa parse được:

```
@mdpreview docs/plan.md — 3 comments  ·  mdp://<wsId>/<pathEncoded>?c=pending
```

- `wsId` — id workspace hiện có trong `workspaces.json`.
- `pathEncoded` — đường dẫn tương đối trong workspace, `encodeURIComponent`.
- `?c=pending` — tất cả comment đang chờ; `?c=<commentId>` — một comment cụ thể.

Claude nhận diện tiền tố `mdp://` và gọi `mdp_get_comments` với chuỗi ref đó. Phần chữ phía trước chỉ để người đọc.

## 4. MCP tool

Bốn tool, không hơn. Claude đã có `Write`/`Edit` nên bridge không cung cấp tool ghi file.

| Tool | Tham số | Hành vi |
|---|---|---|
| `mdp_open` | `path` (tuyệt đối hoặc tương đối workspace), `wsId?` | Focus cửa sổ app và mở đúng file. Claude gọi ngay sau khi viết xong tài liệu. |
| `mdp_get_comments` | `ref` (chuỗi `mdp://…`) | Trả danh sách comment kèm neo và ngữ cảnh. |
| `mdp_reply_comment` | `ref`, `commentId`, `text` | Ghi một reply vào thread, hiển thị trong app với badge Claude. |
| `mdp_resolve_comment` | `ref`, `commentId` | Đặt trạng thái `resolved`. |

`mdp_get_comments` trả về nguyên các field comment đã có (`lineStart`, `lineEnd`, `text`, `selectedText`, `context.before/after`, `startLineContent`), cộng đường dẫn tuyệt đối của file. Không cần trích xuất ngữ cảnh thêm — schema hiện tại đã đủ.

Mọi tool trả lỗi có cấu trúc: `MDPREVIEW_NOT_RUNNING`, `WORKSPACE_NOT_FOUND`, `FILE_NOT_FOUND`, `COMMENT_NOT_FOUND`, `BAD_REF`.

## 5. Thay đổi phía server

### 5.1 Schema comment (tương thích ngược)

Thêm một field tuỳ chọn vào mỗi comment record:

```json
"claude": {
  "status": "none" | "pending" | "resolved",
  "replies": [ { "id": "…", "text": "…", "createdAt": "…" } ]
}
```

Comment cũ không có field này được coi là `status: "none"`, `replies: []` khi đọc. Không viết migration ghi đè hàng loạt — chuẩn hoá lúc load, giống cách `loadComments` đã tự vá `id` thiếu (`server/routes/comments.js:29`).

### 5.2 Route mới — `server/routes/mcp.js`

| Route | Việc |
|---|---|
| `POST /api/mcp/open` | Nhận `{ wsId?, path }`, phát `io.emit('mcp-open-file', …)` và yêu cầu Electron focus. Trả 404 nếu file không tồn tại. |
| `GET /api/mcp/comments?ref=` | Parse ref, tra workspace, đọc comment, lọc theo `c=`. |
| `POST /api/mcp/comments/:id/reply` | Thêm reply, phát `io.emit('comments-changed', …)`. |
| `POST /api/mcp/comments/:id/resolve` | Đặt `status: "resolved"`, phát `comments-changed`. |

Logic parse ref và tra workspace tách ra `server/utils/mcp-ref.js` để test riêng, không phụ thuộc Express.

### 5.3 Focus cửa sổ

Renderer nghe `mcp-open-file` rồi mở file. Hiện chưa có kênh IPC nào để chủ động focus cửa sổ — `mainWindow.focus()` mới chỉ được gọi trong handler `second-instance` (`electron/main.js:16`). Cần thêm một handler `ipcMain.handle('focus-window', …)` gọi `mainWindow.show()` + `focus()`, và renderer gọi nó sau khi nhận sự kiện. Cách này giữ cho server không phải biết gì về Electron.

## 6. Thay đổi phía renderer

Theo đúng quy ước IIFE + `window.*` của dự án.

- **`renderer/js/modules/comments.js`** — mỗi comment thêm toggle **Send to Claude** (đặt `claude.status = "pending"`), render reply của Claude trong thread với badge, và ẩn/thu gọn comment đã `resolved`.
- **Nút Copy** — một nút ở cấp file (copy ref cho toàn bộ comment `pending`) và một nút trên từng comment (copy ref cho comment đó). Dùng clipboard bridge sẵn có.
- **Nghe socket** — `comments-changed` để refresh thread khi Claude reply; `mcp-open-file` để mở file Claude yêu cầu.

## 7. Plugin Claude Code

Một thư mục plugin trong repo, người dùng cài một lần:

- `.mcp.json` — đăng ký `mdpreview-mcp` chạy qua stdio bằng `node`.
- Skill `mdp` — dạy quy ước: viết xong tài liệu markdown thì gọi `mdp_open`; thấy chuỗi `mdp://` trong tin nhắn thì gọi `mdp_get_comments` trước khi làm gì khác; sửa xong thì `mdp_reply_comment` rồi `mdp_resolve_comment`.

## 8. Kiểm thử

Vitest (`tests/`), khớp với cấu hình sẵn có:

- Parse ref: hợp lệ, đường dẫn có dấu cách/Unicode, `c=pending` với `c=<id>`, ref sai định dạng.
- Chuẩn hoá schema comment: bản ghi cũ không có `claude` đọc ra đúng mặc định, ghi reply không làm mất field cũ.
- Handler của bốn tool với lớp HTTP được stub: đường đi thành công và từng mã lỗi.
- Phát hiện `runtime.json`: file thiếu, pid chết, port hợp lệ.

Kiểm thủ công: focus cửa sổ Electron, và vòng lặp đầy đủ từ viết file tới resolve.

`npm run lint` phải sạch 0 lỗi trước khi commit, theo cổng lint của dự án.

## 9. Ngoài phạm vi

- Stop hook, `/loop` polling, hay bất kỳ cơ chế tự động kéo comment nào — đã cân nhắc và bỏ; người dùng chủ động paste ref.
- Tool ghi file từ MCP.
- Chế độ auto-follow theo chokidar watcher.
- Truy cập từ xa hoặc xác thực — bridge chỉ chạy trên localhost.

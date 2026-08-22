# MDpreview ↔ Claude Code: cầu nối comment qua extension

Ngày: 2026-08-22

## Vấn đề

Extension MDpreview và extension Claude Code cùng sống trong một IDE, cạnh
nhau, nhưng không có kênh nào để nói chuyện. Người dùng review một file .md
bên trái, muốn Claude bên phải đọc được nhận xét của mình mà không phải
copy-paste thủ công.

Bản MCP cũ (app Electron + `mdp://` ref + nút "Copy for Claude") giải quyết
được về mặt chức năng nhưng rườm rà: phải chạy app riêng, phải copy ref, phải
qua nhiều lớp trung gian.

## Nhu cầu thật

Diễn đạt của người dùng, giữ nguyên tinh thần:

> "Tôi gõ comment, gõ một lượt rồi, thì đơn giản chỉ là bảo: ê Claude, đang có
> đống comment ở file này này, đọc cho tôi đi. Và ngay khi Claude đọc xong,
> comment tự xoá đi bởi tool — không phải Claude hay người làm."

Ba điều kiện đi kèm:

- Không phải tự chạy server mỗi lần.
- Cài extension là dùng được, không phải cấu hình thêm.
- File .md phải sạch — không nhúng marker vào nội dung.

## Các phương án đã cân nhắc và loại bỏ

| Phương án | Lý do loại |
|---|---|
| Marker HTML comment trong file .md | Làm bẩn file; ai đó vẫn phải dọn marker |
| `terminal.sendText()` đẩy vào CLI | Người dùng dùng panel chat, không có terminal session |
| Gọi command nội bộ của extension Claude Code | `initialPrompt` chỉ áp dụng cho session mới; session đang mở bị từ chối. API không tài liệu hoá, dễ vỡ khi update |
| Long-poll `mdp_wait_for_comment` | Bắt Claude ngồi canh, tốn token, chiếm lượt; tối ưu cho nhu cầu người dùng không có |
| Nhúng Claude Agent SDK vào extension | Quá lớn; người dùng muốn giữ Claude Code quen thuộc |

## Kiến trúc chốt

```
┌──────────────────────────────┐        ┌─────────────────────┐
│  Extension MDpreview          │        │ Extension Claude Code│
│  ┌────────────────────────┐   │        │                     │
│  │ Webview (custom editor)│   │        │   phiên Claude      │
│  │  - render markdown     │   │        │        │            │
│  │  - tạo/sửa/xoá comment │   │        │        │ gọi tool   │
│  └───────────┬────────────┘   │        │        ▼            │
│              │                │        └────────┼────────────┘
│  ┌───────────▼────────────┐   │                 │
│  │ comments-core (shared) │   │                 │
│  │ + storage adapter      │   │                 │
│  └───────────┬────────────┘   │                 │
│              │                │                 │
│  .mdpreview/comments/*.json   │                 │
│              ▲                │                 │
│  ┌───────────┴────────────┐   │   HTTP MCP      │
│  │ MCP server (in-process)│◄──┼─────────────────┘
│  │ 127.0.0.1:43110/mcp    │   │
│  └────────────────────────┘   │
└──────────────────────────────┘
```

Bốn thành phần, mỗi thành phần một việc.

### 1. Store comment

Vị trí: `.mdpreview/comments/<đường-dẫn-file-mã-hoá>.json` trong repo.

- Mỗi file .md một file JSON, chứa mảng comment.
- `.mdpreview/` cho vào `.gitignore` — comment là ghi chú review cá nhân.
- Comment đi theo repo, không lẫn giữa các dự án.
- Ngăn lưu trữ: `.mdpreview/comments/.archive/<file>.json` chứa các lượt đã
  được Claude đọc (lưới đỡ, xem mục 3).

Bản ghi comment:

```json
{
  "id": "uuid",
  "body": "nội dung nhận xét",
  "selectedText": "đoạn được bôi đen",
  "lineStart": 42,
  "lineEnd": 45,
  "context": { "before": "...", "after": "..." },
  "startLineContent": "...",
  "createdAt": "2026-08-22T10:00:00.000Z"
}
```

Đây đúng shape mà `shared/comment-anchor.js` cần để neo lại comment khi văn
bản thay đổi, và cũng đủ để MCP tool trả về gần như nguyên văn.

### 2. Tầng logic — tái sử dụng, không viết lại

`shared/comments-core.js` đã tách sạch khỏi chỗ lưu: nó nhận adapter với 4
phương thức `get / save / remove / clear`. Việc cần làm chỉ là viết một
adapter mới đọc/ghi `.mdpreview/comments/` bằng `vscode.workspace.fs`.

`shared/comment-anchor.js` (`buildContext`, `findAnchor`) dùng nguyên để neo
comment khi nội dung file đổi — không sửa gì.

Cả hai file đã được vendor sang `vscode-extension/vendor/shared/`.

### 3. MCP server trong extension

Sống trong extension host, bật khi extension activate, tắt khi deactivate.
Người dùng không bao giờ phải chạy gì.

- Transport: HTTP, `127.0.0.1:43110/mcp` (port cố định; nếu bận thì thử
  43111, 43112… và ghi port thật ra `.mdpreview/port` để chẩn đoán).
- Đăng ký: `.mcp.json` project-scope, commit vào repo một lần.

Tool:

**`mdp_read_comments(file)` — đọc là tiêu.** Trả về toàn bộ comment của file,
và trong cùng thao tác đó chuyển chúng sang ngăn `.archive/`. Store chính
rỗng ngay lập tức → highlight trên webview biến mất → người dùng thấy đúng
hành vi "tool tự xoá". Không phải Claude xoá, không phải người xoá.

Nếu file không có comment nào: trả về mảng rỗng kèm thông báo rõ ràng, không
báo lỗi.

Không có tool nào khác — `mdp_open` bị loại vì file đã mở ngay trong IDE
bằng custom editor, không cần Claude "triệu hồi" app như thời Electron.
Không có tool xoá riêng, không có tool resolve — vì "đọc" đã là "xong".

**Panel 2 tab, không giấu gì cả:** webview có tab **Inbox** (comment đang chờ)
và tab **Archive** (comment đã bị `mdp_read_comments` tiêu thụ). Archive
không phải cơ chế ẩn chỉ dùng khi có sự cố — người dùng luôn thấy được và tự
quyết: **Khôi phục** (đẩy comment trở lại Inbox, kể cả khi Claude đã xử lý
xong và người dùng đổi ý) hoặc **Xoá vĩnh viễn** (dọn khỏi archive hẳn).

### 4. Skill tự nạp

Khi extension activate, ghi `~/.claude/skills/mdp-comments/SKILL.md` (kèm
version trong frontmatter; chỉ ghi đè khi extension mang bản mới hơn).

Nội dung skill, tóm tắt: *khi người dùng nhắc tới comment/review/nhận xét
trong một file .md, gọi `mdp_read_comments` của MCP server mdpreview; tool
tự dọn comment sau khi đọc nên không cần xoá gì thêm; không đi tìm file
comment thủ công.*

Chọn user-scope (`~/.claude/skills/`) chứ không project-scope, vì người dùng
review .md ở nhiều repo. Skill rất nhẹ — chỉ một dòng mô tả trong danh sách,
không nạp gì vào context cho tới khi kích hoạt, và điều kiện kích hoạt gần
như không thể trúng nhầm ở repo không liên quan. (Khác MCP server user-scope
hồi trước: cái đó nhét tool vào mọi session của mọi repo nên mới phiền.)

`.mcp.json` thì ngược lại, giữ project-scope: extension đề nghị ghi khi mở
một workspace lần đầu.

## Luồng sử dụng

Luồng chính:

1. Người dùng mở .md bằng custom editor MDpreview, bôi đen, gõ comment.
   Comment vào `.mdpreview/comments/`, hiện highlight trên webview.
2. Gõ một lượt xong, quay sang Claude: *"đang có đống comment ở report.md,
   đọc đi"*.
3. Skill dẫn Claude gọi `mdp_read_comments("report.md")`.
4. Tool trả comment kèm ngữ cảnh, đồng thời chuyển sang archive.
5. Highlight trên webview biến mất ngay. Claude sửa bài.

## Phần cần viết mới

- `vscode-extension/extension.js`: hiện mới 174 dòng, thuần render, chưa biết
  gì về comment. Cần tách file khi thêm các phần dưới.
- Storage adapter cho `.mdpreview/comments/` (+ archive).
- UI comment trong webview: bôi đen → tạo, danh sách, xoá, nút khôi phục.
- MCP server + tool `mdp_read_comments`.
- Bộ ghi skill khi activate.
- Đề nghị ghi `.mcp.json` cho workspace mới.

## Không nằm trong phạm vi

- App Electron giữ nguyên, không đụng. Store của app và của extension tách
  biệt — cùng một file .md mở bằng hai bên sẽ không thấy comment của nhau.
  Đây là chủ ý; người dùng cho biết sẽ dần chuyển hẳn sang extension.
- `mcp/`, `server/routes/mcp.js`, skill `mdp-open`/`mdp-comments` cũ và
  `.mcp.json.disabled` để nguyên, dọn sau khi bản mới chạy ổn.
- Không đụng vào API nội bộ của extension Claude Code.
- Không đẩy comment vào chat Claude theo thời gian thực — người dùng gõ một
  lượt rồi mới gọi, không cần push.

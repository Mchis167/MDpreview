# Spec: Paste ảnh + Tag cho Comment Box (VSCode extension)

**Ngày:** 2026-08-22
**Phạm vi:** Chỉ VSCode extension. Electron app không thay đổi.

---

## 1. Mục tiêu

Nâng cấp chức năng comment của MDpreview trong VSCode extension:

1. **Paste ảnh từ clipboard** vào comment box — ảnh tự đính kèm, hiện thumbnail.
2. **Thẻ tag tùy chọn** (Bug / Enhancement / Comment) để agent hiểu rõ ý định của comment.
3. **Agent nhận được ảnh + tag** qua MCP tool `mdp_read_comments`.
4. **Vòng đời ảnh gắn liền với comment** — xoá comment thì xoá ảnh.
5. **Dọn sạch cây `.mdpreview`** — không để lại JSON rỗng và folder rỗng.
6. **Tự động gitignore** folder `.mdpreview/`.

---

## 2. Paste ảnh từ clipboard

### Hành vi

- Bắt sự kiện `paste` trên textarea của form comment (webview).
- Đọc ảnh từ `event.clipboardData.items` — hoạt động trong webview VSCode
  (không dùng `navigator.clipboard`, vốn bị chặn trong webview).
- Ảnh paste vào hiện ngay thành **dải thumbnail** dưới textarea.
  Mỗi thumbnail có nút ✕ để gỡ trước khi save. Paste nhiều ảnh được.
- Paste ảnh khi textarea trống vẫn hợp lệ: nút Save bật khi có text **hoặc** có ảnh.

### Lưu trữ

- Khi bấm **Save**: webview gửi ảnh (base64) về extension host qua `postMessage`.
- Host ghi file PNG vào `.mdpreview/comments/assets/<commentId>-<n>.png`
  (`n` là số thứ tự, bắt đầu từ 1).
- Comment JSON chỉ lưu mảng đường dẫn tương đối:
  ```json
  { "images": ["assets/abc123-1.png", "assets/abc123-2.png"] }
  ```
- Sidebar item hiện dải thumbnail của comment — previewProvider chuyển
  path → webview URI khi gửi danh sách comment sang webview.

---

## 3. Thẻ tag

- Một hàng **chip Bug / Enhancement / Comment** trong form comment.
- Mặc định **không chọn gì** (tag là tùy chọn). Bấm chip để chọn, bấm lại để bỏ.
- Lưu vào field `tag` của comment: `"bug" | "enhancement" | "comment"` hoặc vắng mặt.
- Sidebar item hiện **badge màu** theo tag:
  - `bug` → đỏ
  - `enhancement` → xanh
  - `comment` → xám

---

## 4. Phía agent (MCP)

File: `vscode-extension/mcpStdioServer.js`

- Payload của `mdp_read_comments` trả thêm:
  - `tag` — nếu comment có tag.
  - `images` — mảng **đường dẫn tuyệt đối** tới các file ảnh.
- Cập nhật description của tool: hướng dẫn agent **Read các file ảnh** trong
  `images` để xem ngữ cảnh trực quan.
- Bump `VERSION` → `2.1.0` để installer chép lại server mới lên `~/.mdpreview/mcp-server.js`.
- Khi comment bị consume vào archive, **ảnh giữ nguyên** trong `assets/`
  (archive vẫn tham chiếu; agent vừa đọc xong còn cần mở ảnh).

---

## 5. Vòng đời ảnh gắn với comment

Ảnh đặt tên theo comment id nên luôn truy ngược được chủ sở hữu.

| Hành động | Ảnh |
|---|---|
| Xoá một comment (Inbox) | Xoá ảnh của comment đó |
| Clear all comments (Inbox) | Xoá ảnh của các comment đang active |
| Consume vào archive (`mdp_read_comments`) | **Giữ lại** |
| Restore từ Archive về Inbox | Giữ nguyên |
| Xoá vĩnh viễn khỏi Archive | Xoá ảnh của comment đó |
| Clear archive | Xoá ảnh của các comment bị xoá |

---

## 6. Dọn sạch cây `.mdpreview`

- **Bỏ thói quen ghi `[]`**: khi danh sách comment rỗng thì **xoá hẳn file JSON**
  thay vì ghi mảng rỗng. Áp dụng ở:
  - `commentStorage.js` — `remove`, `clear`, `deleteArchived`, `clearArchive`, `restore`.
  - `mcpStdioServer.js` — `readAndConsume` (hiện đang `writeFileSync(commentsPath, '[]')`).
- **Prune ngược lên**: sau khi xoá file, xoá các folder cha rỗng bên trong
  `.mdpreview/` (kể cả `comments/`, `.archive/`, `assets/`).
  Nếu `.mdpreview/` rỗng hoàn toàn thì xoá luôn — sạch tuyệt đối,
  lần comment sau extension tự tạo lại.
- Logic prune là **một hàm dùng chung**, có unit test riêng.
  Bất biến: **không bao giờ leo ra ngoài `.mdpreview`**.

---

## 7. Tự động gitignore

- Khi lưu comment (mỗi lần save, không chỉ lúc activate), extension kiểm tra
  `.gitignore` ở root workspace:
  - Đã có dòng `.mdpreview/` hoặc `.mdpreview` → không làm gì.
  - Chưa có → append dòng `.mdpreview/` vào cuối; chưa có `.gitignore` thì tạo mới.
- Chỉ làm khi workspace là git repo (có `.git`). Repo không dùng git thì bỏ qua.

---

## 8. File sẽ chạm

| File | Thay đổi |
|---|---|
| `vscode-extension/media/comments.js` | Paste handler, thumbnail strip, chip tag, badge trong sidebar item |
| Form component vendored trong extension | UI thumbnail + tag chips |
| CSS của form (vendored) | Style thumbnail strip, chips, badges |
| `vscode-extension/commentStorage.js` | Ghi/xoá ảnh, xoá JSON rỗng, prune folder |
| `vscode-extension/previewProvider.js` / `commentSession.js` | Nhận ảnh base64, chuyển path → webview URI, auto-gitignore |
| `vscode-extension/mcpStdioServer.js` | Payload thêm `tag` + `images`, xoá JSON rỗng + prune, VERSION 2.1.0 |

---

## 9. Test

- **Unit test:**
  - Storage: lưu comment kèm ảnh + tag; xoá comment xoá ảnh; clear xoá ảnh.
  - Prune: xoá JSON rỗng, prune folder rỗng, không leo ra ngoài `.mdpreview`.
  - MCP: payload mới có `tag` + `images` (đường dẫn tuyệt đối); consume không xoá ảnh.
  - Gitignore: append đúng, không trùng lặp, bỏ qua repo không git.
- **Test tay:** paste ảnh trong extension (screenshot → Cmd+V), chọn tag, save,
  xem thumbnail trong sidebar, agent đọc comment và mở được ảnh.
- **Baseline:** test suite hiện có 63 test fail sẵn (16 file) không liên quan —
  "không regression" nghĩa là giữ nguyên con số 63, không phải 0.

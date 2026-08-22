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
- Quy tắc prune có unit test riêng. Bất biến: **không bao giờ leo ra ngoài `.mdpreview`**.
- Logic được **viết hai lần** thay vì dùng chung: `mcpStdioServer.js` phải giữ
  nguyên tắc zero-dependency single-file (nó được copy sang
  `~/.mdpreview/mcp-server.js` và chạy độc lập, không có `node_modules`),
  nên không thể `require` module chung. Bản cho extension host nằm ở
  `commentStoreUtil.js`, bản node-fs nằm trong chính `mcpStdioServer.js`.

---

## 7. Tự động gitignore

- Khi lưu comment (mỗi lần save, không chỉ lúc activate), extension kiểm tra
  `.gitignore` ở root workspace:
  - Đã có dòng `.mdpreview/` hoặc `.mdpreview` → không làm gì.
  - Chưa có → append dòng `.mdpreview/` vào cuối; chưa có `.gitignore` thì tạo mới.
- Chỉ làm khi workspace là git repo (có `.git`). Repo không dùng git thì bỏ qua.

---

## 8. File đã chạm

Đường dẫn tính từ `vscode-extension/`.

| File | Thay đổi |
|---|---|
| `media/commentCompose.js` *(mới)* | Tag chips + attachment strip + paste handler, gắn vào form từ bên ngoài |
| `media/comments.js` | Gọi composer khi mở form, gửi `tag`/`images` khi save, badge + thumbnail trong sidebar item |
| `media/comments.css` | Style cho chips, thumbnail strip, badges |
| `commentStoreUtil.js` *(mới)* | Logic thuần: validate tag, decode data URL, đặt tên asset, prune dirs, gitignore |
| `commentStorage.js` | Ghi/xoá ảnh, xoá JSON rỗng, prune folder, auto-gitignore |
| `commentSession.js` | Kèm `imageUris` khi gửi comment sang webview |
| `previewProvider.js` | Thêm `.mdpreview/` vào `localResourceRoots` |
| `webviewHtml.js` | Nạp `commentCompose.js`; CSP thêm `img-src` (cspSource + `data:`) |
| `mcpStdioServer.js` | Payload thêm `tag` + `images`, xoá JSON rỗng + prune, VERSION 2.1.0 |

**Không sửa file vendored.** `comment-form-component.js` và `comment-form.css`
được `scripts/vendor-shared.js` copy từ app desktop, nên mọi thay đổi trong đó
sẽ mất khi chạy lại `npm run vendor`. Tag chips và thumbnail strip vì thế được
chèn vào form từ bên ngoài (`commentCompose.js`) — cùng cách `comments.js` đăng
ký icon qua `DesignSystem.registerIcons` thay vì sửa registry vendored.

---

## 9. Test

- **`tests/comment-store-util.test.js`** (17 test) — validate tag, decode data
  URL, đặt tên asset, lọc đường dẫn ảnh độc hại, prune dirs, gitignore.
- **`tests/comment-storage.test.js`** (18 test) — lưu comment kèm ảnh + tag,
  thêm/bớt ảnh khi sửa, xoá comment xoá ảnh, clear, archive/restore, prune cây,
  auto-gitignore. Chạy được nhờ `tests/stubs/vscode.cjs` — một bản `vscode`
  tối giản chạy trên fs thật, cắm vào bằng cách patch `Module._resolveFilename`.
- **`tests/mdp-mcp-stdio.test.js`** (+8 test) — payload có `tag` + `images`
  tuyệt đối, bỏ qua ảnh trỏ ra ngoài `assets/`, xoá store file thay vì ghi `[]`,
  prune dừng ở `.mdpreview`, consume không xoá ảnh.
- **Test tay:** paste ảnh trong extension (screenshot → Cmd+V), chọn tag, save,
  xem thumbnail trong sidebar, agent đọc comment và mở được ảnh.
- **Baseline:** test suite hiện có 63 test fail sẵn (16 file) không liên quan —
  "không regression" nghĩa là giữ nguyên con số 63, không phải 0.

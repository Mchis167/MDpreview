# MDpreview → VSCode Extension: tách lõi comment và port

**Ngày:** 2026-08-22
**Trạng thái:** Design (chờ duyệt)

## Mục tiêu

Đưa hai năng lực cốt lõi của MDpreview — **render markdown đẹp** và **comment/reply neo theo dòng** — vào VSCode dưới dạng extension, ngồi cạnh Claude Code panel.

Trên đường đi, tách phần logic comment ra khỏi DOM để cả app Electron hiện tại lẫn extension (và các port sau này) dùng chung một lõi.

## Phi mục tiêu

Bản này **không** làm:

- Editor / Monaco — đã ở trong một editor rồi
- File tree, tab bar, workspace switcher — VSCode lo
- Express server, socket.io — extension nói chuyện trực tiếp với webview
- MCP bridge — Claude đọc file JSON trong repo là đủ
- History / version snapshot, diff scroll, publish, asset manager
- Cơ chế Claude tự mở extension (để pha sau, xem *Mở rộng tương lai*)

## Bối cảnh: code hiện tại đang dính vào đâu

`renderer/js/modules/comments.js` dài 1001 dòng, có 78 chỗ đụng DOM. Nhưng khảo sát cho thấy đường cắt đã có sẵn:

- **Tầng dữ liệu** (dòng 14–170): `loadForFile`, `save`, `remove`, `clear`, `_buildRef`, `copyAll`. Gần như không đụng DOM. Chỉ phụ thuộc ba biến ambient:
  - `AppState.currentWorkspace`, `AppState.currentFile`
  - `window.electronAPI.{getComments,saveComment,deleteComment,clearComments}`
  - `showToast()`
- **Tầng UI** (từ `_renderList` dòng 169 trở xuống): toàn bộ phần đụng DOM.
- **Thuật toán neo** nằm lẫn bên trong `_applyRobustHighlights` (dòng 437–594). Riêng bước 1–2 (dòng 442–531) là logic chuỗi thuần: từ `fullContent` + `selectedText` + `context` tính ra vị trí khớp tốt nhất. Bước 3 (dòng 534–593) mới là DOM.
- `_getSelectionContext` (dòng 701–728) là hàm sinh ra `context` mà bước 2 tiêu thụ — hai hàm này là một cặp, phải tách cùng nhau.

Kết luận: cản trở chính **không phải DOM** mà là ba biến global. Việc tách là tiêm phụ thuộc, không phải viết lại.

## Kiến trúc đích

```
shared/
  comment-anchor.js     — thuần chuỗi: sinh context + tìm vị trí neo
  comments-core.js      — thuần logic: CRUD + state, nhận adapter

renderer/js/modules/
  comments.js           — chỉ còn UI, gọi vào core (app Electron)

vscode-extension/
  package.json          — contributes.customEditors cho .md
  extension.js          — activate, provider, adapter VSCode
  media/                — webview: render + UI comment, dùng chung core
```

### `shared/comment-anchor.js`

Không DOM, không global, không I/O. Hai hàm đối xứng nhau:

```js
// Sinh context lúc tạo comment.
// RADIUS = 60, thêm '...' khi bị cắt — giữ đúng hành vi hiện tại.
buildContext(fullLineText, offsetStart, selectedText)
  -> { before: string, after: string }

// Tìm lại vị trí lúc render, kể cả khi nội dung quanh đó đã đổi.
// Trả -1 nếu không tìm được.
findAnchor(fullContent, selectedText, context)
  -> number
```

`findAnchor` giữ nguyên thuật toán hiện tại: duyệt mọi lần xuất hiện của `selectedText`, chấm điểm bằng số ký tự khớp liên tiếp từ cuối `before` và từ đầu `after`, lấy điểm cao nhất; nếu không có thì fallback `indexOf`, rồi fallback so khớp sau khi chuẩn hoá khoảng trắng.

Đây là phần giá trị nhất và dễ vỡ nhất của cả hệ thống, nên nó được tách riêng để test độc lập — không cần DOM, không cần Electron.

### `shared/comments-core.js`

Factory nhận adapter, trả về API. Không tự đi tìm global nào.

```js
createCommentsCore({
  storage: {
    get(wsId, file)                -> Promise<Comment[]>,
    save(wsId, file, commentData)  -> Promise<Comment>,
    remove(wsId, file, commentId)  -> Promise<Comment[]>,
    clear(wsId, file)              -> Promise<Comment[]>
  },
  context: {
    workspaceId() -> string | null,
    currentFile() -> string | null
  },
  notify: (message) => {}
})
```

Trả về:

```js
{
  list()                     -> Comment[]        // bản sao state trong bộ nhớ
  load(filePath)             -> Promise<Comment[]>
  save(commentData)          -> Promise<Comment>  // tạo mới hoặc cập nhật theo id
  remove(commentId)          -> Promise<Comment[]>
  clear()                    -> Promise<Comment[]>
  buildRef(filter)           -> string | null   // chỉ app Electron dùng (mdp://)
  formatForClipboard()       -> string          // trả chuỗi, không tự ghi clipboard
  onChange(cb)               -> unsubscribe
}
```

Core **không** gọi `_renderList()` hay `_markLinesWithComments()` nữa. Nó phát `onChange`; tầng UI đăng ký và tự vẽ lại. Đây là thay đổi hành vi nội bộ duy nhất so với bản hiện tại — bên ngoài nhìn vào phải giống hệt.

Core giữ luôn quy tắc sắp xếp hiện có (`sort` theo `lineStart`) và cách hoà kết quả `save` vào danh sách cục bộ, kể cả nhánh fallback khi id đổi (dòng 31–45).

### Schema comment (không đổi)

```
id, lineStart, lineEnd, startLineContent, endLineContent,
text, selectedText, context: { before, after },
headingPath, createdAt, updatedAt
```

Cùng các trường reply của Claude đã có sẵn. Extension đọc/ghi đúng schema này, nên comment tạo ở app Electron và ở VSCode là cùng một định dạng.

### Adapter

| | Electron app | VSCode extension |
|---|---|---|
| `storage` | `window.electronAPI.*` (IPC sẵn có) | `vscode.workspace.fs` |
| `context.workspaceId` | `AppState.currentWorkspace.id` | tên workspace folder |
| `context.currentFile` | `AppState.currentFile` | đường dẫn tương đối của document |
| `notify` | `showToast` | `vscode.window.showInformationMessage` |

### Nơi lưu comment

- **App Electron: giữ nguyên** app data dir (`<dataDir>/comments/<wsId>/<encoded>.json`). Không đụng vào, tránh làm mất dữ liệu người dùng đang có.
- **Extension: lưu trong repo** tại `.mdpreview/comments/<encoded>.json`, để Claude đọc trực tiếp.

Hai nơi khác nhau là chấp nhận được vì core không quan tâm — storage được tiêm vào. Việc hợp nhất hai nơi này là quyết định riêng, không thuộc phạm vi bản thiết kế này.

## Extension

### Kích hoạt

Đăng ký `CustomTextEditorProvider` cho `.md` với `"priority": "default"`: mở file `.md` bất kỳ là ra MDpreview, không cần nút bấm. Người dùng vẫn dùng được *Reopen with… Text Editor* khi muốn sửa thô.

### Webview

Chỉ mang sang những gì cần: `marked`, `highlight.js`, `renderer/css/design-system*`, pipeline render trích từ `app.js`, và tầng UI comment trích từ `comments.js`.

Webview không đọc file. Mọi I/O đi qua `postMessage` tới extension host, host mới gọi `vscode.workspace.fs`. Nhờ vậy chạy được cả trên remote/SSH.

Tài nguyên tĩnh nạp qua `asWebviewUri()`, script/style inline gắn nonce theo CSP mặc định của webview.

### Copy for Claude

Nút copy sinh ra một chỉ dẫn dạng văn bản trỏ tới file JSON trong repo, ví dụ:

```
Đọc các comment review trong .mdpreview/comments/docs%2Fplan.md.json
và xử lý những comment chưa resolve trong docs/plan.md
```

Không MCP, không server. Claude ở cùng repo nên mở file là đọc được.

## Xử lý lỗi

- `findAnchor` trả `-1`: comment vẫn hiện trong danh sách bên lề, chỉ không có highlight trong nội dung. Không được ném lỗi, không được mất comment. Đây là hành vi hiện tại và phải giữ.
- File JSON hỏng hoặc không parse được: coi như danh sách rỗng, báo cho người dùng, **không** ghi đè file. Ghi đè sẽ xoá mất dữ liệu có thể còn cứu được.
- `vscode.workspace.fs` ghi thất bại: hiện thông báo lỗi, giữ nguyên state trong bộ nhớ để người dùng thử lại.
- Không có workspace folder nào đang mở: extension vẫn render markdown, nhưng vô hiệu hoá chức năng comment và nói rõ lý do.

## Kiểm thử

Repo đã có vitest. Chiến lược: **viết test chốt hành vi hiện tại trước, rồi mới rút code ra.** Refactor xong mà test xanh thì app Electron không đổi hành vi.

- `comment-anchor`: test thuần, không DOM. Phủ các ca — khớp duy nhất; nhiều lần xuất hiện và context quyết định chọn cái nào; nội dung xung quanh đã đổi; `before`/`after` bị cắt có `...`; fallback `indexOf`; fallback chuẩn hoá khoảng trắng; không tìm thấy trả `-1`. Thêm test khứ hồi `buildContext` → `findAnchor`.
- `comments-core`: test với storage giả trong bộ nhớ. Phủ — tạo, cập nhật theo id, nhánh fallback khi id đổi, xoá, xoá sạch, thứ tự sắp xếp, `onChange` phát đúng số lần, `buildRef` khi thiếu workspace/file.
- Regression app Electron: sau bước 3, mở app thật và kiểm tra tay — tạo, sửa, xoá comment, highlight hiện đúng chỗ, copy for Claude.

## Các pha

Mỗi pha kết thúc ở trạng thái chạy được và test xanh.

1. **Chốt baseline** — viết test cho hành vi comment hiện tại, chưa sửa code sản phẩm.
2. **Rút `comment-anchor.js`** — thuần nhất, rủi ro thấp nhất. `comments.js` gọi vào nó.
3. **Rút `comments-core.js`** + adapter Electron. `comments.js` co lại còn UI. **App Electron phải chạy y như cũ — đây là chốt kiểm tra tay.**
4. **Extension khung** — `CustomTextEditorProvider`, webview render markdown, chưa có comment.
5. **Extension comment** — nối core với adapter VSCode, cổng UI comment sang, Copy for Claude.

Sau pha 3 có thể dừng lại nghiệm thu bản Electron trước khi đụng tới extension.

## Rủi ro

- **Làm hỏng comment của app Electron.** Đây là rủi ro lớn nhất — app đang chạy tốt. Giảm thiểu bằng pha 1 (test baseline trước) và chốt kiểm tra tay ở cuối pha 3.
- **CSP của webview.** Chưa đo thực tế được, chỉ biết chắc khi chạy pha 4. Nếu pha 4 phát sinh nhiều hơn dự kiến, dừng lại báo cáo thay vì tự mở rộng phạm vi.
- **`app.js` dây dưa hơn dự kiến khi trích pipeline render.** Nếu gặp, xử lý ở pha 4 và báo lại — không tiện tay refactor `app.js` ngoài phạm vi.

## Mở rộng tương lai (không làm bây giờ)

- Claude tự mở extension: extension theo dõi `.mdpreview/open-request.json`, skill của Claude ghi đường dẫn vào, extension mở tab. Không cần hook, không cần MCP.
- Hợp nhất nơi lưu comment giữa app Electron và extension.

# MDpreview → VSCode Extension: tách lõi comment và port

**Ngày:** 2026-08-22
**Trạng thái:** Design (chờ duyệt)

## Mục tiêu

Đưa hai năng lực cốt lõi của MDpreview — **render markdown đẹp** và **comment/reply neo theo dòng** — vào VSCode dưới dạng extension, ngồi cạnh Claude Code panel.

Trên đường đi, tách hai lõi dùng chung:

- **Lõi comment** — bóc khỏi DOM, để app Electron và extension dùng chung.
- **Lõi render** — gom ba bản đang phân kỳ về một mối, với API đủ generic để các dự án khác dùng lại.

## Phi mục tiêu

Bản này **không** làm:

- Editor / Monaco — đã ở trong một editor rồi
- File tree, tab bar, workspace switcher — VSCode lo
- Express server, socket.io — extension nói chuyện trực tiếp với webview
- MCP bridge — Claude đọc file JSON trong repo là đủ
- History / version snapshot, diff scroll, publish, asset manager
- Cơ chế Claude tự mở extension (để pha sau, xem *Mở rộng tương lai*)
- **Đóng gói `md-render` thành npm package** — chỉ dựng biên giới đủ sạch để sau này promote là bước đóng gói, không phải viết lại

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

## Bối cảnh: render đang có ba bản phân kỳ

- `renderer/js/services/md-renderer-core.js` (90 dòng) — đã dùng chung giữa renderer và server, nhưng chỉ chứa 4 hàm phụ trợ: `highlightCodeBlock`, `sanitizeHtml`, `wrapInTableWrapper`, `renderMermaidBlock`.
- `server/routes/render.js` (609 dòng) — **lõi render thật**, đang bị nhốt trong một Express route. Đây là chỗ sinh ra `data-line`, `data-src-start`, `data-src-end` — tức là chính cái mà comment neo vào. Không có nó thì extension không có gì để neo.
- `cf-publish-worker/src/renderer.js` (52 dòng) — bản thứ ba, đã lệch khỏi hai bản trên.

Điểm thuận lợi: biên giới trong `render.js` đã sạch sẵn. `renderWithLineNumbers(content, wikiIndex, currentFilePath)` (dòng 551) là entry point; dòng 570–609 chỉ là route bọc ngoài; `loadWikiIndex` (dòng 10) là chỗ duy nhất đụng `fs`.

Về phần "đẹp": nó nằm ở CSS, không phải JS. Markdown CSS khoảng 1069 dòng (`shared/markdown-render.css` 622 + bốn file `markdown-*.css`), cộng `tokens.css` 316 dòng. JS sinh **cấu trúc**, CSS sinh **cái đẹp** — nên module phải xuất cả hai.

## `shared/md-render/`

Thuần: không Express, không DOM, không `fs`.

```
shared/md-render/
  index.js              — render() + slugify
  inline.js             — renderInlineTokens (line/offset tracking)
  blocks.js             — renderTokens
  utils.js              — từ md-renderer-core.js hiện tại
  md-render.css         — từ shared/markdown-render.css + markdown-*.css
  tokens.css            — biến CSS để dự án khác đổi theme
```

API:

```js
render(markdown, {
  resolveLink,   // (href, currentFilePath) -> { href, target } | null
  extensions,    // marked extension[] — chỗ cắm wikilink, carousel
  currentFilePath
})
  -> { html, headings, totalLines }
```

### Đâu là generic, đâu là của riêng MDpreview

Dự án khác chỉ cần: markdown chuẩn + line anchor + nhận diện link nội bộ để mở tab mới. Vậy nên:

- **Trong lõi (generic):** parse, line/offset tracking (`data-line`, `data-src-start`, `data-src-end`), heading + slugify, code highlight, table wrapper, sanitize, và hook `resolveLink`.
- **Ngoài lõi (extension MDpreview truyền vào):** wikilink resolution (`resolveWikiTarget`, `resolveCodespan`, `commonPrefixDepth` — dòng 23–83, 114–131), carousel (dòng 133–144), mermaid.

`loadWikiIndex` ở lại `server/` vì nó đọc `fs`. Lõi chỉ nhận `wikiIndex` đã nạp sẵn qua extension.

Ranh giới này chính là điều kiện để sau promote lên npm mà không phải thiết kế lại API.

### Ai dùng lõi

Cả ba consumer chuyển sang dùng chung:

- `server/routes/render.js` — co lại còn route + `loadWikiIndex`, cắm extension MDpreview
- `cf-publish-worker/src/renderer.js` — thay bằng lõi; **sẽ có khác biệt hành vi phải xử lý** vì bản này đang lệch
- Extension VSCode — dùng lõi generic, cắm extension nào cần

## Kiến trúc đích

```
shared/
  comment-anchor.js     — thuần chuỗi: sinh context + tìm vị trí neo
  comments-core.js      — thuần logic: CRUD + state, nhận adapter
  md-render/            — lõi render generic + CSS (xem mục trên)

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

Chỉ mang sang những gì cần: `shared/md-render/` (kèm CSS của nó) và tầng UI comment trích từ `comments.js`. Không copy renderer thứ tư — dùng đúng lõi chung.

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
- `md-render`: test snapshot HTML. Bộ markdown mẫu phải phủ — heading, list lồng nhau, task list, bảng, code block có/không ngôn ngữ, blockquote, inline formatting lồng nhau, link, ảnh, mermaid, và văn bản có ký tự HTML cần escape. Snapshot chốt ở pha 4 phải khớp từng byte sau pha 5.
- `md-render` line anchor: test riêng rằng `data-line` / `data-src-start` / `data-src-end` trỏ đúng vị trí trong markdown gốc — đây là hợp đồng mà comment neo dựa vào.
- `md-render` tính generic: một test render **không truyền extension nào**, xác nhận lõi chạy được mà không cần wikilink/carousel. Đây là bài kiểm tra ranh giới API cho việc dùng lại ở dự án khác.
- Regression app Electron: sau bước 3, mở app thật và kiểm tra tay — tạo, sửa, xoá comment, highlight hiện đúng chỗ, copy for Claude.

## Các pha

Mỗi pha kết thúc ở trạng thái chạy được và test xanh.

1. **Chốt baseline comment** — viết test cho hành vi comment hiện tại, chưa sửa code sản phẩm.
2. **Rút `comment-anchor.js`** — thuần nhất, rủi ro thấp nhất. `comments.js` gọi vào nó.
3. **Rút `comments-core.js`** + adapter Electron. `comments.js` co lại còn UI. **App Electron phải chạy y như cũ — chốt kiểm tra tay.**
4. **Chốt baseline render** — test snapshot HTML đầu ra của `renderWithLineNumbers` trên một bộ markdown mẫu, chưa sửa code sản phẩm. Đây là lưới an toàn cho pha 5.
5. **Rút `shared/md-render/`** — bóc dòng 87–569 của `render.js` ra, wikilink/carousel/mermaid thành extension. `render.js` co lại còn route. Snapshot pha 4 phải khớp từng byte. **Pha rủi ro cao nhất — chốt kiểm tra tay app Electron.**
6. **Gom publish worker** — `cf-publish-worker` chuyển sang lõi. Xử lý khác biệt hành vi do bản này đang lệch; ghi lại từng khác biệt và quyết định giữ hay bỏ.
7. **Tách CSS** — gom markdown CSS + tokens vào `shared/md-render/`, cả hai app trỏ vào đó.
8. **Extension khung** — `CustomTextEditorProvider`, webview render markdown bằng lõi, chưa có comment.
9. **Extension comment** — nối core với adapter VSCode, cổng UI comment sang, Copy for Claude.

Có hai điểm dừng nghiệm thu: sau pha 3 (comment) và sau pha 7 (render) — cả hai đều kiểm tra trên app Electron trước khi đụng tới extension.

## Rủi ro

- **Làm hỏng đường render của app Electron (pha 5).** Rủi ro lớn nhất toàn dự án: 609 dòng bóc khỏi Express, và render là đường đi chính của app. Giảm thiểu bằng snapshot chốt ở pha 4 — khớp từng byte, không "gần đúng".
- **Publish worker lệch hành vi (pha 6).** Đã biết chắc là có lệch, chỉ chưa biết lệch chỗ nào. Không tự ý chọn — liệt kê từng khác biệt và hỏi trước khi quyết định giữ hay bỏ.
- **Làm hỏng comment của app Electron.** App đang chạy tốt. Giảm thiểu bằng pha 1 (test baseline trước) và chốt kiểm tra tay ở cuối pha 3.
- **CSP của webview.** Chưa đo thực tế được, chỉ biết chắc khi chạy pha 8. Nếu phát sinh nhiều hơn dự kiến, dừng lại báo cáo thay vì tự mở rộng phạm vi.
- **`markdown-viewer-component.js` (1390 dòng) dây dưa hơn dự kiến khi cổng UI viewer sang webview.** Nếu gặp, xử lý ở pha 8 và báo lại — không tiện tay refactor nó ngoài phạm vi.

## Mở rộng tương lai (không làm bây giờ)

- Claude tự mở extension: extension theo dõi `.mdpreview/open-request.json`, skill của Claude ghi đường dẫn vào, extension mở tab. Không cần hook, không cần MCP.
- Hợp nhất nơi lưu comment giữa app Electron và extension.
- Đóng gói `shared/md-render/` thành npm package cho các dự án khác. Điều kiện đã chuẩn bị sẵn ở pha 5–7: lõi không import gì thuộc repo này, wikilink/carousel nằm ngoài, CSS đi kèm và theme hoá bằng biến. Việc còn lại chỉ là `package.json`, versioning và tài liệu.

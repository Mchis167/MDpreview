# Wiki Reader

**Status:** Complete (v1.9.0)  
**Last Updated:** 2026-05-12

Biến MDpreview từ markdown viewer đơn thuần thành **wiki reader** — hiểu cấu trúc tài liệu, điều hướng thông minh qua internal links, và expose relationship graph cho Claude Code.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  Workspace (.md files)                              │
│       ↓ scan                                        │
│  WikiIndexer (server)  →  .wiki-index.json          │
│       ↓ serve                                       │
│  GET /api/wiki/index                                │
│       ↓ cache                                       │
│  WikiService (renderer) — classifyLink, getBacklinks│
│       ↓ intercept                                   │
│  MarkdownViewerComponent — link click handler       │
│       ↓ open                                        │
│  WikiDrawer — side panel, renders linked file       │
│  BacklinksPanel — "referenced by" list              │
└─────────────────────────────────────────────────────┘
```

**Control plane:**
```
WikiScannerControl (sidebar button)
  → Electron IPC (wiki:enable / wiki:disable / wiki:rescan / wiki:remove)
  → workspace.wikiScanner config (persisted)
  → WikiIndexer on/off
```

---

## Files

| File | Role |
|------|------|
| `server/services/wiki-indexer.js` | Build & write `.wiki-index.json` |
| `server/routes/wiki.js` | REST API (`/api/wiki/*`) |
| `electron/ipc/wiki.js` | IPC bridge cho scanner controls |
| `renderer/js/services/wiki-service.js` | Load index, classifyLink, getBacklinks |
| `renderer/js/modules/wiki-scanner-control.js` | Sidebar button + onboarding modal |
| `renderer/js/components/organisms/wiki-drawer-component.js` | Side drawer UI |
| `renderer/css/design-system/organisms/wiki-drawer.css` | Drawer styles |
| `renderer/css/design-system/molecules/wiki-onboarding.css` | Onboarding modal styles |

---

## Scanner State Machine

Wiki Scanner là **opt-in per workspace** — không workspace nào bị scan ngoài ý muốn.

```
[off] ──Enable──► [scanning] ──done──► [active]
                     │                    │
                   error                Disable
                     │                    │
                  [error]            [inactive]
                     │                    │
              Remove & Clean       Remove & Clean
                     └──────────────────►[off]
```

State được lưu trong `workspace.wikiScanner`:

```javascript
{
  enabled: boolean,
  status: 'off' | 'scanning' | 'active' | 'inactive' | 'error',
  indexPath: string,       // absolute path đến .wiki-index.json
  lastScanned: string,     // ISO timestamp
  errorMessage: string | null
}
```

---

## Index Format (`.wiki-index.json`)

```javascript
{
  generated_at: string,          // ISO timestamp
  vault_root: string,            // absolute path
  id_to_path: { [id]: relPath }, // "AIChatService.sendMessage" → "refs/..."
  path_to_id: { [relPath]: id }, // reverse map
  outgoing: {
    [relPath]: {
      flows: string[],           // từ frontmatter related-flows / flows
      functions: string[],       // từ frontmatter referenced-functions
      decisions: string[],       // từ frontmatter governed-by / decisions
      generic: string[]          // từ `backtick mentions` + [relative links]
    }
  },
  backlinks: { [id]: string[] }  // id → [ids that reference it]
}
```

**3-Pass build:**
1. **Pass 1** — `gray-matter` parse frontmatter → thu `id`, `related-flows`, `referenced-functions`, `governed-by`
2. **Pass 2** — scan body: backtick `` `ID` `` (filter by known IDs) + relative markdown links `[text](./file.md)`
3. **Pass 3** — reverse outgoing graph → `backlinks`

Atomic write: ghi `.tmp` → rename cũ thành `.bak` → rename `.tmp` thành chính thức.

---

## Link Classification (`WikiService.classifyLink`)

```javascript
WikiService.classifyLink(href, currentRelativePath)
// Returns:
// { type: 'external', url }
// { type: 'anchor', anchor }          — href bắt đầu bằng '#'
// { type: 'internal', resolvedPath, anchor, id }
// { type: 'unknown' }
```

**Priority:**
1. `http://`, `https://`, `mailto:`, `tel:` → `external`
2. `#...` → `anchor`
3. `./` hoặc `../` hoặc `.md` → resolve relative path → `internal`
4. matches `id_to_path` key → `internal`
5. else → `unknown`

---

## WikiDrawer

```javascript
WikiDrawer.open(filePath, anchor?)  // mở drawer, render file, scroll to anchor
WikiDrawer.close()
WikiDrawer.isOpen()
```

- Resizable: kéo left-edge resizer, persist vào `localStorage('ds-wiki-drawer-width')`
- Internal links trong drawer → gọi lại `WikiDrawer.open()` (update content, không stack)
- Anchor navigation: polling `querySelector[id]` tối đa 2s sau khi render
- Esc → close; overlay click → close; "Open in main view" → `loadFile()` + close

---

## API Endpoints

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `GET /api/wiki/index` | GET | Trả toàn bộ WikiIndex JSON |
| `GET /api/wiki/status` | GET | Trạng thái scanner hiện tại |
| `POST /api/wiki/enable` | POST | Kích hoạt scanner |
| `POST /api/wiki/disable` | POST | Tạm dừng scanner |
| `POST /api/wiki/rescan` | POST | Rebuild full index |
| `POST /api/wiki/remove` | POST | Xóa index + dừng scanner |

Auto-reindex: file watcher trên `.md` files → debounce 1.5s → rebuild → emit `wiki-index-updated` qua Socket.io → `WikiService.init()` được gọi lại ở renderer.

---

## Usage Convention

Doc file nào có `id:` trong frontmatter sẽ được index. Mention trong body dùng backtick:

```markdown
---
id: chat-send-message
related-flows: [prepare-pipeline]
---

Flow này gọi function `AIChatService.sendMessage` để...
```

→ Indexer tự build relationship. Không cần maintain bidirectional links thủ công.

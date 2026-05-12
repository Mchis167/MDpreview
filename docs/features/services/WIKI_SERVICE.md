# Wiki Service (Indexer & Graph)

**Modules:** `server/services/wiki-indexer.js`, `server/routes/wiki.js`, `renderer/js/services/wiki-service.js`  
**Status:** Complete (v1.9.0)  
**Last Updated:** 2026-05-12

> Xem kiến trúc tổng thể tại [WIKI_READER.md](../WIKI_READER.md).

---

## 1. Server — WikiIndexer

Lớp `WikiIndexer` (Node.js) quét toàn bộ `.md` files trong workspace theo quy trình 3 bước:

**Pass 1 — Frontmatter:** `gray-matter` parse `id`, `related-flows`, `referenced-functions`, `governed-by`.  
**Pass 2 — Body content:** Backtick `` `ID` `` (filter by known IDs) + relative markdown links `[text](./file.md)`.  
**Pass 3 — Backlinks:** Đảo ngược outgoing graph.

**Atomic write:** ghi `.tmp` → rename cũ thành `.bak` → rename `.tmp` thành `.wiki-index.json`.

```javascript
const indexer = new WikiIndexer(vaultRoot);
await indexer.build();   // → writes .wiki-index.json
```

---

## 2. Server — API Endpoints (`/api/wiki/*`)

| Endpoint | Method | Mô tả |
|----------|--------|-------|
| `/index` | GET | Trả toàn bộ WikiIndex JSON |
| `/status` | GET | Trạng thái scanner (`off`, `scanning`, `active`, `error`) |
| `/enable` | POST | Kích hoạt scanner |
| `/disable` | POST | Tạm dừng scanner |
| `/rescan` | POST | Rebuild full index |
| `/remove` | POST | Xóa index + dừng scanner |

Auto-reindex: chokidar watcher trên `.md` → debounce 1.5s → rebuild → emit `wiki-index-updated` via Socket.io.

---

## 3. Renderer — WikiService

Singleton (`window.WikiService`) cache index trong memory, cung cấp API cho link interception và backlinks.

```javascript
await WikiService.init()             // fetch /api/wiki/index, cache vào memory
WikiService.isReady()                // boolean

WikiService.classifyLink(href, currentRelativePath)
// { type: 'external' | 'anchor' | 'internal' | 'unknown', resolvedPath?, anchor?, id? }

WikiService.getBacklinks(idOrPath)
// [{ id, path, title }]

WikiService.getOutgoing(relativePath)
// { flows, functions, decisions, generic }
```

`init()` được gọi lại khi nhận socket event `wiki-index-updated` để refresh cache.

---

## 4. Index Format

```javascript
{
  generated_at: string,
  vault_root: string,
  id_to_path: { [id]: relPath },
  path_to_id: { [relPath]: id },
  outgoing: {
    [relPath]: { flows: [], functions: [], decisions: [], generic: [] }
  },
  backlinks: { [id]: string[] }
}
```

---

*Document — 2026-05-12*

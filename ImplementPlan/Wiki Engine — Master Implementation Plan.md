# MDpreview Wiki Engine — Master Implementation Plan
### Lộ trình kỹ thuật chi tiết cho 4 phases

---

## Kiến trúc tổng quan đã thống nhất

### Workspace Model

```
touchfolder/                        ← Workspace root (user chọn)
  touchcodebase/                    ← Codebase path (user chỉ định)
    *.swift
    ...
  wiki/                             ← Auto-created bởi MDpreview
    .wiki-config.json               ← Codebase path, language, last_scan
    graph.json                      ← Output của scanner (read-only)
    pipelines/                      ← YAML files (user viết tay)
      note-write.yaml
      consolidation.yaml
      ...
    scanner/                        ← Python scanner source (bundled)
      scanner.py
      requirements.txt
```

### Nguyên tắc tích hợp

- Scanner Python chạy như **child process** từ Electron — không tách app riêng
- Normal workspace mode **không bị ảnh hưởng** — Wiki mode là opt-in
- `wiki/` folder **visible** trong file tree bình thường — user có thể mở và edit YAML trực tiếp
- Wiki mode = normal mode + visualization layer on top

---

## Phase 1 — Foundation (Scanner + Global Graph)

### Mục tiêu
Build Python scanner → output `graph.json` → MDpreview render Global Graph view đầu tiên.

### 1.1 Workspace Setup UI

**Trigger**: Nút "Advanced: Codebase Wiki" trong workspace settings hoặc sidebar.

**Flow**:
1. User mở workspace bình thường (folder bất kỳ)
2. Click "Enable Codebase Wiki"
3. Dialog xuất hiện:
   - **Workspace root**: đã có (current folder)
   - **Codebase path**: picker → user chọn subfolder chứa source code
   - **Language**: Swift (mặc định, có thể mở rộng)
4. MDpreview tạo `wiki/` folder + `.wiki-config.json`
5. Trigger scan lần đầu

**`.wiki-config.json` schema**:
```json
{
  "version": 1,
  "codebase_path": "./touchcodebase",
  "language": "swift",
  "last_scan": "2026-05-05T10:00:00Z",
  "wiki_mode": true
}
```

### 1.2 Python Scanner

**Input**: Đường dẫn đến codebase folder + language config  
**Output**: `wiki/graph.json`

**Scanner extract từ Swift files**:
- Tất cả `class`, `struct`, `protocol`, `enum`, `func` definitions
- Call relationships: A calls B (static analysis, best-effort)
- File membership: function X nằm trong file Y
- Line number của definition

**`graph.json` schema**:
```json
{
  "meta": {
    "scanned_at": "2026-05-05T10:00:00Z",
    "codebase_path": "./touchcodebase",
    "language": "swift",
    "total_files": 256,
    "total_nodes": 665
  },
  "nodes": [
    {
      "id": "MemoryStore.add",
      "type": "function",
      "file": "MemoryStore.swift",
      "line": 42,
      "doc_status": "missing",
      "connectedness": 41
    }
  ],
  "edges": [
    {
      "from": "MemoryStore.add",
      "to": "AITaggingEngine.processNote",
      "type": "calls"
    }
  ]
}
```

**Connectedness score**: số lượng nodes khác có edge đến node này (in-degree). Hub = top 10% connectedness.

**Doc status logic**:
- `missing`: không có comment block trước definition
- `partial`: có comment nhưng < 2 dòng
- `complete`: có comment >= 2 dòng hoặc có DocC format (`///`)

### 1.3 Electron ↔ Scanner Integration

```
Renderer (JS) → ipcRenderer.send('run-scan')
Main Process → spawn python3 scanner.py --config wiki/.wiki-config.json
Scanner → write wiki/graph.json
Main Process → ipcRenderer.send('scan-complete')
Renderer → reload graph view
```

**Error handling**:
- Python không install → thông báo rõ, link hướng dẫn
- Scanner crash → show stderr trong UI, không crash app
- Scan timeout (> 60s) → cancel + warning

### 1.4 Global Graph View (View 1)

**Render**: Force-directed graph dùng D3.js (đã có trong nhiều Electron apps, nhẹ, không cần bundler).

**Visual encoding**:
- **Node size**: proportional to connectedness score
- **Node color**:
  - Xanh lá: doc status = complete
  - Vàng: partial
  - Đỏ: missing
  - Đỏ viền đậm: node xuất hiện trong `danger_zones` của bất kỳ YAML nào (Phase 2+)
- **Edge**: thin grey lines, directional arrows

**Interactions**:
- Click node → side panel hiển thị: file path, line number, connectedness, doc status
- Hover node → highlight tất cả direct neighbors
- Search box → filter + center graph vào node match
- Zoom + pan

**Trigger scan**: Nút "Re-scan" trong header của Graph view. Không auto-scan (tránh chạy nền tốn CPU).

---

## Phase 2 — Knowledge Layer (YAML + Pipeline View)

### Mục tiêu
Define YAML schema → user viết pipeline files → MDpreview render Pipeline View interactive.

### 2.1 YAML Schema (chuẩn hóa)

File đặt trong `wiki/pipelines/<pipeline-id>.yaml`. Schema đầy đủ như đã define trong Project Brief, không thay đổi. Tham chiếu: section 6 của Project Brief.

**Validation rules** (MDpreview check khi load YAML):
- `id` phải unique across tất cả pipeline files
- `entry` và `exit` phải là valid node IDs (có trong graph.json)
- `waypoints` array — warn nếu node không tồn tại, không block load
- `last_verified` — warn nếu > 30 ngày so với ngày hiện tại

### 2.2 Staleness Cross-check

Mỗi khi scanner chạy xong, thực hiện thêm bước cross-check:

```
FOR EACH pipeline YAML:
  FOR EACH function reference (entry, exit, waypoints, danger_zones):
    IF not found in graph.json → "unresolved_reference"
  FOR EACH file in related_files:
    IF file.last_modified > yaml.last_verified → "potentially_stale"
```

Kết quả ghi vào `wiki/staleness-report.json` — không modify YAML.

**Staleness report schema**:
```json
{
  "generated_at": "2026-05-05T10:00:00Z",
  "pipelines": {
    "note-write": {
      "status": "stale",
      "unresolved_references": ["AITaggingEngine.retagNoteAfterEditV2"],
      "stale_files": ["MemoryStore.swift"]
    },
    "consolidation": {
      "status": "ok",
      "unresolved_references": [],
      "stale_files": []
    }
  }
}
```

### 2.3 Pipeline View (View 2)

**Layout**: Horizontal flowchart — Entry → Waypoints → Exit, trái sang phải.

**Data merge**: graph.json (call relationships thực tế) + YAML (invariants, danger zones, scope).

**Node trong Pipeline View**:
- Shape tròn: waypoint bình thường
- Shape vuông: entry/exit
- Màu đỏ border: danger zone
- Click node → side panel với đầy đủ: invariants (rule + because + broken_when), danger history, scope declaration

**Edge trong Pipeline View**:
- Solid: call relationship confirmed trong graph.json
- Dashed: YAML declare nhưng không thấy trong graph (có thể runtime call)

**Pipeline selector**: Dropdown ở top — chọn pipeline nào thì render pipeline đó.

---

## Phase 3 — Consumer Features (Hover + Gap Report + AI Bundle Export)

### Mục tiêu
Ba tính năng tiêu thụ data từ tầng 1 và 2: Hover Context khi đọc Markdown, Gap Report, và AI Bundle Export.

### 3.1 Hover Context (View 3)

Khi đọc bất kỳ Markdown file nào trong workspace, text match với node IDs → hover popup.

**Match strategy**: **Exact string match only** (không NLP). Match `MemoryStore.add`, `AITaggingEngine`, v.v.

**Implementation**:
- Post-process rendered HTML: scan tất cả text nodes
- Wrap exact matches với `<span class="wiki-ref" data-node-id="...">` 
- Hover → popup hiển thị: connectedness, pipeline membership, danger zone flag, doc status

**Popup content**:
```
MemoryStore.add
─────────────────────────
Connectedness: 41 dependents  ⚠️ Critical Hub
Pipelines: note-write, embedding
Danger zones: 1 known incident
Doc status: missing
[View in Graph] [View Pipeline]
```

**Performance**: Build lookup index từ graph.json một lần khi load, không re-scan mỗi render.

### 3.2 Gap Report (View 4)

**Render**: Dedicated view trong Wiki sidebar — không phải popup, không phải modal.

**Nội dung**:

```
DOCUMENTATION COVERAGE
─────────────────────
Total functions: 665
Documented: 34 (5.1%)
Critical hubs undocumented: 12

PIPELINE COVERAGE
─────────────────
note-write: 3/7 waypoints documented
consolidation: 0/5 waypoints documented

⚠️ STALENESS WARNINGS
──────────────────────
consolidation.yaml — related_files modified 12 days ago
chat-pipeline.yaml — 2 unresolved function references

SUGGESTED NEXT ACTION
─────────────────────
→ Document MemoryStore.add (41 dependents, no doc)
→ Fix unresolved refs in chat-pipeline.yaml before exporting
```

**Suggested next action logic**: Sort undocumented nodes by connectedness → suggest top 3.

### 3.3 AI Bundle Export — Pipeline Bundle

**Trigger**: Nút "Export AI Bundle" trong Pipeline View.

**Gate**: Nếu pipeline có `unresolved_references` trong staleness report → **block export**, hiển thị lỗi rõ ràng. Stale file warnings → **warn nhưng không block** (user phải acknowledge).

**Output format**: Markdown file được copy vào clipboard hoặc save ra file.

**Bundle structure**:
```markdown
# AI Context Bundle: note-write pipeline
Generated: 2026-05-05 | Verified: 2026-05-04

## Pipeline Overview
Entry: MemoryStore.add → Exit: EmbeddingManager.scheduleEmbedding
Waypoints: AITaggingEngine.processNote → AITaggingEngine.retagNoteAfterEditV2

## Invariants (Critical — read before modifying)
1. invalidateAIMetadata() phải gọi trước scheduleEmbedding()
   WHY: scheduleEmbedding đọc AI metadata để build embedding vector
   BROKEN WHEN: note được edit nhưng embedding vẫn search theo content cũ

2. Phase 1 (tagging) phải complete trước Phase 2 (consolidation)
   WHY: Consolidation đọc tags để group episodes
   BROKEN WHEN: background consolidation trigger quá sớm

## Danger Zones
- AITaggingEngine+Retagging: Retag với empty content trigger consolidation loop
  GUARD: NoteDiffUtility.isMeaningfulChange() phải pass trước khi vào đây
- MemoryStore.delete: Xóa note nhưng embedding không bị xóa → orphaned vectors
  GUARD: Luôn gọi EmbeddingManager.removeEmbedding() trong cùng transaction

## Scope Declaration
SAFE TO MODIFY: AITaggingEngine+TagSelection.swift, NoteDiffUtility.swift
DO NOT TOUCH WITHOUT ASKING: AITaggingEngine+Retagging.swift, MemoryStore.swift
MUST RUN AFTER CHANGE: SearchTests (khi động EmbeddingManager), IntegrationTests/NoteWrite (khi động MemoryStore)

## Related ADRs
- ADR-003: Why AI tagging runs synchronously in Phase 1
- ADR-007: Embedding invalidation strategy
```

### 3.4 AI Bundle Export — Impact Bundle (per function)

**Trigger**: Click node bất kỳ trong Global Graph → "Export Impact Bundle for this function".

**Bundle structure**:
```markdown
# AI Impact Bundle: MemoryStore.add
Generated: 2026-05-05

## Blast Radius
Upstream callers: [list]
Downstream triggers: [list]
Pipelines affected if changed: note-write, embedding (2 pipelines)
Connectedness: 41 dependents — CRITICAL HUB

## Invariants directly involving this function
[filtered from all pipeline YAMLs]

## Danger history
[filtered danger_zones entries for this function]

## Scope
DO NOT TOUCH WITHOUT ASKING — 41 files depend on this function
```

---

## Phase 4 — Intelligence

### Mục tiêu
Tự động hóa phần còn lại — detection thông minh hơn, suggestions, git integration.

### 4.1 Auto-suggest Pipeline Membership

Sau khi scanner build graph, analyze clusters của tightly connected nodes → suggest "These functions might form a pipeline" → user confirm và tạo YAML template tự động.

### 4.2 Coverage Trending

Track `doc_status` qua nhiều lần scan → line chart: documentation coverage theo thời gian. Đơn giản: append mỗi scan result vào `wiki/coverage-history.json`.

### 4.3 Git Hook Integration

Post-commit hook tự động trigger scanner khi có Swift file thay đổi:

```bash
# .git/hooks/post-commit
changed=$(git diff HEAD~1 --name-only | grep "\.swift$")
if [ -n "$changed" ]; then
  python3 wiki/scanner/scanner.py --config wiki/.wiki-config.json --quiet
fi
```

MDpreview watch `graph.json` bằng `fs.watch` → tự reload khi file thay đổi.

### 4.4 Unresolved Reference Auto-detection trong Editor

Khi user đang edit YAML (trong MDpreview), real-time validate function names gõ vào → underline đỏ nếu không tìm thấy trong graph.json. Không cần re-scan — dùng graph.json hiện có.

---

## Dependency Map giữa các phases

```
Phase 1: graph.json + Global Graph
    ↓
Phase 2: YAML schema + staleness-report.json + Pipeline View
    ↓
Phase 3: Hover Context + Gap Report + AI Bundle Export
    ↓
Phase 4: Auto-suggest + Trending + Git hooks + Real-time validation
```

Mỗi phase hoàn toàn usable độc lập — Phase 2 có thể ship mà không cần Phase 3 xong.

---

## Files mới trong MDpreview codebase

```
renderer/js/components/organisms/
  wiki-global-graph.js          ← Phase 1: D3 force-directed graph
  wiki-pipeline-view.js         ← Phase 2: Pipeline flowchart
  wiki-gap-report.js            ← Phase 3: Gap report panel
  wiki-hover-context.js         ← Phase 3: Hover popup engine

renderer/js/modules/
  wiki-manager.js               ← Orchestrator: load config, graph, YAML
  wiki-scanner-bridge.js        ← Electron IPC → spawn Python scanner
  wiki-bundle-export.js         ← Phase 3: Generate AI bundle markdown

renderer/css/
  wiki.css                      ← Tất cả wiki-specific styles

wiki-scanner/                   ← Bundled trong app
  scanner.py
  requirements.txt              ← stdlib only, không cần pip install

main/
  scanner-ipc.js                ← Main process handler cho scan requests
```

---

## Quyết định kỹ thuật đã lock

| Quyết định | Lựa chọn | Lý do |
|---|---|---|
| Scanner language | Python | Ecosystem tốt cho AST parsing Swift |
| Graph rendering | D3.js | Không bundler, nhẹ, đủ dùng |
| Scanner integration | Child process từ Electron | Không tách app, đơn giản |
| YAML validation | Cross-check với graph.json | Ground truth, không guessing |
| AI Bundle format | Markdown | Paste thẳng vào Claude Code context |
| Hover match strategy | Exact string match | Không NLP, predictable, fast |
| wiki/ visibility | Visible trong file tree | User có thể edit YAML trực tiếp |

---

*Master Plan — MDpreview Wiki Engine — May 2026*  
*Dựa trên Project Brief + decisions từ planning session*

# MDpreview Wiki Engine — Project Brief
### Bài toán, Giải pháp và Lộ trình triển khai

---

## 1. Bối cảnh

MDpreview đã hình thành được một nền tảng khá vững chắc với vai trò là một Markdown previewer chuyên nghiệp — hỗ trợ đọc file, comment nhanh, và chuyển giao tài liệu cho AI. Tuy nhiên, để ứng dụng tiếp tục phát triển theo một hướng có giá trị thực sự cao hơn, mục tiêu nghiên cứu tiếp theo là nâng cấp MDpreview vượt ra ngoài vai trò thuần preview — biến nó thành một wiki engine thông minh có khả năng giúp cả người dùng lẫn AI agent làm việc với codebase một cách chính xác và có hệ thống.

Thay vì chỉ hiển thị nội dung tĩnh của từng file Markdown riêng lẻ, hướng phát triển này nhắm đến việc MDpreview có thể nhìn thấy mạng lưới quan hệ giữa các thực thể trong codebase — hàm nào gọi hàm nào, pipeline nào gồm những bước gì, quyết định kiến trúc nào ảnh hưởng đến hành vi nào — và trình bày tất cả điều đó dưới dạng visual, interactive, và có thể export thành context trực tiếp cho AI agent sử dụng.

### Phạm vi và case study:
MDpreview Wiki Engine là một **general-purpose tool** — không được build riêng cho bất kỳ codebase nào. Mục tiêu là một hệ thống có thể áp dụng cho bất kỳ project nào của author, bắt đầu từ Swift/UIKit và có thể mở rộng sang các ngôn ngữ khác.

**Touch được dùng làm case study đầu tiên** — không phải vì wiki được build riêng cho Touch, mà vì Touch đặt ra đủ các vấn đề phức tạp để kiểm chứng hệ thống: một iOS personal CRM journal app với bề mặt đơn giản (user viết note về mối quan hệ) nhưng ẩn bên dưới là hệ thống AI analysis phức tạp với hơn 256 Swift files, 665 functions, và nhiều cascade pipelines đan xen. Nếu wiki engine hoạt động tốt với Touch, nó hoạt động tốt với bất kỳ iOS codebase nào có độ phức tạp tương đương hoặc thấp hơn.

Tất cả các ví dụ cụ thể trong document này (function names, pipeline names, YAML samples) đều lấy từ Touch để minh họa — không phải để mô tả behavior cứng của hệ thống.

> **MDpreview** là Electron-based Markdown viewer (vanilla JS, no bundler) — tool làm việc chính của author. Mục tiêu: nâng cấp MDpreview thành một **Wiki Engine** thực sự phục vụ cho Touch codebase cũng như những ứng dụng khác của tác giả. Trước mắt có thể tập trung cho iOS app (Swift / UIKit) và có thể mở rộng, tiếp tục finetune cho các ngôn ngữ khác trong tương lai.

---

## 2. Vấn đề cụ thể (4 pain points)

### 2.1 Memory decay — "Quên sau 3 tháng"
Author xuất thân product designer, không phải senior dev. Sau một thời gian không nhìn vào codebase, toàn bộ context về "pipeline này hoạt động thế nào, gồm những hàm nào" bị mất hoàn toàn. Không có visual map, không có summary cấu trúc.

### 2.2 Documentation vacuum — "Ban đầu không có bài bản"
App bắt đầu đơn giản, không ai nghĩ đến việc viết doc. Giờ codebase đã lớn nhưng không biết bắt đầu doc từ đâu, doc cái gì trước, cái gì quan trọng hơn.

### 2.3 ADR fragmentation — "Quyết định kiến trúc rải rác"
ADR (Architecture Decision Records) tồn tại như một bộ phận tách biệt. Khi đọc một hàm, không có cơ chế nào cho biết "quyết định này liên quan đến ADR nào, tại sao nó phải hoạt động như vậy".

### 2.4 AI agent blind spots + tokenomics — Vấn đề nghiêm trọng nhất

AI coding agents năm 2026 (Claude Code, Cursor, Copilot...) đọc code rất tốt — trace call graph, hiểu cấu trúc, suggest implementation. Tuy nhiên có hai vấn đề độc lập nhau, cùng tồn tại:

**Vấn đề 1 — Tokenomics: exploration overhead**

Dù AI có tools tốt, việc tự explore vẫn tốn token. Để hiểu MemoryStore.add trước khi bắt đầu task, AI vẫn phải: đọc file → trace callers → đọc các file phụ thuộc → suy luận cascade. Tất cả các bước đó consume context window, ngay cả khi thực hiện nhanh và chính xác. CLAUDE.md giải quyết một phần nhưng không đủ — nó là flat text, loaded toàn bộ vào context mỗi session bất kể task scope, và không queryable theo từng function hay pipeline.

- **Exploration overhead**: Mỗi session, AI tự explore lại từ đầu dù codebase không thay đổi — token dùng cho re-discovery không đóng góp vào task thực tế
- **CLAUDE.md ceiling**: File càng lớn càng ăn vào working context; không thể inject "chỉ phần liên quan đến MemoryStore.add" mà không kéo theo toàn bộ project knowledge

**Vấn đề 2 — Human decisions: thứ không đọc được từ code**

Có một loại knowledge mà không tool nào tự generate được dù đọc toàn bộ codebase:

- **Missing intent**: AI không biết *tại sao* một rule tồn tại — chỉ thấy rule, không thấy lý do. Khi gặp edge case mới, AI không có cơ sở để phán đoán đúng.
- **Missing danger history**: AI không biết những lỗi đã từng xảy ra trong project này. Không có gì ngăn AI tiếp cận theo đúng cách đã gây ra lỗi trước đó.
- **Technically correct, intentionally wrong**: AI implement đúng về mặt kỹ thuật nhưng vi phạm một ràng buộc chưa được document — vì ràng buộc đó chỉ tồn tại trong đầu author.
- **Scope ambiguity**: Khi sửa một function, AI không biết ranh giới nào bạn muốn giữ nguyên — phải đoán thay vì được hướng dẫn rõ.

> Hai vấn đề này độc lập nhau — và đó là lý do hệ thống này bền vững: ngay cả khi token trở nên rẻ hơn hoặc context window lớn hơn nữa, vấn đề thứ 2 vẫn còn nguyên giá trị.

---

## 3. Insight cốt lõi

### Có hai loại "người đọc" với nhu cầu khác nhau hoàn toàn

| | Human (author) | AI Agent |
|---|---|---|
| Đọc như thế nào | Visual, spatial, cần big picture | Sequential, cần structured data |
| Thất bại khi | Không thấy how things connect | Không biết human decisions và incident history |
| Có thể tự làm | Đọc code và hiểu | Đọc code, trace call graph, suggest implementation |
| Không thể tự làm | Nhớ context sau vài tháng | Biết *tại sao* một rule tồn tại và *điều gì* đã từng sai |
| Token cost | N/A | Exploration overhead mỗi session — dù explore nhanh vẫn tốn |
| Cần gì | Interactive diagram, hover context | Precision-injected bundle: đúng scope, đúng task, không re-explore |

**Traditional documentation chỉ phục vụ một loại.** Solution cần phục vụ cả hai đồng thời.

### Vấn đề không phải là "thiếu doc" — mà là thiếu structural awareness

Không biết mình đang thiếu doc ở đâu. Không biết hàm nào quan trọng nhất. Không thấy được mạng lưới quan hệ giữa các components. → Cần "nhìn thấy cái cây trước khi vẽ từng chiếc lá".

### Code graph analysis đã là commodity — differentiator nằm ở knowledge layer

Năm 2026, nhiều tool đã tự động index và visualize codebase (Sourcegraph, Copilot workspace, Cursor). Giá trị thực sự của hệ thống này không phải là phân tích code — mà là nơi duy nhất lưu trữ những gì không tool nào tự generate được: invariants với lý do, lịch sử incident, và ranh giới intent của author.

### Documentation truyền thống ghi "cái gì", không ghi "tại sao"

Khi AI agent đọc một invariant mà không biết lý do tồn tại của nó, AI chỉ có thể follow rule mù quáng — không thể phán đoán edge case mới. Knowledge layer thực sự có giá trị phải giải thích *tại sao* rule tồn tại, *khi nào* nó bị vi phạm, và *điều gì* đã từng sai trong quá khứ.

---

## 4. Giải pháp — MDpreview Wiki Engine

### Kiến trúc 3 tầng (tách biệt hoàn toàn)

```
TẦNG 3 — PRESENTATION (MDpreview UI)
  Visual graph | Pipeline view | Hover context | Gap Report | AI Bundle Export

TẦNG 2 — KNOWLEDGE (Human-authored YAML, ~10-15 files)        ← Core differentiator
  Pipeline definitions | Invariants + WHY | Danger history | Scope declarations | ADR links

TẦNG 1 — DISCOVERY (Automated scanner)
  Swift parser → Call graph → Hub detection → Staleness check → graph.json
```

**Nguyên tắc**: Tầng 1 tự động hóa phần máy làm được — đọc code, build graph, phát hiện stale. Tầng 2 là nơi duy nhất viết tay những gì máy không bao giờ suy luận được. Tầng 3 render từ data của hai tầng kia, phục vụ cả human reader lẫn AI agent.

---

## 5. Tầng 1 — Discovery Layer

Scanner Python scan toàn bộ `.swift` files, extract:
- Tất cả classes, structs, protocols, functions
- Call relationships (A calls B)
- Hub detection (connectedness score per node)
- Doc status (missing / partial / complete)

Output: **`graph.json`** — read-only, overwritten mỗi lần scan, không ai viết tay.

### Staleness Detection — Cross-check YAML vs. graph.json

Mỗi lần scanner chạy, nó thực hiện thêm một bước: cross-check tất cả function names trong YAML với graph.json.

```
⚠️ Unresolved References (note-write.yaml):
  - waypoint "AITaggingEngine.retagNoteAfterEditV2" → NOT FOUND
  - entry "MemoryStore.add" → OK
  - related_files modified since last_verified (3 files) → POTENTIALLY STALE
```

Nếu YAML có unresolved reference → **AI Bundle Export bị block** cho pipeline đó. Đây là leverage point quan trọng nhất: buộc update trước khi inject context sai vào AI.

**Hai cơ chế staleness detection:**
1. **Reference integrity** (ground truth): function trong YAML không còn tồn tại trong graph.json
2. **File watch heuristic** (early warning): Swift files trong `related_files` bị modify kể từ `last_verified`

**Ví dụ output từ Touch codebase (case study):**
- MemoryStore: 41 files depend → Critical Hub #1
- RelationshipStore: 38 files depend → Critical Hub #2
- AITaggingEngine có 9 extension files, ~2,300 lines tổng cộng → God Object cần document nhất
- 85% trong 665 functions chưa có documentation

---

## 6. Tầng 2 — Knowledge Layer

Chỉ ~10-15 YAML files cho toàn bộ app. Nguyên tắc cốt lõi: **chỉ viết những gì máy không suy luận được** — invariants với lý do tồn tại, lịch sử lỗi, và ranh giới intent.

Đây là tầng có giá trị cao nhất và không thể bị thay thế bởi bất kỳ AI tool nào, vì nó lưu trữ human decisions — không phải code facts.

### YAML Schema đầy đủ

```yaml
id: note-write
last_verified: 2026-05-04
related_files:
  - MemoryStore.swift
  - AITaggingEngine+Core.swift
  - AITaggingEngine+Retagging.swift
  - EmbeddingManager.swift

entry: MemoryStore.add
exit: EmbeddingManager.scheduleEmbedding
waypoints:
  - AITaggingEngine.processNote
  - AITaggingEngine.retagNoteAfterEditV2

invariants:
  - rule: "invalidateAIMetadata() phải gọi trước scheduleEmbedding()"
    because: "scheduleEmbedding đọc AI metadata để build embedding vector — nếu metadata cũ, vector sẽ không reflect note mới nhất"
    broken_when: "note được edit nhưng embedding vẫn search theo content cũ"

  - rule: "Phase 1 (tagging) phải complete trước Phase 2 (consolidation)"
    because: "Consolidation đọc tags để group episodes — tags chưa xong thì grouping sai"
    broken_when: "background consolidation trigger quá sớm sau khi note write"

edge_cases:
  - condition: "content không đổi sau edit"
    handler: "NoteDiffUtility.isMeaningfulChange() → skip toàn bộ pipeline"
  - condition: "note bị xóa trong khi pipeline đang chạy"
    handler: "MemoryStore.exists() check tại mỗi waypoint — abort nếu false"

danger_zones:
  - function: "AITaggingEngine+Retagging"
    incident: "Retag với empty content trigger consolidation loop vô hạn"
    guard: "NoteDiffUtility.isMeaningfulChange() phải pass trước khi vào đây"

  - function: "MemoryStore.delete"
    incident: "Xóa note nhưng embedding không bị xóa → orphaned vectors tích tụ theo thời gian"
    guard: "Luôn gọi EmbeddingManager.removeEmbedding() trong cùng transaction"

scope_declaration:
  safe_to_modify:
    - "AITaggingEngine+TagSelection.swift — logic chọn tag, isolated, no cascade"
    - "NoteDiffUtility.swift — pure utility, no side effects"
  do_not_touch_without_asking:
    - "AITaggingEngine+Retagging.swift — 479 lines, nhiều known edge cases"
    - "MemoryStore.swift — 41 files depend, cascade risk rất cao"
  must_run_after_change:
    - test: "SearchTests"
      when: "động vào EmbeddingManager"
    - test: "IntegrationTests/NoteWrite"
      when: "động vào MemoryStore"

adr_links:
  - "ADR-003: Why AI tagging runs synchronously in Phase 1"
  - "ADR-007: Embedding invalidation strategy"
```

**Ví dụ: 5 pipelines được identify từ Touch codebase (case study)**
1. Note Write/Edit Pipeline (nguy hiểm nhất — entry point của cascade)
2. Background Consolidation Pipeline (Episode synthesis, Thematic rollup, Belief crystallization)
3. AI Chat Pipeline (Context assembly → Response → Signal scanning)
4. Tag Correction Pipeline (User-triggered re-analysis)
5. Embedding & Similarity Pipeline (Semantic search infrastructure)

*Với codebase khác, số lượng và tên pipelines sẽ khác — schema YAML không thay đổi.*

### Quy tắc maintain YAML

**YAML update = một phần của "definition of done"** cho mỗi coding session. Trước khi đóng session với AI:
- Pipeline nào vừa bị touch?
- Invariant nào còn đúng, cái nào đã thay đổi?
- Có danger zone mới nào vừa được discover không?

Nếu update trở thành thói quen *cuối session* (khi context vẫn còn fresh), maintenance cost gần như về zero.

---

## 7. Tầng 3 — Presentation Layer (5 views + 1 bundle type bổ sung)

### View 1: Global Graph
Force-directed graph toàn bộ codebase. Node size = connectedness. Màu = doc status. Click node → doc panel. Node thuộc danger zone → border đỏ.

### View 2: Pipeline View
Interactive diagram cho từng pipeline. Merge call graph thực tế (từ graph.json) với invariants/edge cases/danger zones (từ YAML). Side panel hiển thị đầy đủ context khi click node, bao gồm `because` của mỗi invariant.

### View 3: Hover Context
Khi đọc bất kỳ Markdown file nào, text match với node ID → hover popup hiển thị: connectedness score, pipeline membership, danger zone status, linked ADRs. Không cần navigate ra khỏi trang.

### View 4: Gap Report
```
Documentation Coverage: 34/665 (5.1%)
Critical undocumented: MemoryStore.add (18 connections), AITaggingEngine (15)
Pipeline coverage: note-write pipeline: 3/7 waypoints documented

⚠️ Stale warnings:
  - consolidation.yaml: related_files modified 12 days ago, not re-verified
  - chat-pipeline.yaml: 2 unresolved function references

Suggested next: write danger_zones for consolidation pipeline
```

### View 5: AI Bundle Export — Pipeline Bundle

Click "Export AI Bundle for Pipeline: note-write" → generate file inject thẳng vào Claude Code context.

Bundle giải quyết đồng thời cả hai vấn đề của 2.4:

**Tokenomics**: Thay vì AI tự explore từ đầu, bundle cung cấp pre-computed knowledge đúng scope của task. 30 dòng YAML chứa nhiều thông tin actionable hơn đọc 10 Swift files — và không ăn vào working context của session.

**Human decisions**: Bundle chứa những gì không tool nào tự generate được dù đọc toàn bộ codebase:
- Invariants **với `because` và `broken_when`** — AI hiểu lý do, không chỉ follow rule mù quáng
- Danger zones và lịch sử incident — AI không tái tạo lỗi cũ
- Scope declaration: ranh giới rõ ràng về những gì được phép và không được phép thay đổi
- ADR references — quyết định kiến trúc liên quan

**Bundle bị block nếu YAML có unresolved references hoặc stale warning chưa được acknowledge.**

> So sánh với CLAUDE.md: CLAUDE.md load toàn bộ mỗi session bất kể task. Bundle inject đúng thứ cần cho task hiện tại — precision thay vì broadcast.

### View 5b: AI Bundle Export — Impact Bundle (theo function)

Loại bundle thứ hai, scope nhỏ hơn và chính xác hơn. Export theo một function cụ thể thay vì theo pipeline:

"Export Impact Bundle for: MemoryStore.add"

Bundle chứa:
- Upstream: tất cả callers của function này
- Downstream: tất cả functions mà nó trigger
- Ripple risk: bao nhiêu pipelines bị ảnh hưởng nếu thay đổi
- Invariants liên quan trực tiếp đến function này
- Danger history của function này

Đây là bundle phù hợp nhất khi AI sắp modify một function cụ thể — inject đúng context cần thiết, không thừa không thiếu.

---

## 8. Ripple Map — tính năng đặc biệt cho cascade architecture

Touch app có đặc điểm riêng: mọi action đều trigger cascade. Sự phức tạp này nằm trong runtime behavior — không tool nào visualize được từ static analysis.

Hover vào bất kỳ function nào → hiển thị:
- **Upstream**: ai gọi function này
- **Downstream**: function này trigger những gì
- **Ripple risk**: nếu thay đổi function này, bao nhiêu pipelines bị ảnh hưởng
- **Danger flag**: function này có trong danger_zones của pipeline nào không

Đây là thứ AI agents cần nhất và documentation truyền thống không bao giờ cung cấp được — không phải vì AI kém, mà vì cascade behavior là knowledge của author, không phải thông tin đọc được từ code.

---

## 9. Tại sao giải pháp này scale

| Khi... | Hệ thống phản ứng |
|---|---|
| Thêm function mới | Scanner tự pick up, xuất hiện trong graph |
| Rename function | Graph tự cập nhật, YAML show "unresolved reference" → bundle bị block |
| Thêm pipeline mới | Viết thêm 1 YAML file (~30 dòng với full schema) |
| Developer mới join | Đọc Gap Report → biết ngay cần doc gì; đọc danger_zones → biết ngay cần tránh gì |
| AI agent bắt đầu task | Import Impact Bundle → không cần guess intent, không tái tạo lỗi cũ |
| AI tool mới ra đời | Tầng 1 có thể bị thay thế; Tầng 2 YAML vẫn là nguồn truth duy nhất |
| Codebase tăng gấp đôi | Scanner chạy lâu hơn vài giây, còn lại không đổi |
| Sau một thời gian không touch | Staleness warnings chỉ rõ YAML nào cần re-verify trước |

---

## 10. Lộ trình triển khai (4 phases)

**Phase 1 — Foundation**
Build scanner → output graph.json (bao gồm staleness check cross-reference với YAML) → MDpreview đọc và render Global Graph view

**Phase 2 — Knowledge Layer**
Định nghĩa YAML schema đầy đủ (invariants với `because`, `danger_zones`, `scope_declaration`, `last_verified`) → Viết 5 pipeline files cho Touch → Pipeline View trong MDpreview

**Phase 3 — Consumer Features**
Hover context engine → Gap Report (bao gồm stale warnings) → AI Bundle Export (Pipeline Bundle + Impact Bundle per function, với staleness gate)

**Phase 4 — Intelligence**
Unresolved reference detection → Auto-suggest pipeline membership → Coverage trending → Git hook integration để trigger scanner tự động khi commit

---

*Document prepared for MDpreview Wiki Engine project — May 2026*

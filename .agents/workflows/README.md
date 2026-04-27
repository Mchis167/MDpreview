---
title: MDPreview Workflow System
description: Comprehensive guide to all development workflows for MDPreview project
version: 1.0.0
last_updated: 2026-04-25
---

# 📚 MDPreview Workflow System

Bộ quy trình chuẩn hoá toàn diện để phát triển tính năng, quản lý mã, kiểm thử, và release trong MDPreview — đảm bảo chất lượng, consistency, và scalability.

---

## 🎯 Workflow Philosophy

**Mục đích:** Làm cho mọi quy trình phát triển trở nên rõ ràng, lặp lại được, và dễ bảo trì.

**3 Nguyên tắc chính:**

1. **Analysis-First** — Phân tích kỹ, lập kế hoạch trước khi viết code
2. **Quality Gates** — Linting, testing, verification là bắt buộc (không bypass)
3. **Minimal Diffs** — Chỉ thay đổi cần thiết, không cleanup hay reformat bừa bãi

---

## 📋 Tất cả Workflows

### 🏗️ Core Workflow System (0-9)

#### 0️⃣ `/startup` — Khởi động & Cập nhật bối cảnh
**Mục đích:** Đảm bảo AI nắm vững bối cảnh, quy tắc và lịch sử dự án trước khi hành động.

**Khi dùng:**
- Ngay khi bắt đầu một phiên trò chuyện mới.
- Khi chuyển sang một nhiệm vụ lớn hoặc module mới.

**Key features:**
- ✅ Mandatory read: rules, changelog, architecture.
- ✅ Context audit: docs, decisions, function-docs.
- ✅ Environment check: files, dependencies.
- ✅ Briefing: Tóm tắt bối cảnh và đề xuất bước tiếp theo.

**File:** [0.startup.md](0.startup.md)

---

#### 1️⃣ `/smart-edit` — Chỉnh sửa mã thông minh
**Mục đích:** Sửa code với minimal diffs, surgical edits, không ghi đè toàn bộ file

**Khi dùng:**
- Fix typo/bug trong existing code
- Update value, replace logic
- Multiple edits trong cùng file

**Key features:**
- ✅ Edit tool (replace_file_content) cho minimal diffs
- ✅ Multi_replace cho nhiều điểm sửa
- ✅ Exact string matching (100% precision)
- ✅ Verification sau mỗi edit

**Ví dụ:**
```
/smart-edit

Task: Update CSS color #fff → var(--ds-text-primary)
1. Locate: grep -n "color: #fff" file.css
2. Read: xem context (12 dòng trước/sau)
3. Plan: exact old_string, new_string
4. Execute: Edit file.css
5. Verify: Read lại + npm run lint
```

**File:** [1.smart-edit.md](1.smart-edit.md)

---

#### 2️⃣ `/discuss` — Phân tích & thảo luận (không thay đổi code)
**Mục đích:** Phân tích kỹ, thảo luận giải pháp, không thực hiện thay đổi

**Khi dùng:**
- Hiểu cấu trúc codebase
- Phân tích vấn đề trước implement
- Review kiến trúc, logic hiện tại
- Thảo luận trade-offs của các giải pháp

**Key features:**
- ✅ Read-only (grep, find, read)
- ❌ Không Edit/Write/Bash (modify)
- ✅ Code examples (chỉ minh họa, không apply)
- ✅ Transparent trade-offs

**Ví dụ:**
```
/discuss

"How should we improve the token system?"
1. Analyze: grep + read to understand current system
2. Propose: solutions with examples (không apply)
3. Discuss: trade-offs, risks, constraints
4. Wait: for user approval to implement
```

**File:** [2.discuss.md](2.discuss.md)

---

#### 3️⃣ `/changelog` — Quản lý lịch sử thay đổi
**Mục đích:** Ghi nhật ký tất cả thay đổi theo chuẩn chuyên nghiệp

**Khi dùng:**
- Sau mỗi feature hoặc bug fix
- Trước khi release
- Cập nhật CHANGELOG.md

**Key features:**
- ✅ 3-tier classification (Added/Changed/Fixed/Deprecated/Removed/Security)
- ✅ Prepend strategy (thêm mới lên đầu)
- ✅ [Not Committed] tag (chưa commit chính thức)
- ✅ YYYY-MM-DD HH:mm timestamp format

**Ví dụ:**
```
/changelog

Sau hoàn thành feature:
1. Read: CHANGELOG.md hiện tại
2. Identify: loại thay đổi (Added/Changed/Fixed)
3. Update: Prepend vào [Not Committed] section
4. Verify: Không mất dữ liệu cũ
```

**File:** [3.changelog.md](3.changelog.md)

---

#### 4️⃣ `/github` — Tự động hóa GitHub release
**Mục đض:** Commit, push, release, update CHANGELOG tự động

**Khi dùng:**
- Sẵn sàng release version mới
- Sau khi CHANGELOG.md được cập nhật

**Key features:**
- ✅ Validate CHANGELOG.md
- ✅ Synthesize release notes
- ✅ Determine version (Major/Minor/Patch)
- ✅ Git commit + push
- ✅ Update CHANGELOG với version mới

**Ví dụ:**
```
/github

1. Check: CHANGELOG.md có [Not Committed]?
2. Extract: release notes từ items
3. Determine: v1.5.0 (semantic versioning)
4. Execute: git add . → commit → push
5. Update: [Not Committed] → [1.5.0] — 2026-04-25
```

**File:** [4.github.md](4.github.md)

---

#### 5️⃣ `/artifact-docs` — Artifact documentation strategy
**Mục đích:** Quản lý khi nào dùng Artifact vs Chat

**Khi dùng:**
- Tạo plan, test cases, audit reports
- Giữ chat gọn gàng, tài liệu chi tiết

**Key features:**
- ✅ Chat (ngắn gọn): confirm, notify, ask
- ✅ Artifact (chi tiết): plan, test cases, guides
- ✅ Metadata: title, created, updated, status
- ✅ Tóm tắt < 5 câu trong chat, dẫn link

**Ví dụ:**
```
/artifact-docs

Chat: "Tôi đã tạo Implementation Plan tại [link]. 
3 files thay đổi, ~2 giờ. Bạn có đồng ý không?"

Artifact: [250+ dòng chi tiết: objective, files, steps, risks, checklist]
```

**File:** [5.artifact-docs.md](5.artifact-docs.md)

---

#### 6️⃣ `/console-test` — Kiểm thử tự động trên browser console
**Mục đích:** Tạo JavaScript test scripts chạy trực tiếp trên console

**Khi dùng:**
- Test logic module mà không cần unit test framework
- Verify AppState, events, integration
- Manual automation testing

**Key features:**
- ✅ AAA pattern (Arrange-Act-Assert)
- ✅ IIFE bọc script (tránh global pollution)
- ✅ console.group cho structured output
- ✅ Icons: ✅ (pass), ❌ (fail), ⚠️ (warning)

**Ví dụ:**
```
/console-test

(async function testFeature() {
  console.group('🧪 Testing: File Save');
  
  // Arrange: setup
  const mockFile = { name: 'test.md', content: '...' };
  
  // Act: execute
  await FileService.save(mockFile);
  
  // Assert: verify
  console.log('✅ File saved:', mockFile.name);
  
  console.groupEnd();
})();
```

**File:** [6.console-test.md](6.console-test.md)

---

#### 7️⃣ `/token-management` — Quản lý Design Tokens
**Mục đích:** Thêm/cập nhật/xóa tokens theo 3-tier system

**Khi dùng:**
- Thêm màu, spacing, radius token mới
- Cập nhật opacity variants (Tier 2)
- Thêm semantic tokens (Tier 3)

**Key features:**
- ✅ 3-tier system: Primitives → Alpha Palette → Semantic
- ✅ Tier identification (xác định tầng)
- ✅ Naming convention: --ds-[category]-[value]-[variant]
- ✅ Linting + verification
- ✅ ARCHITECTURE.md update

**Ví dụ:**
```
/token-management

1. Identify: Token này thuộc tier nào?
2. Check: Token đã tồn tại chưa?
3. Add: Vào tokens.css (đúng vị trí tier)
4. Verify: npm run lint:css
5. Update: ARCHITECTURE.md
```

**File:** [7.token-management.md](7.token-management.md)

---

#### 8️⃣ `/module-creation` — Tạo mới JavaScript Module
**Mục đích:** Scaffolding, đăng ký, verify module mới (Components, Services, Utilities)

**Khi dùng:**
- Tạo Atom/Molecule/Organism component
- Tạo Service module
- Tạo Utility function

**Key features:**
- ✅ Module types: Atom/Molecule/Organism/Service/Module/Utility
- ✅ IIFE pattern bắt buộc
- ✅ window.* exports explicit
- ✅ Script pipeline order (Core → Atoms → Molecules → Organisms → Services → Modules → App)
- ✅ Linting gates

**Ví dụ:**
```
/module-creation [name] [level]

1. Identify: Module type (Atom/Service/etc)
2. Create: CSS + JS file (IIFE template)
3. Register: design-system.css + index.html
4. Boot: Add init call to app.js
5. Verify: npm run lint + console test
```

**File:** [8.module-creation.md](8.module-creation.md)

---

#### 9️⃣ `/linting-gates` — Kiểm tra Linting (Mandatory Gate)
**Mục đích:** CSS + JavaScript linting verification (0 errors enforcement)

**Khi dùng:**
- Sau mỗi file change
- Trước khi commit
- Mandatory gate (không bypass)

**Key features:**
- ✅ Stylelint rules (hex color, duplicates, calc spacing)
- ✅ ESLint rules (unused vars, ===, console, exports)
- ✅ Auto-fix (khi có thể)
- ✅ Manual fix guidance (khi cần context)

**Ví dụ:**
```
/linting-gates

1. Run: npm run lint
2. Diagnose: npm run lint:css + lint:js
3. Fix: Auto-fix hoặc manual fix
4. Verify: npm run lint lại (must be 0 errors)
5. Commit: Chỉ khi hết lỗi
```

**File:** [9.linting-gates.md](9.linting-gates.md)

---

### 🛠️ Specialized Workflows

#### 🎨 `/atomic-gen` — Tạo Atomic Component
**Mục đích:** Scaffolding atom/molecule/organism component mới

Tham khảo: [create-component.md](create-component.md)

---

#### 📝 `/plan` — Implementation Planning
**Mục đp:** Lập kế hoạch trước khi implement (artifact-based)

**Checklist trước implement:**
- Objective rõ ràng
- Files to change (table)
- Step-by-step (sequential)
- Risks & considerations
- Verification checklist

Tham khảo: [plan.md](plan.md)

---

#### ✂️ `/refactor-to-atomic` — Refactor Legacy → Atomic
**Mục đích:** Bóc tách, chuyển đổi component cũ thành Atomic Design

**Quy trình:**
1. Audit legacy code (HTML/CSS/JS)
2. Create refactor plan (artifact)
3. Create new component (Atomic)
4. Migrate logic
5. Register & test
6. Cleanup old code

Tham khảo: [refactor-component.md](refactor-component.md)

---

#### 🧪 `/test` — Test Case Design
**Mục đích:** Tạo Test Suite (Functional/UI/Integration/Edge Cases)

**4 danh mục test:**
- Functional: Core logic
- UI/UX: Visual + interactions
- Integration: Module interactions
- Edge cases: Boundary + error handling

Tham khảo: [test-cases.md](test-cases.md)

---

## 🚀 Workflow Combinations (Common Patterns)

### Pattern 1: Thêm tính năng mới
```
1. /discuss          → Phân tích, thảo luận
2. /plan             → Artifact plan (wait approval)
3. /atomic-gen       → Tạo component
4. /token-management → Nếu cần token mới
5. /smart-edit       → Sửa code theo plan
6. /console-test     → Verify tính năng
7. /test             → Design test cases
8. /changelog        → Cập nhật changelog
9. /new-doc          → Tạo doc mới nếu module/tính năng chưa có doc
   /update-docs      → Hoặc update doc hiện có nếu đã có
10. /linting-gates   → Verify linting
11. /github          → Release (nếu ready)
```

### Pattern 2: Fix bug
```
1. /discuss          → Phân tích bug
2. /smart-edit       → Fix code
3. /console-test     → Verify fix
4. /linting-gates    → Check linting
5. /changelog        → Document fix
6. /update-docs      → Cập nhật docs nếu behavior thay đổi
```

### Pattern 3: Refactor component
```
1. /discuss          → Phân tích legacy code
2. /plan             → Refactor plan
3. /refactor-to-atomic → Execute refactor
4. /smart-edit       → Fine-tune nếu cần
5. /linting-gates    → Verify
6. /changelog        → Document
7. /update-docs      → Cập nhật docs (thường cần vì API thay đổi)
```

### Pattern 4: Release version
```
1. /changelog        → Compile [Not Committed]
2. /update-docs      → Final docs check (iff need)
3. /linting-gates    → Final check (0 errors)
4. /github           → Commit + push + update version
```

---

## 📚 Quick Reference

| Workflow | Command | Use Case | Output |
|----------|---------|----------|--------|
| Smart Edit | `/smart-edit` | Fix/update code | Modified files |
| Discuss | `/discuss [topic]` | Analyze, propose solutions | Analysis + proposals |
| Changelog | `/changelog` | Document changes | Updated CHANGELOG.md |
| **Update Docs** | **`/update-docs`** | **Cập nhật function docs (iff need)** | **Updated docs/function-docs/*** |
| **New Doc** | **`/new-doc [module]`** | **Tạo doc mới cho tính năng / module mới** | **New file docs/function-docs/*** |
| **Decision** | **`/decision`** | **Ghi lại quyết định thiết kế / kỹ thuật** | **New file docs/decisions/*** |
| GitHub | `/github` | Release version | New commit, tag, updated CHANGELOG |
| Artifact Docs | `/artifact-docs` | Create plan/test suite | Artifact artifact |
| Console Test | `/console-test [feature]` | Test on console | JavaScript test script |
| Token Mgmt | `/token-management` | Add/update tokens | Updated tokens.css + ARCHITECTURE.md |
| Module Creation | `/module-creation [name] [level]` | Create new module | New CSS + JS files, registered |
| Linting Gates | `/linting-gates` | Verify code quality | npm run lint output |
| Atomic Gen | `/atomic-gen [name] [level]` | Create component | New component scaffolded |
| Planning | `/plan [task]` | Plan implementation | Implementation plan artifact |
| Refactor | `/refactor-to-atomic` | Refactor legacy | New atomic component, cleanup |
| Test Cases | `/test [feature]` | Design tests | Test case artifact |

---

## 🎓 Workflow Usage Rules

### Rule 1: Phân tích trước viết code
```
❌ /smart-edit → viết code liền
✅ /discuss → /plan → /smart-edit
```

### Rule 2: Quality gates bắt buộc
```
❌ /smart-edit → commit
✅ /smart-edit → /linting-gates (0 errors) → commit
```

### Rule 3: Artifact cho tài liệu dài
```
❌ Chat: [500 dòng kế hoạch]
✅ Artifact: [kế hoạch chi tiết], Chat: [tóm tắt 3 câu + link]
```

### Rule 4: Surgical edits (minimal diffs)
```
❌ /write (entire file overwrite)
✅ /smart-edit (only changed lines)
```

### Rule 5: Changelog là source of truth
```
❌ Commit message là lịch sử
✅ CHANGELOG.md là lịch sử chính thức
```

---

## 🔍 Troubleshooting Workflows

### Problem: Smart edit fails (old_string not matching)
**Solution:**
1. `grep -n "exact text" file.js` → xác minh dòng
2. `read file.js (offset: line-5, limit: 15)` → copy exact content
3. Ensure whitespace/indentation matches 100%
4. Try `/smart-edit` again

### Problem: Linting fails after edit
**Solution:**
1. `npm run lint:css` hoặc `lint:js` → xác minh lỗi cụ thể
2. Refer `/linting-gates` workflow → find fix pattern
3. `/smart-edit` → fix linting issue
4. `npm run lint` lại

### Problem: Module not exported to window
**Solution:**
1. Check: `window.ModuleName = ModuleName;` ở cuối file?
2. Check: Script registered trong index.html?
3. Check: Load order correct (dependencies first)?
4. Verify: `console.log(window.ModuleName)` in browser

### Problem: Lệnh workflow `/...` không hoạt động
**Solution:**
1. Đọc lại workflow file để hiểu quy trình
2. `/discuss` → analyze vấn đề
3. `/plan` → artifact plan
4. `/smart-edit` → execute thủ công

---

## 📖 File Structure

```
.agents/workflows/
├── README.md (this file)
├── 0.startup.md             ← Khởi động phiên làm việc
├── 1.smart-edit.md          ← Chỉnh sửa thông minh
├── 2.discuss.md             ← Phân tích & thảo luận
├── 3.changelog.md           ← Quản lý changelog
├── 4.github.md              ← GitHub release automation
├── 5.artifact-docs.md       ← Artifact strategy
├── 6.console-test.md        ← Console testing
├── 7.token-management.md    ← Token system
├── 8.module-creation.md     ← Module scaffolding
├── 9.linting-gates.md       ← Linting verification
├── 15.update-docs.md        ← Cập nhật function docs (iff need)
├── 16.new-doc.md            ← Tạo doc mới cho module/tính năng mới
├── 17.decision.md           ← Ghi lại quyết định thiết kế / kỹ thuật
├── create-component.md      ← Atomic component creation
├── plan.md                  ← Implementation planning
├── refactor-component.md    ← Legacy refactoring
├── test-cases.md            ← Test case design
└── standardize-ds.md        ← Design system standardization
```

---

## 💡 Best Practices

### ✅ DO:
- Luôn `/discuss` trước implement (phân tích)
- Luôn `/plan` trước edit lớn (lập kế hoạch)
- Luôn `/linting-gates` trước commit (verify)
- Luôn `/changelog` sau thay đổi (document)
- Luôn read file lại sau `/smart-edit` (verify)
- Luôn dùng tokens trong CSS (không hardcode)
- Luôn IIFE pattern trong JS modules (scope isolation)

### ❌ DON'T:
- Không bypass linting gates
- Không hardcode màu/spacing trong CSS
- Không tạo global variables (use IIFE + window.*)
- Không reformat code toàn bộ (surgical edits only)
- Không ghi đè file (use Edit, not Write)
- Không skip `/changelog` updates
- Không commit nếu linting fail

---

## 🔗 Related Documentation

- **ARCHITECTURE.md** — System architecture, token system, module structure
- **.stylelintrc.json** — CSS linting rules
- **eslint.config.mjs** — JavaScript linting rules
- **package.json** — npm scripts (lint, test, build)

---

## 📞 Support

Nếu workflow không rõ:
1. Đọc workflow file tương ứng (chi tiết đầy đủ)
2. Xem example ở phần 💬 "Common Patterns"
3. Sử dụng `/discuss` để phân tích kỹ
4. Check troubleshooting section

---

**Last Updated:** 2026-04-25  
**Version:** 1.0.0 — Complete Workflow System  
**Status:** Production Ready ✅

---

> 🚀 **Workflow system này được thiết kế để làm cho phát triển dễ dàng, chất lượng cao, và scalable. Luôn tuân thủ quy trình để đảm bảo consistency và best practices.**

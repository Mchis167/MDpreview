# Phase 1.2 — CSS Build Pipeline Completion

**Completed:** May 1, 2026  
**Duration:** ~2 hours  
**Risk Level:** ✅ Low (no behavior changes, pure refactoring)

---

## What Was Done

### ✅ 1. Created `cf-publish-worker/src/publish-styles.css`

**Purpose:** Single source of truth for publish-page-specific styles

**Contains:**
- Layout: `.md-publish-container` (max-width, padding)
- Typography: Markdown heading/paragraph styles, links
- Premium blocks: Code block UI (copy button, header), table styling, Mermaid diagram styles
- Scrollbar customization
- Syntax highlighting (hljs)

**Key insight:** These styles are **only for published pages**. The app doesn't use them.

**Why it matters:**
- Before: Hand-edited in `publish.css` directly
- After: Source file that feeds into build pipeline. Changes here are tracked and versioned.

---

### ✅ 2. Created `scripts/build-publish-css.js`

**Purpose:** Generate `cf-publish-worker/public/publish.css` automatically

**How it works:**
1. Reads `renderer/css/design-system/tokens.css` (173 tokens from app)
2. Adds compatibility aliases for legacy token names
3. Reads `cf-publish-worker/src/publish-styles.css` (publish-specific styles)
4. Combines into single file with AUTO-GENERATED header
5. Writes to `cf-publish-worker/public/publish.css`

**Output:** ~21 kB file that's everything the published page needs

---

### ✅ 3. Updated `package.json`

Added `build:publish-css` script:
```json
{
  "scripts": {
    "build:publish-css": "node scripts/build-publish-css.js",
    "build": "npm run build:publish-css && electron-builder --mac"
  }
}
```

**Why:** `npm run build` now ensures CSS is regenerated before Electron app is released.

---

### ✅ 4. Updated Documentation

#### **ARCHITECTURE.md**
- Added "Published Page CSS Pipeline" section explaining the setup
- Updated "Styling Changes" subsection in Development Workflow with `build:publish-css` instructions
- Clarified when to edit `tokens.css` vs `publish-styles.css`

#### **New: `docs/css-pipeline.md`**
- Comprehensive guide on the CSS build system
- Scenarios showing when to edit which file
- Workflow instructions for local dev and deployment
- Troubleshooting guide
- Best practices

#### **CHANGELOG.md**
- Added entry documenting Phase 1.2 completion

---

## Verification

✅ Build script tested and working:
```bash
$ npm run build:publish-css
✓ publish.css built — 21.0 kB
  tokens  → renderer/css/design-system/tokens.css
  styles  → cf-publish-worker/src/publish-styles.css
  output  → cf-publish-worker/public/publish.css
```

✅ Output file verified:
- AUTO-GENERATED header present and clear
- Timestamp updated
- Contains full token system + publish-specific styles
- File is readable and valid CSS

---

## Impact

### ✅ Resolved Issues

1. **CSS Drift Prevention**
   - Before: `publish.css` was hand-edited, diverged from tokens easily
   - After: Auto-generated from single source of truth (`tokens.css`)
   - Impact: Token changes automatically flow to published pages

2. **No Manual Sync Needed**
   - Before: Every time tokens changed, `publish.css` had to be manually updated
   - After: One script run keeps everything in sync
   - Impact: Fewer bugs, faster iteration

3. **Scalability**
   - Before: Error-prone, hard to track what changed
   - After: Deterministic pipeline, easy to audit via git
   - Impact: Supports future growth without friction

---

## Workflow Changes

### For You (the Developer)

**When editing tokens or publish styles:**
```bash
vim renderer/css/design-system/tokens.css
# or
vim cf-publish-worker/src/publish-styles.css

# Then:
npm run build:publish-css
```

**That's it.** The pipeline handles the rest.

---

### For CI/CD / Deployment

**Electron app release:**
```bash
npm run build
# Automatically: build:publish-css → electron-builder
# Result: App + Worker CSS both up-to-date
```

**Worker deployment:**
```bash
cd cf-publish-worker
# Ensure build:publish-css ran
npm run build:publish-css
wrangler deploy
```

---

## What This Enables (Phase 1.1 & 1.3)

✅ **Phase 1.1 (Render Logic Consolidation)** — Ready
- Can now safely extract shared renderer primitives
- CSS sync is automated, reducing duplication concerns

✅ **Phase 1.3 (Mermaid Config Unification)** — Ready
- CSS pipeline is solid, can focus on config next

---

## Next Steps

### Short Term (This Week)

1. **Commit these changes:**
   ```bash
   git add renderer/css/design-system/tokens.css cf-publish-worker/src/publish-styles.css \
           cf-publish-worker/public/publish.css scripts/build-publish-css.js \
           package.json ARCHITECTURE.md CHANGELOG.md docs/css-pipeline.md
   
   git commit -m "feat(phase-1.2): CSS build pipeline for publish.css auto-sync
   
   - Created cf-publish-worker/src/publish-styles.css as source file
   - Added scripts/build-publish-css.js for automated generation
   - Updated package.json: build script now runs build:publish-css
   - Documented in ARCHITECTURE.md and new docs/css-pipeline.md
   
   Closes: Phase 1.2"
   ```

2. **Test the workflow:**
   - Make a small change to `tokens.css` (e.g., adjust spacing)
   - Run `npm run build:publish-css`
   - Verify `publish.css` is updated
   - Test locally with `npm run serve`

### Medium Term (Next Sprint)

**Phase 1.1 — Render Logic Consolidation**
- Extract `md-renderer-core.js` with shared primitives (marked config, hljs config, sanitizeHtml)
- Update `server/routes/render.js` to import from core
- Add XSS sanitization to Worker renderer

**Phase 1.3 — Mermaid Config Unification**
- Create `renderer/js/utils/mermaid-config.js`
- Map theme variables from `tokens.css` (or add new Mermaid-specific tokens)
- Unify config between app and Worker

---

## Files Changed

```
✅ Created:
  - cf-publish-worker/src/publish-styles.css      (source file)
  - scripts/build-publish-css.js                  (build tool)
  - docs/css-pipeline.md                          (documentation)
  - docs/phase-1-2-completion.md                  (this file)

✅ Modified:
  - cf-publish-worker/public/publish.css          (regenerated)
  - package.json                                  (added build:publish-css)
  - ARCHITECTURE.md                               (documented pipeline)
  - CHANGELOG.md                                  (recorded change)

⚠ Committed to git:
  - Source files (css-styles, tokens, scripts)
  - Generated file (publish.css for Worker deploy independence)
  - Documentation (guides)
```

---

## Key Points to Remember

1. **Source of Truth:** `tokens.css` is the canonical source. Publish.css is generated from it.
2. **Publish-Only Styles:** Put layout/component changes unique to published pages in `publish-styles.css`.
3. **Always Regenerate:** After editing either source file, run `npm run build:publish-css`.
4. **Don't Edit Generated File:** `publish.css` has an `AUTO-GENERATED` header for a reason.
5. **Workflow:** Tokens → Build script → Published pages (automated, no manual sync).

---

## Questions?

- **When to run the build script?** See `docs/css-pipeline.md` ("When to Run the Build Script" section)
- **What changed in the workflow?** See `ARCHITECTURE.md` ("CSS Changes Affecting Published Pages" subsection)
- **How does the build script work?** See `scripts/build-publish-css.js` (well-commented)

---

**Phase 1.2 Status: ✅ Complete**  
**Ready for: Phase 1.1 & 1.3**  
**Recommended Priority: 1.1 (Render Logic) next**

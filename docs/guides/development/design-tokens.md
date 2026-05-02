# Design Tokens & CSS Build Pipeline

**Last Updated:** May 2, 2026  
**Purpose:** Centralized design tokens and publish page CSS synchronization

> **Note (May 2, 2026):** Added layout tokens (`--ds-content-padding-x`, `--ds-content-padding-y`, `--ds-content-width`) for content alignment sync across main viewer, editor, and project map. See [Scenario 4](#scenario-4-content-padding--width-adjustment-affects-all-views) for usage.

---

## Quick Start

**After editing tokens or published page styles:**
```bash
npm run build:publish-css
```

**Before building the app for release:**
```bash
npm run build  # Automatically runs build:publish-css first
```

---

## Architecture Overview

The published page (served by Cloudflare Worker) needs to be styled consistently with the app. Rather than manually copying CSS, we have an **automated pipeline**:

```
tokens.css (source of truth)
     ↓
     → [build:publish-css script]
     ↓
publish-styles.css (hand-crafted, publish-only)
     ↓
publish.css (generated, auto-synced)
     ↓
Cloudflare Worker serves published pages
```

### Files at a Glance

| File | Type | Purpose | Edit? |
|------|------|---------|-------|
| `renderer/css/design-system/tokens.css` | Source | All design tokens (colors, spacing, radius, typography, shadows, transitions) | ✅ Yes |
| `cf-publish-worker/src/publish-styles.css` | Source | Publish-specific layout styles (code blocks, typography, tables, containers) | ✅ Yes |
| `cf-publish-worker/public/publish.css` | Generated | Combined tokens + publish styles. Served to browsers. | ❌ No — auto-generated |
| `scripts/build-publish-css.js` | Build tool | Script that combines the two sources. Run via `npm run build:publish-css` | ✅ Rarely |

---

## Workflow by Change Type

### Scenario 1: Brand color change (affects app + published page)

**Change:** Orange → Red  
**What to do:**
```bash
# 1. Edit tokens.css
vim renderer/css/design-system/tokens.css
# Change: --ds-primitive-orange: #ffbf48; → #ff453a;

# 2. Regenerate published CSS
npm run build:publish-css

# Result: Both app and published pages now use the new color
```

**Why:** `tokens.css` is the source of truth. The build script pulls from it automatically.

---

### Scenario 2: Published page headline size adjustment

**Change:** H1 should be 28px instead of 32px (published page only)  
**What to do:**
```bash
# 1. Edit publish-styles.css
vim cf-publish-worker/src/publish-styles.css
# Change: .md-render-body h1 { font-size: 28px; }

# 2. Regenerate published CSS
npm run build:publish-css

# Result: Only published pages affected (app H1 unchanged)
```

**Why:** `publish-styles.css` is for publish-specific styling. App doesn't use it.

---

### Scenario 3: New opacity token (for both app + published page)

**Change:** Add `--ds-white-a50` (50% white opacity)  
**What to do:**
```bash
# 1. Edit tokens.css
vim renderer/css/design-system/tokens.css
# Add in Tier 2 (Alpha Palette):
#   --ds-white-a50: rgba(255, 255, 255, 0.50);

# 2. Regenerate published CSS
npm run build:publish-css

# 3. Use in app CSS and publish-styles.css
# Both will have access to --ds-white-a50 automatically
```

**Why:** New token definitions flow through the build pipeline to both environments.

---

### Scenario 4: Content padding & width adjustment (affects all views)

**Change:** Increase horizontal padding from 80px to 100px  
**What to do:**
```bash
# 1. Edit tokens.css
vim renderer/css/design-system/tokens.css
# Change in Tier 3 (Semantic):
#   --ds-content-padding-x: 100px;  (was 80px)
#   --ds-content-width: 800px;      (unchanged, determines text width)

# 2. Update all views using these tokens
# They will automatically sync:
# - Main viewer (.md-content-inner)
# - Editor (#edit-textarea)
# - Project map mirror (.ds-project-map__mirror .md-content-inner)

# 3. Rebuild app to ensure CSS is fresh
npm run build

# Result: All views have consistent 100px padding, viewport indicator stays accurate
```

**Why:** Layout tokens ensure padding consistency across main viewer, editor, and project map mirror. This is critical for accurate viewport indicator positioning in the project map minimap.

**Layout tokens breakdown:**
```css
/* Tier 3: Semantic - Layout System */
--ds-content-padding-x: 80px;   /* Horizontal padding on content */
--ds-content-padding-y: 80px;   /* Vertical padding on content */
--ds-content-width: 800px;      /* Max width of readable text (without padding) */

/* Usage in views: */
.md-content-inner {
  padding: var(--ds-content-padding-y) var(--ds-content-padding-x);
  max-width: calc(var(--ds-content-width) + (var(--ds-content-padding-x) * 2));
  margin: 0 auto;
}
```

⚠️ **Critical constraint:** Mirror padding MUST match main viewer padding. If they diverge, viewport indicator position will be inaccurate.

---

### Scenario 5: Code block styling tweak (published page only)

**Change:** Code block borders should be less visible  
**What to do:**
```bash
# 1. Edit publish-styles.css
vim cf-publish-worker/src/publish-styles.css
# Change: border: 1px solid var(--ds-white-a08); →  
#         border: 1px solid var(--ds-white-a04);

# 2. Regenerate published CSS
npm run build:publish-css

# Result: Only published code blocks affected
```

**Why:** Code block UI is exclusive to published pages.

---

## When to Run the Build Script

| Situation | Run? | Why |
|-----------|------|-----|
| Edit `tokens.css` | ✅ Yes | Tokens flow to published pages |
| Edit `publish-styles.css` | ✅ Yes | Styles need to be bundled |
| Edit app CSS (`atoms/`, `molecules/`, `organisms/`) | ❌ No | App CSS is separate from published page pipeline |
| Edit app JS | ❌ No | JavaScript doesn't affect CSS |
| Ready to deploy app/worker | ✅ Yes | Ensures everything is in sync |

---

## Technical Details

### Build Script Logic

`scripts/build-publish-css.js` does this:
1. Read `renderer/css/design-system/tokens.css` — extracts full `:root {}` block with all 173 tokens
2. Add compatibility aliases — maps legacy token names (e.g., `--ds-bg-main`) to canonical tokens (e.g., `--ds-bg-base`)
3. Read `cf-publish-worker/src/publish-styles.css` — hand-crafted styles
4. Write combined output → `cf-publish-worker/public/publish.css`
5. Add `AUTO-GENERATED` header with timestamp

**Result:** A single ~21 kB CSS file that contains everything the published page needs.

### Alias Examples

Some tokens in `publish-styles.css` may reference names that don't exist in `tokens.css`. These are automatically aliased:

```css
/* In the generated publish.css: */
:root {
  --ds-bg-main: var(--ds-bg-base);                    /* Legacy → canonical */
  --ds-transition-smooth: var(--ds-transition-main);  /* Legacy → canonical */
}
```

This allows `publish-styles.css` to use `--ds-bg-main` without requiring a rename. The build script creates the mapping automatically.

---

## Deployment Workflow

### Local Development
```bash
# Edit tokens or publish-styles
vim renderer/css/design-system/tokens.css
vim cf-publish-worker/src/publish-styles.css

# Rebuild
npm run build:publish-css

# Test locally
npm run serve
# Browse to http://localhost:3000
```

### Electron App Release
```bash
npm run build
# Automatically runs: build:publish-css → electron-builder
# Result: DMG with latest published page CSS baked in
```

### Worker Deployment
```bash
cd cf-publish-worker

# build:publish-css must have run first
# (or run it here if needed)
npm run build:publish-css

wrangler deploy
# Worker now serves updated publish.css
```

---

## Troubleshooting

### Build script fails
```bash
# Ensure source files exist
ls renderer/css/design-system/tokens.css  # Should exist
ls cf-publish-worker/src/publish-styles.css  # Should exist

# Run with verbose output
node scripts/build-publish-css.js
```

### Published page styles don't update
```bash
# Remember to run the build script
npm run build:publish-css

# Verify the output file was updated
ls -l cf-publish-worker/public/publish.css
# Should show recent timestamp

# Check if Worker has latest CSS
# (you may need to redeploy the Worker)
wrangler deploy
```

### Token name mismatch error
If you see an error like `--ds-undefined-token is not defined`:
1. Check if the token exists in `tokens.css` (use `grep --ds-undefined-token`)
2. If missing → Add it to `tokens.css` Tier 1/2/3
3. Run `npm run build:publish-css` again

---

## Best Practices

✅ **Do:**
- Edit `tokens.css` when the change affects both app + published pages
- Edit `publish-styles.css` for publish-specific layout/component changes
- Always run `npm run build:publish-css` after editing either source
- Commit source files (`tokens.css`, `publish-styles.css`) to git
- Review the `AUTO-GENERATED` header in `publish.css` to verify the build timestamp

❌ **Don't:**
- Manually edit `cf-publish-worker/public/publish.css` — it's generated
- Duplicate token definitions between `tokens.css` and `publish-styles.css`
- Hardcode colors/spacing in `publish-styles.css` — use `--ds-*` tokens
- Forget to run `npm run build:publish-css` before deploying

---

## References

- **Tokens:** See `renderer/css/design-system/tokens.css` for the full 3-tier system
- **Architecture:** See `ARCHITECTURE.md` for design system principles
- **Published Page:** See `cf-publish-worker/public/publish.css` (read-only)

---

*Questions? Check ARCHITECTURE.md or contact the team.*

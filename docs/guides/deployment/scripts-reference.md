# Command Scripts Guide

Quick reference for running MDpreview build and deployment commands.

---

## 🚀 Available Scripts

### 1. **QuickRebuild.command** — Rebuild & Test App Locally
Double-click from Finder (or `scripts/QuickRebuild.command` from Terminal)

**What it does:**
1. Installs dependencies (`npm install`)
2. **Syncs publish CSS** from tokens (`npm run build:publish-css`)
3. Builds app in directory mode (`npm run build:dir`)
4. Launches the built `.app` automatically

**Use when:**
- You've made changes to code/styles and want to test in the actual app
- You want the fastest local rebuild (doesn't create DMG)
- You need to test both app and published page styling together

**Time:** ~1-2 minutes

**Output:** `dist/mac-arm64/MDpreview.app` or `dist/mac-x64/MDpreview.app`

---

### 2. **PreviewUI.command** — Preview App in Browser
Double-click from Finder (or `scripts/PreviewUI.command` from Terminal)

**What it does:**
1. **Syncs publish CSS** from tokens (`npm run build:publish-css`)
2. Kills any existing server on port 3737
3. Starts dev server (`npm run serve`)
4. Opens http://localhost:3737 in browser

**Use when:**
- You want to quickly test CSS changes in the browser
- You're doing live development and want instant preview
- You're working on published page styling

**Time:** ~5 seconds

**Browser:** Opens in Microsoft Edge (if available) or default browser

---

### 3. **DeployWorker.command** — Deploy to Cloudflare Workers
Double-click from Finder (or `scripts/DeployWorker.command` from Terminal)

**What it does:**
1. **Syncs publish CSS** from tokens (`npm run build:publish-css`)
2. Changes to `cf-publish-worker` directory
3. Deploys to Cloudflare Workers (`wrangler deploy`)
4. Shows deployment summary and next steps

**Use when:**
- You've updated tokens or published page styles
- You want to deploy changes to your live published pages
- You've fixed a bug in the Worker and want to push it live

**Time:** ~30 seconds (plus network time)

**Requirements:**
- Cloudflare account configured
- `wrangler` installed: `npm install -g wrangler`
- Authenticated: `wrangler login`

**Output:**
```
✅ CSS synced from tokens ✓
✅ Worker deployed to Cloudflare ✓
🌐 Your published pages are now live!
```

---

## 📋 CSS Build Pipeline Integration

All three scripts now include the CSS build step:

```
QuickRebuild.command
└─ rebuild.sh
   ├─ npm install
   ├─ npm run build:publish-css  ← CSS SYNC
   ├─ npm run build:dir
   └─ open App

PreviewUI.command
├─ npm run build:publish-css  ← CSS SYNC
├─ npm run serve
└─ open browser

DeployWorker.command
├─ npm run build:publish-css  ← CSS SYNC
└─ wrangler deploy
```

This ensures **published CSS is always in sync** with app tokens, no manual steps needed.

---

## 🔄 Workflow Examples

### Example 1: Change Brand Color
```bash
# 1. Edit tokens
vim renderer/css/design-system/tokens.css
# Change --ds-primitive-orange to new color

# 2. Test locally
./scripts/PreviewUI.command
# Browser opens with updated color

# 3. Deploy
./scripts/DeployWorker.command
# Published pages updated
```

### Example 2: Tweak Published Page Layout
```bash
# 1. Edit publish styles
vim cf-publish-worker/src/publish-styles.css
# Adjust .md-render-body h1 { font-size: ... }

# 2. Preview in browser
./scripts/PreviewUI.command
# See changes immediately

# 3. Deploy
./scripts/DeployWorker.command
# Live pages updated
```

### Example 3: Full Release
```bash
# 1. Make all changes
# 2. Rebuild app (includes CSS sync)
./scripts/QuickRebuild.command
# Test in native app

# 3. Deploy worker
./scripts/DeployWorker.command
# Published pages updated

# 4. Create release build
npm run build  # Creates DMG
```

---

## 🛠️ Manual Alternatives

If you prefer using the terminal directly:

```bash
# Just sync CSS
npm run build:publish-css

# Preview in browser
npm run serve
# Open http://localhost:3737

# Rebuild app
npm run build:dir
# Then open dist/mac-arm64/MDpreview.app

# Deploy worker
cd cf-publish-worker
wrangler deploy
```

---

## ⚠️ Troubleshooting

### Script won't run (permission denied)
```bash
chmod +x scripts/QuickRebuild.command
chmod +x scripts/PreviewUI.command
chmod +x scripts/DeployWorker.command
```

### Server already running on port 3737
PreviewUI automatically kills it, but if issues persist:
```bash
lsof -ti:3737 | xargs kill -9
```

### Wrangler not found
```bash
npm install -g wrangler
# or in cf-publish-worker:
npm install wrangler
```

### Worker deployment fails
```bash
wrangler login
# Then try again
./scripts/DeployWorker.command
```

### CSS not updating
```bash
# Ensure build:publish-css ran
npm run build:publish-css

# Verify output was generated
ls -l cf-publish-worker/public/publish.css
# Should show recent timestamp
```

---

## 📌 Quick Reference

| Task | Script | Command |
|------|--------|---------|
| **Rebuild & test app** | QuickRebuild | `./scripts/QuickRebuild.command` |
| **Preview in browser** | PreviewUI | `./scripts/PreviewUI.command` |
| **Deploy to Workers** | DeployWorker | `./scripts/DeployWorker.command` |
| **Just sync CSS** | npm | `npm run build:publish-css` |
| **Build release DMG** | npm | `npm run build` |

---

*Last Updated: 2026-05-01*

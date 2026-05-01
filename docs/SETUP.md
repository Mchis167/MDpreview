# Development Setup Guide

**Last Updated:** May 1, 2026 (Phase 1.1)  
**Tested On:** macOS 12+, Node.js 18+, npm 9+

---

## Prerequisites

### Required
- **Node.js** 18.0.0 or higher
  ```bash
  node --version  # Should be v18+ (tested with v22.18.0)
  ```

- **npm** 9.0.0 or higher
  ```bash
  npm --version   # Should be v9+
  ```

- **Git** for version control
  ```bash
  git --version
  ```

### Optional (for Cloudflare deployment)
- **Wrangler CLI** (for Workers development)
  ```bash
  npm install -g wrangler  # Or: npm install in cf-publish-worker/
  ```

---

## Installation

### 1. Clone Repository

```bash
git clone <repository-url>
cd MDpreview
```

### 2. Install Dependencies

```bash
npm install
```

This installs:
- **Electron** — Desktop app framework
- **Express** — Web server
- **marked** — Markdown parser
- **highlight.js** — Code syntax highlighting
- **socket.io** — Real-time updates
- **Vitest** — Testing framework
- **ESLint** — Code linting
- **stylelint** — CSS linting

### 3. Install Worker Dependencies

```bash
cd cf-publish-worker
npm install
cd ..
```

This installs:
- **Wrangler** — Cloudflare Workers CLI
- **Miniflare** — Local Workers development
- Worker-specific dependencies

---

## Project Structure

```
MDpreview/
├── electron/                    # Electron main process
│   ├── main.js                 # App entry point
│   ├── preload.js              # Preload script
│   └── menus.js                # Menu configuration
│
├── server/                      # Node.js dev server
│   ├── index.js                # Server entry point
│   ├── routes/
│   │   ├── render.js           # Markdown rendering (with line tracking)
│   │   └── ...                 # Other routes
│   └── middleware/
│
├── renderer/                    # Shared rendering & UI
│   ├── js/
│   │   ├── services/
│   │   │   ├── md-renderer-core.js        # Shared rendering primitives (NEW)
│   │   │   ├── publish-service.js         # Publishing logic
│   │   │   └── __tests__/
│   │   │       └── md-renderer-core.test.js
│   │   └── ...                 # Other JS files
│   ├── css/
│   │   ├── design-system/
│   │   │   ├── tokens.css      # Design tokens (colors, spacing, typography)
│   │   │   └── ...             # Component styles
│   │   └── ...
│   └── index.html              # Editor UI
│
├── cf-publish-worker/          # Cloudflare Worker
│   ├── src/
│   │   ├── index.js            # Worker entry point
│   │   ├── renderer.js         # Worker rendering (uses shared core)
│   │   ├── handlers/
│   │   │   ├── publish.js      # Publish handler
│   │   │   ├── serve.js        # Serve published pages
│   │   │   ├── delete.js       # Delete handler
│   │   │   └── auth.js         # Authentication
│   │   └── publish-styles.css  # Publish-specific styles
│   ├── public/
│   │   └── publish.css         # Generated CSS (auto-synced)
│   ├── wrangler.toml           # Worker configuration
│   └── package.json
│
├── scripts/                     # Build & deployment scripts
│   ├── QuickRebuild.command     # Rebuild app locally
│   ├── PreviewUI.command        # Preview in browser
│   ├── DeployWorker.command     # Deploy to Cloudflare
│   ├── build-publish-css.js     # CSS build pipeline
│   ├── test-phase-1-1.sh        # Integration tests
│   └── bundle-for-ai.js         # AI context bundler
│
├── docs/                        # Documentation
│   ├── README.md                # Project overview
│   ├── SECURITY.md              # Security policy
│   ├── RENDERING_ARCHITECTURE.md # Rendering system details
│   ├── SETUP.md                 # This file
│   ├── phase-1-1-completion.md  # Phase 1.1 details
│   ├── phase-1-2-completion.md  # Phase 1.2 details
│   ├── manual-testing-phase-1-1.md # Test cases
│   ├── scripts-guide.md         # Script reference
│   └── ...
│
├── package.json                 # Root dependencies
├── vitest.config.js             # Test configuration
└── CHANGELOG.md                 # Version history
```

---

## Development Workflow

### 1. Start Development

**Option A: Electron App (Full App)**
```bash
npm run dev
# or
npm start
```
Opens the Electron app with the editor.

**Option B: Web Server (Fastest for UI changes)**
```bash
npm run serve
# Output: MDpreview running at http://localhost:3737
```
Open browser to `http://localhost:3737`

**Option C: Browser Preview with Auto-CSS Sync**
```bash
./scripts/PreviewUI.command
# Automatically syncs CSS from tokens before starting
```

### 2. Make Changes

Edit files in your preferred editor:
- **Markdown rendering**: `server/routes/render.js` or `cf-publish-worker/src/renderer.js`
- **Shared rendering logic**: `renderer/js/services/md-renderer-core.js`
- **Styles**: `renderer/css/design-system/tokens.css` or component CSS files
- **Tests**: `renderer/js/services/__tests__/*.test.js`

### 3. Run Tests

```bash
# Unit tests
npm run test

# Full integration tests
bash scripts/test-phase-1-1.sh

# Linting
npm run lint
npm run lint:js    # JavaScript linting
npm run lint:css   # CSS linting
```

### 4. Build & Test Locally

```bash
# Quick rebuild (doesn't create DMG)
./scripts/QuickRebuild.command

# Then open: dist/mac-arm64/MDpreview.app or dist/mac-x64/MDpreview.app
```

### 5. Deploy

**To Cloudflare Workers:**
```bash
./scripts/DeployWorker.command
# Or manually:
cd cf-publish-worker
wrangler deploy
```

**To Distribution (DMG):**
```bash
npm run build
# Creates: dist/mac-arm64/MDpreview-1.x.x.dmg
```

---

## Common Tasks

### Add a New Feature

1. **Create tests first** (TDD approach):
   ```bash
   # Edit: renderer/js/services/__tests__/md-renderer-core.test.js
   # Add test case for your feature
   npm run test
   ```

2. **Implement feature**:
   ```bash
   # Edit: renderer/js/services/md-renderer-core.js (or other files)
   npm run test  # Verify tests pass
   npm run lint  # Check code style
   ```

3. **Update documentation**:
   ```bash
   # Edit: docs/RENDERING_ARCHITECTURE.md or relevant docs
   ```

4. **Commit**:
   ```bash
   git add .
   git commit -m "feat: Add new feature with tests"
   ```

### Fix a Bug

1. **Identify the issue**:
   ```bash
   npm run test
   npm run serve
   # Test manually in browser
   ```

2. **Write failing test**:
   ```bash
   # Add test case that reproduces the bug
   npm run test  # Confirms test fails
   ```

3. **Fix the bug**:
   ```bash
   # Edit the relevant file
   npm run test  # Confirms test passes
   ```

4. **Verify no regressions**:
   ```bash
   bash scripts/test-phase-1-1.sh
   npm run lint
   ```

5. **Commit**:
   ```bash
   git commit -m "fix: Fix bug description"
   ```

### Update Design Tokens

```bash
# 1. Edit tokens
vim renderer/css/design-system/tokens.css
# Change colors, spacing, typography

# 2. Rebuild CSS
npm run build:publish-css
# Generates: cf-publish-worker/public/publish.css

# 3. Test locally
./scripts/PreviewUI.command
# Browser opens with updated styles

# 4. Deploy to workers
./scripts/DeployWorker.command
# Published pages updated
```

### Run Manual Tests

```bash
# Start server (Terminal 1)
npm run serve

# Start worker (Terminal 2)
cd cf-publish-worker
npx wrangler dev --local

# Run tests (Terminal 3)
bash docs/manual-testing-phase-1-1.sh
# Or use individual curl commands from manual-testing-phase-1-1.md
```

---

## Environment Variables

### Development

```bash
# Optional: Override data directory
export MDPREVIEW_DATA_DIR=~/mydata

# Start server
npm run serve
```

### Worker Deployment

```bash
# Set admin secret for publishing
wrangler secret put ADMIN_SECRET

# Deploy
wrangler deploy
```

---

## Troubleshooting

### Server Won't Start

```bash
# Check port 3737 is free
lsof -i :3737

# Kill conflicting process
kill -9 <PID>

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run serve
```

### Tests Failing

```bash
# Run tests with verbose output
npm run test -- --reporter=verbose

# Run specific test file
npm run test -- md-renderer-core.test.js

# Check linting
npm run lint
```

### Electron App Won't Start

```bash
# Clear Electron cache
rm -rf ~/.config/MDpreview  # Linux/Mac
rm -rf ~/Library/Application\ Support/MDpreview  # Mac

# Rebuild native modules
npm install --legacy-peer-deps

# Start in debug mode
npm run dev
```

### CSS Not Updating

```bash
# Rebuild CSS from tokens
npm run build:publish-css

# Check output was generated
ls -lh cf-publish-worker/public/publish.css

# Clear browser cache (hard refresh)
# Cmd+Shift+R (Chrome/Edge) or Cmd+Option+R (Safari)
```

### Worker Deploy Fails

```bash
# Check wrangler is installed
wrangler --version

# Login to Cloudflare
wrangler login

# Try deploying again
cd cf-publish-worker
wrangler deploy

# Check KV namespace exists
wrangler kv:namespace list
```

---

## Git Workflow

### Before Starting Work

```bash
# Update from remote
git fetch origin

# Create feature branch
git checkout -b feature/my-feature
# or
git checkout -b fix/bug-description
```

### During Development

```bash
# Commit changes regularly
git add <files>
git commit -m "feat: description" -m "Detailed explanation if needed"

# Push to remote
git push origin feature/my-feature
```

### Creating a PR

```bash
# Ensure all tests pass
npm run test
npm run lint

# Push final changes
git push origin feature/my-feature

# Create PR on GitHub
# Include description of changes
# Reference any related issues
```

### Merging to Main

```bash
# Update from main
git fetch origin
git rebase origin/main

# Resolve conflicts if needed
git add .
git rebase --continue

# Force push to PR branch
git push origin feature/my-feature --force-with-lease

# Merge via GitHub UI (or)
git checkout main
git pull origin main
git merge feature/my-feature
git push origin main
```

---

## Code Style Guidelines

### JavaScript

```javascript
// ✅ Good: Clear, concise, well-tested
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

// ❌ Avoid: Comments for "what" (code should be clear)
// Remove script tags from HTML (This is obvious from the code!)
function sanitizeHtml(html) { ... }

// ✅ Good: Comments for "why" (non-obvious design decision)
// Regex matches script tags with nested content:
// /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi
```

### CSS

```css
/* ✅ Good: Use design tokens */
:root {
  --ds-color-primary: #007bff;
  --ds-spacing-base: 8px;
}

.button {
  color: var(--ds-color-primary);
  padding: var(--ds-spacing-base);
}

/* ❌ Avoid: Hardcoded values */
.button {
  color: #007bff;
  padding: 8px;
}
```

### Commits

```bash
# ✅ Good: Clear, semantic commits
git commit -m "feat: Add XSS sanitization to worker"
git commit -m "fix: Remove duplicate code in renderer"
git commit -m "test: Add 21 unit tests for md-renderer-core"
git commit -m "docs: Update SECURITY.md with details"

# ❌ Avoid: Vague commits
git commit -m "Update stuff"
git commit -m "WIP"
git commit -m "Fix bug"
```

---

## Resources

- **[README.md](../README.md)** — Project overview
- **[SECURITY.md](SECURITY.md)** — Security policies
- **[RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md)** — System architecture
- **[CHANGELOG.md](../CHANGELOG.md)** — Version history
- **[Phase 1.1 Report](phase-1-1-completion.md)** — Technical details
- **[Manual Tests](manual-testing-phase-1-1.md)** — Test procedures

---

## Getting Help

### Common Questions

**Q: How do I debug rendering issues?**  
A: See [RENDERING_ARCHITECTURE.md](RENDERING_ARCHITECTURE.md) for debugging section.

**Q: How do I add a new test case?**  
A: Edit `renderer/js/services/__tests__/md-renderer-core.test.js` and run `npm run test`.

**Q: How do I deploy to production?**  
A: See [Scripts Guide](scripts-guide.md) for `DeployWorker.command` details.

**Q: Where are the design tokens?**  
A: `renderer/css/design-system/tokens.css`

### Getting Support

- 📚 Check documentation in `/docs`
- 🧪 Run test suite for errors: `npm run test`
- 🐛 Review [CHANGELOG.md](../CHANGELOG.md) for recent changes
- 📧 Contact: mchis1607@gmail.com

---

**Setup Complete! Ready to develop 🚀**

Start with: `npm run serve` and open http://localhost:3737

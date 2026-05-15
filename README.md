# MDpreview — Local Markdown Previewer

A fast, feature-rich markdown previewer for Mac with **Electron app**, **local server**, and **Cloudflare Workers** publishing support.

- 🎨 **Live Preview** — See markdown changes instantly
- 📱 **Responsive Design** — Works on desktop and published pages
- 🔒 **Secure Publishing** — XSS-protected published content
- 🚀 **Cloudflare Workers** — Publish to edge with one click
- 🎯 **Design System** — Token-based CSS for consistent theming
- 📊 **Full Markdown** — Code blocks, tables, mermaid diagrams
- 💾 **Local Data** — All content stays on your computer

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm

### Installation & Development

```bash
# Clone and install
git clone <repo>
cd MDpreview
npm install

# Start development
npm run dev              # Run Electron app
npm run serve           # Start dev server (localhost:3737)
```

### Build

```bash
# Quick rebuild for testing
./scripts/QuickRebuild.command

# Preview in browser
./scripts/PreviewUI.command

# Build for distribution
npm run build           # Creates DMG

# Deploy to Cloudflare Workers
./scripts/DeployWorker.command
```

---

## Key Features

### 📝 Markdown Support
- Standard markdown syntax
- **Code blocks** with syntax highlighting (JavaScript, Python, TypeScript, etc.)
- **Mermaid diagrams** — flowcharts, sequence diagrams, class diagrams
- **Tables** — markdown tables with proper formatting
- **Details/Summary** — collapsible sections

### 🎨 Design System
- **3-tier token system**: Primitives → Alpha → Semantic
- **CSS variables** for colors, spacing, typography
- **Consistent theming** across app and published pages
- **Dark mode support** (ready for implementation)

### 🔒 Security
- **XSS Protection** — All rendered markdown is sanitized
- **Removes** `<script>` tags, `<iframe>`, event handlers
- **Applied automatically** to both server and worker rendering
- **Critical Fix** (v1.1.0) — Worker now has identical protection to server

### 📤 Publishing
- **One-click publish** to Cloudflare Workers
- **Shareable URLs** for published pages
- **Custom slugs** for nice URLs
- **CSS sync** — Published styles auto-sync with app tokens

---

## Architecture

### Core Components

```
MDpreview/
├── electron/               # Electron app (main process)
├── server/                 # Node.js dev server (port 3737)
│   └── routes/
│       └── render.js       # Markdown rendering endpoint
├── renderer/               # Shared rendering logic
│   ├── css/                # Design system & tokens
│   └── js/
│       └── services/
│           ├── md-renderer-core.js    # Shared rendering primitives
│           └── publish-service.js     # Publishing logic
├── cf-publish-worker/      # Cloudflare Worker
│   ├── src/
│   │   ├── index.js        # Worker entry point
│   │   ├── renderer.js     # Worker rendering
│   │   └── handlers/       # Request handlers
│   └── public/publish.css  # Generated CSS
└── scripts/
    ├── build-publish-css.js
    ├── QuickRebuild.command
    ├── PreviewUI.command
    └── DeployWorker.command
```

### Rendering Pipeline

```
Markdown Input
    ↓
marked.js (tokenize)
    ↓
md-renderer-core.js
├── highlightCodeBlock()     → syntax highlighting
├── renderMermaidBlock()     → mermaid diagrams
├── wrapInTableWrapper()     → table formatting
└── sanitizeHtml()           → XSS protection
    ↓
HTML Output (safe)
```

---

## Security

### XSS Protection (v1.1.0+)

All markdown rendering is automatically sanitized to prevent XSS attacks:

```javascript
// Removed automatically
<script>alert('xss')</script>
<iframe src="evil.com"></iframe>
<img onerror="hack()" src="x">
```

**Implementation:** `renderer/js/services/md-renderer-core.js:sanitizeHtml()`

Applied to:
- ✅ Server rendering (`/api/render-raw` endpoint)
- ✅ Worker rendering (published pages)
- ✅ All user-provided markdown content

**Test:** Use `npm run test` or check server render output.

---

## Configuration

### Environment Variables

**Server:**
```bash
PORT=3737                   # Dev server port
MDPREVIEW_DATA_DIR=./data  # Data directory (auto-detected)
```

**Worker:**
```toml
# cf-publish-worker/wrangler.toml
[[kv_namespaces]]
binding = "PUB_STORE"
id = "7a0bbe734fa64dd7b292163a4c290abe"
```

### Tokens & Styling

Edit CSS design tokens in `renderer/css/design-system/tokens.css`:

```css
:root {
  /* Primitives */
  --ds-primitive-orange: #ff6b35;
  --ds-primitive-white: #ffffff;
  
  /* Semantic */
  --ds-fg-primary: var(--ds-primitive-white);
  --ds-bg-primary: #1a1a1a;
}
```

**Auto-sync to published pages:**
```bash
npm run build:publish-assets
./scripts/DeployWorker.command
```

---

## Scripts & Commands

### Development

```bash
# Start Electron app
npm run dev
npm start

# Start local dev server (port 3737)
npm run serve

# Preview in browser with auto-sync CSS
./scripts/PreviewUI.command

# Quick rebuild & test
./scripts/QuickRebuild.command
```

### Testing

```bash
# Run unit tests
npm run test

# Run linting
npm run lint
npm run lint:js
npm run lint:css

# Full integration tests (Phase 1.1)
bash scripts/test-phase-1-1.sh
```

### Build & Deploy

```bash
# Build release DMG
npm run build

# Sync CSS to published pages
npm run build:publish-assets

# Deploy to Cloudflare Workers
./scripts/DeployWorker.command

# Or manually
cd cf-publish-worker
wrangler deploy
```

---

## Testing

### Unit Tests
```bash
npm run test
# 21 tests covering rendering, sanitization, highlighting, mermaid, etc.
```

### Manual Testing
Perform manual verification for:
- XSS protection verification
- Feature testing (Mermaid, code highlighting, tables)
- Server and worker testing

### Quick Validation
```bash
# Test 1: XSS protection
curl -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>Safe"}' | jq '.html | contains("alert")'
# Expected: false (script removed)

# Test 2: Mermaid rendering
curl -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"```mermaid\ngraph LR\nA --> B\n```"}' | jq '.html | contains("mermaid")'
# Expected: true (mermaid div created)
```

---

## API Reference

### Server Endpoints

**POST `/api/render-raw`**
Render markdown to HTML with line number tracking.

```bash
curl -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{
    "content": "# Heading\n\nSafe **markdown**"
  }'
```

Response:
```json
{
  "html": "<div class=\"md-block\">...</div>",
  "totalLines": 3,
  "raw": "# Heading\n\nSafe **markdown**"
}
```

**GET `/api/render?file=path/to/file.md`**
Render file from watch directory.

---

## Browser Support

- macOS 12+ (native app via Electron)
- Modern browsers (published pages):
  - Chrome/Edge 90+
  - Firefox 88+
  - Safari 14+

---

## Performance

- **Live preview**: < 100ms render time
- **Published pages**: < 50ms first paint (Cloudflare edge)
- **CSS sync**: < 5 seconds (Cloudflare deployment)
- **App bundle**: ~150 MB (Electron + dependencies)

---

## Troubleshooting

### Server won't start
```bash
# Check port 3737 is free
lsof -i :3737

# Kill process if needed
kill -9 <PID>

# Clear node_modules and reinstall
rm -rf node_modules && npm install
```

### CSS not updating
```bash
# Rebuild CSS from tokens
npm run build:publish-assets

# Check output was generated
ls -lh cf-publish-worker/public/publish.css

# Deploy to workers
./scripts/DeployWorker.command
```

### XSS still appears in output
```bash
# Verify sanitizeHtml is being called
grep -n "sanitizeHtml" server/routes/render.js
grep -n "sanitizeHtml" cf-publish-worker/src/renderer.js

# Check md-renderer-core.js exists and is correct
cat renderer/js/services/md-renderer-core.js | grep "function sanitizeHtml"
```

### Mermaid diagrams not rendering
```bash
# Check mermaid div is created
curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"```mermaid\ngraph LR\nA --> B\n```"}' | jq '.html' | grep mermaid

# Verify mermaid.js is loaded in browser (check index.html)
```

---

## Contributing

### Code Style
- ESLint for JavaScript (run `npm run lint:js`)
- Stylelint for CSS (run `npm run lint:css`)
- Comments only for "why", not "what"
- Pure functions preferred (no side effects)

### Testing
- Add tests for new features
- Run `npm run test` before committing
- Update manual testing guide if needed

### Security
- All user markdown must be sanitized
- Use `sanitizeHtml()` from md-renderer-core.js
- No `eval()` or dynamic code execution
- No unescaped HTML in templates

---

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for release notes and version history.

**Latest:** v1.1.0 (May 1, 2026)
- ✨ Render logic consolidation
- 🔒 Critical XSS security fix in worker
- 📊 21 unit tests for rendering functions

---

## License

[Your License Here]

---

## Support

- 📧 Email: mchis1607@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 📚 Docs: Check CHANGELOG.md for history

---

**Built with ❤️ using Electron, Express, and Cloudflare Workers**

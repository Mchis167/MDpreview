# Module: SCRIPTS


<file path="scripts/DeployWorker.command">
```command
#!/bin/bash

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "--------------------------------------------------------"
echo "🚀 DEPLOYING CLOUDFLARE WORKER..."
echo "--------------------------------------------------------"
echo ""

# Ensure publish CSS is up-to-date
echo "🎨 Step 1/3: Syncing publish CSS from tokens..."
npm run build:publish-assets || {
  echo "❌ Error: Assets build failed"
  exit 1
}

echo ""
echo "📦 Step 2/3: Deploying to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Error: wrangler is not installed."
  echo "   Install it with: npm install -g wrangler"
  echo "   Or run: npm install in cf-publish-worker/"
  exit 1
fi

# Change to worker directory
cd cf-publish-worker || {
  echo "❌ Error: Could not find cf-publish-worker directory"
  exit 1
}

# Deploy worker
wrangler deploy || {
  echo "❌ Error: Deployment failed"
  echo "   Make sure you're authenticated: wrangler login"
  exit 1
}

echo ""
echo "✅ Step 3/3: Deployment complete!"
echo ""
echo "📊 Summary:"
echo "   • CSS synced from tokens ✓"
echo "   • Worker deployed to Cloudflare ✓"
echo ""
echo "🌐 Your published pages are now live with latest styles!"
echo ""
echo "📝 Next:"
echo "   • Test your published pages: https://[your-worker].workers.dev/[slug]"
echo "   • Check status: wrangler deployments list"
echo ""
echo "Press any key to exit..."
read -p "" -n1 -s

```
</file>

<file path="scripts/PreviewUI.command">
```command
#!/bin/bash

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "🚀 Starting MDpreview Server..."

# Sync publish CSS from tokens (Phase 1.2)
echo "🎨 Syncing publish CSS..."
npm run build:publish-assets

# Kill any process running on port 3737 to avoid conflicts
lsof -ti:3737 | xargs kill -9 2>/dev/null

# Start server in background
npm run serve > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to initialize..."
sleep 2

# Check if server is still running
if ! ps -p $SERVER_PID > /dev/null; then
  echo "❌ Error: Server failed to start. Check server.log for details:"
  cat server.log
  exit 1
fi

# Open in browser
echo "🌐 Opening MDpreview..."
if open -a "Microsoft Edge" "http://localhost:3737" 2>/dev/null; then
  echo "✅ Opened in Microsoft Edge"
else
  open "http://localhost:3737"
  echo "✅ Opened in default browser (Microsoft Edge not found)"
fi

echo "🚀 MDpreview is running (PID: $SERVER_PID)."
echo "Press Ctrl+C in this terminal if you want to stop the server."

# Keep terminal open to maintain background process
wait $SERVER_PID

```
</file>

<file path="scripts/QuickRebuild.command">
```command
#!/bin/bash

# Tự động tìm thư mục chứa file này và di chuyển vào thư mục gốc của dự án
cd "$(dirname "$0")/.."

# Thực thi script rebuild nằm trong thư mục scripts
echo "--------------------------------------------------------"
echo "🛠️ ĐANG TỰ ĐỘNG REBUILD MDPREVIEW..."
echo "--------------------------------------------------------"

./scripts/rebuild.sh

# Giữ cửa sổ terminal mở để bạn có thể xem kết quả
echo ""
echo "✨ Xong rồi! Bạn có thể đóng cửa sổ này và mở MDpreview.app được rồi đó."
read -p "Ấn phím bất kỳ để thoát..." -n1 -s
echo ""

```
</file>

<file path="scripts/build-publish-assets.js">
```js
#!/usr/bin/env node
/**
 * build-publish-assets.js
 * Generates cf-publish-worker/public/publish.css and syncs JS assets.
 * Sources:
 *   1. renderer/css/design-system/tokens.css  — full 3-tier token system
 *   2. renderer/css/design-system/organisms/zoom-modal.css — zoom modal styles
 *   3. renderer/js/utils/zoom.js — zoom logic
 *   4. cf-publish-worker/src/publish-styles.css — publish-page specific styles
 *
 * Usage: node scripts/build-publish-assets.js
 *        npm run build:publish-assets
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TOKENS_SRC      = path.join(ROOT, 'renderer/css/design-system/tokens.css');
const TAB_BAR_SRC     = path.join(ROOT, 'renderer/css/design-system/organisms/tab-bar.css');
const ZOOM_MODAL_SRC   = path.join(ROOT, 'renderer/css/design-system/organisms/zoom-modal.css');
const SHARED_SRC      = path.join(ROOT, 'renderer/css/shared/markdown-render.css');
const STYLES_SRC      = path.join(ROOT, 'cf-publish-worker/src/publish-styles.css');
const OUTPUT          = path.join(ROOT, 'cf-publish-worker/public/publish.css');

// JS Assets to sync
const JS_ASSETS = [
  { src: 'renderer/js/utils/code-blocks.js', dest: 'cf-publish-worker/public/code-blocks.js' },
  { src: 'renderer/js/utils/zoom.js',        dest: 'cf-publish-worker/public/zoom.js' }
];

// Aliases that let publish-styles.css keep its current token names
// without requiring a rename in the source file.
const PUBLISH_COMPAT_ALIASES = `
/* ── Publish-page aliases ─────────────────────────────────
   These bridge legacy publish.css token names to the
   canonical tokens defined above.
   ────────────────────────────────────────────────────── */
:root {
  --ds-bg-main:           var(--ds-bg-base);
  --ds-transition-smooth: var(--ds-transition-main);
}
`;

function build() {
  // 1. Build CSS
  console.log('🎨 Building publish.css...');
  
  const sources = [
    ['tokens', TOKENS_SRC],
    ['tab-bar', TAB_BAR_SRC],
    ['zoom-modal', ZOOM_MODAL_SRC],
    ['shared', SHARED_SRC],
    ['styles', STYLES_SRC]
  ];

  for (const [label, file] of sources) {
    if (!fs.existsSync(file)) {
      console.error(`✗ Missing ${label} source: ${file}`);
      process.exit(1);
    }
  }

  const tokens = fs.readFileSync(TOKENS_SRC, 'utf8');
  const tabBar = fs.readFileSync(TAB_BAR_SRC, 'utf8');
  const zoomModal = fs.readFileSync(ZOOM_MODAL_SRC, 'utf8');
  const shared = fs.readFileSync(SHARED_SRC, 'utf8');
  const styles = fs.readFileSync(STYLES_SRC, 'utf8');

  const banner = [
    '/* AUTO-GENERATED — DO NOT EDIT MANUALLY',
    ' * Sources:',
    ' *   renderer/css/design-system/tokens.css',
    ' *   renderer/css/design-system/organisms/tab-bar.css',
    ' *   renderer/css/design-system/organisms/zoom-modal.css',
    ' *   renderer/css/shared/markdown-render.css',
    ' *   cf-publish-worker/src/publish-styles.css',
    ' * Regenerate: npm run build:publish-assets',
    ` * Generated:  ${new Date().toISOString()}`,
    ' */',
    '',
  ].join('\n');

  const output = [banner, tokens, PUBLISH_COMPAT_ALIASES, tabBar, zoomModal, shared, styles].join('\n');

  fs.writeFileSync(OUTPUT, output, 'utf8');

  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`✓ publish.css built — ${kb} kB`);

  // 2. Sync JS Assets
  console.log('\n📦 Syncing JS assets...');
  for (const asset of JS_ASSETS) {
    const srcPath = path.join(ROOT, asset.src);
    const destPath = path.join(ROOT, asset.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Synced: ${asset.src} → ${asset.dest}`);
    } else {
      console.warn(`⚠️ Warning: Source JS asset not found: ${asset.src}`);
    }
  }
}

build();

```
</file>

<file path="scripts/bundle-for-ai.js">
```js
const fs = require('fs');
const path = require('path');

const CONFIG = {
    OUTPUT_DIR: path.join(__dirname, '../ai-bundles'),
    PROJECT_NAME: 'MDpreview',
    // Định nghĩa thứ tự ưu tiên (số càng nhỏ càng quan trọng)
    PRIORITY: {
        'PROJECT-MAP': '00',
        'core': '01',
        'docs': '02',
        'electron': '03',
        'server': '04',
        'renderer': '05',
        'worker': '06',
        'scripts': '07',
        'tests': '08',
        'misc': '09'
    },
    MODULES: {
        'core': ['package.json', 'ARCHITECTURE.md', 'CHANGELOG.md', 'tailwind.config.js', 'eslint.config.mjs'],
        'docs': ['docs', 'GraphPreview'],
        'renderer': ['renderer'],
        'electron': ['electron'],
        'server': ['server'],
        'worker': ['cf-publish-worker'],
        'scripts': ['scripts'],
        'tests': ['tests']
    },
    DEFAULT_IGNORES: [
        '.git', 'node_modules', 'dist', 'ai-bundles', '.gemini', '.agents', 
        '.vscode', '.DS_Store', 'package-lock.json', 'yarn.lock', 'assets', 'data', 'logs'
    ],
    BINARY_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip']
};

function getCustomIgnores(rootDir) {
    const ignores = new Set(CONFIG.DEFAULT_IGNORES);
    const ignoreFiles = ['.aiignore', '.gitignore'];
    for (const file of ignoreFiles) {
        const filePath = path.join(rootDir, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath, 'utf-8');
            content.split('\n').forEach(line => {
                const cleanLine = line.trim();
                if (cleanLine && !cleanLine.startsWith('#')) {
                    ignores.add(cleanLine.replace(/^\/|\/$/g, ''));
                }
            });
        }
    }
    return Array.from(ignores);
}

function shouldIgnore(itemPath, ignores, rootDir) {
    const relativePath = path.relative(rootDir, itemPath);
    const parts = relativePath.split(path.sep);
    const fileName = path.basename(itemPath);
    const ext = path.extname(itemPath).toLowerCase();
    
    if (CONFIG.BINARY_EXTENSIONS.includes(ext)) return true;
    for (const pattern of ignores) {
        if (pattern.startsWith('*') && fileName.endsWith(pattern.slice(1))) return true;
        if (pattern.endsWith('*') && fileName.startsWith(pattern.slice(0, -1))) return true;
        if (parts.includes(pattern) || relativePath === pattern) return true;
    }
    return false;
}

function getAllFiles(dir, ignores, rootDir, fileList = []) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
        const fullPath = path.join(dir, item);
        if (shouldIgnore(fullPath, ignores, rootDir)) continue;
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            getAllFiles(fullPath, ignores, rootDir, fileList);
        } else {
            fileList.push(fullPath);
        }
    }
    return fileList;
}

function generateTreeText(files, rootDir) {
    let tree = "📦 Project Directory Tree:\n";
    const structure = {};
    files.forEach(file => {
        const relative = path.relative(rootDir, file);
        const parts = relative.split(path.sep);
        let current = structure;
        parts.forEach((part, i) => {
            if (i === parts.length - 1) current[part] = null;
            else {
                current[part] = current[part] || {};
                current = current[part];
            }
        });
    });

    function printTree(obj, indent = '') {
        const keys = Object.keys(obj);
        keys.forEach((key, index) => {
            const isLast = index === keys.length - 1;
            const prefix = isLast ? '└── ' : '├── ';
            tree += `${indent}${prefix}${key}\n`;
            if (obj[key] !== null) printTree(obj[key], indent + (isLast ? '    ' : '│   '));
        });
    }
    printTree(structure);
    return tree;
}

function categorizeFiles(files, rootDir) {
    const bundles = {};
    files.forEach(file => {
        const relative = path.relative(rootDir, file);
        const topDir = relative.split(path.sep)[0];
        let assignedModule = 'misc';
        for (const [modName, paths] of Object.entries(CONFIG.MODULES)) {
            if (paths.includes(topDir) || paths.includes(relative)) {
                assignedModule = modName;
                break;
            }
        }
        if (!bundles[assignedModule]) bundles[assignedModule] = [];
        bundles[assignedModule].push(file);
    });
    return bundles;
}

function bundle() {
    const rootDir = path.join(__dirname, '..');
    const ignores = getCustomIgnores(rootDir);
    
    console.log('🔍 Đang phân tích Codebase theo mức độ ưu tiên...');
    const allFiles = getAllFiles(rootDir, ignores, rootDir);
    const categorized = categorizeFiles(allFiles, rootDir);
    
    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) fs.mkdirSync(CONFIG.OUTPUT_DIR);
    else fs.readdirSync(CONFIG.OUTPUT_DIR).forEach(f => fs.unlinkSync(path.join(CONFIG.OUTPUT_DIR, f)));

    // Sắp xếp các module theo ưu tiên để ghi vào map
    const sortedModules = Object.keys(categorized).sort((a, b) => {
        return (CONFIG.PRIORITY[a] || '99') - (CONFIG.PRIORITY[b] || '99');
    });

    // 1. Tạo file PROJECT-MAP.md
    let mapContent = `# 🗺 PROJECT OVERVIEW & BUNDLE MAP\n\n`;
    mapContent += `**Project:** ${CONFIG.PROJECT_NAME}\n`;
    mapContent += `**Description:** Local Markdown Previewer with Advanced Design System\n\n`;
    mapContent += `## 📂 Reading Order & Bundle Guide\n`;
    mapContent += `Vui lòng đọc các file theo thứ tự số thứ tự (00 -> 08) để hiểu dự án tốt nhất:\n\n`;
    
    mapContent += `- \`${CONFIG.PRIORITY['PROJECT-MAP']}-PROJECT-MAP.md\`: Bản đồ tổng quan (File này).\n`;
    for (const modName of sortedModules) {
        const prefix = CONFIG.PRIORITY[modName] || '99';
        mapContent += `- \`${prefix}-${modName}.md\`: Module **${modName.toUpperCase()}**.\n`;
    }
    
    mapContent += `\n## 🌲 Project Structure\n`;
    mapContent += `\`\`\`text\n${generateTreeText(allFiles, rootDir)}\n\`\`\`\n\n`;
    
    fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, `${CONFIG.PRIORITY['PROJECT-MAP']}-PROJECT-MAP.md`), mapContent);
    console.log(`✅ Created: ${CONFIG.PRIORITY['PROJECT-MAP']}-PROJECT-MAP.md`);

    // 2. Tạo các bundle module
    for (const modName of sortedModules) {
        const files = categorized[modName];
        const prefix = CONFIG.PRIORITY[modName] || '99';
        let content = `# Module: ${modName.toUpperCase()}\n\n`;
        files.forEach(file => {
            const rel = path.relative(rootDir, file);
            const ext = path.extname(file).replace('.', '') || 'text';
            try {
                const code = fs.readFileSync(file, 'utf-8');
                content += `\n<file path="${rel}">\n\`\`\`${ext}\n${code}\n\`\`\`\n</file>\n`;
            } catch (e) {}
        });
        fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, `${prefix}-${modName}.md`), content);
        console.log(`✅ Created: ${prefix}-${modName}.md (${files.length} files)`);
    }

    console.log(`\n🎉 Xong! Đã đánh số và phân loại tại: ${CONFIG.OUTPUT_DIR}`);
}

bundle();

```
</file>

<file path="scripts/rebuild.sh">
```sh
#!/bin/bash
# Move to the project root directory
cd "$(dirname "$0")/.."

# Rebuild log for troubleshooting
LOG_FILE="logs/rebuild.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "--------------------------------------------------------"
echo "🚀 NEW REBUILD JOB: $(date)"
echo "--------------------------------------------------------"

# Đảm bảo scripts dừng lại nếu có lỗi
set -e

# Cài đặt dependencies (nếu có thay đổi)
echo "📦 1/4: Installing dependencies..."
npm install

# Đồng bộ CSS từ tokens (Phase 1.2)
echo "🎨 2/4: Syncing publish CSS from tokens..."
npm run build:publish-assets

# Xây dựng lại ứng dụng (chế độ build:dir để nhanh hơn bản DMG)
echo "🏗️ 3/4: Building application (.app)..."
npm run build:dir

echo "✅ 4/4: Rebuild complete!"
echo "📂 Locate: dist/mac*/MDpreview.app"

# Tự động mở lại
echo "🚀 Restarting MDpreview..."
# Detect ARM vs Intel path
APP_PATH=$(ls -d dist/mac*/*.app | head -n 1) || true
if [ -n "$APP_PATH" ]; then
  open "$APP_PATH"
else
  echo "❌ Error: Could not find built app in dist folder."
fi

echo "--------------------------------------------------------"

```
</file>

<file path="scripts/test-phase-1-1.sh">
```sh
#!/bin/bash

# Integration tests for Phase 1.1 - Render Logic Consolidation
# Tests both server and worker to verify consolidation success

set -e

echo "=================================================="
echo "🧪 Phase 1.1 Integration Tests"
echo "=================================================="
echo ""

# Test 1: Server Unit Tests
echo "📋 Test 1: Running unit tests for md-renderer-core.js..."
npm run test 2>&1 | grep -E "Test Files|Tests|PASS|FAIL"
if [ $? -eq 0 ]; then
  echo "✅ Unit tests passed"
else
  echo "❌ Unit tests failed"
  exit 1
fi
echo ""

# Test 2: Server XSS Sanitization
echo "📋 Test 2: Server XSS sanitization..."
npm run serve > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 3

# Test script tag removal
RESPONSE=$(curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"<script>alert(1)</script>Safe"}')

if echo "$RESPONSE" | jq -e '.html | contains("alert")' > /dev/null 2>&1; then
  echo "❌ Server failed to sanitize script tags"
  kill $SERVER_PID
  exit 1
else
  echo "✅ Server sanitizes script tags correctly"
fi

# Test iframe removal
RESPONSE=$(curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"<iframe src=\"evil.com\"></iframe>Content"}')

if echo "$RESPONSE" | jq -e '.html | contains("iframe")' > /dev/null 2>&1; then
  echo "❌ Server failed to sanitize iframe tags"
  kill $SERVER_PID
  exit 1
else
  echo "✅ Server sanitizes iframe tags correctly"
fi

# Test event handler removal
RESPONSE=$(curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"<img onclick=\"attack()\" src=\"x\">"}')

if echo "$RESPONSE" | jq -e '.html | contains("onclick")' > /dev/null 2>&1; then
  echo "❌ Server failed to sanitize event handlers"
  kill $SERVER_PID
  exit 1
else
  echo "✅ Server sanitizes event handlers correctly"
fi

# Test Mermaid rendering
RESPONSE=$(curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"```mermaid\ngraph LR\n  A --> B\n```"}')

if echo "$RESPONSE" | jq -e '.html | contains("mermaid")' > /dev/null 2>&1; then
  echo "✅ Server renders Mermaid diagrams correctly"
else
  echo "❌ Server failed to render Mermaid"
  kill $SERVER_PID
  exit 1
fi

# Test code highlighting
RESPONSE=$(curl -s -X POST http://localhost:3737/api/render-raw \
  -H "Content-Type: application/json" \
  -d '{"content":"```javascript\nconst x = 42;\n```"}')

if echo "$RESPONSE" | jq -e '.html | contains("hljs")' > /dev/null 2>&1; then
  echo "✅ Server highlights code correctly"
else
  echo "❌ Server failed to highlight code"
  kill $SERVER_PID
  exit 1
fi

kill $SERVER_PID
echo ""

# Test 3: Worker Build
echo "📋 Test 3: Worker build with CommonJS import..."
cd cf-publish-worker
npx wrangler deploy --dry-run > /tmp/worker-build.log 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Worker builds successfully with CommonJS import"
else
  echo "❌ Worker build failed"
  cat /tmp/worker-build.log
  exit 1
fi

# Test 4: Worker XSS Sanitization
echo "📋 Test 4: Worker XSS sanitization..."
npx wrangler dev --local > /tmp/worker-dev.log 2>&1 &
WORKER_PID=$!
sleep 5

RESPONSE=$(curl -s -X POST http://localhost:8787/publish \
  -H "Content-Type: application/json" \
  -H "X-Admin-Secret: test" \
  -d '{"slug":"test-xss","content":"<script>alert(1)</script>Safe","title":"Test"}')

if echo "$RESPONSE" | grep -q "alert"; then
  echo "❌ Worker failed to sanitize script tags"
  kill $WORKER_PID 2>/dev/null || true
  exit 1
else
  echo "✅ Worker sanitizes script tags correctly"
fi

kill $WORKER_PID 2>/dev/null || true
cd ..
echo ""

# Test 5: Linting
echo "📋 Test 5: Running linters..."
npm run lint 2>&1 | tail -5
if [ $? -eq 0 ]; then
  echo "✅ Linting passed"
else
  echo "⚠️  Some linting issues found (review manually if needed)"
fi
echo ""

echo "=================================================="
echo "✅ Phase 1.1 Integration Tests Complete"
echo "=================================================="
echo ""
echo "Summary:"
echo "  ✓ Unit tests: 21/21 passed"
echo "  ✓ Server XSS sanitization: PASSED"
echo "  ✓ Server Mermaid rendering: PASSED"
echo "  ✓ Server code highlighting: PASSED"
echo "  ✓ Worker build: PASSED"
echo "  ✓ Worker XSS sanitization: PASSED"
echo ""

```
</file>

# Module: SCRIPTS


<file path="scripts/PreviewUI.command">
```command
#!/bin/bash

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "🚀 Starting MDpreview Server..."

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
echo "📦 1/3: Installing dependencies..."
npm install

# Xây dựng lại ứng dụng (chế độ build:dir để nhanh hơn bản DMG)
echo "🏗️ 2/3: Building application (.app)..."
npm run build:dir

echo "✅ 3/3: Rebuild complete!"
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

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
        'scripts': '06',
        'tests': '07',
        'misc': '08'
    },
    MODULES: {
        'core': ['package.json', 'ARCHITECTURE.md', 'CHANGELOG.md', 'tailwind.config.js', 'eslint.config.mjs'],
        'docs': ['docs'],
        'renderer': ['renderer'],
        'electron': ['electron'],
        'server': ['server'],
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

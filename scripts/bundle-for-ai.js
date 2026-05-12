const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CONFIG = {
    OUTPUT_DIR: path.join(__dirname, '../ai-bundles'),
    PROJECT_NAME: 'MDpreview v1.9.0',
    MAX_BUNDLE_SIZE: 150000, // ~150KB per file to avoid truncation
    CORE_FILES: [
        'package.json',
        'ARCHITECTURE.md',
        'CHANGELOG.md',
        'README.md',
        'eslint.config.mjs',
        'vitest.config.js',
        'tailwind.config.js',
        'package-lock.json',
        '.stylelintrc.json',
        '.aiignore',
        '.gitignore',
        'AGENTS.md',
        'bundle.command'
    ],
    // Folders that are NEVER included in the product bundle
    IGNORE_LIST: [
        '.git', 'node_modules', '.agents', '.gemini', '.vscode', '.idea', '.DS_Store',
        'ImplementPlan', 'archived', 'ai-bundles', 'dist', 'data', 'logs', 'scratch',
        'workspaces', 'assets', 'build', 'out', 'temp', 'tmp', 'storage', 'images', 
        'media', 'static/assets', 'public/assets', '.claude', '.antigravity', '.ai'
    ],
    BINARY_EXTENSIONS: ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.webp', '.pdf', '.zip', '.dmg', '.exe', '.app'],
    // Order of priority for known modules
    PRIORITY: {
        'PROJECT-MAP': '00',
        'core': '01',
        'docs': '02',
        'renderer': '03',
        'electron': '04',
        'server': '05',
        'scripts': '06',
        'tests': '07'
    }
};

const BUNDLE_REGISTRY = {}; // Tracks which files go into which bundle part

function getGitInfo() {
    try {
        const hash = execSync('git rev-parse --short HEAD').toString().trim();
        const status = execSync('git status --short').toString().trim();
        return { hash, status: status || 'Clean' };
    } catch (e) {
        return { hash: 'N/A', status: 'Not a git repo or git not found' };
    }
}

function getCustomIgnores(rootDir) {
    const ignores = new Set(CONFIG.IGNORE_LIST);
    const ignoreFiles = ['.aiignore'];
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
    if (!fs.existsSync(dir)) return fileList;
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
    const rootFiles = [];
    
    files.forEach(file => {
        const relative = path.relative(rootDir, file);
        const parts = relative.split(path.sep);
        
        if (parts.length === 1) {
            if (CONFIG.CORE_FILES.includes(parts[0])) {
                if (!bundles['core']) bundles['core'] = [];
                bundles['core'].push(file);
            } else {
                rootFiles.push(parts[0]);
                if (!bundles['misc']) bundles['misc'] = [];
                bundles['misc'].push(file);
            }
        } else {
            const topDir = parts[0];
            if (!bundles[topDir]) bundles[topDir] = [];
            bundles[topDir].push(file);
        }
    });

    if (rootFiles.length > 0) {
        console.warn(`\n⚠️  Warning: Unknown root files detected (categorized as misc): ${rootFiles.join(', ')}`);
    }

    return bundles;
}

function writeModuleFiles(modName, files, rootDir, prefix) {
    let partIndex = 1;
    let currentContent = `# Module: ${modName.toUpperCase()}\n\n`;
    let currentFiles = [];
    
    const writeFile = (content, index, fileList) => {
        const fileName = `${prefix}-${modName}-part${index}.md`;
        fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, fileName), content);
        BUNDLE_REGISTRY[fileName] = fileList;
        console.log(`✅ Created: ${fileName} (${content.length} bytes, ${fileList.length} files)`);
    };

    files.forEach(file => {
        const rel = path.relative(rootDir, file);
        const ext = path.extname(file).replace('.', '') || 'text';
        try {
            const code = fs.readFileSync(file, 'utf-8');
            const fileBlock = `\n<file path="${rel}">\n\`\`\`${ext}\n${code}\n\`\`\`\n</file>\n`;
            
            if (currentContent.length + fileBlock.length > CONFIG.MAX_BUNDLE_SIZE && currentContent.length > 100) {
                writeFile(currentContent, partIndex, currentFiles);
                partIndex++;
                currentFiles = [rel];
                currentContent = `# Module: ${modName.toUpperCase()} (Part ${partIndex})\n\n` + fileBlock;
            } else {
                currentContent += fileBlock;
                currentFiles.push(rel);
            }
        } catch (e) { }
    });

    writeFile(currentContent, partIndex, currentFiles);
}

function bundle() {
    const rootDir = path.join(__dirname, '..');
    const ignores = getCustomIgnores(rootDir);
    const gitInfo = getGitInfo();

    console.log('🔍 Analyzing Codebase for AI Chatbot Bundle...');
    const allFiles = getAllFiles(rootDir, ignores, rootDir);
    const categorized = categorizeFiles(allFiles, rootDir);

    if (!fs.existsSync(CONFIG.OUTPUT_DIR)) fs.mkdirSync(CONFIG.OUTPUT_DIR);
    else fs.readdirSync(CONFIG.OUTPUT_DIR).forEach(f => fs.unlinkSync(path.join(CONFIG.OUTPUT_DIR, f)));

    const sortedModules = Object.keys(categorized).sort((a, b) => {
        const pA = CONFIG.PRIORITY[a] || '90';
        const pB = CONFIG.PRIORITY[b] || '90';
        if (pA !== pB) return pA.localeCompare(pB);
        return a.localeCompare(b);
    });

    let mapContent = `# 🗺 PROJECT OVERVIEW & BUNDLE MAP\n\n`;
    mapContent += `**Project:** ${CONFIG.PROJECT_NAME}\n`;
    mapContent += `**Description:** Product-focused codebase bundle for AI Research.\n\n`;
    
    mapContent += `## 🛠 BUNDLE METADATA\n`;
    mapContent += `- **Generated At:** ${new Date().toLocaleString()}\n`;
    mapContent += `- **Git Commit:** \`${gitInfo.hash}\`\n`;
    mapContent += `- **Git Status:** \n\`\`\`\n${gitInfo.status}\n\`\`\`\n\n`;

    mapContent += `## 📂 Reading Order & Bundle Guide\n`;
    mapContent += `Please read files in numerical order for best context:\n\n`;
    mapContent += `- \`00-PROJECT-MAP.md\`: This map.\n`;

    for (const modName of sortedModules) {
        const files = categorized[modName];
        const prefix = CONFIG.PRIORITY[modName] || '99';
        writeModuleFiles(modName, files, rootDir, prefix);
    }

    const outputFiles = Object.keys(BUNDLE_REGISTRY).sort();
    outputFiles.forEach(f => {
        mapContent += `- \`${f}\`\n`;
        BUNDLE_REGISTRY[f].forEach(relFile => {
            mapContent += `  - \`${relFile}\`\n`;
        });
    });
    
    mapContent += `\n## 🌲 Project Structure\n`;
    mapContent += `\`\`\`text\n${generateTreeText(allFiles, rootDir)}\n\`\`\`\n\n`;
    
    fs.writeFileSync(path.join(CONFIG.OUTPUT_DIR, `00-PROJECT-MAP.md`), mapContent);
    console.log(`✅ Updated: 00-PROJECT-MAP.md`);

    console.log(`\n🎉 Done! Bundle generated at: ${CONFIG.OUTPUT_DIR}`);
}

bundle();

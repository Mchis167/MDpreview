const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

/**
 * WikiIndexer - Chịu trách nhiệm xây dựng Graph quan hệ giữa các tài liệu Markdown.
 * Thực hiện quét Frontmatter (id, relations) và trích xuất mentions từ body.
 */
class WikiIndexer {
  constructor(vaultRoot) {
    this.vaultRoot = vaultRoot;
    this.indexPath = path.join(vaultRoot, '.wiki-index.json');
    this.tempPath = path.join(vaultRoot, '.wiki-index.json.tmp');
    this.backupPath = path.join(vaultRoot, '.wiki-index.json.bak');
  }

  /**
   * Xây dựng toàn bộ index cho Vault.
   * @returns {Promise<Object>} WikiIndex data.
   */
  async build() {
    const startTime = Date.now();

    const files = await this._getAllMdFiles(this.vaultRoot);
    const index = {
      generated_at: new Date().toISOString(),
      vault_root: this.vaultRoot,
      id_to_path: {},
      path_to_id: {},
      outgoing: {},
      backlinks: {}
    };

    // Pass 1: Thu thập IDs và Relations từ Frontmatter
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const relativePath = path.relative(this.vaultRoot, file);
        const parsed = matter(content);
        const data = parsed.data;

        if (data.id) {
          index.id_to_path[data.id] = relativePath;
          index.path_to_id[relativePath] = data.id;
        }

        // Khởi tạo outgoing links cho file
        index.outgoing[relativePath] = {
          flows: this._toArray(data['related-flows'] || data.flows),
          functions: this._toArray(data['referenced-functions'] || data['involves-functions']),
          decisions: this._toArray(data['governed-by'] || data.decisions),
          generic: []
        };
      } catch (err) {
        console.warn(`[WikiIndexer] Error parsing frontmatter in ${file}:`, err.message);
      }
    }

    // Pass 2: Trích xuất Mentions từ Body Content (đã tách frontmatter)
    const knownIds = new Set(Object.keys(index.id_to_path));
    for (const file of files) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const relativePath = path.relative(this.vaultRoot, file);
        const parsed = matter(content);
        
        // 1. Mentions qua backtick `ID`
        const mentions = this._extractMentions(parsed.content, knownIds);
        
        // 2. Mentions qua Markdown Links [text](./path/to/file.md)
        const relativeLinks = this._extractRelativeLinks(parsed.content, relativePath, index.path_to_id);
        
        // Merge unique generic links
        const allGeneric = new Set([
          ...mentions,
          ...relativeLinks
        ]);
        index.outgoing[relativePath].generic = Array.from(allGeneric);
      } catch (err) {
        console.warn(`[WikiIndexer] Error extracting mentions in ${file}:`, err.message);
      }
    }

    // Pass 3: Xây dựng Backlinks (đảo ngược graph)
    for (const [sourcePath, outgoing] of Object.entries(index.outgoing)) {
      const sourceId = index.path_to_id[sourcePath] || sourcePath;
      const allTargets = [
        ...outgoing.flows,
        ...outgoing.functions,
        ...outgoing.decisions,
        ...outgoing.generic
      ];

      for (const targetId of allTargets) {
        if (!index.backlinks[targetId]) index.backlinks[targetId] = [];
        if (!index.backlinks[targetId].includes(sourceId)) {
          index.backlinks[targetId].push(sourceId);
        }
      }
    }

    await this._saveIndex(index);
    
    const duration = Date.now() - startTime;
    console.log(`[WikiIndexer] Build complete in ${duration}ms. Indexed ${files.length} files.`);
    return index;
  }

  /**
   * Quét đệ quy lấy tất cả file .md, bỏ qua node_modules và .git.
   */
  async _getAllMdFiles(dir, fileList = []) {
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      if (stat.isDirectory()) {
        if (file !== 'node_modules' && file !== '.git') {
          await this._getAllMdFiles(filePath, fileList);
        }
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }

  /**
   * Trích xuất mentions qua backtick pattern: `ID`.
   */
  _extractMentions(content, knownIds) {
    const regex = /`([A-Za-z][A-Za-z0-9._-]*)`/g;
    const mentions = new Set();
    let match;
    while ((match = regex.exec(content)) !== null) {
      const id = match[1];
      if (knownIds.has(id)) {
        mentions.add(id);
      }
    }
    return Array.from(mentions);
  }

  /**
   * Resolve relative links và chuyển đổi sang ID nếu tìm thấy.
   */
  _extractRelativeLinks(content, currentRelativePath, pathToIdMap) {
    const regex = /\[.*?\]\((\.\.?\/[^)]+\.md)\)/g;
    const resolvedIds = new Set();
    const currentDir = path.dirname(currentRelativePath);
    
    let match;
    while ((match = regex.exec(content)) !== null) {
      const href = match[1];
      // Resolve path tương đối so với file hiện tại
      const targetRelPath = path.normalize(path.join(currentDir, href));
      
      const id = pathToIdMap[targetRelPath];
      if (id) {
        resolvedIds.add(id);
      }
    }
    return Array.from(resolvedIds);
  }

  /**
   * Lưu index một cách an toàn (Atomic Write).
   */
  async _saveIndex(index) {
    try {
      const data = JSON.stringify(index, null, 2);
      await fs.promises.writeFile(this.tempPath, data, 'utf8');

      if (fs.existsSync(this.indexPath)) {
        await fs.promises.rename(this.indexPath, this.backupPath);
      }
      
      await fs.promises.rename(this.tempPath, this.indexPath);
    } catch (err) {
      console.error('[WikiIndexer] Failed to save index:', err);
      throw err;
    }
  }

  _toArray(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}

module.exports = WikiIndexer;

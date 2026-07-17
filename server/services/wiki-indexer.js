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
    this.agentIndexPath = path.join(vaultRoot, '.wiki-agent-index.json');
    this.agentConfigPath = path.join(vaultRoot, '.wiki-agent-config.json');
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
      alias_to_path: {},
      all_paths: [],
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

        index.all_paths.push(relativePath);

        if (data.id) {
          index.id_to_path[data.id] = relativePath;
          index.path_to_id[relativePath] = data.id;
        }

        for (const alias of this._toArray(data.aliases)) {
          if (alias && typeof alias === 'string') {
            index.alias_to_path[alias] = relativePath;
          }
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

        // 3. [[wikilink]] và [[wikilink|display]]
        const wikilinkMentions = this._extractWikilinks(parsed.content, index.all_paths, index.id_to_path, index.alias_to_path, relativePath);

        // 4. Codespan `filename.md` hoặc `path/to/file.md`
        const codespanMentions = this._extractCodespanPaths(parsed.content, index.all_paths, relativePath);

        // Merge unique generic links
        const allGeneric = new Set([
          ...mentions,
          ...relativeLinks,
          ...wikilinkMentions,
          ...codespanMentions
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
        // Normalize target về ID nếu có, tránh mismatch path vs id khi lookup
        const normalizedTarget = index.path_to_id[targetId] || targetId;
        if (!index.backlinks[normalizedTarget]) index.backlinks[normalizedTarget] = [];
        if (!index.backlinks[normalizedTarget].includes(sourceId)) {
          index.backlinks[normalizedTarget].push(sourceId);
        }
      }
    }

    await this._saveIndex(index);
    
    const duration = Date.now() - startTime;
    console.log(`[WikiIndexer] Build complete in ${duration}ms. Files=${files.length} | IDs=${Object.keys(index.id_to_path).length} | Aliases=${Object.keys(index.alias_to_path).length} | all_paths=${index.all_paths.length}`);
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
        if (file !== 'node_modules' && file !== '.git' && file !== '_md-workspace-assets') {
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
    return this._saveFile(index, this.indexPath, this.tempPath, this.backupPath);
  }

  async _saveFile(data, destPath, tmpPath, bakPath) {
    try {
      const json = JSON.stringify(data, null, 2);
      await fs.promises.writeFile(tmpPath, json, 'utf8');
      if (fs.existsSync(destPath)) {
        await fs.promises.rename(destPath, bakPath);
      }
      await fs.promises.rename(tmpPath, destPath);
    } catch (err) {
      console.error(`[WikiIndexer] Failed to save ${destPath}:`, err);
      throw err;
    }
  }

  async buildAgentIndex() {
    if (!fs.existsSync(this.agentConfigPath)) {
      console.log('[AgentIndex] No .wiki-agent-config.json found — skipping');
      return null;
    }

    let config;
    try {
      config = JSON.parse(fs.readFileSync(this.agentConfigPath, 'utf8'));
    } catch (err) {
      console.warn('[AgentIndex] Failed to parse config:', err.message);
      return null;
    }

    const IGNORED = new Set(['legacy', '.agent', '.claude', 'workflows', 'node_modules', '.git']);
    const output = { generated_at: new Date().toISOString() };

    for (const [sectionKey, sectionCfg] of Object.entries(config)) {
      const sourceDir = path.join(this.vaultRoot, sectionCfg.source);
      if (!fs.existsSync(sourceDir)) {
        console.warn(`[AgentIndex] Source not found: ${sectionCfg.source}`);
        output[sectionKey] = {};
        continue;
      }

      const map = {};

      if (sectionCfg.key === 'folder_name') {
        // Scan subdirectories, key = folder name, value = first matching file
        const entries = fs.readdirSync(sourceDir);
        for (const entry of entries) {
          if (IGNORED.has(entry)) continue;
          const entryPath = path.join(sourceDir, entry);
          if (!fs.statSync(entryPath).isDirectory()) continue;
          const candidates = sectionCfg.file || ['brief.md', 'plan.md'];
          for (const candidate of candidates) {
            const filePath = path.join(entryPath, candidate);
            if (fs.existsSync(filePath)) {
              map[entry] = path.join(sectionCfg.source, entry, candidate);
              break;
            }
          }
        }
      } else if (typeof sectionCfg.key === 'string' && sectionCfg.key.startsWith('frontmatter.')) {
        // Scan files, key = frontmatter field value
        const field = sectionCfg.key.slice('frontmatter.'.length);
        const files = await this._getAllMdFiles(sourceDir);
        for (const file of files) {
          const relPath = path.relative(sourceDir, file);
          const parts = relPath.split(path.sep);
          if (parts.some(p => IGNORED.has(p))) continue;
          try {
            const content = await fs.promises.readFile(file, 'utf8');
            const parsed = matter(content);
            const keyVal = parsed.data[field];
            if (keyVal && typeof keyVal === 'string') {
              map[keyVal] = path.join(sectionCfg.source, relPath);
            }
          } catch (_err) { /* skip unreadable files */ }
        }
      }

      output[sectionKey] = map;
    }

    await this._saveFile(
      output,
      this.agentIndexPath,
      this.agentIndexPath + '.tmp',
      this.agentIndexPath + '.bak'
    );
    console.log(`[AgentIndex] Built — sections: [${Object.keys(config).join(', ')}]`);
    return output;
  }

  _extractWikilinks(content, allPaths, idToPath, aliasToPath, currentRelativePath) {
    const regex = /\[\[([^\]]+)\]\]/g;
    const results = new Set();
    const currentDir = path.dirname(currentRelativePath);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const raw = match[1].split('|')[0].trim();
      const resolved = this._resolveTarget(raw, allPaths, idToPath, aliasToPath, currentDir);
      if (resolved) results.add(resolved);
    }
    return Array.from(results);
  }

  _extractCodespanPaths(content, allPaths, currentRelativePath) {
    const regex = /`([^`\n]+\.md[^`\n]*)`/g;
    const results = new Set();
    const currentDir = path.dirname(currentRelativePath);
    let match;
    while ((match = regex.exec(content)) !== null) {
      const text = match[1].trim();
      if (text.includes('{') || text.includes('}') || text.includes(' ')) continue;
      const resolved = this._resolveTarget(text, allPaths, {}, {}, currentDir);
      if (resolved) results.add(resolved);
    }
    return Array.from(results);
  }

  _resolveTarget(text, allPaths, idToPath, aliasToPath, currentDir) {
    if (allPaths.includes(text)) return text;
    if (idToPath[text]) return idToPath[text];
    if (aliasToPath[text]) return aliasToPath[text];

    if (text.startsWith('./') || text.startsWith('../')) {
      const normalized = path.normalize(path.join(currentDir, text));
      if (allPaths.includes(normalized)) return normalized;
    }

    const suffix = '/' + text;
    const candidates = allPaths.filter(p => p === text || p.endsWith(suffix));
    if (candidates.length === 1) return candidates[0];
    if (candidates.length > 1) {
      const dirParts = currentDir.split('/').filter(Boolean);
      return candidates.reduce((best, c) => {
        const cDirParts = c.replace(/\/[^/]+$/, '').split('/').filter(Boolean);
        const bestDirParts = best.replace(/\/[^/]+$/, '').split('/').filter(Boolean);
        let scoreC = 0, scoreBest = 0;
        for (let i = 0; i < Math.min(dirParts.length, cDirParts.length); i++) {
          if (dirParts[i] === cDirParts[i]) scoreC++; else break;
        }
        for (let i = 0; i < Math.min(dirParts.length, bestDirParts.length); i++) {
          if (dirParts[i] === bestDirParts[i]) scoreBest++; else break;
        }
        if (scoreC !== scoreBest) return scoreC > scoreBest ? c : best;
        return cDirParts.length <= bestDirParts.length ? c : best;
      });
    }
    return null;
  }

  _toArray(val) {
    if (!val) return [];
    return Array.isArray(val) ? val : [val];
  }
}

module.exports = WikiIndexer;

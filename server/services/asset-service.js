const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');

/**
 * AssetService - Quản lý Indexing và phân tích Assets (hình ảnh).
 * Quét thư mục assets/ và các file Markdown để tìm tham chiếu.
 */
class AssetService {
  /**
   * @param {string} vaultRoot - Đường dẫn gốc của workspace.
   */
  constructor(vaultRoot) {
    this.vaultRoot = vaultRoot;
    this.assetsDir = path.join(vaultRoot, 'assets');
  }

  /**
   * Quét toàn bộ workspace để phân loại assets.
   * @returns {Promise<Object>} { assets: [], broken: [], orphans: [] }
   */
  async scan() {
    const startTime = Date.now();
    
    // 1. Lấy danh sách file thực tế trong thư mục assets/
    const diskAssets = await this._getDiskAssets();
    
    // 2. Quét tất cả file .md để tìm references
    const allMdFiles = await this._getAllMdFiles(this.vaultRoot);
    const refsMap = new Map(); // assetName -> [filePaths]
    const brokenLinks = []; // { assetName, foundIn: [] }

    for (const file of allMdFiles) {
      try {
        const content = await fs.promises.readFile(file, 'utf8');
        const relativePath = path.relative(this.vaultRoot, file);

        // Sử dụng gray-matter để tách frontmatter
        const parsed = matter(content);
        const bodyContent = parsed.content;
        const bodyStartOffset = content.indexOf(bodyContent);
        
        // Tính số dòng frontmatter để offset line number chính xác
        const frontmatterLines = content.substring(0, bodyStartOffset).split(/\r?\n/).length - 1;

        // Phân tách token bằng marked
        const tokens = marked.lexer(bodyContent);
        
        // Quét token context-aware
        this._extractAssetRefsFromTokens(tokens, relativePath, 1 + frontmatterLines, refsMap);
      } catch (err) {
        console.error(`[AssetService] Failed to scan file ${file}:`, err.message);
      }
    }

    // 3. Phân loại
    const assets = [];
    const orphans = [];
    const referencedNames = Array.from(refsMap.keys());

    // Duyệt qua các file trên đĩa
    for (const asset of diskAssets) {
      const stats = await fs.promises.stat(path.join(this.assetsDir, asset.name));
      const fileRefsMap = refsMap.get(asset.name);
      const refs = fileRefsMap ? Array.from(fileRefsMap.values()) : [];
      
      // Tính tổng số lần xuất hiện (refCount)
      const totalRefs = refs.reduce((sum, r) => sum + r.occurrences.length, 0);

      const assetData = {
        name: asset.name,
        size: stats.size,
        modified: stats.mtime,
        refCount: totalRefs,
        refs: refs
      };

      if (totalRefs > 0) {
        assets.push(assetData);
      } else {
        orphans.push(assetData);
      }
    }

    // Kiểm tra broken links (có ref nhưng không có file trên đĩa)
    const diskAssetNames = new Set(diskAssets.map(a => a.name));
    for (const refName of referencedNames) {
      if (!diskAssetNames.has(refName)) {
        const fileRefsMap = refsMap.get(refName);
        const refs = fileRefsMap ? Array.from(fileRefsMap.values()) : [];
        const totalRefs = refs.reduce((sum, r) => sum + r.occurrences.length, 0);

        brokenLinks.push({
          name: refName,
          type: 'broken',
          refCount: totalRefs,
          refs: refs
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`[AssetService] Scan complete in ${duration}ms. Found ${assets.length} active, ${orphans.length} orphans, ${brokenLinks.length} broken.`);

    return {
      generated_at: new Date().toISOString(),
      vault_root: this.vaultRoot,
      assets,
      orphans,
      broken: brokenLinks
    };
  }

  /**
   * Duyệt cây token của marked để tìm tham chiếu asset, bỏ qua các khối code.
   */
  _extractAssetRefsFromTokens(tokens, relativePath, startLine, refsMap) {
    let currentLine = startLine;
    const imgRegex = /(!\[.*?\]\s*\((\/?assets\/([^)]+))\))|(<img\s+[^>]*src=["'](\/?assets\/([^"']+))["'])/g;

    for (const token of tokens) {
      const newlines = (token.raw.match(/\n/g) || []).length;

      // 1. Nếu có token con, ưu tiên đệ quy để xử lý sâu hơn
      // Điều này giúp tránh đếm lặp (ví dụ: paragraph chứa text và image)
      if (token.tokens && token.tokens.length > 0) {
        this._extractAssetRefsFromTokens(token.tokens, relativePath, currentLine, refsMap);
      } else {
        // 2. Xử lý token lá (leaf tokens)
        
        // Bỏ qua các thành phần code/literal
        if (token.type === 'code' || token.type === 'codespan') {
          // Skip
        } else if (token.type === 'image') {
          // marked tách riêng image token
          const assetName = token.href.replace(/^(\/)?assets\//, '');
          this._addRef(assetName, relativePath, currentLine, token.raw, refsMap);
        } else if (token.type === 'html') {
          // Chỉ xử lý HTML nếu không phải comment và không nằm trong các thẻ cấm hiển thị image
          const isComment = token.raw.trim().startsWith('<!--');
          const isForbidden = /<(pre|code|script|style)/i.test(token.raw);
          
          if (!isComment && !isForbidden) {
            let match;
            imgRegex.lastIndex = 0;
            while ((match = imgRegex.exec(token.raw)) !== null) {
              const assetName = match[3] || match[6];
              if (assetName) {
                this._addRef(assetName, relativePath, currentLine, match[0], refsMap);
              }
            }
          }
        } else if (token.type === 'text' || token.type === 'paragraph') {
          // Quét regex cho text thô (trường hợp <img> viết trực tiếp)
          let match;
          imgRegex.lastIndex = 0;
          while ((match = imgRegex.exec(token.raw)) !== null) {
            const assetName = match[3] || match[6];
            if (assetName) {
              this._addRef(assetName, relativePath, currentLine, match[0], refsMap);
            }
          }
        }
      }

      currentLine += newlines;
    }
  }

  /**
   * Helper ghi nhận tham chiếu vào map.
   */
  _addRef(assetName, relativePath, line, snippet, refsMap) {
    // Loại bỏ query params hoặc hash nếu có trong tên file
    const cleanName = assetName.split('?')[0].split('#')[0];
    const decodedName = decodeURIComponent(cleanName);

    if (!refsMap.has(decodedName)) {
      refsMap.set(decodedName, new Map());
    }
    
    const fileRefs = refsMap.get(decodedName);
    if (!fileRefs.has(relativePath)) {
      fileRefs.set(relativePath, { path: relativePath, occurrences: [] });
    }
    
    fileRefs.get(relativePath).occurrences.push({
      line: line,
      content: snippet.trim()
    });
  }

  /**
   * Lấy danh sách file thực tế trong thư mục assets/
   */
  async _getDiskAssets() {
    if (!fs.existsSync(this.assetsDir)) return [];
    
    try {
      const files = await fs.promises.readdir(this.assetsDir);
      const assets = [];
      for (const file of files) {
        const filePath = path.join(this.assetsDir, file);
        const stat = await fs.promises.stat(filePath);
        if (stat.isFile() && !file.startsWith('.')) {
          assets.push({ name: file });
        }
      }
      return assets;
    } catch (err) {
      console.error('[AssetService] Failed to read assets dir:', err.message);
      return [];
    }
  }

  /**
   * Quét đệ quy lấy tất cả file .md, bỏ qua node_modules, .git và chính thư mục assets/.
   */
  async _getAllMdFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    const files = await fs.promises.readdir(dir);
    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = await fs.promises.stat(filePath);
      
      if (stat.isDirectory()) {
        // Bỏ qua các thư mục không cần thiết và chính thư mục assets
        if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
          await this._getAllMdFiles(filePath, fileList);
        }
      } else if (file.endsWith('.md')) {
        fileList.push(filePath);
      }
    }
    return fileList;
  }
  /**
   * Đổi tên asset và cập nhật tất cả tham chiếu trong workspace.
   * @param {string} oldName 
   * @param {string} newName 
   * @returns {Promise<Object>} { success: true, updatedFiles: number }
   */
  async rename(oldName, newName) {
    const oldPath = path.join(this.assetsDir, oldName);
    const newPath = path.join(this.assetsDir, newName);

    if (!fs.existsSync(oldPath)) throw new Error('Source asset not found');
    if (fs.existsSync(newPath)) throw new Error('Target name already exists');

    // 1. Đổi tên file vật lý
    await fs.promises.rename(oldPath, newPath);

    // 2. Cập nhật tham chiếu trong các file Markdown
    const updatedFilesCount = await this._updateAllReferences(oldName, newName);

    return { success: true, updatedFiles: updatedFilesCount };
  }

  /**
   * Thay thế một tham chiếu hỏng bằng một asset khác hoặc upload mới.
   * @param {string} oldName - Tên asset đang bị hỏng (missing)
   * @param {string} newName - Tên asset thay thế
   * @param {Object} options { isUpload: boolean, fileData: string (base64) }
   */
  async replaceBrokenAsset(oldName, newName, options = {}) {
    let actualNewName = newName;

    // 1. Nếu là upload, lưu file trước
    if (options.isUpload && options.fileData) {
      const buffer = Buffer.from(options.fileData, 'base64');
      const targetPath = path.join(this.assetsDir, newName);
      
      // Đảm bảo thư mục assets tồn tại
      if (!fs.existsSync(this.assetsDir)) {
        await fs.promises.mkdir(this.assetsDir, { recursive: true });
      }

      await fs.promises.writeFile(targetPath, buffer);
    } else {
      // Nếu không phải upload, kiểm tra xem newName có tồn tại không
      const targetPath = path.join(this.assetsDir, newName);
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Target asset "${newName}" does not exist`);
      }
    }

    // 2. Cập nhật tất cả tham chiếu từ oldName sang actualNewName
    const updatedFilesCount = await this._updateAllReferences(oldName, actualNewName);

    return { success: true, updatedFiles: updatedFilesCount, newName: actualNewName };
  }

  /**
   * Helper: Cập nhật tất cả tham chiếu từ oldName sang newName trong toàn bộ file Markdown.
   * @private
   */
  async _updateAllReferences(oldName, newName) {
    const allMdFiles = await this._getAllMdFiles(this.vaultRoot);
    let updatedFilesCount = 0;

    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const escapedOldName = escapeRegExp(oldName);
    const escapedOldNameEncoded = escapeRegExp(encodeURIComponent(oldName));

    const mdRegex = new RegExp(`(!\\[.*?\\]\\s*\\(\\/?assets\\/)(${escapedOldName}|${escapedOldNameEncoded})(\\))`, 'g');
    const htmlRegex = new RegExp(`(<img\\s+[^>]*src=["']\\/?assets\\/)(${escapedOldName}|${escapedOldNameEncoded})(["'])`, 'g');

    for (const file of allMdFiles) {
      try {
        const originalContent = await fs.promises.readFile(file, 'utf8');
        if (!originalContent.includes(oldName) && !originalContent.includes(encodeURIComponent(oldName))) continue;

        const parsed = matter(originalContent);
        const tokens = marked.lexer(parsed.content);
        
        let changed = false;
        const processTokens = (tokenList) => {
          for (const token of tokenList) {
            if (token.type === 'code' || token.type === 'codespan') continue;
            
            const oldRaw = token.raw;
            token.raw = token.raw.replace(mdRegex, `$1${newName}$3`);
            token.raw = token.raw.replace(htmlRegex, `$1${newName}$3`);
            
            if (token.raw !== oldRaw) changed = true;
            if (token.tokens) processTokens(token.tokens);
          }
        };

        processTokens(tokens);

        if (changed) {
          const newBody = tokens.map(t => t.raw).join('');
          const bodyOffset = originalContent.indexOf(parsed.content);
          const frontmatter = originalContent.substring(0, bodyOffset);
          await fs.promises.writeFile(file, frontmatter + newBody);
          updatedFilesCount++;
        }
      } catch (err) {
        console.error(`[AssetService] Reference update failed for file ${file}:`, err.message);
      }
    }

    return updatedFilesCount;
  }

  /**
   * Xóa asset. Nếu file tồn tại thì xóa file vật lý.
   * Luôn hỗ trợ xóa tham chiếu trong file Markdown nếu được yêu cầu.
   * @param {string} name 
   * @param {Object} options { removeRefs: boolean }
   */
  async delete(name, options = { removeRefs: false }) {
    const filePath = path.join(this.assetsDir, name);
    let fileDeleted = false;

    // 1. Xóa file vật lý nếu tồn tại
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      fileDeleted = true;
    }

    // 2. Làm sạch tham chiếu
    let updatedFilesCount = 0;
    if (options.removeRefs) {
      const allMdFiles = await this._getAllMdFiles(this.vaultRoot);
      const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const escapedName = escapeRegExp(name);
      const escapedNameEncoded = escapeRegExp(encodeURIComponent(name));

      // Regex để xóa toàn bộ tag ![]() hoặc <img>
      const mdRegex = new RegExp(`!\\[.*?\\]\\s*\\(\\/?assets\\/(${escapedName}|${escapedNameEncoded})\\)`, 'g');
      const htmlRegex = new RegExp(`<img\\s+[^>]*src=["']\\/?assets\\/(${escapedName}|${escapedNameEncoded})["'][^>]*\\/?>`, 'g');

      for (const file of allMdFiles) {
        try {
          const originalContent = await fs.promises.readFile(file, 'utf8');
          if (!originalContent.includes(name) && !originalContent.includes(encodeURIComponent(name))) continue;

          const parsed = matter(originalContent);
          const tokens = marked.lexer(parsed.content);
          
          let changed = false;
          const processTokens = (tokenList) => {
            for (const token of tokenList) {
              if (token.type === 'code' || token.type === 'codespan') continue;
              
              const oldRaw = token.raw;
              token.raw = token.raw.replace(mdRegex, '');
              token.raw = token.raw.replace(htmlRegex, '');
              
              if (token.raw !== oldRaw) changed = true;
              if (token.tokens) processTokens(token.tokens);
            }
          };

          processTokens(tokens);

          if (changed) {
            const newBody = tokens.map(t => t.raw).join('');
            const bodyOffset = originalContent.indexOf(parsed.content);
            const frontmatter = originalContent.substring(0, bodyOffset);
            await fs.promises.writeFile(file, frontmatter + newBody);
            updatedFilesCount++;
          }
        } catch (err) {
          console.error(`[AssetService] Delete references failed for file ${file}:`, err.message);
        }
      }
    }

    return { success: true, fileDeleted, updatedFiles: updatedFilesCount };
  }

  /**
   * Dọn dẹp tất cả ảnh mồ côi (không có tham chiếu).
   * @returns {Promise<Object>} { success: true, count: number }
   */
  async purgeOrphans() {
    const data = await this.scan();
    const orphans = data.orphans;
    let deletedCount = 0;

    for (const orphan of orphans) {
      const filePath = path.join(this.assetsDir, orphan.name);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        deletedCount++;
      }
    }

    return { success: true, count: deletedCount };
  }

  /**
   * Dọn dẹp tất cả tham chiếu hỏng (broken links) trong toàn bộ workspace.
   * @returns {Promise<Object>} { success: true, count: number, updatedFiles: number }
   */
  async purgeBroken() {
    const data = await this.scan();
    const broken = data.broken;
    let totalUpdatedFiles = 0;
    let totalRefsCleaned = 0;

    if (broken.length === 0) return { success: true, count: 0, updatedFiles: 0 };

    const allMdFiles = await this._getAllMdFiles(this.vaultRoot);
    
    // Tạo mảng regex cho tất cả các file bị hỏng để tối ưu hóa việc quét
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    const patterns = broken.map(b => {
      const escapedName = escapeRegExp(b.name);
      const escapedNameEncoded = escapeRegExp(encodeURIComponent(b.name));
      return {
        md: new RegExp(`!\\[.*?\\]\\s*\\(\\/?assets\\/(${escapedName}|${escapedNameEncoded})\\)`, 'g'),
        html: new RegExp(`<img\\s+[^>]*src=["']\\/?assets\\/(${escapedName}|${escapedNameEncoded})["'][^>]*\\/?>`, 'g')
      };
    });

    for (const file of allMdFiles) {
      try {
        const originalContent = await fs.promises.readFile(file, 'utf8');
        const parsed = matter(originalContent);
        const tokens = marked.lexer(parsed.content);
        
        let changed = false;
        const processTokens = (tokenList) => {
          for (const token of tokenList) {
            if (token.type === 'code' || token.type === 'codespan') continue;
            
            const oldRaw = token.raw;
            for (const pattern of patterns) {
              token.raw = token.raw.replace(pattern.md, '');
              token.raw = token.raw.replace(pattern.html, '');
            }
            
            if (token.raw !== oldRaw) {
              changed = true;
              totalRefsCleaned++; 
            }
            if (token.tokens) processTokens(token.tokens);
          }
        };

        processTokens(tokens);

        if (changed) {
          const newBody = tokens.map(t => t.raw).join('');
          const bodyOffset = originalContent.indexOf(parsed.content);
          const frontmatter = originalContent.substring(0, bodyOffset);
          await fs.promises.writeFile(file, frontmatter + newBody);
          totalUpdatedFiles++;
        }
      } catch (err) {
        console.error(`[AssetService] Purge broken failed for file ${file}:`, err.message);
      }
    }

    return { success: true, count: totalRefsCleaned, updatedFiles: totalUpdatedFiles };
  }
}



module.exports = AssetService;

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const AssetService = require('../services/asset-service');

/**
 * GET /api/assets
 * Trả về danh sách assets, orphans và broken links.
 */
router.get('/assets', async (req, res) => {
  const { watchDir } = req;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  try {
    const service = new AssetService(watchDir);
    const data = await service.scan();
    res.json(data);
  } catch (err) {
    console.error('[AssetsRoute] Scan failed:', err);
    res.status(500).json({ error: 'Failed to scan assets' });
  }
});

/**
 * DELETE /api/assets/:name
 * Xóa một asset khỏi thư mục assets/.
 */
router.delete('/assets/:name', async (req, res) => {
  const { watchDir } = req;
  const { name } = req.params;
  const { force } = req.query; // Nếu force=true thì xóa bất chấp đang có refs

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  const assetPath = path.join(watchDir, 'assets', name);

  // Security: Ngăn chặn directory traversal
  const relative = path.relative(path.join(watchDir, 'assets'), assetPath);
  if (relative.includes('..') || path.isAbsolute(relative)) {
    return res.status(403).json({ error: 'Forbidden path' });
  }

  if (!fs.existsSync(assetPath)) {
    return res.status(404).json({ error: 'Asset not found' });
  }

  try {
    // Nếu không force, kiểm tra xem có đang được dùng không
    if (force !== 'true') {
      const service = new AssetService(watchDir);
      const data = await service.scan();
      const asset = data.assets.find(a => a.name === name);
      
      if (asset && asset.refCount > 0) {
        return res.status(400).json({ 
          error: 'Asset is currently in use', 
          refCount: asset.refCount,
          refs: asset.refs
        });
      }
    }

    await fs.promises.unlink(assetPath);
    res.json({ success: true, message: `Asset ${name} deleted` });
  } catch (err) {
    console.error('[AssetsRoute] Delete failed:', err);
    res.status(500).json({ error: 'Failed to delete asset' });
  }
});

/**
 * POST /api/assets/upload
 * Hỗ trợ upload ảnh từ trình duyệt (fallback cho browser mode).
 */
router.post('/assets/upload', async (req, res) => {
  const { watchDir } = req;
  const { files } = req.body; // Expect array of { name: string, data: base64 }

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!files || !Array.isArray(files)) return res.status(400).json({ error: 'No files provided' });

  const assetsDir = path.join(watchDir, 'assets');
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }

  const results = [];
  try {
    for (const file of files) {
      const ext = path.extname(file.name);
      const originalName = path.basename(file.name, ext);
      let fileName = file.name;
      let targetPath = path.join(assetsDir, fileName);

      // Collision Handling
      let counter = 1;
      while (fs.existsSync(targetPath)) {
        fileName = `${originalName} (${counter++})${ext}`;
        targetPath = path.join(assetsDir, fileName);
      }

      // Convert base64 to buffer
      const buffer = Buffer.from(file.data, 'base64');
      fs.writeFileSync(targetPath, buffer);
      results.push(fileName);
    }

    res.json({ success: true, count: results.length, files: results });
  } catch (err) {
    console.error('[AssetsRoute] Upload failed:', err);
    res.status(500).json({ error: 'Failed to save files' });
  }
});

/**
 * POST /api/assets/rename
 * Đổi tên asset và cập nhật tham chiếu (dành cho browser mode).
 */
router.post('/assets/rename', async (req, res) => {
  const { watchDir } = req;
  const { oldName, newName } = req.body;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!oldName || !newName) return res.status(400).json({ error: 'Missing parameters' });

  try {
    const service = new AssetService(watchDir);
    const result = await service.rename(oldName, newName);
    res.json(result);
  } catch (err) {
    console.error('[AssetsRoute] Rename failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/assets/delete
 * Xóa một asset kèm tùy chọn dọn dẹp tham chiếu.
 */
router.post('/assets/delete', async (req, res) => {
  const { watchDir } = req;
  const { name, removeRefs } = req.body;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!name) return res.status(400).json({ error: 'Missing name parameter' });

  try {
    const service = new AssetService(watchDir);
    const result = await service.delete(name, { removeRefs });
    res.json(result);
  } catch (err) {
    console.error('[AssetsRoute] Delete failed:', err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/assets/purge-orphans
 * Xóa toàn bộ ảnh mồ côi (không có tham chiếu).
 */
router.post('/assets/purge-orphans', async (req, res) => {
  const { watchDir } = req;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  try {
    const service = new AssetService(watchDir);
    const result = await service.purgeOrphans();
    res.json(result);
  } catch (err) {
    console.error('[AssetsRoute] Purge orphans failed:', err);
    res.status(500).json({ error: 'Failed to purge orphans' });
  }
});

/**
 * POST /api/assets/purge-broken
 * Dọn dẹp toàn bộ tham chiếu hỏng trong workspace.
 */
router.post('/assets/purge-broken', async (req, res) => {
  const { watchDir } = req;
  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });

  try {
    const service = new AssetService(watchDir);
    const result = await service.purgeBroken();
    res.json(result);
  } catch (err) {
    console.error('[AssetsRoute] Purge broken failed:', err);
    res.status(500).json({ error: 'Failed to purge broken references' });
  }
});

module.exports = router;



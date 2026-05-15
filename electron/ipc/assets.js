const fs = require('fs');
const path = require('path');
function register(ipcMain, dialog) {

  // 1. Import Assets
  ipcMain.handle('assets:import', async (event, vaultPath) => {
    try {
      if (!vaultPath) throw new Error('Vault path is required');


      
      const assetsDir = path.join(vaultPath, 'assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      const result = await dialog.showOpenDialog({
        title: 'Select Images to Import',
        properties: ['openFile', 'multiSelections'],
        filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }]
      });

      if (result.canceled || !result.filePaths.length) return { success: true, count: 0 };

      let importedCount = 0;
      for (const srcPath of result.filePaths) {
        const ext = path.extname(srcPath);
        const originalName = path.basename(srcPath, ext);
        let fileName = path.basename(srcPath);
        let targetPath = path.join(assetsDir, fileName);

        // Handle Collision
        let counter = 1;
        while (fs.existsSync(targetPath)) {
          fileName = `${originalName} (${counter++})${ext}`;
          targetPath = path.join(assetsDir, fileName);
        }

        fs.copyFileSync(srcPath, targetPath);
        importedCount++;
      }

      return { success: true, count: importedCount };
    } catch (error) {
      console.error('[IPC] assets:import error:', error);
      return { success: false, error: error.message };
    }
  });



  // 2. Rename Asset & Update References
  ipcMain.handle('assets:rename', async (event, { vaultPath, oldName, newName }) => {
    console.log('[IPC] assets:rename requested:', oldName, '->', newName);
    try {
      if (!vaultPath || !oldName || !newName) throw new Error('Missing parameters');
      
      const AssetService = require('../../server/services/asset-service');
      const service = new AssetService(vaultPath);
      return await service.rename(oldName, newName);
    } catch (error) {
      console.error('[IPC] assets:rename error:', error);
      return { success: false, error: error.message };
    }
  });


  // 3. Delete Asset
  ipcMain.handle('assets:delete', async (event, { vaultPath, name, removeRefs }) => {
    try {
      if (!vaultPath || !name) throw new Error('Missing parameters');
      const AssetService = require('../../server/services/asset-service');
      const service = new AssetService(vaultPath);
      return await service.delete(name, { removeRefs });
    } catch (error) {
      console.error('[IPC] assets:delete error:', error);
      return { success: false, error: error.message };
    }
  });
  // 4. Purge All Orphans
  ipcMain.handle('assets:purge-orphans', async (event, vaultPath) => {
    try {
      if (!vaultPath) throw new Error('Vault path is required');
      const AssetService = require('../../server/services/asset-service');
      const service = new AssetService(vaultPath);
      return await service.purgeOrphans();
    } catch (error) {
      console.error('[IPC] assets:purge-orphans error:', error);
      return { success: false, error: error.message };
    }
  });

  // 5. Purge All Broken References
  ipcMain.handle('assets:purge-broken', async (event, vaultPath) => {
    try {
      if (!vaultPath) throw new Error('Vault path is required');
      const AssetService = require('../../server/services/asset-service');
      const service = new AssetService(vaultPath);
      return await service.purgeBroken();
    } catch (error) {
      console.error('[IPC] assets:purge-broken error:', error);
      return { success: false, error: error.message };
    }
  });

}

/**
 * Helper: Recursive scan for .md files
 */
function _getAllMdFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'assets') {
        _getAllMdFiles(filePath, fileList);
      }
    } else if (file.endsWith('.md')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

module.exports = { register };

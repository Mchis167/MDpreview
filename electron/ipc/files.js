const fs = require('fs');
const path = require('path');

function register(ipcMain) {
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('File does not exist');
      // Use rmSync to handle both files and directories recursively
      fs.rmSync(filePath, { recursive: true, force: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('duplicate-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('Source file does not exist');
      const dir = path.dirname(filePath);
      const ext = path.extname(filePath);
      const name = path.basename(filePath, ext);
      
      let copyPath;
      let counter = 1;
      do {
        copyPath = path.join(dir, `${name} (${counter++})${ext}`);
      } while (fs.existsSync(copyPath));

      fs.copyFileSync(filePath, copyPath);
      return { success: true, path: copyPath };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rename-file', async (event, oldPath, newPath) => {
    try {
      if (!fs.existsSync(oldPath)) throw new Error('File not found');
      if (fs.existsSync(newPath)) throw new Error('Target file already exists');
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('move-file', async (event, oldPath, newPath) => {
    try {
      if (!fs.existsSync(oldPath)) throw new Error('Source not found');
      // Ensure target directory exists
      const targetDir = path.dirname(newPath);
      if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
      
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file', async (event, srcPath, destPath) => {
    try {
      if (!fs.existsSync(srcPath)) throw new Error('Source not found');
      const stats = fs.statSync(srcPath);
      
      if (stats.isDirectory()) {
        // Recursive copy for directory
        const copyRecursive = (src, dest) => {
          if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
          const entries = fs.readdirSync(src, { withFileTypes: true });
          for (let entry of entries) {
            const srcItem = path.join(src, entry.name);
            const destItem = path.join(dest, entry.name);
            entry.isDirectory() ? copyRecursive(srcItem, destItem) : fs.copyFileSync(srcItem, destItem);
          }
        };
        copyRecursive(srcPath, destPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-file', async (event, filePath, content = '') => {
    try {
      if (fs.existsSync(filePath)) throw new Error('File already exists');
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(filePath, content);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('create-folder', async (event, folderPath) => {
    try {
      if (fs.existsSync(folderPath)) throw new Error('Folder already exists');
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };

const fs = require('fs');
const path = require('path');

function register(ipcMain) {
  ipcMain.handle('delete-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('File does not exist');
      fs.unlinkSync(filePath);
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
}

module.exports = { register };

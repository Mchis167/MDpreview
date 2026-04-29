const fs = require('fs');
const path = require('path');
const os = require('os');
const clipboardEx = require('electron-clipboard-ex');

function register(ipcMain) {
  ipcMain.handle('read-file', async (event, filePath) => {
    try {
      if (!fs.existsSync(filePath)) throw new Error('File not found');
      return { success: true, content: fs.readFileSync(filePath, 'utf8') };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

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

  ipcMain.handle('reveal-in-finder', async (event, filePath) => {
    try {
      const { shell } = require('electron');
      if (!fs.existsSync(filePath)) throw new Error('Path does not exist');
      shell.showItemInFolder(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-to-clipboard', async (event, filePath) => {
    console.log('[MAIN DEBUG] Received copy-file-to-clipboard request for:', filePath);
    try {
      const { getWatchDir } = require('../main');
      const fullPath = path.isAbsolute(filePath) ? filePath : path.resolve(getWatchDir() || '', filePath);
      console.log('[MAIN DEBUG] Resolved absolute path:', fullPath);
      
      if (!fs.existsSync(fullPath)) {
        console.error('[MAIN DEBUG] File does not exist:', fullPath);
        return { success: false, error: 'File does not exist' };
      }

      // Use clipboard-ex for robust OS-level file copy
      clipboardEx.writeFilePaths([fullPath]);
      
      console.log('[MAIN DEBUG] Successfully wrote to clipboard via clipboard-ex');
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Copy error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('copy-file-from-buffer', async (event, { buffer, filename }) => {
    console.log('[MAIN DEBUG] Received copy-file-from-buffer request for:', filename);
    try {
      const tempDir = os.tmpdir();
      const tempPath = path.join(tempDir, filename);

      // Convert array buffer to Buffer if needed
      const data = Buffer.from(buffer);
      fs.writeFileSync(tempPath, data);
      
      // Use clipboard-ex to copy the temp file
      clipboardEx.writeFilePaths([tempPath]);

      // Cleanup temp file after 60s
      setTimeout(() => {
        try {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        } catch (_e) { /* ignore cleanup errors */ }
      }, 60_000);

      console.log('[MAIN DEBUG] Successfully copied buffer to clipboard via temp file:', tempPath);
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Copy from buffer error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.on('start-file-drag', async (event, filePath) => {
    try {
      const { app } = require('electron');
      if (!fs.existsSync(filePath)) return;
      
      const icon = await app.getFileIcon(filePath);
      event.sender.startDrag({
        file: filePath,
        icon: icon
      });
    } catch (error) {
      console.error('Drag error:', error);
    }
  });

  ipcMain.handle('get-absolute-path', async (event, filePath) => {
    try {
      if (path.isAbsolute(filePath)) return filePath;
      const { getWatchDir } = require('../main');
      const watchDir = getWatchDir();
      return watchDir ? path.resolve(watchDir, filePath) : path.resolve(filePath);
    } catch (_error) {
      return filePath;
    }
  });

  ipcMain.handle('write-clipboard-advanced', async (event, { html, text }) => {
    console.log('[MAIN DEBUG] Received write-clipboard-advanced request. HTML Length:', html?.length, 'Text Length:', text?.length);
    try {
      const { clipboard } = require('electron');
      clipboard.write({
        html: html,
        text: text
      });
      console.log('[MAIN DEBUG] Successfully wrote HTML and Text to native clipboard');
      return { success: true };
    } catch (error) {
      console.error('[MAIN DEBUG] Advanced clipboard write error:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('rasterize-svg', async (event, svgString, width, height) => {
    console.log('[MAIN DEBUG] Received rasterize-svg request. SVG Length:', svgString.length, 'Size:', width, 'x', height);
    try {
      const { nativeImage } = require('electron');
      const buffer = Buffer.from(svgString);
      const image = nativeImage.createFromBuffer(buffer, {
        width: Math.round(width),
        height: Math.round(height),
        scaleFactor: 2.0
      });
      const dataUrl = image.toDataURL();
      console.log('[MAIN DEBUG] Rasterization successful. DataURL length:', dataUrl.length);
      return { success: true, dataUrl };
    } catch (error) {
      console.error('[MAIN DEBUG] Rasterize error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };

const fs = require('fs');
const path = require('path');
const { nativeImage } = require('electron');

/**
 * IPC Attachments Handler
 * Purpose: Manages binary file attachments (images) for the workspace.
 */

function register(ipcMain) {
  ipcMain.handle('attachment:save-image', async (event, { buffer, originalName, vaultPath }) => {
    console.log('[IPC] attachment:save-image request for:', originalName);
    
    try {
      if (!vaultPath) throw new Error('Vault path is required');
      if (!buffer) throw new Error('Image buffer is required');

      // 1. Setup Assets Directory
      const assetsDir = path.join(vaultPath, '_md-workspace-assets');
      if (!fs.existsSync(assetsDir)) {
        fs.mkdirSync(assetsDir, { recursive: true });
      }

      // 2. Determine Extension and Format
      const ext = path.extname(originalName).toLowerCase() || '.png';
      const timestamp = Date.now();
      const fileName = `image-${timestamp}${ext}`;
      const fullPath = path.join(assetsDir, fileName);

      // 3. Image Processing (Compression)
      const image = nativeImage.createFromBuffer(Buffer.from(buffer));
      if (image.isEmpty()) {
        throw new Error('Failed to create image from buffer');
      }

      let outputBuffer;
      if (ext === '.jpg' || ext === '.jpeg') {
        // JPEG compression (quality 85 is a good balance)
        outputBuffer = image.toJPEG(85);
      } else if (ext === '.png') {
        // PNG is lossless in nativeImage, but re-encoding might reduce meta size
        outputBuffer = image.toPNG();
      } else {
        // For other formats (WebP, GIF etc.), if nativeImage can't re-encode specifically, 
        // fallback to raw buffer to preserve original format as requested
        outputBuffer = Buffer.from(buffer);
      }

      // 4. Save to Disk
      fs.writeFileSync(fullPath, outputBuffer);

      console.log('[IPC] Saved attachment to:', fullPath);
      
      // Return relative path starting with /assets/ as per plan
      return { 
        success: true, 
        relativePath: `/_md-workspace-assets/${fileName}`,
        fileName: fileName
      };

    } catch (error) {
      console.error('[IPC] attachment:save-image error:', error);
      return { success: false, error: error.message };
    }
  });
}

module.exports = { register };

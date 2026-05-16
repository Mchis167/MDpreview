const { nativeImage } = require('electron');

/**
 * ImageProcessor - Xử lý nén và tối ưu hóa hình ảnh trước khi publish.
 * Sử dụng nativeImage của Electron để tránh phụ thuộc vào thư viện bên ngoài.
 */
class ImageProcessor {
  /**
   * Nén ảnh: Resize tối đa 1920px width và chuyển sang WebP.
   * @param {Buffer} buffer - Buffer của ảnh gốc.
   * @param {Object} options - { quality: number, maxWidth: number }
   * @returns {Promise<Buffer>} - Buffer của ảnh đã nén (WebP).
   */
  static async processForPublish(buffer, options = {}) {
    const { quality = 85, maxWidth = 1920 } = options;

    try {
      let img = nativeImage.createFromBuffer(buffer);
      
      if (img.isEmpty()) {
        throw new Error('Invalid image buffer');
      }

      const size = img.getSize();

      // Chỉ resize nếu chiều rộng vượt quá maxWidth
      if (size.width > maxWidth) {
        img = img.resize({
          width: maxWidth,
          quality: 'better' // 'good', 'better', 'best'
        });
      }

      // Xuất ra định dạng WebP (nếu hỗ trợ) hoặc JPEG
      if (typeof img.toWebP === 'function') {
        return {
          buffer: img.toWebP(quality),
          ext: 'webp',
          mime: 'image/webp'
        };
      } else {
        // Fallback to JPEG if WebP is not available in this Electron build
        return {
          buffer: img.toJPEG(quality),
          ext: 'jpg',
          mime: 'image/jpeg'
        };
      }
    } catch (err) {
      console.error('[ImageProcessor] Compression failed:', err.message);
      // Fallback to original buffer
      return {
        buffer,
        ext: null, // Keep original
        mime: null
      };
    }
  }

  /**
   * Helper để kiểm tra xem một file có phải là hình ảnh có thể xử lý không.
   */
  static isProcessable(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(ext);
  }
}

module.exports = ImageProcessor;

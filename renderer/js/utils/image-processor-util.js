/* global WorkerPool, WasmManager */
/**
 * ImageProcessorUtil
 * Purpose: Cross-platform image processing using HTML5 Canvas
 * Works in both Electron and standard Web Browsers
 */
const ImageProcessorUtil = (() => {
  'use strict';

  // Initialize Worker Pool for Image Encoding (Bundled version for browser compatibility)
  WorkerPool.init('js/workers/image-encoder.worker.bundle.js', 3);

  /**
   * Process an image (resize via Canvas, encode via WASM Worker)
   * @param {Blob|File} blob - Original image data
   * @param {Object} options - { maxWidth, quality, forceFormat }
   * @returns {Promise<{blob: Blob, ext: string, mime: string}>}
   */
  async function processForPublish(blob, options = {}) {
    const {
      maxWidth = 1920,
      quality = 0.85,
      forceFormat = null // 'webp', 'jpeg', or 'png'
    } = options;

    try {
      // 1. Determine target format
      let targetMime = forceFormat ? `image/${forceFormat}` : _determineTargetMime(blob.type);
      if (targetMime === 'image/jpg') targetMime = 'image/jpeg';

      // 2. Check if resize is actually needed
      const needsResize = await _imageNeedsResize(blob, maxWidth);

      if (!needsResize) {
        // Skip Canvas entirely — re-encode from raw blob to avoid quality loss from canvas roundtrip
        try {
          return await _encodeViaWorkerFromBlob(blob, targetMime, quality);
        } catch (workerError) {
          console.warn('[ImageProcessorUtil] Direct encoding failed, returning original:', workerError);
          return {
            blob,
            ext: blob.type.split('/')[1].replace('jpeg', 'jpg'),
            mime: blob.type
          };
        }
      }

      // 3. Resize via Canvas only when necessary
      const { imageData } = await _resizeViaCanvas(blob, maxWidth);

      // 4. Encode via WASM Worker
      try {
        return await _encodeViaWorker(imageData, targetMime, quality);
      } catch (workerError) {
        console.warn('[ImageProcessorUtil] Worker encoding failed, falling back to Canvas:', workerError);
        return await _fallbackToCanvas(imageData, targetMime, quality);
      }

    } catch (err) {
      console.error('[ImageProcessorUtil] Critical processing error:', err);
      throw err;
    }
  }

  /**
   * Internal: Resize image using Canvas and return ImageData
   */
  async function _resizeViaCanvas(blob, maxWidth) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        resolve({
          imageData: ctx.getImageData(0, 0, width, height),
          originalType: blob.type
        });
      };

      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image for resizing'));
      };

      img.src = url;
    });
  }

  /**
   * Internal: Check if image dimensions exceed maxWidth (without full canvas draw)
   */
  function _imageNeedsResize(blob, maxWidth) {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(blob);
      img.onload = () => { URL.revokeObjectURL(url); resolve(img.width > maxWidth); };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(false); };
      img.src = url;
    });
  }

  /**
   * Internal: Encode raw blob via WASM Worker (no canvas roundtrip)
   */
  async function _encodeViaWorkerFromBlob(blob, mimeType, quality) {
    const wasmUrls = {
      webp: WasmManager.getWasmUrl('webp', 'webp_enc.wasm'),
      jpeg: WasmManager.getWasmUrl('jpeg', 'mozjpeg_enc.wasm'),
      webpDec: WasmManager.getWasmUrl('webp', 'webp_dec.wasm'),
      jpegDec: WasmManager.getWasmUrl('jpeg', 'mozjpeg_dec.wasm'),
      oxipng: WasmManager.getWasmUrl('oxipng', 'squoosh_oxipng_bg.wasm')
    };

    const rawBuffer = await blob.arrayBuffer();
    const taskData = {
      type: mimeType,
      rawInput: true,
      rawBuffer,
      rawMime: blob.type,
      options: { quality },
      wasmUrls
    };

    const response = await WorkerPool.runTask(taskData, [rawBuffer]);
    return {
      blob: new Blob([response.buffer], { type: response.mimeType }),
      ext: response.mimeType.split('/')[1].replace('jpeg', 'jpg'),
      mime: response.mimeType
    };
  }

  /**
   * Internal: Send task to WorkerPool
   */
  async function _encodeViaWorker(imageData, mimeType, quality) {
    const wasmUrls = {
      webp: WasmManager.getWasmUrl('webp', 'webp_enc.wasm'),
      jpeg: WasmManager.getWasmUrl('jpeg', 'mozjpeg_enc.wasm'),
      oxipng: WasmManager.getWasmUrl('oxipng', 'squoosh_oxipng_bg.wasm')
    };

    const taskData = {
      type: mimeType,
      imageData,
      options: { quality },
      wasmUrls
    };

    // Special handling for OxiPNG: needs a PNG buffer
    if (mimeType === 'image/png') {
      taskData.options.pngBuffer = await _imageDataToPngBuffer(imageData);
    }

    const response = await WorkerPool.runTask(taskData);
    
    return {
      blob: new Blob([response.buffer], { type: response.mimeType }),
      ext: response.mimeType.split('/')[1].replace('jpeg', 'jpg'),
      mime: response.mimeType
    };
  }

  /**
   * Internal: Fallback to native Canvas encoding
   */
  async function _fallbackToCanvas(imageData, mimeType, quality) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve({
          blob,
          ext: blob.type.split('/')[1].replace('jpeg', 'jpg'),
          mime: blob.type
        });
      }, mimeType, quality);
    });
  }

  /**
   * Helper: Convert ImageData to PNG ArrayBuffer via Canvas
   */
  async function _imageDataToPngBuffer(imageData) {
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx.putImageData(imageData, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        resolve(await blob.arrayBuffer());
      }, 'image/png');
    });
  }

  function _determineTargetMime(originalMime) {
    // If it's PNG or WEBP, keep it (but we'll optimize it)
    // If it's something else, default to WebP
    if (originalMime === 'image/png') return 'image/png';
    return 'image/webp';
  }

  return {
    processForPublish
  };
})();

window.ImageProcessorUtil = ImageProcessorUtil;

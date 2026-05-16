/**
 * ImageEncoderWorker (Source)
 * Purpose: CPU-intensive image encoding using jSquash (WASM)
 */

import { init as initWebp } from '@jsquash/webp/encode.js';
import encodeWebp from '@jsquash/webp/encode.js';
import { init as initJpeg } from '@jsquash/jpeg/encode.js';
import encodeJpeg from '@jsquash/jpeg/encode.js';
import { init as initOxipng } from '@jsquash/oxipng/optimise.js';
import optimiseOxipng from '@jsquash/oxipng/optimise.js';

let _isWebpInit = false;
let _isJpegInit = false;
let _isOxipngInit = false;

self.onmessage = async (event) => {
  const { id, type, imageData, options, wasmUrls } = event.data;

  try {
    let resultBuffer;
    let mimeType;

    if (type === 'image/webp') {
      if (!_isWebpInit && wasmUrls?.webp) {
        const res = await fetch(wasmUrls.webp);
        await initWebp(await res.arrayBuffer());
        _isWebpInit = true;
      }
      resultBuffer = await encodeWebp(imageData, { quality: options.quality || 0.82 });
      mimeType = 'image/webp';
    } 
    else if (type === 'image/jpeg') {
      if (!_isJpegInit && wasmUrls?.jpeg) {
        const res = await fetch(wasmUrls.jpeg);
        await initJpeg(await res.arrayBuffer());
        _isJpegInit = true;
      }
      resultBuffer = await encodeJpeg(imageData, { quality: options.quality || 0.82 });
      mimeType = 'image/jpeg';
    }
    else if (type === 'image/png') {
      if (!_isOxipngInit && wasmUrls?.oxipng) {
        const res = await fetch(wasmUrls.oxipng);
        await initOxipng(await res.arrayBuffer());
        _isOxipngInit = true;
      }
      if (options.pngBuffer) {
        resultBuffer = await optimiseOxipng(options.pngBuffer);
        mimeType = 'image/png';
      } else {
        throw new Error('OxiPNG requires pngBuffer');
      }
    }

    if (resultBuffer) {
      self.postMessage({
        id,
        success: true,
        buffer: resultBuffer,
        mimeType
      }, [resultBuffer.buffer]);
    } else {
      throw new Error(`Unsupported encoding type: ${type}`);
    }

  } catch (error) {
    self.postMessage({
      id,
      success: false,
      error: error.message
    });
  }
};

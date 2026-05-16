/**
 * ImageEncoderWorker (Source)
 * Purpose: CPU-intensive image encoding using jSquash (WASM)
 */

import { init as initWebpEnc } from '@jsquash/webp/encode.js';
import encodeWebp from '@jsquash/webp/encode.js';
import { init as initWebpDec } from '@jsquash/webp/decode.js';
import decodeWebp from '@jsquash/webp/decode.js';
import { init as initJpegEnc } from '@jsquash/jpeg/encode.js';
import encodeJpeg from '@jsquash/jpeg/encode.js';
import { init as initJpegDec } from '@jsquash/jpeg/decode.js';
import decodeJpeg from '@jsquash/jpeg/decode.js';
import { init as initOxipng } from '@jsquash/oxipng/optimise.js';
import optimiseOxipng from '@jsquash/oxipng/optimise.js';

let _isWebpEncInit = false;
let _isWebpDecInit = false;
let _isJpegEncInit = false;
let _isJpegDecInit = false;
let _isOxipngInit = false;

async function _decodeRaw(buffer, mime, wasmUrls) {
  if (mime === 'image/webp') {
    if (!_isWebpDecInit && wasmUrls?.webpDec) {
      const module = await WebAssembly.compile(await (await fetch(wasmUrls.webpDec)).arrayBuffer());
      await initWebpDec(module);
      _isWebpDecInit = true;
    }
    return decodeWebp(buffer);
  }
  if (mime === 'image/jpeg' || mime === 'image/jpg') {
    if (!_isJpegDecInit && wasmUrls?.jpegDec) {
      const module = await WebAssembly.compile(await (await fetch(wasmUrls.jpegDec)).arrayBuffer());
      await initJpegDec(module);
      _isJpegDecInit = true;
    }
    return decodeJpeg(buffer);
  }
  throw new Error(`No decoder for raw mime: ${mime}`);
}

self.onmessage = async (event) => {
  const { id, type, imageData: inputImageData, rawInput, rawBuffer, rawMime, options, wasmUrls } = event.data;

  // Decode raw blob to ImageData if needed (no-resize path)
  let imageData = inputImageData;
  if (rawInput && rawBuffer) {
    imageData = await _decodeRaw(rawBuffer, rawMime, wasmUrls);
  }

  try {
    let resultBuffer;
    let mimeType;

    if (type === 'image/webp') {
      if (!_isWebpEncInit && wasmUrls?.webp) {
        const res = await fetch(wasmUrls.webp);
        const module = await WebAssembly.compile(await res.arrayBuffer());
        await initWebpEnc(module);
        _isWebpEncInit = true;
      }
      const webpQuality = Math.round((options.quality ?? 0.85) * 100);
      resultBuffer = await encodeWebp(imageData, { quality: webpQuality });
      mimeType = 'image/webp';
    }
    else if (type === 'image/jpeg') {
      if (!_isJpegEncInit && wasmUrls?.jpeg) {
        const res = await fetch(wasmUrls.jpeg);
        const module = await WebAssembly.compile(await res.arrayBuffer());
        await initJpegEnc(module);
        _isJpegEncInit = true;
      }
      const jpegQuality = Math.round((options.quality ?? 0.82) * 100);
      resultBuffer = await encodeJpeg(imageData, { quality: jpegQuality });
      mimeType = 'image/jpeg';
    }
    else if (type === 'image/png') {
      if (!_isOxipngInit && wasmUrls?.oxipng) {
        const res = await fetch(wasmUrls.oxipng);
        const module = await WebAssembly.compile(await res.arrayBuffer());
        await initOxipng(module);
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
      }, [resultBuffer]);
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

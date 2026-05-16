/**
 * WasmManager
 * Purpose: Manages WASM asset paths and initialization for jSquash codecs.
 * Ensures consistent path resolution across Electron and Web App.
 */
const WasmManager = (() => {
  'use strict';

  const _wasmBase = '/js/lib/jsquash/wasm'; // Served by existing /js route, no restart needed

  /**
   * Get the absolute URL for a WASM asset
   * @param {string} codec - 'webp', 'jpeg', or 'oxipng'
   * @param {string} filename - name of the .wasm file
   * @returns {string}
   */
  function getWasmUrl(codec, filename) {
    // In our setup, we serve assets from /assets/
    // The ImageProcessor plan copied files to renderer/assets/wasm/
    return `${_wasmBase}/${codec}/${filename}`;
  }

  /**
   * Initialize a codec with its WASM file
   * @param {Object} module - The jSquash module (e.g., require('/jsquash/webp/index.js'))
   * @param {string} url - The URL to the WASM file
   */
  async function initCodec(module, url) {
    if (typeof module.init === 'function') {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      await module.init(buffer);
    }
  }

  return {
    getWasmUrl,
    initCodec
  };
})();

window.WasmManager = WasmManager;

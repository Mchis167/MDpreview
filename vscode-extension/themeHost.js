/* ============================================================
   themeHost.js — the VSCode side of shared/theme-kit.

   Owns the persisted accent colour and background choice, and the
   one thing a webview cannot do for itself: turn an image the user
   picked into a file the page is allowed to load.

   Uploaded backgrounds live in the extension's globalStorage, the
   same place downloaded fonts do — shared by every workspace, and
   kept out of globalState, which is meant for small values rather
   than megabytes of base64.
   ============================================================ */

const vscode = require('vscode');
const fsp = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const { decodeDataUrl } = require('./commentStoreUtil');

const ACCENT_KEY = 'mdpreview.accent';
const BACKGROUND_KEY = 'mdpreview.background';

// Matches theme-kit's own cap. Enforced here too because the webview is
// not the only thing that could call in.
const MAX_BACKGROUNDS = 5;

function createThemeHost(context) {
  const bgDir = path.join(context.globalStorageUri.fsPath, 'backgrounds');

  /** @returns {{enabled: boolean, image: string|null, images: string[]}} stored file names. */
  function getBackground() {
    const saved = context.globalState.get(BACKGROUND_KEY) || {};
    return {
      enabled: !!saved.enabled,
      image: saved.image || null,
      images: Array.isArray(saved.images) ? saved.images : []
    };
  }

  async function setBackground(patch) {
    await context.globalState.update(BACKGROUND_KEY, { ...getBackground(), ...patch });
  }

  function getAccent() {
    return context.globalState.get(ACCENT_KEY) || null;
  }

  async function setAccent(hex) {
    await context.globalState.update(ACCENT_KEY, hex || null);
    return { accent: getAccent() };
  }

  /**
   * The directory has to be in localResourceRoots or the webview blocks
   * every image in it, however correct the url is.
   */
  function resourceRoot() {
    return vscode.Uri.file(bgDir);
  }

  const fileUri = (name) => vscode.Uri.file(path.join(bgDir, name));

  /** Stored file names are meaningless to the page; it needs webview urls. */
  function toWebviewUrls(webview, names) {
    return names.map((name) => webview.asWebviewUri(fileUri(name)).toString());
  }

  /**
   * Store one pasted/selected image and return the name it was saved under.
   * @param {string} dataUrl
   * @returns {Promise<{name: string}|{error: string}>}
   */
  async function addBackground(dataUrl) {
    const stored = getBackground();
    if (stored.images.length >= MAX_BACKGROUNDS) {
      return { error: `At most ${MAX_BACKGROUNDS} images.` };
    }

    const decoded = decodeDataUrl(dataUrl);
    if (!decoded) return { error: 'That file is not an image we can store.' };

    const name = `${crypto.randomUUID()}.${decoded.ext}`;
    await fsp.mkdir(bgDir, { recursive: true });
    await fsp.writeFile(path.join(bgDir, name), decoded.bytes);

    await setBackground({ images: [...stored.images, name] });
    return { name };
  }

  /** Forget an image and delete the file behind it. */
  async function removeBackground(name) {
    const stored = getBackground();
    if (!stored.images.includes(name)) return;

    await setBackground({
      images: stored.images.filter((n) => n !== name),
      // Dropping the image that was in use leaves nothing to show.
      image: stored.image === name ? null : stored.image
    });

    try {
      await fsp.unlink(path.join(bgDir, name));
    } catch {
      // Already gone, or never written — the record is what mattered.
    }
  }

  async function selectBackground(name) {
    const stored = getBackground();
    // Only something we actually hold; null clears the choice.
    if (name !== null && !stored.images.includes(name)) return;
    await setBackground({ image: name });
  }

  async function setBackgroundEnabled(enabled) {
    await setBackground({ enabled: !!enabled });
  }

  /**
   * Everything the webview needs to paint the current theme, with file
   * names already resolved to urls it can load. Runs on open; touches no
   * network.
   */
  async function restore(webview) {
    const stored = getBackground();

    // A file removed behind the extension's back (cleared globalStorage)
    // should be forgotten rather than served as a broken url.
    const present = [];
    for (const name of stored.images) {
      try {
        await fsp.access(path.join(bgDir, name));
        present.push(name);
      } catch {
        // dropped below
      }
    }
    if (present.length !== stored.images.length) {
      await setBackground({
        images: present,
        image: present.includes(stored.image) ? stored.image : null
      });
    }

    const image = present.includes(stored.image) ? stored.image : null;
    return {
      accent: getAccent(),
      background: {
        enabled: stored.enabled,
        // Names are what the webview sends back; urls are what it renders.
        names: present,
        images: toWebviewUrls(webview, present),
        image: image ? webview.asWebviewUri(fileUri(image)).toString() : null,
        imageName: image
      }
    };
  }

  return {
    getAccent,
    setAccent,
    getBackground,
    setBackgroundEnabled,
    selectBackground,
    addBackground,
    removeBackground,
    toWebviewUrls,
    fileUri,
    resourceRoot,
    restore,
    bgDir
  };
}

module.exports = { createThemeHost, MAX_BACKGROUNDS, ACCENT_KEY, BACKGROUND_KEY };

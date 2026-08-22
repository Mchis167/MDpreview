import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// fontHost requires `vscode`, which only exists inside an extension host.
const { installVscodeStub } = require('./stubs/vscode.cjs');
const { Uri } = installVscodeStub();
const { createFontHost, WEIGHT_VAR } = require('../vscode-extension/fontHost.js');

let storage;
let context;
let host;

/** Just enough ExtensionContext for fontHost: globalState + globalStorageUri. */
function makeContext(dir) {
  const state = new Map();
  return {
    globalStorageUri: { fsPath: dir },
    globalState: {
      get: (key) => state.get(key),
      update: async (key, value) => void state.set(key, value)
    }
  };
}

const webview = { asWebviewUri: (uri) => ({ toString: () => `webview://${uri.fsPath}` }) };

beforeEach(() => {
  storage = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-fonthost-')));
  context = makeContext(storage);
  host = createFontHost(context);
});

afterEach(() => {
  fs.rmSync(storage, { recursive: true, force: true });
  vi.unstubAllGlobals();
});

describe('getWeightState', () => {
  it('starts every role with nothing available and no override', () => {
    expect(host.getWeightState()).toEqual({
      title: { available: [], selected: null },
      body: { available: [], selected: null },
      code: { available: [], selected: null }
    });
  });
});

describe('setWeight', () => {
  it('refuses a weight that was never installed for the role', async () => {
    await expect(host.setWeight('body', '700')).rejects.toThrow(/not installed/);
    expect(host.getWeightState().body.selected).toBeNull();
  });

  it('accepts a weight once it is in the available list', async () => {
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: [], selected: null },
      body: { available: ['400', '700'], selected: null },
      code: { available: [], selected: null }
    });

    await host.setWeight('body', '700');

    expect(host.getWeightState().body.selected).toBe('700');
  });

  it('clears back to the hierarchy default on null or empty string', async () => {
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: [], selected: null },
      body: { available: ['400', '700'], selected: '700' },
      code: { available: [], selected: null }
    });

    await host.setWeight('body', '');
    expect(host.getWeightState().body.selected).toBeNull();

    await host.setWeight('body', '700');
    await host.setWeight('body', null);
    expect(host.getWeightState().body.selected).toBeNull();
  });

  it('rejects a role no CSS variable exists for', async () => {
    await expect(host.setWeight('nope', '400')).rejects.toThrow(/Unknown font role/);
  });
});

describe('apply(role, null, ...) — reset to system default', () => {
  it('clears the weight state without touching the network', async () => {
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: [], selected: null },
      body: { available: ['400', '700'], selected: '700' },
      code: { available: [], selected: null }
    });
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await host.apply('body', null, webview);

    expect(host.getWeightState().body).toEqual({ available: [], selected: null });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('apply(role, family, ...) — installing a font', () => {
  const FAMILY = 'Demo Sans';
  // The family only ships 400 and 700; fontHost asks for 400/600/700 for
  // body — this is what proves the narrowing to what the font actually has.
  const CSS2 = `
/* latin */
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/demo-400.woff2) format('woff2');
}
/* latin */
@font-face {
  font-family: '${FAMILY}';
  font-style: normal;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/demo-700.woff2) format('woff2');
}`;

  function stubNetwork() {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url) => {
        if (String(url).includes('fonts.google.com/metadata/fonts')) {
          return {
            ok: true,
            json: async () => ({
              familyMetadataList: [{ family: FAMILY, category: 'Sans Serif', fonts: { 400: {}, 700: {} } }]
            })
          };
        }
        if (String(url).includes('fonts.googleapis.com/css2')) {
          return { ok: true, text: async () => CSS2 };
        }
        // Any gstatic woff2 fetch.
        return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) };
      })
    );
  }

  it('persists exactly the weights the font ships, not the full wishlist', async () => {
    stubNetwork();

    const result = await host.apply('body', FAMILY, webview);

    expect(result.weights).toEqual(['400', '700']);
    expect(host.getWeightState().body).toEqual({ available: ['400', '700'], selected: null });
  });

  it('resets a previous weight choice when the font itself changes', async () => {
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: [], selected: null },
      body: { available: ['400', '600', '700'], selected: '600' },
      code: { available: [], selected: null }
    });
    stubNetwork();

    await host.apply('body', FAMILY, webview);

    expect(host.getWeightState().body.selected).toBeNull();
  });
});

describe('restore', () => {
  it('reports the persisted weight state alongside the CSS variable names', async () => {
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: [], selected: null },
      body: { available: ['400', '700'], selected: '700' },
      code: { available: [], selected: null }
    });

    const restored = await host.restore(webview);

    expect(restored.weights.body).toEqual({ available: ['400', '700'], selected: '700' });
    expect(restored.weightVars).toEqual(WEIGHT_VAR);
  });

  it('forgets a role\'s weight choice along with the font when its cache is gone', async () => {
    // No family was ever actually installed, but weight state claims one —
    // the state a stale globalStorage wipe would leave behind.
    await context.globalState.update('mdpreview.fonts', { title: 'Ghost Font', body: null, code: null });
    await context.globalState.update('mdpreview.fontWeights', {
      title: { available: ['400', '700'], selected: '700' },
      body: { available: [], selected: null },
      code: { available: [], selected: null }
    });

    const restored = await host.restore(webview);

    expect(restored.fonts.title).toBeNull();
    expect(restored.weights.title).toEqual({ available: [], selected: null });
    // Persisted, not just filtered for this one answer.
    expect(host.getWeightState().title).toEqual({ available: [], selected: null });
  });

  it('reports an empty, unweighted state on a fresh install', async () => {
    const restored = await host.restore(webview);
    expect(restored.weights).toEqual({
      title: { available: [], selected: null },
      body: { available: [], selected: null },
      code: { available: [], selected: null }
    });
  });
});

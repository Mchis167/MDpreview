import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// themeHost requires `vscode`, which only exists inside an extension host.
const { installVscodeStub } = require('./stubs/vscode.cjs');
installVscodeStub();
const { createThemeHost, MAX_BACKGROUNDS } = require('../vscode-extension/themeHost.js');

let storage;
let host;
let state;

/** Just enough ExtensionContext for themeHost: globalState + globalStorageUri. */
function makeContext(dir) {
  state = new Map();
  return {
    globalStorageUri: { fsPath: dir },
    globalState: {
      get: (key) => state.get(key),
      update: async (key, value) => void state.set(key, value)
    }
  };
}

// asWebviewUri is the one webview method themeHost uses.
const webview = { asWebviewUri: (uri) => ({ toString: () => `webview://${uri.fsPath}` }) };

const png = (text) => `data:image/png;base64,${Buffer.from(text).toString('base64')}`;
const bgFile = (name) => path.join(storage, 'backgrounds', name);

beforeEach(() => {
  storage = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-theme-')));
  host = createThemeHost(makeContext(storage));
});

afterEach(() => {
  fs.rmSync(storage, { recursive: true, force: true });
});

describe('accent', () => {
  it('starts with nothing chosen', () => {
    expect(host.getAccent()).toBeNull();
  });

  it('remembers a colour and hands it back', async () => {
    await host.setAccent('#1E90FF');
    expect(host.getAccent()).toBe('#1E90FF');
  });

  it('clears back to nothing', async () => {
    await host.setAccent('#1E90FF');
    await host.setAccent(null);
    expect(host.getAccent()).toBeNull();
  });
});

describe('addBackground', () => {
  it('writes the image to globalStorage rather than into globalState', async () => {
    const { name } = await host.addBackground(png('pixels'));

    expect(name).toMatch(/\.png$/);
    expect(fs.readFileSync(bgFile(name), 'utf8')).toBe('pixels');
    // Only the file name is stored; the bytes stay on disk.
    expect(JSON.stringify(state.get('mdpreview.background'))).not.toContain('pixels');
  });

  it('keeps every image added, in order', async () => {
    const a = await host.addBackground(png('one'));
    const b = await host.addBackground(png('two'));

    expect(host.getBackground().images).toEqual([a.name, b.name]);
  });

  it('refuses anything that is not an image we can store', async () => {
    const res = await host.addBackground('data:text/plain;base64,aGk=');

    expect(res.error).toBeTruthy();
    expect(host.getBackground().images).toEqual([]);
  });

  it('stops at the cap and says so', async () => {
    for (let i = 0; i < MAX_BACKGROUNDS; i++) await host.addBackground(png(`i${i}`));

    const res = await host.addBackground(png('one-too-many'));

    expect(res.error).toContain(String(MAX_BACKGROUNDS));
    expect(host.getBackground().images).toHaveLength(MAX_BACKGROUNDS);
  });
});

describe('removeBackground', () => {
  it('forgets the image and deletes the file behind it', async () => {
    const { name } = await host.addBackground(png('one'));

    await host.removeBackground(name);

    expect(host.getBackground().images).toEqual([]);
    expect(fs.existsSync(bgFile(name))).toBe(false);
  });

  it('clears the selection when the image in use is removed', async () => {
    const { name } = await host.addBackground(png('one'));
    await host.selectBackground(name);

    await host.removeBackground(name);

    expect(host.getBackground().image).toBeNull();
  });

  it('leaves a different selection alone', async () => {
    const a = await host.addBackground(png('one'));
    const b = await host.addBackground(png('two'));
    await host.selectBackground(b.name);

    await host.removeBackground(a.name);

    expect(host.getBackground().image).toBe(b.name);
  });

  it('ignores a name it does not hold', async () => {
    const { name } = await host.addBackground(png('one'));
    await host.removeBackground('not-ours.png');
    expect(host.getBackground().images).toEqual([name]);
  });

  it('frees a slot again', async () => {
    const names = [];
    for (let i = 0; i < MAX_BACKGROUNDS; i++) {
      names.push((await host.addBackground(png(`i${i}`))).name);
    }
    await host.removeBackground(names[0]);

    expect((await host.addBackground(png('new'))).name).toBeTruthy();
  });
});

describe('selectBackground', () => {
  it('only accepts an image it actually holds', async () => {
    await host.selectBackground('made-up.png');
    expect(host.getBackground().image).toBeNull();
  });

  it('accepts null to clear the choice', async () => {
    const { name } = await host.addBackground(png('one'));
    await host.selectBackground(name);
    await host.selectBackground(null);

    expect(host.getBackground().image).toBeNull();
  });
});

describe('restore', () => {
  it('resolves stored names into urls the webview can load', async () => {
    await host.setAccent('#FF4500');
    const { name } = await host.addBackground(png('one'));
    await host.selectBackground(name);
    await host.setBackgroundEnabled(true);

    const restored = await host.restore(webview);

    expect(restored.accent).toBe('#FF4500');
    expect(restored.background.enabled).toBe(true);
    expect(restored.background.names).toEqual([name]);
    expect(restored.background.images[0]).toBe(`webview://${bgFile(name)}`);
    expect(restored.background.image).toBe(`webview://${bgFile(name)}`);
    expect(restored.background.imageName).toBe(name);
  });

  it('forgets images whose files vanished, instead of serving broken urls', async () => {
    const a = await host.addBackground(png('one'));
    const b = await host.addBackground(png('two'));
    await host.selectBackground(a.name);
    // Simulate the user clearing globalStorage behind the extension's back.
    fs.unlinkSync(bgFile(a.name));

    const restored = await host.restore(webview);

    expect(restored.background.names).toEqual([b.name]);
    expect(restored.background.image).toBeNull();
    // The pruning is persisted, not just filtered for this one answer.
    expect(host.getBackground().images).toEqual([b.name]);
  });

  it('reports an empty, disabled background on a fresh install', async () => {
    const restored = await host.restore(webview);

    expect(restored.accent).toBeNull();
    expect(restored.background).toMatchObject({ enabled: false, names: [], images: [], image: null });
  });
});

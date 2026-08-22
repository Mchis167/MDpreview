import { describe, it, expect, vi } from 'vitest';
const { createInstaller, buildCss2Url, familySlug } = require('../shared/font-kit/installer.js');

const REMOTE_CSS = `/* vietnamese */
@font-face {
  font-family: 'Lexend';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/lexend/v26/aaa.woff2) format('woff2');
  unicode-range: U+1EA0-1EF9;
}
/* latin */
@font-face {
  font-family: 'Lexend';
  font-style: normal;
  font-weight: 700;
  src: url(https://fonts.gstatic.com/s/lexend/v26/bbb.woff2) format('woff2');
  unicode-range: U+0000-00FF;
}
`;

/** In-memory stand-in for the host's filesystem. */
function memoryFs(seed = {}) {
  const files = { ...seed };
  return {
    files,
    async exists(p) {
      return Object.prototype.hasOwnProperty.call(files, p);
    },
    async readFile(p) {
      return files[p];
    },
    async writeFile(p, data) {
      files[p] = data;
    },
    async mkdir() {}
  };
}

function makeInstaller(overrides = {}) {
  const fs = overrides.fs || memoryFs();
  const fetchText = overrides.fetchText || vi.fn(async () => REMOTE_CSS);
  const fetchBinary = overrides.fetchBinary || vi.fn(async (url) => Buffer.from(`bytes:${url}`));

  const installer = createInstaller({
    fs,
    fetchText,
    fetchBinary,
    cacheDir: '/cache',
    join: (...parts) => parts.join('/'),
    toUrl: (p) => `webview://${p}`
  });

  return { installer, fs, fetchText, fetchBinary };
}

describe('font-kit/installer buildCss2Url', () => {
  it('percent-encodes the family and joins weights with semicolons', () => {
    expect(buildCss2Url('Plus Jakarta Sans', ['400', '600', '700']))
      .toBe('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
  });

  it('omits the wght axis when no weights are given', () => {
    expect(buildCss2Url('Caveat', []))
      .toBe('https://fonts.googleapis.com/css2?family=Caveat&display=swap');
  });
});

describe('font-kit/installer familySlug', () => {
  it('produces a filesystem-safe name', () => {
    expect(familySlug('Plus Jakarta Sans')).toBe('plus-jakarta-sans');
    expect(familySlug('Noto Sans JP')).toBe('noto-sans-jp');
  });

  it('does not let a crafted family name escape the cache directory', () => {
    expect(familySlug('../../etc/passwd')).toBe('etc-passwd');
  });
});

describe('font-kit/installer install', () => {
  it('downloads every woff2 the stylesheet references', async () => {
    const { installer, fetchBinary } = makeInstaller();
    await installer.install('Lexend', ['400', '700']);

    expect(fetchBinary).toHaveBeenCalledTimes(2);
    expect(fetchBinary.mock.calls.map((c) => c[0])).toEqual([
      'https://fonts.gstatic.com/s/lexend/v26/aaa.woff2',
      'https://fonts.gstatic.com/s/lexend/v26/bbb.woff2'
    ]);
  });

  it('returns css whose src points at local files, not gstatic', async () => {
    const { installer } = makeInstaller();
    const result = await installer.install('Lexend', ['400', '700']);

    expect(result.css).not.toContain('gstatic.com');
    expect(result.css).toContain('url(webview:///cache/lexend/');
    expect(result.family).toBe('Lexend');
  });

  it('keeps the vietnamese subset — this app is used to write Vietnamese', async () => {
    const { installer } = makeInstaller();
    const result = await installer.install('Lexend', ['400', '700']);
    expect(result.css).toContain('U+1EA0-1EF9');
  });

  it('writes the rewritten css to the cache so later runs need no network', async () => {
    const { installer, fs } = makeInstaller();
    await installer.install('Lexend', ['400', '700']);
    expect(fs.files['/cache/lexend/font.css']).toContain('@font-face');
  });

  it('stores plain file paths on disk, never host urls', async () => {
    // A webview url carries a per-session authority. Baking one into the
    // cached stylesheet would leave the next session pointing at a dead
    // origin, so toUrl must only ever run on the way out.
    const { installer, fs } = makeInstaller();
    await installer.install('Lexend', ['400', '700']);

    expect(fs.files['/cache/lexend/font.css']).not.toContain('webview://');
    expect(fs.files['/cache/lexend/font.css']).toContain('url(/cache/lexend/0-aaa.woff2)');
  });

  it('applies the current host url when reading an already-installed font', async () => {
    const fs = memoryFs();
    const { installer } = makeInstaller({ fs });
    await installer.install('Lexend', ['400', '700']);

    // A later session: same cache, a different webview origin.
    const next = createInstaller({
      fs,
      fetchText: async () => {
        throw new Error('must not hit the network');
      },
      fetchBinary: async () => {
        throw new Error('must not hit the network');
      },
      cacheDir: '/cache',
      join: (...parts) => parts.join('/'),
      toUrl: (p) => `vscode-webview://SECOND-SESSION${p}`
    });

    const css = await next.readInstalled('Lexend');
    expect(css).toContain('url(vscode-webview://SECOND-SESSION/cache/lexend/0-aaa.woff2)');
    expect(css).not.toContain('webview:///cache');
  });

  it('returns null from readInstalled for a font that is not cached', async () => {
    const { installer } = makeInstaller();
    expect(await installer.readInstalled('Lexend')).toBeNull();
  });

  it('serves a second install of the same family from cache, without fetching', async () => {
    const { installer, fetchText, fetchBinary } = makeInstaller();
    const first = await installer.install('Lexend', ['400', '700']);
    fetchText.mockClear();
    fetchBinary.mockClear();

    const second = await installer.install('Lexend', ['400', '700']);

    expect(fetchText).not.toHaveBeenCalled();
    expect(fetchBinary).not.toHaveBeenCalled();
    expect(second.css).toBe(first.css);
    expect(second.cached).toBe(true);
  });

  it('refetches when the requested weights differ from the cached ones', async () => {
    const { installer, fetchText } = makeInstaller();
    await installer.install('Lexend', ['400']);
    fetchText.mockClear();

    await installer.install('Lexend', ['400', '700']);
    expect(fetchText).toHaveBeenCalledTimes(1);
  });

  it('reports the family as installed once it is in the cache', async () => {
    const { installer } = makeInstaller();
    expect(await installer.isInstalled('Lexend')).toBe(false);
    await installer.install('Lexend', ['400']);
    expect(await installer.isInstalled('Lexend')).toBe(true);
  });

  it('surfaces a network failure instead of caching a broken stylesheet', async () => {
    const { installer, fs } = makeInstaller({
      fetchText: vi.fn(async () => {
        throw new Error('offline');
      })
    });

    await expect(installer.install('Lexend', ['400'])).rejects.toThrow('offline');
    expect(fs.files['/cache/lexend/font.css']).toBeUndefined();
  });

  it('does not write a stylesheet when a woff2 download fails midway', async () => {
    const { installer, fs } = makeInstaller({
      fetchBinary: vi.fn(async (url) => {
        if (url.endsWith('bbb.woff2')) throw new Error('connection reset');
        return Buffer.from('ok');
      })
    });

    await expect(installer.install('Lexend', ['400', '700'])).rejects.toThrow('connection reset');
    expect(fs.files['/cache/lexend/font.css']).toBeUndefined();
  });
});

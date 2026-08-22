import { describe, it, expect } from 'vitest';
const { parseFontFaces, collectUrls, rewriteUrls } = require('../shared/font-kit/css2.js');

/**
 * Sample trimmed from a real response of
 *   https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap
 * sent with a browser User-Agent (that UA is what makes Google serve woff2
 * rather than the ttf it hands to unknown clients).
 */
const LEXEND_CSS = `/* vietnamese */
@font-face {
  font-family: 'Lexend';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v9KQU4Wc.woff2) format('woff2');
  unicode-range: U+0102-0103, U+0110-0111, U+1EA0-1EF9, U+20AB;
}
/* latin */
@font-face {
  font-family: 'Lexend';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v96QU4Q.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+2000-206F;
}
/* latin */
@font-face {
  font-family: 'Lexend';
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url(https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v96QU4B.woff2) format('woff2');
  unicode-range: U+0000-00FF, U+0131, U+2000-206F;
}
`;

describe('font-kit/css2 parseFontFaces', () => {
  it('returns one entry per @font-face block', () => {
    expect(parseFontFaces(LEXEND_CSS)).toHaveLength(3);
  });

  it('extracts family, weight, style and url', () => {
    const [first] = parseFontFaces(LEXEND_CSS);
    expect(first.family).toBe('Lexend');
    expect(first.weight).toBe('400');
    expect(first.style).toBe('normal');
    expect(first.url).toBe('https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v9KQU4Wc.woff2');
  });

  it('attributes each block to the subset named in the comment above it', () => {
    // The Vietnamese subset is the reason we keep every block rather than
    // filtering to latin: this app is used to write Vietnamese.
    expect(parseFontFaces(LEXEND_CSS).map((f) => f.subset))
      .toEqual(['vietnamese', 'latin', 'latin']);
  });

  it('reports the subset as null when no comment precedes the block', () => {
    const css = "@font-face { font-family: 'X'; src: url(https://e.com/x.woff2) format('woff2'); }";
    expect(parseFontFaces(css)[0].subset).toBeNull();
  });

  it('returns an empty array for css with no @font-face', () => {
    expect(parseFontFaces('/* nothing here */')).toEqual([]);
  });

  it('tolerates quoted urls', () => {
    const css = `@font-face { font-family: "X"; src: url("https://e.com/x.woff2") format('woff2'); }`;
    expect(parseFontFaces(css)[0].url).toBe('https://e.com/x.woff2');
    expect(parseFontFaces(css)[0].family).toBe('X');
  });
});

describe('font-kit/css2 collectUrls', () => {
  it('lists every distinct remote url once, in order', () => {
    expect(collectUrls(LEXEND_CSS)).toEqual([
      'https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v9KQU4Wc.woff2',
      'https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v96QU4Q.woff2',
      'https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v96QU4B.woff2'
    ]);
  });

  it('does not repeat a url shared by two blocks', () => {
    const css = `
      @font-face { src: url(https://e.com/a.woff2) format('woff2'); }
      @font-face { src: url(https://e.com/a.woff2) format('woff2'); }
    `;
    expect(collectUrls(css)).toEqual(['https://e.com/a.woff2']);
  });
});

describe('font-kit/css2 rewriteUrls', () => {
  it('swaps every mapped url for its local counterpart', () => {
    const urls = collectUrls(LEXEND_CSS);
    const map = Object.fromEntries(urls.map((u, i) => [u, `vscode-webview://host/fonts/f${i}.woff2`]));
    const out = rewriteUrls(LEXEND_CSS, map);

    expect(out).not.toContain('fonts.gstatic.com');
    expect(out).toContain('url(vscode-webview://host/fonts/f0.woff2)');
    expect(out).toContain('url(vscode-webview://host/fonts/f2.woff2)');
  });

  it('preserves everything around the url, including unicode-range', () => {
    const out = rewriteUrls(LEXEND_CSS, {
      'https://fonts.gstatic.com/s/lexend/v26/wlpwgwvFAVdoq2_v9KQU4Wc.woff2': 'local://a.woff2'
    });
    expect(out).toContain('U+1EA0-1EF9');
    expect(out).toContain("format('woff2')");
    expect(out).toContain("font-family: 'Lexend'");
  });

  it('leaves an unmapped url untouched rather than emitting url(undefined)', () => {
    const out = rewriteUrls(LEXEND_CSS, {});
    expect(out).toBe(LEXEND_CSS);
  });
});

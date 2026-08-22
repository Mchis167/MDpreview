import { describe, it, expect } from 'vitest';

const util = require('../vscode-extension/commentStoreUtil.js');
const { normalizeTag, decodeDataUrl, assetRelPath, imagePathsOf, pruneDirs, ensureIgnoreLine } = util;

describe('normalizeTag', () => {
  it('accepts the three known tags, case-insensitively', () => {
    expect(normalizeTag('bug')).toBe('bug');
    expect(normalizeTag('Enhancement')).toBe('enhancement');
    expect(normalizeTag('  COMMENT ')).toBe('comment');
  });

  it('rejects anything else', () => {
    expect(normalizeTag('feature')).toBeNull();
    expect(normalizeTag('')).toBeNull();
    expect(normalizeTag(undefined)).toBeNull();
    expect(normalizeTag(7)).toBeNull();
  });
});

describe('decodeDataUrl', () => {
  const png = 'data:image/png;base64,' + Buffer.from('fake-png').toString('base64');

  it('decodes a base64 image data URL into bytes plus an extension', () => {
    const out = decodeDataUrl(png);
    expect(out.ext).toBe('png');
    expect(out.bytes.toString()).toBe('fake-png');
  });

  it('maps jpeg to a .jpg extension', () => {
    const jpeg = 'data:image/jpeg;base64,' + Buffer.from('x').toString('base64');
    expect(decodeDataUrl(jpeg).ext).toBe('jpg');
  });

  it('refuses non-images, unknown mime types, and empty payloads', () => {
    expect(decodeDataUrl('data:text/plain;base64,aGk=')).toBeNull();
    expect(decodeDataUrl('data:image/tiff;base64,aGk=')).toBeNull();
    expect(decodeDataUrl('data:image/png;base64,')).toBeNull();
    expect(decodeDataUrl('https://example.com/a.png')).toBeNull();
    expect(decodeDataUrl(null)).toBeNull();
  });
});

describe('assetRelPath', () => {
  it('names an image after its comment and position', () => {
    expect(assetRelPath('abc123', 2, 'png')).toBe('assets/abc123-2.png');
  });
});

describe('imagePathsOf', () => {
  it('returns the assets/ entries a comment owns', () => {
    const c = { images: ['assets/a-1.png', 'assets/a-2.jpg'] };
    expect(imagePathsOf(c)).toEqual(['assets/a-1.png', 'assets/a-2.jpg']);
  });

  it('is empty when there are no images', () => {
    expect(imagePathsOf({})).toEqual([]);
    expect(imagePathsOf({ images: 'assets/a.png' })).toEqual([]);
    expect(imagePathsOf(null)).toEqual([]);
  });

  it('drops anything that could point outside assets/', () => {
    const c = {
      images: [
        '../../../etc/passwd',
        'assets/../../secret.json',
        '/etc/passwd',
        'assets/sub/dir.png',
        'docs/a.png',
        'assets/',
        'assets/ok.png'
      ]
    };
    expect(imagePathsOf(c)).toEqual(['assets/ok.png']);
  });
});

describe('pruneDirs', () => {
  it('lists parents deepest-first, stopping at .mdpreview', () => {
    expect(pruneDirs('.mdpreview/comments/docs/deep/plan.md.json')).toEqual([
      '.mdpreview/comments/docs/deep',
      '.mdpreview/comments/docs',
      '.mdpreview/comments',
      '.mdpreview'
    ]);
  });

  it('handles a file sitting directly in the comments dir', () => {
    expect(pruneDirs('.mdpreview/comments/plan.md.json')).toEqual([
      '.mdpreview/comments',
      '.mdpreview'
    ]);
  });

  it('covers the archive and assets subtrees too', () => {
    expect(pruneDirs('.mdpreview/comments/.archive/docs/plan.md.json')).toEqual([
      '.mdpreview/comments/.archive/docs',
      '.mdpreview/comments/.archive',
      '.mdpreview/comments',
      '.mdpreview'
    ]);
    expect(pruneDirs('.mdpreview/comments/assets/abc-1.png')).toEqual([
      '.mdpreview/comments/assets',
      '.mdpreview/comments',
      '.mdpreview'
    ]);
  });

  it('never proposes a directory outside .mdpreview', () => {
    expect(pruneDirs('docs/plan.md')).toEqual([]);
    expect(pruneDirs('../.mdpreview/comments/a.json')).toEqual([]);
    expect(pruneDirs('.mdpreview/../src/index.js')).toEqual([]);
    expect(pruneDirs('')).toEqual([]);
    expect(pruneDirs(undefined)).toEqual([]);
  });
});

describe('ensureIgnoreLine', () => {
  it('creates the entry when there is no .gitignore yet', () => {
    expect(ensureIgnoreLine('')).toBe('.mdpreview/\n');
    expect(ensureIgnoreLine(undefined)).toBe('.mdpreview/\n');
  });

  it('appends to an existing file, keeping it newline-terminated', () => {
    expect(ensureIgnoreLine('node_modules\n')).toBe('node_modules\n.mdpreview/\n');
    expect(ensureIgnoreLine('node_modules')).toBe('node_modules\n.mdpreview/\n');
  });

  it('does nothing when the folder is already ignored, however it was written', () => {
    expect(ensureIgnoreLine('.mdpreview/\n')).toBeNull();
    expect(ensureIgnoreLine('.mdpreview\n')).toBeNull();
    expect(ensureIgnoreLine('/.mdpreview/\n')).toBeNull();
    expect(ensureIgnoreLine('node_modules\n  .mdpreview/  \ndist\n')).toBeNull();
  });

  it('is not fooled by a longer path that merely starts the same', () => {
    expect(ensureIgnoreLine('.mdpreviewer/\n')).toBe('.mdpreviewer/\n.mdpreview/\n');
    expect(ensureIgnoreLine('.mdpreview/comments\n')).toBe('.mdpreview/comments\n.mdpreview/\n');
  });
});

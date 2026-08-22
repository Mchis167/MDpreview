import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const nodeRequire = createRequire(import.meta.url);

// takeover.js requires 'vscode', which only exists inside the extension host.
// Stub it out at the module-resolution level so the pure guard can be tested.
const Module = nodeRequire('module');
const STUB_ID = 'vscode-stub';
const originalResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request === 'vscode') return STUB_ID;
  return originalResolve.call(this, request, ...rest);
};
nodeRequire.cache[STUB_ID] = {
  id: STUB_ID,
  filename: STUB_ID,
  loaded: true,
  exports: { TabInputText: class TabInputText {} }
};

const { isTakeoverUri } = nodeRequire('../vscode-extension/takeover.js');

const uri = (scheme, path) => ({ scheme, path, toString: () => `${scheme}://${path}` });

describe('isTakeoverUri', () => {
  it('takes over a markdown file on disk', () => {
    expect(isTakeoverUri(uri('file', '/repo/README.md'))).toBe(true);
  });

  it('is case-insensitive about the extension', () => {
    expect(isTakeoverUri(uri('file', '/repo/README.MD'))).toBe(true);
  });

  it('ignores non-markdown files', () => {
    expect(isTakeoverUri(uri('file', '/repo/index.js'))).toBe(false);
    expect(isTakeoverUri(uri('file', '/repo/notes.markdown'))).toBe(false);
  });

  it('ignores virtual documents that merely look like markdown', () => {
    // Claude Code's proposed-edit panes, git's index view, unsaved buffers.
    expect(isTakeoverUri(uri('claude-code-temp', '/SKILL.md'))).toBe(false);
    expect(isTakeoverUri(uri('git', '/repo/README.md'))).toBe(false);
    expect(isTakeoverUri(uri('untitled', '/Untitled-1.md'))).toBe(false);
  });

  it('leaves excluded URIs alone', () => {
    const target = uri('file', '/repo/README.md');
    expect(isTakeoverUri(target, { excluded: ['file:///repo/README.md'] })).toBe(false);
  });

  it('tolerates a missing uri', () => {
    expect(isTakeoverUri(undefined)).toBe(false);
  });
});

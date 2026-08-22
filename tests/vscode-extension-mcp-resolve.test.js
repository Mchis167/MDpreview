import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';
const { createMcpBridge } = require('../vscode-extension/mcpServer.js');

/**
 * Locks in the cross-repo fix: with several workspace folders visible to one
 * bridge, a relative path used to match the FIRST folder unconditionally —
 * Claude running in repo B would read (and consume) repo A's comments.
 */

let tmpA, tmpB;

function bridgeWith(folders) {
  return createMcpBridge({ getWorkspaceFolders: () => folders });
}

beforeEach(() => {
  tmpA = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-a-'));
  tmpB = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-b-'));
});

afterEach(() => {
  fs.rmSync(tmpA, { recursive: true, force: true });
  fs.rmSync(tmpB, { recursive: true, force: true });
});

describe('mcp resolveCommentsFile across folders', () => {
  it('resolves a relative path to the folder where the file actually exists', () => {
    fs.writeFileSync(path.join(tmpB, 'plan.md'), '# b');
    const { resolveCommentsFile } = bridgeWith([
      { name: 'A', fsPath: tmpA },
      { name: 'B', fsPath: tmpB }
    ]);

    // The old code returned tmpA here — first prefix match, file or no file.
    expect(resolveCommentsFile('plan.md').root).toBe(tmpB);
  });

  it('also matches a folder that only has a comment store for the file', () => {
    // The .md itself may be gone (deleted after review) while comments remain.
    const store = path.join(tmpB, '.mdpreview', 'comments');
    fs.mkdirSync(store, { recursive: true });
    fs.writeFileSync(path.join(store, 'plan.md.json'), '[]');

    const { resolveCommentsFile } = bridgeWith([
      { name: 'A', fsPath: tmpA },
      { name: 'B', fsPath: tmpB }
    ]);
    expect(resolveCommentsFile('plan.md').root).toBe(tmpB);
  });

  it('refuses to guess when the file exists in both folders', () => {
    fs.writeFileSync(path.join(tmpA, 'plan.md'), '# a');
    fs.writeFileSync(path.join(tmpB, 'plan.md'), '# b');

    const { resolveCommentsFile } = bridgeWith([
      { name: 'A', fsPath: tmpA },
      { name: 'B', fsPath: tmpB }
    ]);
    const loc = resolveCommentsFile('plan.md');
    expect(loc.ambiguous).toEqual([path.join(tmpA, 'plan.md'), path.join(tmpB, 'plan.md')]);
  });

  it('returns null when the file exists nowhere', () => {
    const { resolveCommentsFile } = bridgeWith([{ name: 'A', fsPath: tmpA }]);
    expect(resolveCommentsFile('ghost.md')).toBeNull();
  });

  it('still resolves absolute paths by prefix, unambiguously', () => {
    const { resolveCommentsFile } = bridgeWith([
      { name: 'A', fsPath: tmpA },
      { name: 'B', fsPath: tmpB }
    ]);
    const loc = resolveCommentsFile(path.join(tmpB, 'ARCHITECTURE.md'));
    expect(loc.root).toBe(tmpB);
    expect(loc.rel).toBe('ARCHITECTURE.md');
  });

  it('rejects an absolute path outside every folder', () => {
    const { resolveCommentsFile } = bridgeWith([{ name: 'A', fsPath: tmpA }]);
    expect(resolveCommentsFile('/etc/passwd')).toBeNull();
  });

  it('blocks ../ escapes in relative paths', () => {
    fs.writeFileSync(path.join(tmpA, 'secret.md'), 'x');
    const { resolveCommentsFile } = bridgeWith([{ name: 'B', fsPath: tmpB }]);
    const rel = path.relative(tmpB, path.join(tmpA, 'secret.md'));
    expect(rel.startsWith('..')).toBe(true);
    expect(resolveCommentsFile(rel)).toBeNull();
  });
});

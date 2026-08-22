import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const server = require('../vscode-extension/mcpStdioServer.js');
const { findRoot, resolveTarget, readPending, resolveComments, listPending, handleMessage } = server;

let tmp;

/** Build a directory tree from a {path: contents} map. */
function tree(spec) {
  for (const [rel, body] of Object.entries(spec)) {
    const abs = path.join(tmp, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
}

beforeEach(() => {
  // realpath: macOS hands out /var/... symlinks into /private/var, and the
  // server resolves paths, so the two must be compared on equal footing.
  tmp = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-stdio-')));
});

afterEach(() => {
  fs.rmSync(tmp, { recursive: true, force: true });
});

describe('findRoot', () => {
  it('walks up to the directory holding the comment store', () => {
    tree({
      'repo/.mdpreview/comments/keep.json': '[]',
      'repo/docs/deep/plan.md': '# plan'
    });
    expect(findRoot(path.join(tmp, 'repo/docs/deep'))).toBe(path.join(tmp, 'repo'));
  });

  it('falls back to the git root when no comment store exists yet', () => {
    tree({ 'repo/.git/HEAD': 'ref: refs/heads/main', 'repo/docs/plan.md': '# plan' });
    expect(findRoot(path.join(tmp, 'repo/docs'))).toBe(path.join(tmp, 'repo'));
  });

  it('prefers the comment store over an outer git root', () => {
    // A repo inside a repo: comments belong to the inner one.
    tree({
      'outer/.git/HEAD': 'ref: x',
      'outer/inner/.mdpreview/comments/x.json': '[]',
      'outer/inner/plan.md': '# p'
    });
    expect(findRoot(path.join(tmp, 'outer/inner'))).toBe(path.join(tmp, 'outer/inner'));
  });

  it('returns null when neither marker is found', () => {
    tree({ 'loose/plan.md': '# p' });
    expect(findRoot(path.join(tmp, 'loose'))).toBeNull();
  });
});

describe('resolveTarget', () => {
  it('resolves a relative path against the process cwd, not a folder list', () => {
    // This is what kills the cross-repo bleed: scope comes from where the
    // file is, so two repos can never resolve to each other.
    tree({ 'repo/.git/HEAD': 'x', 'repo/docs/plan.md': '# p' });
    const loc = resolveTarget('docs/plan.md', path.join(tmp, 'repo'));

    expect(loc.root).toBe(path.join(tmp, 'repo'));
    expect(loc.rel).toBe('docs/plan.md');
    expect(loc.commentsPath).toBe(path.join(tmp, 'repo/.mdpreview/comments/docs/plan.md.json'));
    expect(loc.archivePath).toBe(path.join(tmp, 'repo/.mdpreview/comments/.archive/docs/plan.md.json'));
  });

  it('resolves an absolute path regardless of cwd', () => {
    tree({ 'repo/.git/HEAD': 'x', 'repo/plan.md': '# p' });
    const loc = resolveTarget(path.join(tmp, 'repo/plan.md'), '/somewhere/else');
    expect(loc.root).toBe(path.join(tmp, 'repo'));
    expect(loc.rel).toBe('plan.md');
  });

  it('reports an error instead of guessing when no root can be found', () => {
    tree({ 'loose/plan.md': '# p' });
    const loc = resolveTarget(path.join(tmp, 'loose/plan.md'), tmp);
    expect(loc.error).toMatch(/workspace root/i);
  });

  it('refuses a path that escapes the root it found', () => {
    tree({ 'repo/.git/HEAD': 'x', 'repo/docs/plan.md': '# p', 'secret.md': 'x' });
    const loc = resolveTarget('../secret.md', path.join(tmp, 'repo'));
    expect(loc.error).toBeTruthy();
  });
});

const COMMENT = {
  id: 'c1',
  text: 'sửa chỗ này',
  selectedText: 'System Overview',
  lineStart: 20,
  lineEnd: 20,
  context: { before: '', after: '' },
  createdAt: '2026-08-22T07:32:08.851Z'
};

function withComments(list) {
  tree({
    'repo/.git/HEAD': 'x',
    'repo/plan.md': '# p',
    'repo/.mdpreview/comments/plan.md.json': JSON.stringify(list)
  });
  return resolveTarget('plan.md', path.join(tmp, 'repo'));
}

describe('readPending', () => {
  it('returns the pending comments without touching the store', () => {
    const loc = withComments([COMMENT]);
    const result = readPending(loc);

    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toMatchObject({ id: 'c1', text: 'sửa chỗ này' });
    // Reading must NOT consume: the store file survives, no archive appears.
    expect(fs.existsSync(loc.commentsPath)).toBe(true);
    expect(fs.existsSync(loc.archivePath)).toBe(false);
  });

  it('is repeatable — a second read sees the same comments', () => {
    const loc = withComments([COMMENT]);
    readPending(loc);
    expect(readPending(loc).comments).toHaveLength(1);
  });

  it('assigns and persists an id to a legacy comment that has none', () => {
    const legacy = { ...COMMENT };
    delete legacy.id;
    const loc = withComments([legacy]);

    const result = readPending(loc);
    expect(result.comments[0].id).toBeTruthy();
    // Persisted back, so a later resolve-by-id finds it.
    const stored = JSON.parse(fs.readFileSync(loc.commentsPath, 'utf8'));
    expect(stored[0].id).toBe(result.comments[0].id);
  });

  it('treats a missing store as no comments', () => {
    tree({ 'repo/.git/HEAD': 'x', 'repo/plan.md': '# p' });
    const loc = resolveTarget('plan.md', path.join(tmp, 'repo'));
    expect(readPending(loc).comments).toHaveLength(0);
  });

  it('treats a corrupt store as no comments rather than throwing', () => {
    const loc = withComments([]);
    fs.writeFileSync(loc.commentsPath, 'not json{');
    expect(readPending(loc).comments).toHaveLength(0);
  });
});

describe('resolveComments', () => {
  it('archives the listed comments, stamped, and leaves the rest pending', () => {
    const c2 = { ...COMMENT, id: 'c2', text: 'câu hỏi để mở' };
    const loc = withComments([COMMENT, c2]);

    const result = resolveComments(loc, ['c1']);
    expect(result.resolved).toEqual(['c1']);
    expect(result.remaining).toBe(1);

    const stored = JSON.parse(fs.readFileSync(loc.commentsPath, 'utf8'));
    expect(stored.map((c) => c.id)).toEqual(['c2']);
    const archived = JSON.parse(fs.readFileSync(loc.archivePath, 'utf8'));
    expect(archived.map((c) => c.id)).toEqual(['c1']);
    expect(archived[0].consumedAt).toBeTruthy();
  });

  it('resolves everything when no ids are given', () => {
    const loc = withComments([COMMENT, { ...COMMENT, id: 'c2' }]);
    const result = resolveComments(loc, undefined);
    expect(result.resolved).toEqual(['c1', 'c2']);
    expect(result.remaining).toBe(0);
  });

  it('deletes the emptied store file and prunes empty directories', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/docs/deep/plan.md': '# p',
      'repo/.mdpreview/comments/docs/deep/plan.md.json': JSON.stringify([COMMENT])
    });
    const loc = resolveTarget('docs/deep/plan.md', path.join(tmp, 'repo'));
    resolveComments(loc, ['c1']);

    expect(fs.existsSync(loc.commentsPath)).toBe(false);
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/docs'))).toBe(false);
    // The archive it just wrote keeps these two alive.
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments'))).toBe(true);
  });

  it('appends to an existing archive rather than replacing it', () => {
    const loc = withComments([COMMENT]);
    fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
    fs.writeFileSync(loc.archivePath, JSON.stringify([{ id: 'old' }]));

    resolveComments(loc, ['c1']);
    const archived = JSON.parse(fs.readFileSync(loc.archivePath, 'utf8'));
    expect(archived.map((c) => c.id)).toEqual(['old', 'c1']);
  });

  it('reports unknown ids instead of silently ignoring them', () => {
    const loc = withComments([COMMENT]);
    const result = resolveComments(loc, ['c1', 'nope']);
    expect(result.resolved).toEqual(['c1']);
    expect(result.unknown).toEqual(['nope']);
  });

  it('leaves sibling files and referenced images alone', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/docs/plan.md': '# p',
      'repo/.mdpreview/comments/docs/plan.md.json': JSON.stringify([COMMENT]),
      'repo/.mdpreview/comments/docs/other.md.json': JSON.stringify([{ id: 'x' }]),
      'repo/.mdpreview/comments/assets/c1-1.png': 'png-bytes'
    });
    const loc = resolveTarget('docs/plan.md', path.join(tmp, 'repo'));
    resolveComments(loc, ['c1']);

    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/docs/other.md.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/assets/c1-1.png'))).toBe(true);
  });
});

describe('listPending', () => {
  it('lists every file with pending comments, with counts and newest timestamp', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/.mdpreview/comments/docs/plan.md.json': JSON.stringify([
        COMMENT,
        { ...COMMENT, id: 'c2', createdAt: '2026-08-23T01:00:00.000Z' }
      ]),
      'repo/.mdpreview/comments/README.md.json': JSON.stringify([{ ...COMMENT, id: 'c3' }])
    });

    const result = listPending(path.join(tmp, 'repo'));
    expect(result.files).toEqual([
      { file: 'README.md', count: 1, newestAt: '2026-08-22T07:32:08.851Z' },
      { file: 'docs/plan.md', count: 2, newestAt: '2026-08-23T01:00:00.000Z' }
    ]);
  });

  it('ignores the archive and the assets directory', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/.mdpreview/comments/.archive/old.md.json': JSON.stringify([COMMENT]),
      'repo/.mdpreview/comments/assets/c1-1.png': 'png',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([COMMENT])
    });
    const result = listPending(path.join(tmp, 'repo'));
    expect(result.files.map((f) => f.file)).toEqual(['plan.md']);
  });

  it('returns an empty list when there is no store at all', () => {
    tree({ 'repo/.git/HEAD': 'x' });
    expect(listPending(path.join(tmp, 'repo')).files).toEqual([]);
  });

  it('reports an error when no workspace root can be found', () => {
    tree({ 'loose/plan.md': '# p' });
    expect(listPending(path.join(tmp, 'loose')).error).toMatch(/workspace root/i);
  });
});

describe('removeAndPrune', () => {
  const { removeAndPrune } = server;

  it('stops at .mdpreview and never climbs into the repo itself', () => {
    tree({ 'repo/.mdpreview/comments/a.json': '[]' });
    removeAndPrune(path.join(tmp, 'repo'), path.join(tmp, 'repo/.mdpreview/comments/a.json'));

    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview'))).toBe(false);
    expect(fs.existsSync(path.join(tmp, 'repo'))).toBe(true);
  });

  it('is a no-op when the file is already gone', () => {
    tree({ 'repo/.mdpreview/comments/a.json': '[]' });
    const missing = path.join(tmp, 'repo/.mdpreview/comments/nope.json');
    removeAndPrune(path.join(tmp, 'repo'), missing);
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/a.json'))).toBe(true);
  });
});

describe('comment payload', () => {
  const { callTool } = server;

  it('passes the tag and absolute image paths through to the agent', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/assets/c1-1.png': 'png',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([
        { id: 'c1', text: 'nút này vỡ', tag: 'bug', images: ['assets/c1-1.png'] }
      ])
    });
    const res = callTool('mdp_read_comments', { file: 'plan.md' }, path.join(tmp, 'repo'));
    const payload = JSON.parse(res.content[0].text.split('\n').slice(1).join('\n'));

    expect(payload[0].tag).toBe('bug');
    expect(payload[0].images).toEqual([path.join(tmp, 'repo/.mdpreview/comments/assets/c1-1.png')]);
  });

  it('omits tag and images when the comment has neither', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([{ id: 'c1', text: 'ok' }])
    });
    const res = callTool('mdp_read_comments', { file: 'plan.md' }, path.join(tmp, 'repo'));
    const payload = JSON.parse(res.content[0].text.split('\n').slice(1).join('\n'));

    expect(payload[0]).not.toHaveProperty('tag');
    expect(payload[0]).not.toHaveProperty('images');
  });

  it('drops image entries that point outside the assets directory', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([
        { id: 'c1', text: 'x', images: ['../../../etc/passwd', 'assets/../secret', 'assets/ok.png'] }
      ])
    });
    const res = callTool('mdp_read_comments', { file: 'plan.md' }, path.join(tmp, 'repo'));
    const payload = JSON.parse(res.content[0].text.split('\n').slice(1).join('\n'));

    expect(payload[0].images).toEqual([path.join(tmp, 'repo/.mdpreview/comments/assets/ok.png')]);
  });
});

describe('JSON-RPC handling', () => {
  const call = (method, params, id = 1) => handleMessage({ jsonrpc: '2.0', id, method, params }, tmp);

  it('answers initialize with a protocol version and the tools capability', () => {
    const res = call('initialize', { protocolVersion: '2024-11-05' });
    expect(res.result.protocolVersion).toBeTruthy();
    expect(res.result.capabilities.tools).toBeDefined();
    expect(res.result.serverInfo.name).toBe('mdpreview');
  });

  it('lists the three tools, each with a schema', () => {
    const res = call('tools/list');
    expect(res.result.tools.map((t) => t.name)).toEqual([
      'mdp_read_comments',
      'mdp_resolve_comments',
      'mdp_list_pending'
    ]);
    expect(res.result.tools[0].inputSchema.required).toEqual(['file']);
    expect(res.result.tools[1].inputSchema.required).toEqual(['file']);
  });

  it('returns no response for a notification', () => {
    expect(handleMessage({ jsonrpc: '2.0', method: 'notifications/initialized' }, tmp)).toBeNull();
  });

  it('answers ping', () => {
    expect(call('ping').result).toEqual({});
  });

  it('reports an unknown method as a JSON-RPC error, not a crash', () => {
    const res = call('does/not/exist');
    expect(res.error.code).toBe(-32601);
  });

  it('runs read → resolve end to end', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([{ id: 'c1', text: 'đổi tiêu đề' }])
    });
    const cwd = path.join(tmp, 'repo');

    const read = handleMessage(
      { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'mdp_read_comments', arguments: { file: 'plan.md' } } },
      cwd
    );
    expect(read.result.isError).toBeFalsy();
    expect(read.result.content[0].text).toContain('đổi tiêu đề');
    expect(read.result.content[0].text).toContain('c1');
    // Still pending after the read.
    expect(fs.existsSync(path.join(cwd, '.mdpreview/comments/plan.md.json'))).toBe(true);

    const resolve = handleMessage(
      { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'mdp_resolve_comments', arguments: { file: 'plan.md', ids: ['c1'] } } },
      cwd
    );
    expect(resolve.result.isError).toBeFalsy();
    expect(fs.existsSync(path.join(cwd, '.mdpreview/comments/plan.md.json'))).toBe(false);
  });

  it('runs mdp_list_pending end to end', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([{ id: 'c1', text: 'x', createdAt: '2026-08-23T01:00:00.000Z' }])
    });
    const res = handleMessage(
      { jsonrpc: '2.0', id: 11, method: 'tools/call', params: { name: 'mdp_list_pending', arguments: {} } },
      path.join(tmp, 'repo')
    );
    expect(res.result.isError).toBeFalsy();
    expect(res.result.content[0].text).toContain('plan.md');
  });

  it('surfaces a resolve failure as a tool error, not a protocol error', () => {
    const res = handleMessage(
      { jsonrpc: '2.0', id: 8, method: 'tools/call', params: { name: 'mdp_read_comments', arguments: { file: 'nope.md' } } },
      tmp
    );
    expect(res.error).toBeUndefined();
    expect(res.result.isError).toBe(true);
  });

  it('rejects an unknown tool name', () => {
    const res = handleMessage(
      { jsonrpc: '2.0', id: 9, method: 'tools/call', params: { name: 'rm_rf', arguments: {} } },
      tmp
    );
    expect(res.result.isError).toBe(true);
  });

  it('rejects a call with no file argument', () => {
    const res = handleMessage(
      { jsonrpc: '2.0', id: 10, method: 'tools/call', params: { name: 'mdp_read_comments', arguments: {} } },
      tmp
    );
    expect(res.result.isError).toBe(true);
  });
});

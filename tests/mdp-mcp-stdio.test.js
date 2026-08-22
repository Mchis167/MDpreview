import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const server = require('../vscode-extension/mcpStdioServer.js');
const { findRoot, resolveTarget, readAndConsume, handleMessage } = server;

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

describe('readAndConsume', () => {
  function withComments(list) {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify(list)
    });
    return resolveTarget('plan.md', path.join(tmp, 'repo'));
  }

  const COMMENT = {
    id: 'c1',
    text: 'sửa chỗ này',
    selectedText: 'System Overview',
    lineStart: 20,
    lineEnd: 20,
    context: { before: '', after: '' },
    createdAt: '2026-08-22T07:32:08.851Z'
  };

  it('returns the pending comments', () => {
    const result = readAndConsume(withComments([COMMENT]));
    expect(result.comments).toHaveLength(1);
    expect(result.comments[0]).toMatchObject({ text: 'sửa chỗ này', selectedText: 'System Overview' });
  });

  it('moves them into the archive, stamped, and deletes the emptied store file', () => {
    const loc = withComments([COMMENT]);
    readAndConsume(loc);

    // Deleted rather than rewritten as `[]`: a file with nothing outstanding
    // should leave no trace in the tree.
    expect(fs.existsSync(loc.commentsPath)).toBe(false);
    const archived = JSON.parse(fs.readFileSync(loc.archivePath, 'utf8'));
    expect(archived).toHaveLength(1);
    expect(archived[0].id).toBe('c1');
    expect(archived[0].consumedAt).toBeTruthy();
  });

  it('appends to an existing archive rather than replacing it', () => {
    const loc = withComments([COMMENT]);
    fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
    fs.writeFileSync(loc.archivePath, JSON.stringify([{ id: 'old' }]));

    readAndConsume(loc);
    const archived = JSON.parse(fs.readFileSync(loc.archivePath, 'utf8'));
    expect(archived.map((c) => c.id)).toEqual(['old', 'c1']);
  });

  it('reports nothing pending without creating an archive file', () => {
    const loc = withComments([]);
    const result = readAndConsume(loc);
    expect(result.comments).toHaveLength(0);
    expect(fs.existsSync(loc.archivePath)).toBe(false);
  });

  it('treats a missing store as no comments', () => {
    tree({ 'repo/.git/HEAD': 'x', 'repo/plan.md': '# p' });
    const loc = resolveTarget('plan.md', path.join(tmp, 'repo'));
    expect(readAndConsume(loc).comments).toHaveLength(0);
  });

  it('treats a corrupt store as no comments rather than throwing', () => {
    const loc = withComments([]);
    fs.writeFileSync(loc.commentsPath, 'not json{');
    expect(readAndConsume(loc).comments).toHaveLength(0);
  });

  it('prunes the directories the deleted store file leaves empty', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/docs/deep/plan.md': '# p',
      'repo/.mdpreview/comments/docs/deep/plan.md.json': JSON.stringify([COMMENT])
    });
    const loc = resolveTarget('docs/deep/plan.md', path.join(tmp, 'repo'));
    readAndConsume(loc);

    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/docs'))).toBe(false);
    // The archive it just wrote keeps these two alive.
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview'))).toBe(true);
  });

  it('leaves sibling files and the images the archive still references alone', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/docs/plan.md': '# p',
      'repo/.mdpreview/comments/docs/plan.md.json': JSON.stringify([COMMENT]),
      'repo/.mdpreview/comments/docs/other.md.json': JSON.stringify([{ id: 'x' }]),
      'repo/.mdpreview/comments/assets/c1-1.png': 'png-bytes'
    });
    const loc = resolveTarget('docs/plan.md', path.join(tmp, 'repo'));
    readAndConsume(loc);

    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/docs/other.md.json'))).toBe(true);
    expect(fs.existsSync(path.join(tmp, 'repo/.mdpreview/comments/assets/c1-1.png'))).toBe(true);
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

  it('lists exactly one tool, with a schema', () => {
    const res = call('tools/list');
    expect(res.result.tools).toHaveLength(1);
    expect(res.result.tools[0].name).toBe('mdp_read_comments');
    expect(res.result.tools[0].inputSchema.required).toEqual(['file']);
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

  it('runs the tool end to end', () => {
    tree({
      'repo/.git/HEAD': 'x',
      'repo/plan.md': '# p',
      'repo/.mdpreview/comments/plan.md.json': JSON.stringify([{ id: 'c1', text: 'đổi tiêu đề' }])
    });
    const res = handleMessage(
      { jsonrpc: '2.0', id: 7, method: 'tools/call', params: { name: 'mdp_read_comments', arguments: { file: 'plan.md' } } },
      path.join(tmp, 'repo')
    );

    expect(res.id).toBe(7);
    expect(res.result.isError).toBeFalsy();
    expect(res.result.content[0].text).toContain('đổi tiêu đề');
    expect(res.result.content[0].text).toContain('consumed');
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

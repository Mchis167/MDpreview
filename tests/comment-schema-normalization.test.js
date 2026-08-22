import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const commentsRoute = require('../server/routes/comments');
const { loadComments, saveComments } = commentsRoute;

describe('comment schema normalization (server/routes/comments.js)', () => {
  let dataDir;
  const wsId = 'ws-1';
  const file = 'docs/plan.md';

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'comments-norm-test-'));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  function writeRawComments(list) {
    const encoded = file.replace(/[/\\:.]/g, '_');
    const dir = path.join(dataDir, 'comments', wsId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, `${encoded}.json`), JSON.stringify(list));
  }

  it('gives old-shape comments a default claude field on read', () => {
    writeRawComments([{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'hello' }]);
    const comments = loadComments(dataDir, wsId, file);
    expect(comments).toHaveLength(1);
    expect(comments[0].claude).toEqual({ status: 'none', replies: [] });
  });

  it('persists the normalized claude field back to disk', () => {
    writeRawComments([{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'hello' }]);
    loadComments(dataDir, wsId, file);

    const encoded = file.replace(/[/\\:.]/g, '_');
    const raw = JSON.parse(fs.readFileSync(path.join(dataDir, 'comments', wsId, `${encoded}.json`), 'utf8'));
    expect(raw[0].claude).toEqual({ status: 'none', replies: [] });
  });

  it('leaves an existing well-formed claude field untouched', () => {
    writeRawComments([{
      id: 'c1', lineStart: 1, lineEnd: 1, text: 'hello',
      claude: { status: 'pending', replies: [{ id: 'r1', text: 'reply', createdAt: '2026-01-01T00:00:00.000Z' }] }
    }]);
    const comments = loadComments(dataDir, wsId, file);
    expect(comments[0].claude.status).toBe('pending');
    expect(comments[0].claude.replies).toHaveLength(1);
  });

  it('does not clobber existing fields when adding a reply via saveComments round-trip', () => {
    writeRawComments([{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'hello', selectedText: 'foo' }]);
    const comments = loadComments(dataDir, wsId, file);
    comments[0].claude.replies.push({ id: 'r1', text: 'a reply', createdAt: new Date().toISOString() });
    saveComments(dataDir, wsId, file, comments);

    const reloaded = loadComments(dataDir, wsId, file);
    expect(reloaded[0].text).toBe('hello');
    expect(reloaded[0].selectedText).toBe('foo');
    expect(reloaded[0].claude.replies).toHaveLength(1);
    expect(reloaded[0].claude.replies[0].text).toBe('a reply');
  });

  it('still auto-fixes a missing id alongside claude normalization', () => {
    writeRawComments([{ lineStart: 1, lineEnd: 1, text: 'no id here' }]);
    const comments = loadComments(dataDir, wsId, file);
    expect(comments[0].id).toBeTruthy();
    expect(comments[0].claude).toEqual({ status: 'none', replies: [] });
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
const fs   = require('fs');
const os   = require('os');
const path = require('path');

const { parseRef, resolveWorkspace, buildRef } = require('../server/utils/mcp-ref');

describe('mcp-ref: parseRef', () => {
  it('parses a valid ref with c=pending', () => {
    const ref = 'mdp://ws-1/' + encodeURIComponent('docs/plan.md') + '?c=pending';
    const result = parseRef(ref);
    expect(result.error).toBeUndefined();
    expect(result.wsId).toBe('ws-1');
    expect(result.filePath).toBe('docs/plan.md');
    expect(result.commentFilter).toBe('pending');
  });

  it('parses a valid ref with c=<commentId>', () => {
    const ref = 'mdp://ws-1/' + encodeURIComponent('docs/plan.md') + '?c=abc-123';
    const result = parseRef(ref);
    expect(result.commentFilter).toBe('abc-123');
  });

  it('defaults to "pending" when no query string is present', () => {
    const ref = 'mdp://ws-1/' + encodeURIComponent('docs/plan.md');
    const result = parseRef(ref);
    expect(result.error).toBeUndefined();
    expect(result.commentFilter).toBe('pending');
  });

  it('round-trips a path containing spaces and unicode', () => {
    const filePath = 'notes/tài liệu kế hoạch 计划.md';
    const ref = 'mdp://ws-9/' + encodeURIComponent(filePath) + '?c=pending';
    const result = parseRef(ref);
    expect(result.error).toBeUndefined();
    expect(result.wsId).toBe('ws-9');
    expect(result.filePath).toBe(filePath);
  });

  it('returns BAD_REF for a malformed ref (missing prefix)', () => {
    const result = parseRef('not-a-ref');
    expect(result.error).toBe('BAD_REF');
  });

  it('returns BAD_REF for a ref missing the path separator', () => {
    const result = parseRef('mdp://ws-1');
    expect(result.error).toBe('BAD_REF');
  });

  it('returns BAD_REF for an empty/undefined ref', () => {
    expect(parseRef(undefined).error).toBe('BAD_REF');
    expect(parseRef('').error).toBe('BAD_REF');
  });
});

describe('mcp-ref: buildRef', () => {
  it('is the inverse of parseRef', () => {
    const wsId = 'ws-1';
    const filePath = 'docs/a b/plan.md';
    const ref = buildRef(wsId, filePath, 'pending');
    const parsed = parseRef(ref);
    expect(parsed.wsId).toBe(wsId);
    expect(parsed.filePath).toBe(filePath);
    expect(parsed.commentFilter).toBe('pending');
  });
});

describe('mcp-ref: resolveWorkspace', () => {
  let dataDir;

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-ref-test-'));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('returns null when workspaces.json does not exist', () => {
    expect(resolveWorkspace(dataDir, 'ws-1')).toBeNull();
  });

  it('returns the matching workspace object', () => {
    const ws = { id: 'ws-1', name: 'Test', path: '/tmp/test-ws', createdAt: new Date().toISOString() };
    fs.writeFileSync(path.join(dataDir, 'workspaces.json'), JSON.stringify({ workspaces: [ws], activeWorkspaceId: 'ws-1' }));
    expect(resolveWorkspace(dataDir, 'ws-1')).toEqual(ws);
  });

  it('returns null when the workspace id is not found', () => {
    fs.writeFileSync(path.join(dataDir, 'workspaces.json'), JSON.stringify({ workspaces: [], activeWorkspaceId: null }));
    expect(resolveWorkspace(dataDir, 'missing')).toBeNull();
  });
});

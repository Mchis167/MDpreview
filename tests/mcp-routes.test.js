import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
const express = require('express');
const http    = require('http');
const fs      = require('fs');
const os      = require('os');
const path    = require('path');

const mcpRouter = require('../server/routes/mcp');
const { saveComments } = require('../server/routes/comments');

describe('server/routes/mcp.js', () => {
  let dataDir, workspaceDir, server, baseUrl;
  const wsId = 'ws-1';
  const relFile = 'plan.md';

  beforeAll(() => {
    const app = express();
    app.use(express.json());
    app.use('/api', (req, res, next) => {
      req.dataDir = dataDir;
      req.io = { emit: () => {} };
      next();
    });
    app.use('/api', mcpRouter);

    server = http.createServer(app);
    return new Promise((resolve) => {
      server.listen(0, () => {
        baseUrl = `http://localhost:${server.address().port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    return new Promise((resolve) => server.close(resolve));
  });

  beforeEach(() => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-routes-test-'));
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-routes-ws-'));
    fs.writeFileSync(path.join(workspaceDir, relFile), '# Plan\n');

    const workspaces = {
      workspaces: [{ id: wsId, name: 'Test', path: workspaceDir, createdAt: new Date().toISOString() }],
      activeWorkspaceId: wsId
    };
    fs.writeFileSync(path.join(dataDir, 'workspaces.json'), JSON.stringify(workspaces));
  });

  afterEach(() => {
    fs.rmSync(dataDir, { recursive: true, force: true });
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  });

  function ref(commentFilter) {
    return `mdp://${wsId}/${encodeURIComponent(relFile)}?c=${commentFilter}`;
  }

  describe('POST /api/mcp/open', () => {
    it('returns FILE_NOT_FOUND for a missing file', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, path: 'nope.md' })
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('FILE_NOT_FOUND');
    });

    it('returns BAD_REF for a relative path with no wsId', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: relFile })
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('BAD_REF');
    });

    it('returns WORKSPACE_NOT_REGISTERED for an absolute path outside every workspace', async () => {
      const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-routes-outside-'));
      const outsideFile = path.join(outside, 'other-repo.md');
      fs.writeFileSync(outsideFile, '# Other repo\n');

      const res = await fetch(`${baseUrl}/api/mcp/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: outsideFile })
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('WORKSPACE_NOT_REGISTERED');

      fs.rmSync(outside, { recursive: true, force: true });
    });

    it('happy path: opens an existing file by wsId + relative path', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wsId, path: relFile })
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.wsId).toBe(wsId);
    });

    it('auto-detects the workspace from an absolute path with no wsId given', async () => {
      const absPath = path.join(workspaceDir, relFile);
      const res = await fetch(`${baseUrl}/api/mcp/open`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: absPath })
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.wsId).toBe(wsId);
    });
  });

  describe('GET /api/mcp/comments', () => {
    it('returns BAD_REF for a malformed ref', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/comments?ref=nope`);
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.error).toBe('BAD_REF');
    });

    it('returns WORKSPACE_NOT_FOUND for an unknown workspace', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/comments?ref=${encodeURIComponent(`mdp://ghost/${encodeURIComponent(relFile)}?c=pending`)}`);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('WORKSPACE_NOT_FOUND');
    });

    it('returns COMMENT_NOT_FOUND for an unknown comment id', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/comments?ref=${encodeURIComponent(ref('missing-id'))}`);
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('COMMENT_NOT_FOUND');
    });

    it('happy path: returns unresolved comments, excluding resolved ones', async () => {
      saveComments(dataDir, wsId, relFile, [
        { id: 'c1', lineStart: 1, lineEnd: 1, text: 'do this', claude: { status: 'none', replies: [] } },
        { id: 'c2', lineStart: 2, lineEnd: 2, text: 'already handled', claude: { status: 'resolved', replies: [] } }
      ]);

      const res = await fetch(`${baseUrl}/api/mcp/comments?ref=${encodeURIComponent(ref('pending'))}`);
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.comments).toHaveLength(1);
      expect(body.comments[0].id).toBe('c1');
      expect(body.absPath).toBe(path.join(workspaceDir, relFile));
    });
  });

  describe('POST /api/mcp/comments/:id/reply', () => {
    it('returns COMMENT_NOT_FOUND for an unknown comment', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/comments/missing/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: ref('missing'), text: 'hi' })
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('COMMENT_NOT_FOUND');
    });

    it('happy path: appends a reply', async () => {
      saveComments(dataDir, wsId, relFile, [
        { id: 'c1', lineStart: 1, lineEnd: 1, text: 'do this', claude: { status: 'pending', replies: [] } }
      ]);

      const res = await fetch(`${baseUrl}/api/mcp/comments/c1/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: ref('c1'), text: 'Fixed it' })
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.claude.replies).toHaveLength(1);
      expect(body.claude.replies[0].text).toBe('Fixed it');
    });
  });

  describe('POST /api/mcp/comments/:id/resolve', () => {
    it('returns COMMENT_NOT_FOUND for an unknown comment', async () => {
      const res = await fetch(`${baseUrl}/api/mcp/comments/missing/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: ref('missing') })
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.error).toBe('COMMENT_NOT_FOUND');
    });

    it('happy path: marks a comment resolved', async () => {
      saveComments(dataDir, wsId, relFile, [
        { id: 'c1', lineStart: 1, lineEnd: 1, text: 'do this', claude: { status: 'pending', replies: [] } }
      ]);

      const res = await fetch(`${baseUrl}/api/mcp/comments/c1/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ref: ref('c1') })
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.claude.status).toBe('resolved');
    });
  });
});

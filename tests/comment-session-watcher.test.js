import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

// commentSession.js requires `vscode`, which only exists inside an extension
// host — swap in the fs-backed stub, extended with a fake FileSystemWatcher
// that tests fire manually instead of relying on real OS file events.
const vscodeStub = require('./stubs/vscode.cjs');
const { installVscodeStub } = vscodeStub;
const { Uri, __fireWatcherEvent } = installVscodeStub();

const { createCommentSession } = require('../vscode-extension/commentSession.js');

let wsRoot;
let panel;

function writeActive(relPath, comments) {
  const p = path.join(wsRoot, '.mdpreview', 'comments', `${relPath}.json`);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(comments));
  return p;
}

function archivePathFor(relPath) {
  return path.join(wsRoot, '.mdpreview', 'comments', '.archive', `${relPath}.json`);
}

beforeEach(() => {
  wsRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-session-')));
  vscodeStub.workspace.workspaceFolders = [{ uri: Uri.file(wsRoot) }];

  panel = {
    webview: {
      postMessage: vi.fn(),
      asWebviewUri: (uri) => ({ toString: () => `webview://${uri.fsPath}` })
    }
  };
});

afterEach(() => {
  fs.rmSync(wsRoot, { recursive: true, force: true });
  vi.clearAllMocks();
});

/**
 * Reproduces the real failure: mcpStdioServer.js's removeAndPrune deletes the
 * active comments file, and when that file's directory has nothing else left
 * in it, prunes the directory away too — in that order, both before the
 * archive write even happens in real usage, though the exact ordering
 * doesn't matter here. What matters is the active file being gone from disk
 * while only the ARCHIVE watcher's create event fires (simulating a backend
 * that coalesced or dropped the active-file delete notification).
 */
describe('createCommentSession — external consume-on-read', () => {
  it('refreshes the active list when only the archive watcher fires, not the store watcher', async () => {
    const relPath = 'docs/idea/mcp-tool-update.md';
    writeActive(relPath, [{ id: 'c1', lineStart: 11, lineEnd: 11, text: 'comment', selectedText: 'P0' }]);

    const document = { uri: Uri.file(path.join(wsRoot, relPath)) };
    const session = createCommentSession(document, panel);
    expect(session).not.toBeNull();

    await session.load();
    panel.webview.postMessage.mockClear();

    // Simulate mcpStdioServer.readAndConsume: active file (and its now-empty
    // parent dirs) gone, archive file written — but only fire the archive
    // watcher, never the store watcher's onDidDelete.
    fs.rmSync(path.join(wsRoot, '.mdpreview', 'comments', 'docs'), { recursive: true, force: true });
    const archivePath = archivePathFor(relPath);
    fs.mkdirSync(path.dirname(archivePath), { recursive: true });
    fs.writeFileSync(
      archivePath,
      JSON.stringify([{ id: 'c1', lineStart: 11, lineEnd: 11, text: 'comment', selectedText: 'P0', consumedAt: 'now' }])
    );
    __fireWatcherEvent(archivePath, 'create');

    await new Promise((r) => setTimeout(r, 0));

    const commentsMessages = panel.webview.postMessage.mock.calls
      .map(([m]) => m)
      .filter((m) => m.type === 'comments');
    expect(commentsMessages.length).toBeGreaterThan(0);
    expect(commentsMessages[commentsMessages.length - 1].list).toEqual([]);

    session.dispose();
  });

  it('still refreshes normally when the store watcher itself fires (the common case)', async () => {
    const relPath = 'notes.md';
    writeActive(relPath, [{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'x', selectedText: 'y' }]);

    const document = { uri: Uri.file(path.join(wsRoot, relPath)) };
    const session = createCommentSession(document, panel);
    await session.load();
    panel.webview.postMessage.mockClear();

    fs.rmSync(path.join(wsRoot, '.mdpreview', 'comments', `${relPath}.json`));
    __fireWatcherEvent(path.join(wsRoot, '.mdpreview', 'comments', `${relPath}.json`), 'delete');

    await new Promise((r) => setTimeout(r, 0));

    const commentsMessages = panel.webview.postMessage.mock.calls.map(([m]) => m).filter((m) => m.type === 'comments');
    expect(commentsMessages[commentsMessages.length - 1].list).toEqual([]);

    session.dispose();
  });
});

/* ============================================================
   A minimal stand-in for the `vscode` module, backed by the real
   filesystem. Enough of Uri + workspace.fs for commentStorage.js,
   which is otherwise untestable outside an extension host.

   CommonJS on purpose: the extension modules `require('vscode')`,
   and `installVscodeStub()` below hooks that resolution.
   ============================================================ */

'use strict';

const fs = require('fs');
const path = require('path');
const Module = require('module');

class Uri {
  constructor(fsPath) {
    this.fsPath = fsPath;
    this.scheme = 'file';
  }

  static file(p) {
    return new Uri(p);
  }

  static joinPath(base, ...segments) {
    return new Uri(path.join(base.fsPath, ...segments));
  }

  toString() {
    return `file://${this.fsPath}`;
  }
}

// Mirrors the real enum's values — commentStorage compares against them.
const FileType = { Unknown: 0, File: 1, Directory: 2, SymbolicLink: 64 };

// vscode.workspace.fs rejects rather than throwing synchronously, and the
// callers here only distinguish "worked" from "did not" — a rejection from
// the underlying fs call carries all the meaning they use.
const workspaceFs = {
  async readFile(uri) {
    return fs.readFileSync(uri.fsPath);
  },

  async writeFile(uri, bytes) {
    fs.writeFileSync(uri.fsPath, bytes);
  },

  async createDirectory(uri) {
    fs.mkdirSync(uri.fsPath, { recursive: true });
  },

  async delete(uri, options = {}) {
    const stat = fs.statSync(uri.fsPath); // throws when missing, as the real API does
    if (stat.isDirectory()) fs.rmdirSync(uri.fsPath, { recursive: !!options.recursive });
    else fs.unlinkSync(uri.fsPath);
  },

  async readDirectory(uri) {
    return fs.readdirSync(uri.fsPath, { withFileTypes: true }).map((entry) => [
      entry.name,
      entry.isDirectory() ? FileType.Directory : FileType.File
    ]);
  },

  async stat(uri) {
    const s = fs.statSync(uri.fsPath);
    return { type: s.isDirectory() ? FileType.Directory : FileType.File, size: s.size };
  }
};

// RelativePattern + createFileSystemWatcher: enough of the real API to test
// commentSession.js's watcher wiring, without an OS-level watcher. Tests
// trigger events explicitly via __fireWatcherEvent — this stub is for
// verifying which handler runs for which event, not for reproducing the
// real watcher's own race conditions (those live in the host, not here).
class RelativePattern {
  constructor(base, pattern) {
    const baseFsPath = base && base.uri ? base.uri.fsPath : (base && base.fsPath) || String(base);
    this.base = base;
    this.pattern = pattern;
    this.fsPath = path.join(baseFsPath, pattern);
  }
}

const watchers = [];

class FileSystemWatcher {
  constructor(fsPath) {
    this.fsPath = fsPath;
    this._onChange = [];
    this._onCreate = [];
    this._onDelete = [];
    watchers.push(this);
  }

  onDidChange(cb) {
    this._onChange.push(cb);
  }

  onDidCreate(cb) {
    this._onCreate.push(cb);
  }

  onDidDelete(cb) {
    this._onDelete.push(cb);
  }

  dispose() {
    const idx = watchers.indexOf(this);
    if (idx !== -1) watchers.splice(idx, 1);
  }
}

function createFileSystemWatcher(pattern) {
  const fsPath = pattern instanceof RelativePattern ? pattern.fsPath : pattern;
  return new FileSystemWatcher(fsPath);
}

/** Test helper: fires every live watcher registered for this exact path. */
function __fireWatcherEvent(fsPath, kind) {
  watchers
    .filter((w) => w.fsPath === fsPath)
    .forEach((w) => {
      const list = kind === 'create' ? w._onCreate : kind === 'delete' ? w._onDelete : w._onChange;
      list.forEach((cb) => cb());
    });
}

function getWorkspaceFolder(uri) {
  const folders = stub.workspace.workspaceFolders || [];
  return folders.find((f) => uri.fsPath === f.uri.fsPath || uri.fsPath.startsWith(f.uri.fsPath + path.sep));
}

function asRelativePath(uri) {
  const folder = getWorkspaceFolder(uri);
  return folder ? path.relative(folder.uri.fsPath, uri.fsPath) : uri.fsPath;
}

const stub = {
  workspace: {
    fs: workspaceFs,
    workspaceFolders: [],
    getWorkspaceFolder,
    asRelativePath,
    createFileSystemWatcher
  },
  Uri,
  FileType,
  RelativePattern,
  __fireWatcherEvent
};

/**
 * Make `require('vscode')` resolve to this stub for the rest of the process.
 * Call it before requiring any module that imports vscode.
 */
function installVscodeStub() {
  const resolve = Module._resolveFilename;
  if (resolve.__mdpStubbed) return stub;

  const patched = function (request, ...rest) {
    if (request === 'vscode') return __filename;
    return resolve.call(this, request, ...rest);
  };
  patched.__mdpStubbed = true;
  Module._resolveFilename = patched;
  return stub;
}

module.exports = stub;
module.exports.installVscodeStub = installVscodeStub;

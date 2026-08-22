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

const stub = { workspace: { fs: workspaceFs }, Uri, FileType };

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

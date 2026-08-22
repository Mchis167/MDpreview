/**
 * diffMode.js — makes MDpreview usable inside VSCode's diff editor.
 *
 * Claude Code proposes edits by calling `vscode.diff(leftVirtualUri,
 * rightVirtualUri, "✻ [Claude Code] <file>")`. Both URIs end in ".md", so our
 * `filenamePattern: "*.md"` custom editor claims both panes — we get two nicely
 * rendered documents and no way to tell what actually changed.
 *
 * This module closes that gap: given the document one pane is showing, it finds
 * the diff tab it belongs to, reads the opposite pane's text, and reports which
 * of *this* pane's lines are unique to it. The webview turns that into
 * block-level highlighting; the line map drives scroll sync between the panes.
 */

'use strict';

const vscode = require('vscode');
const { diffLines } = require('./lineDiff');

/**
 * Locate the diff tab showing `uri` and return the URI of the other pane.
 * Returns null when the document isn't part of a diff (the normal case).
 */
function findDiffPeer(uri) {
  const key = uri.toString();
  for (const group of vscode.window.tabGroups.all) {
    for (const tab of group.tabs) {
      const input = tab.input;
      if (!input || !(input instanceof vscode.TabInputTextDiff)) continue;
      if (input.original.toString() === key) return { side: 'original', peer: input.modified };
      if (input.modified.toString() === key) return { side: 'modified', peer: input.original };
    }
  }
  return null;
}

/**
 * @returns {Promise<null | {
 *   side: 'original' | 'modified',
 *   peerUri: string,
 *   changed: number[],              // 1-based lines unique to this pane
 *   lineMap: Object<number, number>,// this pane's line -> peer's line
 *   truncated: boolean
 * }>}
 */
async function computeDiffInfo(document) {
  const found = findDiffPeer(document.uri);
  if (!found) return null;

  let peerDoc;
  try {
    peerDoc = await vscode.workspace.openTextDocument(found.peer);
  } catch {
    // The peer lives in Claude Code's in-memory FileSystemProvider; if it has
    // already been torn down there is simply nothing to compare against.
    return null;
  }

  const mine = document.getText().split(/\r?\n/);
  const theirs = peerDoc.getText().split(/\r?\n/);
  const isOriginal = found.side === 'original';
  // diffLines takes (old, new) — the original pane is the old side.
  const result = isOriginal ? diffLines(mine, theirs) : diffLines(theirs, mine);

  return {
    side: found.side,
    peerUri: found.peer.toString(),
    changed: isOriginal ? result.oldChanged : result.newChanged,
    lineMap: isOriginal ? result.oldToNew : result.newToOld,
    truncated: result.truncated
  };
}

/**
 * Registry of live preview panes, so one pane can push a scroll position to the
 * other. Keyed by document URI string.
 */
const panes = new Map();

function registerPane(uriString, pane) {
  panes.set(uriString, pane);
  return { dispose: () => panes.delete(uriString) };
}

function getPane(uriString) {
  return panes.get(uriString);
}

module.exports = { findDiffPeer, computeDiffInfo, registerPane, getPane };

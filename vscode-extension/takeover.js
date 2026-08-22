/**
 * takeover.js — reopens plain-text .md tabs in MDpreview.
 *
 * `workbench.editorAssociations` only decides which editor VSCode picks when
 * something asks it to *open a resource*. Claude Code (and a few other
 * extensions) instead call `window.showTextDocument(uri)` — often with a
 * selection, to point at a line — which is the TextEditor API and therefore
 * always builds a raw text editor, association or not. There is no setting that
 * changes this and no hook to intercept the call.
 *
 * So we take the tab back after the fact: watch for a text tab holding a .md
 * file and re-open that same tab with our custom editor. The swap happens in
 * the same tab and the same group, so it reads as "the file opened in
 * MDpreview" rather than as a second tab appearing.
 *
 * Deliberately NOT taken over:
 *   - diff tabs (TabInputTextDiff) — both panes already resolve to MDpreview,
 *     and diffMode.js handles them
 *   - anything that isn't a real file on disk (git:, untitled:, output:, and
 *     Claude Code's own in-memory scheme)
 *   - files the user explicitly asked to see as text via `mdpreview.openAsText`
 */

'use strict';

const vscode = require('vscode');

const VIEW_TYPE = 'mdpreview.preview';

// Files the user chose to open as raw text. Cleared when the tab closes, so the
// opt-out lasts exactly as long as the tab it was made for.
const openAsText = new Set();
// URIs currently mid-swap, so our own openWith doesn't retrigger the watcher.
const swapping = new Set();

function isEnabled() {
  return vscode.workspace.getConfiguration('mdpreview').get('takeoverTextEditors', 'auto') !== 'off';
}

/**
 * Pure half of the guard, so it can be unit-tested without a live VSCode.
 * `uri` only needs { scheme, path, toString() }.
 */
function isTakeoverUri(uri, opts = {}) {
  if (!uri || uri.scheme !== 'file') return false;
  if (!/\.md$/i.test(uri.path)) return false;
  const key = uri.toString();
  const excluded = opts.excluded || [];
  return !excluded.includes(key);
}

function isTakeoverTarget(tab) {
  const input = tab.input;
  // A TabInputTextDiff is not a TabInputText, so diff tabs fall out here.
  if (!input || !(input instanceof vscode.TabInputText)) return false;
  return isTakeoverUri(input.uri, { excluded: [...openAsText, ...swapping] });
}

async function takeOver(tab) {
  const uri = tab.input.uri;
  const key = uri.toString();
  swapping.add(key);
  try {
    await vscode.commands.executeCommand('vscode.openWith', uri, VIEW_TYPE, {
      viewColumn: tab.group.viewColumn,
      preserveFocus: !tab.isActive,
      // Keep the original tab's preview-ness. Agents (Claude Code etc.)
      // touch many .md files per turn via showTextDocument, all as preview
      // tabs — which replace each other, occupying one slot. Reopening them
      // as permanent tabs turned every file an agent glanced at into its own
      // pinned-open MDpreview tab, spamming the tab bar.
      preview: tab.isPreview
    });
  } catch {
    // Losing the swap is harmless — the file stays open as text.
  } finally {
    swapping.delete(key);
  }
}

/**
 * Opens a .md file as raw text and remembers that choice, so the watcher below
 * leaves that tab alone.
 */
async function openAsTextCommand(uri) {
  const target = uri || vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri;
  if (!target) return;
  openAsText.add(target.toString());
  await vscode.commands.executeCommand('vscode.openWith', target, 'default');
}

/**
 * The reverse direction: switches a tab currently open as raw text back to
 * MDpreview. Clears the openAsText opt-out too, so the takeover watcher
 * doesn't immediately fight the very swap this command just made — without
 * it, this button would only work once per tab.
 */
async function openAsPreviewCommand(uri) {
  const target = uri || vscode.window.tabGroups.activeTabGroup.activeTab?.input?.uri;
  if (!target) return;
  openAsText.delete(target.toString());
  await vscode.commands.executeCommand('vscode.openWith', target, VIEW_TYPE);
}

function activate(context) {
  context.subscriptions.push(
    vscode.commands.registerCommand('mdpreview.openAsText', openAsTextCommand),
    vscode.commands.registerCommand('mdpreview.openAsPreview', openAsPreviewCommand),

    vscode.window.tabGroups.onDidChangeTabs((event) => {
      for (const tab of event.closed) {
        const uri = tab.input && tab.input.uri;
        if (uri) openAsText.delete(uri.toString());
      }
      if (!isEnabled()) return;
      for (const tab of [...event.opened, ...event.changed]) {
        if (isTakeoverTarget(tab)) takeOver(tab);
      }
    })
  );

  // Catch .md text tabs that were already open when the extension activated.
  if (isEnabled()) {
    for (const group of vscode.window.tabGroups.all) {
      for (const tab of group.tabs) {
        if (isTakeoverTarget(tab)) takeOver(tab);
      }
    }
  }
}

module.exports = { activate, isTakeoverTarget, isTakeoverUri };

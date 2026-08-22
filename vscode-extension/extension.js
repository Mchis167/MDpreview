const vscode = require('vscode');
const crypto = require('crypto');
const { renderWithLineNumbers } = require('./vendor/shared/md-render');
const { createCommentsCore } = require('./vendor/shared/comments-core');
const { createCommentStorage } = require('./commentStorage');
const { computeDiffInfo, registerPane, getPane } = require('./diffMode');
const takeover = require('./takeover');

function getNonce() {
  return crypto.randomBytes(16).toString('base64');
}

class MdPreviewEditorProvider {
  static register(context) {
    const provider = new MdPreviewEditorProvider(context);
    return vscode.window.registerCustomEditorProvider('mdpreview.preview', provider, {
      webviewOptions: { retainContextWhenHidden: true }
    });
  }

  constructor(context) {
    this.context = context;
  }

  async resolveCustomTextEditor(document, webviewPanel) {
    const sharedRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'shared');
    const rendererRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'renderer');
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [sharedRoot, rendererRoot, mediaRoot]
    };
    webviewPanel.webview.html = this._getHtml(webviewPanel.webview, sharedRoot, rendererRoot, mediaRoot);

    const render = () => {
      const html = renderWithLineNumbers(document.getText());
      webviewPanel.webview.postMessage({ type: 'render', html });
    };

    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const relPath = workspaceFolder
      ? vscode.workspace.asRelativePath(document.uri, false)
      : document.uri.fsPath;
    const commentStorage = workspaceFolder ? createCommentStorage(workspaceFolder) : null;
    const commentsCore = commentStorage
      ? createCommentsCore({
          storage: commentStorage,
          context: { workspaceId: () => workspaceFolder.uri.toString(), currentFile: () => relPath }
        })
      : null;

    const sendComments = () => {
      webviewPanel.webview.postMessage({ type: 'comments', list: commentsCore.list() });
    };
    const unsubscribeComments = commentsCore ? commentsCore.onChange(sendComments) : null;

    const sendArchive = async () => {
      const archived = await commentStorage.getArchive(relPath);
      webviewPanel.webview.postMessage({ type: 'archivedComments', list: archived });
    };

    // Reload when either file changes outside this editor — e.g. the MCP
    // tool consuming comments (moves active -> archive), a restore/delete
    // from another panel of the same file, or another panel saving a comment.
    let storeWatcher = null;
    let archiveWatcher = null;
    if (commentsCore) {
      storeWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, `.mdpreview/comments/${relPath}.json`)
      );
      const reloadActive = () => commentsCore.load(relPath);
      storeWatcher.onDidChange(reloadActive);
      storeWatcher.onDidCreate(reloadActive);
      storeWatcher.onDidDelete(reloadActive);

      archiveWatcher = vscode.workspace.createFileSystemWatcher(
        new vscode.RelativePattern(workspaceFolder, `.mdpreview/comments/.archive/${relPath}.json`)
      );
      archiveWatcher.onDidChange(sendArchive);
      archiveWatcher.onDidCreate(sendArchive);
      archiveWatcher.onDidDelete(sendArchive);
    }

    // ── Diff mode ──
    // When this pane is one half of a diff tab, tell the webview which of its
    // lines are unique to it so it can highlight the changed blocks.
    const diffState = { info: null };
    const pushDiff = async () => {
      const info = await computeDiffInfo(document);
      diffState.info = info;
      webviewPanel.webview.postMessage({ type: 'diff', info });
    };
    const paneReg = registerPane(document.uri.toString(), {
      scrollToLine: (line) => webviewPanel.webview.postMessage({ type: 'diffScrollTo', line })
    });
    // The diff tab may not exist yet when the custom editor resolves, and the
    // peer pane's content can arrive later still — recheck on tab changes.
    const tabSub = vscode.window.tabGroups.onDidChangeTabs(() => pushDiff());

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      const changedUri = e.document.uri.toString();
      if (changedUri === document.uri.toString()) {
        render();
        pushDiff();
      } else if (diffState.info && changedUri === diffState.info.peerUri) {
        pushDiff();
      }
    });
    const messageSub = webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'ready') {
        // The webview is listening now — (re)send everything it renders from.
        render();
        pushDiff();
        if (commentsCore) {
          sendComments();
          sendArchive();
        }
        return;
      }
      if (message.type === 'openLink') return this._openLink(message.href, document);
      if (message.type === 'toggleTask') return this._toggleTask(message.line, message.checked, document);
      if (message.type === 'diffScroll') return this._syncPeerScroll(diffState.info, message.line);
      if (!commentsCore) return;
      if (message.type === 'saveComment') return commentsCore.save(message.data);
      if (message.type === 'deleteComment') return commentsCore.remove(message.id);
      if (message.type === 'clearComments') return commentsCore.clear();
      if (message.type === 'restoreComment') {
        await commentStorage.restore(relPath, message.id);
        await commentsCore.load(relPath);
        return sendArchive();
      }
      if (message.type === 'deleteArchivedComment') {
        await commentStorage.deleteArchived(relPath, message.id);
        return sendArchive();
      }
    });
    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      messageSub.dispose();
      tabSub.dispose();
      paneReg.dispose();
      if (unsubscribeComments) unsubscribeComments();
      if (archiveWatcher) archiveWatcher.dispose();
      if (storeWatcher) storeWatcher.dispose();
    });

    render();
    pushDiff();
    if (commentsCore) await commentsCore.load(relPath);
  }

  /**
   * Translate a line from this pane into the peer pane's coordinates and ask it
   * to scroll there. Lines that were inserted/deleted have no counterpart, so we
   * fall back to the nearest preceding matched line.
   */
  _syncPeerScroll(info, line) {
    if (!info) return;
    const peer = getPane(info.peerUri);
    if (!peer) return;

    let candidate = line;
    while (candidate > 0 && info.lineMap[candidate] === undefined) candidate--;
    const peerLine = info.lineMap[candidate];
    if (peerLine === undefined) return;
    peer.scrollToLine(peerLine);
  }

  async _openLink(href, document) {
    if (/^https?:\/\//i.test(href)) {
      vscode.env.openExternal(vscode.Uri.parse(href));
      return;
    }

    // Relative file reference, e.g. "./other.md" or "../docs/plan.md".
    // Strip a trailing #anchor — VSCode's file open doesn't use it.
    const relativePath = href.split('#')[0];
    if (!relativePath) return;

    const targetUri = vscode.Uri.joinPath(document.uri, '..', relativePath);
    try {
      await vscode.commands.executeCommand('vscode.open', targetUri);
    } catch {
      vscode.window.showWarningMessage(`MDpreview: không mở được liên kết "${href}"`);
    }
  }

  async _toggleTask(lineNum, checked, document) {
    // data-line from renderWithLineNumbers is 1-based; TextDocument.lineAt is 0-based.
    if (!Number.isInteger(lineNum) || lineNum < 1 || lineNum > document.lineCount) return;
    const line = document.lineAt(lineNum - 1);
    const newText = checked
      ? line.text.replace('[ ]', '[x]')
      : line.text.replace(/\[x\]/i, '[ ]');
    if (newText === line.text) return;

    const edit = new vscode.WorkspaceEdit();
    edit.replace(document.uri, line.range, newText);
    await vscode.workspace.applyEdit(edit);
  }

  _getHtml(webview, sharedRoot, rendererRoot, mediaRoot) {
    const mdRenderDir = (name) => vscode.Uri.joinPath(sharedRoot, 'md-render', name);
    const cssUris = [
      webview.asWebviewUri(mdRenderDir('tokens.css')),
      webview.asWebviewUri(mdRenderDir('md-render.css')),
      webview.asWebviewUri(mdRenderDir('markdown-content.css')),
      webview.asWebviewUri(mdRenderDir('markdown-blocks.css')),
      webview.asWebviewUri(mdRenderDir('markdown-interactions.css')),
      webview.asWebviewUri(mdRenderDir('mockup-frames.css')),
      webview.asWebviewUri(mdRenderDir('carousel.css')),
      webview.asWebviewUri(mdRenderDir('checkbox.css'))
    ];
    const mermaidConfigUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'mermaid-config.js')
    );
    const mermaidLibUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'vendor', 'mermaid.min.js'));
    const codeBlocksUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'code-blocks.js')
    );
    const designSystemShimUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'design-system-shim.js'));
    const designSystemIconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'components', 'design-system-icons.js')
    );
    const mockupImagesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'mockup-images.js')
    );
    const carouselUri = webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'carousel.js'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js'));
    const commentAnchorUri = webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'comment-anchor.js'));
    const commentsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.css'));
    const commentsScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.js'));
    const diffCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.css'));
    const diffScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.js'));
    const nonce = getNonce();

    const cssLinks = [...cssUris, commentsCssUri, diffCssUri]
      .map((uri) => `  <link rel="stylesheet" href="${uri}">`)
      .join('\n');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <!-- style-src needs 'unsafe-inline': mermaid injects its own <style> at runtime
       (createElement("style"), no nonce) and that stylesheet is what sets
       .flowchart-link { fill: none } — without it every edge renders as a solid
       black blob. Note a nonce in style-src would make 'unsafe-inline' be ignored,
       so it is deliberately absent here. The main app's CSP does the same. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
${cssLinks}
  <style>
    body {
      background: var(--ds-bg-base);
      padding: 2rem 3rem;
      margin: 0;
    }

    /* The host injects, into every webview, a rule inside the cascade layer
       "vscode-default" that gives bare CODE elements a background-color of
       var(--vscode-textPreformat-background) plus colour/padding/border-radius.
       Because it targets bare CODE it hit both inline code and code inside PRE,
       painting a grey chip the desktop app never has — md-render.css
       deliberately gives inline code an accent colour and no background at all.
       Unlayered rules always beat layered ones regardless of specificity, so
       this plain reset neutralises it; md-render.css's own .md-render-body code
       rule (higher specificity) then styles it as designed. */
    code {
      background-color: transparent;
      color: inherit;
      padding: 0;
      border-radius: 0;
      font-family: inherit;
    }
  </style>
</head>
<body>
  <div id="md-content" class="md-render-body"></div>
  <div id="mdp-comments-panel"></div>
  <script nonce="${nonce}" src="${mermaidConfigUri}"></script>
  <script nonce="${nonce}" src="${mermaidLibUri}"></script>
  <script nonce="${nonce}" src="${codeBlocksUri}"></script>
  <script nonce="${nonce}" src="${designSystemShimUri}"></script>
  <script nonce="${nonce}" src="${designSystemIconsUri}"></script>
  <script nonce="${nonce}" src="${mockupImagesUri}"></script>
  <script nonce="${nonce}" src="${carouselUri}"></script>
  <script nonce="${nonce}" src="${commentAnchorUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
  <script nonce="${nonce}" src="${commentsScriptUri}"></script>
  <script nonce="${nonce}" src="${diffScriptUri}"></script>
</body>
</html>`;
  }
}

function activate(context) {
  context.subscriptions.push(MdPreviewEditorProvider.register(context));
  takeover.activate(context);
}

function deactivate() {}

module.exports = { activate, deactivate };

const vscode = require('vscode');
const crypto = require('crypto');
const { renderWithLineNumbers } = require('./vendor/shared/md-render');
const { createCommentsCore } = require('./vendor/shared/comments-core');
const { createCommentStorage } = require('./commentStorage');
const { computeDiffInfo, registerPane, getPane } = require('./diffMode');
const { createFontHost } = require('./fontHost');
const takeover = require('./takeover');
const { createMcpBridge } = require('./mcpServer');
const { installSkill } = require('./skillInstaller');
const { ensureMcpConfig } = require('./mcpConfig');

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
    this.fonts = createFontHost(context);
  }

  async resolveCustomTextEditor(document, webviewPanel) {
    const sharedRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'shared');
    const rendererRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'renderer');
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');

    webviewPanel.webview.options = {
      enableScripts: true,
      // Font tải về nằm ngoài extension, trong globalStorage — không có
      // nó trong danh sách này thì mọi .woff2 bị webview chặn.
      localResourceRoots: [sharedRoot, rendererRoot, mediaRoot, this.fonts.resourceRoot()]
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
    const sendFonts = async () => {
      const restored = await this.fonts.restore(webviewPanel.webview);
      webviewPanel.webview.postMessage({ type: 'fontRestore', ...restored });
    };

    // Panel font trả lời bằng một loại message duy nhất; `seq` khớp yêu cầu
    // với lời hứa bên webview, `error` là chuỗi để hiện ngay trong panel.
    const replyFont = async (message, work) => {
      try {
        webviewPanel.webview.postMessage({ type: 'fontResult', seq: message.seq, ...(await work()) });
      } catch (err) {
        webviewPanel.webview.postMessage({ type: 'fontResult', seq: message.seq, error: err.message });
      }
    };

    const messageSub = webviewPanel.webview.onDidReceiveMessage(async (message) => {
      if (message.type === 'ready') {
        // The webview is listening now — (re)send everything it renders from.
        render();
        pushDiff();
        sendFonts();
        if (commentsCore) {
          sendComments();
          sendArchive();
        }
        return;
      }
      if (message.type === 'fontSearch') {
        return replyFont(message, async () => ({
          results: await this.fonts.search(message.query, message.role, message.limit)
        }));
      }
      if (message.type === 'zoomSet') return this.fonts.setZoom(message.zoom);
      if (message.type === 'fontApply') {
        return replyFont(message, () =>
          this.fonts.apply(message.role, message.family, webviewPanel.webview)
        );
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
    // The design system pieces the font panel is built from — the same
    // popover card, group cards, setting rows and segmented control the
    // app's own Settings popover uses.
    const dsDir = (name) => vscode.Uri.joinPath(rendererRoot, 'css', name);
    const dsCssUris = [
      webview.asWebviewUri(dsDir('popover-shield.css')),
      webview.asWebviewUri(dsDir('setting-row.css')),
      webview.asWebviewUri(dsDir('segmented-control.css')),
      webview.asWebviewUri(dsDir('tooltip.css')),
      webview.asWebviewUri(dsDir('settings-panel.css')),
      webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'font-kit', 'picker.css')),
      // Comment UI: the real trigger/form/sidebar organisms, not a lookalike.
      webview.asWebviewUri(dsDir('button.css')),
      webview.asWebviewUri(dsDir('icon-action-button.css')),
      webview.asWebviewUri(dsDir('comment-form.css')),
      webview.asWebviewUri(dsDir('sidebar-base.css')),
      webview.asWebviewUri(dsDir('right-sidebar.css')),
      webview.asWebviewUri(dsDir('tab-bar.css'))
    ];
    const mermaidConfigUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'mermaid-config.js')
    );
    const mermaidLibUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'vendor', 'mermaid.min.js'));
    const codeBlocksUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'code-blocks.js')
    );
    const componentDir = (...parts) =>
      webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'components', ...parts));
    // The real design-system.js, not the old shim: the font panel needs its
    // popover/select/segmented factories. Every component it delegates to is
    // behind a `typeof X !== 'undefined'` guard, so the ones not vendored
    // here simply return null rather than throwing.
    const designSystemUris = [
      componentDir('atoms', 'modal.js'),
      componentDir('atoms', 'select.js'),
      componentDir('atoms', 'segmented-control.js'),
      componentDir('atoms', 'icon-action-button.js'),
      componentDir('molecules', 'setting-row.js'),
      componentDir('organisms', 'comment-form-component.js'),
      componentDir('organisms', 'right-sidebar.js'),
      componentDir('design-system.js')
    ];
    const fontKitUris = [
      webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'font-kit', 'picker.js')),
      webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'font-kit', 'ui-mdpreview.js'))
    ];
    const fontsScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'fonts.js'));
    const designSystemIconsUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'components', 'design-system-icons.js')
    );
    const mockupImagesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'mockup-images.js')
    );
    const carouselUri = webview.asWebviewUri(vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'carousel.js'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js'));
    const commentAnchorUri = webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'comment-anchor.js'));
    // Layout glue only (flex split between content and the right sidebar) —
    // the comment UI itself is styled entirely by the vendored DS CSS above.
    const commentsCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.css'));
    const commentsScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'comments.js'));
    const diffCssUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.css'));
    const diffScriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'diff.js'));
    const nonce = getNonce();

    const cssLinks = [...cssUris, ...dsCssUris, commentsCssUri, diffCssUri]
      .map((uri) => `  <link rel="stylesheet" href="${uri}">`)
      .join('\n');
    const dsScripts = [...designSystemUris, ...fontKitUris]
      .map((uri) => `  <script nonce="${nonce}" src="${uri}"></script>`)
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
  <!-- font-src: fonts downloaded by the font panel are served from the
       extension's globalStorage, which asWebviewUri maps onto cspSource.
       Nothing is loaded from fonts.gstatic.com at render time — the page
       never talks to Google; only the extension host does, at download time. -->
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; font-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
${cssLinks}
  <style>
    /* Layout glue only, mirroring the app's #app-layout / main split so the
       vendored .ds-right-sidebar-wrap takes real flex width instead of
       covering the content. Everything inside is styled by vendored DS CSS. */
    body {
      background: var(--ds-bg-base);
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
    }

    #app-layout {
      display: flex;
      height: 100vh;
      padding: var(--ds-space-sm);
      gap: var(--ds-space-sm);
      box-sizing: border-box;
    }

    main {
      flex: 1;
      min-width: 0;
      display: flex;
      overflow: hidden;
      position: relative; /* anchors the comment-mode toggle */
    }

    #md-viewer-mount {
      flex: 1;
      min-width: 0;
      overflow-y: auto;
      padding: 2rem 3rem;
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

    /* Same story for form controls: the host's layered defaults paint every
       BUTTON with var(--vscode-button-background) (a light fill) plus its own
       padding/radius/font. The design system's buttons are transparent icon
       targets — .ds-header-action in particular never declares a background,
       so without this reset it renders as a white box. Class selectors in the
       vendored CSS out-specify these bare element rules, so the ones that do
       declare a background (.ds-icon-action-btn, .ds-btn-primary) still win. */
    button,
    textarea,
    input {
      background: none;
      border: none;
      border-radius: 0;
      padding: 0;
      color: inherit;
      font: inherit;
      text-align: inherit;
      outline: none;
    }

    /* Scrollbars, copied from the app's renderer/css/layout.css — the host's
       own webview scrollbar is wider and paints a track. layout.css itself
       isn't vendored: the rest of it is app-shell layout this webview has no
       use for. */
    ::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }

    ::-webkit-scrollbar-track {
      background: transparent;
    }

    ::-webkit-scrollbar-thumb {
      background: var(--ds-white-a10);
      border-radius: 99px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: var(--ds-white-a20);
    }
  </style>
</head>
<body>
  <!-- Same shape as the app's index.html: a flex layout with the viewer on
       the left and the right sidebar as its sibling, so the panel takes real
       width instead of covering the content. -->
  <div id="app-layout">
    <main>
      <div id="md-viewer-mount">
        <div id="md-content" class="md-render-body"></div>
      </div>
    </main>
    <!-- RightSidebarComponent builds everything inside this mount itself. -->
    <div id="right-sidebar-wrap" class="ds-right-sidebar-wrap"></div>
  </div>
  <script nonce="${nonce}" src="${mermaidConfigUri}"></script>
  <script nonce="${nonce}" src="${mermaidLibUri}"></script>
  <script nonce="${nonce}" src="${codeBlocksUri}"></script>
${dsScripts}
  <script nonce="${nonce}" src="${designSystemIconsUri}"></script>
  <script nonce="${nonce}" src="${mockupImagesUri}"></script>
  <script nonce="${nonce}" src="${carouselUri}"></script>
  <script nonce="${nonce}" src="${commentAnchorUri}"></script>
  <script nonce="${nonce}" src="${scriptUri}"></script>
  <script nonce="${nonce}" src="${commentsScriptUri}"></script>
  <script nonce="${nonce}" src="${diffScriptUri}"></script>
  <script nonce="${nonce}" src="${fontsScriptUri}"></script>
</body>
</html>`;
  }
}

function activate(context) {
  context.subscriptions.push(MdPreviewEditorProvider.register(context));
  takeover.activate(context);

  const bridge = createMcpBridge({
    getWorkspaceFolders: () =>
      (vscode.workspace.workspaceFolders || []).map((f) => ({ name: f.name, fsPath: f.uri.fsPath }))
  });
  bridge
    .start()
    .then(({ httpServer, port }) => {
      context.subscriptions.push({ dispose: () => httpServer.close() });
      console.log(`MDpreview MCP bridge listening on 127.0.0.1:${port}/mcp`);

      const offerConfig = (folder) => ensureMcpConfig(folder, port).catch(() => {});
      (vscode.workspace.workspaceFolders || []).forEach(offerConfig);
      context.subscriptions.push(
        vscode.workspace.onDidChangeWorkspaceFolders((e) => e.added.forEach(offerConfig))
      );
    })
    .catch((err) => {
      // Preview + comments still work without the bridge; just say so once.
      vscode.window.showWarningMessage(`MDpreview: MCP bridge không khởi động được — ${err.message}`);
    });

  try {
    installSkill();
  } catch (err) {
    console.warn('MDpreview: không ghi được skill mdp-comments:', err.message);
  }
}

function deactivate() {}

module.exports = { activate, deactivate };

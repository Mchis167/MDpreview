const vscode = require('vscode');
const { renderWithLineNumbers } = require('./vendor/shared/md-render');
const { createCommentSession } = require('./commentSession');
const { computeDiffInfo, registerPane, getPane } = require('./diffMode');
const { createFontHost } = require('./fontHost');
const { createThemeHost } = require('./themeHost');
const { buildHtml } = require('./webviewHtml');

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
    this.theme = createThemeHost(context);
  }

  async resolveCustomTextEditor(document, webviewPanel) {
    const sharedRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'shared');
    const rendererRoot = vscode.Uri.joinPath(this.context.extensionUri, 'vendor', 'renderer');
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');

    // Ảnh dán vào comment nằm trong .mdpreview/ của workspace — cùng lý do
    // với font: ngoài danh sách này thì webview chặn.
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(document.uri);
    const commentAssetRoots = workspaceFolder
      ? [vscode.Uri.joinPath(workspaceFolder.uri, '.mdpreview')]
      : [];

    webviewPanel.webview.options = {
      enableScripts: true,
      // Font tải về nằm ngoài extension, trong globalStorage — không có
      // nó trong danh sách này thì mọi .woff2 bị webview chặn.
      localResourceRoots: [
        sharedRoot,
        rendererRoot,
        mediaRoot,
        this.fonts.resourceRoot(),
        // Ảnh nền người dùng chọn, cũng nằm trong globalStorage.
        this.theme.resourceRoot(),
        ...commentAssetRoots
      ]
    };
    webviewPanel.webview.html = buildHtml(webviewPanel.webview, sharedRoot, rendererRoot, mediaRoot);

    const render = () => {
      const html = renderWithLineNumbers(document.getText());
      webviewPanel.webview.postMessage({ type: 'render', html });
    };

    const comments = createCommentSession(document, webviewPanel);

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

    const sendTheme = async () => {
      const restored = await this.theme.restore(webviewPanel.webview);
      webviewPanel.webview.postMessage({ type: 'themeRestore', ...restored });
    };

    // Cùng khuôn với replyFont: `seq` khớp yêu cầu với lời hứa bên webview.
    const replyTheme = async (message, work) => {
      try {
        webviewPanel.webview.postMessage({ type: 'themeResult', seq: message.seq, ...(await work()) });
      } catch (err) {
        webviewPanel.webview.postMessage({ type: 'themeResult', seq: message.seq, error: err.message });
      }
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
        sendTheme();
        if (comments) comments.sendAll();
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
      if (message.type === 'accentSet') {
        return replyTheme(message, () => this.theme.setAccent(message.accent));
      }
      if (message.type === 'backgroundEnabled') {
        return replyTheme(message, () => this.theme.setBackgroundEnabled(message.enabled));
      }
      if (message.type === 'backgroundSelect') {
        return replyTheme(message, () => this.theme.selectBackground(message.name));
      }
      if (message.type === 'backgroundAdd') {
        return replyTheme(message, async () => {
          const result = await this.theme.addBackground(message.dataUrl);
          if (result.error) return { error: result.error };
          return {
            name: result.name,
            url: this.theme.toWebviewUrls(webviewPanel.webview, [result.name])[0]
          };
        });
      }
      if (message.type === 'backgroundRemove') {
        return replyTheme(message, () => this.theme.removeBackground(message.name));
      }
      if (message.type === 'openLink') return this._openLink(message.href, document);
      if (message.type === 'toggleTask') return this._toggleTask(message.line, message.checked, document);
      if (message.type === 'diffScroll') return this._syncPeerScroll(diffState.info, message.line);
      if (comments && (await comments.handleMessage(message))) return;

      // A file outside every workspace folder has no comment store, so the
      // Settings panel's Data section gets no answer from one. Settle its
      // promise with a reason rather than leaving it waiting forever.
      if (message.seq !== undefined) {
        webviewPanel.webview.postMessage({
          type: `${message.type}Result`,
          seq: message.seq,
          error: 'This file is not inside a workspace folder.'
        });
      }
    });

    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      messageSub.dispose();
      tabSub.dispose();
      paneReg.dispose();
      if (comments) comments.dispose();
    });

    render();
    pushDiff();
    if (comments) await comments.load();
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
}

module.exports = { MdPreviewEditorProvider };

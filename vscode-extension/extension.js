const vscode = require('vscode');
const path = require('path');
const crypto = require('crypto');
const { renderWithLineNumbers } = require('../shared/md-render');

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
    const sharedRoot = vscode.Uri.file(path.resolve(this.context.extensionUri.fsPath, '..', 'shared'));
    const mediaRoot = vscode.Uri.joinPath(this.context.extensionUri, 'media');

    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [sharedRoot, mediaRoot]
    };
    webviewPanel.webview.html = this._getHtml(webviewPanel.webview, sharedRoot, mediaRoot);

    const render = () => {
      const html = renderWithLineNumbers(document.getText());
      webviewPanel.webview.postMessage({ type: 'render', html });
    };

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) render();
    });
    webviewPanel.onDidDispose(() => changeSub.dispose());

    render();
  }

  _getHtml(webview, sharedRoot, mediaRoot) {
    const cssUri = webview.asWebviewUri(vscode.Uri.joinPath(sharedRoot, 'md-render', 'md-render.css'));
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js'));
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <link rel="stylesheet" href="${cssUri}">
</head>
<body>
  <div id="md-content" class="md-render-body"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function activate(context) {
  context.subscriptions.push(MdPreviewEditorProvider.register(context));
}

function deactivate() {}

module.exports = { activate, deactivate };

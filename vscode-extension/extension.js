const vscode = require('vscode');
const crypto = require('crypto');
const { renderWithLineNumbers } = require('./vendor/shared/md-render');

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

    const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() === document.uri.toString()) render();
    });
    const messageSub = webviewPanel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'openLink') this._openLink(message.href, document);
    });
    webviewPanel.onDidDispose(() => {
      changeSub.dispose();
      messageSub.dispose();
    });

    render();
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

  _getHtml(webview, sharedRoot, rendererRoot, mediaRoot) {
    const mdRenderDir = (name) => vscode.Uri.joinPath(sharedRoot, 'md-render', name);
    const cssUris = [
      webview.asWebviewUri(mdRenderDir('tokens.css')),
      webview.asWebviewUri(mdRenderDir('md-render.css')),
      webview.asWebviewUri(mdRenderDir('markdown-content.css')),
      webview.asWebviewUri(mdRenderDir('markdown-blocks.css')),
      webview.asWebviewUri(mdRenderDir('markdown-interactions.css'))
    ];
    const mermaidConfigUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'services', 'mermaid-config.js')
    );
    const mermaidLibUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'vendor', 'mermaid.min.js'));
    const codeBlocksUri = webview.asWebviewUri(
      vscode.Uri.joinPath(rendererRoot, 'js', 'utils', 'code-blocks.js')
    );
    const scriptUri = webview.asWebviewUri(vscode.Uri.joinPath(mediaRoot, 'webview.js'));
    const nonce = getNonce();

    const cssLinks = cssUris.map((uri) => `  <link rel="stylesheet" href="${uri}">`).join('\n');

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
      padding: 2rem;
      margin: 0;
    }
  </style>
</head>
<body>
  <div id="md-content" class="md-render-body"></div>
  <script nonce="${nonce}" src="${mermaidConfigUri}"></script>
  <script nonce="${nonce}" src="${mermaidLibUri}"></script>
  <script nonce="${nonce}" src="${codeBlocksUri}"></script>
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

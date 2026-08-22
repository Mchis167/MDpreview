const vscode = require('vscode');

// Offers to write/patch .mcp.json in a workspace folder so Claude Code
// picks up the mdpreview MCP server without the user editing anything by
// hand. Declines are remembered per-folder for the session so re-opening
// tabs doesn't re-prompt.

const declinedThisSession = new Set();

async function ensureMcpConfig(workspaceFolder, port) {
  if (declinedThisSession.has(workspaceFolder.uri.toString())) return;

  const mcpJsonUri = vscode.Uri.joinPath(workspaceFolder.uri, '.mcp.json');
  const url = `http://127.0.0.1:${port}/mcp`;

  let existing = {};
  let hasFile = false;
  let bytes;
  try {
    bytes = await vscode.workspace.fs.readFile(mcpJsonUri);
    hasFile = true;
  } catch (err) {
    if (err.code !== 'FileNotFound') return; // unreadable for some other reason — don't touch it
  }

  if (hasFile) {
    try {
      existing = JSON.parse(Buffer.from(bytes).toString('utf8'));
    } catch {
      return; // invalid JSON — don't clobber whatever the user has there
    }
  }

  const current = existing?.mcpServers?.mdpreview;
  if (current && current.url === url) return; // already correct

  const action = hasFile
    ? `Thêm MCP server "mdpreview" vào .mcp.json?`
    : `Tạo .mcp.json để Claude Code đọc được comment MDpreview?`;

  const choice = await vscode.window.showInformationMessage(
    `MDpreview: ${action}`,
    'Thêm',
    'Để sau'
  );

  if (choice !== 'Thêm') {
    declinedThisSession.add(workspaceFolder.uri.toString());
    return;
  }

  const merged = {
    ...existing,
    mcpServers: { ...(existing.mcpServers || {}), mdpreview: { type: 'http', url } }
  };
  await vscode.workspace.fs.writeFile(mcpJsonUri, Buffer.from(JSON.stringify(merged, null, 2) + '\n', 'utf8'));
  vscode.window.showInformationMessage('MDpreview: đã ghi .mcp.json.');
}

module.exports = { ensureMcpConfig };

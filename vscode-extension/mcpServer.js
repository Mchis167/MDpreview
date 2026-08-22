const http = require('http');
const path = require('path');
const fs = require('fs');
const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/streamableHttp.js');
const { z } = require('zod');

const BASE_PORT = 43110;
const MAX_PORT = 43119;

// In-process HTTP MCP server exposing the extension's comment store to
// Claude Code. One tool: mdp_read_comments — read-and-consume semantics
// (comments move to .archive/ in the same operation; see design spec).
//
// getWorkspaceFolders: () => [{ name, fsPath }]  — injected so this module
// stays free of the vscode API and testable outside the extension host.
function createMcpBridge({ getWorkspaceFolders }) {
  function locFor(folder, abs) {
    const rel = path.relative(folder.fsPath, abs);
    return {
      root: folder.fsPath,
      rel,
      commentsPath: path.join(folder.fsPath, '.mdpreview', 'comments', `${rel}.json`),
      archivePath: path.join(folder.fsPath, '.mdpreview', 'comments', '.archive', `${rel}.json`)
    };
  }

  // Một bridge có thể nhìn thấy nhiều workspace folder (multi-root), và một
  // đường dẫn tương đối thì khớp prefix của MỌI folder. Bản đầu return ngay
  // folder đầu tiên — Claude chạy trong repo B vẫn đọc (và TIÊU) comment của
  // repo A trùng tên file. Giờ một đường dẫn tương đối chỉ khớp folder mà
  // file .md đó thực sự tồn tại; nhiều folder cùng có → bắt nói rõ, không đoán.
  function resolveCommentsFile(file) {
    const folders = getWorkspaceFolders();

    if (path.isAbsolute(file)) {
      for (const folder of folders) {
        if (file.startsWith(folder.fsPath + path.sep)) return locFor(folder, file);
      }
      return null;
    }

    const matches = folders.filter((folder) => {
      const abs = path.join(folder.fsPath, file);
      // Vẫn phải nằm trong folder sau khi join — chặn "../" trèo ra ngoài.
      if (!abs.startsWith(folder.fsPath + path.sep)) return false;
      return fs.existsSync(abs) || fs.existsSync(path.join(folder.fsPath, '.mdpreview', 'comments', `${file}.json`));
    });

    if (matches.length === 1) return locFor(matches[0], path.join(matches[0].fsPath, file));
    if (matches.length > 1) {
      return { ambiguous: matches.map((f) => path.join(f.fsPath, file)) };
    }
    return null;
  }

  function readJson(p) {
    try {
      const parsed = JSON.parse(fs.readFileSync(p, 'utf8'));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function buildServer() {
    const server = new McpServer({ name: 'mdpreview', version: '1.0.0' });

    server.registerTool(
      'mdp_read_comments',
      {
        description:
          'Read all pending review comments the user left on a markdown file in MDpreview. ' +
          'Reading consumes them: the tool archives the comments in the same operation, so ' +
          'there is nothing to delete or resolve afterwards — just apply the requested changes. ' +
          'Pass the file path relative to the workspace root (e.g. "docs/plan.md").',
        inputSchema: { file: z.string().describe('Markdown file path, relative to the workspace root') }
      },
      async ({ file }) => {
        const loc = resolveCommentsFile(file);
        if (!loc) {
          return {
            content: [{ type: 'text', text: `File "${file}" is not inside any open workspace folder.` }],
            isError: true
          };
        }
        if (loc.ambiguous) {
          return {
            content: [{
              type: 'text',
              text:
                `"${file}" exists in more than one open workspace folder. ` +
                `Pass the absolute path instead:\n` +
                loc.ambiguous.map((p) => `  ${p}`).join('\n')
            }],
            isError: true
          };
        }

        const comments = readJson(loc.commentsPath);
        if (!comments.length) {
          return { content: [{ type: 'text', text: `No pending comments on ${loc.rel}.` }] };
        }

        const consumedAt = new Date().toISOString();
        const archive = readJson(loc.archivePath);
        archive.push(...comments.map((c) => ({ ...c, consumedAt })));
        fs.mkdirSync(path.dirname(loc.archivePath), { recursive: true });
        fs.writeFileSync(loc.archivePath, JSON.stringify(archive, null, 2));
        fs.writeFileSync(loc.commentsPath, '[]');

        const payload = comments.map((c) => ({
          text: c.text,
          selectedText: c.selectedText,
          lineStart: c.lineStart,
          lineEnd: c.lineEnd,
          context: c.context,
          createdAt: c.createdAt
        }));

        return {
          content: [
            {
              type: 'text',
              text:
                `${comments.length} comment(s) on ${loc.rel} (now consumed — no cleanup needed):\n` +
                JSON.stringify(payload, null, 2)
            }
          ]
        };
      }
    );

    return server;
  }

  // Stateless transport: each POST gets a fresh server+transport pair, per
  // the SDK's stateless Streamable HTTP pattern. Fine at this scale — the
  // only client is Claude Code calling one tool occasionally.
  async function handleRequest(req, res) {
    if (req.method !== 'POST') {
      res.writeHead(405).end();
      return;
    }
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', async () => {
      try {
        const parsed = body ? JSON.parse(body) : undefined;
        const server = buildServer();
        const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
        res.on('close', () => {
          transport.close();
          server.close();
        });
        await server.connect(transport);
        await transport.handleRequest(req, res, parsed);
      } catch (err) {
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: String(err) }, id: null }));
        }
      }
    });
  }

  function listen(port) {
    return new Promise((resolve, reject) => {
      const httpServer = http.createServer((req, res) => {
        if (req.url === '/mcp') return handleRequest(req, res);
        res.writeHead(404).end();
      });
      httpServer.once('error', reject);
      httpServer.listen(port, '127.0.0.1', () => resolve(httpServer));
    });
  }

  async function start() {
    for (let port = BASE_PORT; port <= MAX_PORT; port++) {
      try {
        const httpServer = await listen(port);
        return { httpServer, port };
      } catch (err) {
        if (err.code !== 'EADDRINUSE') throw err;
      }
    }
    throw new Error(`MDpreview MCP: no free port in ${BASE_PORT}-${MAX_PORT}`);
  }

  // resolveCommentsFile lộ ra để test khoá được hành vi chống rò chéo repo.
  return { start, resolveCommentsFile };
}

module.exports = { createMcpBridge, BASE_PORT };

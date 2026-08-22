#!/usr/bin/env node
/**
 * mdpreview-mcp — stdio MCP server bridging Claude Code to a running
 * MDpreview instance's local Express server.
 *
 * Discovers the running app via <dataDir>/runtime.json (port + pid),
 * matching the dataDir resolution used by server/index.js.
 */

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema
} = require('@modelcontextprotocol/sdk/types.js');

// ── dataDir resolution — mirrors server/index.js getDefaultDataDir() ──
function getDefaultDataDir() {
  if (process.env.MDPREVIEW_DATA_DIR) return process.env.MDPREVIEW_DATA_DIR;

  const home = os.homedir();
  let appPath = '';

  if (process.platform === 'darwin') {
    appPath = path.join(home, 'Library/Application Support/MDpreview');
  } else if (process.platform === 'win32') {
    appPath = path.join(process.env.APPDATA || path.join(home, 'AppData/Roaming'), 'MDpreview');
  } else {
    appPath = path.join(home, '.config/MDpreview');
  }

  if (fs.existsSync(appPath)) return appPath;
  return path.join(__dirname, '../data');
}

function isPidAlive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch (_e) {
    return false;
  }
}

/**
 * Reads runtime.json and validates the process is alive.
 * Returns { port } on success, or throws an Error with a friendly message.
 */
function getRuntime() {
  const dataDir = getDefaultDataDir();
  const runtimeFile = path.join(dataDir, 'runtime.json');

  if (!fs.existsSync(runtimeFile)) {
    throw new Error('MDPREVIEW_NOT_RUNNING: MDpreview does not appear to be running. Please open the MDpreview app and try again.');
  }

  let runtime;
  try {
    runtime = JSON.parse(fs.readFileSync(runtimeFile, 'utf8'));
  } catch (_e) {
    throw new Error('MDPREVIEW_NOT_RUNNING: runtime.json is unreadable. Please restart the MDpreview app.');
  }

  if (!runtime || !runtime.port || !runtime.pid) {
    throw new Error('MDPREVIEW_NOT_RUNNING: runtime.json is malformed. Please restart the MDpreview app.');
  }

  if (!isPidAlive(runtime.pid)) {
    throw new Error('MDPREVIEW_NOT_RUNNING: MDpreview is not running (stale runtime.json). Please open the MDpreview app and try again.');
  }

  return runtime;
}

function baseUrl() {
  const runtime = getRuntime();
  return `http://localhost:${runtime.port}`;
}

// Extracts the "mdp://..." substring from a possibly-larger pasted string,
// e.g. "@mdpreview docs/plan.md - 3 comments - mdp://wsid/path?c=pending"
function extractRef(input) {
  if (!input || typeof input !== 'string') return input;
  const match = input.match(/mdp:\/\/\S+/);
  return match ? match[0] : input;
}

function errorResult(message) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

function jsonResult(data) {
  return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
}

async function callApi(pathAndQuery, options = {}) {
  const url = `${baseUrl()}${pathAndQuery}`;
  const res = await fetch(url, {
    method: options.method || 'GET',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_e) {
    // Non-JSON response
  }

  if (!res.ok) {
    const code = data?.error || 'UNKNOWN_ERROR';
    const message = data?.message || `Request failed with status ${res.status}`;
    const err = new Error(`${code}: ${message}`);
    err.code = code;
    throw err;
  }

  return data;
}

const TOOLS = [
  {
    name: 'mdp_open',
    description: 'Focus the MDpreview app window and open a markdown file. Call this right after writing a markdown document.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Absolute path, or path relative to the workspace (requires wsId).' },
        wsId: { type: 'string', description: 'Workspace id (from a mdp:// ref), optional if path is absolute.' }
      },
      required: ['path']
    }
  },
  {
    name: 'mdp_get_comments',
    description: 'Fetch comments for a file using a mdp:// ref string (e.g. pasted by the user). Call this before doing anything else whenever a message contains "mdp://".',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'A mdp://<wsId>/<encodedPath>?c=pending or ?c=<commentId> ref string. May be embedded in a larger pasted line.' }
      },
      required: ['ref']
    }
  },
  {
    name: 'mdp_reply_comment',
    description: 'Reply to a specific comment thread. Call after addressing the feedback, before resolving.',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'The mdp:// ref for the file/workspace.' },
        commentId: { type: 'string', description: 'The comment id to reply to.' },
        text: { type: 'string', description: 'The reply text.' }
      },
      required: ['ref', 'commentId', 'text']
    }
  },
  {
    name: 'mdp_resolve_comment',
    description: 'Mark a comment thread as resolved. Call after replying, once the feedback has been addressed.',
    inputSchema: {
      type: 'object',
      properties: {
        ref: { type: 'string', description: 'The mdp:// ref for the file/workspace.' },
        commentId: { type: 'string', description: 'The comment id to resolve.' }
      },
      required: ['ref', 'commentId']
    }
  }
];

async function handleToolCall(name, args) {
  try {
    switch (name) {
      case 'mdp_open': {
        const { path: p, wsId } = args || {};
        if (!p) return errorResult('BAD_REF: Missing "path"');
        const data = await callApi('/api/mcp/open', { method: 'POST', body: { path: p, wsId } });
        return jsonResult(data);
      }

      case 'mdp_get_comments': {
        const ref = extractRef(args?.ref);
        if (!ref) return errorResult('BAD_REF: Missing "ref"');
        const data = await callApi(`/api/mcp/comments?ref=${encodeURIComponent(ref)}`);
        return jsonResult(data);
      }

      case 'mdp_reply_comment': {
        const ref = extractRef(args?.ref);
        const { commentId, text } = args || {};
        if (!ref || !commentId || !text) {
          return errorResult('BAD_REF: Missing "ref", "commentId", or "text"');
        }
        const data = await callApi(`/api/mcp/comments/${encodeURIComponent(commentId)}/reply`, {
          method: 'POST',
          body: { ref, text }
        });
        return jsonResult(data);
      }

      case 'mdp_resolve_comment': {
        const ref = extractRef(args?.ref);
        const { commentId } = args || {};
        if (!ref || !commentId) {
          return errorResult('BAD_REF: Missing "ref" or "commentId"');
        }
        const data = await callApi(`/api/mcp/comments/${encodeURIComponent(commentId)}/resolve`, {
          method: 'POST',
          body: { ref }
        });
        return jsonResult(data);
      }

      default:
        return errorResult(`Unknown tool: ${name}`);
    }
  } catch (err) {
    return errorResult(err.message || String(err));
  }
}

async function main() {
  const server = new Server(
    { name: 'mdpreview-mcp', version: '1.0.0' },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return handleToolCall(name, args);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('mdpreview-mcp fatal error:', err);
  process.exit(1);
});

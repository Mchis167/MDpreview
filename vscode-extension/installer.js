/* ============================================================
   installer.js — makes installing the extension the whole setup.

   On activate the extension puts three things in place, each gated
   by a version so an unchanged install is a no-op:

     ~/.mdpreview/mcp-server.js            the stdio MCP server
     ~/.claude.json  (user scope)          registers it for every project
     ~/.claude/skills/mdp-comments/        teaches Claude when to call it

   Registering at user scope is what removes .mcp.json from the repos
   entirely: one registration covers every project, and the server
   scopes itself by walking up from the file it is asked about.

   homeDir is a parameter rather than os.homedir() so this is testable
   against a temp directory instead of the developer's real home.
   ============================================================ */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

const { VERSION: SERVER_VERSION } = require('./mcpStdioServer.js');

const SERVER_SOURCE = path.join(__dirname, 'mcpStdioServer.js');
const MCP_NAME = 'mdpreview';
const SKILL_VERSION = 4;

// ── The stdio server ────────────────────────────────────────

function serverPath(homeDir) {
  return path.join(homeDir, '.mdpreview', 'mcp-server.js');
}

function installedServerVersion(dest) {
  try {
    const m = fs.readFileSync(dest, 'utf8').match(/const VERSION = '([^']+)'/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/**
 * Copy the server into the user's home. Kept outside the extension
 * directory on purpose: that path carries the extension version and
 * changes on every update, which would break the registration.
 */
function installServer(homeDir) {
  const dest = serverPath(homeDir);
  if (installedServerVersion(dest) === SERVER_VERSION) {
    return { installed: false, reason: 'up-to-date', path: dest };
  }

  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(SERVER_SOURCE, dest);
  return { installed: true, path: dest };
}

// ── User-scope registration ─────────────────────────────────

function mcpEntry(homeDir) {
  return { command: 'node', args: [serverPath(homeDir)] };
}

/** Pure: returns a new config with `name` set, everything else untouched. */
function mergeMcpServers(config, name, entry) {
  return {
    ...config,
    mcpServers: { ...(config.mcpServers || {}), [name]: entry }
  };
}

function sameEntry(a, b) {
  return Boolean(a) && a.command === b.command && JSON.stringify(a.args) === JSON.stringify(b.args);
}

function registerMcpConfigFile(configPath, entry) {
  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      // Unparseable: rewriting it would drop every other server the user has.
      return { via: 'skipped', reason: 'unparseable-config' };
    }
  }

  if (sameEntry(config.mcpServers && config.mcpServers[MCP_NAME], entry)) {
    return { via: 'already-registered', entry };
  }

  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  writeAtomic(configPath, JSON.stringify(mergeMcpServers(config, MCP_NAME, entry), null, 2) + '\n');
  return { via: 'file', entry };
}

/**
 * Register the server for Claude Code.
 *
 * The CLI is tried first because ~/.claude.json belongs to Claude Code and
 * it may be running right now — letting it write its own file is safer than
 * racing it. Direct editing is the fallback for machines without the CLI.
 */
function registerMcp(homeDir, { exec = defaultExec, homedir = os.homedir } = {}) {
  const entry = mcpEntry(homeDir);
  const configPath = path.join(homeDir, '.claude.json');

  let config = {};
  if (fs.existsSync(configPath)) {
    try {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    } catch {
      return { via: 'skipped', reason: 'unparseable-config' };
    }
  }

  if (sameEntry(config.mcpServers && config.mcpServers[MCP_NAME], entry)) {
    return { via: 'already-registered', entry };
  }

  if (homeDir === homedir()) {
    const cli = exec(
      `claude mcp add ${MCP_NAME} --scope user -- node ${JSON.stringify(entry.args[0])}`
    );
    if (cli && cli.ok) return { via: 'cli', entry };
  }

  return registerMcpConfigFile(configPath, entry);
}

/**
 * Register the server for Antigravity IDE.
 *
 * Writes to ~/.gemini/config/mcp_config.json, and also
 * ~/.gemini/antigravity-ide/mcp_config.json if the IDE directory exists.
 */
function registerAntigravityMcp(homeDir) {
  const entry = mcpEntry(homeDir);
  const configs = [
    path.join(homeDir, '.gemini', 'config', 'mcp_config.json'),
    path.join(homeDir, '.gemini', 'antigravity-ide', 'mcp_config.json')
  ];

  let primaryResult = null;
  for (const cfg of configs) {
    if (cfg.includes('antigravity-ide') && !fs.existsSync(path.dirname(cfg))) {
      continue;
    }
    const res = registerMcpConfigFile(cfg, entry);
    if (!primaryResult) primaryResult = res;
  }

  return primaryResult || { via: 'skipped' };
}

function defaultExec(command) {
  try {
    execSync(command, { stdio: 'ignore', timeout: 15000 });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

// Temp file + rename: a half-written config would corrupt the user's settings.
function writeAtomic(dest, contents) {
  const tmp = `${dest}.mdpreview-tmp`;
  fs.writeFileSync(tmp, contents);
  fs.renameSync(tmp, dest);
}

// ── The skills and workflows ────────────────────────────────

const SKILL_MD = `---
name: mdp-comments
description: Use when the user says a markdown (.md) file has review comments / nhận xét / comment from MDpreview waiting — e.g. "đọc comment trong file X", "xử lý comment đi". Reads them via the MDpreview MCP tool.
metadata:
  mdpreview-skill-version: ${SKILL_VERSION}
---

# Đọc comment review từ MDpreview

Người dùng review file markdown trong MDpreview (VSCode extension) và để lại
comment. Khi họ bảo file nào đó "có comment", làm như sau:

1. Nếu không chắc file nào có comment, gọi \`mdp_list_pending\` (không tham số
   hoặc truyền \`workspace\` nếu không chạy ở gốc repo) — nó liệt kê mọi file
   còn comment chờ xử lý kèm số lượng.
2. Gọi tool MCP \`mdp_read_comments\` của server \`mdpreview\`, truyền đường dẫn
   file — tương đối so với thư mục đang làm việc, hoặc tuyệt đối. Đọc KHÔNG
   làm mất comment; mỗi comment có \`id\` ổn định.
3. Áp dụng các thay đổi được yêu cầu vào file. Mỗi comment nhắm vào đúng đoạn
   \`selectedText\` của nó. Nếu có ảnh đính kèm trong \`images\`, đọc các file
   ảnh đó để nắm rõ vấn đề trực quan.
4. Sau khi xử lý xong comment nào, gọi \`mdp_resolve_comments\` với \`ids\` của
   những comment ĐÃ xử lý. Comment còn cần người dùng quyết định thì ĐỂ MỞ
   (không resolve) và nói rõ trong câu trả lời.

Lưu ý:

- KHÔNG tự đi tìm file trong \`.mdpreview/comments/\` — luôn đi qua tool.
- Tool trả "No pending comments" nghĩa là comment đã được resolve trước đó
  hoặc chưa có — hỏi lại người dùng thay vì đoán.
- Nếu tool báo không tìm được project root, truyền đường dẫn tuyệt đối hoặc
  truyền tham số "workspace".
`;

const WORKFLOW_MD = `---
description: Đọc và xử lý review comments từ MDpreview
---

<!-- mdpreview-workflow-version: ${SKILL_VERSION} -->
# MDpreview Comments Workflow

Đọc và xử lý các nhận xét (review comments) do người dùng để lại trên file Markdown trong MDpreview.

## Quy trình xử lý:

1. **Kiểm tra comments chờ xử lý**:
   - Gọi tool MCP \`mdp_list_pending\` để xem danh sách các file có comment.
   - Có thể truyền thêm tham số \`workspace\` nếu đang chạy ngoài thư mục gốc dự án.
2. **Đọc chi tiết comments**:
   - Gọi tool MCP \`mdp_read_comments\` với đường dẫn file \`file\` (tương đối hoặc tuyệt đối).
   - Mỗi comment mang một \`id\` ổn định và nhắm vào đoạn \`selectedText\`.
   - Nếu comment có danh sách \`images\`, hãy đọc các ảnh để nắm rõ vấn đề trực quan.
3. **Áp dụng các thay đổi**:
   - Chỉnh sửa nội dung file Markdown theo đúng yêu cầu nhận xét.
4. **Đóng (Resolve) comments**:
   - Gọi tool MCP \`mdp_resolve_comments\` với danh sách \`ids\` của những comment đã giải quyết xong.
   - Những nhận xét còn cần người dùng quyết định thì ĐỂ MỞ và thông báo trong câu trả lời.
`;

function installSkillTo(skillDir) {
  const skillPath = path.join(skillDir, 'SKILL.md');

  try {
    const m = fs.readFileSync(skillPath, 'utf8').match(/mdpreview-skill-version:\s*(\d+)/);
    if (m && parseInt(m[1], 10) >= SKILL_VERSION) return { installed: false, reason: 'up-to-date', path: skillPath };
  } catch {
    // not installed yet
  }

  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(skillPath, SKILL_MD);
  return { installed: true, path: skillPath };
}

function installSkill(homeDir) {
  return installSkillTo(path.join(homeDir, '.claude', 'skills', 'mdp-comments'));
}

function installAntigravitySkill(homeDir) {
  return installSkillTo(path.join(homeDir, '.gemini', 'config', 'skills', 'mdp-comments'));
}

function installAntigravityWorkflow(homeDir) {
  const dirs = [
    path.join(homeDir, '.gemini', 'antigravity-ide', 'global_workflows'),
    path.join(homeDir, '.gemini', 'antigravity', 'global_workflows')
  ];

  let primaryResult = null;
  for (const workflowDir of dirs) {
    if (workflowDir.endsWith('/antigravity/global_workflows') && !fs.existsSync(path.dirname(workflowDir))) {
      continue;
    }
    const workflowPath = path.join(workflowDir, 'mdp-comments.md');
    try {
      const m = fs.readFileSync(workflowPath, 'utf8').match(/mdpreview-workflow-version:\s*(\d+)/);
      if (m && parseInt(m[1], 10) >= SKILL_VERSION) {
        if (!primaryResult) primaryResult = { installed: false, reason: 'up-to-date', path: workflowPath };
        continue;
      }
    } catch {
      // not installed yet
    }

    fs.mkdirSync(workflowDir, { recursive: true });
    fs.writeFileSync(workflowPath, WORKFLOW_MD);
    if (!primaryResult) primaryResult = { installed: true, path: workflowPath };
  }

  return primaryResult || { installed: false, reason: 'skipped' };
}

// ── Entry point ─────────────────────────────────────────────

/**
 * Each step is independent: a failure in one must not stop the others,
 * and none of them is worth taking the extension down for.
 */
function installAll(homeDir = os.homedir()) {
  const results = {};
  for (const [key, step] of [
    ['server', () => installServer(homeDir)],
    ['mcp', () => registerMcp(homeDir)],
    ['skill', () => installSkill(homeDir)],
    ['antigravityMcp', () => registerAntigravityMcp(homeDir)],
    ['antigravitySkill', () => installAntigravitySkill(homeDir)],
    ['antigravityWorkflow', () => installAntigravityWorkflow(homeDir)]
  ]) {
    try {
      results[key] = step();
    } catch (err) {
      results[key] = { error: err.message };
      console.warn(`MDpreview installer (${key}):`, err.message);
    }
  }
  return results;
}

module.exports = {
  installAll,
  installServer,
  registerMcp,
  installSkill,
  registerAntigravityMcp,
  installAntigravitySkill,
  installAntigravityWorkflow,
  mergeMcpServers,
  serverPath,
  SERVER_VERSION,
  SKILL_VERSION,
  MCP_NAME
};

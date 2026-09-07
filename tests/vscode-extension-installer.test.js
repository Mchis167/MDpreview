import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const installer = require('../vscode-extension/installer.js');
const {
  installServer,
  installSkill,
  registerMcp,
  registerAntigravityMcp,
  installAntigravitySkill,
  installAntigravityWorkflow,
  installAll,
  mergeMcpServers,
  SERVER_VERSION
} = installer;

let home;
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

beforeEach(() => {
  home = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-home-'));
});

afterEach(() => {
  fs.rmSync(home, { recursive: true, force: true });
});

describe('installServer', () => {
  const serverPath = () => path.join(home, '.mdpreview', 'mcp-server.js');

  it('copies the server next to nothing on a clean machine', () => {
    const res = installServer(home);
    expect(res.installed).toBe(true);
    expect(fs.readFileSync(serverPath(), 'utf8')).toContain('mdp_read_comments');
  });

  it('produces a file that runs on its own, with no node_modules', () => {
    installServer(home);
    // The point of the zero-dependency rule: nothing to resolve but node builtins.
    const code = fs.readFileSync(serverPath(), 'utf8');
    const requires = [...code.matchAll(/require\('([^']+)'\)/g)].map((m) => m[1]);
    expect(requires.every((r) => ['fs', 'path', 'crypto'].includes(r))).toBe(true);
  });

  it('leaves an up-to-date copy alone', () => {
    installServer(home);
    fs.appendFileSync(serverPath(), '\n// local marker\n');

    const res = installServer(home);
    expect(res.installed).toBe(false);
    expect(fs.readFileSync(serverPath(), 'utf8')).toContain('local marker');
  });

  it('replaces an older copy', () => {
    fs.mkdirSync(path.dirname(serverPath()), { recursive: true });
    fs.writeFileSync(serverPath(), "const VERSION = '0.0.1';\n// ancient\n");

    const res = installServer(home);
    expect(res.installed).toBe(true);
    expect(fs.readFileSync(serverPath(), 'utf8')).not.toContain('ancient');
  });

  it('replaces a copy with no version marker at all', () => {
    fs.mkdirSync(path.dirname(serverPath()), { recursive: true });
    fs.writeFileSync(serverPath(), '// junk');
    expect(installServer(home).installed).toBe(true);
  });
});

describe('mergeMcpServers', () => {
  const entry = { command: 'node', args: ['/home/u/.mdpreview/mcp-server.js'] };

  it('adds the entry to an empty config', () => {
    expect(mergeMcpServers({}, 'mdpreview', entry).mcpServers.mdpreview).toEqual(entry);
  });

  it('keeps every other server and every unrelated key', () => {
    const before = { numStartups: 7, mcpServers: { figma: { command: 'x' } } };
    const after = mergeMcpServers(before, 'mdpreview', entry);

    expect(after.numStartups).toBe(7);
    expect(after.mcpServers.figma).toEqual({ command: 'x' });
    expect(after.mcpServers.mdpreview).toEqual(entry);
  });

  it('does not mutate the config it was given', () => {
    const before = { mcpServers: { figma: { command: 'x' } } };
    mergeMcpServers(before, 'mdpreview', entry);
    expect(before.mcpServers.mdpreview).toBeUndefined();
  });

  it('overwrites a stale entry of the same name', () => {
    const before = { mcpServers: { mdpreview: { type: 'http', url: 'http://127.0.0.1:43110/mcp' } } };
    const after = mergeMcpServers(before, 'mdpreview', entry);
    expect(after.mcpServers.mdpreview).toEqual(entry);
  });
});

describe('registerMcp', () => {
  const configPath = () => path.join(home, '.claude.json');

  // homedir is injected so "this really is the user's home" can be simulated.
  const realHome = { homedir: () => home };

  it('prefers the claude CLI when it is available', () => {
    const exec = vi.fn(() => ({ ok: true }));
    const res = registerMcp(home, { ...realHome, exec });

    expect(res.via).toBe('cli');
    expect(exec.mock.calls[0][0]).toContain('claude mcp add');
    expect(exec.mock.calls[0][0]).toContain('--scope user');
    // The CLI owns the file — we must not have touched it ourselves.
    expect(fs.existsSync(configPath())).toBe(false);
  });

  it('never runs the CLI against a home that is not the real one', () => {
    // `claude mcp add --scope user` writes the real user's home whatever we
    // pass it, so running it here would edit a config we were not aiming at.
    const exec = vi.fn(() => ({ ok: true }));
    const res = registerMcp(home, { exec, homedir: () => '/some/other/home' });

    expect(exec).not.toHaveBeenCalled();
    expect(res.via).toBe('file');
  });

  it('does not call the CLI again once the entry is already there', () => {
    // `claude mcp add` fails on a duplicate name, which used to drop every
    // later activate into a pointless rewrite of the config.
    registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });
    const exec = vi.fn(() => ({ ok: true }));

    expect(registerMcp(home, { ...realHome, exec }).via).toBe('already-registered');
    expect(exec).not.toHaveBeenCalled();
  });

  it('treats the CLI\'s own entry shape as already registered', () => {
    // The CLI writes {type:'stdio', command, args, env}; ours writes
    // {command, args}. Same server — must not be rewritten every activate.
    fs.writeFileSync(configPath(), JSON.stringify({
      mcpServers: {
        mdpreview: { type: 'stdio', command: 'node', args: [path.join(home, '.mdpreview', 'mcp-server.js')], env: {} }
      }
    }));
    expect(registerMcp(home, { ...realHome, exec: () => ({ ok: true }) }).via).toBe('already-registered');
  });

  it('falls back to editing ~/.claude.json when the CLI is missing', () => {
    fs.writeFileSync(configPath(), JSON.stringify({ numStartups: 3, mcpServers: { figma: { command: 'f' } } }, null, 2));
    const res = registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });

    expect(res.via).toBe('file');
    const cfg = readJson(configPath());
    expect(cfg.numStartups).toBe(3);
    expect(cfg.mcpServers.figma).toEqual({ command: 'f' });
    expect(cfg.mcpServers.mdpreview.args[0]).toBe(path.join(home, '.mdpreview', 'mcp-server.js'));
  });

  it('creates ~/.claude.json when there is none', () => {
    registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });
    expect(readJson(configPath()).mcpServers.mdpreview).toBeTruthy();
  });

  it('refuses to touch a ~/.claude.json it cannot parse', () => {
    // Clobbering a corrupt config would lose every other server the user has.
    fs.writeFileSync(configPath(), '{ broken');
    const res = registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });

    expect(res.via).toBe('skipped');
    expect(fs.readFileSync(configPath(), 'utf8')).toBe('{ broken');
  });

  it('is a no-op when the entry is already correct', () => {
    registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });
    const before = fs.statSync(configPath()).mtimeMs;

    const res = registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });
    expect(res.via).toBe('already-registered');
    expect(fs.statSync(configPath()).mtimeMs).toBe(before);
  });

  it('repairs a leftover http entry from the old bridge', () => {
    fs.writeFileSync(
      configPath(),
      JSON.stringify({ mcpServers: { mdpreview: { type: 'http', url: 'http://127.0.0.1:43111/mcp' } } })
    );
    registerMcp(home, { ...realHome, exec: () => ({ ok: false }) });

    const entry = readJson(configPath()).mcpServers.mdpreview;
    expect(entry.type).toBeUndefined();
    expect(entry.command).toBe('node');
  });
});

describe('installSkill', () => {
  const skillPath = () => path.join(home, '.claude', 'skills', 'mdp-comments', 'SKILL.md');

  it('writes the skill on a clean machine', () => {
    expect(installSkill(home).installed).toBe(true);
    expect(fs.readFileSync(skillPath(), 'utf8')).toContain('mdp_read_comments');
  });

  it('leaves an up-to-date copy alone', () => {
    installSkill(home);
    expect(installSkill(home).installed).toBe(false);
  });

  it('replaces an older copy', () => {
    fs.mkdirSync(path.dirname(skillPath()), { recursive: true });
    fs.writeFileSync(skillPath(), '---\nmetadata:\n  mdpreview-skill-version: 0\n---\nold');
    expect(installSkill(home).installed).toBe(true);
    expect(fs.readFileSync(skillPath(), 'utf8')).not.toContain('old');
  });

  it('no longer tells the model to pass a workspace-relative path', () => {
    // Scope now comes from the server walking up from the file itself.
    installSkill(home);
    expect(fs.readFileSync(skillPath(), 'utf8')).not.toMatch(/workspace root/i);
  });
});

describe('versioning', () => {
  it('takes the server version from the server file itself', () => {
    const code = fs.readFileSync(path.join(__dirname, '..', 'vscode-extension', 'mcpStdioServer.js'), 'utf8');
    expect(code).toContain(`const VERSION = '${SERVER_VERSION}'`);
  });
});

describe('registerAntigravityMcp', () => {
  const globalCfgPath = () => path.join(home, '.gemini', 'config', 'mcp_config.json');
  const ideCfgPath = () => path.join(home, '.gemini', 'antigravity-ide', 'mcp_config.json');

  it('registers in ~/.gemini/config/mcp_config.json on a clean machine', () => {
    const res = registerAntigravityMcp(home);
    expect(res.via).toBe('file');
    const cfg = readJson(globalCfgPath());
    expect(cfg.mcpServers.mdpreview.command).toBe('node');
    expect(cfg.mcpServers.mdpreview.args[0]).toBe(path.join(home, '.mdpreview', 'mcp-server.js'));
  });

  it('also registers in ~/.gemini/antigravity-ide/mcp_config.json if the IDE folder exists', () => {
    fs.mkdirSync(path.dirname(ideCfgPath()), { recursive: true });
    registerAntigravityMcp(home);

    const ideCfg = readJson(ideCfgPath());
    expect(ideCfg.mcpServers.mdpreview.command).toBe('node');
  });

  it('is a no-op when already registered', () => {
    registerAntigravityMcp(home);
    const res = registerAntigravityMcp(home);
    expect(res.via).toBe('already-registered');
  });
});

describe('installAntigravitySkill', () => {
  const skillPath = () => path.join(home, '.gemini', 'config', 'skills', 'mdp-comments', 'SKILL.md');

  it('writes the skill in ~/.gemini/config/skills/mdp-comments/', () => {
    const res = installAntigravitySkill(home);
    expect(res.installed).toBe(true);
    expect(fs.readFileSync(skillPath(), 'utf8')).toContain('name: mdp-comments');
  });

  it('leaves an up-to-date copy alone', () => {
    installAntigravitySkill(home);
    expect(installAntigravitySkill(home).installed).toBe(false);
  });
});

describe('installAntigravityWorkflow', () => {
  const workflowPath = () => path.join(home, '.gemini', 'antigravity-ide', 'global_workflows', 'mdp-comments.md');

  it('writes global workflow for Antigravity slash command', () => {
    const res = installAntigravityWorkflow(home);
    expect(res.installed).toBe(true);
    const content = fs.readFileSync(workflowPath(), 'utf8');
    expect(content).toContain('description:');
    expect(content).toContain('MDpreview Comments Workflow');
  });

  it('leaves an up-to-date copy alone', () => {
    installAntigravityWorkflow(home);
    expect(installAntigravityWorkflow(home).installed).toBe(false);
  });
});

describe('installAll', () => {
  it('runs all installation steps and returns their results', () => {
    const res = installAll(home);
    expect(res.server.installed).toBe(true);
    expect(res.mcp.via).toBe('file');
    expect(res.skill.installed).toBe(true);
    expect(res.antigravityMcp.via).toBe('file');
    expect(res.antigravitySkill.installed).toBe(true);
    expect(res.antigravityWorkflow.installed).toBe(true);
  });
});

describe('mcpStdioServer with workspace parameter', () => {
  const mcpServer = require('../vscode-extension/mcpStdioServer.js');
  let workspaceDir;

  beforeEach(() => {
    workspaceDir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-ws-'));
    fs.mkdirSync(path.join(workspaceDir, '.git'));
    const storeDir = path.join(workspaceDir, '.mdpreview', 'comments');
    fs.mkdirSync(storeDir, { recursive: true });
    fs.writeFileSync(
      path.join(storeDir, 'test.md.json'),
      JSON.stringify([{ id: 'c1', text: 'fix this', selectedText: 'foo', createdAt: '2026-09-07T00:00:00Z' }])
    );
  });

  afterEach(() => {
    fs.rmSync(workspaceDir, { recursive: true, force: true });
  });

  it('resolves target with workspace when cwd is outside project', () => {
    const outsideCwd = home;
    const target = mcpServer.resolveTarget('test.md', outsideCwd, workspaceDir);
    expect(target.error).toBeUndefined();
    expect(target.root).toBe(workspaceDir);
    expect(target.rel).toBe('test.md');
  });

  it('lists pending comments with workspace when cwd has no store or git', () => {
    const outsideCwd = home;
    const result = mcpServer.listPending(outsideCwd, workspaceDir);
    expect(result.error).toBeUndefined();
    expect(result.files.length).toBe(1);
    expect(result.files[0].file).toBe('test.md');
  });

  it('allows callTool to use workspace argument', () => {
    const outsideCwd = home;
    const reply = mcpServer.callTool('mdp_list_pending', { workspace: workspaceDir }, outsideCwd);
    expect(reply.content[0].text).toContain('1 file(s) with pending comments');
  });
});

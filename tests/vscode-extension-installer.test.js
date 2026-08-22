import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

const installer = require('../vscode-extension/installer.js');
const { installServer, installSkill, registerMcp, mergeMcpServers, SERVER_VERSION } = installer;

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
    expect(requires.every((r) => ['fs', 'path'].includes(r))).toBe(true);
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

  it('prefers the claude CLI when it is available', () => {
    const exec = vi.fn(() => ({ ok: true }));
    const res = registerMcp(home, { exec });

    expect(res.via).toBe('cli');
    expect(exec.mock.calls[0][0]).toContain('claude mcp add');
    expect(exec.mock.calls[0][0]).toContain('--scope user');
    // The CLI owns the file — we must not have touched it ourselves.
    expect(fs.existsSync(configPath())).toBe(false);
  });

  it('falls back to editing ~/.claude.json when the CLI is missing', () => {
    fs.writeFileSync(configPath(), JSON.stringify({ numStartups: 3, mcpServers: { figma: { command: 'f' } } }, null, 2));
    const res = registerMcp(home, { exec: () => ({ ok: false }) });

    expect(res.via).toBe('file');
    const cfg = readJson(configPath());
    expect(cfg.numStartups).toBe(3);
    expect(cfg.mcpServers.figma).toEqual({ command: 'f' });
    expect(cfg.mcpServers.mdpreview.args[0]).toBe(path.join(home, '.mdpreview', 'mcp-server.js'));
  });

  it('creates ~/.claude.json when there is none', () => {
    registerMcp(home, { exec: () => ({ ok: false }) });
    expect(readJson(configPath()).mcpServers.mdpreview).toBeTruthy();
  });

  it('refuses to touch a ~/.claude.json it cannot parse', () => {
    // Clobbering a corrupt config would lose every other server the user has.
    fs.writeFileSync(configPath(), '{ broken');
    const res = registerMcp(home, { exec: () => ({ ok: false }) });

    expect(res.via).toBe('skipped');
    expect(fs.readFileSync(configPath(), 'utf8')).toBe('{ broken');
  });

  it('is a no-op when the entry is already correct', () => {
    registerMcp(home, { exec: () => ({ ok: false }) });
    const before = fs.statSync(configPath()).mtimeMs;

    const res = registerMcp(home, { exec: () => ({ ok: false }) });
    expect(res.via).toBe('already-registered');
    expect(fs.statSync(configPath()).mtimeMs).toBe(before);
  });

  it('repairs a leftover http entry from the old bridge', () => {
    fs.writeFileSync(
      configPath(),
      JSON.stringify({ mcpServers: { mdpreview: { type: 'http', url: 'http://127.0.0.1:43111/mcp' } } })
    );
    registerMcp(home, { exec: () => ({ ok: false }) });

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

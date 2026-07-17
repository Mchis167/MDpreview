import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import WikiIndexer from '../server/services/wiki-indexer';

const TEST_VAULT = path.join(__dirname, 'temp-wiki-vault');

describe('WikiIndexer', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_VAULT, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
  });

  it('should extract IDs and relations from frontmatter using gray-matter', async () => {
    const fileA = path.join(TEST_VAULT, 'fileA.md');
    fs.writeFileSync(fileA, `---
id: doc-a
flows: [flow-1, flow-2]
---
# Doc A`, 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const index = await indexer.build();

    expect(index.id_to_path['doc-a']).toBe('fileA.md');
    expect(index.path_to_id['fileA.md']).toBe('doc-a');
    expect(index.outgoing['fileA.md'].flows).toContain('flow-1');
    expect(index.outgoing['fileA.md'].flows).toContain('flow-2');
  });

  it('should extract mentions from body content', async () => {
    const fileA = path.join(TEST_VAULT, 'fileA.md');
    fs.writeFileSync(fileA, `---
id: doc-a
---
Mentioning \`doc-b\` here.`, 'utf8');

    const fileB = path.join(TEST_VAULT, 'fileB.md');
    fs.writeFileSync(fileB, `---
id: doc-b
---
# Doc B`, 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const index = await indexer.build();

    expect(index.outgoing['fileA.md'].generic).toContain('doc-b');
  });

  it('should resolve relative markdown links to IDs', async () => {
    const dir1 = path.join(TEST_VAULT, 'dir1');
    fs.mkdirSync(dir1);

    const fileA = path.join(dir1, 'fileA.md');
    fs.writeFileSync(fileA, `---
id: doc-a
---
Link to [Doc B](../fileB.md)`, 'utf8');

    const fileB = path.join(TEST_VAULT, 'fileB.md');
    fs.writeFileSync(fileB, `---
id: doc-b
---
# Doc B`, 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const index = await indexer.build();

    expect(index.outgoing['dir1/fileA.md'].generic).toContain('doc-b');
  });

  it('should build correct backlinks', async () => {
    const fileA = path.join(TEST_VAULT, 'fileA.md');
    fs.writeFileSync(fileA, `---
id: doc-a
flows: [doc-b]
---
# Doc A`, 'utf8');

    const fileB = path.join(TEST_VAULT, 'fileB.md');
    fs.writeFileSync(fileB, `---
id: doc-b
---
# Doc B`, 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const index = await indexer.build();

    // doc-b is referenced by doc-a
    expect(index.backlinks['doc-b']).toContain('doc-a');
  });

  it('should perform atomic write and backup', async () => {
    const fileA = path.join(TEST_VAULT, 'fileA.md');
    fs.writeFileSync(fileA, '---\nid: doc-a\n---\n# A', 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    await indexer.build();

    const indexPath = path.join(TEST_VAULT, '.wiki-index.json');
    expect(fs.existsSync(indexPath)).toBe(true);

    // Build again to trigger backup
    await indexer.build();
    const backupPath = path.join(TEST_VAULT, '.wiki-index.json.bak');
    expect(fs.existsSync(backupPath)).toBe(true);
  });

  it('should ignore node_modules and .git', async () => {
    const nodeModules = path.join(TEST_VAULT, 'node_modules');
    fs.mkdirSync(nodeModules);
    fs.writeFileSync(path.join(nodeModules, 'ignored.md'), '---\nid: ignored\n---\n# Ignored', 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const index = await indexer.build();

    expect(index.id_to_path['ignored']).toBeUndefined();
  });

  // ── all_paths ──────────────────────────────────────────────────────────────

  it('should track all_paths for files without frontmatter id', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'no-id.md'), '# No ID here', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'with-id.md'), '---\nid: with-id\n---\n# With ID', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.all_paths).toContain('no-id.md');
    expect(index.all_paths).toContain('with-id.md');
  });

  // ── aliases ────────────────────────────────────────────────────────────────

  it('should map aliases to file path', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'protocol.md'), `---
id: session-protocol
aliases: [protocol, session]
---
# Protocol`, 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.alias_to_path['protocol']).toBe('protocol.md');
    expect(index.alias_to_path['session']).toBe('protocol.md');
  });

  it('should support single string alias (not array)', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'guide.md'), `---
aliases: quickstart
---
# Guide`, 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.alias_to_path['quickstart']).toBe('guide.md');
  });

  // ── [[wikilink]] extraction ────────────────────────────────────────────────

  it('should extract [[wikilink]] mentions as outgoing generic', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See [[target.md]] for details.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('target.md');
  });

  it('should extract [[wikilink|display]] ignoring display text', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See [[target.md|click here]].', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('target.md');
  });

  it('should resolve [[wikilink]] via frontmatter id', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '---\nid: my-target\n---\n# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See [[my-target]].', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('target.md');
  });

  it('should resolve [[wikilink]] via alias', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '---\naliases: [tgt]\n---\n# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See [[tgt]].', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('target.md');
  });

  // ── codespan path extraction ───────────────────────────────────────────────

  it('should extract `path/to/file.md` codespan as outgoing generic', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'docs'));
    fs.writeFileSync(path.join(TEST_VAULT, 'docs/guide.md'), '# Guide', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'Read `docs/guide.md` first.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('docs/guide.md');
  });

  it('should NOT match multiline codespan — path on next line still resolved', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '# Target', 'utf8');
    // Non-path codespan (no .md) on line 1, then real path codespan on line 2
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'),
      '`non path content`\nRead `target.md`.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toContain('target.md');
  });

  it('should NOT match codespan without .md extension', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'),
      '`01_App ← Entry point`\n`touch./`\n`ai-chat-upgrade`', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toHaveLength(0);
  });

  it('should skip codespan with spaces (not a file path)', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'Run `npm install` first.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toHaveLength(0);
  });

  it('should skip codespan with placeholder {variable}', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See `sprints/{sprint}/log.md`.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['source.md'].generic).toHaveLength(0);
  });

  it('should resolve codespan filename-only with nearest-first when ambiguous', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'docs'));
    fs.mkdirSync(path.join(TEST_VAULT, 'docs/sub'));
    fs.writeFileSync(path.join(TEST_VAULT, 'docs/context.md'), '# Context A', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'docs/sub/context.md'), '# Context B', 'utf8');
    // source is in docs/ → nearest match is docs/context.md
    fs.writeFileSync(path.join(TEST_VAULT, 'docs/source.md'), 'Read `context.md`.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.outgoing['docs/source.md'].generic).toContain('docs/context.md');
    expect(index.outgoing['docs/source.md'].generic).not.toContain('docs/sub/context.md');
  });

  // ── backlinks normalization ────────────────────────────────────────────────

  it('should build backlinks for files without frontmatter id (path-based)', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '# Target (no id)', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'Read `target.md`.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.backlinks['target.md']).toBeDefined();
    expect(index.backlinks['target.md']).toContain('source.md');
  });

  it('should build backlinks normalized to id when target has frontmatter id', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '---\nid: my-target\n---\n# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'Read `target.md`.', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    // backlinks key should be the id, not the path
    expect(index.backlinks['my-target']).toBeDefined();
    expect(index.backlinks['my-target']).toContain('source.md');
    expect(index.backlinks['target.md']).toBeUndefined();
  });

  it('should show backlinks from [[wikilink]] mentions', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, 'target.md'), '# Target', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'source.md'), 'See [[target.md]].', 'utf8');

    const index = await new WikiIndexer(TEST_VAULT).build();

    expect(index.backlinks['target.md']).toContain('source.md');
  });
});

// ── Agent Index Export ─────────────────────────────────────────────────────

describe('WikiIndexer.buildAgentIndex()', () => {
  beforeEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_VAULT, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
  });

  it('should return null and skip when no config file exists', async () => {
    const indexer = new WikiIndexer(TEST_VAULT);
    const result = await indexer.buildAgentIndex();
    expect(result).toBeNull();
  });

  it('should build knowledge section via frontmatter.name', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge'));
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/auth.md'), `---\nname: Authentication\n---\n# Auth`, 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/deploy.md'), `---\nname: Deployment\n---\n# Deploy`, 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      knowledge: { source: 'knowledge/', key: 'frontmatter.name' }
    }), 'utf8');

    const indexer = new WikiIndexer(TEST_VAULT);
    const result = await indexer.buildAgentIndex();

    expect(result.knowledge['Authentication']).toBe('knowledge/auth.md');
    expect(result.knowledge['Deployment']).toBe('knowledge/deploy.md');
  });

  it('should skip files without the target frontmatter field', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge'));
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/no-name.md'), '# No name field', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      knowledge: { source: 'knowledge/', key: 'frontmatter.name' }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(Object.keys(result.knowledge)).toHaveLength(0);
  });

  it('should build sprints section via folder_name with brief.md priority', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'sprints/active/sprint-01'), { recursive: true });
    fs.mkdirSync(path.join(TEST_VAULT, 'sprints/active/sprint-02'), { recursive: true });
    fs.writeFileSync(path.join(TEST_VAULT, 'sprints/active/sprint-01/brief.md'), '# Sprint 01 Brief', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'sprints/active/sprint-02/plan.md'), '# Sprint 02 Plan', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      sprints: { source: 'sprints/active/', key: 'folder_name', file: ['brief.md', 'plan.md'] }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(result.sprints['sprint-01']).toBe('sprints/active/sprint-01/brief.md');
    expect(result.sprints['sprint-02']).toBe('sprints/active/sprint-02/plan.md');
  });

  it('should skip folder with no matching file candidates', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'sprints/active/empty-sprint'), { recursive: true });
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      sprints: { source: 'sprints/active/', key: 'folder_name', file: ['brief.md'] }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(result.sprints['empty-sprint']).toBeUndefined();
  });

  it('should produce empty section when source folder does not exist', async () => {
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      missing: { source: 'does-not-exist/', key: 'frontmatter.name' }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(result.missing).toEqual({});
  });

  it('should write .wiki-agent-index.json atomically', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge'));
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/doc.md'), '---\nname: Doc\n---\n# Doc', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      knowledge: { source: 'knowledge/', key: 'frontmatter.name' }
    }), 'utf8');

    await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    const outPath = path.join(TEST_VAULT, '.wiki-agent-index.json');
    expect(fs.existsSync(outPath)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(outPath, 'utf8'));
    expect(saved.knowledge['Doc']).toBe('knowledge/doc.md');
    expect(saved.generated_at).toBeDefined();
  });

  it('should ignore legacy/ and .claude/ folders in frontmatter scan', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge/legacy'), { recursive: true });
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge/.claude'), { recursive: true });
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/legacy/old.md'), '---\nname: OldDoc\n---\n# Old', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/.claude/config.md'), '---\nname: Config\n---\n# Cfg', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      knowledge: { source: 'knowledge/', key: 'frontmatter.name' }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(result.knowledge['OldDoc']).toBeUndefined();
    expect(result.knowledge['Config']).toBeUndefined();
  });

  it('should support multiple sections in one config', async () => {
    fs.mkdirSync(path.join(TEST_VAULT, 'knowledge'));
    fs.mkdirSync(path.join(TEST_VAULT, 'sprints/active/s1'), { recursive: true });
    fs.writeFileSync(path.join(TEST_VAULT, 'knowledge/k.md'), '---\nname: K\n---', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, 'sprints/active/s1/brief.md'), '# S1', 'utf8');
    fs.writeFileSync(path.join(TEST_VAULT, '.wiki-agent-config.json'), JSON.stringify({
      knowledge: { source: 'knowledge/', key: 'frontmatter.name' },
      sprints: { source: 'sprints/active/', key: 'folder_name', file: ['brief.md'] }
    }), 'utf8');

    const result = await new WikiIndexer(TEST_VAULT).buildAgentIndex();

    expect(result.knowledge['K']).toBe('knowledge/k.md');
    expect(result.sprints['s1']).toBe('sprints/active/s1/brief.md');
  });
});

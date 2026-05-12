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
});

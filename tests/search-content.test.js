import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const { findMatches, searchWorkspace } = require('../server/routes/search.js')._internal;

describe('findMatches', () => {
  it('finds case-insensitive substring with line/column', () => {
    const matches = findMatches('Hello\nWorld of TESTING\nend', 'testing');
    expect(matches).toEqual([
      { line: 2, column: 10, excerpt: 'World of TESTING' },
    ]);
  });

  it('returns [] when no match', () => {
    expect(findMatches('abc', 'xyz')).toEqual([]);
  });

  it('caps matches per file', () => {
    const content = Array.from({ length: 20 }, () => 'needle here').join('\n');
    expect(findMatches(content, 'needle')).toHaveLength(5);
  });

  it('truncates long lines into an excerpt around the match', () => {
    const long = 'x'.repeat(200) + 'needle' + 'y'.repeat(200);
    const [m] = findMatches(long, 'needle');
    expect(m.excerpt.startsWith('…')).toBe(true);
    expect(m.excerpt.endsWith('…')).toBe(true);
    expect(m.excerpt).toContain('needle');
    expect(m.excerpt.length).toBeLessThan(150);
  });
});

describe('searchWorkspace', () => {
  let dir;

  beforeAll(async () => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-search-'));
    fs.writeFileSync(path.join(dir, 'a.md'), '# Alpha\ncontains magicword here');
    fs.mkdirSync(path.join(dir, 'sub'));
    fs.writeFileSync(path.join(dir, 'sub', 'b.md'), 'nothing');
    fs.writeFileSync(path.join(dir, 'sub', 'c.md'), 'MAGICWORD twice magicword');
    fs.writeFileSync(path.join(dir, 'not-md.txt'), 'magicword should be ignored');
    fs.mkdirSync(path.join(dir, 'node_modules'));
    fs.writeFileSync(path.join(dir, 'node_modules', 'd.md'), 'magicword excluded');
  });

  afterAll(() => fs.rmSync(dir, { recursive: true, force: true }));

  it('finds matches across nested md files only', async () => {
    const results = await searchWorkspace(dir, 'magicword');
    const paths = results.map(r => r.path).sort();
    expect(paths).toEqual(['a.md', 'sub/c.md']);
  });

  it('reports multiple matches on one line once, counts lines', async () => {
    const results = await searchWorkspace(dir, 'magicword');
    const c = results.find(r => r.path === 'sub/c.md');
    expect(c.matches).toHaveLength(1);
    expect(c.matches[0].line).toBe(1);
  });

  it('respects maxResults', async () => {
    const results = await searchWorkspace(dir, 'magicword', 1);
    expect(results).toHaveLength(1);
  });
});

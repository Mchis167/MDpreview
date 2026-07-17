/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

beforeAll(() => {
  const code = fs.readFileSync(
    path.resolve(__dirname, '../renderer/js/services/wiki-completion-service.js'),
    'utf8'
  );
  // eslint-disable-next-line no-new-func
  new Function(code)();
});

const INDEX = {
  id_to_path: { 'flow-login': 'flows/login.md' },
  alias_to_path: { 'Login Flow': 'flows/login.md' },
  all_paths: ['flows/login.md', 'notes/todo.md', 'README.md'],
};

describe('WikiCompletionService.parseWikilinkContext', () => {
  const parse = (s) => window.WikiCompletionService.parseWikilinkContext(s);

  it('detects open wikilink and query', () => {
    expect(parse('see [[log')).toEqual({ query: 'log', startColumn: 7 });
  });

  it('returns null when no [[ before cursor', () => {
    expect(parse('plain text')).toBeNull();
  });

  it('returns null when wikilink already closed', () => {
    expect(parse('see [[done]] and')).toBeNull();
  });

  it('empty query right after [[', () => {
    expect(parse('[[')).toEqual({ query: '', startColumn: 3 });
  });
});

describe('WikiCompletionService.buildSuggestions', () => {
  const build = (q, idx) => window.WikiCompletionService.buildSuggestions(q, idx);

  it('returns ids, aliases and paths for empty query', () => {
    const labels = build('', INDEX).map((s) => s.label);
    expect(labels).toContain('flow-login');
    expect(labels).toContain('Login Flow');
    expect(labels).toContain('notes/todo.md');
  });

  it('filters by substring, case-insensitive', () => {
    const labels = build('LOGIN', INDEX).map((s) => s.label);
    expect(labels).toContain('flow-login');
    expect(labels).toContain('Login Flow');
    expect(labels).toContain('flows/login.md');
    expect(labels).not.toContain('notes/todo.md');
  });

  it('ranks ids before aliases before paths', () => {
    const sorts = build('login', INDEX).map((s) => s.sortText);
    expect([...sorts].sort()).toEqual(sorts);
    expect(sorts[0].startsWith('0')).toBe(true);
  });

  it('returns [] when index is null (wiki disabled)', () => {
    expect(build('x', null)).toEqual([]);
  });

  it('dedupes identical insert targets', () => {
    const idx = { id_to_path: {}, alias_to_path: {}, all_paths: ['a.md', 'a.md'] };
    expect(build('', idx)).toHaveLength(1);
  });
});

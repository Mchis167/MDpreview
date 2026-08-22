/**
 * Baseline for server/routes/render.js's renderWithLineNumbers() BEFORE
 * extracting shared/md-render/ (see docs/superpowers/specs/
 * 2026-08-22-vscode-extension-port-design.md, phase 4/5).
 *
 * Snapshots must match byte-for-byte after phase 5's extraction —
 * this is the safety net for the highest-risk phase of the whole port,
 * since this HTML is also what comment line-anchoring depends on
 * (data-line / data-src-start / data-src-end).
 */
import { describe, it, expect } from 'vitest';
const { renderWithLineNumbers } = require('../server/routes/render.js');

const wikiIndex = {
  path_to_id: { 'docs/other.md': 'note-1' },
  id_to_path: { 'note-1': 'docs/other.md' },
  all_paths: ['docs/other.md', 'docs/plan.md'],
  alias_to_path: {}
};

describe('renderWithLineNumbers: baseline snapshots', () => {
  it('renders headings with anchors and slugified ids', () => {
    const md = '# Title One\n\n## Sub Heading Two\n\n### Third Lệvel Tiếng Việt\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders nested lists (ordered + unordered)', () => {
    const md = [
      '- item one',
      '  - nested a',
      '  - nested b',
      '- item two',
      '',
      '1. first',
      '2. second',
      '   1. nested first',
      ''
    ].join('\n');
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders a task list', () => {
    const md = '- [ ] todo one\n- [x] done one\n- [ ] todo two\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders a table', () => {
    const md = [
      '| Col A | Col B |',
      '|-------|-------|',
      '| 1     | 2     |',
      '| 3     | 4     |',
      ''
    ].join('\n');
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders fenced code blocks with and without a language', () => {
    const md = [
      '```js',
      'const x = 1;',
      '```',
      '',
      '```',
      'plain text block',
      '```',
      ''
    ].join('\n');
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders a mermaid code block', () => {
    const md = '```mermaid\ngraph TD;\nA-->B;\n```\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders a blockquote', () => {
    const md = '> quoted line one\n> quoted line two\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders nested inline formatting', () => {
    const md = 'Some **bold *and italic* text** plus `inline code` and a [link](https://example.com).\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders an image', () => {
    const md = '![alt text](./assets/pic.png "a title")\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('escapes HTML-significant characters in plain text', () => {
    const md = 'Less-than < and ampersand & and a <script>alert(1)</script> tag.\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('resolves a wikilink against a supplied wikiIndex', () => {
    const md = 'See [[docs/other.md|Other Doc]] for details.\n';
    expect(renderWithLineNumbers(md, wikiIndex, 'docs/plan.md')).toMatchSnapshot();
  });

  it('renders a carousel block', () => {
    const md = ':::carousel\n![a](a.png)\n![b](b.png)\n:::\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('accounts for YAML frontmatter in data-line offsets', () => {
    const md = '---\ntitle: Test\ntags: [a, b]\n---\n\n# Heading After Frontmatter\n\nBody line.\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });

  it('renders without any wikiIndex/currentFilePath (generic-lib boundary check)', () => {
    // No extension context supplied at all — this is the contract the
    // future shared/md-render/ lib must support standalone.
    const md = '# Plain\n\nJust a paragraph, no wiki, no path.\n';
    expect(renderWithLineNumbers(md)).toMatchSnapshot();
  });
});

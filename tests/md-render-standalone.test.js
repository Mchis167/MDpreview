/**
 * Proves shared/md-render/ is independently usable — no Express, no
 * server/routes/render.js, no fs. This is the reusability boundary
 * from docs/superpowers/specs/2026-08-22-vscode-extension-port-design.md:
 * other projects (and the future VSCode extension) should be able to
 * `require('shared/md-render')` directly and get clean HTML with line
 * anchors, without any MDpreview-specific wiki/carousel setup.
 */
import { describe, it, expect } from 'vitest';
const mdRender = require('../shared/md-render');

describe('shared/md-render: standalone usage', () => {
  it('exposes renderWithLineNumbers', () => {
    expect(typeof mdRender.renderWithLineNumbers).toBe('function');
  });

  it('renders plain markdown into anchored HTML with no wikiIndex/currentFilePath', () => {
    const html = mdRender.renderWithLineNumbers('# Hello\n\nA [normal link](https://example.com) here.\n');
    expect(html).toContain('<h1 id="hello">');
    expect(html).toContain('>Hello</span></h1>');
    expect(html).toContain('<a href="https://example.com"');
    expect(html).toMatch(/data-line="1"/);
    expect(html).toMatch(/data-src-start="\d+" data-src-end="\d+"/);
  });

  it('leaves wikilink syntax visibly unresolved when no wikiIndex is supplied', () => {
    // Confirms the generic path degrades gracefully rather than crashing
    // when a project doesn't use MDpreview's wiki feature at all.
    const html = mdRender.renderWithLineNumbers('See [[some/other/file.md]] for details.\n');
    expect(html).toContain('wiki-wikilink-unresolved');
    expect(html).not.toThrow;
  });

  it('renders LaTeX and AI math symbols (like $\\rightarrow$) into md-symbol spans with accurate offsets', () => {
    const md = 'Value A $\\rightarrow$ Value B and $\\Rightarrow$ with $\\approx$ 100.\n';
    const html = mdRender.renderWithLineNumbers(md);
    expect(html).toContain('<span class="md-symbol"');
    expect(html).toContain('>→</span>');
    expect(html).toContain('>⇒</span>');
    expect(html).toContain('>≈</span>');
    // Ensure accurate offset attributes for scroll sync
    const startIdx = md.indexOf('$\\rightarrow$');
    const endIdx = startIdx + '$\\rightarrow$'.length;
    expect(html).toContain(`data-src-start="${startIdx}" data-src-end="${endIdx}"`);
  });

  it('renders inline KaTeX math formulas with text and operations into .katex spans', () => {
    const md = 'Ghost: $\\text{Toạ độ màn hình} = \\text{Toạ độ cha} + \\text{Toạ độ thiết kế} \\times \\text{scale}$. Hết.\n';
    const html = mdRender.renderWithLineNumbers(md);
    expect(html).toContain('class="md-math-inline"');
    expect(html).toContain('class="katex"');
    expect(html).toContain('Toạ');
    // Ensure accurate offset attributes for scroll sync
    const startIdx = md.indexOf('$\\text{Toạ độ màn hình}');
    const endIdx = md.indexOf('. Hết.');
    expect(html).toContain(`data-src-start="${startIdx}" data-src-end="${endIdx}"`);
  });

  it('renders block KaTeX math formulas ($$...$$) into .md-math-block with display mode', () => {
    const md = '$$\nE = mc^2\n$$\n';
    const html = mdRender.renderWithLineNumbers(md);
    expect(html).toContain('md-math-block');
    expect(html).toContain('katex-display');
  });

  it('does not require any Express/server module to load', () => {
    // If this file imported express or fs at the top level for anything
    // other than its own internal use, requiring it standalone would
    // still work today (fs/express are present in node_modules), so the
    // real check is structural: md-render's own source has no express/
    // fs requires at all.
    const fs = require('fs');
    const source = fs.readFileSync(require.resolve('../shared/md-render'), 'utf8');
    expect(source).not.toMatch(/require\(['"]express['"]\)/);
    expect(source).not.toMatch(/require\(['"]fs['"]\)/);
  });
});

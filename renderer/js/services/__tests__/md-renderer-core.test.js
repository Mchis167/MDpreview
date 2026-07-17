/* eslint-disable no-undef */
const {
  highlightCodeBlock,
  sanitizeHtml,
  wrapInTableWrapper,
  renderMermaidBlock
} = require('../md-renderer-core.js');

describe('md-renderer-core', () => {
  describe('highlightCodeBlock()', () => {
    it('should highlight JavaScript code', () => {
      const code = 'const x = 42;';
      const result = highlightCodeBlock(code, 'javascript');
      expect(result).toContain('hljs');
      expect(result).toContain('x');
    });

    it('should handle unknown language with auto-detection', () => {
      const code = 'some code';
      const result = highlightCodeBlock(code, 'unknownlang');
      // highlight.js auto-detects and highlights even for unknown languages
      expect(result).toContain('code');
    });

    it('should auto-detect language when not specified', () => {
      const code = 'function test() { return 1; }';
      const result = highlightCodeBlock(code, '');
      expect(result).toBeTruthy();
      expect(result).toContain('test');
    });

    it('should handle empty code', () => {
      const result = highlightCodeBlock('', 'javascript');
      expect(result).toBe('');
    });
  });

  describe('sanitizeHtml()', () => {
    it('should remove <script> tags', () => {
      const html = '<p>Hello</p><script>alert(1)</script>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('Hello');
    });

    it('should remove <iframe> tags', () => {
      const html = '<p>Content</p><iframe src="evil.com"></iframe>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<iframe');
      expect(result).toContain('Content');
    });

    it('should remove inline event handlers', () => {
      const html = '<div onclick="attack()">Click me</div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onclick');
      expect(result).toContain('Click me');
    });

    it('should remove all on* event handlers', () => {
      const html = '<img onerror="hack()" onload="evil()" src="x">';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('onerror');
      expect(result).not.toContain('onload');
    });

    it('should remove unquoted and single-quoted event handlers', () => {
      expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toContain('onerror');
      expect(sanitizeHtml("<img src=x onerror='alert(1)'>")).not.toContain('onerror');
      expect(sanitizeHtml('<div onClick = "attack()">x</div>')).not.toContain('onClick');
    });

    it('should remove javascript: URLs in href/src', () => {
      expect(sanitizeHtml('<a href="javascript:alert(1)">x</a>')).not.toContain('javascript:');
      expect(sanitizeHtml("<a href='javascript:alert(1)'>x</a>")).not.toContain('javascript:');
      expect(sanitizeHtml('<img src=javascript:alert(1)>')).not.toContain('javascript:');
    });

    it('should preserve safe HTML', () => {
      const html = '<h1>Title</h1><p>Safe content</p>';
      const result = sanitizeHtml(html);
      expect(result).toContain('<h1>');
      expect(result).toContain('Title');
      expect(result).toContain('Safe content');
    });

    it('should handle multiple separate script tags', () => {
      const html = '<div><script>alert(1)</script> text <script>alert(2)</script></div>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('alert');
      expect(result).toContain('text');
    });

    it('should handle empty string', () => {
      const result = sanitizeHtml('');
      expect(result).toBe('');
    });

    it('should be case-insensitive for tags', () => {
      const html1 = '<SCRIPT>alert(1)</SCRIPT>';
      const html2 = '<Script>alert(1)</Script>';
      expect(sanitizeHtml(html1)).not.toContain('alert');
      expect(sanitizeHtml(html2)).not.toContain('alert');
    });
  });

  describe('wrapInTableWrapper()', () => {
    it('should wrap HTML in md-table-wrapper div', () => {
      const html = '<table><tr><td>Cell</td></tr></table>';
      const result = wrapInTableWrapper(html);
      expect(result).toContain('<div class="md-table-wrapper">');
      expect(result).toContain('</div>');
      expect(result).toContain('<table>');
    });

    it('should preserve table content', () => {
      const html = '<table><tr><th>Header</th></tr></table>';
      const result = wrapInTableWrapper(html);
      expect(result).toContain('Header');
    });

    it('should handle empty table', () => {
      const html = '<table></table>';
      const result = wrapInTableWrapper(html);
      expect(result).toContain('md-table-wrapper');
    });
  });

  describe('renderMermaidBlock()', () => {
    it('should wrap text in mermaid div', () => {
      const text = 'graph LR\n  A --> B';
      const result = renderMermaidBlock(text);
      expect(result).toContain('class="mermaid"');
      expect(result).toContain('</div>');
      expect(result).toContain('A --&gt; B');
    });

    it('should preserve diagram syntax (HTML-escaped)', () => {
      const text = 'flowchart TD\n  Start --> End';
      const result = renderMermaidBlock(text);
      expect(result).toContain('flowchart TD');
      expect(result).toContain('Start --&gt; End');
    });

    it('should handle empty diagram', () => {
      const result = renderMermaidBlock('');
      expect(result).toContain('class="mermaid"');
    });

    it('should escape HTML entities so tags cannot break out', () => {
      const text = 'graph LR\n  A[">"]';
      const result = renderMermaidBlock(text);
      expect(result).toContain('A["&gt;"]');
    });
  });

  describe('Integration: XSS Protection', () => {
    it('should sanitize rendered code blocks with script tags', () => {
      const html = '<pre><code><script>alert(1)</script></code></pre>';
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script');
    });

    it('should handle multiple XSS vectors', () => {
      const html = `
        <script>alert(1)</script>
        <iframe src="evil"></iframe>
        <div onmouseover="hack()">text</div>
      `;
      const result = sanitizeHtml(html);
      expect(result).not.toContain('<script');
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('onmouseover');
      expect(result).toContain('text');
    });
  });
});

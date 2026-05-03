import { marked } from 'marked';
import hljs from 'highlight.js';
import { highlightCodeBlock, sanitizeHtml, wrapInTableWrapper, renderMermaidBlock } from '../../renderer/js/services/md-renderer-core.js';

/**
 * High-fidelity renderer port from MDpreview server.
 * Ensures 100% parity with app structure by using lexer/parser manually.
 */
export function render(content) {
  const tokens = marked.lexer(content);
  let html = '';

  tokens.forEach(token => {
    if (token.type === 'space') return;

    let tokenHtml = '';
    
    // ── 1. Handle Premium Code Blocks ──
    if (token.type === 'code' && token.lang !== 'mermaid') {
      const lang = token.lang || 'text';
      const highlighted = highlightCodeBlock(token.text, lang);
      tokenHtml = `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } 
    // ── 2. Handle Tables ──
    else if (token.type === 'table') {
      const tableHtml = marked.parser([token]);
      tokenHtml = wrapInTableWrapper(tableHtml);
    } 
    // ── 3. Handle Mermaid ──
    else if (token.type === 'code' && token.lang === 'mermaid') {
      tokenHtml = renderMermaidBlock(token.text);
    }
    // ── 4. Standard Blocks ──
    else {
      tokenHtml = marked.parser([token]);
    }

    // Wrap in standard MDpreview block structure for 100% CSS parity
    html += `<div class="md-block"><div class="md-line">${tokenHtml}</div></div>\n`;
  });

  // Sanitize output to prevent XSS (CRITICAL SECURITY FIX)
  return sanitizeHtml(html);
}
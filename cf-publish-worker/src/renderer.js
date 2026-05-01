import { marked } from 'marked';
import hljs from 'highlight.js';

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
      const language = lang.toUpperCase();
      let highlighted = token.text;
      
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(token.text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(token.text).value;
        }
      } catch (_) { highlighted = token.text; }

      tokenHtml = `
        <div class="premium-code-block">
          <div class="code-block-header">
            <span class="code-block-lang">${language}</span>
            <button class="code-block-copy" title="Copy code" onclick="window.copyCode(this)">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="icon-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="icon-check hidden"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Copy</span>
            </button>
          </div>
          <pre><code class="hljs language-${lang}">${highlighted}</code></pre>
        </div>`;
    } 
    // ── 2. Handle Tables ──
    else if (token.type === 'table') {
      const tableHtml = marked.parser([token]);
      tokenHtml = `<div class="md-table-wrapper">${tableHtml}</div>`;
    } 
    // ── 3. Handle Mermaid ──
    else if (token.type === 'code' && token.lang === 'mermaid') {
      tokenHtml = `<div class="mermaid">${token.text}</div>`;
    }
    // ── 4. Standard Blocks ──
    else {
      tokenHtml = marked.parser([token]);
    }

    // Wrap in standard MDpreview block structure for 100% CSS parity
    html += `<div class="md-block"><div class="md-line">${tokenHtml}</div></div>\n`;
  });

  return html;
}
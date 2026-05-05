import { marked } from 'marked';
import hljs from 'highlight.js';
import { highlightCodeBlock, sanitizeHtml, wrapInTableWrapper, renderMermaidBlock } from '../../renderer/js/services/md-renderer-core.js';
import { slugifyHeading } from './utils/slug.js';

/**
 * High-fidelity renderer port from MDpreview server.
 * Ensures 100% parity with app structure by using lexer/parser manually.
 */
export function render(content) {
  const tokens = marked.lexer(content);
  const usedSlugs = new Map();
  let html = '';

  // Configure custom renderer for parity with app
  const renderer = new marked.Renderer();
  
  renderer.heading = (text, level, raw) => {
    const id = slugifyHeading(raw, usedSlugs);
    return `<h${level} id="${id}">${text}</h${level}>\n`;
  };

  renderer.table = (header, body) => {
    return wrapInTableWrapper(`<table>\n<thead>\n${header}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`);
  };

  renderer.code = (code, lang) => {
    if (lang === 'mermaid') return renderMermaidBlock(code);
    const highlighted = highlightCodeBlock(code, lang);
    return `<pre><code class="hljs language-${lang || ''}">${highlighted}</code></pre>`;
  };

  tokens.forEach(token => {
    if (token.type === 'space') return;
    
    // Process token using the configured renderer
    const tokenHtml = marked.parser([token], { renderer });

    // Wrap in standard MDpreview block structure for 100% CSS parity
    html += `<div class="md-block"><div class="md-line">${tokenHtml}</div></div>\n`;
  });

  // Sanitize output to prevent XSS (CRITICAL SECURITY FIX)
  return sanitizeHtml(html);
}
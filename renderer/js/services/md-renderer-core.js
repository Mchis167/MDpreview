/* eslint-disable no-undef */
/**
 * md-renderer-core.js
 * Shared rendering primitives for server and Cloudflare Worker.
 * Source of truth for: code highlighting, sanitization, block wrapping.
 */

// Universal highlight.js resolver
let hljsInstance = null;
try {
  if (typeof hljs !== 'undefined') {
    hljsInstance = hljs;
  } else if (typeof require !== 'undefined') {
    hljsInstance = require('highlight.js');
  }
} catch (_err) {
  // Will be handled in functions
}

/**
 * Highlight a code block with language support and fallback to auto-detection.
 */
function highlightCodeBlock(code, lang) {
  // Fallback to plain text if hljs is missing
  if (!hljsInstance) return code;

  if (lang && hljsInstance.getLanguage(lang)) {
    try {
      return hljsInstance.highlight(code, { language: lang }).value;
    } catch (_ignored) {
      return hljsInstance.highlightAuto(code).value;
    }
  }
  return hljsInstance.highlightAuto(code).value;
}

/**
 * Sanitize HTML to prevent XSS attacks.
 */
function sanitizeHtml(html) {
  if (!html) return '';
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Event handlers in every quoting style: on*="…", on*='…', on*=bare
    .replace(/\son\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/\son\w+\s*=\s*'[^']*'/gi, '')
    .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
    // javascript: URLs in href/src (allows whitespace/entity-free form only)
    .replace(/\s(href|src)\s*=\s*(["']?)\s*javascript:[^"'>\s]*\2/gi, '');
}

/**
 * Wrap table HTML in accessibility and styling wrapper.
 */
function wrapInTableWrapper(html) {
  return `<div class="md-table-wrapper">${html}</div>`;
}

/**
 * Render a Mermaid diagram block.
 * Escapes minimum HTML entities to prevent browser tag breakage while
 * ensuring mermaid.js can correctly parse labels and quotes.
 */
function renderMermaidBlock(text, lineStart, lineEnd, srcStart, srcEnd) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  const metadata = lineStart !== undefined ? `data-line-start="${lineStart}" data-line-end="${lineEnd}" data-src-start="${srcStart}" data-src-end="${srcEnd}"` : '';
  return `<div class="mermaid" ${metadata}>${escaped}</div>`;
}

/**
 * Render an ASCII art block as a placeholder for client-side SVG conversion.
 * AsciiArtModule.process() replaces this with an inline SVG at render time.
 */
function renderAsciiArtBlock(text, lineStart, lineEnd, srcStart, srcEnd) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  const metadata = lineStart !== undefined ? `data-line-start="${lineStart}" data-line-end="${lineEnd}" data-src-start="${srcStart}" data-src-end="${srcEnd}"` : '';
  return `<div class="ds-ascii-art-block" data-ascii-raw="${escaped}" ${metadata}></div>`;
}

// Export for both environments
const exportsObj = {
  highlightCodeBlock,
  sanitizeHtml,
  wrapInTableWrapper,
  renderMermaidBlock,
  renderAsciiArtBlock
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}

// For ESM environments (Workers)
if (typeof exports !== 'undefined') {
  Object.assign(exports, exportsObj);
}

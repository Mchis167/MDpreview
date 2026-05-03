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
    .replace(/on\w+="[^"]*"/gi, '');
}

/**
 * Wrap table HTML in accessibility and styling wrapper.
 */
function wrapInTableWrapper(html) {
  return `<div class="md-table-wrapper">${html}</div>`;
}

/**
 * Render a Mermaid diagram block.
 */
function renderMermaidBlock(text) {
  return `<div class="mermaid">${text}</div>`;
}

// Export for both environments
const exportsObj = {
  highlightCodeBlock,
  sanitizeHtml,
  wrapInTableWrapper,
  renderMermaidBlock
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}

// For ESM environments (Workers)
if (typeof exports !== 'undefined') {
  Object.assign(exports, exportsObj);
}

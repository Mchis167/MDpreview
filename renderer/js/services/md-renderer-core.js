/* eslint-disable no-undef */
/**
 * md-renderer-core.js
 * Shared rendering primitives for server and Cloudflare Worker.
 * Source of truth for: code highlighting, sanitization, block wrapping.
 *
 * NOTE: Uses CommonJS for server compatibility, but also compatible with ES modules.
 * Usage:
 *   Server (CommonJS): const { sanitizeHtml } = require('./md-renderer-core.js')
 *   Worker (ES modules): import { sanitizeHtml } from './md-renderer-core.js'
 */

const hljs = require('highlight.js');

/**
 * Highlight a code block with language support and fallback to auto-detection.
 * Works with both marked config and manual use in renderers.
 *
 * @param {string} code - The code to highlight
 * @param {string} lang - Programming language identifier (optional)
 * @returns {string} HTML with syntax highlighting classes
 */
function highlightCodeBlock(code, lang) {
  if (lang && hljs.getLanguage(lang)) {
    try {
      return hljs.highlight(code, { language: lang }).value;
    } catch (_ignored) {
      return hljs.highlightAuto(code).value;
    }
  }
  return hljs.highlightAuto(code).value;
}

/**
 * Sanitize HTML to prevent XSS attacks.
 * Removes dangerous elements and event handlers:
 * - <script> tags and contents
 * - <iframe> tags and contents
 * - Inline event handlers (onclick, onload, etc.)
 *
 * CRITICAL: Must be applied to all rendered markdown before serving to users.
 *
 * @param {string} html - HTML string to sanitize
 * @returns {string} Sanitized HTML safe from XSS
 */
function sanitizeHtml(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '');
}

/**
 * Wrap table HTML in accessibility and styling wrapper.
 * Both server and worker use identical wrapping for consistent styling.
 *
 * @param {string} html - Table HTML to wrap
 * @returns {string} HTML wrapped in md-table-wrapper div
 */
function wrapInTableWrapper(html) {
  return `<div class="md-table-wrapper">${html}</div>`;
}

/**
 * Render a Mermaid diagram block.
 * Converts markdown code block (lang="mermaid") into HTML element
 * for mermaid.js library to process and render.
 *
 * @param {string} text - Mermaid diagram syntax
 * @returns {string} HTML div with class="mermaid" for mermaid.js to target
 */
function renderMermaidBlock(text) {
  return `<div class="mermaid">${text}</div>`;
}

// Export for CommonJS (server)
module.exports = {
  highlightCodeBlock,
  sanitizeHtml,
  wrapInTableWrapper,
  renderMermaidBlock
};

const express = require('express');
const router = express.Router();
const fs = require('fs');
const { resolvePath } = require('../utils/path-util');
const { marked } = require('marked');
const matter = require('gray-matter');
const { sanitizeHtml, renderMermaidBlock, highlightCodeBlock, wrapInTableWrapper } = require('../../renderer/js/services/md-renderer-core.js');

// Configure marked with custom renderer for premium blocks
const renderer = new marked.Renderer();

// Table wrapper
renderer.table = (header, body) => {
  return wrapInTableWrapper(`<table>\n<thead>\n${header}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`);
};

// Mermaid and Highlighted Code Blocks
renderer.code = (code, lang) => {
  if (lang === 'mermaid') {
    return renderMermaidBlock(code);
  }
  const highlighted = highlightCodeBlock(code, lang);
  return `<pre><code class="hljs language-${lang || ''}">${highlighted}</code></pre>`;
};

// Custom List Item for Task Lists
renderer.listitem = (text, task, checked) => {
  if (task) {
    const cleanText = text.replace(/<input\b[^>]*>/i, '').trim();
    return `<li class="task-list-item"><input type="checkbox" class="ds-checkbox" ${checked ? 'checked' : ''}> ${cleanText}</li>\n`;
  }
  return `<li>${text}</li>\n`;
};

// Pre-processing is now handled during token rendering to preserve character offsets.

marked.use({
  renderer: renderer,
  langPrefix: 'hljs language-',
  gfm: true,
  breaks: true
});

/**
 * Advanced slugify for header IDs.
 * Supports Vietnamese characters and cleans up special symbols.
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')               // Break down combined characters (accents)
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[đĐ]/g, 'd')          // Special case for 'đ'
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/[^\w-]+/g, '')        // Remove all non-word chars
    .replace(/--+/g, '-');          // Replace multiple - with single -
}

/**
 * Helper to render inline tokens with character offset metadata.
 */
function renderInlineTokens(tokens, originalSource, baseOffset) {
  let html = '';
  let lastOffset = baseOffset;
  let currentLine = originalSource.substring(0, baseOffset).split('\n').length;
  let lastProcessedOffset = baseOffset;

  if (!tokens) return '';

  for (const token of tokens) {
    let start = originalSource.indexOf(token.raw, lastOffset);
    if (start === -1) {
      // Fallback if not found exactly (should not happen if source is consistent)
      start = lastOffset;
    }
    const end = start + token.raw.length;
    lastOffset = end;

    // Increment current line based on newlines between the last token and this one
    const linesInBetween = originalSource.substring(lastProcessedOffset, start).split('\n').length - 1;
    currentLine += linesInBetween;
    lastProcessedOffset = start;

    const data = `data-src-start="${start}" data-src-end="${end}" data-line="${currentLine}"`;

    switch (token.type) {
      case 'text': {
        // token.text is already escaped by marked
        html += `<span ${data}>${token.text}</span>`;
        break;
      }
      case 'strong': {
        // Find the inner content offset: skip the opening delimiter (**text** or __text__)
        const strongDelimLen = token.raw.startsWith('***') ? 3 : 2;
        const strongInnerStart = start + strongDelimLen;
        html += `<strong ${data}>${renderInlineTokens(token.tokens, originalSource, strongInnerStart)}</strong>`;
        break;
      }
      case 'em': {
        // Find the inner content offset: skip the opening delimiter (*text* or _text_)
        const emDelimLen = token.raw.startsWith('**') ? 2 : 1;
        const emInnerStart = start + emDelimLen;
        html += `<em ${data}>${renderInlineTokens(token.tokens, originalSource, emInnerStart)}</em>`;
        break;
      }
      case 'codespan':
        // token.text is already escaped by marked
        html += `<code class="hljs" ${data}>${token.text}</code>`;
        break;
      case 'link': {
        const linkInnerStart = start + 1; // skip '['
        html += `<a href="${token.href}" title="${token.title || ''}" ${data}>${renderInlineTokens(token.tokens, originalSource, linkInnerStart)}</a>`;
        break;
      }
      case 'br':
        html += '<br>';
        break;
      case 'del': {
        const delInnerStart = start + 2; // skip '~~'
        html += `<del ${data}>${renderInlineTokens(token.tokens, originalSource, delInnerStart)}</del>`;
        break;
      }
      case 'image':
        html += `<img src="${token.href}" alt="${token.text}" title="${token.title || ''}" ${data}>`;
        break;
      case 'escape':
        html += `<span ${data}>${token.text}</span>`;
        break;
      case 'html':
        html += `<span ${data}>${token.text}</span>`;
        break;
      default: {
        // Use token.text (already escaped) or fallback to raw (manually escape)
        const fallback = token.raw ? token.raw.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : '';
        const content = token.text || fallback;
        html += `<span ${data}>${content}</span>`;
      }
    }
  }
  return html;
}

/**
 * Recursive helper to render tokens into HTML with md-line and md-block wrappers.
 * @param {string} originalSource - The raw markdown source for offset calculation.
 * @param {number} baseOffset - The character offset where this token set begins.
 * @param {boolean} isTopLevel - If true, wraps output in .md-block.
 */
function renderTokens(tokens, originalSource, baseOffset, lineStart, isTopLevel = true) {
  let html = '';
  let currentLine = lineStart;
  let lastOffset = baseOffset;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.raw) continue;

    const tokenStartOffset = originalSource.indexOf(token.raw, lastOffset);
    const tokenEndOffset = tokenStartOffset + token.raw.length;
    lastOffset = tokenEndOffset;

    const tokenStartLine = currentLine;
    const tokenNewlines = (token.raw.match(/\n/g) || []).length;
    const tokenEndLine = tokenStartLine + tokenNewlines;

    if (token.type === 'space') {
      currentLine = tokenEndLine;
      continue;
    }

    let tokenHtml = '';

    // ── Details / Summary Block ──
    // ... (rest of the logic remains same, we will update heading below)
    if (token.type === 'html' && token.raw.trim().toLowerCase().startsWith('<details')) {
      let j = i;
      let depth = 0;
      let combinedRaw = '';
      while (j < tokens.length) {
        combinedRaw += tokens[j].raw;
        if (tokens[j].raw.toLowerCase().includes('<details')) depth++;
        if (tokens[j].raw.toLowerCase().includes('</details>')) depth--;
        if (depth <= 0) break;
        j++;
      }
      if (j > i) {
        const entireRaw = combinedRaw;
        const summaryMatch = entireRaw.match(/<summary>([\s\S]*?)<\/summary>/i);
        const summaryRaw = summaryMatch ? summaryMatch[1] : 'Details';
        const contentRaw = entireRaw.replace(/<details[^>]*>/i, '')
          .replace(/<\/details>/i, '')
          .replace(/<summary>[\s\S]*?<\/summary>/i, '');

        const renderedSummary = marked.parseInline(summaryRaw);

        // Render inner content with proper block wrappers and line numbering support
        // We calculate the inner content's start offset relative to the full raw string
  const innerContentIndex = entireRaw.indexOf(contentRaw);
        const innerBaseOffset = tokenStartOffset + (innerContentIndex !== -1 ? innerContentIndex : 0);
        const innerTokens = marked.lexer(contentRaw);
        const renderedContent = renderTokens(innerTokens, originalSource, innerBaseOffset, tokenStartLine, true); 

        tokenHtml = `<details><summary>${renderedSummary}</summary><div class="md-details-content">${renderedContent}</div></details>`;
        tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>`;

        // Always wrap in md-block for Flow Spacing system
        html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;

        currentLine = tokenEndLine;
        i = j;
        continue;
      }
    }

    // ── Lists (Recursive) ──
    if (token.type === 'list') {
      let listHtml = token.ordered ? `<ol start="${token.start || 1}">` : '<ul>';
      let listPrefixOffset = 0;

      token.items.forEach(item => {
        const itemIndexInList = token.raw.indexOf(item.raw, listPrefixOffset);
        let absoluteItemLine = currentLine;
        let itemStartOffset = tokenStartOffset;

        if (itemIndexInList !== -1) {
          const prefix = token.raw.substring(0, itemIndexInList);
          const newlinesBefore = (prefix.match(/\n/g) || []).length;
          absoluteItemLine = tokenStartLine + newlinesBefore;
          itemStartOffset = tokenStartOffset + itemIndexInList;
          listPrefixOffset = itemIndexInList + item.raw.length;
        }
        
        const itemEndOffset = itemStartOffset + item.raw.length;

        // ── Nested List Marker Handling ──
        // Detect multi-level markers like "1.1. Item" directly from item.raw.
        // This is display-only: we render a <span> for the marker, then use item.tokens
        // (which are the already-lexed sub-tokens) for the content.
        let markerPrefix = '';
        const markerMatch = item.raw.match(/^( {0,})(\d+(?:\.\d+)*)([.)])( +)/);
        if (markerMatch) {
          const [, indent, marker, suffix] = markerMatch;
          if (indent.length > 0 || marker.includes('.')) {
            markerPrefix = `<span class="md-custom-marker">${marker}${suffix}</span>`;
          }
        }

        // Inside LI, we set isTopLevel = false to avoid extra <div> wrappers
        let itemContent = renderTokens(item.tokens || [], originalSource, itemStartOffset, absoluteItemLine, false);

        // Inject visual marker prefix if detected
        if (markerPrefix && !itemContent.includes('md-custom-marker')) {
          itemContent = itemContent.replace(/^<div class="md-line"([^>]*)>/, `<div class="md-line"$1>${markerPrefix}`);
        }

        // Clean up paragraph wrappers for all list items
        itemContent = itemContent.trim().replace(/^<p>/g, '').replace(/<\/p>$/g, '');

        const liData = `data-line="${absoluteItemLine}" data-src-start="${itemStartOffset}" data-src-end="${itemEndOffset}"`;
        if (item.task) {
          listHtml += `<li class="task-list-item md-line" ${liData}>${markerPrefix}<input type="checkbox" class="ds-checkbox" ${item.checked ? 'checked' : ''}> <div class="md-list-item-content">${itemContent}</div></li>\n`;
        } else {
          const liClass = markerPrefix ? 'md-line has-custom-marker' : 'md-line';
          listHtml += `<li class="${liClass}" ${liData}>${markerPrefix}<div class="md-list-item-content">${itemContent}</div></li>\n`;
        }
      });

      listHtml += token.ordered ? '</ol>' : '</ul>';

      // Always wrap in md-block for Flow Spacing system
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${listHtml}</div>\n`;

      currentLine = tokenEndLine;
      continue;
    }

    // ── Tables (per-row data-line annotation) ──
    // Each <tr> gets its own data-line so scroll sync can target specific rows,
    // not just the first line of the entire table block.
    if (token.type === 'table') {
      let tableHtml = marked.parser([token]);
      let trCount = 0;
      tableHtml = tableHtml.replace(/<tr>/gi, () => {
        // Header row → tokenStartLine
        // Separator row is not rendered as <tr> by marked
        // Data rows → tokenStartLine + 1 (separator) + trCount
        const line = trCount === 0 ? tokenStartLine : tokenStartLine + 1 + trCount;
        trCount++;
        return `<tr data-line="${line}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">`;
      });
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tableHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Code Blocks (with line-range metadata for proportional positioning) ──
    // Adds data-line-start / data-line-end to <pre> so sync-service can
    // estimate which code line is at the center of the viewport.
    if (token.type === 'code') {
      if (token.lang === 'mermaid') {
        const atomicHtml = renderMermaidBlock(token.text, tokenStartLine, tokenEndLine, tokenStartOffset, tokenEndOffset);
        // For Mermaid, we use a slightly flatter structure to ensure the renderer 
        // can accurately measure dimensions. We still keep md-block for sync anchoring.
        html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${atomicHtml}</div>\n`;
        currentLine = tokenEndLine;
        continue;
      }

      const highlighted = highlightCodeBlock(token.text, token.lang);
      const atomicHtml = `<pre data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}"><code class="hljs language-${token.lang || ''}">${highlighted}</code></pre>`;
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${atomicHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Headings (with smart auto-ID generation) ──
    if (token.type === 'heading') {
      let id = slugify(token.text);
      
      // Smart detection for Decision Log pattern (e.g. "T7 — ...")
      // If it starts with T followed by numbers, use that as the ID
      const decisionMatch = token.text.match(/^(T\d+)\s*[—:-]/i);
      if (decisionMatch) {
        id = decisionMatch[1].toLowerCase();
      }

      const level = token.depth;
      // Find exact position of heading text after the '#' markers and spaces
      // e.g. "## My Heading" -> level=2, text starts at index 3 ("## " = 3 chars)
      const headingPrefixEnd = tokenStartOffset + level + (originalSource[tokenStartOffset + level] === ' ' ? 1 : 0);
      const headingContent = token.tokens ? renderInlineTokens(token.tokens, originalSource, headingPrefixEnd) : token.text;
      const headingHtml = `<h${level} id="${id}">${headingContent}</h${level}>`;
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${headingHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Atomic Blocks ──
    const isAtomic = ['blockquote', 'html'].includes(token.type);
    if (isAtomic) {
      const atomicHtml = marked.parser([token]);
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${atomicHtml}</div>`;
      // Always wrap in md-block for Flow Spacing system
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Default Paragraphs/Text ──
    let rawHtml = '';
    if (token.tokens && token.type === 'paragraph') {
      rawHtml = renderInlineTokens(token.tokens, originalSource, tokenStartOffset);
    } else {
      rawHtml = marked.parser([token]);
      if (!isTopLevel) {
        // Strip paragraph tags inside lists but we will wrap in md-block instead
        rawHtml = rawHtml.trim().replace(/^<p>/g, '').replace(/<\/p>$/g, '');
      }
    }
    const renderedLines = rawHtml.trim().split(/\r?\n/);
    let wrappedHtml = '';
    for (let k = 0; k < renderedLines.length; k++) {
      const lNum = tokenStartLine + k;
      if (lNum <= tokenEndLine) {
        wrappedHtml += `<div class="md-line" data-line="${lNum}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${renderedLines[k]}</div>\n`;
      } else {
        wrappedHtml += renderedLines[k] + '\n';
      }
    }
    
    // Always wrap in md-block to maintain vertical rhythm via Flow Spacing system
    html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${wrappedHtml}</div>\n`;
    currentLine = tokenEndLine;
  }

  return html;
}

/**
 * Main entry point for rendering markdown with line annotations.
 */
function renderWithLineNumbers(content) {
  // Use gray-matter to cleanly separate frontmatter and body content
  const parsed = matter(content);
  const processedContent = parsed.content;

  // Calculate exactly how many lines the frontmatter occupied to maintain
  // accurate data-line attributes for scroll synchronization.
  const bodyStartOffset = content.indexOf(processedContent);
  const frontmatterLines = content.substring(0, bodyStartOffset).split(/\r?\n/).length - 1;

  const tokens = marked.lexer(processedContent);
  // CRITICAL: Pass full 'content' (not just body) as originalSource.
  // Monaco receives the full file including frontmatter, so data-src-* offsets
  // must be absolute positions within the FULL file for getPositionAt() to work correctly.
  const html = renderTokens(tokens, content, bodyStartOffset, 1 + frontmatterLines, true);
  return sanitizeHtml(html);
}


router.get('/render', (req, res) => {
  const watchDir = req.watchDir;
  const file = req.query.file;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file) return res.status(400).json({ error: 'Missing file param' });

  try {
    const fullPath = resolvePath(watchDir, file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const html = renderWithLineNumbers(content);
    const totalLines = content.split('\n').length;
    res.json({ html, file, totalLines, raw: content });
  } catch (err) {
    if (err.message.includes('Security Error')) {
      return res.status(403).json({ error: err.message });
    }
    res.status(404).json({ error: 'File not found' });
  }
});

router.post('/render-raw', (req, res) => {
  const { content } = req.body;

  if (content === undefined) {
    return res.status(400).json({ error: 'Missing content body' });
  }

  try {
    const html = renderWithLineNumbers(content);
    const totalLines = content.split('\n').length;
    res.json({ html, totalLines });
  } catch (err) {
    res.status(500).json({ error: 'Render failed', details: err.message });
  }
});

module.exports = router;
module.exports.renderWithLineNumbers = renderWithLineNumbers;

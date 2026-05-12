const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
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
    return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''}> ${cleanText}</li>\n`;
  }
  return `<li>${text}</li>\n`;
};

/**
 * Custom preprocessing to handle nested lists and multi-level markers.
 */
function preprocessMarkdown(src) {
  return src.split('\n').map(line => {
    // Match multi-level ordered list or indented list
    const match = line.match(/^( {0,})(\d+(?:\.\d+)*)([.)])( +)(.*)/);
    if (match) {
      const [, indent, marker, suffix, space, content] = match;
      // If it's a nested item (indent > 0) or a multi-level marker, convert to '-'
      if (indent.length > 0 || marker.includes('.')) {
        // Double the original indent to ensure nesting (2->4, 4->8, etc.)
        const newIndent = ' '.repeat(indent.length * 2 || 4);
        return `${newIndent}- <!--M:${marker}${suffix}-->${space}${content}`;
      }
    }
    return line;
  }).join('\n');
}

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
 * Recursive helper to render tokens into HTML with md-line and md-block wrappers.
 * @param {boolean} isTopLevel - If true, wraps output in .md-block.
 */
function renderTokens(tokens, lineStart, isTopLevel = true) {
  let html = '';
  let currentLine = lineStart;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (!token.raw) continue;

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
        const innerTokens = marked.lexer(contentRaw);
        const renderedContent = renderTokens(innerTokens, tokenStartLine, true); 

        tokenHtml = `<details><summary>${renderedSummary}</summary><div class="md-details-content">${renderedContent}</div></details>`;
        tokenHtml = `<div class="md-line" data-line="${tokenStartLine}">${tokenHtml}</div>`;

        // Always wrap in md-block for Flow Spacing system
        html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${tokenHtml}</div>\n`;

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
        const itemIndex = token.raw.indexOf(item.raw, listPrefixOffset);
        let absoluteItemLine = currentLine;
        if (itemIndex !== -1) {
          const prefix = token.raw.substring(0, itemIndex);
          const newlinesBefore = (prefix.match(/\n/g) || []).length;
          absoluteItemLine = tokenStartLine + newlinesBefore;
          listPrefixOffset = itemIndex + item.raw.length;
        }

        // Inside LI, we set isTopLevel = false to avoid extra <div> wrappers
        let itemContent = renderTokens(item.tokens || [], absoluteItemLine, false);

        // Restore original marker if found
        const mMatch = itemContent.match(/<!--M:(.*?)-->/);
        let markerPrefix = '';
        if (mMatch) {
          markerPrefix = `<span class="md-custom-marker">${mMatch[1]}</span>`;
          itemContent = itemContent.replace(/<!--M:.*?-->\s*/, '');
        }

        // Clean up paragraph wrappers for all list items
        itemContent = itemContent.trim().replace(/^<p>/g, '').replace(/<\/p>$/g, '');

        if (item.task) {
          listHtml += `<li class="task-list-item md-line" data-line="${absoluteItemLine}">${markerPrefix}<input type="checkbox" ${item.checked ? 'checked' : ''}> <div class="md-list-item-content">${itemContent}</div></li>\n`;
        } else {
          const liClass = markerPrefix ? 'md-line has-custom-marker' : 'md-line';
          listHtml += `<li class="${liClass}" data-line="${absoluteItemLine}">${markerPrefix}<div class="md-list-item-content">${itemContent}</div></li>\n`;
        }
      });

      listHtml += token.ordered ? '</ol>' : '</ul>';

      // Always wrap in md-block for Flow Spacing system
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${listHtml}</div>\n`;

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
        return `<tr data-line="${line}">`;
      });
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}">${tableHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Code Blocks (with line-range metadata for proportional positioning) ──
    // Adds data-line-start / data-line-end to <pre> so sync-service can
    // estimate which code line is at the center of the viewport.
    if (token.type === 'code') {
      const highlighted = highlightCodeBlock(token.text, token.lang);
      const atomicHtml = `<pre data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}"><code class="hljs language-${token.lang || ''}">${highlighted}</code></pre>`;
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}">${atomicHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${tokenHtml}</div>\n`;
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
      const headingHtml = `<h${level} id="${id}">${token.text}</h${level}>`;
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}">${headingHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Atomic Blocks ──
    const isAtomic = ['blockquote', 'html'].includes(token.type);
    if (isAtomic) {
      const atomicHtml = marked.parser([token]);
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}">${atomicHtml}</div>`;
      // Always wrap in md-block for Flow Spacing system
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Default Paragraphs/Text ──
    let rawHtml = marked.parser([token]);
    if (!isTopLevel) {
      // Strip paragraph tags inside lists but we will wrap in md-block instead
      rawHtml = rawHtml.trim().replace(/^<p>/g, '').replace(/<\/p>$/g, '');
    }
    const renderedLines = rawHtml.trim().split(/\r?\n/);
    let wrappedHtml = '';
    for (let k = 0; k < renderedLines.length; k++) {
      const lNum = tokenStartLine + k;
      if (lNum <= tokenEndLine) {
        wrappedHtml += `<div class="md-line" data-line="${lNum}">${renderedLines[k]}</div>\n`;
      } else {
        wrappedHtml += renderedLines[k] + '\n';
      }
    }
    
    // Always wrap in md-block to maintain vertical rhythm via Flow Spacing system
    html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}">${wrappedHtml}</div>\n`;
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

  const processed = preprocessMarkdown(processedContent);
  const tokens = marked.lexer(processed);
  const html = renderTokens(tokens, 1 + frontmatterLines, true); // Root call is top-level
  return sanitizeHtml(html);
}

// Helper to resolve absolute path safely within watchDir
function resolvePath(watchDir, filePath) {
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);
  if (!fullPath.startsWith(normalizedWatchDir)) {
    throw new Error('Security Error: Path traversal detected.');
  }
  return fullPath;
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

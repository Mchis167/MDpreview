const express     = require('express');
const router      = express.Router();
const fs          = require('fs');
const path        = require('path');
const { marked }  = require('marked');
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
    // Marked's 'text' for tasks already contains a <input disabled type="checkbox">
    // We strip it to avoid double-rendering and add our own interactive one.
    const cleanText = text.replace(/<input\b[^>]*>/i, '').trim();
    return `<li class="task-list-item"><input type="checkbox" ${checked ? 'checked' : ''}> ${cleanText}</li>\n`;
  }
  return `<li>${text}</li>\n`;
};

marked.use({
  renderer: renderer,
  langPrefix: 'hljs language-',
  gfm: true
});

/**
 * Render markdown with line-number annotations on each block.
 * Each top-level block is wrapped in:
 *   <div class="md-block" data-line-start="N" data-line-end="M">...</div>
 */
function renderWithLineNumbers(content) {
  const tokens = marked.lexer(content);
  let currentLine = 1;
  let html = '';

  let i = 0;
  while (i < tokens.length) {
    const token = tokens[i];
    if (!token.raw) { i++; continue; }

    const lineStart  = currentLine;

    // Count lines in this token precisely by counting newlines
    const tokenNewlines = (token.raw.match(/\n/g) || []).length;
    const lineEnd = lineStart + tokenNewlines;

    if (token.type === 'space') { 
      currentLine = lineEnd;
      i++; 
      continue; 
    }

    // Check if this token starts a <details> block
    if (token.type === 'html' && token.raw.trim().toLowerCase().startsWith('<details')) {
      // Accumulate tokens until we find the closing </details>
      let j = i;
      let depth = 0;
      let combinedRaw = '';
      
      while (j < tokens.length) {
        combinedRaw += tokens[j].raw;
        // Simple tag counting (could be more robust with regex)
        if (tokens[j].raw.toLowerCase().includes('<details')) depth++;
        if (tokens[j].raw.toLowerCase().includes('</details>')) depth--;
        
        if (depth <= 0) break;
        j++;
      }
      
      if (j > i) {
        // We found a complete block or reached the end
        const entireRaw = combinedRaw;
        
        // Manual extraction to ensure nested Markdown is parsed correctly
        const summaryMatch = entireRaw.match(/<summary>([\s\S]*?)<\/summary>/i);
        const summaryRaw = summaryMatch ? summaryMatch[1] : 'Details';
        const contentRaw = entireRaw.replace(/<details[^>]*>/i, '')
                                    .replace(/<\/details>/i, '')
                                    .replace(/<summary>[\s\S]*?<\/summary>/i, '');
        
        const renderedSummary = marked.parseInline(summaryRaw);
        const renderedContent = marked.parse(contentRaw);
        const entireHtml = `<details><summary>${renderedSummary}</summary>\n${renderedContent}</details>`;
        
        // Calculate lines for the entire combined block
        const entireNewlines = (entireRaw.match(/\n/g) || []).length;
        const entireLineEnd = lineStart + entireNewlines;
        
        html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${entireLineEnd}"><div class="md-line" data-line="${lineStart}">${entireHtml}</div></div>\n`;
        
        // Sync the main loop's currentLine and index
        currentLine = entireLineEnd;
        i = j + 1;
        continue;
      }
    }

    // Special handling for lists to provide granular line numbers for items
    if (token.type === 'list') {
      let listHtml = token.ordered ? `<ol start="${token.start || 1}">` : '<ul>';
      let listPrefixOffset = 0;
      
      token.items.forEach(item => {
        const itemText = marked.parseInline(item.text);
        
        // Find the exact line number of this item by tracking its character offset within token.raw
        const itemIndex = token.raw.indexOf(item.raw, listPrefixOffset);
        if (itemIndex !== -1) {
          const prefix = token.raw.substring(0, itemIndex);
          const newlinesBefore = (prefix.match(/\n/g) || []).length;
          const absoluteItemLine = lineStart + newlinesBefore;
          
          if (item.task) {
            listHtml += `<li class="task-list-item md-line" data-line="${absoluteItemLine}"><input type="checkbox" ${item.checked ? 'checked' : ''}> ${itemText}</li>\n`;
          } else {
            listHtml += `<li class="md-line" data-line="${absoluteItemLine}">${itemText}</li>\n`;
          }
          listPrefixOffset = itemIndex + item.raw.length;
        }
      });
      
      listHtml += token.ordered ? '</ol>' : '</ul>';
      html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}">${listHtml}</div>\n`;
      currentLine = lineEnd;
      i++;
      continue;
    }

    // Default processing for other tokens
    const tokenHtml = marked.parser([token]);
    const isAtomic = ['code', 'blockquote', 'table', 'html'].includes(token.type);
    
    if (isAtomic) {
      html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${tokenHtml}</div></div>\n`;
      currentLine = lineEnd;
      i++;
      continue;
    }

    // Split token HTML by lines and wrap each in .md-line
    const renderedLines = tokenHtml.trim().split(/\r?\n/);
    let wrappedHtml = '';
    for (let k = 0; k < renderedLines.length; k++) {
        const lNum = lineStart + k;
        if (lNum <= lineEnd) {
            wrappedHtml += `<div class="md-line" data-line="${lNum}">${renderedLines[k]}</div>\n`;
        } else {
            wrappedHtml += renderedLines[k] + '\n';
        }
    }
    html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}">${wrappedHtml}</div>\n`;
    currentLine = lineEnd;
    i++;
  }

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
  const file     = req.query.file;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file)     return res.status(400).json({ error: 'Missing file param' });

  try {
    const fullPath   = resolvePath(watchDir, file);
    const content    = fs.readFileSync(fullPath, 'utf8');
    const html       = renderWithLineNumbers(content);
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

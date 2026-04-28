const express     = require('express');
const router      = express.Router();
const fs          = require('fs');
const path        = require('path');
const hljs        = require('highlight.js');
const { marked }  = require('marked');

// Configure marked with highlight.js
marked.setOptions({
  highlight: function(code, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(code, { language: lang }).value;
      } catch (_ignored) {}
    }
    return hljs.highlightAuto(code).value;
  },
  langPrefix: 'hljs language-'
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
    let tokenRaw     = token.raw;



    // Advance counter for the current token
    const rawLines = tokenRaw.split('\n');
    currentLine += rawLines.length - (rawLines[rawLines.length - 1] === '' ? 1 : 0);

    if (token.type === 'space') { i++; continue; }

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
        const entireHtml = marked.parse(entireRaw);
        
        // Calculate lines for the entire combined block
        const entireLines = entireRaw.split('\n');
        const lineEnd = lineStart + (entireLines.length - (entireLines[entireLines.length - 1] === '' ? 1 : 0)) - 1;
        
        html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${entireHtml}</div></div>\n`;
        
        // Sync the main loop's currentLine and index
        // We already added lineStart's first token lines, but we need to account for the rest
        const _extraLines = entireRaw.trimEnd().split('\n').length - rawLines.length;
        // currentLine += Math.max(0, extraLines); // Already handled by the inner tokens if we continued, but we skip them
        
        // Let's just recalculate currentLine properly
        currentLine = lineStart + entireLines.length - (entireLines[entireLines.length - 1] === '' ? 1 : 0);
        
        i = j + 1;
        continue;
      }
    }

    // Default processing for other tokens
    let tokenHtml = '';
    if (token.type === 'code' && token.lang !== 'mermaid') {
      const lang = token.lang || '';
      let highlighted = '';
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(token.text, { language: lang }).value;
        } else {
          highlighted = hljs.highlightAuto(token.text).value;
        }
      } catch (_e) { highlighted = token.text; }
      tokenHtml = `<pre><code class="hljs language-${lang}">${highlighted}</code></pre>`;
    } else {
      tokenHtml = marked.parser([token]);
    }

    const blockLines = token.raw.trimEnd().split('\n').length;
    const lineEnd    = lineStart + blockLines - 1;

    const isAtomic = ['code', 'blockquote', 'list', 'table', 'html'].includes(token.type);
    
    if (isAtomic) {
      let finalHtml = tokenHtml;
      if (token.type === 'table') {
        finalHtml = `<div class="md-table-wrapper">${tokenHtml}</div>`;
      }
      html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${finalHtml}</div></div>\n`;
      i++;
      continue;
    }

    // Split token HTML by lines and wrap each in .md-line
    const renderedLines = tokenHtml.trim().split('\n');
    let wrappedHtml = '';
    for (let k = 0; k < renderedLines.length; k++) {
        const lineNum = lineStart + k;
        if (lineNum <= lineEnd) {
            wrappedHtml += `<div class="md-line" data-line="${lineNum}">${renderedLines[k]}</div>\n`;
        } else {
            wrappedHtml += renderedLines[k] + '\n';
        }
    }
    html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}">${wrappedHtml}</div>\n`;
    i++;
  }

  return _sanitize(html);
}

/**
 * Basic XSS Sanitization
 * Strips script and iframe tags
 */
function _sanitize(html) {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, ''); // Remove inline event handlers
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

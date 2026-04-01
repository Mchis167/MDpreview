const express     = require('express');
const router      = express.Router();
const fs          = require('fs');
const path        = require('path');
const { marked }  = require('marked');

/**
 * Render markdown with line-number annotations on each block.
 * Each top-level block is wrapped in:
 *   <div class="md-block" data-line-start="N" data-line-end="M">...</div>
 */
function renderWithLineNumbers(content) {
  const tokens = marked.lexer(content);
  let currentLine = 1;
  let html = '';

  for (const token of tokens) {
    if (!token.raw) continue;

    const rawLines   = token.raw.split('\n');
    const lineStart  = currentLine;
    const blockLines = token.raw.trimEnd().split('\n').length;
    const lineEnd    = lineStart + blockLines - 1;

    // Advance counter
    currentLine += rawLines.length - (rawLines[rawLines.length - 1] === '' ? 1 : 0);

    if (token.type === 'space') continue;

    // Render the token to HTML
    let tokenHtml = marked.parser([token]);

    // For code blocks (including mermaid), keep the HTML intact without
    // splitting into per-line divs — splitting breaks the <pre><code> structure
    // that the mermaid processor needs.
    // Also include container tags like blockquote, list, and table to prevent
    // breaking their HTML tags line-by-line (Issue #35).
    const isAtomic = ['code', 'blockquote', 'list', 'table'].includes(token.type);
    
    if (isAtomic) {
      html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}"><div class="md-line" data-line="${lineStart}">${tokenHtml}</div></div>\n`;
      continue;
    }

    // Split token HTML by lines and wrap each in .md-line
    const renderedLines = tokenHtml.trim().split('\n');
    let wrappedHtml = '';
    
    for (let i = 0; i < renderedLines.length; i++) {
        const lineNum = lineStart + i;
        if (lineNum <= lineEnd) {
            wrappedHtml += `<div class="md-line" data-line="${lineNum}">${renderedLines[i]}</div>\n`;
        } else {
            wrappedHtml += renderedLines[i] + '\n';
        }
    }

    html += `<div class="md-block" data-line-start="${lineStart}" data-line-end="${lineEnd}">${wrappedHtml}</div>\n`;
  }

  return html;
}

router.get('/render', (req, res) => {
  const watchDir = req.watchDir;
  const file     = req.query.file;

  if (!watchDir) return res.status(400).json({ error: 'No workspace set' });
  if (!file)     return res.status(400).json({ error: 'Missing file param' });

  const full     = path.join(watchDir, file);
  const relative = path.relative(watchDir, full);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const content    = fs.readFileSync(full, 'utf8');
    const html       = renderWithLineNumbers(content);
    const totalLines = content.split('\n').length;
    res.json({ html, file, totalLines });
  } catch {
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

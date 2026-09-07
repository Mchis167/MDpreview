/* ============================================================
   shared/md-render/index.js — markdown -> HTML with line/offset
   annotations (data-line, data-src-start, data-src-end).

   Extracted verbatim from server/routes/render.js (2026-08-22 port,
   see docs/superpowers/specs/2026-08-22-vscode-extension-port-design.md
   phase 5). No fs, no Express — the caller loads wikiIndex and passes
   it in. wikiIndex/currentFilePath are optional: render() works
   standalone with neither (see the "generic-lib boundary" test).
   ============================================================ */

const path = require('path');
const { marked } = require('marked');
const matter = require('gray-matter');
const katex = require('katex');
const {
  sanitizeHtml,
  renderMermaidBlock,
  renderAsciiArtBlock,
  highlightCodeBlock,
  wrapInTableWrapper
} = require('../../renderer/js/services/md-renderer-core.js');

function commonPrefixDepth(pathA, pathB) {
  const partsA = pathA.split('/');
  const partsB = pathB.split('/');
  let depth = 0;
  for (let i = 0; i < Math.min(partsA.length, partsB.length); i++) {
    if (partsA[i] === partsB[i]) depth++;
    else break;
  }
  return depth;
}

function resolveWikiTarget(text, currentFilePath, wikiIndex) {
  if (!wikiIndex) return null;
  if (text.includes('{') || text.includes('}')) return null;

  // 1. Exact relative path match (any indexed file)
  if (wikiIndex.all_paths && wikiIndex.all_paths.includes(text)) return text;
  // fallback cho index cũ chưa có all_paths
  if (wikiIndex.path_to_id[text]) return text;

  // 2. ID match
  if (!text.includes('/') && !text.includes('.') && wikiIndex.id_to_path[text]) {
    return wikiIndex.id_to_path[text];
  }

  // 3. Alias match
  if (wikiIndex.alias_to_path && wikiIndex.alias_to_path[text]) {
    return wikiIndex.alias_to_path[text];
  }

  // 4. Relative path resolution from current file
  if (text.startsWith('./') || text.startsWith('../')) {
    const dir = currentFilePath ? currentFilePath.replace(/\/[^/]+$/, '') : '';
    const normalized = path.posix.normalize(dir + '/' + text);
    const allPaths = wikiIndex.all_paths || Object.keys(wikiIndex.path_to_id);
    if (allPaths.includes(normalized)) return normalized;
  }

  // 5. Filename-only nearest-first — scan all_paths (kể cả file không có id)
  const allPaths = wikiIndex.all_paths || Object.keys(wikiIndex.path_to_id);
  const suffix = '/' + text;
  const candidates = allPaths.filter(p => p === text || p.endsWith(suffix));

  if (candidates.length === 1) return candidates[0];
  if (candidates.length > 1 && currentFilePath) {
    const currentDir = currentFilePath.replace(/\/[^/]+$/, '');
    return candidates.reduce((best, candidate) => {
      const candidateDir = candidate.replace(/\/[^/]+$/, '');
      const bestDir = best.replace(/\/[^/]+$/, '');
      const scoreC = commonPrefixDepth(currentDir, candidateDir);
      const scoreBest = commonPrefixDepth(currentDir, bestDir);
      if (scoreC !== scoreBest) return scoreC > scoreBest ? candidate : best;
      return candidateDir.split('/').length <= bestDir.split('/').length ? candidate : best;
    });
  }

  return null;
}

function resolveCodespan(text, currentFilePath, wikiIndex) {
  return resolveWikiTarget(text, currentFilePath, wikiIndex);
}

// Configure marked with custom renderer for premium blocks
const renderer = new marked.Renderer();

// Table wrapper
renderer.table = (header, body) => {
  return wrapInTableWrapper(`<table>\n<thead>\n${header}</thead>\n<tbody>\n${body}</tbody>\n</table>\n`);
};

// Mermaid, ASCII art, and Highlighted Code Blocks
renderer.code = (code, lang) => {
  if (lang === 'mermaid') {
    return renderMermaidBlock(code);
  }
  if (lang === 'ascii' || lang === 'art' || lang === 'bob') {
    return renderAsciiArtBlock(code);
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

const wikilinkExtension = {
  name: 'wikilink',
  level: 'inline',
  start(src) { return src.indexOf('[['); },
  tokenizer(src) {
    const match = src.match(/^\[\[([^\]]+)\]\]/);
    if (match) {
      const parts = match[1].split('|');
      return {
        type: 'wikilink',
        raw: match[0],
        target: parts[0].trim(),
        display: parts[1] ? parts[1].trim() : parts[0].trim()
      };
    }
  },
  renderer() { return ''; }
};

const carouselExtension = {
  name: 'carousel',
  level: 'block',
  start(src) { return src.indexOf(':::carousel'); },
  tokenizer(src) {
    const match = src.match(/^:::carousel\n([\s\S]*?)\n:::/);
    if (match) {
      return { type: 'carousel', raw: match[0], text: match[1] };
    }
  },
  renderer() { return ''; }
};

const LATEX_SYMBOLS = {
  // Arrows
  'rightarrow': '→',
  'to': '→',
  'leftarrow': '←',
  'gets': '←',
  'Rightarrow': '⇒',
  'Leftarrow': '⇐',
  'leftrightarrow': '↔',
  'Leftrightarrow': '⇔',
  'uparrow': '↑',
  'downarrow': '↓',
  'Uparrow': '⇑',
  'Downarrow': '⇓',
  'nearrow': '↗',
  'searrow': '↘',
  'nwarrow': '↖',
  'swarrow': '↙',
  'mapsto': '↦',
  'rightharpoonup': '⇀',
  'rightharpoondown': '⇁',
  'leftharpoonup': '↼',
  'leftharpoondown': '↽',

  // Comparison & Relations
  'le': '≤',
  'leq': '≤',
  'ge': '≥',
  'geq': '≥',
  'ne': '≠',
  'neq': '≠',
  'approx': '≈',
  'sim': '∼',
  'simeq': '≃',
  'equiv': '≡',
  'cong': '≅',
  'll': '≪',
  'gg': '≫',
  'propto': '∝',

  // Arithmetic & Operations
  'pm': '±',
  'mp': '∓',
  'times': '×',
  'div': '÷',
  'cdot': '·',
  'ast': '∗',
  'star': '⋆',
  'circ': '∘',
  'bullet': '•',
  'oplus': '⊕',
  'otimes': '⊗',
  'odot': '⊙',

  // Logic & Set Theory
  'forall': '∀',
  'exists': '∃',
  'nexists': '∄',
  'in': '∈',
  'notin': '∉',
  'ni': '∋',
  'subset': '⊂',
  'subseteq': '⊆',
  'supset': '⊃',
  'supseteq': '⊇',
  'cap': '∩',
  'cup': '∪',
  'setminus': '∖',
  'lor': '∨',
  'land': '∧',
  'neg': '¬',
  'lnot': '¬',
  'top': '⊤',
  'bot': '⊥',
  'vdash': '⊢',
  'models': '⊨',
  'empty': '∅',
  'emptyset': '∅',

  // Calculus & Symbols
  'infty': '∞',
  'partial': '∂',
  'nabla': '∇',
  'degree': '°',
  'angle': '∠',
  'dots': '…',
  'ldots': '…',
  'cdots': '⋯',
  'vdots': '⋮',
  'ddots': '⋱',

  // Greek lowercase
  'alpha': 'α',
  'beta': 'β',
  'gamma': 'γ',
  'delta': 'δ',
  'epsilon': 'ε',
  'zeta': 'ζ',
  'eta': 'η',
  'theta': 'θ',
  'iota': 'ι',
  'kappa': 'κ',
  'lambda': 'λ',
  'mu': 'μ',
  'nu': 'ν',
  'xi': 'ξ',
  'pi': 'π',
  'rho': 'ρ',
  'sigma': 'σ',
  'tau': 'τ',
  'upsilon': 'υ',
  'phi': 'φ',
  'chi': 'χ',
  'psi': 'ψ',
  'omega': 'ω',

  // Greek uppercase
  'Gamma': 'Γ',
  'Delta': 'Δ',
  'Theta': 'Θ',
  'Lambda': 'Λ',
  'Xi': 'Ξ',
  'Pi': 'Π',
  'Sigma': 'Σ',
  'Upsilon': 'Υ',
  'Phi': 'Φ',
  'Psi': 'Ψ',
  'Omega': 'Ω'
};

const latexSymbolExtension = {
  name: 'latexSymbol',
  level: 'inline',
  start(src) {
    const dollarIdx = src.indexOf('$');
    const slashIdx = src.indexOf('\\');
    if (dollarIdx === -1) return slashIdx;
    if (slashIdx === -1) return dollarIdx;
    return Math.min(dollarIdx, slashIdx);
  },
  tokenizer(src) {
    // 1. $...$ syntax: $\rightarrow$, $\to$, $ \rightarrow $, $alpha$
    const dollarMatch = src.match(/^\$\s*\\?([a-zA-Z]+)\s*\$/);
    if (dollarMatch) {
      const name = dollarMatch[1];
      if (LATEX_SYMBOLS[name]) {
        return {
          type: 'latexSymbol',
          raw: dollarMatch[0],
          symbol: LATEX_SYMBOLS[name]
        };
      }
    }

    // 2. Standalone \command syntax: \rightarrow, \Rightarrow, etc.
    const slashMatch = src.match(/^\\([a-zA-Z]+)\b/);
    if (slashMatch) {
      const name = slashMatch[1];
      if (LATEX_SYMBOLS[name]) {
        return {
          type: 'latexSymbol',
          raw: slashMatch[0],
          symbol: LATEX_SYMBOLS[name]
        };
      }
    }
  },
  renderer(token) {
    return `<span class="md-symbol">${token.symbol}</span>`;
  }
};

function safeKatexRender(tex, options) {
  const originalWarn = console.warn;
  try {
    console.warn = (msg, ...args) => {
      if (typeof msg === 'string' && msg.startsWith('No character metrics')) return;
      originalWarn(msg, ...args);
    };
    return katex.renderToString(tex, options);
  } finally {
    console.warn = originalWarn;
  }
}

const blockMathExtension = {
  name: 'blockMath',
  level: 'block',
  start(src) {
    return src.indexOf('$$');
  },
  tokenizer(src) {
    const match = src.match(/^\$\$([\s\S]*?)\$\$(?:\n+|$)/);
    if (match) {
      return {
        type: 'blockMath',
        raw: match[0],
        text: match[1].trim()
      };
    }
  },
  renderer(token) {
    try {
      return safeKatexRender(token.text, { displayMode: true, throwOnError: false, strict: 'ignore' });
    } catch (_err) {
      return `<div class="katex-error">${token.text}</div>`;
    }
  }
};

const inlineMathExtension = {
  name: 'inlineMath',
  level: 'inline',
  start(src) {
    let index = src.indexOf('$');
    while (index !== -1) {
      if (index === 0 || src[index - 1] !== '\\') {
        return index;
      }
      index = src.indexOf('$', index + 1);
    }
    return -1;
  },
  tokenizer(src) {
    // If it is a known single symbol handled by latexSymbolExtension, let that handle it
    const symMatch = src.match(/^\$\s*\\?([a-zA-Z]+)\s*\$/);
    if (symMatch && LATEX_SYMBOLS[symMatch[1]]) {
      return;
    }

    // 1. Double dollar inline: $$...$$
    const doubleMatch = src.match(/^\$\$([^\$]+?)\$\$/);
    if (doubleMatch) {
      return {
        type: 'inlineMath',
        raw: doubleMatch[0],
        text: doubleMatch[1].trim(),
        displayMode: true
      };
    }

    // 2. Single dollar inline: $...$
    const singleMatch = src.match(/^\$([^\$\n\r]+?)\$/);
    if (singleMatch) {
      const content = singleMatch[1];
      if (/^\s/.test(content) || /\s$/.test(content)) {
        return;
      }
      return {
        type: 'inlineMath',
        raw: singleMatch[0],
        text: content,
        displayMode: false
      };
    }
  },
  renderer(token) {
    try {
      return safeKatexRender(token.text, { displayMode: !!token.displayMode, throwOnError: false, strict: 'ignore' });
    } catch (_err) {
      return `<span class="katex-error">${token.text}</span>`;
    }
  }
};

marked.use({
  renderer: renderer,
  langPrefix: 'hljs language-',
  gfm: true,
  breaks: true,
  extensions: [wikilinkExtension, carouselExtension, latexSymbolExtension, blockMathExtension, inlineMathExtension]
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
function renderInlineTokens(tokens, originalSource, baseOffset, wikiIndex = null, currentFilePath = null) {
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
        html += `<strong ${data}>${renderInlineTokens(token.tokens, originalSource, strongInnerStart, wikiIndex, currentFilePath)}</strong>`;
        break;
      }
      case 'em': {
        // Find the inner content offset: skip the opening delimiter (*text* or _text_)
        const emDelimLen = token.raw.startsWith('**') ? 2 : 1;
        const emInnerStart = start + emDelimLen;
        html += `<em ${data}>${renderInlineTokens(token.tokens, originalSource, emInnerStart, wikiIndex, currentFilePath)}</em>`;
        break;
      }
      case 'wikilink': {
        const wikilinkPath = resolveWikiTarget(token.target, currentFilePath, wikiIndex);
        if (wikilinkPath) {
          html += `<a href="${wikilinkPath}" class="wiki-wikilink-link" ${data}>${token.display}</a>`;
        } else {
          html += `<span class="wiki-wikilink-unresolved" ${data}>[[${token.target}]]</span>`;
        }
        break;
      }
      case 'codespan': {
        const resolvedPath = resolveCodespan(token.text, currentFilePath, wikiIndex);
        if (resolvedPath) {
          html += `<a href="${resolvedPath}" class="wiki-codespan-link" ${data}><code class="hljs">${token.text}</code></a>`;
        } else {
          html += `<code class="hljs" ${data}>${token.text}</code>`;
        }
        break;
      }
      case 'link': {
        const linkInnerStart = start + 1; // skip '['
        html += `<a href="${token.href}" title="${token.title || ''}" ${data}>${renderInlineTokens(token.tokens, originalSource, linkInnerStart, wikiIndex, currentFilePath)}</a>`;
        break;
      }
      case 'br':
        html += '<br>';
        break;
      case 'del': {
        const delInnerStart = start + 2; // skip '~~'
        html += `<del ${data}>${renderInlineTokens(token.tokens, originalSource, delInnerStart, wikiIndex, currentFilePath)}</del>`;
        break;
      }
      case 'image':
        html += `<img src="${token.href}" alt="${token.text}" title="${token.title || ''}" ${data}>`;
        break;
      case 'latexSymbol': {
        html += `<span class="md-symbol" ${data}>${token.symbol}</span>`;
        break;
      }
      case 'inlineMath': {
        let mathHtml = '';
        try {
          mathHtml = safeKatexRender(token.text, {
            displayMode: !!token.displayMode,
            throwOnError: false,
            strict: 'ignore'
          });
        } catch (_err) {
          mathHtml = `<span class="katex-error">${token.text}</span>`;
        }
        html += `<span class="md-math-inline" ${data}>${mathHtml}</span>`;
        break;
      }
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
function renderTokens(tokens, originalSource, baseOffset, lineStart, isTopLevel = true, wikiIndex = null, currentFilePath = null) {
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

        const summaryInlineTokens = marked.Lexer.lexInline(summaryRaw);
        const renderedSummary = renderInlineTokens(summaryInlineTokens, summaryRaw, 0, wikiIndex, currentFilePath);

        // Render inner content with proper block wrappers and line numbering support
        // We calculate the inner content's start offset relative to the full raw string
  const innerContentIndex = entireRaw.indexOf(contentRaw);
        const innerBaseOffset = tokenStartOffset + (innerContentIndex !== -1 ? innerContentIndex : 0);
        const innerTokens = marked.lexer(contentRaw);
        const renderedContent = renderTokens(innerTokens, originalSource, innerBaseOffset, tokenStartLine, true, wikiIndex, currentFilePath);

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
        let itemContent = renderTokens(item.tokens || [], originalSource, itemStartOffset, absoluteItemLine, false, wikiIndex, currentFilePath);

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
      const renderCell = (cell) => renderInlineTokens(cell.tokens || [], originalSource, tokenStartOffset, wikiIndex, currentFilePath);
      const align = (a) => a ? ` style="text-align:${a}"` : '';

      const headerCells = token.header.map((cell, ci) =>
        `<th${align(token.align[ci])}>${renderCell(cell)}</th>`
      ).join('');
      const headerRow = `<tr data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${headerCells}</tr>`;

      const bodyRows = token.rows.map((row, ri) => {
        const rowLine = tokenStartLine + 2 + ri; // +1 header +1 separator
        const cells = row.map((cell, ci) =>
          `<td${align(token.align[ci])}>${renderCell(cell)}</td>`
        ).join('');
        return `<tr data-line="${rowLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${cells}</tr>`;
      }).join('');

      const tableHtml = wrapInTableWrapper(`<table>\n<thead>\n${headerRow}\n</thead>\n<tbody>\n${bodyRows}\n</tbody>\n</table>`);
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tableHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Carousel Blocks ──
    if (token.type === 'carousel') {
      const headerLen = ':::carousel\n'.length;
      let charOffset = tokenStartOffset + headerLen;
      let slideLineNum = tokenStartLine + 1;

      const slidesHtml = token.text.split('\n').map(line => {
        const slideStart = charOffset;
        const slideEnd = charOffset + line.length;
        charOffset += line.length + 1;
        slideLineNum++;

        const imgMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (!imgMatch) return '';
        const [, alt, src] = imgMatch;
        return `<div class="md-carousel-slide" data-line="${slideLineNum - 1}" data-src-start="${slideStart}" data-src-end="${slideEnd}"><img src="${src}" alt="${alt}"></div>`;
      }).join('');

      tokenHtml = `<div class="md-carousel" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}"><div class="md-carousel-track">${slidesHtml}</div></div>`;
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

      if (token.lang === 'ascii' || token.lang === 'art' || token.lang === 'bob') {
        const atomicHtml = renderAsciiArtBlock(token.text, tokenStartLine, tokenEndLine, tokenStartOffset, tokenEndOffset);
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
      const headingContent = token.tokens ? renderInlineTokens(token.tokens, originalSource, headingPrefixEnd, wikiIndex, currentFilePath) : token.text;
      const headingHtml = `<h${level} id="${id}">${headingContent}</h${level}>`;
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${headingHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    // ── Atomic Blocks ──
    if (token.type === 'blockquote') {
      const innerHtml = renderTokens(token.tokens || [], originalSource, tokenStartOffset, tokenStartLine, false, wikiIndex, currentFilePath);
      tokenHtml = `<div class="md-line" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}"><blockquote>${innerHtml}</blockquote></div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    if (token.type === 'blockMath') {
      let mathHtml = '';
      try {
        mathHtml = safeKatexRender(token.text, {
          displayMode: true,
          throwOnError: false,
          strict: 'ignore'
        });
      } catch (_err) {
        mathHtml = `<div class="katex-error">${token.text}</div>`;
      }
      tokenHtml = `<div class="md-line md-math-block" data-line="${tokenStartLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${mathHtml}</div>`;
      html += `<div class="md-block" data-line-start="${tokenStartLine}" data-line-end="${tokenEndLine}" data-src-start="${tokenStartOffset}" data-src-end="${tokenEndOffset}">${tokenHtml}</div>\n`;
      currentLine = tokenEndLine;
      continue;
    }

    const isAtomic = ['html'].includes(token.type);
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
    if (token.tokens && (token.type === 'paragraph' || token.type === 'text')) {
      rawHtml = renderInlineTokens(token.tokens, originalSource, tokenStartOffset, wikiIndex, currentFilePath);
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
 * wikiIndex and currentFilePath are optional — omit both to render
 * plain markdown with no wikilink/codespan resolution.
 */
function renderWithLineNumbers(content, wikiIndex = null, currentFilePath = null) {
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
  const html = renderTokens(tokens, content, bodyStartOffset, 1 + frontmatterLines, true, wikiIndex, currentFilePath);
  return sanitizeHtml(html);
}

module.exports = {
  renderWithLineNumbers,
  renderTokens,
  renderInlineTokens,
  slugify,
  resolveWikiTarget,
  resolveCodespan
};

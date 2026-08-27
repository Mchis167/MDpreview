/* ============================================================
   ascii-art.js — High-Precision Vector ASCII / Unicode Diagram Renderer
   Features:
     - Exact cell-coordinate port mapping (continuous sub-pixel paths)
     - Collinear segment merging (zero gap / zero dot artifacts)
     - Tree-branch & junction alignment (├─, └─, ┼, ┬, ┴, │, ─)
     - Arrowhead vectorization (◄, ►, ▲, ▼, ←, →, ↑, ↓)
     - Clean modern typography with dark-card canvas
   Exports: window.AsciiArtModule (IIFE)
   ============================================================ */

(() => {
'use strict';

const UNICODE_BOX_MAP = {
  '─': { t:0, b:0, l:1, r:1 }, '-': { t:0, b:0, l:1, r:1 }, '━': { t:0, b:0, l:1, r:1 }, '═': { t:0, b:0, l:1, r:1 },
  '│': { t:1, b:1, l:0, r:0 }, '|': { t:1, b:1, l:0, r:0 }, '┃': { t:1, b:1, l:0, r:0 }, '║': { t:1, b:1, l:0, r:0 },
  '┌': { t:0, b:1, l:0, r:1 }, '┍': { t:0, b:1, l:0, r:1 }, '┎': { t:0, b:1, l:0, r:1 }, '┏': { t:0, b:1, l:0, r:1 },
  '┐': { t:0, b:1, l:1, r:0 }, '┑': { t:0, b:1, l:1, r:0 }, '┒': { t:0, b:1, l:1, r:0 }, '┓': { t:0, b:1, l:1, r:0 },
  '└': { t:1, b:0, l:0, r:1 }, '┕': { t:1, b:0, l:0, r:1 }, '┖': { t:1, b:0, l:0, r:1 }, '┗': { t:1, b:0, l:0, r:1 },
  '┘': { t:1, b:0, l:1, r:0 }, '┙': { t:1, b:0, l:1, r:0 }, '┚': { t:1, b:0, l:1, r:0 }, '┛': { t:1, b:0, l:1, r:0 },
  '├': { t:1, b:1, l:0, r:1 }, '┝': { t:1, b:1, l:0, r:1 }, '┞': { t:1, b:1, l:0, r:1 }, '┣': { t:1, b:1, l:0, r:1 },
  '┤': { t:1, b:1, l:1, r:0 }, '┥': { t:1, b:1, l:1, r:0 }, '┦': { t:1, b:1, l:1, r:0 }, '┫': { t:1, b:1, l:1, r:0 },
  '┬': { t:0, b:1, l:1, r:1 }, '┭': { t:0, b:1, l:1, r:1 }, '┮': { t:0, b:1, l:1, r:1 }, '┳': { t:0, b:1, l:1, r:1 },
  '┴': { t:1, b:0, l:1, r:1 }, '┵': { t:1, b:0, l:1, r:1 }, '┶': { t:1, b:0, l:1, r:1 }, '┻': { t:1, b:0, l:1, r:1 },
  '┼': { t:1, b:1, l:1, r:1 }, '╋': { t:1, b:1, l:1, r:1 }, '╪': { t:1, b:1, l:1, r:1 }, '╬': { t:1, b:1, l:1, r:1 },
  '╔': { t:0, b:1, l:0, r:1 }, '╗': { t:0, b:1, l:1, r:0 }, '╚': { t:1, b:0, l:0, r:1 }, '╝': { t:1, b:0, l:1, r:0 },
  '╠': { t:1, b:1, l:0, r:1 }, '╣': { t:1, b:1, l:1, r:0 }, '╦': { t:0, b:1, l:1, r:1 }, '╩': { t:1, b:0, l:1, r:1 }
};

const ARROWS = {
  '◄': 'left', '←': 'left',
  '►': 'right', '→': 'right',
  '▲': 'up', '↑': 'up',
  '▼': 'down', '↓': 'down'
};

const CELL_W = 8.8;    // exact character column pitch
const CELL_H = 19.0;   // exact character row pitch
const PAD_X = 24;
const PAD_Y = 24;

function _escapeXml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function _parseGrid(text) {
  const rawLines = text.split('\n');
  while (rawLines.length > 0 && rawLines[rawLines.length - 1].trim() === '') {
    rawLines.pop();
  }
  const lines = rawLines.map(l => Array.from(l));
  const width = lines.length > 0 ? Math.max(...lines.map(l => l.length)) : 0;
  const height = lines.length;

  const grid = lines.map(line => {
    const chars = [...line];
    while (chars.length < width) chars.push(' ');
    return chars;
  });
  return { grid, width, height };
}

function _at(grid, r, c) {
  if (r < 0 || r >= grid.length) return ' ';
  if (c < 0 || c >= grid[r].length) return ' ';
  return grid[r][c];
}

function _cx(c) { return PAD_X + c * CELL_W + CELL_W / 2; }
function _cy(r) { return PAD_Y + r * CELL_H + CELL_H / 2; }
function _x(c) { return PAD_X + c * CELL_W; }
function _y(r) { return PAD_Y + r * CELL_H; }

function _getBoxPorts(ch, r, c, grid) {
  if (UNICODE_BOX_MAP[ch]) {
    return UNICODE_BOX_MAP[ch];
  }
  if (ch === '+') {
    const topCh = _at(grid, r - 1, c);
    const botCh = _at(grid, r + 1, c);
    const leftCh = _at(grid, r, c - 1);
    const rightCh = _at(grid, r, c + 1);

    const t = UNICODE_BOX_MAP[topCh] || topCh === '+' || topCh === '|' || topCh === '^' || topCh === '▲';
    const b = UNICODE_BOX_MAP[botCh] || botCh === '+' || botCh === '|' || botCh === 'v' || botCh === '▼';
    const l = UNICODE_BOX_MAP[leftCh] || leftCh === '+' || leftCh === '-' || leftCh === '<' || leftCh === '◄';
    const rgt = UNICODE_BOX_MAP[rightCh] || rightCh === '+' || rightCh === '-' || rightCh === '>' || rightCh === '►';

    return {
      t: t ? 1 : 0,
      b: b ? 1 : 0,
      l: l ? 1 : 0,
      r: rgt ? 1 : 0
    };
  }
  return null;
}

function _buildSvg(text) {
  const { grid, width, height } = _parseGrid(text);
  if (height === 0 || width === 0) return '';

  const svgW = Math.round(width * CELL_W + PAD_X * 2);
  const svgH = Math.round(height * CELL_H + PAD_Y * 2);

  // 1. Trace horizontal continuous lines
  const hSegments = [];
  for (let r = 0; r < height; r++) {
    let inRun = false;
    let runStart = 0;
    for (let c = 0; c < width; c++) {
      const ch = _at(grid, r, c);
      const ports = _getBoxPorts(ch, r, c, grid);
      const isH = ports && (ports.l || ports.r);

      if (isH) {
        if (!inRun) {
          inRun = true;
          runStart = c;
        }
      } else {
        if (inRun) {
          hSegments.push({ r, c1: runStart, c2: c - 1 });
          inRun = false;
        }
      }
    }
    if (inRun) {
      hSegments.push({ r, c1: runStart, c2: width - 1 });
    }
  }

  // 2. Trace vertical continuous lines
  const vSegments = [];
  for (let c = 0; c < width; c++) {
    let inRun = false;
    let runStart = 0;
    for (let r = 0; r < height; r++) {
      const ch = _at(grid, r, c);
      const ports = _getBoxPorts(ch, r, c, grid);
      const isV = ports && (ports.t || ports.b);

      if (isV) {
        if (!inRun) {
          inRun = true;
          runStart = r;
        }
      } else {
        if (inRun) {
          vSegments.push({ c, r1: runStart, r2: r - 1 });
          inRun = false;
        }
      }
    }
    if (inRun) {
      vSegments.push({ c, r1: runStart, r2: height - 1 });
    }
  }

  // Generate SVG path for merged lines
  const pathParts = [];
  hSegments.forEach(seg => {
    const y = _cy(seg.r);
    const x1 = _cx(seg.c1) - CELL_W / 2;
    const x2 = _cx(seg.c2) + CELL_W / 2;
    pathParts.push(`M ${x1.toFixed(1)} ${y.toFixed(1)} L ${x2.toFixed(1)} ${y.toFixed(1)}`);
  });

  vSegments.forEach(seg => {
    const x = _cx(seg.c);
    const y1 = _cy(seg.r1) - CELL_H / 2;
    const y2 = _cy(seg.r2) + CELL_H / 2;
    pathParts.push(`M ${x.toFixed(1)} ${y1.toFixed(1)} L ${x.toFixed(1)} ${y2.toFixed(1)}`);
  });

  // 3. Arrowheads
  const arrowElements = [];
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const ch = _at(grid, r, c);
      const dir = ARROWS[ch];
      if (dir) {
        const x = _cx(c);
        const y = _cy(r);
        const s = 4.5;
        let pts = '';
        if (dir === 'left') pts = `${x + s},${y - s} ${x - s},${y} ${x + s},${y + s}`;
        else if (dir === 'right') pts = `${x - s},${y - s} ${x + s},${y} ${x - s},${y + s}`;
        else if (dir === 'up') pts = `${x - s},${y + s} ${x},${y - s} ${x + s},${y + s}`;
        else if (dir === 'down') pts = `${x - s},${y - s} ${x},${y + s} ${x + s},${y - s}`;

        if (pts) {
          arrowElements.push(`<polygon points="${pts}" class="aas-arrowhead"/>`);
        }
      }
    }
  }

  // 4. Trace text labels
  const textElements = [];
  for (let r = 0; r < height; r++) {
    let c = 0;
    while (c < width) {
      const ch = _at(grid, r, c);
      const isBox = _getBoxPorts(ch, r, c, grid) !== null;
      const isArr = ARROWS[ch] !== undefined;

      if (!isBox && !isArr && ch !== ' ') {
        let run = '';
        const startC = c;
        while (c < width) {
          const cur = _at(grid, r, c);
          if (_getBoxPorts(cur, r, c, grid) !== null || ARROWS[cur] !== undefined) {
            break;
          }
          run += cur;
          c++;
        }

        const trimmed = run.trim();
        if (trimmed.length > 0) {
          const lead = run.length - run.trimStart().length;
          const actualCol = startC + lead;
          const textX = _x(actualCol);
          const textY = _y(r) + CELL_H / 2 + 4.5;

          const isHeader = trimmed.toUpperCase() === trimmed && trimmed.length > 2 && !trimmed.includes('(');
          const cls = isHeader ? 'aas-text aas-text--header' : 'aas-text';

          textElements.push(
            `<text x="${textX.toFixed(1)}" y="${textY.toFixed(1)}" class="${cls}">${_escapeXml(trimmed)}</text>`
          );
        }
      } else {
        c++;
      }
    }
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" ` +
    `viewBox="0 0 ${svgW} ${svgH}" class="aas-svg">` +
    `<rect width="${svgW}" height="${svgH}" rx="8" class="aas-backdrop"/>` +
    `<path d="${pathParts.join(' ')}" class="aas-grid-line"/>` +
    `<g class="aas-arrows">${arrowElements.join('')}</g>` +
    `<g class="aas-labels">${textElements.join('')}</g>` +
    `</svg>`
  );
}

// ── Public Module Export ─────────────────────────────────────

const AsciiArtModule = {
  convert(text) {
    return _buildSvg(text);
  },

  process(container) {
    if (!container) return;
    const elements = container.querySelectorAll('.ds-ascii-art-block[data-ascii-raw]');
    elements.forEach(el => {
      const raw = el.getAttribute('data-ascii-raw');
      if (!raw) return;
      const svg = _buildSvg(raw);
      if (!svg) return;
      const wrapper = document.createElement('div');
      wrapper.className = 'ds-ascii-art-block ds-ascii-art-block--rendered';
      wrapper.innerHTML = svg;
      el.replaceWith(wrapper);
    });
  }
};

window.AsciiArtModule = AsciiArtModule;

})();

/**
 * @vitest-environment jsdom
 *
 * Sync Cursor Test Suite — tests the core fuzzy matching logic
 * by extracting and re-implementing the algorithm from markdown-logic-service.js
 *
 * TC-S01  Exact match on correct line
 * TC-S02  Fuzzy match when hint line is offset
 * TC-S03  Emoji prefix (📊 SESSION 3)
 * TC-S04  Single digit suffix preserved
 * TC-S05  Duplicate phrases — nearest line wins
 * TC-S06  Special chars ($0.001279, #hash, *star*)
 * TC-S07  Vietnamese / CJK unicode
 * TC-S08  Long paragraph (head-word anchor)
 * TC-S09  Code block content
 * TC-S10  Table cell text
 * TC-S11  Deeply nested blockquote
 * TC-S12  Selection at first line
 * TC-S13  Selection at last line
 * TC-S14  Empty / noisy line → line-number fallback
 * TC-S15  selectionText < 3 chars → line-number fallback
 * TC-S16  Hint line > 150 off → reject match
 * TC-S17  Repeated phrase — nearest instance wins
 * TC-S18  Markdown heading with # stripped
 * TC-S19  Mixed emoji + number + text
 * TC-S20  Decimal numbers preserved
 * TC-R01..R08  captureEditorSyncData regex simulation
 */

import { describe, it, expect } from 'vitest';

// ══════════════════════════════════════════════════════════════════
// Pure re-implementation of the core fuzzy-match logic
// (mirrors markdown-logic-service.js syncCursor algorithm)
// ══════════════════════════════════════════════════════════════════

/**
 * Given raw markdown text and a context hint, returns the best-matching
 * character index (and the line number it lands on).
 */
function findTargetChar(text, context) {
  if (!context.selectionText || context.selectionText.length <= 2) return -1;

  const lines = text.split('\n');

  // ── 1. Exact match at predicted position ──
  let startOfLine = 0;
  const targetLineIdx = Math.min((context.line || 1) - 1, lines.length - 1);
  for (let i = 0; i < targetLineIdx; i++) {
    startOfLine += (lines[i] ? lines[i].length : 0) + 1;
  }
  const predictedPos = startOfLine + (context.offset || 0);
  const sample = text.substring(predictedPos, predictedPos + context.selectionText.length);
  if (sample === context.selectionText) {
    return predictedPos;
  }

  // ── 2. Fuzzy Match (Sandwich Strategy) ──
  const normalizedSelection = context.selectionText.replace(/[""''«»]/g, ' ');
  // Keep single-char digit tokens (e.g. "SESSION 3" → keep "3")
  const allWords = normalizedSelection.trim()
    .split(/[\s,\-()""''«»\[\]{}:;!?\/\\]+/)
    .filter(w => w.length > 1 || /^\d+$/.test(w));

  if (allWords.length === 0) return -1;

  const buildPattern = (words) => words
    .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^\\n]{0,100}?');

  const findBestMatch = (pattern, isLiteral = false) => {
    try {
      const regex = new RegExp(pattern, (isLiteral ? 'g' : 'gi') + 'u');
      let match;
      let best = null;
      let minDistance = Infinity;
      while ((match = regex.exec(text)) !== null) {
        const matchIdx = match.index;
        const matchLine = text.substring(0, matchIdx).split('\n').length;
        const distance = Math.abs(matchLine - (context.line || 1));
        if (distance < minDistance) {
          minDistance = distance;
          best = { index: matchIdx, length: match[0].length, line: matchLine, distance };
        }
      }
      return best;
    } catch (_e) { return null; }
  };

  const headWords = allWords.slice(0, 5);
  let matchResult = findBestMatch(buildPattern(headWords));

  // Triple-word anchor fallback
  if (!matchResult && allWords.length >= 3) {
    for (let i = 0; i <= allWords.length - 3; i++) {
      const result = findBestMatch(buildPattern(allWords.slice(i, i + 3)));
      if (result && result.distance < 100) { matchResult = result; break; }
    }
  }

  // Best single word fallback
  if (!matchResult && allWords.length > 0) {
    const bestWord = [...allWords].sort((a, b) => b.length - a.length)[0];
    if (bestWord.length >= 4) {
      matchResult = findBestMatch(bestWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
    }
  }

  if (!matchResult) return -1;
  if (matchResult.distance > 150) return -1;

  return matchResult.index;
}

function lineOf(text, charIndex) {
  if (charIndex < 0) return -1;
  return text.substring(0, charIndex).split('\n').length;
}

function syncLine(text, context) {
  const idx = findTargetChar(text, context);
  return lineOf(text, idx);
}

// ── captureEditorSyncData regex (same as in change-action-view-bar.js) ──
const cleanForSearch = (text) =>
  text.replace(/[#*`_~\[\]()>\-+]/g, ' ').trim();

// ══════════════════════════════════════════════════════════════════
// Sample Documents
// ══════════════════════════════════════════════════════════════════

const DOC_BASIC = [
  '# Introduction',
  '',
  'Hello world paragraph.',
  '',
  '## Section Two',
  '',
  'Some content here.',
  '',
  '## Section Three',
  '',
  'Final content.',
].join('\n');
// line 1: # Introduction
// line 3: Hello world paragraph.
// line 5: ## Section Two
// line 7: Some content here.
// line 9: ## Section Three
// line 11: Final content.

const DOC_SESSIONS = [
  '# Report',
  '',
  '📊 SESSION 1',
  'data: foo bar',
  '',
  '📊 SESSION 2',
  'data: baz qux',
  '',
  '📊 SESSION 3',
  'data: abc def',
  '',
  '📊 SESSION 4',
  'data: xyz',
].join('\n');
// line 3: 📊 SESSION 1
// line 6: 📊 SESSION 2
// line 9: 📊 SESSION 3
// line 12: 📊 SESSION 4

const DOC_FINANCIAL = [
  '# Financial Report',
  '',
  'Input Tokens: 1771',
  'Output Tokens: 354',
  'Total Tokens: 2125',
  'Total Cost:   $0.001279',
  '',
  'Another line here.',
].join('\n');
// line 3: Input Tokens: 1771
// line 5: Total Tokens: 2125
// line 6: Total Cost:   $0.001279

const DOC_DUPLICATES_SMALL = [
  'Start of document.',
  'repeated phrase here',
  'some other content',
  'more content A',
  'repeated phrase here',
  'some other content',
  'more content B',
  'repeated phrase here',
  'End of document.',
].join('\n');
// "repeated phrase here" at lines 2, 5, 8

const DOC_VIETNAMESE = [
  '# Tiêu đề chính',
  '',
  'Đây là nội dung tiếng Việt với các ký tự đặc biệt.',
  'Chúng ta cần kiểm tra sync cursor với unicode.',
  '',
  '## Phần hai',
  '',
  'Nội dung phần hai với từ ngữ phong phú hơn.',
].join('\n');
// line 3: Vietnamese
// line 8: Vietnamese

const DOC_TABLE = [
  '# Data',
  '',
  '| Name    | Value | Score |',
  '|---------|-------|-------|',
  '| Alpha   | 100   | 9.5   |',
  '| Beta    | 200   | 8.7   |',
  '| Gamma   | 300   | 7.2   |',
  '',
  'Summary below.',
].join('\n');

const DOC_CODE = [
  '# Code Example',
  '',
  '```javascript',
  'function hello(name) {',
  "  return `Hello, ${name}!`;",
  '}',
  '```',
  '',
  'Usage: call hello() with a name.',
].join('\n');

const DOC_BLOCKQUOTE = [
  '# Quotes',
  '',
  '> First level quote',
  '>> Second level quote',
  '>>> Third level deeply nested',
  '',
  'Back to normal text.',
].join('\n');

// ══════════════════════════════════════════════════════════════════
describe('TC-S01 — Exact Match', () => {

  it('exact text at correct line', () => {
    expect(syncLine(DOC_BASIC, { line: 3, offset: 0, selectionText: 'Hello world paragraph.' })).toBe(3);
  });

  it('exact match with offset', () => {
    expect(syncLine(DOC_BASIC, { line: 7, offset: 5, selectionText: 'content here.' })).toBe(7);
  });

  it('heading line exact', () => {
    expect(syncLine(DOC_BASIC, { line: 5, selectionText: '## Section Two' })).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S02 — Fuzzy Match (Line Offset)', () => {

  it('finds correct line when hint is +10 off', () => {
    expect(syncLine(DOC_SESSIONS, { line: 19, selectionText: '📊 SESSION 3' })).toBe(9);
  });

  it('finds correct line when hint is -5 off', () => {
    expect(syncLine(DOC_SESSIONS, { line: 4, selectionText: '📊 SESSION 3' })).toBe(9);
  });

  it('finds correct line when hint is +15 off', () => {
    expect(syncLine(DOC_FINANCIAL, { line: 21, selectionText: 'Total Cost:   $0.001279' })).toBe(6);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S03/04 — Emoji + Digit Suffix', () => {

  it('emoji prefix SESSION 3 → correct line', () => {
    expect(syncLine(DOC_SESSIONS, { line: 9, selectionText: '📊 SESSION 3' })).toBe(9);
  });

  it('digit "3" distinguishes SESSION 3 from SESSION 2', () => {
    const l3 = syncLine(DOC_SESSIONS, { line: 9,  selectionText: '📊 SESSION 3' });
    const l4 = syncLine(DOC_SESSIONS, { line: 12, selectionText: '📊 SESSION 4' });
    expect(l3).toBe(9);
    expect(l4).toBe(12);
  });

  it('TC-S19: emoji + number + colon', () => {
    const doc = [
      '🔥 Item 1: first entry',
      '🔥 Item 2: second entry',
      '🔥 Item 3: third entry',
    ].join('\n');
    expect(syncLine(doc, { line: 3, selectionText: '🔥 Item 3: third entry' })).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S05/17 — Duplicate Phrases (Nearest Line Wins)', () => {

  it('nearest instance of repeated phrase — hint line 2', () => {
    expect(syncLine(DOC_DUPLICATES_SMALL, { line: 2, selectionText: 'repeated phrase here' })).toBe(2);
  });

  it('nearest instance of repeated phrase — hint line 5', () => {
    expect(syncLine(DOC_DUPLICATES_SMALL, { line: 5, selectionText: 'repeated phrase here' })).toBe(5);
  });

  it('nearest instance of repeated phrase — hint line 8', () => {
    expect(syncLine(DOC_DUPLICATES_SMALL, { line: 8, selectionText: 'repeated phrase here' })).toBe(8);
  });

  it('TC-S17: repeated phrase in large doc — within ±5 lines', () => {
    const doc = Array.from({ length: 200 }, (_, i) => {
      if (i % 20 === 0) return `## Chapter ${Math.floor(i / 20) + 1}`;
      if (i % 5 === 0) return 'This is a repeated phrase that appears many times.';
      return `Line ${i + 1}: content with unique-id-${i}`;
    }).join('\n');
    const line = syncLine(doc, { line: 105, selectionText: 'This is a repeated phrase that appears many times.' });
    expect(Math.abs(line - 105)).toBeLessThanOrEqual(5);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S06/20 — Special Characters & Numbers', () => {

  it('TC-S20: decimal $0.001279 preserved in fuzzy search', () => {
    expect(syncLine(DOC_FINANCIAL, { line: 6, selectionText: 'Total Cost:   $0.001279' })).toBe(6);
  });

  it('integer with spaces: Total Tokens: 2125', () => {
    expect(syncLine(DOC_FINANCIAL, { line: 5, selectionText: 'Total Tokens: 2125' })).toBe(5);
  });

  it('TC-S18: markdown heading with # stripped text', () => {
    const doc = ['# First Heading', '', '## Second Heading', '', 'Body text.'].join('\n');
    expect(syncLine(doc, { line: 3, selectionText: '## Second Heading' })).toBe(3);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S07 — Unicode / Vietnamese', () => {

  it('Vietnamese sentence line 3', () => {
    expect(syncLine(DOC_VIETNAMESE, {
      line: 3,
      selectionText: 'Đây là nội dung tiếng Việt với các ký tự đặc biệt.'
    })).toBe(3);
  });

  it('Vietnamese sentence line 8', () => {
    expect(syncLine(DOC_VIETNAMESE, {
      line: 8,
      selectionText: 'Nội dung phần hai với từ ngữ phong phú hơn.'
    })).toBe(8);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S08 — Long Paragraphs', () => {

  it('long paragraph matched by first 10 words', () => {
    const longPara = 'The quick brown fox jumps over the lazy dog near the river bank where many animals gather every morning at sunrise to drink fresh cool water from the flowing stream below the ancient oak trees.';
    const doc = ['Short intro.', longPara, 'Short outro.'].join('\n');
    expect(syncLine(doc, { line: 2, selectionText: 'The quick brown fox jumps over the lazy dog' })).toBe(2);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S09/10/11 — Structured Content', () => {

  it('TC-S09: code block content', () => {
    expect(syncLine(DOC_CODE, { line: 4, selectionText: 'function hello(name) {' })).toBe(4);
  });

  it('TC-S10: table row', () => {
    expect(syncLine(DOC_TABLE, { line: 6, selectionText: '| Beta    | 200   | 8.7   |' })).toBe(6);
  });

  it('TC-S11: blockquote nested', () => {
    expect(syncLine(DOC_BLOCKQUOTE, { line: 5, selectionText: '>>> Third level deeply nested' })).toBe(5);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S12/13 — Boundary Lines', () => {

  it('TC-S12: first line', () => {
    expect(syncLine(DOC_BASIC, { line: 1, selectionText: '# Introduction' })).toBe(1);
  });

  it('TC-S13: last line', () => {
    const lines = DOC_BASIC.split('\n');
    expect(syncLine(DOC_BASIC, { line: lines.length, selectionText: 'Final content.' })).toBe(lines.length);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-S14/15/16 — Fallback & Rejection', () => {

  it('TC-S14: empty selectionText → no match', () => {
    expect(findTargetChar(DOC_BASIC, { line: 4, selectionText: '' })).toBe(-1);
  });

  it('TC-S15: selectionText 2 chars → no match', () => {
    expect(findTargetChar(DOC_BASIC, { line: 5, selectionText: 'ab' })).toBe(-1);
  });

  it('TC-S16: hint line > 150 off → reject match', () => {
    // DOC_BASIC has 11 lines; hint=200 → distance > 150
    const idx = findTargetChar(DOC_BASIC, { line: 200, selectionText: 'Hello world paragraph.' });
    expect(idx).toBe(-1);
  });
});

// ══════════════════════════════════════════════════════════════════
describe('TC-R01..08 — captureEditorSyncData Regex', () => {

  it('TC-R01: session number preserved', () => {
    expect(cleanForSearch('📊 SESSION 3')).toBe('📊 SESSION 3');
  });

  it('TC-R02: decimal number preserved', () => {
    expect(cleanForSearch('Total Cost:   $0.001279')).toBe('Total Cost:   $0.001279');
  });

  it('TC-R03: markdown heading # stripped', () => {
    expect(cleanForSearch('## My Heading')).toBe('My Heading');
  });

  it('TC-R04: bold markers stripped', () => {
    expect(cleanForSearch('**bold text**')).toContain('bold text');
  });

  it('TC-R05: backtick code stripped', () => {
    expect(cleanForSearch('Use `code` here')).toContain('code');
    expect(cleanForSearch('Use `code` here')).not.toContain('`');
  });

  it('TC-R06: link markdown stripped', () => {
    const result = cleanForSearch('[link text](url)');
    expect(result).toContain('link text');
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
  });

  it('TC-R07: list marker stripped', () => {
    const result = cleanForSearch('- Item one two three');
    expect(result).toContain('Item one two three');
    expect(result).not.toMatch(/^-/);
  });

  it('TC-R08: digit in numbered list kept', () => {
    const result = cleanForSearch('1. Item text here');
    expect(result).toContain('Item text here');
    expect(result).toContain('1');
  });
});

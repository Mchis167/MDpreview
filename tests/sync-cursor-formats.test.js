/**
 * @vitest-environment jsdom
 *
 * Sync Cursor — Format Coverage Test Suite
 *
 * Tests the matching logic for ALL markdown formats when switching
 * between Read ↔ Edit mode. Specifically validates:
 *
 *   1. captureEditorSyncData strip behaviour (what selectionText is produced)
 *   2. findTargetChar (syncCursor) with stripped selectionText (as read-view produces)
 *   3. Edge cases that are known to be fragile:
 *        - Short list items (≤2 chars after strip → fuzzy skipped)
 *        - Nested list parent-item text includes children
 *        - <details> block with single data-line for entire block
 *        - Task lists checkbox stripping
 *        - Ordered / unordered / mixed lists
 *        - Blockquotes (> prefix stripped)
 *        - Tables
 *        - Code blocks
 *        - Frontmatter lines
 *
 * Test ID scheme:
 *   TC-F##  Format-specific matching tests
 *   TC-E##  captureEditorSyncData strip simulation tests
 *   TC-N##  Nested-list & details edge cases
 */

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════
// Re-implementations that mirror the production code
// ═══════════════════════════════════════════════════════════════════════

/**
 * Mirrors syncCursor Stage 1 fuzzy logic (markdown-logic-service.js).
 * Returns the best-matching character index in `text`, or -1.
 */
function findTargetChar(text, context) {
  if (!context.selectionText || context.selectionText.length <= 2) return -1;

  const lines = text.split('\n');
  const targetLineIdx = Math.min((context.line || 1) - 1, lines.length - 1);

  // Build char offset to start of target line
  let startOfLine = 0;
  for (let i = 0; i < targetLineIdx; i++) {
    startOfLine += (lines[i] ? lines[i].length : 0) + 1;
  }

  // 1a. Exact match at predicted position
  const predictedPos = startOfLine + (context.offset || 0);
  const sample = text.substring(predictedPos, predictedPos + context.selectionText.length);
  if (sample === context.selectionText) return predictedPos;

  // 1b. Fuzzy match
  const normalizedSelection = context.selectionText.replace(/[""''«»]/g, ' ');
  const allWords = normalizedSelection.trim()
    .split(/[\s,\-()""''«»\[\]{}:;!?\/\\]+/)
    .filter(w => w.length > 1 || /^\d+$/.test(w));

  if (allWords.length === 0) return -1;

  const buildPattern = (words) =>
    words.map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^\\n]{0,100}?');

  const findBestMatch = (pattern, isLiteral = false) => {
    try {
      const regex = new RegExp(pattern, (isLiteral ? 'g' : 'gi') + 'u');
      let match, best = null, minDist = Infinity;
      while ((match = regex.exec(text)) !== null) {
        const matchLine = text.substring(0, match.index).split('\n').length;
        const dist = Math.abs(matchLine - (context.line || 1));
        if (dist < minDist) { minDist = dist; best = { index: match.index, line: matchLine, distance: dist }; }
      }
      return best;
    } catch (_e) { return null; }
  };

  let matchResult = findBestMatch(buildPattern(allWords.slice(0, 5)));

  if (!matchResult && allWords.length >= 3) {
    for (let i = 0; i <= allWords.length - 3; i++) {
      const r = findBestMatch(buildPattern(allWords.slice(i, i + 3)));
      if (r && r.distance < 100) { matchResult = r; break; }
    }
  }

  if (!matchResult && allWords.length > 0) {
    const best = [...allWords].sort((a, b) => b.length - a.length)[0];
    if (best.length >= 4) matchResult = findBestMatch(best.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), true);
  }

  if (!matchResult || matchResult.distance > 150) return -1;
  return matchResult.index;
}

/** Returns 1-based line number for a char index in text. */
function lineOf(text, charIdx) {
  if (charIdx < 0) return -1;
  return text.substring(0, charIdx).split('\n').length;
}

/** Full round-trip: context → matched line number (or -1). */
function syncLine(text, context) {
  return lineOf(text, findTargetChar(text, context));
}

/**
 * Mirrors captureEditorSyncData strip logic (sync-service.js).
 * Given a raw markdown line, returns the selectionText that would be sent to syncCursor.
 */
const STRIP_RE = /[#*`_~\[\]()>\-+]/g;
const NOISY_RE = /^[#*`_\-+=~> ]+$/;

function stripLine(rawLine) {
  if (!rawLine || !rawLine.trim() || NOISY_RE.test(rawLine.trim())) return null; // noisy
  return rawLine.replace(STRIP_RE, ' ').trim();
}

// ═══════════════════════════════════════════════════════════════════════
// Sample documents
// ═══════════════════════════════════════════════════════════════════════

const DOC_UNORDERED = [
  '# Shopping List',
  '',
  '- Apples and oranges',
  '- Bread and butter',
  '- Milk',
  '- Coffee beans freshly ground',
  '- Tea',
].join('\n');
// line 3: - Apples and oranges
// line 4: - Bread and butter
// line 5: - Milk           ← short after strip
// line 6: - Coffee beans freshly ground
// line 7: - Tea            ← short after strip

const DOC_ORDERED = [
  '# Steps',
  '',
  '1. Install dependencies',
  '2. Configure settings',
  '3. Run the application',
  '4. Verify output',
].join('\n');
// line 3: 1. Install dependencies
// line 4: 2. Configure settings
// line 5: 3. Run the application
// line 6: 4. Verify output

const DOC_TASK = [
  '# TODO',
  '',
  '- [ ] Write unit tests',
  '- [x] Fix the bug',
  '- [ ] Deploy to production',
  '- [x] Update documentation',
].join('\n');
// line 3: - [ ] Write unit tests
// line 4: - [x] Fix the bug
// line 5: - [ ] Deploy to production
// line 6: - [x] Update documentation

const DOC_NESTED = [
  '# Nested List',
  '',
  '- Parent item alpha',
  '  - Child item beta',
  '    - Grandchild item gamma',
  '  - Child item delta',
  '- Parent item epsilon',
].join('\n');
// line 3: - Parent item alpha
// line 4:   - Child item beta
// line 5:     - Grandchild item gamma
// line 6:   - Child item delta
// line 7: - Parent item epsilon

const DOC_NESTED_ORDERED = [
  '# Mixed Nesting',
  '',
  '1. First step alpha',
  '   1. Sub step one beta',
  '   2. Sub step two gamma',
  '2. Second step delta',
  '3. Third step epsilon',
].join('\n');

const DOC_BLOCKQUOTE = [
  '# Quotes',
  '',
  '> Simple quote here',
  '> Another quote line',
  '>> Nested quote deeper',
  '',
  'Back to normal text.',
].join('\n');
// line 3: > Simple quote here
// line 4: > Another quote line
// line 5: >> Nested quote deeper

const DOC_TABLE = [
  '# Data',
  '',
  '| Name   | Score | Grade |',
  '|--------|-------|-------|',
  '| Alice  | 95    | A     |',
  '| Bob    | 82    | B     |',
  '| Carol  | 78    | C     |',
  '',
  'End of table.',
].join('\n');
// line 3: header
// line 4: separator (noisy)
// line 5: Alice row
// line 6: Bob row
// line 7: Carol row

const DOC_CODE = [
  '# Code',
  '',
  '```python',
  'def fibonacci(n):',
  '    if n <= 1: return n',
  '    return fibonacci(n-1) + fibonacci(n-2)',
  '```',
  '',
  'Call it with fibonacci(10).',
].join('\n');
// line 4: def fibonacci(n):
// line 5:     if n <= 1: return n
// line 6:     return fibonacci(n-1) + fibonacci(n-2)

const DOC_DETAILS = [
  '# Report',
  '',
  '<details>',
  '<summary>Click to expand the summary section</summary>',
  '',
  'This is content inside the details block.',
  'Second line of detail content here.',
  'Third line with more information.',
  '',
  '</details>',
  '',
  'Text after the details block.',
].join('\n');
// The entire details block gets data-line = line 3 (start)

const DOC_MIXED_FORMATS = [
  '# Mixed Document',
  '',
  'Opening paragraph with some introductory text.',
  '',
  '## Section One',
  '',
  '- Unordered item one here',
  '- Unordered item two here',
  '',
  '## Section Two',
  '',
  '1. Ordered item one',
  '2. Ordered item two',
  '',
  '> A blockquote spanning this line',
  '',
  '| Col A  | Col B  |',
  '|--------|--------|',
  '| Value1 | Value2 |',
  '',
  '```js',
  'const x = 42;',
  '```',
].join('\n');

const DOC_FRONTMATTER = [
  '---',
  'title: My Document',
  'date: 2026-05-10',
  'tags: [markdown, test]',
  '---',
  '',
  '# Content starts here',
  '',
  'This is the body text.',
].join('\n');
// line 1: --- (noisy/frontmatter)
// line 2: title: My Document
// line 3: date: 2026-05-10
// line 7: # Content starts here
// line 9: This is the body text.

const DOC_MIXED_STAR = [
  '# Styles',
  '',
  '**Bold text paragraph here**',
  '*Italic text paragraph here*',
  '~~Strikethrough text here~~',
  '`Inline code text here`',
].join('\n');

// ═══════════════════════════════════════════════════════════════════════
// TC-E: captureEditorSyncData strip simulation
// Tests what selectionText is produced for each line type.
// ═══════════════════════════════════════════════════════════════════════

describe('TC-E01 — Strip: Unordered List Items', () => {
  it('- prefix stripped, long text kept', () => {
    expect(stripLine('- Apples and oranges')).toBe('Apples and oranges');
  });

  it('- prefix stripped, multi-word', () => {
    expect(stripLine('- Coffee beans freshly ground')).toBe('Coffee beans freshly ground');
  });

  it('* prefix stripped', () => {
    expect(stripLine('* Item with asterisk marker')).toBe('Item with asterisk marker');
  });

  it('+ prefix stripped', () => {
    expect(stripLine('+ Item with plus marker')).toBe('Item with plus marker');
  });

  it('short item: "- Milk" → "Milk" (4 chars, still matchable)', () => {
    expect(stripLine('- Milk')).toBe('Milk');
  });

  it('very short item: "- Go" → "Go" (2 chars — fuzzy SKIPPED)', () => {
    // findTargetChar requires > 2 chars; "Go" will cause fallback to line number
    const stripped = stripLine('- Go');
    expect(stripped).toBe('Go');
    expect((stripped || '').length).toBeLessThanOrEqual(2);
  });
});

describe('TC-E02 — Strip: Ordered List Items', () => {
  it('1. prefix stripped', () => {
    expect(stripLine('1. Install dependencies')).toBe('1. Install dependencies'.replace(STRIP_RE, ' ').trim());
  });

  it('strip leaves number + text', () => {
    // "1. Install dependencies" → "1. Install dependencies" — dots not stripped
    const result = stripLine('1. Install dependencies');
    expect(result).toContain('Install dependencies');
  });

  it('2. Configure settings', () => {
    const result = stripLine('2. Configure settings');
    expect(result).toContain('Configure settings');
  });
});

describe('TC-E03 — Strip: Task List Items', () => {
  it('- [ ] unchecked → checkbox brackets stripped', () => {
    const result = stripLine('- [ ] Write unit tests');
    expect(result).toContain('Write unit tests');
    expect(result).not.toContain('[');
    expect(result).not.toContain(']');
  });

  it('- [x] checked → checkbox stripped', () => {
    const result = stripLine('- [x] Fix the bug');
    expect(result).toContain('Fix the bug');
    expect(result).not.toContain('[');
  });

  it('stripped task text is > 2 chars (fuzzy match eligible)', () => {
    const result = stripLine('- [ ] Deploy to production');
    expect((result || '').length).toBeGreaterThan(2);
  });
});

describe('TC-E04 — Strip: Blockquotes', () => {
  it('> prefix stripped', () => {
    const result = stripLine('> Simple quote here');
    expect(result).toContain('Simple quote here');
    expect(result).not.toMatch(/^>/);
  });

  it('>> double-nested stripped', () => {
    const result = stripLine('>> Nested quote deeper');
    expect(result).toContain('Nested quote deeper');
  });
});

describe('TC-E05 — Strip: Headings', () => {
  it('# h1 stripped', () => {
    expect(stripLine('# Main Title')).toBe('Main Title');
  });

  it('## h2 stripped', () => {
    expect(stripLine('## Section Two')).toBe('Section Two');
  });

  it('### h3 stripped', () => {
    expect(stripLine('### Subsection Alpha')).toBe('Subsection Alpha');
  });
});

describe('TC-E06 — Strip: Noisy Lines (should return null)', () => {
  it('empty line is noisy', () => {
    expect(stripLine('')).toBeNull();
  });

  it('--- separator is noisy', () => {
    expect(stripLine('---')).toBeNull();
  });

  it('=== is noisy', () => {
    expect(stripLine('===')).toBeNull();
  });

  it('table separator |---|---| — strip leaves "|  |  |" (pipes remain)', () => {
    // BUG NOTE: "|--------|-------|" has "-" stripped but "|" chars remain.
    // NOISY_RE does not include "|", so stripLine returns a non-null string.
    // However, fuzzy tokenizer filters out all length-1 tokens, so allWords=[]
    // and fuzzy match is still skipped → falls back to line number correctly.
    const stripped = stripLine('|--------|-------|');
    // The stripped string is non-null but contains only pipes and spaces
    expect(stripped).not.toBeNull();
    // All meaningful tokens are filtered out by the fuzzy tokenizer (length > 1)
    const words = (stripped || '').split(/\s+/).filter(w => w.length > 1 || /^\d+$/.test(w));
    expect(words.length).toBe(0); // confirms fuzzy will be skipped
  });

  it('pure # line is noisy', () => {
    expect(stripLine('###')).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F: findTargetChar with STRIPPED selectionText (Read→Edit path)
// selectionText here is what the read view captures (no markdown markers)
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F01 — Unordered List: stripped text finds correct line', () => {
  it('long item: "Apples and oranges" finds line 3', () => {
    // Read view captures "Apples and oranges" (no "- " prefix)
    expect(syncLine(DOC_UNORDERED, { line: 3, selectionText: 'Apples and oranges' })).toBe(3);
  });

  it('multi-word item: "Coffee beans freshly ground" finds line 6', () => {
    expect(syncLine(DOC_UNORDERED, { line: 6, selectionText: 'Coffee beans freshly ground' })).toBe(6);
  });

  it('4-char item "Milk" finds line 5 (word ≥4 chars, single-word fallback)', () => {
    // "Milk" is 4 chars → eligible for best-single-word fallback
    expect(syncLine(DOC_UNORDERED, { line: 5, selectionText: 'Milk' })).toBe(5);
  });

  it('"Bread and butter" finds line 4', () => {
    expect(syncLine(DOC_UNORDERED, { line: 4, selectionText: 'Bread and butter' })).toBe(4);
  });
});

describe('TC-F02 — Ordered List: stripped text finds correct line', () => {
  it('"Install dependencies" finds line 3', () => {
    expect(syncLine(DOC_ORDERED, { line: 3, selectionText: 'Install dependencies' })).toBe(3);
  });

  it('"Configure settings" finds line 4', () => {
    expect(syncLine(DOC_ORDERED, { line: 4, selectionText: 'Configure settings' })).toBe(4);
  });

  it('"Run the application" finds line 5', () => {
    expect(syncLine(DOC_ORDERED, { line: 5, selectionText: 'Run the application' })).toBe(5);
  });

  it('"Verify output" finds line 6', () => {
    expect(syncLine(DOC_ORDERED, { line: 6, selectionText: 'Verify output' })).toBe(6);
  });
});

describe('TC-F03 — Task List: stripped text (no checkbox) finds correct line', () => {
  it('"Write unit tests" finds line 3', () => {
    expect(syncLine(DOC_TASK, { line: 3, selectionText: 'Write unit tests' })).toBe(3);
  });

  it('"Fix the bug" finds line 4', () => {
    expect(syncLine(DOC_TASK, { line: 4, selectionText: 'Fix the bug' })).toBe(4);
  });

  it('"Deploy to production" finds line 5', () => {
    expect(syncLine(DOC_TASK, { line: 5, selectionText: 'Deploy to production' })).toBe(5);
  });

  it('"Update documentation" finds line 6', () => {
    expect(syncLine(DOC_TASK, { line: 6, selectionText: 'Update documentation' })).toBe(6);
  });
});

describe('TC-F04 — Blockquote: stripped text finds correct line', () => {
  it('"Simple quote here" (from "> Simple quote here") finds line 3', () => {
    expect(syncLine(DOC_BLOCKQUOTE, { line: 3, selectionText: 'Simple quote here' })).toBe(3);
  });

  it('"Another quote line" finds line 4', () => {
    expect(syncLine(DOC_BLOCKQUOTE, { line: 4, selectionText: 'Another quote line' })).toBe(4);
  });

  it('"Nested quote deeper" (from ">> ...") finds line 5', () => {
    expect(syncLine(DOC_BLOCKQUOTE, { line: 5, selectionText: 'Nested quote deeper' })).toBe(5);
  });
});

describe('TC-F05 — Table: rows and header match', () => {
  it('header row matches line 3', () => {
    // Read view renders "Name Score Grade" (no pipes)
    expect(syncLine(DOC_TABLE, { line: 3, selectionText: 'Name   | Score | Grade' })).toBe(3);
  });

  it('Alice row matches line 5 via fuzzy (pipes stripped)', () => {
    // Read view strips pipes; search with just the text
    expect(syncLine(DOC_TABLE, { line: 5, selectionText: 'Alice  | 95    | A' })).toBe(5);
  });

  it('Bob row matches line 6', () => {
    expect(syncLine(DOC_TABLE, { line: 6, selectionText: 'Bob    | 82    | B' })).toBe(6);
  });

  it('"Alice" word alone matches line 5 (single word fallback)', () => {
    expect(syncLine(DOC_TABLE, { line: 5, selectionText: 'Alice' })).toBe(5);
  });
});

describe('TC-F06 — Code Block: content inside fence', () => {
  it('"def fibonacci" finds line 4', () => {
    expect(syncLine(DOC_CODE, { line: 4, selectionText: 'def fibonacci(n):' })).toBe(4);
  });

  it('"if n <= 1" finds line 5', () => {
    expect(syncLine(DOC_CODE, { line: 5, selectionText: 'if n <= 1: return n' })).toBe(5);
  });

  it('"return fibonacci" finds line 6', () => {
    expect(syncLine(DOC_CODE, { line: 6, selectionText: 'return fibonacci(n-1) + fibonacci(n-2)' })).toBe(6);
  });
});

describe('TC-F07 — Nested List: child items find correct lines', () => {
  it('"Parent item alpha" finds line 3', () => {
    expect(syncLine(DOC_NESTED, { line: 3, selectionText: 'Parent item alpha' })).toBe(3);
  });

  it('"Child item beta" finds line 4', () => {
    expect(syncLine(DOC_NESTED, { line: 4, selectionText: 'Child item beta' })).toBe(4);
  });

  it('"Grandchild item gamma" finds line 5', () => {
    expect(syncLine(DOC_NESTED, { line: 5, selectionText: 'Grandchild item gamma' })).toBe(5);
  });

  it('"Child item delta" finds line 6', () => {
    expect(syncLine(DOC_NESTED, { line: 6, selectionText: 'Child item delta' })).toBe(6);
  });

  it('"Parent item epsilon" finds line 7', () => {
    expect(syncLine(DOC_NESTED, { line: 7, selectionText: 'Parent item epsilon' })).toBe(7);
  });
});

describe('TC-F08 — Nested Ordered List', () => {
  it('"First step alpha" finds line 3', () => {
    expect(syncLine(DOC_NESTED_ORDERED, { line: 3, selectionText: 'First step alpha' })).toBe(3);
  });

  it('"Sub step one beta" finds line 4', () => {
    expect(syncLine(DOC_NESTED_ORDERED, { line: 4, selectionText: 'Sub step one beta' })).toBe(4);
  });

  it('"Sub step two gamma" finds line 5', () => {
    expect(syncLine(DOC_NESTED_ORDERED, { line: 5, selectionText: 'Sub step two gamma' })).toBe(5);
  });

  it('"Second step delta" finds line 6', () => {
    expect(syncLine(DOC_NESTED_ORDERED, { line: 6, selectionText: 'Second step delta' })).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-N: Nested-list & details edge cases
// ═══════════════════════════════════════════════════════════════════════

describe('TC-N01 — Nested list: parent text INCLUDES children (read-view bug)', () => {
  // When the read view captures the outer <li> element and extractCleanText
  // includes all nested children, the selectionText looks like:
  //   "Parent item alpha Child item beta Grandchild item gamma Child item delta"
  // This does NOT match any single line in raw markdown.
  // Fuzzy match should still find the PARENT line via the longest word anchor.

  const combinedText = 'Parent item alpha Child item beta Grandchild item gamma Child item delta';

  it('combined parent+children text still finds parent line via longest word anchor', () => {
    // "Parent" (6), "alpha" (5), "Child" (5), "beta" (4)... head words = first 5
    // Pattern: Parent[...]{0,100}?item[...]{0,100}?alpha[...]{0,100}?Child[...]{0,100}?item
    // This will NOT match a single line in raw markdown.
    // Falls to triple-word: "Parent item alpha" → finds line 3 or fails.
    // Falls to best-single-word: "Parent" (6 chars) → finds line 3.
    const line = syncLine(DOC_NESTED, { line: 3, selectionText: combinedText });
    // Acceptable: finds line 3 (parent) — the nearest occurrence of "Parent"
    expect(line).toBe(3);
  });

  it('combined text with wrong hint still resolves to nearest "Parent" line', () => {
    // If hint is slightly off, nearest-wins logic should still land on line 3
    const line = syncLine(DOC_NESTED, { line: 4, selectionText: combinedText });
    expect([3, 4, 7]).toContain(line); // any "Parent" or "Child" line is acceptable
  });
});

describe('TC-N02 — Details block: single data-line covers entire content', () => {
  // In the rendered HTML, the entire <details> block maps to data-line = start line.
  // When inside a details block and switching Read→Edit, the line hint = start of block.
  // syncCursor must still find content within the block.

  it('content "inside the details block" — hint is start-of-block line', () => {
    // The block starts at line 3 (<details>). Content is on line 6.
    // Read view captures data-line=3 (start), selectionText from DOM is rendered content.
    const selectionText = 'This is content inside the details block.';
    const line = syncLine(DOC_DETAILS, { line: 3, selectionText });
    // Fuzzy should find the text at line 6, which is within 150 lines of hint line 3
    expect(line).toBe(6);
  });

  it('second line of details content — hint still at block start', () => {
    const selectionText = 'Second line of detail content here.';
    const line = syncLine(DOC_DETAILS, { line: 3, selectionText });
    expect(line).toBe(7);
  });

  it('third details line — recovers via fuzzy despite large offset from hint', () => {
    const selectionText = 'Third line with more information.';
    const line = syncLine(DOC_DETAILS, { line: 3, selectionText });
    expect(line).toBe(8);
  });

  it('summary text — hint at block start, finds summary line', () => {
    const selectionText = 'Click to expand the summary section';
    const line = syncLine(DOC_DETAILS, { line: 3, selectionText });
    expect(line).toBe(4);
  });

  it('text AFTER details block resolves correctly', () => {
    const line = syncLine(DOC_DETAILS, { line: 12, selectionText: 'Text after the details block.' });
    expect(line).toBe(12);
  });
});

describe('TC-N03 — Large details block: deep content (offset stress test)', () => {
  // A large details block where content is 80+ lines below the start
  const buildLargeDetails = () => {
    const lines = ['<details>', '<summary>Long document summary</summary>', ''];
    for (let i = 1; i <= 80; i++) {
      lines.push(`Detail line ${i}: content for line item ${i} here`);
    }
    lines.push('</details>');
    return lines.join('\n');
  };

  const doc = buildLargeDetails();

  it('content 50 lines into details block is found (distance < 150)', () => {
    // Hint = line 1 (data-line of block start)
    // Target content is at line ~53 (3 header lines + 50 content lines)
    const selectionText = 'Detail line 50: content for line item 50 here';
    const line = syncLine(doc, { line: 1, selectionText });
    expect(line).toBe(53);
  });

  it('content 80 lines into details block is found (distance = 82, within 150)', () => {
    const selectionText = 'Detail line 80: content for line item 80 here';
    const line = syncLine(doc, { line: 1, selectionText });
    expect(line).toBe(83);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F09: Mixed format document
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F09 — Mixed format document sync', () => {
  it('paragraph text at line 3', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 3,
      selectionText: 'Opening paragraph with some introductory text.'
    })).toBe(3);
  });

  it('unordered item "Unordered item one here" at line 7', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 7,
      selectionText: 'Unordered item one here'
    })).toBe(7);
  });

  it('ordered item "Ordered item one" at line 12', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 12,
      selectionText: 'Ordered item one'
    })).toBe(12);
  });

  it('blockquote "A blockquote spanning this line" at line 15', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 15,
      selectionText: 'A blockquote spanning this line'
    })).toBe(15);
  });

  it('table row "Value1 | Value2" at line 19', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 19,
      selectionText: 'Value1 | Value2 |'
    })).toBe(19);
  });

  it('code content "const x = 42" at line 22', () => {
    expect(syncLine(DOC_MIXED_FORMATS, {
      line: 22,
      selectionText: 'const x = 42;'
    })).toBe(22);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F10: Frontmatter
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F10 — Frontmatter lines', () => {
  it('"title: My Document" finds line 2', () => {
    expect(syncLine(DOC_FRONTMATTER, { line: 2, selectionText: 'title: My Document' })).toBe(2);
  });

  it('"date: 2026-05-10" finds line 3', () => {
    expect(syncLine(DOC_FRONTMATTER, { line: 3, selectionText: 'date: 2026-05-10' })).toBe(3);
  });

  it('body text after frontmatter finds correct line', () => {
    expect(syncLine(DOC_FRONTMATTER, { line: 9, selectionText: 'This is the body text.' })).toBe(9);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F11: Inline formatting (bold, italic, strike, code)
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F11 — Inline formatting (bold/italic/code)', () => {
  it('bold markers stripped, text still matches line 3', () => {
    // Read view shows "Bold text paragraph here" (no **)
    expect(syncLine(DOC_MIXED_STAR, { line: 3, selectionText: 'Bold text paragraph here' })).toBe(3);
  });

  it('italic markers stripped, text still matches line 4', () => {
    expect(syncLine(DOC_MIXED_STAR, { line: 4, selectionText: 'Italic text paragraph here' })).toBe(4);
  });

  it('strikethrough markers stripped, "Strikethrough text here" matches line 5', () => {
    // ~~ not in STRIP_RE, so raw selectionText includes ~~ — fuzzy tokenizer splits on them
    const stripped = 'Strikethrough text here';
    expect(syncLine(DOC_MIXED_STAR, { line: 5, selectionText: stripped })).toBe(5);
  });

  it('backtick inline code stripped, "Inline code text here" matches line 6', () => {
    expect(syncLine(DOC_MIXED_STAR, { line: 6, selectionText: 'Inline code text here' })).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F12: Short list items — known fragile case
// findTargetChar returns -1 when selectionText.length <= 2
// These tests document the CURRENT BEHAVIOUR (some may expose bugs)
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F12 — Short list items (≤2 chars stripped text)', () => {
  const DOC_SHORT = [
    '# Short Items',
    '',
    '- Go',
    '- Do',
    '- Be',
    '- Long enough item',
    '- No',
  ].join('\n');

  it('"Go" (2 chars) → findTargetChar returns -1 (fuzzy skipped)', () => {
    // This is a known limitation: very short items cannot be fuzzy-matched
    expect(findTargetChar(DOC_SHORT, { line: 3, selectionText: 'Go' })).toBe(-1);
  });

  it('"Do" (2 chars) → findTargetChar returns -1', () => {
    expect(findTargetChar(DOC_SHORT, { line: 4, selectionText: 'Do' })).toBe(-1);
  });

  it('"Long enough item" (≥3 chars) → fuzzy match works', () => {
    expect(syncLine(DOC_SHORT, { line: 6, selectionText: 'Long enough item' })).toBe(6);
  });

  it('"No" (2 chars) → returns -1, falls back to line number', () => {
    // When -1 is returned, production code falls back to line number
    const idx = findTargetChar(DOC_SHORT, { line: 7, selectionText: 'No' });
    expect(idx).toBe(-1);
  });

  it('exact raw text "- Go" (with marker) → finds correct line', () => {
    // If selectionText is the RAW markdown (no stripping), exact match works
    expect(syncLine(DOC_SHORT, { line: 3, selectionText: '- Go' })).toBe(3);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F13: Duplicate list items across sections
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F13 — Duplicate list items (nearest-wins)', () => {
  const DOC_DUP_LIST = [
    '## First Section',
    '',
    '- Important item here',
    '- Another item',
    '- Common phrase repeated',
    '',
    '## Second Section',
    '',
    '- Different item',
    '- Common phrase repeated',
    '- Final item',
  ].join('\n');
  // "Common phrase repeated" at lines 5 and 10

  it('hint near line 5 → picks first occurrence', () => {
    expect(syncLine(DOC_DUP_LIST, { line: 5, selectionText: 'Common phrase repeated' })).toBe(5);
  });

  it('hint near line 10 → picks second occurrence', () => {
    expect(syncLine(DOC_DUP_LIST, { line: 10, selectionText: 'Common phrase repeated' })).toBe(10);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-F14: Edit→Read direction (captureEditorSyncData strip, then match in renderer)
// Tests the strip is sufficient for scrollReadViewToLine word scoring
// ═══════════════════════════════════════════════════════════════════════

describe('TC-F14 — Edit→Read: stripped selectionText word coverage', () => {
  // scrollReadViewToLine scores DOM elements by how many words from
  // cleanSearchText appear in element.textContent.
  // Test that stripped text preserves enough words for reliable scoring.

  const assertWordCount = (rawLine, minWords) => {
    const stripped = stripLine(rawLine) || '';
    const words = stripped.split(/\s+/).filter(w => w.length > 2);
    expect(words.length).toBeGreaterThanOrEqual(minWords);
  };

  it('unordered item preserves ≥2 words', () => {
    assertWordCount('- Coffee beans freshly ground', 2);
  });

  it('ordered item preserves ≥2 words', () => {
    assertWordCount('1. Install dependencies now', 2);
  });

  it('task item preserves ≥2 words', () => {
    assertWordCount('- [ ] Deploy to production', 2);
  });

  it('blockquote preserves ≥2 words', () => {
    assertWordCount('> This is a quoted passage', 2);
  });

  it('heading preserves ≥1 word', () => {
    assertWordCount('## Section Title', 1);
  });

  it('table row preserves ≥1 word', () => {
    // "| Alice  | 95    | A     |" → after strip → "Alice  " + spaces
    const stripped = stripLine('| Alice  | 95    | A     |') || '';
    const words = stripped.split(/\s+/).filter(w => w.length > 2);
    expect(words.length).toBeGreaterThanOrEqual(1);
  });
});

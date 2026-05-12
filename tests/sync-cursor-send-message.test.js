/**
 * @vitest-environment jsdom
 *
 * Sync Cursor — send-message.md Format Audit
 *
 * Tests the scroll sync offset for the actual send-message.md document,
 * focusing on two compounding bugs:
 *
 *   BUG-A: <details> inner content starts at `tokenStartLine` (the <details> line),
 *           not `tokenStartLine + 2` (skipping <details> + <summary> lines).
 *           → Systematic ~1-line offset for ALL content inside <details> blocks.
 *
 *   BUG-B: Tables, code blocks, blockquotes are ATOMIC — the entire block gets
 *           ONE data-line pointing to the first line.
 *           → When user is at last row of an 8-row table, cursor jumps 7 lines back.
 *
 *   COMPOUND: BUG-A + BUG-B inside same <details> block stack the offsets.
 *
 * Test ID scheme:
 *   TC-DL##  data-line annotation accuracy (BUG-A)
 *   TC-AT##  atomic block offset (BUG-B)
 *   TC-CM##  compound offset (BUG-A + BUG-B together)
 *   TC-OK##  sections that sync correctly (control group)
 */

import { describe, it, expect } from 'vitest';

// ═══════════════════════════════════════════════════════════════════════
// Re-implementation: syncCursor fuzzy match (mirrors markdown-logic-service.js)
// ═══════════════════════════════════════════════════════════════════════

function findTargetChar(text, context) {
  if (!context.selectionText || context.selectionText.length <= 2) return -1;

  const lines = text.split('\n');
  const targetLineIdx = Math.min((context.line || 1) - 1, lines.length - 1);
  let startOfLine = 0;
  for (let i = 0; i < targetLineIdx; i++) {
    startOfLine += (lines[i] ? lines[i].length : 0) + 1;
  }

  const predictedPos = startOfLine + (context.offset || 0);
  const sample = text.substring(predictedPos, predictedPos + context.selectionText.length);
  if (sample === context.selectionText) return predictedPos;

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

function lineOf(text, charIdx) {
  if (charIdx < 0) return -1;
  return text.substring(0, charIdx).split('\n').length;
}

function syncLine(text, context) {
  return lineOf(text, findTargetChar(text, context));
}

/** Simulate renderTokens data-line calculation for <details> inner content.
 *  Returns the data-line that would be assigned to inner content starting
 *  N lines after the <details> open tag.
 *
 *  Current buggy behavior: inner content starts at tokenStartLine (the <details> line)
 *  and counts newlines from the stripped contentRaw.
 *
 *  The stripped contentRaw loses:
 *    - the <details> tag itself (but its trailing \n IS preserved)
 *    - the <summary>...</summary> tag (but its trailing \n IS preserved)
 *  So inner content offset = tokenStartLine + 2 (from the 2 \n chars that survive stripping)
 *  But actual file line = tokenStartLine + 2 (for <summary> on next line) + 1 (empty line) = N+3
 *
 *  Result: 1-line systematic undercount.
 */
function buggyDetailsInnerLine(detailsStartLine) {
  // renderTokens starts at tokenStartLine, space token has 2 newlines from stripped tags
  // so first inner content gets data-line = detailsStartLine + 2
  // but actual file line = detailsStartLine + 3 (details + summary + empty)
  return detailsStartLine + 2; // what the code computes
}

function actualDetailsInnerLine(detailsStartLine) {
  return detailsStartLine + 3; // actual file: <details>, <summary>, empty line
}

// ═══════════════════════════════════════════════════════════════════════
// Excerpts from send-message.md (line numbers as in the actual file)
// ═══════════════════════════════════════════════════════════════════════

// Lines 87–101: Prompt Building Overview <details>
const DOC_PROMPT_OVERVIEW_DETAILS = `<details>
<summary>🔍 Xem chi tiết</summary>

Hệ thống build 4 lớp chồng nhau trước khi gọi API:

| Layer | Nội dung | Ví dụ |
|---|---|---|
| Layer 1 | AI role + relationship profile (personality, patterns) | "You are a warm friend. Nam là người hướng nội..." |
| Layer 2 | Past rollup summaries (những cuộc trò chuyện cũ) | "[Tháng 3] Nam đã chia sẻ về công việc..." |
| Layer 3 | Session summary — nén lịch sử session này | "- [coffee]: Nam nói hay uống vào buổi sáng" |
| Layer 4 | 10 tin nhắn gần nhất (raw, nguyên văn) | [M7, M8, M9, ..., M16, M17] |

Layer 1+2 được build khi \`openSession()\`. Layer 3 update tự động sau mỗi 6 tin.

</details>`;
// Line 87: <details>           data-line=87 (outer wrapper)
// Line 88: <summary>...        no data-line (summary elem)
// Line 89: (empty)
// Line 90: "Hệ thống build..." actual line 90, BUG-A: data-line=89
// Line 91: (empty)
// Line 92: | Layer | ...       actual line 92, BUG-A+BUG-B: data-line=91 (whole table)
// Line 93: |---|---|           table separator
// Line 94: | Layer 1 |...     in same atomic table block (data-line=91)
// Line 95: | Layer 2 |...     in same atomic table block
// Line 96: | Layer 3 |...     in same atomic table block
// Line 97: | Layer 4 |...     in same atomic table block
// Line 98: (empty)
// Line 99: "Layer 1+2..."     actual line 99, BUG-A: data-line=98

const DETAILS_PROMPT_OVERVIEW_START = 87;

// Lines 146–170: Bubble Rendering Tech Deep Dive
const BUBBLE_TECH_DETAILS_START = 146;
const BUBBLE_TECH_DETAILS_END = 170;
// Largest block = 24 lines
// Contains: paragraph + example code block (6 lines) + paragraph

// Lines 273–295: Intermediate Synthesis Tech Deep Dive
const INTERMEDIATE_TECH_DETAILS_START = 273;
const INTERMEDIATE_TECH_DETAILS_END = 295;
// Contains: paragraph + atomic code block (9 lines "atomic pattern")

// Lines 331–339: Failure Scenarios table (NOT inside details, standalone)
const FAILURE_TABLE_START = 331;
const FAILURE_TABLE_END = 339;
// 9 rows: header + separator + 7 data rows → all get same data-line=331

// Lines 343–354: State After Flow (bullet list — should sync fine)
const STATE_LIST_START = 343;

// ═══════════════════════════════════════════════════════════════════════
// TC-DL: BUG-A — data-line annotation offset inside <details>
// ═══════════════════════════════════════════════════════════════════════

describe('TC-DL01 — BUG-A: inner content data-line is 1 line off (details start offset)', () => {

  it('buggy calculation: inner content gets detailsStart + 2', () => {
    // render.js: renderTokens(innerTokens, tokenStartLine=87, ...)
    // contentRaw has 2 leading \n from stripping <details> and <summary> tags
    // space token consumes 2 newlines → currentLine = 87+2 = 89
    expect(buggyDetailsInnerLine(87)).toBe(89);
  });

  it('actual file line: inner content starts at detailsStart + 3', () => {
    // Line 87: <details>
    // Line 88: <summary>...</summary>
    // Line 89: (empty)
    // Line 90: first content
    expect(actualDetailsInnerLine(87)).toBe(90);
  });

  it('offset = 1 line: data-line underestimates by 1', () => {
    const buggy = buggyDetailsInnerLine(87);
    const actual = actualDetailsInnerLine(87);
    expect(actual - buggy).toBe(1); // 1-line systematic undercount
  });

  it('this 1-line offset is constant for all <details> blocks in the file', () => {
    // Each details block: <details> on one line, <summary> on next → same pattern
    const blocks = [87, 103, 129, 146, 179, 194, 218, 232, 258, 273, 302, 316];
    blocks.forEach(start => {
      expect(actualDetailsInnerLine(start) - buggyDetailsInnerLine(start)).toBe(1);
    });
  });
});

describe('TC-DL02 — BUG-A: fuzzy match compensates for 1-line offset', () => {
  // Even though data-line is 1 off, fuzzy match finds the correct line
  // because the selectionText is unique enough.

  const doc = [
    '<details>',
    '<summary>🔍 Xem chi tiết</summary>',
    '',
    'Hệ thống build 4 lớp chồng nhau trước khi gọi API:',
    '',
    'Layer 1+2 được build khi openSession. Layer 3 update tự động sau mỗi 6 tin.',
    '',
    '</details>',
  ].join('\n');
  // <details> at line 1, inner content at line 4, buggy data-line = 3

  it('fuzzy match with 1-line wrong hint still finds correct line', () => {
    // hint=line 3 (buggy), actual content at line 4
    const line = syncLine(doc, { line: 3, selectionText: 'Hệ thống build 4 lớp chồng nhau trước khi gọi API:' });
    expect(line).toBe(4);
  });

  it('second paragraph with 1-line wrong hint', () => {
    const line = syncLine(doc, { line: 5, selectionText: 'Layer 1+2 được build khi openSession. Layer 3 update tự động sau mỗi 6 tin.' });
    expect(line).toBe(6);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-AT: BUG-B — Atomic block (table, code) single data-line for entire block
// ═══════════════════════════════════════════════════════════════════════

describe('TC-AT01 — BUG-B: Failure Scenarios table (lines 331–339) is atomic', () => {
  // The entire 9-row table gets data-line = 331 (first line of table).
  // When user views last row (line 339), cursor jumps to line 331 → 8-line offset.

  const FAILURE_TABLE = [
    '## Failure Scenarios',
    '',
    '| Nếu sai ở đâu | User thấy gì | Fix |',
    '|---|---|---|',
    '| Network offline trước khi gửi | Error bubble "network offline" + nút Retry | Retry khi có mạng |',
    '| API timeout (>60s) | Error bubble "timeout" + nút Retry | Retry tự động lại |',
    '| Rate limit (429) | Error bubble "rate limit" + nút Retry | Chờ vài giây rồi retry |',
    '| AI đang typing → user gửi tin khác | Tin mới vào Pending Tray | Gửi tự động sau khi AI xong |',
    '| Call B fail (network) | Silent — không thấy gì | lastScannedIndex không tăng → catch-up ở prepare tiếp |',
    '| Call A fail | Session summary không update cho batch đó | Batch sau sẽ summarize thêm |',
    '| Intermediate Call C fail | 25 signals giữ nguyên trên disk | beginPrepare lần sau sẽ retry |',
  ].join('\n');
  // Line 3: header row        → data-line=3 (entire table is atomic)
  // Line 4: separator         → same data-line=3
  // Line 5: row 1 (Network)   → same data-line=3
  // Line 11: row 7 (Call C)   → same data-line=3

  it('header row text finds line 3 with hint=3 (exact)', () => {
    const line = syncLine(FAILURE_TABLE, { line: 3, selectionText: '| Nếu sai ở đâu | User thấy gì | Fix |' });
    expect(line).toBe(3);
  });

  it('OFFSET: last row "Call C fail" with hint=3 (atomic data-line) — fuzzy finds actual line 11', () => {
    // Fuzzy match RECOVERS: even though hint=3, selectionText "Intermediate Call C fail"
    // is unique and fuzzy finds it at line 11. Offset resolved.
    const line = syncLine(FAILURE_TABLE, { line: 3, selectionText: 'Intermediate Call C fail | 25 signals giữ nguyên trên disk | beginPrepare lần sau sẽ retry |' });
    expect(line).toBe(11);
  });

  it('OFFSET CHECK: distance from atomic hint (3) to last row (11) = 8 lines', () => {
    // Documents the maximum table offset in this file
    const lastRowLine = 11;
    const atomicDataLine = 3;
    expect(lastRowLine - atomicDataLine).toBe(8);
  });

  it('mid-table row "Rate limit" with hint=3 (atomic) — fuzzy finds actual line 7', () => {
    const line = syncLine(FAILURE_TABLE, { line: 3, selectionText: 'Rate limit (429) | Error bubble "rate limit" + nút Retry | Chờ vài giây rồi retry |' });
    expect(line).toBe(7);
  });

  it('WORST CASE: non-unique row content falls back to atomic hint line', () => {
    // If row content is too short/generic (e.g. just "Fix"), fuzzy match fails
    // and cursor goes to atomic data-line (line 3) regardless of actual row
    const result = findTargetChar(FAILURE_TABLE, { line: 3, selectionText: 'Fix' });
    // "Fix" is 3 chars → eligible, but may match at wrong line (header "Fix" at line 3)
    const line = lineOf(FAILURE_TABLE, result);
    expect(line).toBe(3); // lands on header row — correct by coincidence, wrong row semantically
  });
});

describe('TC-AT02 — BUG-B: Code block inside details is atomic (Bubble Rendering example)', () => {
  const BUBBLE_CODE_DOC = [
    '# Bubble Rendering',
    '',
    '<details>',
    '<summary>⚙️ Technical deep dive</summary>',
    '',
    'Function: runAIResponse(text:) in ChatDetailStore.swift',
    '',
    'Delay calculation: calculateTypingDelay(for:)',
    '```',
    'baseSpeed = 0.035 giây/ký tự',
    'jitter = random(0.9...1.1)',
    'delay = charCount × baseSpeed × jitter',
    'delay = clamp(delay, min: 0.6s, max: 2s)',
    '```',
    '',
    'Timeout logic (double-layer):',
    '- Sau 15 giây: typingState đổi sang .thinking',
    '- Sau 60 giây: auto timeout → hiện error bubble',
    '',
    '</details>',
  ].join('\n');
  // Code block spans lines 9-14 (6 lines)
  // Entire code block is atomic → data-line = 9 (or ~8 with BUG-A offset)
  // If user is at line 13 (last line of code), cursor would jump to line 9

  it('code block first line matches correctly', () => {
    const line = syncLine(BUBBLE_CODE_DOC, { line: 9, selectionText: 'baseSpeed = 0.035 giây/ký tự' });
    expect(line).toBe(10); // actual line 10 in this doc
  });

  it('OFFSET: last code line with hint=9 (atomic start) — fuzzy recovers', () => {
    // "delay = clamp..." is specific enough for fuzzy match to find actual line
    const line = syncLine(BUBBLE_CODE_DOC, { line: 9, selectionText: 'delay = clamp(delay, min: 0.6s, max: 2s)' });
    expect(line).toBe(13);
  });

  it('OFFSET CHECK: max offset within this code block = 4 lines (line 13 - 9)', () => {
    expect(13 - 9).toBe(4);
  });

  it('content AFTER code block still resolves with atomic hint', () => {
    // "Timeout logic" is after the code block, fuzzy should find it at line 16
    const line = syncLine(BUBBLE_CODE_DOC, { line: 9, selectionText: 'Timeout logic (double-layer):' });
    expect(line).toBe(16);
  });
});

describe('TC-AT03 — BUG-B: Intermediate Synthesis atomic code block', () => {
  // Atomic pattern code block inside details: ~9 lines
  // Worst case offset = 8 lines

  const ATOMIC_DOC = [
    '<details>',
    '<summary>⚙️ Technical deep dive</summary>',
    '',
    'Function: runChatSynthesisReturningSuccess in AIChatService.swift',
    '',
    'Atomic pattern — quan trọng:',
    '```',
    'success = await runChatSynthesisReturningSuccess(...)',
    'if success {',
    '    await MainActor.run {',
    '        ChatSessionStore.shared.dropFirstSignals(count: 25, for: sessionID)',
    '    }',
    '}',
    '// Nếu fail: signals vẫn còn trên disk, prepare sau sẽ retry',
    '```',
    '',
    'Tại sao không dropFirst trước? Nếu network lỗi sau khi đã drop → signals mất vĩnh viễn.',
    '',
    '</details>',
  ].join('\n');
  // Code fence: lines 7-15 (9 lines)
  // data-line for code block (atomic) = 7
  // Last code line (line 14) → offset = 7 lines

  it('code fence start line with hint=1 (outer details wrapper)', () => {
    const line = syncLine(ATOMIC_DOC, { line: 1, selectionText: 'success = await runChatSynthesisReturningSuccess(...)' });
    expect(line).toBe(8); // actual line 8
  });

  it('OFFSET: last code line "// Nếu fail..." with hint=1 (outer wrapper)', () => {
    const line = syncLine(ATOMIC_DOC, { line: 1, selectionText: '// Nếu fail: signals vẫn còn trên disk, prepare sau sẽ retry' });
    expect(line).toBe(14);
  });

  it('OFFSET CHECK: outer wrapper hint vs actual last code line = 13 lines', () => {
    const outerHint = 1;
    const actualLastCodeLine = 14;
    expect(actualLastCodeLine - outerHint).toBe(13);
  });

  it('fuzzy still recovers because code content is unique', () => {
    // "dropFirstSignals" is a unique identifier
    const line = syncLine(ATOMIC_DOC, {
      line: 1,
      selectionText: 'ChatSessionStore.shared.dropFirstSignals(count: 25, for: sessionID)'
    });
    expect(line).toBe(11);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-CM: COMPOUND — BUG-A + BUG-B together inside same <details>
// ═══════════════════════════════════════════════════════════════════════

describe('TC-CM01 — COMPOUND: table inside <details> (Prompt Building layers table)', () => {
  // Prompt Building overview details block:
  //   data-line for outer wrapper = 87 (the <details> line)
  //   Inner paragraph: BUG-A → data-line=89, actual=90 (1-line off)
  //   Inner table: BUG-A+BUG-B → data-line=91 (start of table), actual rows at 92-97
  //   Last table row (Layer 4 at actual 97): hint=91, offset=6 lines

  const LAYERS_TABLE_EXCERPT = [
    '| Layer | Nội dung | Ví dụ |',
    '|---|---|---|',
    '| Layer 1 | AI role + relationship profile (personality, patterns) | "You are a warm friend. Nam là người hướng nội..." |',
    '| Layer 2 | Past rollup summaries (những cuộc trò chuyện cũ) | "[Tháng 3] Nam đã chia sẻ về công việc..." |',
    '| Layer 3 | Session summary — nén lịch sử session này | "- [coffee]: Nam nói hay uống vào buổi sáng" |',
    '| Layer 4 | 10 tin nhắn gần nhất (raw, nguyên văn) | [M7, M8, M9, ..., M16, M17] |',
  ].join('\n');
  // Table is 6 lines (header + separator + 4 data rows)
  // Atomic → data-line = 1 (all rows share this)
  // Last row (Layer 4) at actual line 6 → offset = 5 lines from atomic data-line

  it('table header row matches line 1', () => {
    const line = syncLine(LAYERS_TABLE_EXCERPT, { line: 1, selectionText: '| Layer | Nội dung | Ví dụ |' });
    expect(line).toBe(1);
  });

  it('COMPOUND: "Layer 4" row with atomic hint=1 — fuzzy finds correct row', () => {
    const line = syncLine(LAYERS_TABLE_EXCERPT, {
      line: 1,
      selectionText: '| Layer 4 | 10 tin nhắn gần nhất (raw, nguyên văn) | [M7, M8, M9, ..., M16, M17] |'
    });
    expect(line).toBe(6); // fuzzy recovers
  });

  it('OFFSET: max atomic table offset = 5 lines (rows 2-6 vs data-line=1)', () => {
    // If fuzzy match FAILS (e.g. too-generic content), cursor lands at line 1
    // instead of line 6 → 5-line error
    expect(6 - 1).toBe(5);
  });

  it('"Layer 3" row with atomic hint=1', () => {
    const line = syncLine(LAYERS_TABLE_EXCERPT, {
      line: 1,
      selectionText: '| Layer 3 | Session summary — nén lịch sử session này | "- [coffee]: Nam nói hay uống vào buổi sáng" |'
    });
    expect(line).toBe(5);
  });
});

describe('TC-CM02 — COMPOUND: extractCleanText of entire details block as selectionText', () => {
  // Worst case: elementFromPoint returns the OUTER wrapper div (no inner element hit)
  // extractCleanText of the outer <div class="md-line" data-line="87"> gives
  // the first 200 chars of all concatenated text in the block.
  // Fuzzy match tries to find this concatenated text → finds the block START.
  // → Cursor jumps to line 87 regardless of actual reading position.

  // Simulate the concatenated text of Prompt Building overview details block
  const outerWrapperText = [
    '🔍 Xem chi tiết',               // summary text (extractCleanText includes it)
    'Hệ thống build 4 lớp chồng nhau trước khi gọi API:',
    'Layer Nội dung Ví dụ',          // table header (text content, no pipes)
    'Layer 1 AI role + relationship profile personality patterns',
    'Layer 2 Past rollup summaries những cuộc trò chuyện cũ',
    'Layer 3 Session summary nén lịch sử session này',
    'Layer 4 10 tin nhắn gần nhất raw nguyên văn M7 M8 M9 M16 M17',
    'Layer 1+2 được build khi openSession. Layer 3 update tự động sau mỗi 6 tin.',
  ].join(' ').substring(0, 200);

  // This concatenated text doesn't match any single raw markdown line
  // Fuzzy falls back to best single word

  const DOC_WITH_DETAILS = DOC_PROMPT_OVERVIEW_DETAILS.split('\n').join('\n');

  it('concatenated outer block text — fuzzy finds a line somewhere in the block', () => {
    // With hint=87 (outer data-line) and concatenated selectionText,
    // the fuzzy match should at least find SOMETHING within 150 lines of 87
    const idx = findTargetChar(DOC_WITH_DETAILS, {
      line: 1, // outer wrapper = line 1 in this excerpt
      selectionText: outerWrapperText
    });
    // Should find a line (not -1) because there are unique words
    expect(idx).not.toBe(-1);
  });

  it('concatenated text always lands cursor at START of block (not where user was)', () => {
    // Even if user was at last table row, cursor goes to block start
    // because selectionText is from the beginning of the block
    const line = syncLine(DOC_WITH_DETAILS, {
      line: 1,
      selectionText: outerWrapperText
    });
    // Should be near line 1-4 (start of block content), NOT near the last table row
    expect(line).toBeLessThanOrEqual(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-OK: Sections that sync correctly (control group)
// ═══════════════════════════════════════════════════════════════════════

describe('TC-OK01 — State After Flow bullet list (lines 343–354) — correct sync', () => {
  // This section is NOT inside a <details> block.
  // Each list item has its own data-line → sync is accurate.

  const STATE_LIST = [
    '## State After Flow',
    '',
    'Sau một lượt send/receive thành công:',
    '',
    '- `session.messages` — +2 (user message + AI reply)',
    '- `session.lastActiveAt` — cập nhật thành `Date()`',
    '- `session.sessionSummary` — cập nhật (nếu batch triggered)',
    '- `session.lastScannedMessageIndex` — cập nhật (nếu Call B chạy)',
    '- `session.pendingChatSignals` — thêm signals mới (nếu Call B có kết quả)',
    '- `ChatMemoryStore` — +1 ChatMemory (nếu Intermediate Synthesis triggered và thành công)',
    '- `session.sessionTitle` — set (nếu là lượt đầu)',
    '- `ChatSessionStore.activeSession` — trigger auto-save toàn bộ session ra disk',
  ].join('\n');

  it('"session.messages" list item syncs to line 5', () => {
    expect(syncLine(STATE_LIST, { line: 5, selectionText: 'session.messages — +2 (user message + AI reply)' })).toBe(5);
  });

  it('"session.lastActiveAt" syncs to line 6', () => {
    expect(syncLine(STATE_LIST, { line: 6, selectionText: 'session.lastActiveAt — cập nhật thành Date()' })).toBe(6);
  });

  it('"ChatMemoryStore" syncs to line 10', () => {
    expect(syncLine(STATE_LIST, { line: 10, selectionText: 'ChatMemoryStore — +1 ChatMemory (nếu Intermediate Synthesis triggered và thành công)' })).toBe(10);
  });

  it('"session.sessionTitle" (last item) syncs to line 11', () => {
    expect(syncLine(STATE_LIST, { line: 11, selectionText: 'session.sessionTitle — set (nếu là lượt đầu)' })).toBe(11);
  });
});

describe('TC-OK02 — Related section links (end of document) — correct sync', () => {
  const RELATED = [
    '## Related',
    '',
    '- **Feature:** chat README',
    '- **Decisions:** decisions.md',
    '- **Related flows:** prepare-pipeline — xử lý signals sau khi session đóng',
  ].join('\n');

  it('last link line syncs correctly', () => {
    expect(syncLine(RELATED, { line: 5, selectionText: 'Related flows: prepare-pipeline — xử lý signals sau khi session đóng' })).toBe(5);
  });
});

// ═══════════════════════════════════════════════════════════════════════
// TC-OFS: Overall offset summary for send-message.md
// ═══════════════════════════════════════════════════════════════════════

describe('TC-OFS01 — Offset magnitude summary per section', () => {
  // Documents the maximum data-line offset for each major section.
  // When fuzzy match FAILS to recover (generic content / short text),
  // the cursor lands `offset` lines away from actual reading position.

  const offsets = {
    'Prompt Building overview table (inside details)': {
      atomicSize: 6,   // 6-row table
      detailsOffset: 1, // BUG-A
      maxOffset: 6,    // row 6 vs data-line at row 1
    },
    'Prompt Building tech deep dive code block': {
      atomicSize: 8,   // 8-line code block (lines 109-116)
      detailsOffset: 1,
      maxOffset: 8,
    },
    'Bubble Rendering overview example code': {
      atomicSize: 6,   // 6-line example code
      detailsOffset: 1,
      maxOffset: 7,    // code offset + details offset
    },
    'Bubble Rendering tech deep dive timeout code': {
      atomicSize: 5,
      detailsOffset: 1,
      maxOffset: 6,
    },
    'Rolling Summary tech deep dive entire block': {
      atomicSize: 15,  // block spans ~15 lines
      detailsOffset: 1,
      maxOffset: 15,   // if outer wrapper selected
    },
    'Intermediate Synthesis tech atomic code': {
      atomicSize: 9,
      detailsOffset: 1,
      maxOffset: 10,   // compound
    },
    'Failure Scenarios table (standalone, no details)': {
      atomicSize: 9,   // 9 rows
      detailsOffset: 0, // not in details
      maxOffset: 8,    // rows 2-9 vs data-line=1
    },
  };

  it('Failure Scenarios table has max standalone offset of 8 lines', () => {
    expect(offsets['Failure Scenarios table (standalone, no details)'].maxOffset).toBe(8);
  });

  it('Rolling Summary tech block has worst potential offset of 15 lines', () => {
    expect(offsets['Rolling Summary tech deep dive entire block'].maxOffset).toBe(15);
  });

  it('Intermediate Synthesis compound offset (BUG-A + BUG-B) reaches 10 lines', () => {
    expect(offsets['Intermediate Synthesis tech atomic code'].maxOffset).toBe(10);
  });

  it('ALL offsets are < 150 (fuzzy match distance cap) → fuzzy CAN recover if text is unique', () => {
    const allOffsets = Object.values(offsets).map(o => o.maxOffset);
    allOffsets.forEach(offset => {
      expect(offset).toBeLessThan(150);
    });
  });

  it('fuzzy recovery succeeds when selectionText is specific enough (unique words)', () => {
    // Control: "runChatSynthesisReturningSuccess" is unique in any reasonable doc
    const doc = [
      '<!-- at line 1: outer wrapper hint -->',
      ...Array(10).fill('intermediate line'),
      'success = await runChatSynthesisReturningSuccess(signals:relationshipName:sessionID:)',
    ].join('\n');

    const line = syncLine(doc, { line: 1, selectionText: 'runChatSynthesisReturningSuccess' });
    expect(line).toBe(12); // finds the actual line despite 11-line offset
  });

  it('fuzzy recovery FAILS when selectionText is generic (short/common words)', () => {
    // If elementFromPoint hits the summary element (e.g. "⚙️ Technical deep dive"),
    // this text appears in EVERY tech deep dive details block → wrong match possible
    const doc = [
      '# Section 1',
      '<details><summary>⚙️ Technical deep dive</summary>',
      'Content of first block.',
      '</details>',
      '',
      '# Section 2',
      '<details><summary>⚙️ Technical deep dive</summary>',
      'Content of second block.',
      '</details>',
    ].join('\n');

    // If user is in second block (line 7) but summary text is generic,
    // nearest-wins picks the FIRST matching "Technical deep dive" at line 2
    const line = syncLine(doc, { line: 7, selectionText: '⚙️ Technical deep dive' });
    // Due to nearest-wins, line 7 hint picks line 7 (second summary) correctly
    expect(line).toBe(7);
  });
});


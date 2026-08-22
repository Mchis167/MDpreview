/**
 * lineDiff.js — line-level diff used by MDpreview's diff mode.
 *
 * Pure logic, no vscode dependency, so it can be unit-tested directly
 * (tests/vscode-extension-line-diff.test.js).
 *
 * Why lines and not markdown blocks: the renderer already wraps every top-level
 * markdown token in a .md-block carrying data-line-start/data-line-end. Diffing
 * by line and then marking any block whose range contains a changed line gives
 * block-level highlighting for free, and stays correct for constructs where one
 * block spans blank lines (lists, fenced code).
 */

'use strict';

// LCS is O(n*m) in time and memory. Past this many cells we stop trying to be
// clever and report "everything changed" — a rewrite that large is not
// reviewable block-by-block anyway.
const MAX_CELLS = 2_000_000;

function allLines(count) {
  return Array.from({ length: count }, (_, i) => i + 1);
}

/**
 * @param {string[]} oldLines
 * @param {string[]} newLines
 * @returns {{
 *   oldChanged: number[],  // 1-based lines present only on the old side
 *   newChanged: number[],  // 1-based lines present only on the new side
 *   oldToNew: Object<number, number>,  // matched lines, for scroll sync
 *   newToOld: Object<number, number>,
 *   truncated: boolean
 * }}
 */
function diffLines(oldLines, newLines) {
  const oldLen = oldLines.length;
  const newLen = newLines.length;

  // Trim the common prefix and suffix first. Claude's edits usually touch a
  // small region of a long document, so this is what keeps the DP cheap.
  let prefix = 0;
  while (prefix < oldLen && prefix < newLen && oldLines[prefix] === newLines[prefix]) prefix++;

  let suffix = 0;
  while (
    suffix < oldLen - prefix &&
    suffix < newLen - prefix &&
    oldLines[oldLen - 1 - suffix] === newLines[newLen - 1 - suffix]
  ) {
    suffix++;
  }

  const oldMid = oldLines.slice(prefix, oldLen - suffix);
  const newMid = newLines.slice(prefix, newLen - suffix);

  const oldToNew = {};
  const newToOld = {};
  const addMatch = (o, n) => {
    oldToNew[o] = n;
    newToOld[n] = o;
  };
  for (let i = 0; i < prefix; i++) addMatch(i + 1, i + 1);
  for (let i = 0; i < suffix; i++) addMatch(oldLen - i, newLen - i);

  if (oldMid.length * newMid.length > MAX_CELLS) {
    return {
      oldChanged: allLines(oldLen),
      newChanged: allLines(newLen),
      oldToNew: {},
      newToOld: {},
      truncated: true
    };
  }

  // Classic LCS table over the trimmed middle.
  const rows = oldMid.length + 1;
  const cols = newMid.length + 1;
  const table = new Int32Array(rows * cols);
  for (let i = oldMid.length - 1; i >= 0; i--) {
    for (let j = newMid.length - 1; j >= 0; j--) {
      table[i * cols + j] =
        oldMid[i] === newMid[j]
          ? table[(i + 1) * cols + (j + 1)] + 1
          : Math.max(table[(i + 1) * cols + j], table[i * cols + (j + 1)]);
    }
  }

  const oldChanged = [];
  const newChanged = [];
  let i = 0;
  let j = 0;
  while (i < oldMid.length && j < newMid.length) {
    if (oldMid[i] === newMid[j]) {
      addMatch(prefix + i + 1, prefix + j + 1);
      i++;
      j++;
    } else if (table[(i + 1) * cols + j] >= table[i * cols + (j + 1)]) {
      oldChanged.push(prefix + i + 1);
      i++;
    } else {
      newChanged.push(prefix + j + 1);
      j++;
    }
  }
  while (i < oldMid.length) oldChanged.push(prefix + i++ + 1);
  while (j < newMid.length) newChanged.push(prefix + j++ + 1);

  return { oldChanged, newChanged, oldToNew, newToOld, truncated: false };
}

module.exports = { diffLines };

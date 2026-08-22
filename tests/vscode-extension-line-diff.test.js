import { describe, it, expect } from 'vitest';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { diffLines } = require('../vscode-extension/lineDiff.js');

const lines = (s) => s.split('\n');

describe('diffLines', () => {
  it('reports nothing changed for identical input', () => {
    const r = diffLines(lines('a\nb\nc'), lines('a\nb\nc'));
    expect(r.oldChanged).toEqual([]);
    expect(r.newChanged).toEqual([]);
  });

  it('marks an inserted line on the new side only', () => {
    const r = diffLines(lines('a\nb'), lines('a\nx\nb'));
    expect(r.oldChanged).toEqual([]);
    expect(r.newChanged).toEqual([2]);
  });

  it('marks a deleted line on the old side only', () => {
    const r = diffLines(lines('a\nx\nb'), lines('a\nb'));
    expect(r.oldChanged).toEqual([2]);
    expect(r.newChanged).toEqual([]);
  });

  it('marks a replaced line on both sides', () => {
    const r = diffLines(lines('a\nb\nc'), lines('a\nB\nc'));
    expect(r.oldChanged).toEqual([2]);
    expect(r.newChanged).toEqual([2]);
  });

  it('uses 1-based line numbers', () => {
    const r = diffLines(lines('x'), lines('y'));
    expect(r.oldChanged).toEqual([1]);
    expect(r.newChanged).toEqual([1]);
  });

  it('aligns unchanged lines so each side can find its counterpart', () => {
    // old: a b c      new: a x b c
    const r = diffLines(lines('a\nb\nc'), lines('a\nx\nb\nc'));
    expect(r.oldToNew).toEqual({ 1: 1, 2: 3, 3: 4 });
    expect(r.newToOld).toEqual({ 1: 1, 3: 2, 4: 3 });
  });

  it('handles one side being empty', () => {
    expect(diffLines([], lines('a\nb')).newChanged).toEqual([1, 2]);
    expect(diffLines(lines('a\nb'), []).oldChanged).toEqual([1, 2]);
  });

  it('does not treat repeated identical lines as a wholesale rewrite', () => {
    const r = diffLines(lines('x\nx\nx'), lines('x\nx\nx\nx'));
    expect(r.oldChanged).toEqual([]);
    expect(r.newChanged.length).toBe(1);
  });

  it('degrades to "everything changed" instead of exploding on huge inputs', () => {
    const big = (n, tag) => Array.from({ length: n }, (_, i) => `${tag}${i}`);
    const r = diffLines(big(3000, 'a'), big(3000, 'b'));
    expect(r.oldChanged.length).toBe(3000);
    expect(r.newChanged.length).toBe(3000);
    expect(r.truncated).toBe(true);
  });
});

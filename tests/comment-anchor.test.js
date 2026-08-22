import { describe, it, expect } from 'vitest';
const { buildContext, findAnchor } = require('../shared/comment-anchor.js');

describe('comment-anchor: buildContext', () => {
  it('captures surrounding text within radius', () => {
    const line = 'The quick brown fox jumps over the lazy dog';
    const offset = line.indexOf('brown fox');
    const ctx = buildContext(line, offset, 'brown fox');
    expect(ctx.before).toBe('The quick ');
    expect(ctx.after).toBe(' jumps over the lazy dog');
  });

  it('prefixes/suffixes with "..." when truncated by radius', () => {
    const long = 'x'.repeat(100);
    const line = `${long}TARGET${long}`;
    const offset = line.indexOf('TARGET');
    const ctx = buildContext(line, offset, 'TARGET');
    expect(ctx.before.startsWith('...')).toBe(true);
    expect(ctx.after.endsWith('...')).toBe(true);
    expect(ctx.before.length).toBe(63); // '...' + 60 chars
    expect(ctx.after.length).toBe(63);
  });

  it('does not truncate when surrounding text is shorter than radius', () => {
    const line = 'short TARGET text';
    const offset = line.indexOf('TARGET');
    const ctx = buildContext(line, offset, 'TARGET');
    expect(ctx.before).toBe('short ');
    expect(ctx.after).toBe(' text');
  });
});

describe('comment-anchor: findAnchor', () => {
  it('finds the unique occurrence with no ambiguity', () => {
    const idx = findAnchor('The quick brown fox', 'brown fox', { before: 'quick ', after: '' });
    expect(idx).toBe('The quick '.length);
  });

  it('picks the occurrence whose context matches best among duplicates', () => {
    const content = 'shared token here, then another shared token there';
    const ctx = { before: 'another ', after: ' token there' };
    const idx = findAnchor(content, 'shared', ctx);
    expect(idx).toBe(content.lastIndexOf('shared'));
  });

  it('re-finds text at a shifted position when surrounding content changed slightly', () => {
    // Simulates drift: original context still recognizable nearby.
    const content = 'AAA The quick brown fox jumps over the lazy dog BBB';
    const ctx = { before: 'The quick ', after: ' jumps over' };
    const idx = findAnchor(content, 'brown fox', ctx);
    expect(idx).toBe(content.indexOf('brown fox'));
  });

  it('falls back to first occurrence when context does not disambiguate', () => {
    const content = 'alpha beta alpha beta';
    const idx = findAnchor(content, 'alpha', { before: '', after: '' });
    expect(idx).toBe(0);
  });

  it('falls back to plain indexOf when context scoring finds nothing better', () => {
    const content = 'only one match here';
    const idx = findAnchor(content, 'one match', null);
    expect(idx).toBe(content.indexOf('one match'));
  });

  it('falls back to whitespace-normalized match when exact text differs by whitespace', () => {
    const content = 'line one\n  has   extra   spaces  here';
    const idx = findAnchor(content, 'has extra spaces', { before: '', after: '' });
    expect(idx).not.toBe(-1);
  });

  it('returns -1 when selectedText cannot be found anywhere', () => {
    const idx = findAnchor('completely different content', 'nowhere to be found', { before: '', after: '' });
    expect(idx).toBe(-1);
  });

  it('returns -1 when selectedText is empty', () => {
    expect(findAnchor('some content', '', { before: '', after: '' })).toBe(-1);
  });
});

describe('comment-anchor: buildContext + findAnchor round-trip', () => {
  it('a context built from a line can relocate the same text in that line', () => {
    const line = 'Some prefix text and then the important phrase and a suffix';
    const selectedText = 'important phrase';
    const offset = line.indexOf(selectedText);
    const ctx = buildContext(line, offset, selectedText);

    expect(findAnchor(line, selectedText, ctx)).toBe(offset);
  });
});

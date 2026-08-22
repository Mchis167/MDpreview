/**
 * @vitest-environment jsdom
 *
 * Baseline for renderer/js/modules/comments.js BEFORE extracting
 * comment-anchor.js / comments-core.js (see docs/superpowers/specs/
 * 2026-08-22-vscode-extension-port-design.md, phase 1).
 *
 * Note: `save` and `remove` are NOT part of CommentsModule's public
 * return value today — they're only reachable internally, driven by
 * form/DOM events (_submitForm, item delete button). Phase 2's
 * comments-core.js is expected to expose them directly; until then
 * this baseline drives state through the one seam that IS public:
 * loadForFile() (which reads from electronAPI.getComments) and clear().
 *
 * This still exercises the two things that matter most for the
 * upcoming extraction:
 *  - the line-anchor scoring algorithm (drift compensation +
 *    in-line highlight matching), run as a side effect of loadForFile
 *  - clear() wiping state via electronAPI.clearComments
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

global.RightSidebar = { getInstance: () => null }; // forces _renderList() to no-op
global.AppState = { currentWorkspace: { id: 'ws-1' }, currentFile: 'docs/plan.md', currentMode: 'edit' };
global.showToast = vi.fn();
global.navigator.clipboard = { writeText: vi.fn(() => Promise.resolve()) };

global.window.CommentAnchor = require('../shared/comment-anchor.js');

const componentPath = path.resolve(__dirname, '../renderer/js/modules/comments.js');
const componentCode = fs.readFileSync(componentPath, 'utf8');
// eslint-disable-next-line no-new-func
const script = new Function('window', 'document', 'navigator', 'CommentAnchor', componentCode);
script(global.window, global.document, global.navigator, global.window.CommentAnchor);
const CommentsModule = global.window.CommentsModule;

function fakeStore(initial = []) {
  let comments = [...initial];
  return {
    get comments() { return comments; },
    api: {
      getComments: vi.fn(() => Promise.resolve(comments)),
      clearComments: vi.fn(() => { comments = []; return Promise.resolve(comments); })
    }
  };
}

function renderLine(lineNum, text) {
  const el = document.createElement('div');
  el.className = 'md-line';
  el.dataset.line = String(lineNum);
  el.textContent = text;
  document.body.appendChild(el);
  return el;
}

beforeEach(() => {
  document.body.innerHTML = '';
});

describe('CommentsModule public surface (baseline)', () => {
  it('loadForFile populates from electronAPI.getComments', async () => {
    const store = fakeStore([{ id: 'c1', lineStart: 3, lineEnd: 3, text: 'hi' }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    expect(store.api.getComments).toHaveBeenCalledWith('ws-1', 'docs/plan.md');
    expect(CommentsModule.getCommentCount()).toBe(1);
  });

  it('loadForFile with no workspace/file clears in-memory list without calling electronAPI', async () => {
    const store = fakeStore([{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'hi' }]);
    global.window.electronAPI = store.api;
    await CommentsModule.loadForFile(null);

    expect(store.api.getComments).not.toHaveBeenCalled();
    expect(CommentsModule.getCommentCount()).toBe(0);
  });

  it('clear() empties comments via electronAPI.clearComments', async () => {
    const store = fakeStore([{ id: 'c1', lineStart: 1, lineEnd: 1, text: 'x' }]);
    global.window.electronAPI = store.api;
    await CommentsModule.loadForFile('docs/plan.md');
    expect(CommentsModule.getCommentCount()).toBe(1);

    await CommentsModule.clear();

    expect(store.api.clearComments).toHaveBeenCalledWith('ws-1', 'docs/plan.md');
    expect(CommentsModule.getCommentCount()).toBe(0);
  });
});

describe('CommentsModule line-anchor matching (baseline)', () => {
  // Exercises the scoring algorithm that lives in two places today:
  // _markLinesWithComments' drift compensation (re-sync after edits)
  // and _applyRobustHighlights (marking the exact <mark> range).
  // No public API exposes the scorer directly — that's what phase 2's
  // comment-anchor.js is for.

  it('wraps the matched text in a .comment-range mark when content is unchanged', async () => {
    renderLine(1, 'The quick brown fox jumps over the lazy dog');
    const store = fakeStore([{
      id: 'c1', lineStart: 1, lineEnd: 1,
      selectedText: 'brown fox',
      context: { before: 'The quick ', after: ' jumps over' }
    }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    const mark = document.querySelector('.md-line[data-line="1"] .comment-range');
    expect(mark).not.toBeNull();
    expect(mark.textContent).toBe('brown fox');
    expect(mark.dataset.id).toBe('c1');
  });

  it('re-syncs a comment to a nearby line when selected text moved (drift compensation)', async () => {
    // Comment was anchored at line 1, but the matching content is now on
    // line 3 (e.g. two lines were inserted above it).
    renderLine(1, 'An unrelated line');
    renderLine(2, 'Another unrelated line');
    renderLine(3, 'The quick brown fox jumps over the lazy dog');

    const store = fakeStore([{
      id: 'c1', lineStart: 1, lineEnd: 1,
      selectedText: 'brown fox',
      context: { before: 'The quick ', after: ' jumps over' }
    }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    const mark = document.querySelector('.md-line[data-line="3"] .comment-range');
    expect(mark).not.toBeNull();
    expect(mark.textContent).toBe('brown fox');
  });

  it('prefers the occurrence whose surrounding context matches best', async () => {
    // "shared" appears twice on the same line; context should pick the second.
    renderLine(1, 'shared token here, then another shared token there');
    const store = fakeStore([{
      id: 'c1', lineStart: 1, lineEnd: 1,
      selectedText: 'shared',
      context: { before: 'another ', after: ' token there' }
    }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    const marks = document.querySelectorAll('.comment-range');
    expect(marks.length).toBeGreaterThan(0);
    const marked = marks[marks.length - 1];
    expect(marked.parentElement.textContent).toContain('another shared token there');
  });

  it('falls back to the first occurrence when context does not disambiguate', async () => {
    renderLine(1, 'alpha beta alpha beta');
    const store = fakeStore([{
      id: 'c1', lineStart: 1, lineEnd: 1,
      selectedText: 'alpha',
      context: { before: '', after: '' }
    }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    const mark = document.querySelector('.md-line[data-line="1"] .comment-range');
    expect(mark).not.toBeNull();
  });

  it('leaves the comment un-highlighted (but not dropped) when selectedText cannot be found anywhere', async () => {
    renderLine(1, 'completely different content');
    const store = fakeStore([{
      id: 'c1', lineStart: 1, lineEnd: 1,
      selectedText: 'nowhere to be found',
      context: { before: '', after: '' }
    }]);
    global.window.electronAPI = store.api;

    await CommentsModule.loadForFile('docs/plan.md');

    expect(CommentsModule.getCommentCount()).toBe(1);
    expect(document.querySelectorAll('.comment-range').length).toBe(0);
  });
});

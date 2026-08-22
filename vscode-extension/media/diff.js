/**
 * diff.js — webview half of MDpreview's diff mode.
 *
 * Receives {type:'diff'} from the extension host (which lines of THIS pane are
 * unique to it, plus a line map to the other pane) and:
 *   - tints every .md-block containing such a line
 *   - shows a small "N thay đổi ‹ ›" pill for jumping between them
 *   - mirrors scrolling to the opposite pane
 */

(function () {
  const vscode = window.__mdpVscode;
  const content = document.getElementById('md-content');

  let info = null;
  let changedBlocks = [];
  let cursor = -1;
  // Set while we scroll programmatically, so an echoed scroll event doesn't
  // bounce straight back to the pane that asked for it.
  let suppressScrollUntil = 0;

  const bar = document.createElement('div');
  bar.id = 'mdp-diff-bar';
  bar.hidden = true;
  document.body.appendChild(bar);

  function markBlocks() {
    content.querySelectorAll('.mdp-diff-changed').forEach((el) => {
      el.classList.remove('mdp-diff-changed', 'mdp-diff-added', 'mdp-diff-removed');
    });
    changedBlocks = [];
    cursor = -1;
    if (!info || !info.changed.length) return;

    const changed = new Set(info.changed);
    const tint = info.side === 'original' ? 'mdp-diff-removed' : 'mdp-diff-added';

    content.querySelectorAll('.md-block').forEach((block) => {
      const start = parseInt(block.dataset.lineStart, 10);
      const end = parseInt(block.dataset.lineEnd, 10);
      if (Number.isNaN(start)) return;
      const last = Number.isNaN(end) ? start : end;
      for (let line = start; line <= last; line++) {
        if (!changed.has(line)) continue;
        block.classList.add('mdp-diff-changed', tint);
        changedBlocks.push(block);
        return;
      }
    });
  }

  function renderBar() {
    if (!info || !changedBlocks.length) {
      bar.hidden = true;
      bar.textContent = '';
      return;
    }
    bar.hidden = false;
    bar.textContent = '';

    const label = document.createElement('span');
    label.className = 'mdp-diff-bar-label';
    label.textContent = info.truncated
      ? 'Khác biệt quá lớn'
      : `${changedBlocks.length} khối thay đổi`;
    bar.appendChild(label);

    if (info.truncated) return;
    [['‹', -1], ['›', 1]].forEach(([glyph, step]) => {
      const button = document.createElement('button');
      button.className = 'mdp-diff-bar-nav';
      button.textContent = glyph;
      button.onclick = () => jump(step);
      bar.appendChild(button);
    });
  }

  function jump(step) {
    if (!changedBlocks.length) return;
    cursor = (cursor + step + changedBlocks.length) % changedBlocks.length;
    changedBlocks[cursor].scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function topVisibleLine() {
    const blocks = content.querySelectorAll('.md-block');
    for (const block of blocks) {
      const rect = block.getBoundingClientRect();
      if (rect.bottom > 0) {
        const line = parseInt(block.dataset.lineStart, 10);
        return Number.isNaN(line) ? null : line;
      }
    }
    return null;
  }

  window.addEventListener('scroll', () => {
    if (!info || Date.now() < suppressScrollUntil) return;
    const line = topVisibleLine();
    if (line !== null) vscode.postMessage({ type: 'diffScroll', line });
  }, { passive: true });

  function scrollToLine(line) {
    const blocks = Array.from(content.querySelectorAll('.md-block'));
    const target = blocks.find((block) => {
      const start = parseInt(block.dataset.lineStart, 10);
      const end = parseInt(block.dataset.lineEnd, 10);
      return !Number.isNaN(start) && line >= start && line <= (Number.isNaN(end) ? start : end);
    });
    if (!target) return;
    suppressScrollUntil = Date.now() + 250;
    window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top });
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (message.type === 'diff') {
      info = message.info;
      document.body.classList.toggle('mdp-diff-mode', Boolean(info));
      markBlocks();
      renderBar();
    }
    if (message.type === 'diffScrollTo') scrollToLine(message.line);
  });

  // A re-render replaces the whole DOM, so the tints have to be re-applied.
  document.addEventListener('mdp:content-rendered', () => {
    markBlocks();
    renderBar();
  });
})();

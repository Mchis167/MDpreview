/* ============================================================
   comment-anchor.js — pure line-anchor logic for comments
   No DOM, no globals, no I/O. Used by renderer/js/modules/comments.js
   today, and by the VSCode extension's webview later.
   ============================================================ */

const CONTEXT_RADIUS = 60;

// Sinh context (before/after) quanh đoạn văn bản được chọn trong một dòng.
// offsetStart: vị trí bắt đầu của selectedText trong fullLineText.
function buildContext(fullLineText, offsetStart, selectedText) {
  const before = fullLineText.substring(Math.max(0, offsetStart - CONTEXT_RADIUS), offsetStart);
  const after = fullLineText.substring(
    offsetStart + selectedText.length,
    offsetStart + selectedText.length + CONTEXT_RADIUS
  );

  return {
    before: before.length < CONTEXT_RADIUS ? before : '...' + before,
    after: after.length < CONTEXT_RADIUS ? after : after + '...'
  };
}

// Chấm điểm một vị trí khớp bằng số ký tự khớp liên tiếp từ cuối
// context.before và từ đầu context.after, so với nội dung thực tế
// quanh matchIdx trong content. Điểm càng cao càng đúng vị trí.
function scoreContextMatch(content, matchIdx, matchLength, context) {
  if (!context) return 0;

  const cleanBefore = (context.before || '').replace(/^\.\.\./, '').trim();
  const cleanAfter = (context.after || '').replace(/\.\.\.$/, '').trim();

  const actualBefore = content.substring(Math.max(0, matchIdx - CONTEXT_RADIUS), matchIdx).trim();
  const actualAfter = content
    .substring(matchIdx + matchLength, matchIdx + matchLength + CONTEXT_RADIUS)
    .trim();

  let beforeMatchLen = 0;
  const minBeforeLen = Math.min(cleanBefore.length, actualBefore.length);
  for (let k = 1; k <= minBeforeLen; k++) {
    if (cleanBefore[cleanBefore.length - k] === actualBefore[actualBefore.length - k]) {
      beforeMatchLen++;
    } else {
      break;
    }
  }

  let afterMatchLen = 0;
  const minAfterLen = Math.min(cleanAfter.length, actualAfter.length);
  for (let k = 0; k < minAfterLen; k++) {
    if (cleanAfter[k] === actualAfter[k]) {
      afterMatchLen++;
    } else {
      break;
    }
  }

  return beforeMatchLen + afterMatchLen;
}

// Tìm lại vị trí của selectedText trong fullContent, dùng context để
// phân biệt khi selectedText xuất hiện nhiều lần. Trả -1 nếu không tìm thấy.
function findAnchor(fullContent, selectedText, context) {
  if (!selectedText) return -1;

  let globalStartIdx = -1;
  let bestScore = -1;

  let searchIdx = 0;
  while ((searchIdx = fullContent.indexOf(selectedText, searchIdx)) !== -1) {
    const score = scoreContextMatch(fullContent, searchIdx, selectedText.length, context);

    if (score > bestScore) {
      bestScore = score;
      globalStartIdx = searchIdx;
    }

    searchIdx += selectedText.length || 1;
  }

  if (globalStartIdx === -1) {
    globalStartIdx = fullContent.indexOf(selectedText);

    if (globalStartIdx === -1) {
      const normalizedContent = fullContent.replace(/\s+/g, ' ');
      const normalizedSelected = selectedText.replace(/\s+/g, ' ');
      const normIdx = normalizedContent.indexOf(normalizedSelected);
      if (normIdx !== -1) {
        globalStartIdx = normIdx;
      }
    }
  }

  return globalStartIdx;
}

const exportsObj = { buildContext, findAnchor, scoreContextMatch, CONTEXT_RADIUS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.CommentAnchor = exportsObj;
}

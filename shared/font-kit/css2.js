/* ============================================================
   font-kit/css2.js — parsing the stylesheet Google Fonts serves
   at fonts.googleapis.com/css2.

   Pure string work: no DOM, no network, no fs. The installer does
   the I/O and leans on these three functions for everything that
   is easy to get subtly wrong.
   ============================================================ */

(function () {

// Một khối @font-face, kèm subset lấy từ comment ngay phía trên nó.
const FONT_FACE_RE = /(?:\/\*\s*([^*]+?)\s*\*\/\s*)?@font-face\s*\{([^}]*)\}/g;

// url(...) với dấu nháy tuỳ chọn. Chỉ bắt phần bên trong.
const URL_RE = /url\(\s*(['"]?)([^'")]+)\1\s*\)/g;

function readDeclaration(body, prop) {
  const re = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`, 'i');
  const m = body.match(re);
  if (!m) return null;
  return m[1].trim().replace(/^['"]|['"]$/g, '');
}

/**
 * Tách từng khối @font-face trong stylesheet.
 * @returns {Array<{family, weight, style, subset, url, unicodeRange, block}>}
 */
function parseFontFaces(cssText) {
  const faces = [];
  let match;

  FONT_FACE_RE.lastIndex = 0;
  while ((match = FONT_FACE_RE.exec(cssText)) !== null) {
    const [block, comment, body] = match;

    URL_RE.lastIndex = 0;
    const urlMatch = URL_RE.exec(body);

    faces.push({
      family: readDeclaration(body, 'font-family'),
      weight: readDeclaration(body, 'font-weight'),
      style: readDeclaration(body, 'font-style'),
      unicodeRange: readDeclaration(body, 'unicode-range'),
      subset: comment ? comment.trim() : null,
      url: urlMatch ? urlMatch[2] : null,
      block
    });
  }

  return faces;
}

/**
 * Danh sách url duy nhất, giữ nguyên thứ tự xuất hiện.
 */
function collectUrls(cssText) {
  const seen = [];
  let match;

  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(cssText)) !== null) {
    if (!seen.includes(match[2])) seen.push(match[2]);
  }

  return seen;
}

/**
 * Đổi url từ xa sang url cục bộ theo map. url không có trong map được
 * giữ nguyên — thà tải hụt một subset còn hơn sinh ra url(undefined),
 * thứ làm hỏng cả stylesheet.
 */
function rewriteUrls(cssText, urlMap) {
  return cssText.replace(URL_RE, (whole, quote, url) => {
    const local = urlMap[url];
    return local ? `url(${local})` : whole;
  });
}

const exportsObj = { parseFontFaces, collectUrls, rewriteUrls };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.FontKitCss2 = exportsObj;
}

})();

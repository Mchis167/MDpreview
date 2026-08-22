/* ============================================================
   font-kit/installer.js — fetch a Google font and keep it locally.

   Every environment-specific capability is injected:
     fs          { exists, readFile, writeFile, mkdir }
     fetchText   (url) => Promise<string>   — must send a browser UA,
                 otherwise Google serves ttf instead of woff2
     fetchBinary (url) => Promise<Buffer|Uint8Array>
     cacheDir    absolute path to write into
     join        path join
     toUrl       (absPath) => string usable as a css url() in the host
                 (webview URI in VSCode, file:// elsewhere)

   That injection is the whole portability story: nothing here knows
   about VSCode, Electron, or the DOM.
   ============================================================ */

(function () {

const css2 =
  (typeof module !== 'undefined' && module.exports)
    ? require('./css2.js')
    : window.FontKitCss2;

const CSS2_BASE = 'https://fonts.googleapis.com/css2';

function buildCss2Url(family, weights) {
  const name = family.trim().replace(/\s+/g, '+');
  const axis = weights && weights.length ? `:wght@${weights.join(';')}` : '';
  return `${CSS2_BASE}?family=${name}${axis}&display=swap`;
}

// Tên thư mục an toàn: chỉ chữ thường, số và gạch ngang. Mọi ký tự khác,
// kể cả "." và "/", bị gộp thành gạch ngang, nên không thể trèo ra khỏi cacheDir.
function familySlug(family) {
  return family
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Tên file cục bộ cho một url woff2. Basename của gstatic đã là duy nhất
// trong phạm vi một font, thêm chỉ số để chắc chắn không đụng nhau.
function localFileName(url, index) {
  const base = url.split('/').pop().split('?')[0];
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${index}-${safe}`;
}

function createInstaller(deps) {
  const { fs, fetchText, fetchBinary, cacheDir, join, toUrl } = deps;

  function dirFor(family) {
    return join(cacheDir, familySlug(family));
  }

  function cssPathFor(family) {
    return join(dirFor(family), 'font.css');
  }

  function metaPathFor(family) {
    return join(dirFor(family), 'meta.json');
  }

  // Stylesheet trong cache chứa đường dẫn file tuyệt đối, không phải url
  // của host: url webview mang authority riêng cho từng phiên, cache lại
  // là lần mở sau trỏ vào một origin đã chết. toUrl chỉ chạy lúc đọc.
  function materialize(css) {
    const map = {};
    css2.collectUrls(css).forEach((p) => {
      map[p] = toUrl(p);
    });
    return css2.rewriteUrls(css, map);
  }

  async function readCached(family, weights) {
    const cssPath = cssPathFor(family);
    if (!(await fs.exists(cssPath))) return null;

    // Cùng font nhưng khác bộ weight thì stylesheet cũ thiếu nét — tải lại.
    try {
      const meta = JSON.parse(String(await fs.readFile(metaPathFor(family))));
      if (meta.weights.join(';') !== weights.join(';')) return null;
    } catch {
      return null;
    }

    return String(await fs.readFile(cssPath));
  }

  /**
   * Tải font về (nếu chưa có) và trả về CSS @font-face đã trỏ vào file cục bộ.
   * @returns {Promise<{family, weights, css, cached}>}
   */
  async function install(family, weights = []) {
    const wanted = weights.map(String);

    const cached = await readCached(family, wanted);
    if (cached) return { family, weights: wanted, css: materialize(cached), cached: true };

    const remoteCss = await fetchText(buildCss2Url(family, wanted));
    const urls = css2.collectUrls(remoteCss);

    const dir = dirFor(family);
    await fs.mkdir(dir);

    // Tải hết rồi mới ghi stylesheet: một stylesheet nằm trong cache đồng
    // nghĩa "font này đã sẵn sàng", nên nó không được xuất hiện khi mới
    // tải dở. Tải hụt → ném lỗi, cache sạch, lần sau thử lại từ đầu.
    const urlMap = {};
    for (let i = 0; i < urls.length; i += 1) {
      const url = urls[i];
      const dest = join(dir, localFileName(url, i));
      await fs.writeFile(dest, await fetchBinary(url));
      urlMap[url] = dest;
    }

    const localCss = css2.rewriteUrls(remoteCss, urlMap);
    await fs.writeFile(cssPathFor(family), localCss);
    await fs.writeFile(metaPathFor(family), JSON.stringify({ family, weights: wanted }));

    return { family, weights: wanted, css: materialize(localCss), cached: false };
  }

  async function isInstalled(family) {
    return fs.exists(cssPathFor(family));
  }

  /**
   * CSS của một font đã tải, hoặc null. Dùng lúc khởi động webview để
   * dựng lại font đang chọn mà không chạm mạng.
   */
  async function readInstalled(family) {
    const cssPath = cssPathFor(family);
    if (!(await fs.exists(cssPath))) return null;
    return materialize(String(await fs.readFile(cssPath)));
  }

  return { install, isInstalled, readInstalled, dirFor };
}

const exportsObj = { createInstaller, buildCss2Url, familySlug };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.FontKitInstaller = exportsObj;
}

})();

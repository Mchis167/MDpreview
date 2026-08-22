/* ============================================================
   fontHost.js — the VSCode side of shared/font-kit.

   Supplies font-kit with the four things it refuses to assume:
   a filesystem, a network, a cache directory, and a way to turn a
   local path into a url the host can load. Also owns the persisted
   choice of font per role.

   Downloaded fonts live in the extension's globalStorage, so they
   are shared by every workspace and survive a reinstall of the repo.
   ============================================================ */

const vscode = require('vscode');
const fsp = require('fs/promises');
const path = require('path');

const { createCatalog } = require('./vendor/shared/font-kit/catalog');
const { createInstaller } = require('./vendor/shared/font-kit/installer');

// Google trả về woff2 cho trình duyệt và ttf cho client lạ. Không có
// UA này thì font tải về nặng gấp nhiều lần và mất subset.
const BROWSER_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const STATE_KEY = 'mdpreview.fonts';
const ZOOM_KEY = 'mdpreview.zoom';
const WEIGHT_STATE_KEY = 'mdpreview.fontWeights';
const ROLES = ['title', 'body', 'code'];
const DEFAULT_ZOOM = 100;

// Khớp với bộ weight app Electron nạp sẵn từ Google Fonts.
const WEIGHTS = {
  title: ['400', '600', '700'],
  body: ['400', '600', '700'],
  code: ['400', '500', '700']
};

// Biến CSS mỗi trục điều khiển. Xem renderer/css/design-system/tokens.css.
const CSS_VAR = {
  title: '--font-title',
  body: '--font-text',
  code: '--font-code'
};

// Biến zoom mỗi trục điều khiển. --preview-zoom và --code-zoom là API sẵn
// có của app (markdown-content.css / markdown-blocks.css, đều đã vendor);
// --title-zoom là trục mới, mặc định rơi về --preview-zoom.
const ZOOM_VAR = {
  title: '--title-zoom',
  body: '--preview-zoom',
  code: '--code-zoom'
};

// Biến weight mỗi trục điều khiển. md-render.css đọc chúng với fallback
// về weight gốc (700/600 cho tiêu đề, 400 cho thân bài và code), nên biến
// không được set thì giao diện không đổi gì so với trước khi có tính năng.
const WEIGHT_VAR = {
  title: '--font-title-weight',
  body: '--font-text-weight',
  code: '--font-code-weight'
};

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchBinary(url) {
  const res = await fetch(url, { headers: { 'User-Agent': BROWSER_UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

const nodeFs = {
  async exists(p) {
    try {
      await fsp.access(p);
      return true;
    } catch {
      return false;
    }
  },
  readFile: (p) => fsp.readFile(p),
  writeFile: (p, data) => fsp.writeFile(p, data),
  mkdir: (p) => fsp.mkdir(p, { recursive: true })
};

/**
 * Một FontHost cho cả extension. Catalog dùng chung; installer phải
 * tạo riêng cho từng webview vì toUrl phụ thuộc webview đó.
 */
function createFontHost(context) {
  const cacheDir = path.join(context.globalStorageUri.fsPath, 'fonts');
  const catalog = createCatalog({ fetchJson });

  function getState() {
    const saved = context.globalState.get(STATE_KEY) || {};
    return { title: saved.title || null, body: saved.body || null, code: saved.code || null };
  }

  async function setState(role, family) {
    await context.globalState.update(STATE_KEY, { ...getState(), [role]: family });
  }

  function getZoom() {
    const saved = context.globalState.get(ZOOM_KEY) || {};
    const zoom = {};
    // Một giá trị hỏng trong storage không được phép làm chữ biến mất.
    ROLES.forEach((role) => {
      const value = Number(saved[role]);
      zoom[role] = Number.isFinite(value) && value > 0 ? value : DEFAULT_ZOOM;
    });
    return zoom;
  }

  async function setZoom(zoom) {
    await context.globalState.update(ZOOM_KEY, { ...getZoom(), ...(zoom || {}) });
  }

  /**
   * `available` is the weight set actually installed for the role's current
   * font — the intersection catalog.weightsFor() found at apply() time, not
   * the WEIGHTS wishlist below. `selected` is null when the role is using
   * its default hierarchy (h1/h2 bolder than h3-h6) rather than one flat
   * weight across the whole role.
   */
  function getWeightState() {
    const saved = context.globalState.get(WEIGHT_STATE_KEY) || {};
    const out = {};
    ROLES.forEach((role) => {
      const s = saved[role] || {};
      out[role] = { available: Array.isArray(s.available) ? s.available : [], selected: s.selected || null };
    });
    return out;
  }

  async function setWeightState(role, patch) {
    const all = getWeightState();
    all[role] = { ...all[role], ...patch };
    await context.globalState.update(WEIGHT_STATE_KEY, all);
  }

  function installerWith(toUrl) {
    return createInstaller({ fs: nodeFs, fetchText, fetchBinary, cacheDir, join: path.join, toUrl });
  }

  function installerFor(webview) {
    return installerWith((p) => webview.asWebviewUri(vscode.Uri.file(p)).toString());
  }

  // Chỉ để hỏi cache (isInstalled/readInstalled) — không sinh url nào.
  const cacheProbe = installerWith((p) => p);

  /**
   * Thư mục cần có trong localResourceRoots, nếu không webview sẽ
   * chặn mọi file .woff2 dù url có đúng.
   */
  function resourceRoot() {
    return vscode.Uri.file(cacheDir);
  }

  /**
   * CSS + tên font của các trục đang chọn, dựng lại từ cache.
   * Chạy lúc webview mở, không chạm mạng.
   */
  async function restore(webview) {
    const installer = installerFor(webview);
    const state = getState();
    const faces = {};

    for (const role of ROLES) {
      faces[role] = '';
      if (!state[role]) continue;
      const css = await installer.readInstalled(state[role]);
      // Font biến mất khỏi cache (người dùng xoá globalStorage) thì
      // quên lựa chọn đó đi thay vì set một font không tồn tại — kéo
      // theo weight đã chọn cho trục đó, vì nó cũng hết chỗ dựa.
      if (css) {
        faces[role] = css;
      } else {
        state[role] = null;
        await setWeightState(role, { available: [], selected: null });
      }
    }

    return {
      fonts: state,
      faces,
      vars: CSS_VAR,
      zoom: getZoom(),
      zoomVars: ZOOM_VAR,
      weights: getWeightState(),
      weightVars: WEIGHT_VAR
    };
  }

  async function search(query, role, limit) {
    await catalog.load();
    const results = catalog.search(query, { role, limit });

    return Promise.all(
      results.map(async (f) => ({
        family: f.family,
        category: f.category,
        installed: await cacheProbe.isInstalled(f.family)
      }))
    );
  }

  /**
   * Tải font (nếu cần) và ghi nhớ lựa chọn.
   * family = null nghĩa là trả trục đó về mặc định hệ thống.
   *
   * Either way, đây là một font mới cho trục này — weight đã chọn trước đó
   * (nếu có) hết còn ý nghĩa, nên bị xoá theo.
   */
  async function apply(role, family, webview) {
    if (!CSS_VAR[role]) throw new Error(`Unknown font role: ${role}`);

    if (!family) {
      await setState(role, null);
      await setWeightState(role, { available: [], selected: null });
      return { role, family: null, css: '', varName: CSS_VAR[role] };
    }

    await catalog.load();
    const weights = catalog.weightsFor(family, WEIGHTS[role]);
    const result = await installerFor(webview).install(family, weights);
    await setState(role, family);
    await setWeightState(role, { available: result.weights, selected: null });

    return { role, family, css: result.css, varName: CSS_VAR[role], weights: result.weights };
  }

  /**
   * Đổi weight hiển thị cho một trục — không tải gì cả, @font-face của mọi
   * weight trong `available` đã có sẵn từ lúc install(). weight = null (hoặc
   * rỗng) trả trục đó về phân cấp gốc thay vì một weight đồng nhất.
   */
  async function setWeight(role, weight) {
    if (!WEIGHT_VAR[role]) throw new Error(`Unknown font role: ${role}`);

    const value = weight || null;
    if (value) {
      const { available } = getWeightState()[role];
      if (!available.includes(String(value))) {
        throw new Error(`Weight ${value} is not installed for ${role}.`);
      }
    }
    await setWeightState(role, { selected: value });
  }

  return {
    getState,
    getZoom,
    setZoom,
    getWeightState,
    setWeight,
    restore,
    search,
    apply,
    resourceRoot,
    cacheDir
  };
}

module.exports = { createFontHost, CSS_VAR, ZOOM_VAR, WEIGHT_VAR, WEIGHTS, ROLES };

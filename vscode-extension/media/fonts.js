/* global FontKitPicker, FontKitUiMDpreview, DesignSystem, SettingRow */
/* ============================================================
   fonts.js — wires shared/font-kit into the webview.

   Everything font-related that is specific to running inside a
   VSCode webview lives here: the postMessage request/response
   plumbing, the trigger button, and injecting the returned
   @font-face rules. The panel itself is font-kit's.
   ============================================================ */

(function () {
  const vscode = window.__mdpVscode;

  const state = { title: null, body: null, code: null, zoom: { title: 100, body: 100, code: 100 } };
  let cssVars = { title: '--font-title', body: '--font-text', code: '--font-code' };
  let zoomVars = { title: '--title-zoom', body: '--preview-zoom', code: '--code-zoom' };
  let popover = null;

  // ── Request/response qua postMessage ─────────────────────
  const pending = new Map();
  let seq = 0;

  function request(type, payload) {
    const id = (seq += 1);
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject });
      vscode.postMessage({ type, seq: id, ...payload });
    });
  }

  function settle(message) {
    const entry = pending.get(message.seq);
    if (!entry) return;
    pending.delete(message.seq);
    if (message.error) entry.reject(new Error(message.error));
    else entry.resolve(message);
  }

  // ── Áp font vào tài liệu ──────────────────────────────────
  const styleEl = document.createElement('style');
  styleEl.id = 'fk-faces';
  document.head.appendChild(styleEl);

  // Mỗi trục giữ khối @font-face riêng, để đổi font tiêu đề không xoá
  // mất font thân bài đang dùng.
  const faces = { title: '', body: '', code: '' };

  function setFace(role, css) {
    faces[role] = css || '';
    styleEl.textContent = [faces.title, faces.body, faces.code].filter(Boolean).join('\n');
  }

  function setVar(role, family) {
    const name = cssVars[role];
    if (!name) return;
    if (family) document.documentElement.style.setProperty(name, `'${family}'`);
    else document.documentElement.style.removeProperty(name);
  }

  function setZoomVar(role, value) {
    const name = zoomVars[role];
    if (name) document.documentElement.style.setProperty(name, String(value));
  }

  // ── Cầu nối cho picker ────────────────────────────────────
  // Zoom khác font ở một điểm: nó chỉ là một biến CSS, không phải thứ
  // phải tải về. Nên áp ngay tại webview để kéo slider thấy đổi tức thì,
  // còn extension host chỉ cần biết để ghi nhớ — và biết muộn cũng được.
  let zoomSaveTimer = null;

  const bridge = {
    async search(query, role, limit) {
      const res = await request('fontSearch', { query, role, limit });
      return res.results;
    },
    async apply(role, family) {
      const res = await request('fontApply', { role, family });
      setFace(role, res.css);
      setVar(role, res.family);
      state[role] = res.family;
      return res;
    },
    setZoom(role, value) {
      setZoomVar(role, value);
      state.zoom[role] = value;

      // Kéo slider bắn ra hàng trăm sự kiện; ghi globalState từng cái một
      // là ghi đĩa vô ích. Chỉ lưu khi tay đã dừng.
      clearTimeout(zoomSaveTimer);
      zoomSaveTimer = setTimeout(() => {
        vscode.postMessage({ type: 'zoomSet', zoom: state.zoom });
      }, 200);
    }
  };

  // ── Mở panel ──────────────────────────────────────────────
  // Nút bấm nằm ở floating action bar; ở đây chỉ còn việc mở/đóng panel.
  const openListeners = new Set();
  const notifyOpen = () => openListeners.forEach((fn) => fn(!!popover));

  function closePicker() {
    if (!popover) return;
    popover.close();
    popover = null;
    notifyOpen();
  }

  function togglePicker() {
    if (popover) return closePicker();

    // FontKitPicker.openPicker() neo panel vào nút mở nó (alignment 'custom'),
    // vốn hợp với app. Ở đây panel mở giữa vùng xem, nên gọi thẳng
    // createPicker + createPopover với alignment 'center' thay vì openPicker.
    const ui = FontKitUiMDpreview.createUi(DesignSystem, SettingRow);
    const picker = FontKitPicker.createPicker({ ui, bridge, state });

    popover = ui.createPopover({
      title: 'Fonts',
      subtitle: 'Search, download and apply any Google Font',
      content: picker.render(),
      className: 'fk-popover',
      alignment: 'center',
      // Căn giữa trong khung xem chứ không phải cả cửa sổ, để chừa chỗ cho
      // floating bar bên dưới (CSS lo phần chừa đó).
      container: document.getElementById('md-viewer-mount'),
      onClose: () => {
        popover = null;
        notifyOpen();
      }
    });
    notifyOpen();
  }

  window.MdpFonts = {
    isOpen: () => !!popover,
    toggle: togglePicker,
    close: closePicker,
    onChange: (fn) => openListeners.add(fn)
  };

  // Mũi tên của .ds-select là một SVG data-uri ăn theo màu accent —
  // app dựng nó trong SettingsService; webview không có service đó.
  function setSelectArrow() {
    const color = getComputedStyle(document.documentElement)
      .getPropertyValue('--ds-accent')
      .trim() || '#ffbf48';
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" ` +
      `fill="none" stroke="${color}" stroke-width="3" stroke-linecap="round" ` +
      `stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;
    document.documentElement.style.setProperty(
      '--select-arrow',
      `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
    );
  }

  window.addEventListener('message', (event) => {
    const message = event.data;
    if (!message || typeof message.type !== 'string') return;

    if (message.type === 'fontRestore') {
      cssVars = message.vars || cssVars;
      zoomVars = message.zoomVars || zoomVars;
      Object.keys(cssVars).forEach((role) => {
        state[role] = message.fonts[role] || null;
        setFace(role, (message.faces || {})[role]);
        setVar(role, state[role]);

        const zoom = (message.zoom || {})[role] || 100;
        state.zoom[role] = zoom;
        setZoomVar(role, zoom);
      });
      return;
    }

    if (message.type === 'fontResult') settle(message);
  });

  setSelectArrow();
})();

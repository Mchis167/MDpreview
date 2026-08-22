/* global FontKitPicker, MdpUi, ThemeKit, ThemeKitAppearance, DesignSystem, SettingRow, SwitchToggleModule, ModalComponent */
/* ============================================================
   settings.js — the Settings panel, and the font plumbing it
   sits on top of.

   Everything font-related that is specific to running inside a
   VSCode webview lives here: the postMessage request/response
   plumbing and injecting the returned @font-face rules. The
   Typography rows and the Google Fonts catalogue are font-kit's;
   this file composes them — rows in the panel, catalogue in a
   modal opened from the font row — and adds the Data section.
   ============================================================ */

(function () {
  const vscode = window.__mdpVscode;

  const state = { title: null, body: null, code: null, zoom: { title: 100, body: 100, code: 100 } };
  let cssVars = { title: '--font-title', body: '--font-text', code: '--font-code' };
  let zoomVars = { title: '--title-zoom', body: '--preview-zoom', code: '--code-zoom' };

  let popover = null;
  let typography = null;
  let catalogModal = null;

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

  // ── Cầu nối cho font-kit ──────────────────────────────────
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

  const ui = () => MdpUi.createUi(DesignSystem, SettingRow, SwitchToggleModule);

  // ── Theme: accent + background ────────────────────────────
  // theme-kit works on a plain state object and calls this bridge for
  // anything that has to outlive the page. Applying the result is ours:
  // the host stores, the webview paints.

  // theme-kit owns `backgrounds` — it is the state object it renders from,
  // and it appends and filters that array itself. The bridge must not touch
  // it: doing both is what made every added image appear twice.
  const theme = {
    accent: null,
    bgEnabled: false,
    bgImage: null,      // webview url of the image in use
    bgImageName: null,  // the name the host knows it by
    backgrounds: []     // webview urls
  };

  // The host stores files by name, the page renders them by url. Keeping the
  // mapping here rather than in a second array avoids the two staying in
  // step by index, which they only ever did by accident.
  const nameByUrl = new Map();

  const backgroundLayer = () => document.getElementById('app-background');

  const nameForUrl = (url) => nameByUrl.get(url) || null;

  function paintBackground() {
    ThemeKit.applyBackground(backgroundLayer(), theme.bgEnabled, theme.bgImage);
  }

  const themeBridge = {
    setAccent(hex) {
      theme.accent = ThemeKit.applyAccent(document.documentElement, hex);
      request('accentSet', { accent: theme.accent });
    },

    setBackgroundEnabled(on) {
      theme.bgEnabled = !!on;
      paintBackground();
      request('backgroundEnabled', { enabled: theme.bgEnabled });
    },

    setBackgroundImage(url) {
      theme.bgImage = url;
      theme.bgImageName = url ? nameForUrl(url) : null;
      paintBackground();
      request('backgroundSelect', { name: theme.bgImageName });
    },

    // The host writes the file and answers with a url the webview may load;
    // a data URL would work in the page but would not survive a reload.
    async addBackground(file) {
      const dataUrl = await readAsDataUrl(file);
      if (!dataUrl) return null;

      const res = await request('backgroundAdd', { dataUrl }).catch(() => null);
      if (!res || res.error || !res.url) return null;

      nameByUrl.set(res.url, res.name);
      return res.url;
    },

    async removeBackground(url) {
      const name = nameForUrl(url);
      if (!name) return;

      nameByUrl.delete(url);
      await request('backgroundRemove', { name }).catch(() => {});
    }
  };

  function readAsDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  // ── Modal danh sách font ──────────────────────────────────
  // Mở đè lên panel Settings, có backdrop: lúc này việc duy nhất đang làm
  // là chọn font, nên phần còn lại lùi ra sau.

  function openCatalog() {
    if (catalogModal) return;

    const adapter = ui();
    const list = FontKitPicker.createFontList({
      ui: adapter,
      bridge,
      state,
      getRole: () => typography && typography.role,
      // Panel bên dưới vẫn đang hiện tên font cũ cho tới khi được bảo.
      onApplied: () => typography && typography.refresh()
    });

    // Đổi vai khi modal đang mở thì danh sách phải hỏi lại theo vai mới.
    const stopWatching = typography ? typography.onRoleChange(() => list.refresh()) : null;

    catalogModal = ModalComponent.create({
      title: 'Fonts',
      content: list.render(),
      className: 'fk-popover',
      width: '460px',
      container: document.getElementById('md-viewer-mount'),
      onClose: () => {
        if (typeof stopWatching === 'function') stopWatching();
        catalogModal = null;
      }
    });
    setTimeout(() => list.focus(), 50);
  }

  // ── Section Data ──────────────────────────────────────────

  // What the store holds right now, so the row can say what Delete all would
  // actually destroy instead of asking the user to take it on faith.
  let stats = null;
  let statsEl = null;
  let deleteBtn = null;

  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function buildDataGroup(adapter) {
    statsEl = adapter.createElement('span', 'mdp-data-count', { text: 'Counting…' });

    deleteBtn = adapter.createElement('button', 'ds-btn ds-btn-danger', { text: 'Delete all' });
    deleteBtn.disabled = true;
    deleteBtn.addEventListener('click', confirmDeleteAll);

    const controls = adapter.createElement('div', 'mdp-data-controls');
    controls.appendChild(statsEl);
    controls.appendChild(deleteBtn);

    refreshStats();

    return adapter.createGroup('Data', [
      adapter.createSettingRow({ label: 'Comments', control: controls })
    ]);
  }

  async function refreshStats() {
    try {
      stats = await request('commentStats', {});
    } catch {
      stats = null;
    }
    if (!statsEl || !deleteBtn) return;

    if (!stats) {
      statsEl.textContent = 'Unavailable';
      deleteBtn.disabled = true;
      return;
    }
    statsEl.textContent = stats.comments
      ? `${plural(stats.comments, 'comment')} · ${plural(stats.files, 'file')}`
      : 'None saved';
    deleteBtn.disabled = !stats.comments;
  }

  function confirmDeleteAll() {
    if (!stats || !stats.comments) return;

    const parts = [`<strong>${plural(stats.comments, 'comment')}</strong>`];
    if (stats.files) parts.push(`across <strong>${plural(stats.files, 'file')}</strong>`);
    if (stats.images) parts.push(`and <strong>${plural(stats.images, 'pasted image')}</strong>`);

    ModalComponent.confirm({
      title: 'Delete all comments',
      message:
        `This deletes ${parts.join(' ')} from the whole workspace, ` +
        'including the archive. It cannot be undone.',
      // Awaited rather than fired and forgotten, so the count that comes
      // back is the one after the delete, not a race with it.
      onConfirm: async () => {
        try {
          await request('deleteAllComments', {});
        } finally {
          await refreshStats();
        }
      }
    });
  }

  // ── Panel ─────────────────────────────────────────────────
  const openListeners = new Set();
  const notifyOpen = () => openListeners.forEach((fn) => fn(!!popover));

  function closePanel() {
    if (!popover) return;
    popover.close();
    popover = null;
    notifyOpen();
  }

  function togglePanel() {
    if (popover) return closePanel();

    const adapter = ui();
    typography = FontKitPicker.createTypography({
      ui: adapter,
      bridge,
      state,
      onBrowse: openCatalog
    });

    // theme-kit reads `state` as it renders, so hand it the live object
    // rather than a copy — it stays in step with what themeRestore filled in.
    const panel = adapter.createElement('div', 'fk-panel');
    panel.appendChild(
      ThemeKitAppearance.createAccentGroup({ ui: adapter, bridge: themeBridge, state: theme }).render()
    );
    panel.appendChild(typography.render());
    panel.appendChild(
      ThemeKitAppearance.createBackgroundGroup({
        ui: adapter,
        bridge: themeBridge,
        state: theme,
        // No presets: a webview's CSP will not load an image from a remote
        // host, and shipping stock photos in the .vsix is not worth the size.
        presets: []
      }).render()
    );
    panel.appendChild(buildDataGroup(adapter));

    popover = adapter.createPopover({
      title: 'Settings',
      content: panel,
      className: 'fk-popover',
      alignment: 'center',
      // Căn giữa trong khung xem chứ không phải cả cửa sổ, để chừa chỗ cho
      // floating bar bên dưới (CSS lo phần chừa đó).
      container: document.getElementById('md-viewer-mount'),
      onClose: () => {
        popover = null;
        typography = null;
        statsEl = null;
        deleteBtn = null;
        notifyOpen();
      }
    });
    notifyOpen();
  }

  window.MdpSettings = {
    isOpen: () => !!popover,
    toggle: togglePanel,
    close: closePanel,
    onChange: (fn) => openListeners.add(fn)
  };

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
      if (typography) typography.refresh();
      return;
    }

    if (message.type === 'themeRestore') {
      const bg = message.background || {};
      theme.bgEnabled = !!bg.enabled;
      theme.backgrounds = bg.images || [];
      nameByUrl.clear();
      (bg.images || []).forEach((url, i) => nameByUrl.set(url, (bg.names || [])[i]));
      theme.bgImage = bg.image || null;
      theme.bgImageName = bg.imageName || null;

      // applyAccent also regenerates --select-arrow, which is why the webview
      // no longer needs a copy of that logic.
      theme.accent = ThemeKit.applyAccent(document.documentElement, message.accent);
      paintBackground();
      return;
    }

    if (
      message.type === 'fontResult' ||
      message.type === 'themeResult' ||
      message.type === 'commentStatsResult' ||
      message.type === 'deleteAllCommentsResult'
    ) {
      settle(message);
    }
  });

  // Nothing is stored yet on first open; paint the default so the select
  // chevron and accent are right before themeRestore lands.
  ThemeKit.applyAccent(document.documentElement, null);
})();

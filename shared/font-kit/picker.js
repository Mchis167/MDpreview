/* ============================================================
   font-kit/picker.js — the font controls.

   Two pieces that a host composes as it likes:

     createTypography  the settings rows — which role you are
                       styling, the font it currently uses, and
                       its zoom. Small enough to live inside a
                       larger Settings panel.
     createFontList    the Google Fonts catalogue — search,
                       download, apply. Big enough to want a
                       surface of its own, so the host decides
                       where it goes (MDpreview puts it in a
                       modal opened from the font row).

   Both build DOM through an injected `ui` adapter rather than
   touching a design system directly, so they can be dropped into
   any host that supplies the same handful of primitives.
   shared/font-kit/ui-mdpreview.js is the adapter for this app.

   `bridge` is the async side (search / install / apply / reset).
   ============================================================ */

(function () {

const ROLES = [
  { id: 'title', label: 'Titles', icon: 'heading', hint: 'Headings h1–h6' },
  { id: 'body', label: 'Body', icon: 'file-text', hint: 'Paragraphs and lists' },
  { id: 'code', label: 'Code', icon: 'code', hint: 'Code blocks and inline code' }
];

const SEARCH_DEBOUNCE_MS = 120;
const RESULT_LIMIT = 60;

// Cùng thang với slider zoom của app Electron, để hai bên cho ra cùng
// một cỡ chữ khi đặt cùng một con số.
const ZOOM = { min: 50, max: 200, step: 5, default: 100 };

/**
 * The Typography group: role switch, current font, zoom.
 *
 * options.onBrowse is called with the current role when the font row's
 * chevron is pressed — that is where the host opens the catalogue.
 */
function createTypography(options) {
  const { ui, bridge, state, onBrowse } = options;
  let role = options.initialRole || 'title';
  const roleListeners = new Set();

  const el = {};

  function setRole(id) {
    role = id;
    if (el.segmented) el.segmented.updateActive(id);
    renderCurrent();
    roleListeners.forEach((fn) => fn(role));
  }

  // ── Dòng "Current font" ────────────────────────────────────
  // Tên font và mũi tên là một control liền nhau — bấm đâu cũng mở
  // danh sách; nút reset đứng riêng sau một vạch ngăn, vì nó phá đi
  // lựa chọn chứ không dẫn tới đâu cả.
  function buildFontControl() {
    el.currentValue = ui.createElement('span', 'fk-current-value');

    el.browseBtn = ui.createElement('button', 'fk-font-trigger', {
      'aria-label': 'Choose a font'
    });
    el.browseBtn.appendChild(el.currentValue);
    el.browseBtn.appendChild(
      ui.createElement('span', 'fk-font-caret', { html: ui.getIcon('chevron-down') })
    );
    el.browseBtn.addEventListener('click', () => {
      if (onBrowse) onBrowse(role);
    });

    el.resetBtn = ui.createElement('button', 'fk-reset', {
      html: ui.getIcon('refresh-cw'),
      'data-ds-tooltip': 'Back to the system font',
      'aria-label': 'Reset font'
    });
    // Đang dùng font hệ thống thì nút vẫn ở đó, chỉ mờ và bấm không được —
    // ẩn hẳn sẽ làm dòng này rỗng một nửa và trông như bị bỏ quên.
    el.resetBtn.addEventListener('click', () => {
      if (el.resetBtn.disabled) return;
      bridge.apply(role, null);
      state[role] = null;
      renderCurrent();
    });

    const controls = ui.createElement('div', 'fk-current-controls');
    controls.appendChild(el.browseBtn);
    controls.appendChild(ui.createElement('span', 'fk-current-divider'));
    controls.appendChild(el.resetBtn);
    return controls;
  }

  // Cùng cấu trúc DOM với SettingsComponent._createZoomControl bên app:
  // .setting-control-col > input.zoom-slider + span.zoom-val-label.
  function buildZoomControl() {
    const ctrl = ui.createElement('div', 'setting-control-col');

    el.zoomSlider = ui.createElement('input', 'zoom-slider', {
      type: 'range',
      min: String(ZOOM.min),
      max: String(ZOOM.max),
      step: String(ZOOM.step)
    });
    el.zoomLabel = ui.createElement('span', 'zoom-val-label');

    el.zoomSlider.addEventListener('input', (e) => {
      const value = parseInt(e.target.value, 10);
      el.zoomLabel.textContent = `${value}%`;
      zoomState()[role] = value;
      bridge.setZoom(role, value);
    });

    ctrl.appendChild(el.zoomSlider);
    ctrl.appendChild(el.zoomLabel);
    return ctrl;
  }

  function zoomState() {
    if (!state.zoom) state.zoom = {};
    return state.zoom;
  }

  function renderCurrent() {
    const family = state[role];
    el.currentValue.textContent = family || 'System default';
    el.currentValue.style.fontFamily = family ? `'${family}'` : '';
    el.currentValue.classList.toggle('fk-current-default', !family);
    el.resetBtn.disabled = !family;

    const zoom = zoomState()[role] || ZOOM.default;
    el.zoomSlider.value = String(zoom);
    el.zoomLabel.textContent = `${zoom}%`;
  }

  function render() {
    el.segmented = ui.createSegmented({
      items: ROLES.map((r) => ({ id: r.id, icon: r.icon, title: r.hint })),
      activeId: role,
      onChange: setRole
    });

    const group = ui.createGroup('Typography', [
      ui.createSettingRow({ label: 'Applies to', control: el.segmented.el }),
      ui.createDivider(),
      ui.createSettingRow({ label: 'Current font', control: buildFontControl() }),
      ui.createDivider(),
      ui.createSettingRow({ label: 'Zoom', control: buildZoomControl() })
    ]);

    renderCurrent();
    return group;
  }

  return {
    render,
    refresh: renderCurrent,
    setRole,
    /** @returns {Function} unsubscribe */
    onRoleChange: (fn) => {
      roleListeners.add(fn);
      return () => roleListeners.delete(fn);
    },
    get role() {
      return role;
    }
  };
}

/**
 * The Google Fonts catalogue: search box, status line, result list.
 *
 * options.getRole tells it which role a pick applies to — the host owns the
 * role, so the list stays correct however the host lets the user change it.
 * options.onApplied fires after a successful install so the host can refresh
 * whatever else shows the current font.
 */
function createFontList(options) {
  const { ui, bridge, state, getRole, onApplied } = options;
  const role = () => (getRole ? getRole() : 'title');

  let searchTimer = null;
  let requestSeq = 0;
  const el = {};

  function setStatus(text, tone) {
    el.status.textContent = text || '';
    el.status.className = tone ? `fk-status fk-status-${tone}` : 'fk-status';
    el.status.style.display = text ? 'block' : 'none';
  }

  async function runSearch(query) {
    const seq = (requestSeq += 1);
    try {
      const results = await bridge.search(query, role(), RESULT_LIMIT);
      // Kết quả của lần gõ trước về muộn thì bỏ, đừng ghi đè lần mới nhất.
      if (seq !== requestSeq) return;
      el.lastResults = results;
      setStatus('');
      renderList(results);
    } catch (err) {
      if (seq !== requestSeq) return;
      setStatus(`Could not reach Google Fonts — ${err.message}`, 'error');
      renderList([]);
    }
  }

  function renderList(results) {
    el.list.innerHTML = '';

    if (!results.length) {
      el.list.appendChild(ui.createElement('div', 'fk-empty', { text: 'No matching font.' }));
      return;
    }

    results.forEach((font) => el.list.appendChild(buildItem(font)));
  }

  function buildItem(font) {
    const item = ui.createElement('div', 'fk-item');
    if (font.family === state[role()]) item.classList.add('active');

    const name = ui.createElement('span', 'fk-item-name', { text: font.family });
    // Chỉ font đã tải mới hiện đúng mặt chữ — font chưa tải không có
    // file nào để render, nên để mặc định kèm dấu ⬇ ở cột phải.
    if (font.installed) name.style.fontFamily = `'${font.family}'`;

    const meta = ui.createElement('span', 'fk-item-meta', { text: font.category || '' });

    const mark = ui.createElement('span', 'fk-item-mark', {
      html: font.installed ? ui.getIcon('check') : ui.getIcon('arrow-down')
    });
    if (!font.installed) mark.classList.add('fk-item-mark-download');

    item.appendChild(name);
    item.appendChild(meta);
    item.appendChild(mark);

    item.addEventListener('click', () => pick(font, item, mark, name));
    return item;
  }

  async function pick(font, item, mark, name) {
    if (item.classList.contains('is-loading')) return;

    item.classList.add('is-loading');
    mark.innerHTML = ui.getIcon('loader');
    setStatus('');

    const target = role();
    try {
      await bridge.apply(target, font.family);
      font.installed = true;
      state[target] = font.family;

      name.style.fontFamily = `'${font.family}'`;
      el.list.querySelectorAll('.fk-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      mark.innerHTML = ui.getIcon('check');
      mark.classList.remove('fk-item-mark-download');
      if (onApplied) onApplied(target, font.family);
    } catch (err) {
      mark.innerHTML = ui.getIcon(font.installed ? 'check' : 'arrow-down');
      setStatus(`Could not install ${font.family} — ${err.message}`, 'error');
    } finally {
      item.classList.remove('is-loading');
    }
  }

  function render() {
    el.search = ui.createElement('input', 'fk-search-input', {
      type: 'text',
      placeholder: 'Search Google Fonts…',
      spellcheck: 'false'
    });
    el.search.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => runSearch(el.search.value), SEARCH_DEBOUNCE_MS);
    });

    const searchWrap = ui.createElement('div', 'fk-search');
    searchWrap.appendChild(ui.createElement('span', 'fk-search-icon', { html: ui.getIcon('search') }));
    searchWrap.appendChild(el.search);

    el.list = ui.createElement('div', 'fk-list');
    el.status = ui.createElement('div', 'fk-status');

    const container = ui.createElement('div', 'fk-catalog');
    container.appendChild(searchWrap);
    container.appendChild(el.status);
    container.appendChild(el.list);

    setStatus('Loading font catalog…');
    runSearch('');
    return container;
  }

  return {
    render,
    /** Re-run the current query — call it when the role changed underneath. */
    refresh: () => runSearch(el.search ? el.search.value : ''),
    focus: () => el.search && el.search.focus()
  };
}

const exportsObj = { createTypography, createFontList, ROLES, ZOOM };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.FontKitPicker = exportsObj;
}

})();

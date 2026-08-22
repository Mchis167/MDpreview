/* ============================================================
   font-kit/picker.js — the font panel.

   Builds DOM through an injected `ui` adapter rather than touching
   a design system directly, so the panel can be dropped into any
   host that can supply the same handful of primitives.
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

function createPicker(options) {
  const { ui, bridge, state } = options;
  let role = options.initialRole || 'title';
  let searchTimer = null;
  let requestSeq = 0;

  const el = {};

  // ── Header: role switch + font hiện tại ────────────────────
  function buildRoleGroup() {
    const segmented = ui.createSegmented({
      items: ROLES.map((r) => ({ id: r.id, icon: r.icon, title: r.hint })),
      activeId: role,
      onChange: (id) => {
        role = id;
        segmented.updateActive(id);
        renderCurrent();
        runSearch(el.search.value);
      }
    });

    el.segmented = segmented;
    el.currentValue = ui.createElement('span', 'fk-current-value');
    el.resetBtn = ui.createElement('button', 'fk-reset', { text: 'Reset' });
    el.resetBtn.addEventListener('click', () => {
      bridge.apply(role, null);
      state[role] = null;
      renderCurrent();
      renderList(el.lastResults || []);
    });

    const controls = ui.createElement('div', 'fk-current-controls');
    controls.appendChild(el.currentValue);
    controls.appendChild(el.resetBtn);

    return ui.createGroup('Typography', [
      ui.createSettingRow({ label: 'Applies to', control: segmented.el }),
      ui.createDivider(),
      ui.createSettingRow({ label: 'Current font', control: controls })
    ]);
  }

  function renderCurrent() {
    const family = state[role];
    el.currentValue.textContent = family || 'System default';
    el.currentValue.style.fontFamily = family ? `'${family}'` : '';
    el.resetBtn.style.visibility = family ? 'visible' : 'hidden';
    if (el.segmented) el.segmented.updateActive(role);
  }

  // ── Body: ô tìm + danh sách ────────────────────────────────
  function buildSearchGroup() {
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
    const icon = ui.createElement('span', 'fk-search-icon', { html: ui.getIcon('search') });
    searchWrap.appendChild(icon);
    searchWrap.appendChild(el.search);

    el.list = ui.createElement('div', 'fk-list');
    el.status = ui.createElement('div', 'fk-status');

    const group = ui.createGroup('Google Fonts', [searchWrap, el.status, el.list]);
    return group;
  }

  function setStatus(text, tone) {
    el.status.textContent = text || '';
    el.status.className = tone ? `fk-status fk-status-${tone}` : 'fk-status';
    el.status.style.display = text ? 'block' : 'none';
  }

  async function runSearch(query) {
    const seq = (requestSeq += 1);
    try {
      const results = await bridge.search(query, role, RESULT_LIMIT);
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
      const empty = ui.createElement('div', 'fk-empty', { text: 'No matching font.' });
      el.list.appendChild(empty);
      return;
    }

    results.forEach((font) => {
      el.list.appendChild(buildItem(font));
    });
  }

  function buildItem(font) {
    const item = ui.createElement('div', 'fk-item');
    if (font.family === state[role]) item.classList.add('active');

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

    try {
      await bridge.apply(role, font.family);
      font.installed = true;
      state[role] = font.family;

      name.style.fontFamily = `'${font.family}'`;
      el.list.querySelectorAll('.fk-item').forEach((n) => n.classList.remove('active'));
      item.classList.add('active');
      mark.innerHTML = ui.getIcon('check');
      mark.classList.remove('fk-item-mark-download');
      renderCurrent();
    } catch (err) {
      mark.innerHTML = ui.getIcon(font.installed ? 'check' : 'arrow-down');
      setStatus(`Could not install ${font.family} — ${err.message}`, 'error');
    } finally {
      item.classList.remove('is-loading');
    }
  }

  function render() {
    const container = ui.createElement('div', 'fk-panel');
    container.appendChild(buildRoleGroup());
    container.appendChild(buildSearchGroup());
    renderCurrent();
    setStatus('Loading font catalog…');
    runSearch('');
    return container;
  }

  return { render, get role() { return role; } };
}

/**
 * Mở panel trong một popover của host. Trả về instance popover.
 */
function openPicker(options) {
  const picker = createPicker(options);
  return options.ui.createPopover({
    title: 'Fonts',
    subtitle: 'Search, download and apply any Google Font',
    content: picker.render(),
    className: 'fk-popover',
    onClose: options.onClose
  });
}

const exportsObj = { createPicker, openPicker, ROLES };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.FontKitPicker = exportsObj;
}

})();

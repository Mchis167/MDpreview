/* ============================================================
   workspace.js — Workspace CRUD + UI (Vanilla CSS version)
   ============================================================ */

const WorkspaceModule = (() => {
  let workspaces      = [];
  let activeId        = null;
  let pendingPath     = null;

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    _bindPanelEvents();
    _bindModalEvents();
    await load();
  }

  // ── Load from main process ──────────────────────────────────
  async function load() {
    const data  = await window.electronAPI.getWorkspaces();
    workspaces  = data.workspaces  || [];
    activeId    = data.activeWorkspaceId;
    _renderSwitcher();
    await _applyActive();
    _renderList();
  }

  // ── Apply active workspace to server + tree ─────────────────
  async function _applyActive() {
    const ws = workspaces.find(w => w.id === activeId) || null;
    AppState.currentWorkspace = ws;

    const lbl = document.getElementById('workspace-name');
    if (lbl) lbl.textContent = ws ? ws.name : 'Add Workspace';

    if (ws) {
      await window.electronAPI.setWatchDir(ws.path);
      TreeModule.load();
    } else {
      setNoFile();
      const tree = document.getElementById('file-tree');
      if (tree) tree.innerHTML = '';
      const empty = document.getElementById('tree-empty');
      if (empty) empty.classList.add('show');
    }
  }

  // ── Switch workspace ────────────────────────────────────────
  async function switchTo(id) {
    activeId = id;
    AppState.currentFile = null;
    await window.electronAPI.setActiveWorkspace(id);
    CommentsModule.clearUI();
    setNoFile();
    _closePanel();
    await load();
  }

  // ── Add workspace ────────────────────────────────────────────
  async function add(name, folderPath) {
    const ws = await window.electronAPI.saveWorkspace({ name, path: folderPath });
    workspaces.push(ws);
    activeId = ws.id;
    await window.electronAPI.setActiveWorkspace(ws.id);
    _closeModal();
    await load();
  }

  // ── Delete workspace ─────────────────────────────────────────
  async function remove(id) {
    const data = await window.electronAPI.deleteWorkspace(id);
    workspaces = data.workspaces;
    activeId   = data.activeWorkspaceId;
    _renderSwitcher();
    await _applyActive();
    _renderList();
  }

  // ── Render workspace list in panel ───────────────────────────
  function _renderList() {
    const list = document.getElementById('workspace-list');
    if (!list) return;
    list.innerHTML = '';

    if (!workspaces.length) {
      const empty = document.createElement('div');
      empty.style.cssText = 'padding:40px;text-align:center;opacity:0.3;display:flex;flex-direction:column;align-items:center;gap:12px;';
      empty.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>
        <p style="font-size:13px;font-weight:700;">Create your first workspace</p>`;
      list.appendChild(empty);
      return;
    }

    workspaces.forEach(ws => {
      const isActive = ws.id === activeId;
      const item = document.createElement('div');
      item.className = 'ws-list-item' + (isActive ? ' active' : '');

      const svgFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>`;
      const svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="m19 6-.867 12.142A2 2 0 0 1 16.138 20H7.862a2 2 0 0 1-1.995-1.858L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="m8 6 .867-1.733A2 2 0 0 1 10.657 3h2.686a2 2 0 0 1 1.79 1.267L16 6"/></svg>`;

      item.innerHTML = `
        <div class="ws-list-item-info">
          <span style="color:${isActive ? 'var(--accent)' : 'rgba(255,255,255,0.3)'};">${svgFolder}</span>
          <div style="min-width:0;">
            <div class="ws-list-item-name">${_esc(ws.name)}</div>
            <div class="ws-list-item-path">${_esc(ws.path)}</div>
          </div>
        </div>
        <button class="ws-list-item-delete" data-id="${ws.id}" title="Remove">${svgTrash}</button>
      `;

      item.addEventListener('click', e => {
        if (e.target.closest('.ws-list-item-delete')) return;
        switchTo(ws.id);
      });
      item.querySelector('.ws-list-item-delete').addEventListener('click', e => {
        e.stopPropagation();
        if (confirm(`Remove workspace "${ws.name}"?`)) remove(ws.id);
      });

      list.appendChild(item);
    });
  }

  // ── Render switcher label ────────────────────────────────────
  function _renderSwitcher() {
    const ws = workspaces.find(w => w.id === activeId);
    const lbl = document.getElementById('workspace-name');
    if (lbl) lbl.textContent = ws ? ws.name : 'Add Workspace';
  }

  // ── Panel open/close ─────────────────────────────────────────
  function _openPanel() {
    _renderList();
    document.getElementById('workspace-panel').classList.add('show');
  }

  function _closePanel() {
    document.getElementById('workspace-panel').classList.remove('show');
  }

  // ── Modal open/close ─────────────────────────────────────────
  function _openModal() {
    pendingPath = null;
    document.getElementById('workspace-name-input').value  = '';
    document.getElementById('workspace-path-input').value  = '';
    document.getElementById('confirm-workspace-btn').disabled = true;
    _closePanel();
    document.getElementById('add-workspace-modal').classList.add('show');
    document.getElementById('workspace-name-input').focus();
  }

  function _closeModal() {
    document.getElementById('add-workspace-modal').classList.remove('show');
  }

  // ── Validate confirm button ───────────────────────────────────
  function _validateModal() {
    const name = document.getElementById('workspace-name-input').value.trim();
    document.getElementById('confirm-workspace-btn').disabled = !(name && pendingPath);
  }

  // ── Bind panel events ─────────────────────────────────────────
  function _bindPanelEvents() {
    document.getElementById('workspace-switcher').addEventListener('click', () => {
      const panel = document.getElementById('workspace-panel');
      panel.classList.contains('show') ? _closePanel() : _openPanel();
    });
    document.getElementById('workspace-panel-close').addEventListener('click', _closePanel);
    document.getElementById('workspace-panel').addEventListener('click', e => {
      if (e.target === document.getElementById('workspace-panel')) _closePanel();
    });
    document.getElementById('add-workspace-btn').addEventListener('click', _openModal);
  }

  // ── Bind modal events ─────────────────────────────────────────
  function _bindModalEvents() {
    document.getElementById('browse-btn').addEventListener('click', async () => {
      const p = await window.electronAPI.openFolder();
      if (p) {
        pendingPath = p;
        document.getElementById('workspace-path-input').value = p;
        _validateModal();
      }
    });

    document.getElementById('workspace-name-input').addEventListener('input', _validateModal);

    document.getElementById('confirm-workspace-btn').addEventListener('click', async () => {
      const name = document.getElementById('workspace-name-input').value.trim();
      if (name && pendingPath) await add(name, pendingPath);
    });

    document.getElementById('cancel-workspace-btn').addEventListener('click', _closeModal);
    document.getElementById('add-workspace-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('add-workspace-modal')) _closeModal();
    });

    document.getElementById('workspace-name-input').addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        const name = e.target.value.trim();
        if (name && pendingPath) await add(name, pendingPath);
      }
      if (e.key === 'Escape') _closeModal();
    });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, load, getActive: () => workspaces.find(w => w.id === activeId) };
})();

/* ============================================================
   workspace.js — Workspace CRUD + UI (Vanilla CSS version)
   ============================================================ */

const WorkspaceModule = (() => {
  let workspaces      = [];
  let activeId        = null;
  let pendingPath     = null;
  let editId          = null; // Track which workspace we are editing

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    _bindPanelEvents();
    _bindModalEvents();
    await load();
  }

  // ── Load from main process ──────────────────────────────────
  async function load() {
    if (!window.electronAPI) {
      console.warn('WorkspaceModule: window.electronAPI is undefined. Workspaces will not be loaded.');
      return;
    }
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
      if (window.electronAPI) {
        await window.electronAPI.setWatchDir(ws.path);
      }
      TreeModule.load();
      if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(ws.id);
    } else {
      setNoFile();
      const tree = document.getElementById('file-tree');
      if (tree) tree.innerHTML = '';
      const empty = document.getElementById('tree-empty');
      if (empty) empty.classList.add('show');
      if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(null);
    }
  }

  // ── Switch workspace ────────────────────────────────────────
  async function switchTo(id) {
    if (!window.electronAPI) return;

    // Dirty check before switching workspace
    if (AppState.currentMode === 'edit' && typeof EditorModule !== 'undefined' && EditorModule.isDirty()) {
      if (!confirm('You have unsaved changes. Switch workspace anyway?')) return;
    }

    const ws = workspaces.find(w => w.id === id);
    activeId = id;
    AppState.currentFile = null;
    await window.electronAPI.setActiveWorkspace(id);
    CommentsModule.clearUI();
    setNoFile();
    _closePanel();
    
    // Switch tabs context
    if (typeof TabsModule !== 'undefined') TabsModule.switchWorkspace(id);

    await load();
    if (typeof showToast === 'function' && ws) {
      showToast(`Switched to ${ws.name}`);
    }
  }

  // ── Add workspace ────────────────────────────────────────────
  async function add(name, folderPath) {
    if (!window.electronAPI) return;
    const ws = await window.electronAPI.saveWorkspace({ name, path: folderPath });
    workspaces.push(ws);
    activeId = ws.id;
    await window.electronAPI.setActiveWorkspace(ws.id);
    _closeModal();
    await load();
    if (typeof showToast === 'function') {
      showToast(`Created workspace: ${name}`);
    }
  }

  // ── Rename workspace ─────────────────────────────────────────
  async function rename(id, newName) {
    if (!window.electronAPI) return;
    await window.electronAPI.renameWorkspace(id, newName);
    _closeModal();
    await load();
    if (typeof showToast === 'function') {
      showToast(`Renamed to ${newName}`);
    }
  }

  // ── Delete workspace ─────────────────────────────────────────
  async function remove(id) {
    if (!window.electronAPI) return;
    const ws = workspaces.find(w => w.id === id);
    const name = ws ? ws.name : '';
    const data = await window.electronAPI.deleteWorkspace(id);
    
    // Cleanup persistence
    localStorage.removeItem(`tabs_${id}`);
    localStorage.removeItem(`draft_${id}`);
    if (typeof ScrollModule !== 'undefined') {
      ScrollModule.clearForWorkspace(id);
    }

    workspaces = data.workspaces;
    activeId   = data.activeWorkspaceId;
    _renderSwitcher();
    await _applyActive();
    _renderList();
    if (typeof showToast === 'function' && name) {
      showToast(`Deleted workspace: ${name}`);
    }
  }

  // ── Render workspace list in panel ───────────────────────────
  function _renderList() {
    const list = document.getElementById('workspace-list');
    if (!list) return;
    list.innerHTML = '';

    if (!workspaces.length) {
      const empty = document.createElement('div');
      empty.className = 'ws-empty-state';
      empty.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18M9 21V9"/><line x1="12" y1="13" x2="12" y2="17"/><line x1="10" y1="15" x2="14" y2="15"/></svg>
        <p>Create your first workspace</p>`;
      list.appendChild(empty);
      return;
    }

    workspaces.forEach(ws => {
      const isActive = ws.id === activeId;
      const item = document.createElement('div');
      item.className = 'ws-list-item' + (isActive ? ' active' : '');

      const svgFolder = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>`;
      const svgTrash = `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>`;

      const badgeHtml = isActive ? `<span class="ws-badge">IN OPEN</span>` : '';

      item.innerHTML = `
        <div class="ws-list-item-left">
          <div class="ws-list-item-icon">${svgFolder}</div>
          <div class="ws-list-item-name-wrap">
            <span class="ws-list-item-name" title="Click to rename">${_esc(ws.name)}</span>
            <input type="text" class="ws-list-item-input" value="${_esc(ws.name)}" style="display:none">
            ${badgeHtml}
          </div>
        </div>
        <div class="ws-list-item-path-col">
          <div class="ws-list-item-path">${_esc(ws.path).toUpperCase()}</div>
        </div>
        <div class="ws-list-item-right">
          <button class="ws-list-item-delete" data-id="${ws.id}" title="Remove Workspace">${svgTrash}</button>
        </div>
      `;

      // Inline Edit Logic
      const nameEl = item.querySelector('.ws-list-item-name');
      const inputEl = item.querySelector('.ws-list-item-input');

      nameEl.addEventListener('click', (e) => {
        e.stopPropagation();
        nameEl.style.display = 'none';
        inputEl.style.display = 'block';
        inputEl.focus();
        inputEl.select();
      });

      const saveInline = async () => {
        const newName = inputEl.value.trim();
        if (newName && newName !== ws.name) {
          await rename(ws.id, newName);
        } else {
          nameEl.style.display = 'block';
          inputEl.style.display = 'none';
        }
      };

      inputEl.addEventListener('keydown', e => {
        if (e.key === 'Enter') saveInline();
        if (e.key === 'Escape') {
          inputEl.value = ws.name;
          nameEl.style.display = 'block';
          inputEl.style.display = 'none';
        }
      });
      inputEl.addEventListener('blur', saveInline);

      // Row Click (Switch)
      item.addEventListener('click', e => {
        if (e.target.closest('.ws-list-item-delete') || e.target.closest('.ws-list-item-input')) return;
        switchTo(ws.id);
      });

      // Delete Click
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
  function _openModal(wsToEdit = null) {
    editId = wsToEdit ? wsToEdit.id : null;
    pendingPath = wsToEdit ? wsToEdit.path : null;

    const title = document.querySelector('.aws-title');
    const subtitle = document.querySelector('.aws-subtitle');
    const confirmBtn = document.getElementById('confirm-workspace-btn');
    const browseRow = document.querySelector('.aws-browse-row-container');

    if (editId) {
      if (title) title.textContent = 'Rename Workspace';
      if (subtitle) subtitle.textContent = 'Change the display name of your workspace.';
      if (confirmBtn) confirmBtn.textContent = 'Update';
      if (browseRow) browseRow.style.display = 'none';
      document.getElementById('workspace-name-input').value = wsToEdit.name;
    } else {
      if (title) title.textContent = 'New Workspace';
      if (subtitle) subtitle.textContent = 'Connect a local folder to start previewing.';
      if (confirmBtn) confirmBtn.textContent = 'Create';
      if (browseRow) browseRow.style.display = 'block';
      document.getElementById('workspace-name-input').value = '';
      document.getElementById('workspace-path-input').value = '';
    }

    _validateModal();
    _closePanel();
    document.getElementById('add-workspace-modal').classList.add('show');
    document.getElementById('workspace-name-input').focus();
  }

  function _closeModal(reopenPanel = false) {
    document.getElementById('add-workspace-modal').classList.remove('show');
    editId = null;
    pendingPath = null;
    if (reopenPanel) _openPanel();
  }

  // ── Validate confirm button ───────────────────────────────────
  function _validateModal() {
    const name = document.getElementById('workspace-name-input').value.trim();
    const confirmBtn = document.getElementById('confirm-workspace-btn');
    if (editId) {
      confirmBtn.disabled = !name;
    } else {
      confirmBtn.disabled = !(name && pendingPath);
    }
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
    document.getElementById('add-workspace-btn').addEventListener('click', () => _openModal());
  }

  // ── Bind modal events ─────────────────────────────────────────
  function _bindModalEvents() {
    document.getElementById('browse-btn').addEventListener('click', async () => {
      if (!window.electronAPI) return;
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
      if (!name) return;
      if (editId) {
        await rename(editId, name);
      } else {
        if (pendingPath) await add(name, pendingPath);
      }
    });

    document.getElementById('cancel-workspace-btn').addEventListener('click', () => _closeModal(true));
    document.getElementById('add-workspace-modal').addEventListener('click', e => {
      if (e.target === document.getElementById('add-workspace-modal')) _closeModal(true);
    });

    document.getElementById('workspace-name-input').addEventListener('keydown', async e => {
      if (e.key === 'Enter') {
        const name = e.target.value.trim();
        if (!name) return;
        if (editId) {
          await rename(editId, name);
        } else {
          if (pendingPath) await add(name, pendingPath);
        }
      }
      if (e.key === 'Escape') _closeModal(true);
    });
  }

  function _esc(str) {
    return String(str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  return { init, load, getActive: () => workspaces.find(w => w.id === activeId) };
})();


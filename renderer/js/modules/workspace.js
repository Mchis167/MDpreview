/* ============================================================
   workspace.js — Workspace CRUD + UI (Vanilla CSS version)
   ============================================================ */

const WorkspaceModule = (() => {
  let workspaces = [];
  let activeId = null;

  // ── Init ────────────────────────────────────────────────────
  async function init() {
    _bindPanelEvents();
    await load();
  }

  // ── Load from main process ──────────────────────────────────
  async function load() {
    if (!window.electronAPI) {
      console.warn('WorkspaceModule: window.electronAPI is undefined. Workspaces will not be loaded.');
      return;
    }
    const data = await window.electronAPI.getWorkspaces();
    workspaces = data.workspaces || [];
    activeId = data.activeWorkspaceId;
    _renderSwitcher();
    await _applyActive();
  }

  // ── Apply active workspace to server + tree ─────────────────
  async function _applyActive() {
    const ws = workspaces.find(w => w.id === activeId) || null;
    AppState.currentWorkspace = ws;

    const lbl = document.getElementById('workspace-name');
    if (lbl) {
      lbl.textContent = ws ? ws.name : 'Add Workspace';
      lbl.classList.remove('skeleton', 'skeleton-text');
      lbl.style.width = ''; // Reset custom skeleton width
    }

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
      const isDraft = AppState.currentFile && AppState.currentFile.startsWith('__DRAFT_');
      const isFirstEdit = EditorModule.getOriginalContent() === '';

      if (isDraft || isFirstEdit) {
        await EditorModule.save();
      } else {
        DesignSystem.showConfirm({
          title: 'Unsaved Changes',
          message: 'You have unsaved changes. Switch workspace anyway?',
          onConfirm: async () => {
            await _proceedSwitch(id);
          }
        });
        return;
      }
    }

    await _proceedSwitch(id);
  }

  async function _proceedSwitch(id) {
    const ws = workspaces.find(w => w.id === id);
    activeId = id;
    AppState.currentWorkspace = ws; // CRITICAL: Update AppState before context switches
    AppState.currentFile = null;
    await window.electronAPI.setActiveWorkspace(id);
    if (typeof CommentsModule !== 'undefined') CommentsModule.clearUI();
    setNoFile();

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
    await load();
    if (typeof showToast === 'function') {
      showToast(`Created workspace: ${name}`);
    }
  }

  // ── Rename workspace ─────────────────────────────────────────
  async function rename(id, newName) {
    if (!window.electronAPI) return;
    await window.electronAPI.renameWorkspace(id, newName);
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
    activeId = data.activeWorkspaceId;

    // Immediately clear tree to avoid ghosting
    if (typeof TreeModule !== 'undefined') TreeModule.clear();

    _renderSwitcher();
    await _applyActive();

    if (typeof showToast === 'function' && name) {
      showToast(`Deleted workspace: ${name}`);
    }
  }

  // ── Render switcher label ────────────────────────────────────
  function _renderSwitcher() {
    const ws = workspaces.find(w => w.id === activeId);
    const lbl = document.getElementById('workspace-name');
    if (lbl) {
      lbl.textContent = ws ? ws.name : 'Add Workspace';
      lbl.classList.remove('skeleton', 'skeleton-text');
      lbl.style.width = '';
    }
  }

  function _openPanel() {
    let popover = null;

    const refreshContent = () => {
      if (!popover || !popover.body) return;
      
      popover.body.innerHTML = '';
      const component = new WorkspacePickerComponent({
        workspaces: workspaces,
        activeId: activeId,
        onSelect: (id) => {
          switchTo(id);
          popover.close();
        },
        onAdd: () => {
          _openModal(null, () => refreshContent());
        },
        onRename: async (id, newName) => {
          await rename(id, newName);
          refreshContent();
        },
        onDelete: async (ws) => {
          DesignSystem.showConfirm({
            title: 'Delete Workspace',
            message: `Are you sure you want to remove workspace "${ws.name}"? This action cannot be undone.`,
            onConfirm: async () => {
              await remove(ws.id);
              refreshContent();
            }
          });
        }
      });
      popover.body.appendChild(component.render());
    };

    popover = WorkspacePickerComponent.open({
      workspaces: workspaces,
      activeId: activeId,
      onSelect: (id) => {
        switchTo(id);
        popover.close();
      },
      onAdd: () => {
        _openModal(null, () => refreshContent());
      },
      onRename: async (id, newName) => {
        await rename(id, newName);
        refreshContent();
      },
      onDelete: async (ws) => {
        DesignSystem.showConfirm({
          title: 'Delete Workspace',
          message: `Are you sure you want to remove workspace "${ws.name}"? This action cannot be undone.`,
          onConfirm: async () => {
            await remove(ws.id);
            refreshContent();
          }
        });
      }
    });
  }

  // ── Modal open/close ─────────────────────────────────────────
  function _openModal(wsToEdit = null, onAfterConfirm = null) {
    WorkspaceFormComponent.open({
      editWs: wsToEdit,
      onConfirm: async (arg1, arg2) => {
        if (wsToEdit) {
          await rename(arg1, arg2);
        } else {
          await add(arg1, arg2);
        }
        if (onAfterConfirm) onAfterConfirm();
      },
      onBrowse: async () => {
        if (!window.electronAPI) return null;
        return await window.electronAPI.openFolder();
      },
      onCancel: () => {
        // Option to reopen picker if needed
      }
    });
  }

  function _bindPanelEvents() {
    document.getElementById('workspace-switcher').addEventListener('click', () => {
      _openPanel();
    });
  }

  return { init, load, getActive: () => workspaces.find(w => w.id === activeId) };
})();

window.WorkspaceModule = WorkspaceModule;

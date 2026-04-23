/* ============================================================
   toolbar.js — Toolbar action buttons and Keyboard Shortcuts
   ============================================================ */

/**
 * Legacy initializer. Most button logic is now handled by 
 * TabBarComponent or SecondaryToolbarComponent.
 */
function initToolbarBtns() {
  // Currently empty, but kept for boot sequence consistency
}

// ── Keyboard Shortcuts Popover ───────────────────────────
let _shortcutsCtrl = null;

function initShortcutsPopover() {
  const btn = document.getElementById('shortcuts-btn');
  // Even if btn is missing, we want the toggle logic for other triggers
  
  let activePopover = null;

  const toggle = () => {
    if (activePopover) {
      activePopover.close();
      activePopover = null;
    } else if (window.ShortcutsComponent) {
      activePopover = window.ShortcutsComponent.open();
      // Reset reference when closed from inside
      const originalClose = activePopover.close;
      activePopover.close = () => {
        originalClose();
        activePopover = null;
      };
    }
  };

  if (btn) {
    btn.addEventListener('click', (e) => { 
      e.stopPropagation(); 
      toggle(); 
    });
  }

  _shortcutsCtrl = { 
    close: () => { if (activePopover) activePopover.close(); }, 
    toggle 
  };
  
  window.toggleShortcutsPopover = toggle;
  return _shortcutsCtrl;
}

// ── Global Keyboard Shortcuts ────────────────────────────
function initGlobalShortcuts() {
  const shortcutsCtrl = initShortcutsPopover();
  if (!shortcutsCtrl) return;

  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');

  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // ── Escape: close any open overlays ─────────────────
    if (e.key === 'Escape') {
      shortcutsCtrl.close();
      return;
    }

    // Skip if user is typing in an input/textarea (except shortcuts we explicitly want)
    const activeTag = document.activeElement?.tagName;
    const inInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    // ── Mod+/ — Keyboard shortcuts popover ─────────────
    if (mod && e.key === '/') {
      e.preventDefault();
      shortcutsCtrl.toggle();
      return;
    }

    // ── Mod+, — Settings ───────────────────────────────
    if (mod && e.key === ',') {
      e.preventDefault();
      if (typeof SettingsModule !== 'undefined') {
        SettingsModule.open();
      }
      return;
    }

    // ── Mod+F — Search ──────────────────────────────────
    if (mod && e.key === 'f') {
      e.preventDefault();
      document.getElementById('enter-search-btn')?.click();
      return;
    }

    // ── Mod+O — Workspace Picker ─────────────────────────
    if (mod && e.key === 'o') {
      e.preventDefault();
      const wsBtn = document.getElementById('workspace-switcher');
      if (wsBtn) wsBtn.click();
      return;
    }

    // ── Mod+R — Rebuild & Relaunch ────────────────────────
    if (mod && e.key === 'r') {
      e.preventDefault();
      DesignSystem.showConfirm({
        title: 'Rebuild App',
        message: 'Rebuild and relaunch the application?',
        onConfirm: () => {
          window.electronAPI.rebuildApp();
        }
      });
      return;
    }

    // ── Mod+W — Close Tab ────────────────────────────────
    if (mod && e.key === 'w') {
      e.preventDefault();
      if (typeof TabsModule !== 'undefined') {
        const active = TabsModule.getActive();
        if (active) TabsModule.remove(active);
      }
      return;
    }

    // ── Mod+S — Save ───────────────────────────────────
    if (mod && e.key === 's') {
      // Always allow save, let EditorModule handle logic
      if (typeof EditorModule !== 'undefined') {
        e.preventDefault();
        EditorModule.save();
      }
      return;
    }

    // ── Mod+B — Toggle sidebar ──────────────────────────
    if (mod && e.key === 'b') {
      e.preventDefault();
      const btn = document.querySelector('.tab-bar__toggle-btn');
      if (btn) btn.click();
      return;
    }

    // ── Mod+1/2/3/4 — Mode switch ─────────────────────────
    if (mod && (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4')) {
      e.preventDefault();
      const modeMap = { '1': 'read', '2': 'edit', '3': 'comment', '4': 'collect' };
      document.querySelector(`.ds-segment-item[data-mode="${modeMap[e.key]}"]`)?.click();
      return;
    }

    // Skip remaining UI-only shortcuts when focused in a text field
    if (inInput) return;

    // ── Mod+↑/↓ — Scroll to top/bottom ─────────────────
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: viewer.scrollHeight, behavior: 'auto' });
      return;
    }

    // ── Fullscreen ───────────────────────────────────────
    const isFullscreenKey = isMac 
      ? (e.metaKey && e.ctrlKey && e.key === 'f') // Cmd + Ctrl + F
      : (e.key === 'F11');                      // F11

    if (isFullscreenKey) {
      e.preventDefault();
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        document.exitFullscreen();
      }
      return;
    }
  });

  // ── Mod+H in edit mode — Markdown helper ────────────
  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;
    if (mod && e.key === 'h') {
      const editViewer = document.getElementById('edit-viewer');
      if (!editViewer || editViewer.style.display === 'none') return;
      e.preventDefault();
      if (window.MarkdownHelperComponent) {
        window.MarkdownHelperComponent.open();
      }
    }
  });
}

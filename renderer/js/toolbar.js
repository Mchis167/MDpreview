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
function initShortcutsPopover() {
  const btn     = document.getElementById('shortcuts-btn');
  const popover = document.getElementById('shortcuts-popover');
  const closeBtn = document.getElementById('shortcuts-close-btn');
  if (!btn || !popover) return;

  const open  = () => popover.classList.add('open');
  const close = () => popover.classList.remove('open');
  const toggle = () => popover.classList.contains('open') ? close() : open();

  btn.addEventListener('click', (e) => { e.stopPropagation(); toggle(); });
  if (closeBtn) closeBtn.addEventListener('click', close);

  // Close when clicking outside
  document.addEventListener('click', (e) => {
    if (!popover.contains(e.target) && e.target !== btn) close();
  });

  // Expose control for global shortcuts
  return { open, close, toggle };
}

// ── Global Keyboard Shortcuts ────────────────────────────
function initGlobalShortcuts() {
  const shortcutsCtrl = initShortcutsPopover();
  if (!shortcutsCtrl) return;

  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');

  // Update UI to show ⌘ symbols on Mac
  if (isMac) {
    document.querySelectorAll('#shortcuts-popover kbd').forEach(k => {
      if (k.textContent === 'Ctrl') k.textContent = '⌘';
    });
    // Handle Fullscreen special case for Mac UI
    const fsKbd = document.getElementById('kbd-fullscreen');
    if (fsKbd) {
      fsKbd.innerHTML = '<kbd>⌃</kbd><kbd>⌘</kbd><kbd>F</kbd>';
    }
  }

  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // ── Escape: close any open overlays ─────────────────
    if (e.key === 'Escape') {
      shortcutsCtrl.close();
      const helpPopover = document.getElementById('edit-help-popover');
      if (helpPopover) helpPopover.classList.remove('open');
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
      const settingsBtn = document.getElementById('open-settings-btn');
      if (settingsBtn) settingsBtn.click();
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
      // Rebuild is now in the TabBar, but we can trigger it via global electronAPI
      if (confirm('Rebuild and relaunch the application?')) {
        window.electronAPI.rebuildApp();
      }
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

    // Skip remaining shortcuts when focused in a text field
    if (inInput) return;

    // ── Mod+1/2/3/4 — Mode switch ─────────────────────────
    if (mod && e.key === '1') {
      e.preventDefault();
      document.querySelector('.ds-segment-item[data-mode="read"]')?.click();
      return;
    }
    if (mod && e.key === '2') {
      e.preventDefault();
      document.querySelector('.ds-segment-item[data-mode="edit"]')?.click();
      return;
    }
    if (mod && e.key === '3') {
      e.preventDefault();
      document.querySelector('.ds-segment-item[data-mode="comment"]')?.click();
      return;
    }
    if (mod && e.key === '4') {
      e.preventDefault();
      document.querySelector('.ds-segment-item[data-mode="collect"]')?.click();
      return;
    }

    // ── Mod+B — Toggle sidebar ──────────────────────────
    if (mod && e.key === 'b') {
      e.preventDefault();
      // Use the new toggle logic exposed in TabsModule/TabBar
      const btn = document.querySelector('.tab-bar__toggle-btn');
      if (btn) btn.click();
      return;
    }

    // ── Mod+S — Save (edit mode only) ───────────────────
    if (mod && e.key === 's') {
      if (typeof AppState !== 'undefined' && AppState.currentMode === 'edit') {
        e.preventDefault();
        if (typeof EditorModule !== 'undefined') EditorModule.save();
      }
      return;
    }

    // ── Mod+↑/↓ — Scroll to top/bottom ─────────────────
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer');
      if (viewer) viewer.scrollTo({ top: viewer.scrollHeight, behavior: 'smooth' });
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
      const helpPopover = document.getElementById('edit-help-popover');
      if (helpPopover) helpPopover.classList.toggle('open');
    }
  });
}

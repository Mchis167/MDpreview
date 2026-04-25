/* ============================================================
   toolbar.js — Toolbar action buttons and Keyboard Shortcuts
   ============================================================ */

(() => {
'use strict';

/**
 * Legacy initializer. Most button logic is now handled by
 * TabBarComponent or SecondaryToolbarComponent.
 */
function initToolbarBtns() {
  // Currently empty, but kept for boot sequence consistency
}

// ── Global Keyboard Shortcuts ────────────────────────────
function initGlobalShortcuts() {
  const isMac = /Mac|iPhone|iPod|iPad/.test(navigator.platform) || (navigator.userAgentData && navigator.userAgentData.platform === 'macOS');

  document.addEventListener('keydown', (e) => {
    const mod = isMac ? e.metaKey : e.ctrlKey;

    // ── Escape: close overlays & deselect ─────────────────
    if (e.key === 'Escape') {
      if (window.ShortcutsComponent && window.ShortcutsComponent.activeInstance) {
        window.ShortcutsComponent.activeInstance.close();
      }
      if (typeof TabsModule !== 'undefined') TabsModule.deselectAll();
      if (typeof TreeModule !== 'undefined') TreeModule.deselectAll();
      return;
    }

    // Skip if user is typing in an input/textarea (except shortcuts we explicitly want)
    const activeTag = document.activeElement?.tagName;
    const inInput = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

    // ── Mod+/ — Keyboard shortcuts popover ─────────────
    if (mod && e.key === '/') {
      e.preventDefault();
      if (window.ShortcutsComponent) {
        window.ShortcutsComponent.toggle();
      }
      return;
    }

    // ── Mod+, — Settings ───────────────────────────────
    if (mod && e.key === ',') {
      e.preventDefault();
      if (window.SettingsComponent) {
        window.SettingsComponent.toggle();
      }
      return;
    }

    // ── Mod+F — Search (Strict check to avoid Fullscreen conflict) ────
    if (mod && !e.ctrlKey && !e.shiftKey && e.key.toLowerCase() === 'f') {
      e.preventDefault();
      document.getElementById('enter-search-btn')?.click();
      return;
    }

    // ── Mod+O — Workspace Picker ─────────────────────────
    if (mod && !e.shiftKey && !e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      const wsBtn = document.getElementById('workspace-switcher');
      if (wsBtn) wsBtn.click();
      return;
    }

    // ── Mod+Shift+W — Close All ─────────────────────────
    if (mod && e.shiftKey && (e.key === 'w' || e.key === 'W')) {
      e.preventDefault();
      if (typeof TabsModule !== 'undefined') TabsModule.closeAll();
      return;
    }

    // ── Mod+W — Close Tab(s) ──────────────────────────────
    if (mod && !e.shiftKey && !e.ctrlKey && e.key === 'w') {
      e.preventDefault();
      if (typeof TabsModule !== 'undefined') {
        const selected = TabsModule.getSelectedFiles();
        if (selected && selected.length > 1) {
          TabsModule.closeSelected();
        } else {
          const active = TabsModule.getActive();
          if (active) TabsModule.remove(active);
        }
      }
      return;
    }

    // ── Mod+A — Select All Tabs ──────────────────────────
    if (mod && !e.shiftKey && !e.ctrlKey && (e.key === 'a' || e.key === 'A') && !inInput) {
      e.preventDefault();
      if (typeof TabsModule !== 'undefined') TabsModule.selectAll();
      return;
    }

    // ── Mod+S — Save ───────────────────────────────────
    if (mod && !e.shiftKey && !e.ctrlKey && e.key === 's') {
      // Always allow save, let EditorModule handle logic
      if (typeof EditorModule !== 'undefined') {
        e.preventDefault();
        EditorModule.save();
      }
      return;
    }

    // ── Mod+B — Toggle sidebar ──────────────────────────
    if (mod && !e.shiftKey && !e.ctrlKey && e.key === 'b') {
      e.preventDefault();
      const btn = document.querySelector('.tab-bar__toggle-btn');
      if (btn) btn.click();
      return;
    }

    // ── 1/2/3/4 or Mod+1/2/3/4 — Mode switch ──────────────
    const isNumericModeKey = (e.key === '1' || e.key === '2' || e.key === '3' || e.key === '4');
    if (isNumericModeKey && !e.shiftKey && !e.altKey) {
      // Switch if modifier is pressed OR if not typing in an input
      if (mod || !inInput) {
        e.preventDefault();
        const modeMap = { '1': 'read', '2': 'edit', '3': 'comment', '4': 'collect' };
        document.querySelector(`.ds-segment-item[data-mode="${modeMap[e.key]}"]`)?.click();
        return;
      }
    }

    // Skip remaining UI-only shortcuts when focused in a text field
    if (inInput) return;

    // ── Mod+↑/↓ — Scroll to top/bottom ─────────────────
    if (mod && e.key === 'ArrowUp') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer-mount');
      if (viewer) viewer.scrollTo({ top: 0, behavior: 'auto' });
      return;
    }
    if (mod && e.key === 'ArrowDown') {
      e.preventDefault();
      const viewer = document.getElementById('md-viewer-mount');
      if (viewer) viewer.scrollTo({ top: viewer.scrollHeight, behavior: 'auto' });
      return;
    }

    // ── Fullscreen ───────────────────────────────────────
    const isFullscreenKey = isMac
      ? (e.metaKey && (e.ctrlKey || e.shiftKey) && e.key.toLowerCase() === 'f')
      : (e.key === 'F11');

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

window.initToolbarBtns = initToolbarBtns;
window.initGlobalShortcuts = initGlobalShortcuts;

})();

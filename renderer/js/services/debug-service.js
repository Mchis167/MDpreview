/**
 * DebugService
 * Tracks line numbers in editor vs preview for debugging sync issues
 */
const DebugService = (() => {
  let isEnabled = false;
  let currentEditLine = -1;
  let currentPreviewLine = -1;
  let currentScrollPct = 0;

  const debugPanel = document.getElementById('debug-line-tracker');
  const debugEditLineEl = document.getElementById('debug-edit-line');
  const debugPreviewLineEl = document.getElementById('debug-preview-line');
  const debugScrollEl = document.getElementById('debug-scroll-pct');

  function toggle() {
    isEnabled = !isEnabled;
    if (debugPanel) {
      debugPanel.style.display = isEnabled ? 'block' : 'none';
    }
    console.log('[DebugService] Debug mode:', isEnabled ? 'ON' : 'OFF');
  }

  function updateEditLine(lineNum) {
    currentEditLine = lineNum;
    if (debugEditLineEl) {
      debugEditLineEl.textContent = lineNum > 0 ? lineNum : '-';
      debugEditLineEl.style.color = lineNum > 0 ? '#0f0' : '#888';
    }
  }

  function updatePreviewLine(lineNum) {
    currentPreviewLine = lineNum;
    if (debugPreviewLineEl) {
      debugPreviewLineEl.textContent = lineNum > 0 ? lineNum : '-';
      debugPreviewLineEl.style.color = lineNum > 0 ? '#0f0' : '#888';
    }

    // Highlight misalignment
    if (currentEditLine > 0 && currentPreviewLine > 0 && currentEditLine !== currentPreviewLine) {
      const diff = Math.abs(currentEditLine - currentPreviewLine);
      debugPreviewLineEl.style.color = diff > 5 ? '#f00' : '#ff0'; // Red if >5 lines diff, yellow if <5
    }
  }

  function updateScroll(scrollPct) {
    currentScrollPct = scrollPct;
    if (debugScrollEl) {
      debugScrollEl.textContent = (scrollPct * 100).toFixed(1);
    }
  }

  // Listen for keyboard shortcut to toggle debug mode
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
      e.preventDefault();
      toggle();
    }
  });

  return {
    isEnabled: () => isEnabled,
    updateEditLine,
    updatePreviewLine,
    updateScroll,
    toggle
  };
})();

window.DebugService = DebugService;

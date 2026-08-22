/* global TOCComponent */
/**
 * Wires the app's vendored TOCComponent into the preview webview: rescan on
 * every render, follow the viewport while it scrolls, and expose a toggle for
 * the floating action bar.
 *
 * The component itself is untouched — the app's heading scan, tree build,
 * scroll offset and expand/collapse memory all behave exactly as they do
 * in the desktop app.
 */
(function () {
  const mount = document.getElementById('md-viewer-mount');
  const viewport = document.querySelector('.md-viewer-viewport');
  const content = document.getElementById('md-content');
  if (typeof TOCComponent === 'undefined' || !mount || !viewport) return;

  const listeners = new Set();
  // The component flips its own isVisible() a frame after show()/hide() so the
  // CSS transition can trigger, so listeners are told the state being entered
  // rather than the one still in effect.
  const notify = (visible) => listeners.forEach((fn) => fn(visible));

  /**
   * Project Map is an app-only view (it mirrors a workspace tree this webview
   * has no access to), so its segment is removed rather than left to fail.
   * The indicator measures the remaining segment at runtime, so dropping the
   * node leaves the control correctly sized.
   */
  function dropMapSegment() {
    const panel = document.getElementById('ds-toc-panel');
    if (!panel) return;
    const mapSegment = panel.querySelector('.ds-segment-item[data-id="map"]');
    if (mapSegment) mapSegment.remove();
  }

  /**
   * The panel's own close button calls the component directly, so the bar
   * would otherwise keep showing the TOC as open.
   */
  function watchCloseButton() {
    const closeBtn = document.querySelector('#ds-toc-panel .toc-close');
    if (closeBtn) closeBtn.addEventListener('click', () => notify(false));
  }

  function rescan() {
    TOCComponent.update(content);
    TOCComponent.updateActiveHeading(viewport);
  }

  viewport.addEventListener(
    'scroll',
    () => TOCComponent.updateActiveHeading(viewport),
    { passive: true }
  );

  document.addEventListener('mdp:content-rendered', rescan);

  /**
   * Click-outside-to-close, TOC only (the app has no equivalent — its panel
   * lives inside a desktop window where losing focus isn't a "click away").
   * Capture phase, so it can veto before content clicks (e.g. jumping to a
   * heading) run their own handlers. The toc segment button is excluded so
   * that click's own toggle() isn't immediately undone by this one.
   */
  function onDocumentPointerDown(event) {
    const panel = document.getElementById('ds-toc-panel');
    if (!panel) return;
    if (panel.contains(event.target)) return;
    if (event.target.closest('.ds-segment-item[data-id="toc"]')) return;
    window.MdpToc.hide();
  }

  window.MdpToc = {
    isVisible: () => TOCComponent.isVisible(),

    toggle() {
      if (TOCComponent.isVisible()) return this.hide();

      TOCComponent.update(content);
      TOCComponent.show(mount);
      // show() mounts the panel on a timeout; the segment only exists after.
      setTimeout(() => {
        dropMapSegment();
        watchCloseButton();
        TOCComponent.updateActiveHeading(viewport);
      }, 30);
      notify(true);
      document.addEventListener('mousedown', onDocumentPointerDown, true);
    },

    hide() {
      document.removeEventListener('mousedown', onDocumentPointerDown, true);
      if (!TOCComponent.isVisible()) return;
      TOCComponent.hide();
      notify(false);
    },

    onChange(fn) {
      listeners.add(fn);
    }
  };
})();

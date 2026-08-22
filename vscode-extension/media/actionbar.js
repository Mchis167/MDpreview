/* global DesignSystem */
/**
 * Floating action bar — the same chrome the app puts at the bottom of its
 * viewer (organisms/change-action-view-bar), built from the same markup and
 * the same segmented control so it looks identical.
 *
 * Where the app's bar switches between mutually exclusive editor modes, this
 * one toggles the three panels the preview actually has: comments, the table
 * of contents, and settings. Each segment therefore reflects whether its
 * panel is open rather than acting as a radio choice.
 */
(function () {
  const host = document.getElementById('md-viewer-mount');
  if (!host || typeof DesignSystem === 'undefined') return;

  const ACTIONS = [
    { id: 'comment', icon: 'message-circle', title: 'Comments' },
    { id: 'toc', icon: 'list', title: 'Table of Contents' },
    { id: 'settings', icon: 'sliders', title: 'Settings' }
  ];

  const container = DesignSystem.createElement('div', 'ds-change-action-view-bar-container');
  const bar = DesignSystem.createElement('div', 'ds-change-action-view-bar');
  const leftSection = DesignSystem.createElement('div', 'ds-toolbar-section-left');

  const segmented = DesignSystem.createSegmentedControl({
    items: ACTIONS,
    activeId: null,
    onChange: (id) => handleClick(id),
    // Inherited from the bar's own padding, exactly as the app sets it.
    radius: 'var(--_section-radius)',
    tooltipPos: 'top'
  });

  leftSection.appendChild(segmented.el);
  bar.appendChild(leftSection);
  container.appendChild(bar);
  host.appendChild(container);

  const segmentEl = (id) => segmented.el.querySelector(`.ds-segment-item[data-id="${id}"]`);

  /**
   * The vendored control's own updateActive() is single-select: it clears the
   * other segments. These panels are independent, so each segment's `active`
   * class is set directly and the sliding indicator is left parked.
   */
  function setActive(id, on) {
    const el = segmentEl(id);
    if (el) el.classList.toggle('active', on);
  }

  // TOC and Settings share the same centred spot in the viewer, so only one
  // may be open at a time — opening one closes the other first. Comments is
  // exempt: its sidebar lives beside the content, not on top of it, so it can
  // stay open while either of the other two is toggled.
  function handleClick(id) {
    if (id === 'comment' && window.MdpComments) return window.MdpComments.toggle();

    if (id === 'toc' && window.MdpToc) {
      if (!window.MdpToc.isVisible() && window.MdpSettings) window.MdpSettings.close();
      return window.MdpToc.toggle();
    }
    if (id === 'settings' && window.MdpSettings) {
      if (!window.MdpSettings.isOpen() && window.MdpToc) window.MdpToc.hide();
      return window.MdpSettings.toggle(segmentEl('settings') || bar);
    }
  }

  if (window.MdpComments) window.MdpComments.onChange((on) => setActive('comment', on));
  if (window.MdpToc) window.MdpToc.onChange((on) => setActive('toc', on));
  if (window.MdpSettings) window.MdpSettings.onChange((on) => setActive('settings', on));
})();

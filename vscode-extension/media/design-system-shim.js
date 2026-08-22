/* Minimal stand-in for renderer/js/components/design-system.js — just
   enough surface (registerIcons/getIcon/createElement) for
   design-system-icons.js and the vendored carousel/summary code to run,
   without pulling in the full component/tooltip framework. */
(function () {
  const ICONS = {};

  window.DesignSystem = {
    registerIcons(map) {
      Object.assign(ICONS, map);
    },
    getIcon(name) {
      return ICONS[name] || '';
    },
    createElement(tag, className, options = {}) {
      const el = document.createElement(tag);
      if (className) el.className = className;
      if (options.html !== undefined) el.innerHTML = options.html;
      if (options.text !== undefined) el.textContent = options.text;
      return el;
    }
  };
})();

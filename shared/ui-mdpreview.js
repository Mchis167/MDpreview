/* ============================================================
   ui-mdpreview.js — the ui adapter the shared kits run on.

   Maps the small set of UI primitives font-kit and theme-kit ask
   for onto MDpreview's design system, so their panels are built
   out of the exact same components as the app's own Settings
   popover — same popover card, same group cards, same setting
   rows, same segmented control, same switch.

   Porting a kit elsewhere means writing another file like this
   one; the kits themselves need no change.
   ============================================================ */

(function () {

function createUi(ds, settingRow, switchToggle) {
  return {
    createElement: (tag, className, attrs) => ds.createElement(tag, className, attrs || {}),

    getIcon: (name) => ds.getIcon(name),

    createSettingRow: (options) => settingRow.create(options),

    createSegmented: (options) => ds.createSegmentedControl(options),

    createDivider: () => ds.createElement('div', 'setting-divider'),

    /**
     * SwitchToggleModule sets itself up inside an element the caller owns,
     * rather than returning one, so the element is made here and handed back.
     * @returns {{el: HTMLElement}}
     */
    createSwitch: (options) => {
      const el = ds.createElement('div', 'switch-toggle');
      const toggle = switchToggle
        ? switchToggle.init({ element: el, isOn: !!options.isOn, onChange: options.onChange })
        : null;
      return { el, toggle };
    },

    // Giống hệt SettingsComponent._createGroup: một thẻ nhóm với tiêu đề
    // viết hoa màu accent, các mục bên trong tự chèn divider.
    createGroup: (title, children) => {
      const group = ds.createElement('div', 'ds-popover-group');
      if (title) {
        group.appendChild(ds.createElement('div', 'ds-popover-group-title', { text: title }));
      }
      children.filter(Boolean).forEach((child) => group.appendChild(child));
      return group;
    },

    createPopover: (options) => ds.createPopoverShield({
      hasBackdrop: false,
      alignment: 'bottom-left',
      ...options
    })
  };
}

const exportsObj = { createUi };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = exportsObj;
}
if (typeof window !== 'undefined') {
  window.MdpUi = exportsObj;
  // Tên cũ, giữ lại cho font-kit và các test đang gọi qua nó.
  window.FontKitUiMDpreview = exportsObj;
}

})();

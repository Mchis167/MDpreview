/* ============================================================
   font-kit/ui-mdpreview.js — the ui adapter picker.js runs on.

   Maps font-kit's small set of UI primitives onto MDpreview's
   design system, so the font panel is built out of the exact same
   components as the app's Settings popover — same popover card,
   same group cards, same setting rows, same segmented control.

   Porting font-kit elsewhere means writing another file like this
   one; picker.js itself needs no change.
   ============================================================ */

(function () {

function createUi(ds, settingRow) {
  return {
    createElement: (tag, className, attrs) => ds.createElement(tag, className, attrs || {}),

    getIcon: (name) => ds.getIcon(name),

    createSettingRow: (options) => settingRow.create(options),

    createSegmented: (options) => ds.createSegmentedControl(options),

    createDivider: () => ds.createElement('div', 'setting-divider'),

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
  window.FontKitUiMDpreview = exportsObj;
}

})();

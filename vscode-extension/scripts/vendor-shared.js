#!/usr/bin/env node
/**
 * vendor-shared.js
 * Copies shared/md-render + its transitive deps into vscode-extension/vendor/,
 * and the mermaid browser bundle into media/vendor/.
 *
 * Needed because a .vsix-installed extension unpacks in isolation — it can't
 * reach ../shared or ../renderer in the parent repo the way F5 dev-host mode
 * (which just runs straight from this checkout) can get away with.
 *
 * Run before `npm run package` or F5. Also runs automatically via
 * vscode:prepublish when `vsce package`/`vsce publish` is invoked.
 *
 * Usage: node scripts/vendor-shared.js
 *        npm run vendor
 */

'use strict';

const fs = require('fs');
const path = require('path');

const EXT_ROOT = path.resolve(__dirname, '..');
const REPO_ROOT = path.resolve(EXT_ROOT, '..');

const FILES = [
  ['shared/md-render/index.js', 'vendor/shared/md-render/index.js'],
  ['shared/md-render/md-render.css', 'vendor/shared/md-render/md-render.css'],
  ['renderer/css/design-system/tokens.css', 'vendor/shared/md-render/tokens.css'],
  ['renderer/css/design-system/organisms/markdown-blocks.css', 'vendor/shared/md-render/markdown-blocks.css'],
  ['renderer/css/design-system/organisms/markdown-content.css', 'vendor/shared/md-render/markdown-content.css'],
  ['renderer/css/design-system/organisms/markdown-interactions.css', 'vendor/shared/md-render/markdown-interactions.css'],
  ['renderer/css/design-system/molecules/mockup-frames.css', 'vendor/shared/md-render/mockup-frames.css'],
  ['renderer/css/design-system/molecules/carousel.css', 'vendor/shared/md-render/carousel.css'],
  ['renderer/css/design-system/atoms/checkbox.css', 'vendor/shared/md-render/checkbox.css'],
  ['renderer/js/services/md-renderer-core.js', 'vendor/renderer/js/services/md-renderer-core.js'],
  ['renderer/js/services/mermaid-config.js', 'vendor/renderer/js/services/mermaid-config.js'],
  ['renderer/js/utils/code-blocks.js', 'vendor/renderer/js/utils/code-blocks.js'],
  ['renderer/js/utils/mockup-images.js', 'vendor/renderer/js/utils/mockup-images.js'],
  ['renderer/js/utils/carousel.js', 'vendor/renderer/js/utils/carousel.js'],
  ['renderer/js/components/design-system-icons.js', 'vendor/renderer/js/components/design-system-icons.js'],
  ['shared/comments-core.js', 'vendor/shared/comments-core.js'],
  ['shared/comment-anchor.js', 'vendor/shared/comment-anchor.js'],

  // ── Font panel ──
  // font-kit itself: catalog/installer run in the extension host,
  // picker/ui/css run in the webview.
  ['shared/font-kit/css2.js', 'vendor/shared/font-kit/css2.js'],
  ['shared/font-kit/catalog.js', 'vendor/shared/font-kit/catalog.js'],
  ['shared/font-kit/installer.js', 'vendor/shared/font-kit/installer.js'],
  ['shared/font-kit/picker.js', 'vendor/shared/font-kit/picker.js'],
  ['shared/font-kit/ui-mdpreview.js', 'vendor/shared/font-kit/ui-mdpreview.js'],
  ['shared/font-kit/picker.css', 'vendor/shared/font-kit/picker.css'],

  // The design system components the panel is built from, so it looks
  // exactly like the app's own Settings popover rather than an imitation.
  ['renderer/js/components/design-system.js', 'vendor/renderer/js/components/design-system.js'],
  ['renderer/js/components/atoms/modal.js', 'vendor/renderer/js/components/atoms/modal.js'],
  ['renderer/js/components/atoms/select.js', 'vendor/renderer/js/components/atoms/select.js'],
  ['renderer/js/components/atoms/segmented-control.js', 'vendor/renderer/js/components/atoms/segmented-control.js'],
  ['renderer/js/components/molecules/setting-row.js', 'vendor/renderer/js/components/molecules/setting-row.js'],
  ['renderer/css/design-system/molecules/popover-shield.css', 'vendor/renderer/css/popover-shield.css'],
  ['renderer/css/design-system/molecules/setting-row.css', 'vendor/renderer/css/setting-row.css'],
  ['renderer/css/design-system/molecules/segmented-control.css', 'vendor/renderer/css/segmented-control.css'],
  ['renderer/css/design-system/atoms/tooltip.css', 'vendor/renderer/css/tooltip.css'],
  ['renderer/css/design-system/organisms/settings-panel.css', 'vendor/renderer/css/settings-panel.css'],

  // ── Comment UI ──
  // Reuse the app's own comment components verbatim instead of a
  // hand-rolled lookalike: the floating "+" trigger, the popup form, and
  // the right sidebar list are all real design-system organisms/atoms.
  ['renderer/js/components/atoms/icon-action-button.js', 'vendor/renderer/js/components/atoms/icon-action-button.js'],
  ['renderer/js/components/organisms/comment-form-component.js', 'vendor/renderer/js/components/organisms/comment-form-component.js'],
  ['renderer/js/components/organisms/right-sidebar.js', 'vendor/renderer/js/components/organisms/right-sidebar.js'],
  ['renderer/css/design-system/atoms/button.css', 'vendor/renderer/css/button.css'],
  ['renderer/css/design-system/atoms/icon-action-button.css', 'vendor/renderer/css/icon-action-button.css'],
  ['renderer/css/design-system/organisms/comment-form.css', 'vendor/renderer/css/comment-form.css'],
  ['renderer/css/design-system/organisms/right-sidebar.css', 'vendor/renderer/css/right-sidebar.css'],
  ['renderer/css/design-system/molecules/sidebar-base.css', 'vendor/renderer/css/sidebar-base.css'],
  // ds-header-action (the sidebar header's action buttons) lives here.
  ['renderer/css/design-system/organisms/tab-bar.css', 'vendor/renderer/css/tab-bar.css'],

  // ── Table of Contents ──
  // The app's own TOC, algorithm and styling untouched: heading scan, tree
  // build, scroll-sync offset, expand/collapse state and the panel chrome.
  ['renderer/js/services/toc-service.js', 'vendor/renderer/js/services/toc-service.js'],
  ['renderer/js/components/organisms/toc-component.js', 'vendor/renderer/js/components/organisms/toc-component.js'],
  ['renderer/js/services/ui-utils.js', 'vendor/renderer/js/services/ui-utils.js'],
  ['renderer/css/shared/toc-core.css', 'vendor/renderer/css/toc-core.css'],
  // The vendored css/ tree is flat, so toc-panel's relative @import of
  // toc-core has to be flattened along with it.
  [
    'renderer/css/design-system/organisms/toc-panel.css',
    'vendor/renderer/css/toc-panel.css',
    (css) => css.replace('@import "../../shared/toc-core.css";', '@import "toc-core.css";')
  ],

  // ── Pan/zoom overlay ──
  // Charts and mockups are unreadable at page scale; this is the app's own
  // full-screen zoom, injected with no extra actions (no "Copy SVG" here).
  ['renderer/js/utils/zoom.js', 'vendor/renderer/js/utils/zoom.js'],
  ['renderer/css/design-system/organisms/zoom-modal.css', 'vendor/renderer/css/zoom-modal.css'],

  // ── Floating action bar ──
  // Same bar the app puts at the bottom of the viewer to switch modes.
  ['renderer/css/design-system/organisms/change-action-view-bar.css', 'vendor/renderer/css/change-action-view-bar.css']
];

const MERMAID_BUNDLE = [
  'node_modules/mermaid/dist/mermaid.min.js',
  'media/vendor/mermaid.min.js'
];

function copy(srcAbs, destAbs, transform) {
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  if (transform) {
    fs.writeFileSync(destAbs, transform(fs.readFileSync(srcAbs, 'utf8')));
  } else {
    fs.copyFileSync(srcAbs, destAbs);
  }
  console.log(`✓ ${path.relative(EXT_ROOT, destAbs)}`);
}

function run() {
  console.log('📦 Vendoring shared/md-render into vscode-extension/...\n');

  for (const [src, dest, transform] of FILES) {
    copy(path.join(REPO_ROOT, src), path.join(EXT_ROOT, dest), transform);
  }

  const [mermaidSrc, mermaidDest] = MERMAID_BUNDLE;
  const mermaidSrcAbs = path.join(EXT_ROOT, mermaidSrc);
  if (!fs.existsSync(mermaidSrcAbs)) {
    console.error(`✗ Missing ${mermaidSrc} — run "npm install" in vscode-extension/ first.`);
    process.exit(1);
  }
  copy(mermaidSrcAbs, path.join(EXT_ROOT, mermaidDest));

  console.log('\n✓ Vendoring complete.');
}

run();

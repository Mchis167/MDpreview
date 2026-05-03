#!/usr/bin/env node
/**
 * build-publish-assets.js
 * Generates cf-publish-worker/public/publish.css and syncs JS assets.
 * Sources:
 *   1. renderer/css/design-system/tokens.css  — full 3-tier token system
 *   2. renderer/css/design-system/organisms/zoom-modal.css — zoom modal styles
 *   3. renderer/js/utils/zoom.js — zoom logic
 *   4. cf-publish-worker/src/publish-styles.css — publish-page specific styles
 *
 * Usage: node scripts/build-publish-assets.js
 *        npm run build:publish-assets
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TOKENS_SRC      = path.join(ROOT, 'renderer/css/design-system/tokens.css');
const TAB_BAR_SRC     = path.join(ROOT, 'renderer/css/design-system/organisms/tab-bar.css');
const ZOOM_MODAL_SRC   = path.join(ROOT, 'renderer/css/design-system/organisms/zoom-modal.css');
const SHARED_SRC      = path.join(ROOT, 'renderer/css/shared/markdown-render.css');
const STYLES_SRC      = path.join(ROOT, 'cf-publish-worker/src/publish-styles.css');
const OUTPUT          = path.join(ROOT, 'cf-publish-worker/public/publish.css');

// JS Assets to sync
const JS_ASSETS = [
  { src: 'renderer/js/utils/code-blocks.js', dest: 'cf-publish-worker/public/code-blocks.js' },
  { src: 'renderer/js/utils/zoom.js',        dest: 'cf-publish-worker/public/zoom.js' }
];

// Aliases that let publish-styles.css keep its current token names
// without requiring a rename in the source file.
const PUBLISH_COMPAT_ALIASES = `
/* ── Publish-page aliases ─────────────────────────────────
   These bridge legacy publish.css token names to the
   canonical tokens defined above.
   ────────────────────────────────────────────────────── */
:root {
  --ds-bg-main:           var(--ds-bg-base);
  --ds-transition-smooth: var(--ds-transition-main);
}
`;

function build() {
  // 1. Build CSS
  console.log('🎨 Building publish.css...');
  
  const sources = [
    ['tokens', TOKENS_SRC],
    ['tab-bar', TAB_BAR_SRC],
    ['zoom-modal', ZOOM_MODAL_SRC],
    ['shared', SHARED_SRC],
    ['styles', STYLES_SRC]
  ];

  for (const [label, file] of sources) {
    if (!fs.existsSync(file)) {
      console.error(`✗ Missing ${label} source: ${file}`);
      process.exit(1);
    }
  }

  const tokens = fs.readFileSync(TOKENS_SRC, 'utf8');
  const tabBar = fs.readFileSync(TAB_BAR_SRC, 'utf8');
  const zoomModal = fs.readFileSync(ZOOM_MODAL_SRC, 'utf8');
  const shared = fs.readFileSync(SHARED_SRC, 'utf8');
  const styles = fs.readFileSync(STYLES_SRC, 'utf8');

  const banner = [
    '/* AUTO-GENERATED — DO NOT EDIT MANUALLY',
    ' * Sources:',
    ' *   renderer/css/design-system/tokens.css',
    ' *   renderer/css/design-system/organisms/tab-bar.css',
    ' *   renderer/css/design-system/organisms/zoom-modal.css',
    ' *   renderer/css/shared/markdown-render.css',
    ' *   cf-publish-worker/src/publish-styles.css',
    ' * Regenerate: npm run build:publish-assets',
    ` * Generated:  ${new Date().toISOString()}`,
    ' */',
    '',
  ].join('\n');

  const output = [banner, tokens, PUBLISH_COMPAT_ALIASES, tabBar, zoomModal, shared, styles].join('\n');

  fs.writeFileSync(OUTPUT, output, 'utf8');

  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`✓ publish.css built — ${kb} kB`);

  // 2. Sync JS Assets
  console.log('\n📦 Syncing JS assets...');
  for (const asset of JS_ASSETS) {
    const srcPath = path.join(ROOT, asset.src);
    const destPath = path.join(ROOT, asset.dest);

    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, destPath);
      console.log(`✓ Synced: ${asset.src} → ${asset.dest}`);
    } else {
      console.warn(`⚠️ Warning: Source JS asset not found: ${asset.src}`);
    }
  }
}

build();

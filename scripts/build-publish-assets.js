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

const TOKENS_SRC        = path.join(ROOT, 'renderer/css/design-system/tokens.css');
const ICON_BTN_SRC      = path.join(ROOT, 'renderer/css/design-system/atoms/icon-action-button.css');
const TAB_BAR_SRC       = path.join(ROOT, 'renderer/css/design-system/organisms/tab-bar.css');
const ZOOM_MODAL_SRC    = path.join(ROOT, 'renderer/css/design-system/organisms/zoom-modal.css');
const TOC_CORE_SRC      = path.join(ROOT, 'renderer/css/shared/toc-core.css');
const TOC_PUBLISH_SRC   = path.join(ROOT, 'cf-publish-worker/src/toc-publish.css');
const SHARED_SRC        = path.join(ROOT, 'shared/md-render/md-render.css');
const STYLES_SRC        = path.join(ROOT, 'cf-publish-worker/src/publish-styles.css');
const MOCKUP_FRAMES_SRC = path.join(ROOT, 'renderer/css/design-system/molecules/mockup-frames.css');
const CAROUSEL_SRC      = path.join(ROOT, 'renderer/css/design-system/molecules/carousel.css');
const OUTPUT            = path.join(ROOT, 'cf-publish-worker/public/publish.css');

// JS Assets to sync
const JS_ASSETS = [
  { src: 'renderer/js/utils/code-blocks.js',          dest: 'cf-publish-worker/public/code-blocks.js' },
  { src: 'renderer/js/utils/zoom.js',                  dest: 'cf-publish-worker/public/zoom.js' },
  { src: 'cf-publish-worker/src/toc-publish.js',       dest: 'cf-publish-worker/public/toc-publish.js' },
  { src: 'renderer/js/components/design-system.js',       dest: 'cf-publish-worker/public/design-system.js' },
  { src: 'renderer/js/components/design-system-icons.js', dest: 'cf-publish-worker/public/design-system-icons.js' },
  { src: 'renderer/js/utils/mockup-images.js',         dest: 'cf-publish-worker/public/mockup-images.js' },
  { src: 'renderer/js/utils/carousel.js',              dest: 'cf-publish-worker/public/carousel.js' },
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
    ['icon-btn', ICON_BTN_SRC],
    ['tab-bar', TAB_BAR_SRC],
    ['zoom-modal', ZOOM_MODAL_SRC],
    ['toc-core', TOC_CORE_SRC],
    ['toc-publish', TOC_PUBLISH_SRC],
    ['shared', SHARED_SRC],
    ['styles', STYLES_SRC],
    ['mockup-frames', MOCKUP_FRAMES_SRC],
    ['carousel', CAROUSEL_SRC],
  ];

  for (const [label, file] of sources) {
    if (!fs.existsSync(file)) {
      console.error(`✗ Missing ${label} source: ${file}`);
      process.exit(1);
    }
  }

  const tokens = fs.readFileSync(TOKENS_SRC, 'utf8');
  const iconBtn = fs.readFileSync(ICON_BTN_SRC, 'utf8');
  const tabBar = fs.readFileSync(TAB_BAR_SRC, 'utf8');
  const zoomModal = fs.readFileSync(ZOOM_MODAL_SRC, 'utf8');
  const tocCore = fs.readFileSync(TOC_CORE_SRC, 'utf8');
  const tocPublish = fs.readFileSync(TOC_PUBLISH_SRC, 'utf8');
  const shared = fs.readFileSync(SHARED_SRC, 'utf8');
  const styles = fs.readFileSync(STYLES_SRC, 'utf8');
  const mockupFrames = fs.readFileSync(MOCKUP_FRAMES_SRC, 'utf8');
  const carousel = fs.readFileSync(CAROUSEL_SRC, 'utf8');

  const banner = [
    '/* AUTO-GENERATED — DO NOT EDIT MANUALLY',
    ' * Sources:',
    ' *   renderer/css/design-system/tokens.css',
    ' *   renderer/css/design-system/atoms/icon-action-button.css',
    ' *   renderer/css/design-system/organisms/tab-bar.css',
    ' *   renderer/css/design-system/organisms/zoom-modal.css',
    ' *   renderer/css/shared/toc-core.css',
    ' *   cf-publish-worker/src/toc-publish.css',
    ' *   shared/md-render/md-render.css',
    ' *   cf-publish-worker/src/publish-styles.css',
    ' *   renderer/css/design-system/molecules/mockup-frames.css',
    ' *   renderer/css/design-system/molecules/carousel.css',
    ' * Regenerate: npm run build:publish-assets',
    ` * Generated:  ${new Date().toISOString()}`,
    ' */',
    '',
  ].join('\n');

  const output = [banner, tokens, PUBLISH_COMPAT_ALIASES, iconBtn, tabBar, zoomModal, shared, styles, mockupFrames, carousel, tocCore, tocPublish].join('\n');

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

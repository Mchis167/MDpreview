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
  ['renderer/js/services/md-renderer-core.js', 'vendor/renderer/js/services/md-renderer-core.js'],
  ['renderer/js/services/mermaid-config.js', 'vendor/renderer/js/services/mermaid-config.js'],
  ['renderer/js/utils/code-blocks.js', 'vendor/renderer/js/utils/code-blocks.js']
];

const MERMAID_BUNDLE = [
  'node_modules/mermaid/dist/mermaid.min.js',
  'media/vendor/mermaid.min.js'
];

function copy(srcAbs, destAbs) {
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.copyFileSync(srcAbs, destAbs);
  console.log(`✓ ${path.relative(EXT_ROOT, destAbs)}`);
}

function run() {
  console.log('📦 Vendoring shared/md-render into vscode-extension/...\n');

  for (const [src, dest] of FILES) {
    copy(path.join(REPO_ROOT, src), path.join(EXT_ROOT, dest));
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

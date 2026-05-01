#!/usr/bin/env node
/**
 * build-publish-css.js
 * Generates cf-publish-worker/public/publish.css from:
 *   1. renderer/css/design-system/tokens.css  — full 3-tier token system
 *   2. cf-publish-worker/src/publish-styles.css — publish-page styles
 *
 * Usage: node scripts/build-publish-css.js
 *        npm run build:publish-css
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const TOKENS_SRC  = path.join(ROOT, 'renderer/css/design-system/tokens.css');
const STYLES_SRC  = path.join(ROOT, 'cf-publish-worker/src/publish-styles.css');
const OUTPUT      = path.join(ROOT, 'cf-publish-worker/public/publish.css');

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
  for (const [label, file] of [['tokens', TOKENS_SRC], ['styles', STYLES_SRC]]) {
    if (!fs.existsSync(file)) {
      console.error(`✗ Missing ${label} source: ${file}`);
      process.exit(1);
    }
  }

  const tokens = fs.readFileSync(TOKENS_SRC, 'utf8');
  const styles = fs.readFileSync(STYLES_SRC, 'utf8');

  const banner = [
    '/* AUTO-GENERATED — DO NOT EDIT MANUALLY',
    ' * Sources:',
    ' *   renderer/css/design-system/tokens.css',
    ' *   cf-publish-worker/src/publish-styles.css',
    ' * Regenerate: npm run build:publish-css',
    ` * Generated:  ${new Date().toISOString()}`,
    ' */',
    '',
  ].join('\n');

  const output = [banner, tokens, PUBLISH_COMPAT_ALIASES, styles].join('\n');

  fs.writeFileSync(OUTPUT, output, 'utf8');

  const kb = (Buffer.byteLength(output, 'utf8') / 1024).toFixed(1);
  console.log(`✓ publish.css built — ${kb} kB`);
  console.log(`  tokens  → ${TOKENS_SRC.replace(ROOT + '/', '')}`);
  console.log(`  styles  → ${STYLES_SRC.replace(ROOT + '/', '')}`);
  console.log(`  output  → ${OUTPUT.replace(ROOT + '/', '')}`);
}

build();

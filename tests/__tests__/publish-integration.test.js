import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');

describe('Publishing Assets & Integration Integrity', () => {

  it('TC-Pub-CSS-01: zoom-modal.css should exist in the design system', () => {
    const zoomCssPath = path.join(ROOT, 'renderer/css/design-system/organisms/zoom-modal.css');
    expect(fs.existsSync(zoomCssPath)).toBe(true);
    
    const content = fs.readFileSync(zoomCssPath, 'utf8');
    expect(content).toContain('#zoom-modal');
    expect(content).toContain('#zoom-container');
    expect(content).toContain('.zoom-ctrl-btn');
  });

  it('TC-Pub-CSS-02: workspace-panel.css should be cleaned of zoom styles', () => {
    const wsPanelPath = path.join(ROOT, 'renderer/css/design-system/organisms/workspace-panel.css');
    const content = fs.readFileSync(wsPanelPath, 'utf8');
    expect(content).not.toContain('/* ── Zoom Modal ── */');
    expect(content).not.toContain('#zoom-modal {');
  });

  it('TC-Pub-CSS-03: design-system.css should import zoom-modal.css', () => {
    const dsPath = path.join(ROOT, 'renderer/css/design-system.css');
    const content = fs.readFileSync(dsPath, 'utf8');
    expect(content).toContain("@import 'design-system/organisms/zoom-modal.css';");
  });

  it('TC-Pub-Build-01: build-publish-assets.js should have correct asset sync list', () => {
    const buildScriptPath = path.join(ROOT, 'scripts/build-publish-assets.js');
    expect(fs.existsSync(buildScriptPath)).toBe(true);
    
    const content = fs.readFileSync(buildScriptPath, 'utf8');
    expect(content).toContain('renderer/js/utils/code-blocks.js');
    expect(content).toContain('renderer/js/utils/zoom.js');
    expect(content).toContain('cf-publish-worker/public/zoom.js');
  });

  it('TC-Pub-Shell-01: shell.js should include zoom.js and code-blocks.js', () => {
    const shellPath = path.join(ROOT, 'cf-publish-worker/src/shell.js');
    const content = fs.readFileSync(shellPath, 'utf8');
    
    expect(content).toContain('<script src="/code-blocks.js"></script>');
    expect(content).toContain('<script src="/zoom.js"></script>');
  });

  it('TC-Pub-Shell-02: shell.js should initialize zoom and wire up mermaid clicks', () => {
    const shellPath = path.join(ROOT, 'cf-publish-worker/src/shell.js');
    const content = fs.readFileSync(shellPath, 'utf8');
    
    expect(content).toContain('if (window.initZoom)');
    expect(content).toContain('window.initZoom();');
    expect(content).toContain('div.onclick = () => window.openZoom(div);');
    expect(content).toContain("div.style.cursor = 'zoom-in';");
  });

  it('TC-Pub-Worker-01: public assets should exist after build', () => {
    const publicPath = path.join(ROOT, 'cf-publish-worker/public');
    expect(fs.existsSync(path.join(publicPath, 'publish.css'))).toBe(true);
    expect(fs.existsSync(path.join(publicPath, 'code-blocks.js'))).toBe(true);
    expect(fs.existsSync(path.join(publicPath, 'zoom.js'))).toBe(true);
  });

});

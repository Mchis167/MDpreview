/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Mock Dependencies ──────────────────────────────────────────
global.window = global;

window.DesignSystem = {
  createElement: (tag, className, options = {}) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (options.id) el.id = options.id;
    if (options.html) el.innerHTML = options.html;
    return el;
  },
  getIcon: (name) => `<svg data-icon="${name}"></svg>`
};

window.WikiService = {
  classifyLink: vi.fn()
};

window.electronAPI = {
  openExternal: vi.fn().mockResolvedValue(true)
};

window.loadFile = vi.fn();

// Mock modules to avoid errors
window.ScrollModule = { setContainer: vi.fn(), save: vi.fn(), restore: vi.fn() };
window.TOCComponent = { reset: vi.fn(), update: vi.fn(), hide: vi.fn(), isVisible: vi.fn() };
window.EditToolbarComponent = { getInstance: vi.fn(() => ({ hide: vi.fn() })) };

// ── Load the Component Code ───────────────────────────────────
const componentPath = path.resolve(__dirname, '../renderer/js/components/organisms/markdown-viewer-component.js');
const componentCode = fs.readFileSync(componentPath, 'utf8');
const script = new Function('window', componentCode + '\n window.MarkdownPreview = MarkdownPreview;');
script(window);

describe('Link Interception Integration', () => {
  let mount;
  let preview;

  beforeEach(() => {
    document.body.innerHTML = '<div id="viewport"></div>';
    mount = document.getElementById('viewport');
    vi.clearAllMocks();
  });

  const setupPreview = async (html) => {
    preview = new window.MarkdownPreview({
      mount,
      html,
      file: 'folder/current.md'
    });
    // Wait for the async IIFE in render()
    await new Promise(resolve => setTimeout(resolve, 20));
  };

  it('TC-Link-01: should intercept and open external links via electronAPI', async () => {
    await setupPreview('<a href="https://google.com" id="test-link">External Link</a>');
    
    window.WikiService.classifyLink.mockReturnValue({
      type: 'external',
      url: 'https://google.com'
    });

    const link = document.getElementById('test-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    link.dispatchEvent(event);

    expect(window.electronAPI.openExternal).toHaveBeenCalledWith('https://google.com');
    expect(event.defaultPrevented).toBe(true);
  });

  it('TC-Link-02: should intercept and navigate internal wiki links', async () => {
    await setupPreview('<a href="./other.md" id="test-link">Internal Link</a>');
    
    window.WikiService.classifyLink.mockReturnValue({
      type: 'internal',
      resolvedPath: 'folder/other.md',
      id: 'other-doc'
    });

    const link = document.getElementById('test-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    link.dispatchEvent(event);

    expect(window.loadFile).toHaveBeenCalledWith('folder/other.md');
    expect(event.defaultPrevented).toBe(true);
  });

  it('TC-Link-03: should let anchor links work naturally', async () => {
    await setupPreview('<a href="#section-1" id="test-link">Anchor Link</a>');
    
    window.WikiService.classifyLink.mockReturnValue({
      type: 'anchor',
      anchor: '#section-1'
    });

    const link = document.getElementById('test-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    link.dispatchEvent(event);

    // Default should NOT be prevented for anchors to let browser scroll
    expect(event.defaultPrevented).toBe(false);
    expect(window.loadFile).not.toHaveBeenCalled();
    expect(window.electronAPI.openExternal).not.toHaveBeenCalled();
  });

  it('TC-Link-04: should fallback to loadFile for unknown .md links', async () => {
    await setupPreview('<a href="unknown-file.md" id="test-link">Unknown MD</a>');
    
    window.WikiService.classifyLink.mockReturnValue({
      type: 'unknown'
    });

    const link = document.getElementById('test-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.loadFile).toHaveBeenCalledWith('unknown-file.md');
  });

  it('TC-Link-05: should ignore clicks on non-anchor elements', async () => {
    await setupPreview('<span id="not-a-link">Just Text</span>');
    
    const span = document.getElementById('not-a-link');
    span.click();

    expect(window.WikiService.classifyLink).not.toHaveBeenCalled();
  });

  it('TC-Link-06: should work after content update', async () => {
    await setupPreview('<p>Old Content</p>');
    
    // Update content
    preview.update({ html: '<a href="https://new.com" id="new-link">New Link</a>' });
    // update() is synchronous in setting innerHTML but _bindLinkEvents is immediate there
    // However, let's wait just in case
    await new Promise(resolve => setTimeout(resolve, 0));
    
    window.WikiService.classifyLink.mockReturnValue({
      type: 'external',
      url: 'https://new.com'
    });

    const link = document.getElementById('new-link');
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    
    link.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(window.electronAPI.openExternal).toHaveBeenCalledWith('https://new.com');
  });
});

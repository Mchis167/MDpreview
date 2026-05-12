/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Mock Dependencies ──────────────────────────────────────────
global.window = global;

// Mock DesignSystem
window.DesignSystem = {
  createElement: (tag, className, options = {}) => {
    const el = document.createElement(tag);
    if (className) {
      if (className.includes(' ')) {
        className.split(' ').forEach(c => el.classList.add(c));
      } else {
        el.className = className;
      }
    }
    if (options.id) el.id = options.id;
    if (options.text) el.innerText = options.text;
    if (options.html) el.innerHTML = options.html;
    return el;
  },
  createButton: vi.fn(({ leadingIcon, onClick, title }) => {
    const btn = document.createElement('button');
    btn.setAttribute('title', title || '');
    btn.innerHTML = `<span class="icon-${leadingIcon}"></span>`;
    btn.onclick = onClick;
    return btn;
  }),
  getIcon: (name) => `<svg data-icon="${name}"></svg>`
};

// Mock MarkdownPreview (we just need to check if it's instantiated)
window.MarkdownPreview = vi.fn().mockImplementation(function({ mount, html }) {
  this.mount = mount;
  this.html = html;
  mount.innerHTML = `<div class="rendered-markdown">${html}</div>`;
  this.destroy = vi.fn();
});

window.loadFile = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// ── Load the Component Code ───────────────────────────────────
const componentPath = path.resolve(__dirname, '../renderer/js/components/organisms/wiki-drawer-component.js');
const componentCode = fs.readFileSync(componentPath, 'utf8');
const script = new Function('window', componentCode);
script(window);

describe('WikiDrawerComponent', () => {
  let mount;

  beforeEach(() => {
    document.body.innerHTML = '<div id="wiki-drawer-mount"></div>';
    mount = document.getElementById('wiki-drawer-mount');
    vi.clearAllMocks();
    
    // Initialize component
    window.WikiDrawer.init();
  });

  afterEach(() => {
    window.WikiDrawer.close();
  });

  it('TC-Drawer-01: should initialize and render skeleton', () => {
    const drawer = mount.querySelector('.ds-wiki-drawer');
    expect(drawer).not.toBeNull();
    expect(mount.querySelector('.ds-wiki-drawer-panel')).not.toBeNull();
    expect(mount.querySelector('.ds-wiki-drawer-overlay')).not.toBeNull();
  });

  it('TC-Drawer-02: should open and load content correctly', async () => {
    const mockHtml = '<p>Wiki Content</p>';
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: mockHtml })
    });

    const openPromise = window.WikiDrawer.open('folder/wiki-file.md');
    
    // Should show loading first
    const title = mount.querySelector('.ds-wiki-drawer-title');
    expect(title.innerText).toBe('Loading...');

    await openPromise;

    // Should update title and render markdown
    expect(title.innerText).toBe('wiki-file');
    expect(window.MarkdownPreview).toHaveBeenCalled();
    expect(mount.querySelector('.rendered-markdown').innerHTML).toBe(mockHtml);
    expect(mount.querySelector('.ds-wiki-drawer').classList.contains('is-open')).toBe(true);
  });

  it('TC-Drawer-03: should close when clicking close button', async () => {
    // Open first
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: 'content' })
    });
    await window.WikiDrawer.open('test.md');

    const closeBtn = mount.querySelectorAll('.ds-wiki-drawer-actions button')[1];
    closeBtn.click();

    expect(mount.querySelector('.ds-wiki-drawer').classList.contains('is-open')).toBe(false);
    expect(window.WikiDrawer.isOpen()).toBe(false);
  });

  it('TC-Drawer-04: should close when pressing Escape key', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: 'content' })
    });
    await window.WikiDrawer.open('test.md');

    const event = new KeyboardEvent('keydown', { key: 'Escape' });
    window.dispatchEvent(event);

    expect(window.WikiDrawer.isOpen()).toBe(false);
  });

  it('TC-Drawer-05: should close when clicking overlay', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: 'content' })
    });
    await window.WikiDrawer.open('test.md');

    const overlay = mount.querySelector('.ds-wiki-drawer-overlay');
    overlay.click();

    expect(window.WikiDrawer.isOpen()).toBe(false);
  });

  it('TC-Drawer-06: should navigate to main view when clicking Open in Tab', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: 'content' })
    });
    await window.WikiDrawer.open('folder/target.md');

    const openBtn = mount.querySelectorAll('.ds-wiki-drawer-actions button')[0];
    openBtn.click();

    expect(window.loadFile).toHaveBeenCalledWith('folder/target.md');
    expect(window.WikiDrawer.isOpen()).toBe(false);
  });

  it('TC-Drawer-07: should handle internal links inside drawer by refreshing drawer', async () => {
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({ html: 'initial content' })
    });
    await window.WikiDrawer.open('first.md');

    // Get the onInternalLink callback from the MarkdownPreview mock call
    const markdownPreviewCall = vi.mocked(window.MarkdownPreview).mock.calls[0][0];
    const onInternalLink = markdownPreviewCall.options.onInternalLink;

    expect(onInternalLink).toBeDefined();

    // Trigger internal link navigation
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ html: 'new content' })
    });
    
    await onInternalLink('second.md');

    expect(mount.querySelector('.ds-wiki-drawer-title').innerText).toBe('second');
    expect(window.WikiDrawer.isOpen()).toBe(true);
  });

  it('TC-Drawer-08: should show error state when fetch fails', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false
    });

    await window.WikiDrawer.open('fail.md');

    expect(mount.querySelector('.ds-wiki-drawer-title').innerText).toBe('Error');
    expect(mount.querySelector('.ds-error-state')).not.toBeNull();
  });
});

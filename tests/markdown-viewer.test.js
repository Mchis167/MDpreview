/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Mock Dependencies ──────────────────────────────────────────
global.DesignSystem = {
  createElement: (tag, className, options = {}) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    Object.keys(options).forEach(key => {
      if (key === 'id') el.id = options[key];
      else if (key === 'placeholder') el.placeholder = options[key];
      else if (key === 'html') el.innerHTML = options[key];
      else el.setAttribute(key, options[key]);
    });
    return el;
  },
  createButton: ({ label, variant, onClick }) => {
    const btn = document.createElement('button');
    btn.textContent = label;
    btn.className = `ds-button-${variant}`;
    btn.onclick = onClick;
    return btn;
  },
  getIcon: (name) => `<svg data-icon="${name}"></svg>`
};

global.AppState = {
  currentMode: 'read',
  currentFile: null,
  lastSyncContext: null
};

global.EditorModule = {
  bindToElement: vi.fn(),
  unbind: vi.fn(),
  applyAction: vi.fn(),
  save: vi.fn().mockResolvedValue(true)
};

global.MarkdownLogicService = {
  syncCursor: vi.fn()
};

global.processMermaid = vi.fn();
global.CodeBlockModule = {
  process: vi.fn()
};

global.ScrollModule = {
  setContainer: vi.fn(),
  save: vi.fn(),
  restore: vi.fn()
};

// ── Load the Component Code ───────────────────────────────────
const componentPath = path.resolve(__dirname, '../renderer/js/components/organisms/markdown-viewer-component.js');
const componentCode = fs.readFileSync(componentPath, 'utf8');

// Inject into global scope
const script = new Function('global', componentCode + '\n global.MarkdownViewerComponent = MarkdownViewerComponent;');
script(global);

describe('MarkdownViewerComponent - Lifecycle & Rendering', () => {
  let viewer;
  let mount;

  beforeEach(() => {
    document.body.innerHTML = '<div id="md-viewer-mount"></div>';
    mount = document.getElementById('md-viewer-mount');
    vi.clearAllMocks();
    viewer = new global.MarkdownViewerComponent({ mount });
  });

  it('TC-Viewer-01: should render EmptyState by default', () => {
    expect(document.getElementById('empty-state')).not.toBeNull();
    expect(mount.innerHTML).toContain('MDpreview');
  });

  it('TC-Viewer-02: should switch to Read mode and render HTML', () => {
    viewer.setState({
      mode: 'read',
      file: 'test.md',
      html: '<h1>Hello Test</h1>'
    });

    const content = document.getElementById('md-content');
    expect(content).not.toBeNull();
    expect(content.innerHTML).toContain('Hello Test');
  });

  it('TC-Viewer-03: should switch to Edit mode and bind EditorModule', () => {
    viewer.setState({
      mode: 'edit',
      file: 'test.md',
      content: '# Initial Content'
    });

    const textarea = document.getElementById('edit-textarea');
    expect(textarea).not.toBeNull();
    expect(textarea.value).toBe('# Initial Content');
    
    // Check if EditorModule.bindToElement was called
    expect(global.EditorModule.bindToElement).toHaveBeenCalledWith(textarea);
  });

  it('TC-Viewer-04: should switch from Edit back to Read', () => {
    // 1. Enter Edit
    viewer.setState({ mode: 'edit', file: 'test.md' });
    expect(document.getElementById('edit-viewer')).not.toBeNull();

    // 2. Switch to Read
    viewer.setState({ mode: 'read', file: 'test.md', html: '<p>Updated</p>' });
    expect(document.getElementById('edit-viewer')).toBeNull();
    expect(document.getElementById('md-content')).not.toBeNull();
    expect(document.getElementById('md-content').innerHTML).toContain('Updated');
  });

  it('TC-Viewer-05: should trigger Editor action from toolbar', () => {
    viewer.setState({ mode: 'edit', file: 'test.md' });
    
    const boldBtn = document.querySelector('[data-action="b"]');
    expect(boldBtn).not.toBeNull();
    
    boldBtn.click();
    expect(global.EditorModule.applyAction).toHaveBeenCalledWith('b');
  });

  it('TC-Viewer-06: should re-render when switching between files (Tab Switching)', () => {
    // 1. Initial File
    viewer.setState({ mode: 'read', file: 'file1.md', html: '<p>File 1</p>' });
    expect(mount.innerHTML).toContain('File 1');

    // 2. Switch Tab (Same Mode, Different File)
    viewer.setState({ mode: 'read', file: 'file2.md', html: '<p>File 2</p>' });
    expect(mount.innerHTML).toContain('File 2');
    expect(mount.innerHTML).not.toContain('File 1');
  });

  it('TC-Viewer-07: should handle Draft content updates correctly', async () => {
    viewer.setState({ mode: 'read', file: '__DRAFT_1', html: '<p>Draft v1</p>' });
    expect(mount.innerHTML).toContain('Draft v1');

    // Update same draft (isFileChange = false, isModeChange = false, but content/html changed)
    // The component should call update() instead of full render()
    const updateSpy = vi.spyOn(viewer.activeComponent, 'update');
    
    viewer.setState({ html: '<p>Draft v2</p>' });
    
    await vi.waitFor(() => {
      expect(updateSpy).toHaveBeenCalled();
      expect(mount.innerHTML).toContain('Draft v2');
    });
  });

  it('TC-Viewer-08: should trigger post-render processors (Mermaid, CodeBlocks)', async () => {
    viewer.setState({ 
      mode: 'read', 
      file: 'complex.md', 
      html: '<div class="mermaid">graph TD; A-->B;</div>' 
    });

    await vi.waitFor(() => {
      expect(global.processMermaid).toHaveBeenCalled();
      expect(global.CodeBlockModule.process).toHaveBeenCalled();
      expect(global.ScrollModule.setContainer).toHaveBeenCalledWith(mount, 'complex.md');
      expect(global.ScrollModule.restore).toHaveBeenCalledWith('complex.md');
    });
  });

  it('TC-Viewer-09: should handle rapid mode switching without overlapping views', () => {
    viewer.setState({ mode: 'read', file: 'test.md', html: 'Read View' });
    viewer.setState({ mode: 'edit', file: 'test.md', content: 'Edit View' });
    viewer.setState({ mode: 'read', file: 'test.md', html: 'Final Read View' });

    expect(mount.innerHTML).toContain('Final Read View');
    expect(document.getElementById('edit-viewer')).toBeNull();
    expect(document.getElementById('md-content')).not.toBeNull();
  });

  it('TC-Viewer-10: should verify the Singleton Bridge (window.MarkdownViewer)', () => {
    const bridge = global.MarkdownViewer;
    const inst1 = bridge.init({ mount });
    const inst2 = bridge.getInstance();
    
    expect(inst1).toBe(inst2);
    expect(inst1).toBeInstanceOf(global.MarkdownViewerComponent);
  });

  it('TC-Viewer-11: should audit all typography toolbar actions', () => {
    viewer.setState({ mode: 'edit', file: 'test.md' });
    
    const actions = ['h', 'b', 'i', 's', 'q', 'l', 'img', 'hr', 'ul', 'ol', 'tl', 'c', 'cb', 'tb'];
    actions.forEach(action => {
      const btn = document.querySelector(`[data-action="${action}"]`);
      expect(btn, `Button for action ${action} should exist`).not.toBeNull();
      btn.click();
      expect(global.EditorModule.applyAction).toHaveBeenCalledWith(action);
    });
  });

  it('TC-Viewer-12: should render MarkdownPreview for comment and collect modes', () => {
    // 1. Comment Mode
    viewer.setState({ mode: 'comment', file: 'test.md', html: '<p>Comment View</p>' });
    expect(document.getElementById('md-content')).not.toBeNull();
    expect(mount.innerHTML).toContain('Comment View');

    // 2. Collect Mode
    viewer.setState({ mode: 'collect', file: 'test.md', html: '<p>Collect View</p>' });
    expect(document.getElementById('md-content')).not.toBeNull();
    expect(mount.innerHTML).toContain('Collect View');
  });

  it('TC-Viewer-13: should save old scroll position before switching files', () => {
    // Start with file A
    viewer.setState({ mode: 'read', file: 'fileA.md', html: '<p>A</p>' });
    
    // Switch to file B
    viewer.setState({ file: 'fileB.md', html: '<p>B</p>' });
    
    // Should have saved fileA
    expect(global.ScrollModule.save).toHaveBeenCalledWith('fileA.md');
  });
});

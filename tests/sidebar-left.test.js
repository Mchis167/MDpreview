/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Mock AppState ─────────────────────────────────────────────
global.AppState = {
  settings: { sidebarWidth: 260 },
  savePersistentState: vi.fn()
};

// ── Setup Mocks ───────────────────────────────────────────────
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  key: vi.fn(),
  length: 0
};

// ── Load the Component Code ───────────────────────────────────
const componentPath = path.resolve(__dirname, '../renderer/js/components/organisms/sidebar-left.js');
const componentCode = fs.readFileSync(componentPath, 'utf8');

// Inject into global scope
const script = new Function('global', componentCode + '\n global.SidebarLeftComponent = SidebarLeftComponent;');
script(global);

describe('SidebarLeftComponent', () => {
  let sidebar;
  let mount;

  beforeEach(() => {
    document.body.innerHTML = '<div id="sidebar-left-mount"></div>';
    mount = document.getElementById('sidebar-left-mount');
    vi.clearAllMocks();
    // Create fresh instance for each test to avoid singleton issues
    sidebar = new global.SidebarLeftComponent({ mount });
  });

  it('should render the basic structure', () => {
    expect(document.getElementById('sidebar-left-wrap')).not.toBeNull();
    expect(document.getElementById('sidebar-left')).not.toBeNull();
    expect(document.getElementById('sidebar-resizer')).not.toBeNull();
  });

  it('should have all necessary mount points', () => {
    expect(document.getElementById('sidebar-md-header')).not.toBeNull();
    expect(document.getElementById('file-tree')).not.toBeNull();
    expect(document.getElementById('sidebar-search-mount')).not.toBeNull();
    expect(document.getElementById('recently-viewed-list')).not.toBeNull();
  });

  it('should handle view switching correctly', () => {
    const explorerView = document.getElementById('sidebar-explorer-view');
    const searchView = document.getElementById('sidebar-search-view');
    const mdHeader = document.getElementById('sidebar-md-header');

    // Switch to SEARCH
    sidebar.switchView(sidebar.VIEWS.SEARCH);
    expect(searchView.style.display).toBe('flex');
    expect(mdHeader.style.display).toBe('none');
    expect(explorerView.style.display).toBe('none');

    // Switch to EXPLORER
    sidebar.switchView(sidebar.VIEWS.EXPLORER);
    expect(explorerView.style.display).toBe('flex');
    expect(mdHeader.style.display).toBe('flex');
    expect(searchView.style.display).toBe('none');
  });

  it('should load saved width from localStorage', () => {
    global.localStorage.getItem.mockReturnValue('400');
    
    const newSidebar = new global.SidebarLeftComponent({ mount });
    expect(newSidebar.state.width).toBe(400);
    
    const wrap = document.getElementById('sidebar-left-wrap');
    expect(wrap.style.width).toBe('400px');
  });

  it('should show "Loading..." by default in workspace name', () => {
    const wsName = document.getElementById('workspace-name');
    expect(wsName.textContent).toBe('Loading...');
  });
});

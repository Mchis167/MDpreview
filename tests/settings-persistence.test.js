/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// --- Mocks ---
global.localStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

global.fetch = vi.fn();

// Mock AppState structure as defined in app.js
global.AppState = {
  settings: {
    customBackgrounds: []
  },
  savePersistentState: vi.fn()
};

// --- Load Service Code ---
// settings-service delegates accent/background application to theme-kit,
// so that has to be on the global first, exactly as index.html loads it.
const themeKitCode = fs.readFileSync(path.resolve(__dirname, '../shared/theme-kit/theme.js'), 'utf8');
new Function('window', themeKitCode).call(global, global);

const settingsServicePath = path.resolve(__dirname, '../renderer/js/services/settings-service.js');
const settingsServiceCode = fs.readFileSync(settingsServicePath, 'utf8');
const settingsScript = new Function('global', settingsServiceCode + '\n global.SettingsService = SettingsService;');
settingsScript(global);

// --- Test Suite ---
describe('Settings Persistence - TDD', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset AppState
    global.AppState.settings = {
      bgEnabled: true,
      bgImage: '',
      customBackgrounds: []
    };
    
    // Mock localStorage storage
    const store = {};
    global.localStorage.getItem.mockImplementation(key => store[key] || null);
    global.localStorage.setItem.mockImplementation((key, val) => { store[key] = String(val); });
  });

  it('TC-01: SettingsService.addCustomBackground should update AppState and trigger sync', () => {
    const testBase64 = 'data:image/png;base64,abc';
    
    // This should now PASS because we implemented the update logic
    const added = global.SettingsService.addCustomBackground(testBase64);
    
    expect(added).toBe(true);
    expect(global.AppState.settings.customBackgrounds).toContain(testBase64);
    expect(global.AppState.savePersistentState).toHaveBeenCalled();
  });

  it('TC-02: AppState.settings.customBackgrounds should be persisted to localStorage as JSON string', () => {
    const testData = ['img1', 'img2'];
    
    // Trigger update via service
    global.SettingsService.update('customBackgrounds', testData);
    
    // Verify it saved as JSON, not [object Object] or comma-separated string
    expect(global.localStorage.setItem).toHaveBeenCalledWith('mdpreview_custom_bg_images', JSON.stringify(testData));
    
    const stored = global.localStorage.getItem('mdpreview_custom_bg_images');
    expect(stored).toBe(JSON.stringify(testData));
  });

  it('TC-03: AppState.loadPersistentState should correctly restore Array data from server to localStorage', async () => {
    // Mock all missing globals for app.js
    const globals = [
      'SidebarLeft', 'MarkdownViewer', 'RightSidebar', 
      'SearchPalette', 'ShortcutsComponent', 'ShortcutService', 'TreeModule', 
      'WorkspaceModule', 'CollectModule', 'DraftModule', 'EditorModule', 
      'EditToolbarComponent', 'TabsModule', 'TabPreview', 'io', 'initMermaid', 
      'initZoom', 'ScrollModule', 'RecentlyViewedModule', 'ChangeActionViewBar', 
      'CommentsModule', 'DesignSystem'
    ];
    globals.forEach(g => { 
      if (!global[g]) global[g] = { init: vi.fn(), getInstance: vi.fn(() => ({ setState: vi.fn() })) }; 
    });

    // Load app.js logic
    const appPath = path.resolve(__dirname, '../renderer/js/core/app.js');
    const appCode = fs.readFileSync(appPath, 'utf8');
    
    // Execute app.js in global context
    const appScript = new Function('window', 'document', appCode);
    appScript(global, document);
    
    // Setup server response
    const mockState = {
      settings: {
        customBackgrounds: ['server_img_1', 'server_img_2'],
        accentColor: '#ff0000'
      }
    };
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockState
    });

    // Execute load
    await global.AppState.loadPersistentState();

    // Verify localStorage has the correct JSON string
    const storedBgs = global.localStorage.getItem('mdpreview_custom_bg_images');
    expect(storedBgs).toBe(JSON.stringify(mockState.settings.customBackgrounds));
  });
});

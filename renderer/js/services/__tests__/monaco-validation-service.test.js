/**
 * Automation test for MonacoValidationService
 */
/* eslint-disable no-undef */

// Mock Browser Globals
const mockModel = {
  getValue: vi.fn(),
  getLineContent: vi.fn(),
  getLanguageId: vi.fn(() => 'markdown'),
  getPositionAt: vi.fn((offset) => ({ lineNumber: 1, column: offset + 1 }))
};

const mockEditor = {
  getModel: vi.fn(() => mockModel),
  getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
  deltaDecorations: vi.fn(() => [])
};

global.window = {};
global.monaco = {
  MarkerSeverity: { Error: 8, Warning: 4 },
  Range: function(sl, sc, el, ec) {
    this.startLineNumber = sl;
    this.startColumn = sc;
    this.endLineNumber = el;
    this.endColumn = ec;
  },
  editor: {
    setModelMarkers: vi.fn(),
    tokenize: vi.fn(() => [[]])
  }
};
global.monaco.Range.containsPosition = vi.fn(() => false);

global.MonacoService = {
  isInitialized: vi.fn(() => true),
  getInstance: vi.fn(() => mockEditor)
};

global.AssetManager = {
  getRegistry: vi.fn(() => ({ broken: [] }))
};

// Also attach to window for IIFE visibility
window.AssetManager = global.AssetManager;
window.MonacoService = global.MonacoService;
window.monaco = global.monaco;

// Load the service
require('../monaco-validation-service.js');

describe('MonacoValidationService Logic Test', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('should detect broken assets in Markdown syntax', () => {
    const brokenAsset = 'missing-image.png';
    AssetManager.getRegistry.mockReturnValue({
      assets: [{ name: 'valid.png' }],
      orphans: [],
      broken: []
    });

    mockModel.getValue.mockReturnValue(`Check this: ![alt](assets/${brokenAsset})`);

    window.MonacoValidationService.trigger();
    vi.advanceTimersByTime(1000);

    expect(monaco.editor.setModelMarkers).toHaveBeenCalled();
    const markers = monaco.editor.setModelMarkers.mock.calls[0][2];
    
    expect(markers.length).toBe(1);
    expect(markers[0].message).toContain(brokenAsset);
  });

  it('should detect broken assets in HTML syntax', () => {
    const brokenAsset = 'missing-html.jpg';
    AssetManager.getRegistry.mockReturnValue({
      assets: [{ name: 'dummy.png' }],
      orphans: [],
      broken: []
    });

    mockModel.getValue.mockReturnValue(`Some HTML: <img src="assets/${brokenAsset}">`);

    window.MonacoValidationService.trigger();
    vi.advanceTimersByTime(1000);

    const markers = monaco.editor.setModelMarkers.mock.calls[0][2];
    expect(markers.length).toBe(1);
    expect(markers[0].message).toContain(brokenAsset);
  });

  it('should handle URL encoding correctly', () => {
    const brokenAsset = 'image with spaces.png';
    const encodedAsset = 'image%20with%20spaces.png';
    AssetManager.getRegistry.mockReturnValue({
      assets: [{ name: 'dummy.png' }],
      orphans: [],
      broken: []
    });

    mockModel.getValue.mockReturnValue(`![alt](assets/${encodedAsset})`);

    window.MonacoValidationService.trigger();
    vi.advanceTimersByTime(1000);

    const markers = monaco.editor.setModelMarkers.mock.calls[0][2];
    expect(markers.length).toBe(1);
    expect(markers[0].message).toContain(brokenAsset);
  });

  it('should not mark valid assets', () => {
    AssetManager.getRegistry.mockReturnValue({
      assets: [{ name: 'valid-image.png' }],
      orphans: [],
      broken: []
    });

    mockModel.getValue.mockReturnValue(`![alt](assets/valid-image.png)`);

    window.MonacoValidationService.trigger();
    vi.advanceTimersByTime(1000);

    const markers = monaco.editor.setModelMarkers.mock.calls[0][2];
    expect(markers.length).toBe(0);
  });

  it('should ignore broken links inside code blocks', () => {
    AssetManager.getRegistry.mockReturnValue({
      assets: [{ name: 'dummy.png' }],
      orphans: [],
      broken: []
    });

    mockModel.getValue.mockReturnValue('```markdown\n![broken](assets/missing.png)\n```');
    mockModel.getLineContent.mockReturnValue('![broken](assets/missing.png)');
    
    // Mock tokenize to return a 'code' token type
    monaco.editor.tokenize.mockReturnValue([[{ offset: 0, type: 'variable.source.markdown' }]]);

    window.MonacoValidationService.trigger();
    vi.advanceTimersByTime(1000);

    const markers = monaco.editor.setModelMarkers.mock.calls[0][2];
    expect(markers.length).toBe(0);
  });
});

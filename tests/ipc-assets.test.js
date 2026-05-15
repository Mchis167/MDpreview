import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const fs = require('fs');
const path = require('path');

// 1. Setup Mock Data
const TEST_VAULT = path.join(__dirname, 'temp-asset-vault');

describe('IPC Assets Handler (Logic Test)', () => {
  let handlers = {};
  let mockDialog;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Clear require cache for the module under test
    const modulePath = path.resolve(__dirname, '../electron/ipc/assets');
    delete require.cache[require.resolve(modulePath)];
    const { register } = require(modulePath);

    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_VAULT, { recursive: true });
    fs.mkdirSync(path.join(TEST_VAULT, 'assets'), { recursive: true });

    // Mock dependencies
    const mockIpcMain = {
      handle: vi.fn((channel, cb) => {
        handlers[channel] = cb;
      })
    };
    mockDialog = {
      showOpenDialog: vi.fn()
    };

    register(mockIpcMain, mockDialog);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
  });

  describe('assets:import', () => {
    it('should handle name collisions by adding incrementing suffixes', async () => {
      const importHandler = handlers['assets:import'];

      // Create a dummy source file
      const srcPath = path.join(TEST_VAULT, 'source.png');
      fs.writeFileSync(srcPath, 'dummy-data');

      // First import: source.png
      mockDialog.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [srcPath]
      });

      const res1 = await importHandler({}, TEST_VAULT);
      expect(res1.success).toBe(true);
      expect(fs.existsSync(path.join(TEST_VAULT, 'assets', 'source.png'))).toBe(true);

      // Second import: source.png (should become source (1).png)
      mockDialog.showOpenDialog.mockResolvedValueOnce({
        canceled: false,
        filePaths: [srcPath]
      });
      const res2 = await importHandler({}, TEST_VAULT);
      
      expect(res2.success).toBe(true);
      expect(res2.count).toBe(1);
      expect(fs.existsSync(path.join(TEST_VAULT, 'assets', 'source (1).png'))).toBe(true);
    });
  });

  describe('assets:rename', () => {
    it('should rename file and update references in markdown files', async () => {
      const renameHandler = handlers['assets:rename'];
      
      const oldName = 'old-image.png';
      const newName = 'new-image.png';
      const assetPath = path.join(TEST_VAULT, 'assets', oldName);
      fs.writeFileSync(assetPath, 'data');

      const mdPath = path.join(TEST_VAULT, 'note.md');
      const originalContent = 'Hello\n![](assets/old-image.png)\n<img src="assets/old-image.png">';
      fs.writeFileSync(mdPath, originalContent);

      const result = await renameHandler({}, {
        vaultPath: TEST_VAULT,
        oldName,
        newName
      });

      expect(result.success).toBe(true);
      expect(result.updatedFiles).toBe(1);
      expect(fs.existsSync(path.join(TEST_VAULT, 'assets', newName))).toBe(true);
      
      const updatedContent = fs.readFileSync(mdPath, 'utf8');
      expect(updatedContent).toContain('![](assets/new-image.png)');
    });
  });
});

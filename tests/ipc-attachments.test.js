import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// --- Load IPC Handler ---
const { register } = require('../electron/ipc/attachments');

const TEST_VAULT = path.join(__dirname, 'temp-attachment-vault');

// --- Mocks ---
const mockNativeImage = {
  createFromBuffer: vi.fn().mockReturnValue({
    isEmpty: () => false,
    getSize: () => ({ width: 100, height: 100 }),
    toPNG: () => Buffer.from('png-data'),
    toJPEG: vi.fn().mockReturnValue(Buffer.from('jpg-data'))
  })
};

vi.mock('electron', () => ({
  nativeImage: mockNativeImage
}));

describe('IPC Attachments Handler', () => {
  let mockIpcMain;
  let handler;

  beforeEach(() => {
    vi.clearAllMocks();
    
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
    fs.mkdirSync(TEST_VAULT, { recursive: true });

    mockIpcMain = {
      handle: vi.fn((_channel, cb) => {
        handler = cb;
      })
    };
    register(mockIpcMain);
  });

  afterEach(() => {
    if (fs.existsSync(TEST_VAULT)) {
      fs.rmSync(TEST_VAULT, { recursive: true, force: true });
    }
  });

  it('should register attachment:save-image channel', () => {
    expect(mockIpcMain.handle).toHaveBeenCalledWith('attachment:save-image', expect.any(Function));
  });

  it('should save image to assets folder and return relative path', async () => {
    const mockBuffer = Buffer.from('raw-data');
    const result = await handler({}, { buffer: mockBuffer, originalName: 'test.png', vaultPath: TEST_VAULT });

    if (!result.success) throw new Error(result.error);

    expect(result.success).toBe(true);
    expect(result.relativePath).toMatch(/^\/assets\/image-\d+\.png$/);
  });

  it('should create assets folder if it does not exist', async () => {
    const result = await handler({}, { buffer: Buffer.from('data'), originalName: 'test.png', vaultPath: TEST_VAULT });
    if (!result.success) throw new Error(result.error);
    expect(fs.existsSync(path.join(TEST_VAULT, 'assets'))).toBe(true);
  });

  it('should handle JPEG compression', async () => {
    const result = await handler({}, { buffer: Buffer.from('data'), originalName: 'photo.jpg', vaultPath: TEST_VAULT });
    if (!result.success) throw new Error(result.error);
    expect(result.relativePath).toContain('.jpg');
    expect(mockNativeImage.createFromBuffer().toJPEG).toHaveBeenCalledWith(85);
  });

  it('should return error if vaultPath is missing', async () => {
    const result = await handler({}, { buffer: Buffer.from('data'), originalName: 'test.png' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('Vault path is required');
  });
});

import { describe, it, expect, afterEach } from 'vitest';
const fs   = require('fs');
const os   = require('os');
const path = require('path');

describe('runtime.json lifecycle (server/index.js)', () => {
  let dataDir;
  let serverModule;

  afterEach(async () => {
    if (serverModule) {
      serverModule.stop();
      serverModule = null;
    }
    // Reset module cache so subsequent tests get a fresh server/index.js instance
    delete require.cache[require.resolve('../server/index.js')];
    if (dataDir) fs.rmSync(dataDir, { recursive: true, force: true });
  });

  it('writes runtime.json with port/pid/startedAt on start, and removes it on stop', async () => {
    dataDir = fs.mkdtempSync(path.join(os.tmpdir(), 'runtime-json-test-'));
    serverModule = require('../server/index.js');

    const port = await serverModule.start(dataDir);
    expect(typeof port).toBe('number');

    const runtimeFile = path.join(dataDir, 'runtime.json');
    expect(fs.existsSync(runtimeFile)).toBe(true);

    const runtime = JSON.parse(fs.readFileSync(runtimeFile, 'utf8'));
    expect(runtime.port).toBe(port);
    expect(runtime.pid).toBe(process.pid);
    expect(typeof runtime.startedAt).toBe('string');
    expect(new Date(runtime.startedAt).toString()).not.toBe('Invalid Date');

    serverModule.stop();
    expect(fs.existsSync(runtimeFile)).toBe(false);
    serverModule = null;
  });
});

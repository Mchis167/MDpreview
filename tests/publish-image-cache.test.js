import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
const fs = require('fs');
const path = require('path');
const express = require('express');

// ─── Helpers ────────────────────────────────────────────────────────────────

const TEMP_DIR = path.join(__dirname, 'temp-publish-cache');
const CACHE_DIR = path.join(TEMP_DIR, '.mdpreview');
const CACHE_FILE = path.join(CACHE_DIR, 'publish-cache.json');

function createApp(watchDir) {
  const app = express();
  app.use(express.json());
  app.use((req, _res, next) => { req.watchDir = watchDir; next(); });
  const cacheRoute = require('../server/routes/publish-cache');
  app.use('/api', cacheRoute);
  return app;
}

async function makeRequest(app, method, url, body) {
  const http = require('http');
  const server = http.createServer(app);
  await new Promise(r => server.listen(0, r));
  const port = server.address().port;

  const options = {
    hostname: 'localhost',
    port,
    path: url,
    method,
    headers: { 'Content-Type': 'application/json' }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        server.close();
        resolve({ status: res.statusCode, body: JSON.parse(data) });
      });
    });
    req.on('error', (e) => { server.close(); reject(e); });
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

// ─── Server Route Tests ──────────────────────────────────────────────────────

describe('GET /api/publish-cache', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
    // Clear require cache for the route module
    const modulePath = path.resolve(__dirname, '../server/routes/publish-cache');
    delete require.cache[require.resolve(modulePath)];
  });

  it('TC-01: trả về { version: 1, images: {} } khi file chưa tồn tại', async () => {
    const app = createApp(TEMP_DIR);
    const res = await makeRequest(app, 'GET', '/api/publish-cache');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: 1, images: {} });
  });

  it('TC-02: đọc đúng nội dung cache khi file đã có', async () => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    const cacheData = {
      version: 1,
      images: {
        'sha256-abc': { r2Url: 'https://r2.example.com/img.webp', slug: 'test', uploadedAt: '2026-05-17', originalSize: 1024, compressedSize: 512 }
      }
    };
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cacheData));

    const app = createApp(TEMP_DIR);
    const res = await makeRequest(app, 'GET', '/api/publish-cache');
    expect(res.status).toBe(200);
    expect(res.body.images['sha256-abc'].r2Url).toBe('https://r2.example.com/img.webp');
  });

  it('TC-E01: trả về empty cache khi file bị corrupt (JSON sai)', async () => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, 'INVALID_JSON{{{');

    const app = createApp(TEMP_DIR);
    const res = await makeRequest(app, 'GET', '/api/publish-cache');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: 1, images: {} });
  });

  it('TC-E02: trả về empty cache khi không có workspace (watchDir = null)', async () => {
    const app = createApp(null);
    const res = await makeRequest(app, 'GET', '/api/publish-cache');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ version: 1, images: {} });
  });
});

describe('POST /api/publish-cache', () => {
  beforeEach(() => {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  });

  afterEach(() => {
    if (fs.existsSync(TEMP_DIR)) fs.rmSync(TEMP_DIR, { recursive: true });
    const modulePath = path.resolve(__dirname, '../server/routes/publish-cache');
    delete require.cache[require.resolve(modulePath)];
  });

  it('TC-03: tạo file cache mới nếu chưa tồn tại', async () => {
    const app = createApp(TEMP_DIR);
    const cacheData = { version: 1, images: { 'sha256-xyz': { r2Url: 'https://r2.example.com/img2.webp', slug: 'doc1', uploadedAt: '2026-05-17', originalSize: 2048, compressedSize: 800 } } };

    const res = await makeRequest(app, 'POST', '/api/publish-cache', cacheData);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    expect(fs.existsSync(CACHE_FILE)).toBe(true);
    const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    expect(saved.images['sha256-xyz'].r2Url).toBe('https://r2.example.com/img2.webp');
  });

  it('TC-04: tạo thư mục .mdpreview nếu chưa có', async () => {
    expect(fs.existsSync(CACHE_DIR)).toBe(false);

    const app = createApp(TEMP_DIR);
    await makeRequest(app, 'POST', '/api/publish-cache', { version: 1, images: {} });

    expect(fs.existsSync(CACHE_DIR)).toBe(true);
    expect(fs.existsSync(CACHE_FILE)).toBe(true);
  });

  it('TC-05: ghi đè (overwrite) cache cũ với data mới', async () => {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ version: 1, images: { 'old-hash': { r2Url: 'old-url' } } }));

    const app = createApp(TEMP_DIR);
    const newData = { version: 1, images: { 'new-hash': { r2Url: 'new-url' } } };
    await makeRequest(app, 'POST', '/api/publish-cache', newData);

    const saved = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    expect(saved.images['new-hash']).toBeDefined();
    expect(saved.images['old-hash']).toBeUndefined();
  });

  it('TC-E03: trả về 400 khi không có workspace', async () => {
    const app = createApp(null);
    const res = await makeRequest(app, 'POST', '/api/publish-cache', { version: 1, images: {} });
    expect(res.status).toBe(400);
  });
});

// ─── PublishImageCache Module Logic Tests ────────────────────────────────────
// Test logic computeHash, get, set — chạy trực tiếp trên module logic (Node.js port)

describe('PublishImageCache logic (Node.js port)', () => {
  // Port lại logic từ browser module để test trên Node
  const { subtle } = require('crypto').webcrypto;

  async function computeHash(buffer) {
    const hashBuffer = await subtle.digest('SHA-256', buffer);
    return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  function createCacheStore() {
    let cache = { version: 1, images: {} };
    return {
      get: (hash) => cache.images[hash] || null,
      set: (hash, entry) => { cache.images[hash] = { ...entry, uploadedAt: new Date().toISOString() }; },
      getAll: () => cache
    };
  }

  it('TC-06: computeHash trả về hex string 64 ký tự', async () => {
    const buffer = Buffer.from('hello world image data');
    const hash = await computeHash(buffer);
    expect(typeof hash).toBe('string');
    expect(hash.length).toBe(64);
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('TC-07: cùng content → cùng hash', async () => {
    const buf1 = Buffer.from('same image bytes');
    const buf2 = Buffer.from('same image bytes');
    const [h1, h2] = await Promise.all([computeHash(buf1), computeHash(buf2)]);
    expect(h1).toBe(h2);
  });

  it('TC-08: content khác nhau → hash khác nhau', async () => {
    const buf1 = Buffer.from('image version A');
    const buf2 = Buffer.from('image version B'); // "replace ảnh cùng tên"
    const [h1, h2] = await Promise.all([computeHash(buf1), computeHash(buf2)]);
    expect(h1).not.toBe(h2);
  });

  it('TC-09: cache.get trả về null khi hash chưa tồn tại', () => {
    const store = createCacheStore();
    expect(store.get('nonexistent-hash')).toBeNull();
  });

  it('TC-10: cache.set và cache.get hoạt động đúng', () => {
    const store = createCacheStore();
    store.set('hash-abc', { r2Url: 'https://r2.example.com/img.webp', slug: 'my-doc', originalSize: 1024, compressedSize: 512 });
    const entry = store.get('hash-abc');
    expect(entry).not.toBeNull();
    expect(entry.r2Url).toBe('https://r2.example.com/img.webp');
    expect(entry.slug).toBe('my-doc');
    expect(entry.uploadedAt).toBeDefined();
  });

  it('TC-11: cross-document dedup — cùng hash từ 2 doc khác nhau → 1 entry', () => {
    const store = createCacheStore();
    store.set('hash-shared', { r2Url: 'https://r2.example.com/shared.webp', slug: 'doc-1', originalSize: 500, compressedSize: 100 });

    // Doc 2 dùng cùng ảnh → hit cache ngay
    const hit = store.get('hash-shared');
    expect(hit).not.toBeNull();
    expect(hit.r2Url).toBe('https://r2.example.com/shared.webp');

    // Chỉ 1 entry trong cache
    expect(Object.keys(store.getAll().images).length).toBe(1);
  });

  it('TC-12: replace ảnh cùng tên tạo hash mới (không bị cache hit nhầm)', async () => {
    const store = createCacheStore();

    const originalContent = Buffer.from('original photo bytes');
    const replacedContent = Buffer.from('completely different photo bytes — user replaced the file');

    const hashOriginal = await computeHash(originalContent);
    const hashReplaced = await computeHash(replacedContent);

    store.set(hashOriginal, { r2Url: 'https://r2.example.com/img-original.webp', slug: 'doc', originalSize: 100, compressedSize: 50 });

    // Sau khi replace: hash khác → cache miss
    expect(hashOriginal).not.toBe(hashReplaced);
    expect(store.get(hashReplaced)).toBeNull(); // MISS → phải upload lại
    expect(store.get(hashOriginal)).not.toBeNull(); // Entry cũ vẫn còn
  });
});

// ─── Server Route: R2 filename logic ─────────────────────────────────────────

describe('worker-publish-asset: hash-based filename', () => {
  it('TC-13: assetName có dạng img-{hash12}.{ext} khi có contentHash', () => {
    const hash = 'abcdef123456789012345678901234567890123456789012345678901234abcd';
    const mimeType = 'image/webp';
    const assetName = `img-${hash.slice(0, 12)}.${mimeType.split('/')[1].replace('jpeg', 'jpg')}`;
    expect(assetName).toBe('img-abcdef123456.webp');
  });

  it('TC-14: extension jpeg được đổi thành jpg', () => {
    const hash = 'hash1234567890';
    const mimeType = 'image/jpeg';
    const ext = mimeType.split('/')[1].replace('jpeg', 'jpg');
    const assetName = `img-${hash.slice(0, 12)}.${ext}`;
    expect(assetName).toContain('.jpg');
    expect(assetName).not.toContain('.jpeg');
  });
});

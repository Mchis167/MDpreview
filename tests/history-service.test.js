import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

const history = require('../server/services/history-service.js');

describe('history-service', () => {
  let dir;
  const rel = 'notes/a.md';
  let full;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mdp-hist-'));
    full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, 'v1');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
    vi.restoreAllMocks();
  });

  it('snapshots current content before overwrite', () => {
    expect(history.snapshot(dir, rel, full)).toBe(true);
    const versions = history.list(dir, rel);
    expect(versions).toHaveLength(1);
    expect(history.get(dir, rel, versions[0].ts)).toBe('v1');
  });

  it('debounces snapshots within the interval window', () => {
    expect(history.snapshot(dir, rel, full)).toBe(true);
    fs.writeFileSync(full, 'v2');
    expect(history.snapshot(dir, rel, full)).toBe(false); // too soon
    expect(history.list(dir, rel)).toHaveLength(1);
  });

  it('skips identical content even after the interval', () => {
    expect(history.snapshot(dir, rel, full)).toBe(true);
    const later = Date.now() + history.MIN_SNAPSHOT_INTERVAL_MS + 1000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    expect(history.snapshot(dir, rel, full)).toBe(false); // same content
  });

  it('creates a new snapshot after the interval when content changed', () => {
    expect(history.snapshot(dir, rel, full)).toBe(true);
    fs.writeFileSync(full, 'v2');
    const later = Date.now() + history.MIN_SNAPSHOT_INTERVAL_MS + 1000;
    vi.spyOn(Date, 'now').mockReturnValue(later);
    expect(history.snapshot(dir, rel, full)).toBe(true);
    const versions = history.list(dir, rel);
    expect(versions).toHaveLength(2);
    expect(history.get(dir, rel, versions[0].ts)).toBe('v2');
    expect(history.get(dir, rel, versions[1].ts)).toBe('v1');
  });

  it('rotates snapshots beyond the cap', () => {
    let now = Date.now();
    const spy = vi.spyOn(Date, 'now');
    for (let i = 0; i < history.MAX_SNAPSHOTS_PER_FILE + 5; i++) {
      now += history.MIN_SNAPSHOT_INTERVAL_MS + 1000;
      spy.mockReturnValue(now);
      fs.writeFileSync(full, `v${i}`);
      expect(history.snapshot(dir, rel, full)).toBe(true);
    }
    expect(history.list(dir, rel)).toHaveLength(history.MAX_SNAPSHOTS_PER_FILE);
  });

  it('returns false for a missing file and null for a missing snapshot', () => {
    expect(history.snapshot(dir, 'nope.md', path.join(dir, 'nope.md'))).toBe(false);
    expect(history.get(dir, rel, 12345)).toBeNull();
  });

  it('stores snapshots under _md-workspace-assets/.history', () => {
    history.snapshot(dir, rel, full);
    expect(fs.existsSync(path.join(dir, '_md-workspace-assets', '.history', encodeURIComponent(rel)))).toBe(true);
  });
});

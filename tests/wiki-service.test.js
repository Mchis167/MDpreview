/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// --- Mocks ---
global.fetch = vi.fn();

// --- Load Service Code ---
const wikiServicePath = path.resolve(__dirname, '../renderer/js/services/wiki-service.js');
const wikiServiceCode = fs.readFileSync(wikiServicePath, 'utf8');
// The file is an IIFE, but it exports to window.WikiService
const wikiScript = new Function('window', wikiServiceCode);
wikiScript(global);

const mockIndex = {
  id_to_path: {
    'doc-a': 'fileA.md',
    'doc-b': 'dir1/fileB.md'
  },
  path_to_id: {
    'fileA.md': 'doc-a',
    'dir1/fileB.md': 'doc-b'
  },
  outgoing: {
    'fileA.md': {
      flows: ['doc-b'],
      functions: [],
      decisions: [],
      generic: []
    }
  },
  backlinks: {
    'doc-b': ['doc-a']
  }
};

describe('WikiService - Renderer Side', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    
    // Mock successful index fetch
    global.fetch.mockResolvedValue({
      ok: true,
      json: async () => mockIndex
    });

    await global.WikiService.init();
  });

  describe('classifyLink', () => {
    it('should classify external links correctly', () => {
      const result = global.WikiService.classifyLink('https://google.com', 'some/file.md');
      expect(result.type).toBe('external');
      expect(result.url).toBe('https://google.com');
    });

    it('should classify anchor links correctly', () => {
      const result = global.WikiService.classifyLink('#section-1', 'some/file.md');
      expect(result.type).toBe('anchor');
      expect(result.anchor).toBe('#section-1');
    });

    it('should classify ID-based internal links', () => {
      const result = global.WikiService.classifyLink('doc-a', 'some/file.md');
      expect(result.type).toBe('internal');
      expect(result.id).toBe('doc-a');
      expect(result.resolvedPath).toBe('fileA.md');
    });

    it('should classify relative path internal links (same folder)', () => {
      const result = global.WikiService.classifyLink('./fileA.md', 'fileB.md');
      expect(result.type).toBe('internal');
      expect(result.resolvedPath).toBe('fileA.md');
      expect(result.id).toBe('doc-a');
    });

    it('should classify relative path internal links (subfolder)', () => {
      const result = global.WikiService.classifyLink('./dir1/fileB.md', 'fileA.md');
      expect(result.type).toBe('internal');
      expect(result.resolvedPath).toBe('dir1/fileB.md');
      expect(result.id).toBe('doc-b');
    });

    it('should classify relative path internal links (parent folder)', () => {
      const result = global.WikiService.classifyLink('../fileA.md', 'dir1/fileB.md');
      expect(result.type).toBe('internal');
      expect(result.resolvedPath).toBe('fileA.md');
      expect(result.id).toBe('doc-a');
    });

    it('should return unknown for non-existent paths/IDs', () => {
      const result = global.WikiService.classifyLink('ghost-id', 'fileA.md');
      expect(result.type).toBe('unknown');
    });
  });

  describe('getBacklinks', () => {
    it('should return correct backlinks for a given ID', () => {
      const backlinks = global.WikiService.getBacklinks('doc-b');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0].id).toBe('doc-a');
      expect(backlinks[0].path).toBe('fileA.md');
    });

    it('should return correct backlinks for a given Path', () => {
      const backlinks = global.WikiService.getBacklinks('dir1/fileB.md');
      expect(backlinks).toHaveLength(1);
      expect(backlinks[0].id).toBe('doc-a');
    });

    it('should return empty array for ID with no backlinks', () => {
      const backlinks = global.WikiService.getBacklinks('doc-a');
      expect(backlinks).toEqual([]);
    });
  });

  describe('Path Resolution Logic (_resolvePath)', () => {
    it('should handle complex relative paths correctly', () => {
      const service = global.WikiService;
      // current: a/b/c/file.md -> folder: a/b/c
      // link: ../../d/file2.md -> a/d/file2.md
      expect(service._resolvePath('a/b/c/file.md', '../../d/file2.md')).toBe('a/d/file2.md');
      
      // current: root.md -> folder: empty
      expect(service._resolvePath('root.md', './other.md')).toBe('other.md');
      
      // handle query params and anchors in href
      expect(service._resolvePath('a/file.md', './other.md#section?q=1')).toBe('a/other.md');
    });
  });
});

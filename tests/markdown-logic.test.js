/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load Service Code
const servicePath = path.resolve(__dirname, '../renderer/js/services/markdown-logic-service.js');
const serviceCode = fs.readFileSync(servicePath, 'utf8');

// Inject into global scope
const script = new Function('global', serviceCode + '\n global.MarkdownLogicService = MarkdownLogicService;');
script(global);

describe('MarkdownLogicService - Actions', () => {
  let textarea;

  beforeEach(() => {
    document.body.innerHTML = '<textarea id="test-editor"></textarea>';
    textarea = document.getElementById('test-editor');
  });

  it('TC-01: should toggle Bold ON', () => {
    textarea.value = 'hello';
    textarea.setSelectionRange(0, 5);
    global.MarkdownLogicService.applyAction(textarea, 'b');
    expect(textarea.value).toBe('**hello**');
    // Check selection (should select the whole new text including symbols)
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(9);
  });

  it('TC-02: should toggle Bold OFF', () => {
    textarea.value = '**hello**';
    textarea.setSelectionRange(0, 9);
    global.MarkdownLogicService.applyAction(textarea, 'b');
    expect(textarea.value).toBe('hello');
    expect(textarea.selectionStart).toBe(0);
    expect(textarea.selectionEnd).toBe(5);
  });

  it('TC-03: should apply H1 header', () => {
    textarea.value = 'Title';
    textarea.setSelectionRange(0, 5);
    global.MarkdownLogicService.applyAction(textarea, 'h1');
    expect(textarea.value).toBe('# Title');
  });

  it('TC-04: should switch from H1 to H2', () => {
    textarea.value = '# Title';
    textarea.setSelectionRange(0, 7);
    global.MarkdownLogicService.applyAction(textarea, 'h2');
    expect(textarea.value).toBe('## Title');
  });

  it('TC-05: should toggle Header OFF when same level', () => {
    textarea.value = '### Title';
    textarea.setSelectionRange(0, 9);
    global.MarkdownLogicService.applyAction(textarea, 'h3');
    expect(textarea.value).toBe('Title');
  });
  
  it('TC-06: should handle List Toggle', () => {
    textarea.value = 'Item';
    textarea.setSelectionRange(0, 4);
    global.MarkdownLogicService.applyAction(textarea, 'ul');
    expect(textarea.value).toBe('* Item');
  });
});

describe('MarkdownLogicService - Sync (Sandwich Strategy)', () => {
  let textarea;

  beforeEach(() => {
    // Mock getComputedStyle for scroll logic
    window.getComputedStyle = vi.fn().mockReturnValue({ lineHeight: '24px' });
    document.body.innerHTML = '<textarea id="test-editor" style="line-height:24px"></textarea>';
    textarea = document.getElementById('test-editor');
    // Mock scrollTop
    Object.defineProperty(textarea, 'scrollTop', {
        writable: true,
        value: 0
    });
  });

  it('TC-07: should find text using Sandwich Strategy after content drift', () => {
    // Simulated content with some drift (extra newlines)
    textarea.value = '\n\nExtra lines...\nTarget Text here';
    
    const context = {
      line: 1, // Legacy line was 1
      selectionText: 'Target Text',
      offset: 0
    };
    
    global.MarkdownLogicService.syncCursor(textarea, context);
    
    // It should have found the text at a later position
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    expect(textarea.value.substring(start, end)).toBe('Target Text');
    expect(start).toBeGreaterThan(10); // Definitely not at line 1 anymore
  });

  it('TC-08: should handle Longest Word Fallback', () => {
    textarea.value = 'Some prefix\nSuperUniqueWordThatMatchesNothingElse\nSome suffix';
    
    const context = {
      line: 10, // Wrong line
      selectionText: 'SuperUniqueWordThatMatchesNothingElse',
      offset: 0
    };
    
    global.MarkdownLogicService.syncCursor(textarea, context);
    
    expect(textarea.value.substring(textarea.selectionStart, textarea.selectionEnd)).toBe('SuperUniqueWordThatMatchesNothingElse');
  });
});

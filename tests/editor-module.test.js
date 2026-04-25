/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// ── Mock Dependencies ──────────────────────────────────────────
global.AppState = {
  currentFile: 'test.md'
};

global.MarkdownLogicService = {
  applyAction: vi.fn(),
  syncCursor: vi.fn()
};

// ── Load the Module Code ──────────────────────────────────────
const modulePath = path.resolve(__dirname, '../renderer/js/modules/editor.js');
const moduleCode = fs.readFileSync(modulePath, 'utf8');

// Inject into global scope
const script = new Function('global', moduleCode + '\n global.EditorModule = EditorModule;');
script(global);

describe('EditorModule - Refactored Service', () => {
  let textarea;

  beforeEach(() => {
    document.body.innerHTML = '<textarea id="test-editor"></textarea>';
    textarea = document.getElementById('test-editor');
    vi.clearAllMocks();
    
    // Reset internal state
    global.EditorModule.bindToElement(null);
  });

  it('TC-Editor-01: should bind to a textarea element', () => {
    global.EditorModule.bindToElement(textarea);
    // Internal state should now point to this textarea
    // We can verify by calling an action
    global.EditorModule.applyAction('b');
    expect(global.MarkdownLogicService.applyAction).toHaveBeenCalledWith(textarea, 'b');
  });

  it('TC-Editor-02: should track dirty state', () => {
    global.EditorModule.bindToElement(textarea);
    global.EditorModule.setOriginalContent('old');
    
    expect(global.EditorModule.isDirty()).toBe(false);
    
    textarea.value = 'new';
    expect(global.EditorModule.isDirty()).toBe(true);
  });

  it('TC-Editor-03: should clear dirty state after save', async () => {
    // Mock fetch for save
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    });

    global.EditorModule.bindToElement(textarea);
    global.EditorModule.setOriginalContent('old');
    textarea.value = 'new';
    
    await global.EditorModule.save();
    expect(global.EditorModule.isDirty()).toBe(false);
  });

  it('TC-Editor-04: should handle focusWithContext', () => {
    global.EditorModule.bindToElement(textarea);
    const context = { line: 5, selectionText: 'hello' };
    
    global.EditorModule.focusWithContext(context);
    
    expect(textarea === document.activeElement).toBe(true);
    expect(global.MarkdownLogicService.syncCursor).toHaveBeenCalledWith(textarea, context);
  });
});

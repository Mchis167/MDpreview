/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Since render.js exports a router, we need to extract the renderWithLineNumbers function
// or refactor render.js to export it. For TDD, we'll assume it will be exported.
// We'll use a hacky way to load it if not exported, but it's better to refactor.

const renderPath = path.resolve(__dirname, '../server/routes/render.js');
const renderCode = fs.readFileSync(renderPath, 'utf8');

// Mock dependencies for render.js if we use the Function injection method
// Or just refactor render.js first. The user asked for tests BEFORE anything.
// So I will create a test that expects the function to be available globally 
// after I inject it (similar to how markdown-logic-service is tested).

const script = new Function('require', 'module', 'exports', '__dirname', renderCode);
const mockModule = { exports: {} };
const mockRequire = (id) => {
    if (id.includes('md-renderer-core')) return require('../renderer/js/services/md-renderer-core.js');
    return require(id);
};

script(mockRequire, mockModule, mockModule.exports, path.dirname(renderPath));

// Access the internal functions if they were exported or through the router if we can
// Actually, let's assume we will refactor render.js to export renderWithLineNumbers.
// For now, I'll manually extract it or mock the router.

describe('Server Renderer - Nested Lists (Bug 1.3)', () => {
  // This will fail until I export it from render.js
  const renderWithLineNumbers = mockModule.exports.renderWithLineNumbers;

  it('T1: Simple Checklist should have md-list-item-content', () => {
    const markdown = '- [ ] Task 1';
    const html = renderWithLineNumbers(markdown);
    
    expect(html).toContain('task-list-item');
    expect(html).toContain('md-list-item-content');
    expect(html).toContain('Task 1');
  });

  it('T2: Nested Checklist should stack vertically (md-list-item-content wrapping blocks)', () => {
    const markdown = '- [ ] Task 1\n  - [ ] Task 2';
    const html = renderWithLineNumbers(markdown);
    
    // Check that outer Task 1 has md-list-item-content
    // We expect: <li class="task-list-item ...">... <div class="md-list-item-content">...</div></li>
    
    const task1Match = html.match(/<li[^>]*task-list-item[^>]*>[\s\S]*?<div[^>]*md-list-item-content[^>]*>([\s\S]*?)<\/div>\s*<\/li>/);
    expect(task1Match).not.toBeNull();
    
    const content = task1Match[1];
    // Inside content, we expect two blocks
    expect(content).toContain('Task 1');
    expect(content).toContain('<ul');
    expect(content).toContain('Task 2');
    
    // Verify that the nested list is INSIDE the md-list-item-content
    // (In the buggy version, it might be a direct child of <li> if we were lucky, 
    // but actually it was just appended after the text)
  });

  it('T3: Checklist with a sub-list should have multiple blocks in its content', () => {
    const markdown = '- [ ] Task 1\n  - Sub 1'; 
    const html = renderWithLineNumbers(markdown);
    
    expect(html).toContain('task-list-item');
    expect(html).toContain('md-list-item-content');
    
    const task1Match = html.match(/<li[^>]*task-list-item[^>]*>[\s\S]*?<div[^>]*md-list-item-content[^>]*>([\s\S]*?)<\/div>\s*<\/li>/);
    expect(task1Match).not.toBeNull();
    const content = task1Match[1];
    
    expect(content).toContain('Task 1');
    expect(content).toContain('<ul');
    
    const blocks = content.match(/class="md-block"/g);
    expect(blocks.length).toBeGreaterThanOrEqual(2);
  });
});

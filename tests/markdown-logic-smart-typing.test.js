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
// Note: We expect MarkdownLogicService to be updated with computeSmartEnter and computeListIndent
const script = new Function('global', serviceCode + '\n global.MarkdownLogicService = MarkdownLogicService;');
script(global);

describe('MarkdownLogicService - Smart Enter', () => {
  const { computeSmartEnter } = global.MarkdownLogicService;

  it('U1: Enter sau item có nội dung (Unordered)', () => {
    const input = { value: '- item 1', selStart: 8, selEnd: 8 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result).not.toBeNull();
    expect(result.newValue).toBe('- item 1\n- ');
    expect(result.newCursorPos).toBe(11);
  });

  it('U2: Enter trên item rỗng -> thoát list', () => {
    const input = { value: '- item 1\n- ', selStart: 11, selEnd: 11 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result).not.toBeNull();
    expect(result.newValue).toBe('- item 1\n');
    expect(result.newCursorPos).toBe(9);
  });

  it('U3: Enter ở giữa dòng -> không can thiệp', () => {
    const input = { value: '- item 1', selStart: 5, selEnd: 8 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result).toBeNull();
  });

  it('U5: Bullet * phải giữ nguyên ký tự', () => {
    const input = { value: '* item', selStart: 6, selEnd: 6 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('* item\n* ');
  });

  it('O1: Tăng số tự động (Ordered)', () => {
    const input = { value: '1. item', selStart: 7, selEnd: 7 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('1. item\n2. ');
    expect(result.newCursorPos).toBe(11);
  });

  it('O2: Số lớn hơn 9', () => {
    const input = { value: '10. item', selStart: 8, selEnd: 8 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('10. item\n11. ');
  });

  it('T1: Tạo task mới (unchecked)', () => {
    const input = { value: '- [ ] task', selStart: 10, selEnd: 10 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('- [ ] task\n- [ ] ');
  });

  it('T2: Task đã check [x] -> tạo task unchecked [ ]', () => {
    const input = { value: '- [x] task', selStart: 10, selEnd: 10 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('- [x] task\n- [ ] ');
  });

  it('T2-extra: Task đã check [X] (hoa) -> tạo task unchecked [ ]', () => {
    const input = { value: '- [X] task', selStart: 10, selEnd: 10 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('- [X] task\n- [ ] ');
  });

  it('I1: Enter trong sub-item giữ indent', () => {
    const input = { value: '- l1\n  - l2', selStart: 11, selEnd: 11 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('- l1\n  - l2\n  - ');
  });

  it('Bug 3: Hỗ trợ đánh số đa cấp 2.2. -> 2.3.', () => {
    const input = { value: '2.2. item', selStart: 9, selEnd: 9 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('2.2. item\n2.3. ');
  });

  it('Bug 4: Tự động đánh số lại các dòng bên dưới', () => {
    const input = { value: '1. a\n2. b\n3. c', selStart: 4, selEnd: 4 }; // Sau '1. a'
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result.newValue).toBe('1. a\n2. \n3. b\n4. c');
  });

  it('E4: CRLF trong value phải được xử lý đúng', () => {
    const input = { value: '- item 1\r\n- ', selStart: 12, selEnd: 12 };
    const result = global.MarkdownLogicService.computeSmartEnter(input.value, input.selStart, input.selEnd);
    expect(result).not.toBeNull();
    expect(result.newValue).toBe('- item 1\r\n');
  });
});

describe('MarkdownLogicService - List Indent', () => {
  it('TI1: Tab trên list item -> indent', () => {
    const input = { value: '- item', selStart: 6, selEnd: 6 };
    const result = global.MarkdownLogicService.computeListIndent(input.value, input.selStart, input.selEnd, 'in');
    expect(result.newValue).toBe('  - item');
    expect(result.newCursorPos).toBe(8);
  });

  it('TI2: Shift+Tab trên sub-item -> dedent', () => {
    const input = { value: '  - item', selStart: 8, selEnd: 8 };
    const result = global.MarkdownLogicService.computeListIndent(input.value, input.selStart, input.selEnd, 'out');
    expect(result.newValue).toBe('- item');
    expect(result.newCursorPos).toBe(6);
  });

  it('TI4: Tab trong code block -> không can thiệp', () => {
    const input = { value: '```\ncode\n```', selStart: 6, selEnd: 6 };
    const result = global.MarkdownLogicService.computeListIndent(input.value, input.selStart, input.selEnd, 'in');
    expect(result).toBeNull();
  });
});

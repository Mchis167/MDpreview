/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// Load Service Code
const servicePath = path.resolve(__dirname, '../renderer/js/services/markdown-logic-service.js');
const serviceCode = fs.readFileSync(servicePath, 'utf8');

// Inject into global scope
const script = new Function('global', serviceCode + '\n global.MarkdownLogicService = MarkdownLogicService;');
script(global);

describe('MarkdownLogicService - Bug 3: Multi-level Ordered List Indentation', () => {
  const { computeListIndent } = global.MarkdownLogicService;

  it('Case 1: Tab trên "4." ngay sau "3." -> chuyển thành "3.1."', () => {
    const value = '1. a\n2. b\n3. c\n4. d';
    const selStart = value.indexOf('4. d');
    const result = computeListIndent(value, selStart, selStart, 'in');
    
    // Hiện tại nó sẽ ra "  4. d" -> FAIL
    expect(result.newValue).toBe('1. a\n2. b\n3. c\n  3.1. d');
  });

  it('Case 2: Tab trên "4." sau list đã có sub-items "3.2." -> chuyển thành "3.3."', () => {
    const value = '3. c\n  3.1. c1\n  3.2. c2\n4. d';
    const selStart = value.indexOf('4. d');
    const result = computeListIndent(value, selStart, selStart, 'in');
    
    // Hiện tại nó sẽ ra "  4. d" -> FAIL
    expect(result.newValue).toBe('3. c\n  3.1. c1\n  3.2. c2\n  3.3. d');
  });

  it('Case 3: Shift+Tab trên "3.3." -> chuyển thành "4."', () => {
    const value = '3. c\n  3.1. c1\n  3.2. c2\n  3.3. d';
    const selStart = value.indexOf('3.3. d');
    const result = computeListIndent(value, selStart, selStart, 'out');
    
    // Hiện tại nó sẽ ra "3.3. d" (chỉ xóa khoảng trắng) -> FAIL
    expect(result.newValue).toBe('3. c\n  3.1. c1\n  3.2. c2\n4. d');
  });

  it('Case 4: Re-numbering khi Tab vào giữa -> "2. b" thành "1.1. b", "3. c" thành "2. c"', () => {
    const value = '1. a\n2. b\n3. c';
    const selStart = value.indexOf('2. b');
    const result = computeListIndent(value, selStart, selStart, 'in');
    
    // Mong đợi re-numbering cả dòng phía dưới
    expect(result.newValue).toBe('1. a\n  1.1. b\n2. c');
  });

  it('Case 5: Shift+Tab từ sub-item giữa chừng -> cập nhật toàn bộ sequence', () => {
    const value = '1. a\n  1.1. a1\n  1.2. a2\n  1.3. a3\n2. b';
    const selStart = value.indexOf('1.2. a2');
    const result = computeListIndent(value, selStart, selStart, 'out');
    
    // 1.2. a2 ra ngoài thành 2. -> 1.3. a3 thành 1.2. -> 2. b thành 3.
    expect(result.newValue).toBe('1. a\n  1.1. a1\n2. a2\n  2.1. a3\n3. b');
  });
});

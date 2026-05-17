# Debug Guide

---

## Quy tắc Vàng: Hypothesis → Confirm → Fix

**Không bao giờ fix dựa trên guess chưa được xác nhận.**

```
1. Đặt câu hỏi: "log ở đâu để confirm/deny hypothesis X?"
2. Đặt log tối thiểu → yêu cầu user reproduce + paste log
3. Log CONFIRM X → fix X
   Log DENY X   → loại trừ X, tiếp tục điều tra
4. Fix CHỈ sau khi có evidence rõ ràng
```

---

## DIAG Pattern

Dùng khi bug không reproduce được bằng code reading.

```js
// Đặt tại điểm nghi vấn
console.warn('[DIAG][ModuleName.method] label', { key: value });

// Trace unexpected caller
console.warn('[DIAG] caller:', new Error().stack.split('\n')[2]);
```

**CLEANUP BẮT BUỘC:** Xóa TẤT CẢ `[DIAG]` logs trước khi chạy lint — `no-console` rule sẽ fail.

---

## Browser Events Không Fire

**Nguyên tắc:** Spy tại `window` (capture) TRƯỚC, element sau.

```js
// ĐÚNG — chạy trước mọi handler
window.addEventListener('beforeinput', (e) => {
  if (e.target !== textarea) return;
  console.warn('[SPY]', { data: e.data, prevented: e.defaultPrevented });
}, true);
```

**Đọc kết quả:**
- `window` spy không thấy event → vấn đề ở browser/OS level
- `window` thấy, element không thấy → có `stopImmediatePropagation()` ở đâu đó

**Layer checklist:**
| Tầng | Check |
|------|-------|
| OS/Chromium | Window-level spy có thấy không |
| DOM state | `readOnly`, `disabled`, `editContext` sau `focus()` |
| Event prevention | `e.defaultPrevented` trên keydown |
| JS handler | `preventDefault()` / `stopImmediatePropagation()` |

---

## Race Condition Checklist

Trước khi viết bất kỳ logic async/timing nào, hỏi:

1. Có async operation nào đang chạy khi state thay đổi không?
2. Callback/listener có thể fire sau khi component đã bị destroy không?
3. Có stale closure nào capture state cũ không?
4. Nếu function được gọi 2 lần nhanh, lần 2 có override lần 1 đúng cách không?

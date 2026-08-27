# Demo: AI LaTeX & Arrow Symbol Converter

Tài liệu này dùng để kiểm tra tính năng tự động chuyển đổi ký hiệu toán học / LaTeX do AI sinh thành các biểu tượng Unicode sắc nét trong **MDpreview**.

---

## 🎯 1. Case thực tế từ AI (Class & Token Mapping)

- `components/ui/PopoverPanel.tsx:28`: `w-[400px]` (khi wide) và `w-[339.25px]` (mặc định) $\rightarrow$ `w-popover-wide` (400px) và `w-popover-default` (340px, làm tròn 0.75px Figma).
- `components/ui/ContextMenu.tsx:18`: `w-[180px]` $\rightarrow$ `w-context-menu` (180px).
- `components/ui/PanelInputLabel.tsx:26`: `w-[116px]` $\rightarrow$ `w-panel-label` (116px).
- Migration state: `Draft` $\Rightarrow$ `In Review` $\rightarrow$ `Approved` $\rightarrow$ `Published`.

---

## ➡️ 2. Các loại Mũi tên (Arrows)

| Cú pháp Markdown | Ký hiệu Rendered | Ý nghĩa |
| :--- | :---: | :--- |
| `$\rightarrow$` hoặc `$\to$` | $\rightarrow$ / $\to$ | Right arrow |
| `$\leftarrow$` hoặc `$\gets$` | $\leftarrow$ / $\gets$ | Left arrow |
| `$\Rightarrow$` | $\Rightarrow$ | Double right arrow (Implies) |
| `$\Leftarrow$` | $\Leftarrow$ | Double left arrow |
| `$\leftrightarrow$` / `$\Leftrightarrow$` | $\leftrightarrow$ / $\Leftrightarrow$ | Left-right arrow / Equivalent |
| `$\uparrow$` / `$\downarrow$` | $\uparrow$ / $\downarrow$ | Up / Down arrow |
| `$\nearrow$` / `$\searrow$` | $\nearrow$ / $\searrow$ | Diagonal arrows |

---

## 📐 3. So sánh, Toán học & Logic

- **So sánh:** Giá trị $A \le B$, điều kiện $X \ge 100$, độ lệch sai số $\approx 0.05$, trạng thái $status \neq null$.
- **Phép toán:** Sai số đo lường $\pm 2\%$, kích thước $1920 \times 1080$, phép nhân vô hướng $a \cdot b$, dãy số $1, 2, 3 \dots 100$.
- **Tập hợp & Logic:** Phần tử $x \in S$, $y \notin S$, tập con $A \subset B$, hợp $A \cup B$, giao $A \cap B$, vô cùng $\infty$, với mọi $\forall x$, tồn tại $\exists y$.

---

## 🏛️ 4. Ký tự Hy Lạp (Greek Symbols)

- Góc $\alpha, \beta, \theta$, bước sóng $\lambda$, hệ số $\mu$, số $\pi$, độ lệch chuẩn $\sigma$, tần số góc $\omega$.
- Chữ hoa: Độ biến thiên $\Delta$, tổng $\Sigma$, điện trở $\Omega$.

---

## 💡 5. Kiểm tra trong các môi trường khác nhau

> **Trích dẫn (Blockquote):**
> Khi tối ưu hệ thống: `Legacy Code` $\rightarrow$ `Refactor to Atomic` $\Rightarrow$ `Performance boost` $\approx 200\%$.

### Mã nguồn (Code blocks - giữ nguyên không bị convert):
```ts
// Trong code block, cú pháp giữ nguyên dạng text thô:
const transition = "$\rightarrow$";
const arrow = () => { return a -> b; };
```

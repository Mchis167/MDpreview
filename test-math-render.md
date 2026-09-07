# Test Render Toán học (KaTeX) trong MDpreview

Tài liệu này dùng để kiểm tra tính năng render công thức toán học và biểu thức logic vừa được tích hợp vào MDpreview.

---

## 1. Công thức thực tế từ Canvas / UI Positioning

1. **Panel Position đọc thẳng toạ độ thiết kế này:** Không đi đường vòng đo màn hình rồi chia zoom.
2. **Ghost trên màn hình vẽ xuôi một chiều:** $\text{Toạ độ màn hình} = \text{Toạ độ cha} + \text{Toạ độ thiết kế} \times \text{scale}$. Khi zoom canvas, Ghost tự co giãn đồng bộ cùng canvas.
3. **Lúc thả tay (Mouse Up):** Lưu đúng `currentDesignLeft/Top` vào IR. Panel lúc kéo và IR sau khi thả khớp nhau 100%, không lệch 1px.

---

## 2. Dạng khối độc lập (Block Math)

Khối công thức hiển thị trung tâm trang:

$$
\text{Toạ độ màn hình} = \text{Toạ độ cha} + \text{Toạ độ thiết kế} \times \text{scale}
$$

Ma trận biến đổi toạ độ 2D Affine Transform:

$$
\begin{bmatrix}
x_{\text{màn hình}} \\
y_{\text{màn hình}} \\
1
\end{bmatrix}
=
\begin{bmatrix}
\text{scale} & 0 & \text{offset}_x \\
0 & \text{scale} & \text{offset}_y \\
0 & 0 & 1
\end{bmatrix}
\begin{bmatrix}
x_{\text{thiết kế}} \\
y_{\text{thiết kế}} \\
1
\end{bmatrix}
$$

---

## 3. Các biểu thức toán học và ký hiệu khoa học

* **Định lý Pythagoras:** $a^2 + b^2 = c^2$
* **Năng lượng Einstein:** $E = mc^2$
* **Công thức nghiệm bậc 2:** $x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}$
* **Tích phân Gaussian:** $\int_{-\infty}^{\infty} e^{-x^2} dx = \sqrt{\pi}$
* **Tổng chuỗi:** $\sum_{k=1}^{n} k = \frac{n(n+1)}{2}$
* **Ký hiệu Hy Lạp & Mũi tên:** $\alpha, \beta, \gamma, \theta, \lambda, \Omega$ và $A \rightarrow B \Rightarrow C$

---

## 4. Kiểm tra Checklist & Ghi chú

- [x] KaTeX render không bị lỗi font tiếng Việt trong `\text{...}`
- [x] Hiển thị đẹp cả ở dạng inline `$ ... $` và block `$$ ... $$`
- [x] Không còn bị hiện ký tự lạ như `\text`, `\times` dạng thô

# TOC Semantic Tokenization (Tier 3)

**Date:** 2026-04-28
**Status:** accepted
**Author:** session 2026-04-28

---

## Bối cảnh

Trong quá trình phát triển Table of Contents (TOC), chúng ta đã triển khai nhiều hiệu ứng hoạt họa (Morphing, Slide-in) và cơ chế đẩy nội dung văn bản (Content Offset). Ban đầu, các giá trị như chiều rộng TOC (280px), khoảng cách offset (240px) và thời gian chuyển động (0.5s) được viết trực tiếp (hard-coded) trong nhiều file CSS khác nhau (`markdown.css`, `toc-panel.css`).

Điều này dẫn đến việc khó duy trì sự đồng bộ: nếu thay đổi tốc độ trượt của Panel mà quên cập nhật tốc độ dịch chuyển của văn bản, giao diện sẽ bị "rời rạc".

---

## Các lựa chọn đã cân nhắc

### Option 1: Giữ nguyên giá trị Hard-coded
- **Ưu:** Triển khai nhanh, không cần sửa file token hệ thống.
- **Nhược:** Khó bảo trì, dễ mất đồng bộ giữa các module, vi phạm nguyên tắc "Single Source of Truth".

### Option 2: Sử dụng Token Tier 1 (Primitives) trực tiếp
- **Ưu:** Sử dụng các giá trị thô có sẵn như `--ds-space-3xl`.
- **Nhược:** Thiếu ngữ nghĩa (semantic). Không rõ tại sao lại dùng `2xl` cho TOC. Nếu muốn đổi riêng TOC mà không đổi các thành phần dùng `2xl` khác sẽ rất khó.

### Option 3: Tạo Semantic Tokens (Tier 3)
- **Ưu:** Có ý nghĩa rõ ràng (`--ds-toc-width`, `--ds-transition-slow`). Dễ dàng thay đổi toàn bộ hành vi của một module tại một nơi duy nhất. Đảm bảo sự đồng bộ tuyệt đối giữa các module liên quan.
- **Nhược:** Cần thêm bước định nghĩa token vào `tokens.css`.

---

## Quyết định

**Chọn: Option 3 — Tạo Semantic Tokens (Tier 3)**

Chúng ta tuân thủ kiến trúc 3 tầng (3-tier) của hệ thống Design Tokens. Việc tạo ra các token đặc thù cho TOC (`--ds-toc-*`) và các chuyển động cao cấp (`--ds-transition-spring`) giúp module TOC trở nên linh hoạt, chuyên nghiệp và dễ dàng tinh chỉnh thẩm mỹ trong tương lai mà không sợ phá vỡ logic của các phần khác.

---

## Hệ quả

**Tích cực:**
- Đồng bộ hoàn hảo giữa hiệu ứng Slide-in và hiệu ứng đẩy nội dung văn bản.
- Code CSS sạch sẽ, dễ đọc, mang tính khai báo (declarative).
- Khả năng tùy biến cao: chỉ cần sửa 1 dòng trong `tokens.css` để thay đổi toàn bộ layout TOC.

**Tiêu cực / Trade-off:**
- Làm tăng số lượng biến CSS trong `tokens.css`.

**Constraint tương lai:**
- Mọi thành phần Overlay mới (như Right Sidebar hoặc Info Panel) nên cân nhắc sử dụng lại `--ds-transition-slow` và `--ds-transition-spring` để đảm bảo trải nghiệm chuyển động thống nhất toàn ứng dụng.

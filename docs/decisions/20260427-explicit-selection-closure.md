# Explicit Selection Closure Strategy

**Date:** 2026-04-27
**Status:** accepted
**Author:** session 2026-04-27

---

## Bối cảnh

Hệ thống Tab của MDpreview có tính năng "Ghim" (Pin) để bảo vệ các tài liệu quan trọng. Ban đầu, các tab này được thiết kế để "miễn nhiễm" với mọi lệnh đóng hàng loạt nhằm tránh mất dữ liệu vô tình.

Tuy nhiên, trong quá trình sử dụng, việc chặn hoàn toàn lệnh đóng khi người dùng đã chủ động chọn (Select) tab đó gây ra trải nghiệm khó chịu. Người dùng kỳ vọng rằng nếu họ đã mất công chọn một đối tượng và nhấn lệnh đóng, ứng dụng phải thực hiện lệnh đó thay vì im lặng bỏ qua.

---

## Các lựa chọn đã cân nhắc

### Option 1: Giữ nguyên tính năng bảo vệ tuyệt đối
- **Ưu:** An toàn nhất cho dữ liệu quan trọng.
- **Nhược:** Gây ức chế cho người dùng (friction); cảm giác ứng dụng "không phản hồi" đúng ý đồ.

### Option 2: Cho phép đóng Tab Ghim trong mọi trường hợp (Hủy bỏ tính Resilience)
- **Ưu:** Đơn giản hóa logic.
- **Nhược:** Làm mất đi giá trị cốt lõi của tính năng Pin (vô tình đóng file quan trọng khi dùng lệnh "Close All").

### Option 3: Phân tách giữa lệnh "Quét rác" và lệnh "Hành quyết" có chủ đích
- **Ưu:** Giữ được sự an toàn cho các lệnh đóng tự động/hàng loạt (`Close All`, `Close Others`) nhưng vẫn tôn trọng ý chí của người dùng khi họ chọn cụ thể (`Close Selected`).
- **Nhược:** Logic xử lý đóng tab cần phân biệt giữa các loại lệnh khác nhau.

---

## Quyết định

**Chọn: Option 3 — Phân tách giữa lệnh "Quét rác" và lệnh "Hành quyết" có chủ đích**

Chúng ta quyết định rằng **Sự lựa chọn (Selection) là biểu hiện cao nhất của chủ đích người dùng**. Khi một tab đã được chọn, thuộc tính "Ghim" chỉ nên đóng vai trò là một trạng thái hiển thị, không nên là rào cản ngăn chặn lệnh đóng trực tiếp. Điều này cân bằng giữa tính an toàn (Resilience) và tính tiện dụng (Utility).

---

## Hệ quả

**Tích cực:**
- Cải thiện UX đáng kể, ứng dụng phản hồi đúng kỳ vọng của người dùng.
- Giảm bớt thao tác thừa (không cần unpin trước khi close selected).

**Tiêu cực / Trade-off:**
- Người dùng có thể vô tình đóng tab ghim nếu họ chọn nhầm trong một dải chọn (Shift+Click). Tuy nhiên, rủi ro này chấp nhận được vì hành động Chọn vẫn là hành động chủ động.

**Constraint tương lai:**
- Lệnh `closeSelected()` **PHẢI** đóng mọi file trong vùng chọn, không được filter.
- Các lệnh `closeAll()` và `closeOthers()` **PHẢI** tiếp tục bảo vệ (filter) các tab ghim để duy trì tính an toàn cốt lõi.

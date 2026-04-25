# Layout Refactor for Tab Space Optimization

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Trong các phiên bản trước, các nút điều khiển hệ thống (Settings, Shortcuts) và các nút điều khiển Explorer (Preferences) được đặt tập trung tại thanh Header/Tab Bar. Khi người dùng mở nhiều tab, không gian này trở nên cực kỳ chật chội, dẫn đến việc các tab bị bóp nhỏ hoặc nút bấm bị đè lên nhau.

Cần một chiến lược phân bổ layout mới để:
1. Tối ưu không gian cho nội dung chính (Markdown viewer) và danh sách Tab.
2. Phân tách rõ ràng giữa "Điều khiển Ứng dụng" và "Điều khiển Văn bản".

---

## Các lựa chọn đã cân nhắc

### Option 1: Tiếp tục duy trì tất cả hành động tại Header
- **Ưu:** Người dùng chỉ cần nhìn vào một hàng ngang duy nhất để tìm mọi nút bấm.
- **Nhược:** Gây clutter (lộn xộn) khi mở nhiều tab. Không chuyên nghiệp khi ứng dụng mở rộng tính năng.

### Option 2: Di chuyển hành động hệ thống xuống Sidebar Footer
- **Ưu:** Giải phóng 100% chiều ngang Header cho Tabs. Tuân thủ UX pattern của các IDE hiện đại (như VS Code). Nhóm các hành động bổ trợ (Settings, Shortcuts) vào vùng "ít tương tác hơn" để ưu tiên vùng "tương tác chính".
- **Nhược:** Người dùng cũ có thể mất một thời gian để làm quen với vị trí mới ở góc dưới trái.

---

## Quyết định

**Chọn: Option 2 — Di chuyển hành động hệ thống xuống Sidebar Footer**

Quyết định này nhằm ưu tiên trải nghiệm "Document-first". Việc đẩy các nút Settings và Shortcuts xuống footer của Sidebar Trái giúp thanh Tab Bar trở thành một vùng thuần túy để quản lý các tệp đang mở, mang lại cảm giác thoáng đãng và chuyên nghiệp.

---

## Hệ quả

**Tích cực:**
- Thanh Header giờ đây có thể chứa số lượng tab nhiều gấp đôi trước khi bị tràn.
- Giao diện Sidebar trở nên cân bằng hơn (có đầu có cuối).
- Phân tách logic: Footer = App Control, Header = Document Control.

**Tiêu cực / Trade-off:**
- Các hành động này giờ đây phụ thuộc vào việc Sidebar Trái đang mở. Nếu sidebar bị đóng hoàn toàn, người dùng cần dùng phím tắt hoặc mở lại sidebar để truy cập Settings.

**Constraint tương lai:**
- Không được thêm các nút điều khiển App-level vào thanh Tab Bar nữa.
- Mọi cài đặt nhanh liên quan đến module nên được đặt dưới dạng menu nổi (Floating Menu) ngay tại module đó thay vì đưa lên Header.

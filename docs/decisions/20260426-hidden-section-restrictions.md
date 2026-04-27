# Restricted Operations in Hidden Section

**Date:** 2026-04-26
**Status:** accepted
**Author:** session 2026-04-26

---

## Bối cảnh

Vùng "Hidden from Tree" được thiết kế để chứa các tệp tin mà người dùng muốn tạm thời ẩn đi khỏi luồng làm việc chính. Nếu cho phép đầy đủ các thao tác như "New File", "New Folder" hay "Import" trực tiếp vào vùng này, sẽ dẫn đến sự mâu thuẫn về UX: tệp tin vừa tạo ra sẽ ở trạng thái "bị ẩn" ngay lập tức, khiến người dùng bối rối không biết tệp mình vừa tạo nằm ở đâu trong cây thư mục thực tế.

---

## Các lựa chọn đã cân nhắc

### Option 1: Cho phép đầy đủ tính năng như vùng All Files
- **Ưu:** Tính nhất quán về mặt tính năng giữa các section.
- **Nhược:** Gây nhầm lẫn nghiêm trọng về vị trí lưu trữ file thực tế. Người dùng khó quản lý được file đó thuộc folder nào nếu nó được tạo trong một danh sách phẳng (flat list) của Hidden section.

### Option 2: Chặn các thao tác tạo mới và di chuyển vào (Restrict to Manage-only)
- **Ưu:** Luồng dữ liệu cực kỳ minh bạch. Mọi file mới phải được tạo từ cây chính (All Files) rồi mới được ẩn đi.
- **Nhược:** Người dùng phải mất thêm một bước (Tạo ở All Files -> Kéo xuống Hidden) nếu muốn giấu một file mới.

---

## Quyết định

**Chọn: Option 2 — Chặn các thao tác tạo mới và di chuyển vào**

Chúng ta ưu tiên sự minh bạch của cấu trúc thư mục. Vùng Hidden chỉ nên đóng vai trò là "View Filter" chứ không phải là một "Workspace" thứ hai. Việc chặn "New File/Folder/Import" tại đây đảm bảo người dùng luôn biết rõ vị trí vật lý của file trước khi quyết định ẩn nó.

---

## Hệ quả

**Tích cực:**
- Tránh tình trạng file "mồ côi" (không rõ folder cha) khi được tạo từ vùng Hidden.
- UI của vùng Hidden trở nên sạch sẽ, tập trung vào nhiệm vụ duy nhất là quản lý danh sách file ẩn.

**Tiêu cực / Trade-off:**
- Giảm đi một chút tính tiện dụng đối với những người dùng muốn import thẳng vào vùng ẩn.

**Constraint tương lai:**
- Menu ngữ cảnh (Context Menu) và Header của vùng Hidden PHẢI luôn được đồng bộ để không hiển thị các action liên quan đến tạo mới dữ liệu.

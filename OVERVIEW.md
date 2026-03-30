# MDpreview — Project Overview & Roadmap

## 📝 Giới thiệu chung
**MDpreview** là một ứng dụng Desktop (Electron) được thiết kế đặc biệt để tối ưu hóa việc đọc, đánh giá và phản hồi các nội dung Markdown, đặc biệt là các đề xuất dài từ AI. 

Mục tiêu cốt lõi của ứng dụng là **"Đơn giản hóa mọi cuộc hội thoại với AI"** bằng cách tạo ra một môi trường trung gian hoàn hảo để Review trước khi đưa ra quyết định cuối cùng.

---

## 🛠 Hiện trạng Kỹ thuật (Tech Stack)
- **Core:** Electron.js (Đảm bảo hiệu năng và truy cập file hệ thống cục bộ).
- **Frontend:** Vanilla Javascript & CSS (Tối ưu tốc độ, không phụ thuộc framework nặng).
- **UI/UX:** Phong cách **Glassmorphism** (kính mờ), hỗ trợ Dark Mode, Accent Color tùy chỉnh và hiệu ứng Micro-animations.
- **Markdown Engine:** Marked.js kết hợp với Mermaid.js (vẽ sơ đồ).
- **Real-time:** Tích hợp Socket.io để hỗ trợ **Hot Reload** (tự động cập nhật nội dung khi file nguồn thay đổi).

---

## 🚀 Các tính năng Hiện có (Current Features)

### 1. Quản lý Workspace & File
- **Multi-Workspace:** Kết nối với nhiều thư mục local khác nhau.
- **File Explorer:** Cấu trúc cây thư mục (Tree view) mượt mà, hỗ trợ tìm kiếm file nhanh.
- **Recently Viewed:** Lưu lại các file vừa đọc để truy cập nhanh.

### 2. Trải nghiệm Đọc & Preview
- **High-quality Rendering:** Hiển thị Markdown chuẩn xác, hỗ trợ Code Highlight và Sơ đồ Mermaid.
- **Zoom & Fullscreen:** Chế độ xem ảnh phóng to và toàn màn hình để tập trung tối đa.
- **Hot Reload:** Cực kỳ hữu ích khi bạn đang dùng một công cụ khác để ghi file MD, ứng dụng sẽ cập nhật ngay lập tức.

### 3. Hệ thống Phản hồi (Commenting System) — *Trọng tâm của Project*
- **Contextual Commenting:** Cho phép bôi đen đoạn văn bản và để lại bình luận ngay tại dòng đó.
- **Comment Sidebar:** Quản lý toàn bộ danh sách feedback ở cánh phải.
- **"Copy All" Logic:** Tổng hợp toàn bộ bình luận thành một cấu trúc Markdown chuyên nghiệp để dán ngược lại cho AI (Claude/GPT).

### 4. Chế độ AI Response (AI Mode)
- Một khu vực riêng biệt để paste nhanh nội dung AI vừa trả về mà không cần lưu thành file chính thức.
- Hỗ trợ xem trước (Preview) nội dung nháp một cách nhanh chóng.

### 5. Cá nhân hóa (Customization)
- Thay đổi **Accent Color** (màu nhấn chủ đạo).
- Tùy chỉnh **Background Image** (hỗ trợ Glassmorphism cực đẹp).

---

## 🏗 Hướng phát triển tiếp theo (Roadmap & Ideas)
Chúng ta đã lưu lại 4 Issue chiến lược trên GitHub để nâng tầm workflow:

### 🟢 Giai đoạn 1: Tối ưu hóa việc thu thập (Snippet Tray)
- Triển khai **"Khay chứa ý tưởng"**: Cho phép ghim (pin) các đoạn code hoặc ý hay của AI vào một danh sách riêng mà không cần viết comment. Giúp bạn nhặt ra những "viên ngọc" giữa một rừng văn bản.

### 🟡 Giai đoạn 2: Nâng cấp ngữ cảnh (Smart Context)
- Tự động bọc (wrap) 1-2 dòng nội dung xung quanh phần bạn comment khi export. Giúp AI hiểu ngay bạn đang sửa lỗi ở đâu mà không cần phải giải thích lại "Ở đoạn này... ở câu kia...".

### 🟠 Giai đoạn 3: Điều hướng trực quan (Review Heatmap)
- Tạo một bản đồ mini ở lề trang, hiển thị những vùng nào đã có comment, vùng nào chưa đọc. Rất quan trọng khi xử lý các file đề xuất dài hàng nghìn chữ.

### 🔴 Giai đoạn 4: Tổng hợp Prompt (AI Prompt Generator)
- Biến MDpreview thành một "Trạm phóng prompt". Nó sẽ tự động soạn thảo một câu lệnh hoàn chỉnh bao gồm tất cả Feedback + Snippets bạn đã chọn, định dạng sẵn cho LLMs để bạn chỉ cần 1-click là xong việc.

---

## 🎯 Triết lý thiết kế (Design Philosophy)
> **"Aesthetics are not an option, they are a requirement."**
> 
Ứng dụng không chỉ tập trung vào tính năng mà còn phải mang lại cảm giác **Premium**. Mọi tương tác từ việc mở Sidebar, kéo thả Comment Box cho đến hiệu ứng bóng đổ (Shadow) đều được tỉ mỉ hóa để người dùng cảm thấy "đã" khi làm việc.

---
*Cập nhật lần cuối: 30/03/2026*

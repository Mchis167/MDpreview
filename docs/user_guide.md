Tôi đã tạo một hướng dẫn chi tiết (User Guide) để bạn có thể thực hiện việc deploy và cấu hình hệ thống Publish mới một cách chuẩn xác nhất.

> [!IMPORTANT]
> Tài liệu hướng dẫn chi tiết: [CF Publish Engine Deployment Guide](file:///Users/mchisdo/MDpreview/docs/user_guide.md)

### 📌 Các điểm chính trong hướng dẫn:
1.  **Quy trình Wrangler**: Từng câu lệnh từ `install` -> `login` -> `kv` -> `secret` -> `deploy`.
2.  **Cấu hình MDpreview**: Cách kết nối App với Worker vừa tạo.
3.  **Xác minh**: Các bước kiểm tra để đảm bảo hệ thống hoạt động hoàn hảo.

---

### 📄 Nội dung Hướng dẫn (Artifact)

```markdown
---
title: Hướng dẫn Triển khai Self-Hosted Publish Engine
created: 2026-04-30
status: completed
---

# Hướng dẫn Triển khai Cloudflare Worker Publish

Tài liệu này hướng dẫn chi tiết các bước để deploy hệ thống xuất bản (Publish Engine) của riêng bạn lên Cloudflare và tích hợp nó vào MDpreview.

## 🎯 Mục tiêu
- Tự chủ hoàn toàn hạ tầng lưu trữ tài liệu.
- Tối ưu hiệu năng hiển thị và bảo mật.
- Hỗ trợ render Mermaid và Highlight.js tại Edge.

## 📋 Bước 1: Triển khai Worker

Mở Terminal và thực hiện các lệnh sau:

### 1.1 Di chuyển vào thư mục Worker
```bash
cd /Users/mchisdo/MDpreview/cf-publish-worker
npm install
```

### 1.2 Đăng nhập Cloudflare
```bash
npx wrangler login
```

### 1.3 Khởi tạo bộ nhớ lưu trữ (KV Namespace)
```bash
npx wrangler kv:namespace create PUB_STORE
```
> [!NOTE]
> Sau khi chạy lệnh này, bạn sẽ nhận được một đoạn mã `id = "..."`. Hãy copy ID này và dán vào file `wrangler.toml` trong thư mục `cf-publish-worker`.

### 1.4 Thiết lập mật khẩu quản trị (Admin Secret)
Lệnh này tạo mật khẩu để App của bạn có quyền ghi dữ liệu lên Worker:
```bash
npx wrangler secret put ADMIN_SECRET
```
*Nhập mật khẩu bạn tự chọn và hãy ghi nhớ nó.*

### 1.5 Deploy lên Cloudflare
```bash
npm run deploy
```
Sau khi hoàn tất, bạn sẽ nhận được URL của Worker (ví dụ: `https://mdpreview-publish.username.workers.dev`).

## 📋 Bước 2: Cấu hình trên MDpreview

1. Mở ứng dụng **MDpreview**.
2. Truy cập **Settings** -> nhấn nút **Config Publish**.
3. Điền thông tin:
   - **Worker URL**: Nhập URL nhận được ở bước 1.5 (ví dụ: `https://mdpreview-publish.username.workers.dev/publish`).
   - **Admin Secret**: Nhập mật khẩu bạn đã đặt ở bước 1.4.
4. Nhấn **Save Configuration**.

## 📋 Bước 3: Kiểm tra & Xác minh

1. Chọn một tài liệu Markdown bất kỳ trong App.
2. Nhấn biểu tượng **Cloud** (Publish) trên thanh công cụ.
3. Xác nhận dòng chữ *"Self-hosted Worker active"* hiển thị trong form.
4. Nhấn **Publish Now**.
5. App sẽ trả về một link (URL). Hãy mở link này trên trình duyệt để tận hưởng kết quả.

## ⚠️ Lưu ý quan trọng
- **Bảo mật**: Tuyệt đối không chia sẻ `Admin Secret` cho người khác.
- **KV ID**: Nếu bạn xóa KV trên Dashboard Cloudflare, bạn phải tạo lại và cập nhật ID mới vào `wrangler.toml`.
- **CSS**: Nếu bạn muốn thay đổi giao diện trang publish, hãy chỉnh sửa file `public/publish.css` trong thư mục Worker và chạy lại `npm run deploy`.

---
**Last updated:** 2026-04-30
```
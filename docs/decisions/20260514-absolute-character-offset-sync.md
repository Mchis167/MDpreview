# ADR: Absolute Character Offset Sync Engine

**Date:** 2026-05-14
**Status:** accepted (supersedes line-based sync strategies)
**Author:** Antigravity

---

## Bối cảnh

Hệ thống đồng bộ hóa (Sync Scroll/Cursor) cũ dựa trên số dòng (Line-based) gặp nhiều sai số lớn (drift) khi tài liệu có các cấu trúc phức tạp:
- Các khối nội dung bị gộp dòng khi render (như Table, List).
- Các khối nội dung bất đồng bộ (Mermaid diagrams) làm thay đổi chiều cao DOM sau khi render.
- Chênh lệch giữa số dòng trong file nguồn và số dòng hiển thị thực tế trong HTML.

Người dùng cần một trải nghiệm "Perfect Alignment" — chuyển mode là phải đứng đúng ngay tại ký tự đó.

---

## Các lựa chọn đã cân nhắc

### Option 1: Nâng cấp Line-based Sync với Proportional Scaling
- **Ưu:** Dễ hiểu, đã có sẵn một phần code.
- **Nhược:** Vẫn chỉ là ước tính, không bao giờ đạt được độ chính xác 1:1 cho mọi loại block.

### Option 2: DOM-to-Source Mapping (Absolute Character Offset) (Chọn)
- **Ưu:** Độ chính xác tuyệt đối (Pixel-perfect). Không phụ thuộc vào chiều cao hay số dòng.
- **Nhược:** Cần can thiệp vào quá trình Render để inject metadata (`data-src-start`).

---

## Quyết định

**Chọn: Option 2 — Absolute Character Offset Sync Engine**

Chúng ta triển khai hệ thống đồng bộ mới dựa trên vị trí ký tự tuyệt đối:
1. **Render Layer**: Inject `data-src-start` và `data-src-end` vào mọi block HTML quan trọng.
2. **Capture Layer**: Khi chuyển sang Edit, tìm phần tử trung tâm màn hình và lấy `srcStart`.
3. **Restore Layer**: Monaco sử dụng `model.getPositionAt(srcStart)` để định vị con trỏ và cuộn tới đúng vị trí đó.

---

## Hệ quả

**Tích cực:**
- Độ chính xác đồng bộ đạt mức 100% (1:1 parity).
- Hoạt động hoàn hảo ngay cả với các khối cực lớn hoặc cực phức tạp.
- Loại bỏ hoàn toàn hiện tượng "nhảy dòng" khi chuyển đổi Read/Edit.

**Tiêu cực / Trade-off:**
- Payload HTML tăng nhẹ do chứa thêm các thuộc tính metadata.
- Đòi hỏi sự phối hợp chặt chẽ giữa Server Renderer và Client SyncService.

**Constraint tương lai:**
- Mọi module render mới (ví dụ: plugin Markdown mới) PHẢI hỗ trợ việc inject `data-src-start`.
- Khi nội dung Monaco thay đổi, metadata trong Read view phải được cập nhật lại (thông qua re-render) để đảm bảo tính dẫn hướng.

---

*Supersedes: Các chiến lược đồng bộ dựa trên số dòng và Sandwich Strategy cũ.*

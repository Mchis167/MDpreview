# Design Token Provider (`renderer/js/services/design-token-provider.js`)

> Service cung cấp quyền truy cập lập trình vào hệ thống Design Tokens của ứng dụng.

---

## Mục đích

`DesignTokenProvider` là cầu nối giữa hệ thống CSS (Tiered Tokens) và các module JavaScript cần giá trị cụ thể của token (như Monaco Editor hoặc luồng Xuất bản tài liệu). Nó đảm bảo tính nhất quán của giao diện (UI Parity) bằng cách sử dụng chung một "nguồn sự thật" (Single Source of Truth).

---

## Kiến trúc Token 3 cấp (3-Tier)

Service này phản chiếu cấu trúc được định nghĩa trong `tokens.css`:

1. **Tier 1 — Primitives**: Các giá trị thô như mã màu Hex, thang đo khoảng cách (`sm`, `md`, `lg`), và fonts.
2. **Tier 2 — Alpha Palette**: Các biến thể màu sắc có độ trong suốt (White/Black alpha).
3. **Tier 3 — Semantic**: Các token có ý nghĩa sử dụng (ví dụ: `--ds-bg-base`, `--ds-text-primary`, `--ds-accent`).

---

## Key Functions

### `getToken(tokenName)`
Lấy giá trị của một token cụ thể (ví dụ: `getToken('--ds-accent')`).

### `generateInlineStyles()`
Trả về một chuỗi CSS chứa toàn bộ định nghĩa biến. Được `PublishService` sử dụng để nhúng trực tiếp vào các file HTML standalone, giúp bản xuất bản có giao diện giống hệt ứng dụng gốc mà không cần load file CSS bên ngoài.

### `validateTokens()`
Kiểm tra tính nhất quán giữa các token được định nghĩa trong JavaScript và các giá trị thực tế đang được nạp vào DOM.

---

## Trường hợp sử dụng chính

### 1. Cấu hình Monaco Theme
Monaco không hỗ trợ biến CSS trực tiếp trong engine theme của nó. `MonacoService` sử dụng `DesignTokenProvider` để lấy mã màu Hex từ các semantic tokens và nạp vào `defineTheme`.

### 2. Standalone Publishing
Khi người dùng "Copy as HTML", `DesignTokenProvider` cung cấp toàn bộ hệ thống màu sắc và font chữ để nhúng vào thẻ `<style>`, đảm bảo tài liệu hiển thị đúng ngay cả khi ngoại tuyến.

### 3. Đồng bộ hóa Layout
Được sử dụng để đảm bảo các thành phần UI phức tạp (như Project Map) có cùng thông số `padding` và `width` với vùng soạn thảo chính thông qua các layout tokens.

---

*Document — 2026-05-14*

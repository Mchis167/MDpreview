# Architectural Decision Record: Sidebar Selection Persistence

**Date**: 2026-04-26
**Status**: Accepted
**Context**: Sidebar Selection Behavior

## Context
Trong các phiên bản trước, Sidebar sử dụng cơ chế "Aggressive Deselection": khi người dùng click vào bất kỳ vùng trống nào trong Sidebar (không phải item hoặc safe zone), toàn bộ selection sẽ bị xóa.

## Decision
Chúng tôi quyết định **giữ nguyên** cơ chế này.

## Rationale
1. **Selection Visibility**: Nếu không có cơ chế "click-to-deselect", selection có thể bị kẹt lại vô thời hạn nếu người dùng không thực hiện một thao tác chọn mới. Điều này gây khó chịu và nhầm lẫn về trạng thái hiện tại.
2. **Intentionality**: Thao tác click vào vùng trống được coi là một hành động có chủ đích của người dùng để "làm sạch" trạng thái hiện tại của sidebar trước khi bắt đầu một chuỗi hành động mới.
3. **Consistency**: Đây là hành vi tiêu chuẩn trong nhiều trình quản lý tệp tin (như macOS Finder hoặc VS Code khi click vào vùng trống của Explorer).

## Consequences
- Người dùng cần cẩn thận hơn khi click vào các khoảng trống hẹp giữa các item nếu muốn giữ selection (nhưng behavior này được coi là chấp nhận được đổi lại tính rõ ràng của state).
- Các thành phần UI mới trong Sidebar (như headers) cần được xử lý để không vô tình kích hoạt deselect nếu không cần thiết.

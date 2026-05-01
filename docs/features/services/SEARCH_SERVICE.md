# Search Service (`renderer/js/services/search-service.js`)

> Bộ não tìm kiếm fuzzy search thông minh, chịu trách nhiệm tính toán điểm số (scoring) và xếp hạng kết quả tìm kiếm file/folder.

---

## Tính năng chính

- **Fuzzy Matching**: Tìm kiếm linh hoạt, cho phép sai sót nhỏ hoặc tìm theo ký tự không liên tục.
- **Scoring Engine**: Thuật toán tính điểm dựa trên độ chính xác (Exact > Prefix > Substring > Fuzzy).
- **Weighting**: Ưu tiên khớp tên file (trọng số x2) hơn là khớp đường dẫn (trọng số x1).
- **Folder Support**: Hỗ trợ tìm kiếm và lọc cả tập tin và thư mục.
- **Semantic Shortcut Search**: Hỗ trợ tìm kiếm lệnh thông qua từ khóa đồng nghĩa (tags), cho phép người dùng tìm thấy chức năng ngay cả khi không nhớ tên chính xác.

---

## Thuật toán Scoring (`_score`)

Hệ thống tính điểm theo thang điểm ưu tiên giảm dần:

1.  **Exact Match (1000 pts)**: Query khớp hoàn toàn với target.
2.  **Prefix Match (800 pts)**: Target bắt đầu bằng query.
3.  **Substring Match (600 pts)**: Target chứa query.
4.  **Fuzzy Match**: Tính điểm theo từng ký tự:
    - Khớp ký tự: +20 pts.
    - Khớp liên tục: +50 pts bonus.
    - Khớp ở đầu từ hoặc sau dấu phân cách (`/`, `-`, `_`): +30 pts bonus.
    - Khoảng cách giữa các ký tự (Gap): -2 pts penalty.

---

## Key Functions

### `search(query, treeData, filterType)`
Hàm public chính để thực hiện tìm kiếm file/folder.
- **Flattening**: Chuyển đổi cấu trúc cây (`treeData`) thành danh sách phẳng để duyệt nhanh.
- **Filtering**: Lọc kết quả theo `filterType` (`all`, `file`, hoặc `directory`).
- **Ranking**: Sắp xếp kết quả theo `searchScore` giảm dần. Nếu điểm bằng nhau, ưu tiên File lên trước Directory.
- **Limit**: Trả về tối đa 10 kết quả tốt nhất để đảm bảo hiệu suất hiển thị.

### `searchShortcuts(query)`
Hàm chuyên dụng để tìm kiếm phím tắt.
- **Data Source**: Lấy dữ liệu phím tắt từ `ShortcutsComponent.getShortcutData()`.
- **Hybrid Scoring**: Tính toán điểm số kết hợp giữa nhãn (`label`) và danh sách từ khóa (`tags`).
- **Weighting**: Khớp với `label` được nhân đôi trọng số (x2) để ưu tiên kết quả chính xác lên đầu.
- **Grouping**: Kết quả trả về bao gồm thông tin nhóm (group) để hiển thị phân loại.

---

## Ví dụ sử dụng

```javascript
const results = SearchService.search('app.js', treeData, 'file');
const shortcuts = SearchService.searchShortcuts('save');
```

---

*Document — 2026-04-27 22:34*

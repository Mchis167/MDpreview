# Continue Edit

## Mục tiêu
Tại home screen, chúng ta sẽ bổ xung thêm một section tên là "Continue Edit", mục đích của nó để hiển thị danh sách các tab đang mở với mode là edit trên tab bar. Các tab sẽ được sắp xếp theo thời gian chỉnh sửa giảm dần. Khi click vào một tab, nó sẽ chuyển sang tab đó để user tiếp tục edit.

## Nội dung hiển thị
Một section tại home vưới UI grid view 4 columns.
Mỗi ô hiển thị thông tin của một tab:
- Tên File: Limit line = 1 line, nếu tên file dài quá thì cắt ngắn và thêm dấu "...", tên file chỉ cần hiển thị file name, không cần hiển thị extension
- Last edit: thể hiện theo dạng "x phút trước", "x giờ trước", "x ngày trước"
  
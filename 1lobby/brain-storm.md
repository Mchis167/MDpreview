# The publish image management system
---

## Vấn dề
Hiện tại hệ thống asset management đã dược hoàn thiện tương đối ổn đối với app local rồi. Tuy nhiên với một tài liệu được publish lên worker, chúng ta vẫn đang tham chiếu về local image, điều này dẫn đên image sẽ không được render. Vì vậy chúng ta cần phải có một cơ chê để khi publish tài liệu, image cũng được upload theo

## Yêu cầu
Hệ thống asset publish này phải dễ dàng quản lý, được liên kết chặt chẽ với tài liệu, và phải có phương pháp để giảm thiẻu tiêu tốn tài nguyên. Bên cạnh đó vòng đời của image store này cũgn càn gắn chặt với tài liệu. Ví dụ tài liệu bị xoá / bị unpublish thì các image cũng cần tuân thủ vòng đời này, tránh dẫn đến image mồ côi trong kho hình ảnh.

## Mục tiêu
Tạo ra một hệ thống quản lý, miễn phí, hiệu quả để có thể dễ dàng quản lý hệ thống hình ảnh và tài liệu khi publish
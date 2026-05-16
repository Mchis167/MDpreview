# Z-index symtem revamp
---
## Vấn đề
hiện tại UI của app đang sử dụng z-index theo cơ chế 1 chiều, các component được render theo thứ tự sẽ có z-index cao hơn các component được render trước nó

Điều này đôi khi dẫn đến đề dynamic z-index, tức là có thể z-index đó sẽ đúng trong trường hợp này nhưng lại bị lệch trong trường hợp khác

Ngoài ra hiện tại dù đã có một một z-index senmantic nhưng trên thực tế việc apapt đang rất hỗn loạn, mỗi component lại tự set một z-index cho riêng nó nên rất khó kiểm soát và bảo trì, dẫn đến các ui bug các element đè lên nhau về mặt thị giác.

## Yêu cầu
- Audit lại toàn bộ các nơi sử dụng z-index trong dự án, xây dựng một bối cảnh chung trong việc sử dụng z-index từ đó xây dựng một hệ thống z-index hoàn chỉnh, dễ bảo trì
- Xây dựng và adapt lại vào magic z index number hiện tại 
- Đề xuất phương án dynamic z-index thích ứng trong một số trường hợp cụ thể
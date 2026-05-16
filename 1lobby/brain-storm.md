# Sync scroll Fix

## Vấn đề
Hiện tại hệ thống sync cursor giữa read và edit mode đã tương đối hoàn chỉnh, nhưng nó vẫn có những điểm chưa ổn định. Về bản chất nó đã có thể sycn chuẩn chỉnh vị trí trong cacs case rồi, tuy nhiên trong một vài trường hợp, có sự sai lệch giữa cursor và thanh cuộn, tức là nó đã tìm đúng dòng rồi và để con trỏ ở đó rồi, nhưng thanh cuộn lại chưa cuộn đến dòng đó, hoặc không scroll đến vị trí dự kiến. Tôi đoán là có conflict nào đó trong lúc đang scroll gây ra lỗi. 

## Mục tiêu
Đưa scroll sync ổn đinh trong mọi trường hợp
#!/bin/bash

# Tự động tìm thư mục chứa file này và di chuyển vào thư mục gốc của dự án
cd "$(dirname "$0")/.."

# Thực thi script rebuild nằm trong thư mục scripts
echo "--------------------------------------------------------"
echo "🛠️ ĐANG TỰ ĐỘNG REBUILD MDPREVIEW..."
echo "--------------------------------------------------------"

./scripts/rebuild.sh

# Giữ cửa sổ terminal mở để bạn có thể xem kết quả
echo ""
echo "✨ Xong rồi! Bạn có thể đóng cửa sổ này và mở MDpreview.app được rồi đó."
read -p "Ấn phím bất kỳ để thoát..." -n1 -s
echo ""

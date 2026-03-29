#!/bin/bash
echo "🚀 Đang bắt đầu quá trình rebuild MDpreview..."

# Đảm bảo scripts dừng lại nếu có lỗi
set -e

# Cài đặt dependencies (nếu có thay đổi)
echo "📦 Đang kiểm tra thư viện..."
npm install

# (Tailwind CSS hiện được render qua CDN trong ứng dụng để đảm bảo hiệu quả tối đa)

# Xây dựng lại ứng dụng (chế độ build:dir để nhanh hơn bản DMG)
echo "🏗️ Đang build lại ứng dụng .app..."
npm run build:dir

echo "--------------------------------------------------------"
echo "✅ HOÀN TẤT! Bản build mới nhất đã sẵn sàng tại:"
echo "📂 dist/mac-arm64/MDpreview.app"
echo "--------------------------------------------------------"
echo "💡 Bạn có thể chạy ứng dụng từ thư mục trên để kiểm tra tính năng comment."

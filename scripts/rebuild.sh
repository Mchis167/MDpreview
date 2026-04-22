#!/bin/bash
# Move to the project root directory
cd "$(dirname "$0")/.."

# Rebuild log for troubleshooting
LOG_FILE="logs/rebuild.log"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "--------------------------------------------------------"
echo "🚀 NEW REBUILD JOB: $(date)"
echo "--------------------------------------------------------"

# Đảm bảo scripts dừng lại nếu có lỗi
set -e

# Cài đặt dependencies (nếu có thay đổi)
echo "📦 1/3: Installing dependencies..."
npm install

# Xây dựng lại ứng dụng (chế độ build:dir để nhanh hơn bản DMG)
echo "🏗️ 2/3: Building application (.app)..."
npm run build:dir

echo "✅ 3/3: Rebuild complete!"
echo "📂 Locate: dist/mac*/MDpreview.app"

# Tự động mở lại
echo "🚀 Restarting MDpreview..."
# Detect ARM vs Intel path
APP_PATH=$(ls -d dist/mac*/*.app | head -n 1) || true
if [ -n "$APP_PATH" ]; then
  open "$APP_PATH"
else
  echo "❌ Error: Could not find built app in dist folder."
fi

echo "--------------------------------------------------------"

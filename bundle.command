#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Đang đóng gói Codebase cho AI..."
node scripts/bundle-for-ai.js
echo ""
echo "✅ Hoàn tất! Nhấn phím bất kỳ để đóng cửa sổ này."
read -n 1

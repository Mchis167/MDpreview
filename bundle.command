#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Đang đóng gói Codebase cho AI..."
echo ""

if [ ! -f "scripts/bundle-for-ai.js" ]; then
    echo "❌ Lỗi: Không tìm thấy scripts/bundle-for-ai.js"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo "❌ Lỗi: Node.js không được cài đặt"
    exit 1
fi

node scripts/bundle-for-ai.js
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ Hoàn tất! File đã được đóng gói thành công."
else
    echo "❌ Lỗi: Quá trình đóng gói thất bại (exit code: $EXIT_CODE)"
    exit $EXIT_CODE
fi

echo ""
echo "Nhấn Enter để đóng cửa sổ..."
read -r

#!/bin/bash

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Đang khởi động MDpreview (dev)..."
echo ""

if ! command -v npm &> /dev/null; then
    echo "❌ Lỗi: npm không được cài đặt"
    exit 1
fi

# Đóng instance MDpreview đang chạy (kể cả bản đã build) để tránh
# xung đột singleInstanceLock với bản dev sắp mở.
pkill -f "MDpreview.app/Contents/MacOS/MDpreview" 2>/dev/null || true
pkill -f "electron \." 2>/dev/null || true
sleep 1

npm run dev
EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -ne 0 ]; then
    echo "❌ Lỗi: MDpreview thoát với mã lỗi $EXIT_CODE"
fi

echo ""
echo "Nhấn Enter để đóng cửa sổ..."
read -r

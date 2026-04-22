#!/bin/bash

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "🚀 Starting MDpreview Server..."

# Kill any process running on port 3737 to avoid conflicts
lsof -ti:3737 | xargs kill -9 2>/dev/null

# Start server in background
npm run serve > server.log 2>&1 &
SERVER_PID=$!

# Wait for server to be ready
echo "⏳ Waiting for server to initialize..."
sleep 2

# Check if server is still running
if ! ps -p $SERVER_PID > /dev/null; then
  echo "❌ Error: Server failed to start. Check server.log for details:"
  cat server.log
  exit 1
fi

# Open in browser
echo "🌐 Opening MDpreview..."
if open -a "Microsoft Edge" "http://localhost:3737" 2>/dev/null; then
  echo "✅ Opened in Microsoft Edge"
else
  open "http://localhost:3737"
  echo "✅ Opened in default browser (Microsoft Edge not found)"
fi

echo "🚀 MDpreview is running (PID: $SERVER_PID)."
echo "Press Ctrl+C in this terminal if you want to stop the server."

# Keep terminal open to maintain background process
wait $SERVER_PID

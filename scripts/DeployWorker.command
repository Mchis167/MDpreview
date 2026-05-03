#!/bin/bash

# Move to the project root directory
cd "$(dirname "$0")/.."

echo "--------------------------------------------------------"
echo "🚀 DEPLOYING CLOUDFLARE WORKER..."
echo "--------------------------------------------------------"
echo ""

# Ensure publish CSS is up-to-date
echo "🎨 Step 1/3: Syncing publish CSS from tokens..."
npm run build:publish-assets || {
  echo "❌ Error: Assets build failed"
  exit 1
}

echo ""
echo "📦 Step 2/3: Deploying to Cloudflare Workers..."

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
  echo "❌ Error: wrangler is not installed."
  echo "   Install it with: npm install -g wrangler"
  echo "   Or run: npm install in cf-publish-worker/"
  exit 1
fi

# Change to worker directory
cd cf-publish-worker || {
  echo "❌ Error: Could not find cf-publish-worker directory"
  exit 1
}

# Deploy worker
wrangler deploy || {
  echo "❌ Error: Deployment failed"
  echo "   Make sure you're authenticated: wrangler login"
  exit 1
}

echo ""
echo "✅ Step 3/3: Deployment complete!"
echo ""
echo "📊 Summary:"
echo "   • CSS synced from tokens ✓"
echo "   • Worker deployed to Cloudflare ✓"
echo ""
echo "🌐 Your published pages are now live with latest styles!"
echo ""
echo "📝 Next:"
echo "   • Test your published pages: https://[your-worker].workers.dev/[slug]"
echo "   • Check status: wrangler deployments list"
echo ""
echo "Press any key to exit..."
read -p "" -n1 -s

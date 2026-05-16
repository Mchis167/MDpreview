/**
 * Test Random Workspace Asset
 * Purpose: Pick a random image from the current workspace assets and test compression.
 */
async function testRandomWorkspaceAsset() {
  console.log('🔍 Scanning workspace assets...');

  try {
    const assetsRes = await fetch('/api/assets');
    if (!assetsRes.ok) throw new Error(`Failed to fetch asset list: ${assetsRes.status}`);
    const data = await assetsRes.json();

    if (!data.assets || data.assets.length === 0) {
      console.warn('⚠️ No assets found in the current workspace.');
      return;
    }

    // Filter for images
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const images = data.assets.filter(a => 
      imageExtensions.some(ext => a.name.toLowerCase().endsWith(ext))
    );

    if (images.length === 0) {
      console.warn('⚠️ No image assets found in the workspace (checked png, jpg, jpeg, webp).');
      return;
    }

    // Pick random
    const randomImage = images[Math.floor(Math.random() * images.length)];
    const assetUrl = `/assets/${encodeURIComponent(randomImage.name)}`;
    
    console.log(`🎲 Selected random asset: ${randomImage.name} (${randomImage.size})`);
    console.log(`🔗 Fetching from: ${assetUrl}`);

    const res = await fetch(assetUrl);
    if (!res.ok) throw new Error(`Failed to fetch asset binary: ${res.status}`);
    const originalBlob = await res.blob();
    
    console.log(`📦 Original size: ${(originalBlob.size / 1024).toFixed(2)} KB`);

    // Run processing
    console.log('⚡ Processing via WASM Worker...');
    const start = performance.now();
    const result = await ImageProcessorUtil.processForPublish(originalBlob, {
      maxWidth: 1200,
      quality: 0.82
    });
    const end = performance.now();

    const compressedSize = (result.blob.size / 1024).toFixed(2);
    const ratio = ((1 - (result.blob.size / originalBlob.size)) * 100).toFixed(1);
    
    console.log(`✅ Done in ${(end - start).toFixed(0)}ms!`);
    console.log(`✨ Optimized size: ${compressedSize} KB (${result.mime})`);
    console.log(`📉 Compression: ${ratio}% reduction`);

    // Download for review
    const downloadUrl = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `random-optimized-${randomImage.name.split('.')[0]}.${result.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log(`📥 Downloaded: ${a.download}`);

  } catch (err) {
    console.error('❌ Random asset test failed:', err);
  }
}

testRandomWorkspaceAsset();

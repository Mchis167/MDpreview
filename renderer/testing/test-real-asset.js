/**
 * Test Real Asset Compression
 * Purpose: Test ImageProcessorUtil with an actual file from /assets/
 */
async function testRealAsset() {
  const assetPath = '/assets/Central Illustration.png';
  console.log(`🖼️ Fetching real asset: ${assetPath}...`);

  try {
    const res = await fetch(assetPath);
    if (!res.ok) throw new Error(`Failed to fetch asset: ${res.status}`);
    const originalBlob = await res.blob();
    const originalSize = (originalBlob.size / 1024).toFixed(2);
    console.log(`Original size: ${originalSize} KB (${originalBlob.type})`);

    console.log('⚡ Processing to WebP (WASM)...');
    const start = performance.now();
    const result = await ImageProcessorUtil.processForPublish(originalBlob, {
      maxWidth: 1200,
      quality: 0.82,
      forceFormat: 'webp'
    });
    const end = performance.now();
    
    const compressedSize = (result.blob.size / 1024).toFixed(2);
    const ratio = ((1 - (result.blob.size / originalBlob.size)) * 100).toFixed(1);
    
    console.log(`✅ Success in ${(end - start).toFixed(0)}ms!`);
    console.log(`Result size: ${compressedSize} KB (${result.mime})`);
    console.log(`Compression ratio: ${ratio}% smaller`);

    // Download the result for manual inspection
    const downloadUrl = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `optimized-asset.${result.ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log(`📥 Download started: optimized-asset.${result.ext}`);
    
    // Fallback comparison test
    console.log('🧪 Running Canvas Fallback comparison...');
    // We can simulate fallback by temporarily breaking the worker or just calling a private method if exposed
    // But for now, let's just see the WASM result.

  } catch (err) {
    console.error('❌ Real asset test failed:', err);
  }
}

testRealAsset();

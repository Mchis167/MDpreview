/**
 * Test Image WASM Compression
 * Run this in the browser console of MDpreview.
 */
async function testWasmCompression() {
  console.log('🧪 Starting WASM Compression Test...');
  
  // 1. Create a dummy test image (colorful 1000x1000)
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1000;
  const ctx = canvas.getContext('2d');
  const gradient = ctx.createLinearGradient(0, 0, 1000, 1000);
  gradient.addColorStop(0, 'red');
  gradient.addColorStop(0.5, 'blue');
  gradient.addColorStop(1, 'green');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1000, 1000);
  ctx.fillStyle = 'white';
  ctx.font = '50px Arial';
  ctx.fillText('WASM TEST IMAGE', 300, 500);
  
  const blob = await new Promise(r => canvas.toBlob(r, 'image/png'));
  console.log(`Original size: ${(blob.size / 1024).toFixed(2)} KB`);

  // 2. Process with ImageProcessorUtil
  try {
    console.log('Processing WebP...');
    const webpResult = await ImageProcessorUtil.processForPublish(blob, { quality: 0.82 });
    console.log('✓ WebP Processed:', {
      size: (webpResult.blob.size / 1024).toFixed(2) + ' KB',
      mime: webpResult.mime,
      ext: webpResult.ext
    });

    console.log('Processing JPEG...');
    const jpegResult = await ImageProcessorUtil.processForPublish(blob, { forceFormat: 'jpeg', quality: 0.82 });
    console.log('✓ JPEG Processed:', {
      size: (jpegResult.blob.size / 1024).toFixed(2) + ' KB',
      mime: jpegResult.mime,
      ext: jpegResult.ext
    });

    console.log('Processing OxiPNG...');
    const pngResult = await ImageProcessorUtil.processForPublish(blob, { forceFormat: 'png' });
    console.log('✓ PNG Processed:', {
      size: (pngResult.blob.size / 1024).toFixed(2) + ' KB',
      mime: pngResult.mime,
      ext: pngResult.ext
    });

    console.log('🎉 ALL TESTS PASSED!');
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testWasmCompression();

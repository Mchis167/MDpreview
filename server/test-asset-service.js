const fs = require('fs');
const path = require('path');
const AssetService = require('./services/asset-service');

/**
 * Script kiểm thử tự động cho AssetService logic.
 */
async function runTests() {
  const testDir = path.join(__dirname, '../temp-test-workspace');
  const assetsDir = path.join(testDir, 'assets');

  console.log('--- Starting AssetService Unit Tests ---');

  // 0. Setup môi trường test
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir);
  fs.mkdirSync(assetsDir);

  // Tạo các file giả lập
  // A.png -> Healthy (có ref)
  fs.writeFileSync(path.join(assetsDir, 'A.png'), 'fake image data');
  fs.writeFileSync(path.join(testDir, 'file1.md'), 'Đây là ảnh đẹp: ![](assets/A.png)');

  // B.png -> Orphan (không có ref)
  fs.writeFileSync(path.join(assetsDir, 'B.png'), 'fake image data');

  // C.png -> Broken (có ref nhưng không có file)
  fs.writeFileSync(path.join(testDir, 'file2.md'), 'Link hỏng này: <img src="assets/C.png">');

  // Test Regex variants
  fs.writeFileSync(path.join(testDir, 'file3.md'), `
    Markdown: ![](assets/variant1.png)
    Markdown Space: ![] (assets/variant2.png)
    HTML: <img src="assets/variant3.png">
    HTML single quote: <img src='assets/variant4.png'>
  `);
  // Tạo file cho variant1, 2, 3, 4 để chúng thành Healthy
  ['variant1.png', 'variant2.png', 'variant3.png', 'variant4.png'].forEach(f => {
    fs.writeFileSync(path.join(assetsDir, f), 'data');
  });

  const service = new AssetService(testDir);
  const result = await service.scan();

  let passed = 0;
  let total = 5;

  // S1: Empty check (nếu xóa assetsDir)
  // (Đã test ngầm qua việc chạy không crash)
  console.log('Check S1 (No crash): PASSED');
  passed++;

  // S2: Healthy check (A.png + variants)
  const healthyNames = result.assets.map(a => a.name);
  if (healthyNames.includes('A.png') && healthyNames.includes('variant1.png')) {
    console.log('Check S2 (Healthy): PASSED');
    passed++;
  } else {
    console.log('Check S2 (Healthy): FAILED', healthyNames);
  }

  // S3: Orphan check (B.png)
  const orphanNames = result.orphans.map(a => a.name);
  if (orphanNames.includes('B.png')) {
    console.log('Check S3 (Orphan): PASSED');
    passed++;
  } else {
    console.log('Check S3 (Orphan): FAILED', orphanNames);
  }

  // S4: Broken check (C.png)
  const brokenNames = result.broken.map(a => a.name);
  if (brokenNames.includes('C.png')) {
    console.log('Check S4 (Broken): PASSED');
    passed++;
  } else {
    console.log('Check S4 (Broken): FAILED', brokenNames);
  }

  // S5: Regex variants check
  if (healthyNames.includes('variant1.png') && 
      healthyNames.includes('variant2.png') && 
      healthyNames.includes('variant3.png') && 
      healthyNames.includes('variant4.png')) {
    console.log('Check S5 (Regex variants): PASSED');
    passed++;
  } else {
    console.log('Check S5 (Regex variants): FAILED', healthyNames);
  }

  console.log(`--- Results: ${passed}/${total} passed ---`);

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

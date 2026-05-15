const fs = require('fs');
const path = require('path');
const AssetService = require('../../services/asset-service');

/**
 * Phase 4 Automation Test: Purge Orphans
 * Kiểm tra tính năng dọn dẹp hàng loạt ảnh mồ côi.
 */
async function runPurgeTests() {
  const testDir = path.join(__dirname, '../temp-test-purge');
  const assetsDir = path.join(testDir, 'assets');

  console.log('\n🧹 Starting Phase 4: Purge Orphans Tests...');

  // 0. Setup
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir);
  fs.mkdirSync(assetsDir);

  // Tạo 2 ảnh Healthy (có ref)
  fs.writeFileSync(path.join(assetsDir, 'H1.png'), 'data');
  fs.writeFileSync(path.join(assetsDir, 'H2.png'), 'data');
  fs.writeFileSync(path.join(testDir, 'doc.md'), '![](assets/H1.png) ![](assets/H2.png)');

  // Tạo 3 ảnh Orphan (không ref)
  fs.writeFileSync(path.join(assetsDir, 'O1.png'), 'data');
  fs.writeFileSync(path.join(assetsDir, 'O2.png'), 'data');
  fs.writeFileSync(path.join(assetsDir, 'O3.png'), 'data');

  const service = new AssetService(testDir);
  
  // 1. Kiểm tra ban đầu
  let data = await service.scan();
  console.log(`Initial state: ${data.assets.length} healthy, ${data.orphans.length} orphans.`);

  if (data.orphans.length !== 3) {
    console.error('❌ Failed: Should have 3 orphans at start');
    process.exit(1);
  }

  // 2. Mô phỏng logic Purge (tương tự route /api/assets/purge-orphans)
  console.log('Purging orphans...');
  for (const orphan of data.orphans) {
    const assetPath = path.join(assetsDir, orphan.name);
    if (fs.existsSync(assetPath)) {
      fs.unlinkSync(assetPath);
    }
  }

  // 3. Kiểm tra sau khi Purge
  data = await service.scan();
  console.log(`Final state: ${data.assets.length} healthy, ${data.orphans.length} orphans.`);

  let passed = 0;
  let total = 2;

  if (data.orphans.length === 0) {
    console.log('✅ Check 1 (Purge Success): PASSED (0 orphans remaining)');
    passed++;
  }

  if (data.assets.length === 2) {
    console.log('✅ Check 2 (Safety): PASSED (Healthy assets are preserved)');
    passed++;
  }

  console.log(`\n🏁 Purge Test Result: ${passed}/${total} passed`);

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPurgeTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

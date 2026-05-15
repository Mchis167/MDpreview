const fs = require('fs');
const path = require('path');
const AssetService = require('../../services/asset-service');

/**
 * Phase 4 Automation Test: Asset Intelligence
 * Kiểm tra logic truy xuất số dòng và nội dung tham chiếu.
 */
async function runPhase4Tests() {
  const testDir = path.join(__dirname, '../temp-test-phase4');
  const assetsDir = path.join(testDir, 'assets');

  console.log('\n🚀 Starting Phase 4: Asset Intelligence Tests...');

  // 0. Setup môi trường test
  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir);
  fs.mkdirSync(assetsDir);

  // Tạo file giả lập cho kịch bản phức tạp:
  // - A.png xuất hiện ở dòng 1 và dòng 3 của file1.md
  // - A.png xuất hiện ở dòng 2 của file2.md
  fs.writeFileSync(path.join(assetsDir, 'A.png'), 'fake image data');
  
  const file1Content = [
    '# Header',
    '![](assets/A.png) - First ref',
    'Some text',
    '![](assets/A.png) - Second ref'
  ].join('\n');
  fs.writeFileSync(path.join(testDir, 'file1.md'), file1Content);

  const file2Content = [
    'Hello',
    '<img src="assets/A.png"> - HTML ref'
  ].join('\n');
  fs.writeFileSync(path.join(testDir, 'file2.md'), file2Content);

  const service = new AssetService(testDir);
  const result = await service.scan();

  let passed = 0;
  let total = 4;

  const assetA = result.assets.find(a => a.name === 'A.png');

  // Check 1: Tổng số lượng tham chiếu (refCount)
  if (assetA && assetA.refCount === 3) {
    console.log('✅ Check 1 (Total refCount): PASSED (Found 3 references)');
    passed++;
  } else {
    console.error('❌ Check 1 (Total refCount): FAILED', assetA?.refCount);
  }

  // Check 2: Phân nhóm theo file (Grouped by file)
  if (assetA && assetA.refs.length === 2) {
    console.log('✅ Check 2 (Grouping): PASSED (Found in 2 unique files)');
    passed++;
  } else {
    console.error('❌ Check 2 (Grouping): FAILED', assetA?.refs.length);
  }

  // Check 3: Độ chính xác của số dòng (Line number accuracy)
  const file1Refs = assetA.refs.find(r => r.path === 'file1.md');
  if (file1Refs && file1Refs.occurrences[0].line === 2 && file1Refs.occurrences[1].line === 4) {
    console.log('✅ Check 3 (Line Numbers): PASSED (Correctly identified lines 2 and 4)');
    passed++;
  } else {
    console.error('❌ Check 3 (Line Numbers): FAILED', file1Refs?.occurrences);
  }

  // Check 4: Nội dung trích xuất (Snippet extraction)
  const occ1 = file1Refs.occurrences[0];
  if (occ1 && occ1.content.includes('First ref')) {
    console.log('✅ Check 4 (Snippet): PASSED (Found "First ref" in content)');
    passed++;
  } else {
    console.error('❌ Check 4 (Snippet): FAILED', occ1?.content);
  }

  console.log(`\n🏁 Phase 4 Test Result: ${passed}/${total} passed`);

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runPhase4Tests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

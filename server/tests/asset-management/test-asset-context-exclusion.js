const fs = require('fs');
const path = require('path');
const AssetService = require('../../services/asset-service');

/**
 * Test Case: Asset Context Exclusion
 * Đảm bảo hệ thống bỏ qua các tham chiếu nằm trong code blocks, inline code, frontmatter, v.v.
 */
async function runExclusionTests() {
  const testDir = path.join(__dirname, '../temp-test-exclusion');
  const assetsDir = path.join(testDir, 'assets');

  console.log('\n🚀 Starting Asset Context Exclusion Tests...');

  if (fs.existsSync(testDir)) {
    fs.rmSync(testDir, { recursive: true, force: true });
  }
  fs.mkdirSync(testDir);
  fs.mkdirSync(assetsDir);

  fs.writeFileSync(path.join(assetsDir, 'real.png'), 'fake');
  fs.writeFileSync(path.join(assetsDir, 'fake.png'), 'fake');

  const content = [
    '---',
    'title: YAML Frontmatter',
    'image: assets/fake.png', // Should be ignored (Frontmatter)
    '---',
    '# Test',
    'Real image: ![](assets/real.png)', // SHOULD be found
    '',
    'Code block:',
    '```markdown',
    '![](assets/fake.png) - Literal text in code block', // Should be ignored
    '```',
    '',
    'Inline code: `![](assets/fake.png)` should be ignored.',
    '',
    'HTML Comment: <!-- <img src="assets/fake.png"> --> should be ignored.',
    '',
    'HTML Block:',
    '<pre>',
    '  <img src="assets/fake.png"> - literal in pre', // Should be ignored
    '</pre>'
  ].join('\n');

  fs.writeFileSync(path.join(testDir, 'test.md'), content);

  const service = new AssetService(testDir);
  const result = await service.scan();

  let passed = 0;
  let total = 2;

  // Check 1: 'real.png' must be found
  const realAsset = result.assets.find(a => a.name === 'real.png');
  if (realAsset && realAsset.refCount === 1) {
    console.log('✅ Check 1 (Real Image): PASSED (Found 1 reference)');
    passed++;
  } else {
    console.error('❌ Check 1 (Real Image): FAILED', realAsset?.refCount);
  }

  // Check 2: 'fake.png' must NOT be found (refCount should be 0, so it should be in orphans)
  const fakeAsset = result.orphans.find(a => a.name === 'fake.png');
  const fakeInAssets = result.assets.find(a => a.name === 'fake.png');
  
  if (fakeAsset && !fakeInAssets) {
    console.log('✅ Check 2 (Exclusion): PASSED (fake.png is an orphan, 0 references found)');
    passed++;
  } else {
    console.error('❌ Check 2 (Exclusion): FAILED', {
      isOrphan: !!fakeAsset,
      inAssets: !!fakeInAssets,
      refCount: fakeInAssets?.refCount
    });
  }

  console.log(`\n🏁 Exclusion Test Result: ${passed}/${total} passed`);

  // Cleanup
  fs.rmSync(testDir, { recursive: true, force: true });

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runExclusionTests().catch(err => {
  console.error('Test script crashed:', err);
  process.exit(1);
});

const path = require('path');

function testResolve(watchDir, filePath) {
  const fullPath = path.isAbsolute(filePath) ? path.normalize(filePath) : path.resolve(watchDir, filePath);
  const normalizedWatchDir = path.normalize(watchDir);
  
  console.log('watchDir:', watchDir);
  console.log('normalizedWatchDir:', normalizedWatchDir);
  console.log('filePath:', filePath);
  console.log('fullPath:', fullPath);
  console.log('startsWith:', fullPath.startsWith(normalizedWatchDir));
}

testResolve('/Users/mchisdo/Downloads/Markdown', '/Users/mchisdo/Downloads/Markdown/New Folder');
testResolve('/Users/mchisdo/Downloads/Markdown/', '/Users/mchisdo/Downloads/Markdown/New Folder');

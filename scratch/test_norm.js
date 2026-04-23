const path = require('path');
console.log('1:', path.normalize('/a/b/'));
console.log('2:', path.normalize('/a/b'));
console.log('3:', path.join('/a/b', 'c'));
console.log('4:', path.join('/a/b/', 'c'));

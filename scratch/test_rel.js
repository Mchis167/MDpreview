const path = require('path');
const w = '/Users/mchisdo/Downloads/Markdown';
const f = '/users/mchisdo/Downloads/Markdown/New Folder';
console.log('relative:', path.relative(w, f));
console.log('startsWith ..:', path.relative(w, f).startsWith('..'));
console.log('isAbsolute:', path.isAbsolute(path.relative(w, f)));

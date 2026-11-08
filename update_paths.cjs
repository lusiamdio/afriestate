const fs = require('fs');
let content = fs.readFileSync('constants.ts', 'utf8');
content = content.replace(/\/src\/assets\/images\//g, '/images/');
fs.writeFileSync('constants.ts', content);
console.log('Replaced paths in constants.ts');

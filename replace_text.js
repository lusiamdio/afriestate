const fs = require('fs');

const file = 'components/PropertyCard.tsx';
let content = fs.readFileSync(file, 'utf8');
content = content.replace(/text-black/g, 'text-brand-dark');
fs.writeFileSync(file, content);
console.log('Replaced in ' + file);

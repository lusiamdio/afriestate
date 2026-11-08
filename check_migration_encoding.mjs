import fs from 'fs';

const buf = fs.readFileSync('migration.sql');
console.log('File size:', buf.length);
console.log('First 20 bytes (hex):', Array.from(buf.slice(0, 20)).map(b => b.toString(16).padStart(2, '0')).join(' '));
console.log('First 100 bytes (text):', buf.slice(0, 100).toString('utf8'));

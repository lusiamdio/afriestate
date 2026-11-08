const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'assets', 'images');
const destDir = path.join(__dirname, 'public', 'images');

if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
}

const files = fs.readdirSync(srcDir);
for (const file of files) {
    if (file.endsWith('.png')) {
        fs.renameSync(path.join(srcDir, file), path.join(destDir, file));
    }
}
console.log('Moved images to /public/images');

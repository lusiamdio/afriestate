const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'components');

function replaceInDir(directory) {
  const files = fs.readdirSync(directory);
  for (const file of files) {
    const fullPath = path.join(directory, file);
    if (fs.statSync(fullPath).isDirectory()) {
      replaceInDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      const original = content;
      content = content.replace(/bg-white dark:bg-slate-800(\/50)?/g, 'glass-panel');
      content = content.replace(/bg-brand-light dark:bg-slate-700/g, 'glass-card');
      content = content.replace(/bg-slate-50 dark:bg-slate-700\/30/g, 'glass-card');
      // Replace generic bg-white with translucent versions
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir(dir);
console.log("Done");

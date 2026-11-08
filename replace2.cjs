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
      // Convert standard cards
      content = content.replace(/bg-white shadow/g, 'glass-card');
      // Update floating menus
      content = content.replace(/bg-white dark:bg-slate-900/g, 'glass-panel');
      content = content.replace(/bg-white dark:bg-brand-dark/g, 'glass-panel');
      
      if (content !== original) {
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}

replaceInDir(dir);
console.log("Done phase 2");

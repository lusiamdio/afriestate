import fs from 'fs';
import path from 'path';

const dir = './migrated_prompt_history';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const content = fs.readFileSync(path.join(dir, file), 'utf8');
    if (content.toLowerCase().includes('create table')) {
      console.log(`Found in: ${file}`);
      // Find all matches of CREATE TABLE
      const regex = /CREATE TABLE[^(]*\([^)]*\)/gi;
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (match[0].toLowerCase().includes('properties')) {
          console.log('Match:', match[0]);
        }
      }
    }
  }
}

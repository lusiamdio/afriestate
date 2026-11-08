import fs from 'fs';
import path from 'path';

const dir = './migrated_prompt_history';
const files = fs.readdirSync(dir);

for (const file of files) {
  if (file.endsWith('.json')) {
    const raw = fs.readFileSync(path.join(dir, file), 'utf8');
    let searchStr = 'create table';
    let idx = -1;
    let startFrom = 0;
    while ((idx = raw.toLowerCase().indexOf(searchStr, startFrom)) !== -1) {
      console.log(`\nFound "CREATE TABLE" in ${file} at index ${idx}:`);
      console.log(raw.substring(idx, idx + 200).replace(/\\n/g, '\n').replace(/\\"/g, '"'));
      startFrom = idx + searchStr.length;
    }
  }
}

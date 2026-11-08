import fs from 'fs';
import path from 'path';

const dir = './migrated_prompt_history';
const file = 'prompt_2025-12-22T20:49:52.255Z.json';
const raw = fs.readFileSync(path.join(dir, file), 'utf8');

let searchStr = 'create table public.properties';
let idx = raw.toLowerCase().indexOf(searchStr);
if (idx !== -1) {
  console.log('=== EXTRACTED SQL CREATE STATEMENT ===');
  console.log(raw.substring(idx, idx + 1500).replace(/\\n/g, '\n').replace(/\\"/g, '"'));
} else {
  console.log('Not found in this file');
}

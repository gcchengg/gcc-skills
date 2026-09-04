import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const stage = path.join(root, 'dist', 'xiaohongshu-answer-book'); const zip = path.join(root, 'dist', 'xiaohongshu-answer-book.zip');
const errors = []; const files = [];
function walk(directory) { for (const entry of fs.readdirSync(directory, { withFileTypes: true })) { const full = path.join(directory, entry.name); entry.isDirectory() ? walk(full) : files.push(full); } }
if (!fs.existsSync(stage) || !fs.existsSync(zip)) errors.push('build output is missing');
else {
  walk(stage);
  const forbiddenDirectories = /(^|\/)(tests|research|docs|node_modules)(\/|$)/;
  const networkApis = /\b(fetch|XMLHttpRequest|WebSocket|EventSource|sendBeacon)\s*(\(|\.)|import\s*\(\s*['"]https?:/;
  for (const file of files) {
    const relative = path.relative(stage, file); if (forbiddenDirectories.test(relative)) errors.push(`forbidden file: ${relative}`);
    if (/\.(html|css|js)$/.test(file)) {
      const text = fs.readFileSync(file, 'utf8');
      if (networkApis.test(text)) errors.push(`network API in ${relative}`);
      if (/<(?:script|link)[^>]+(?:src|href)=['"]https?:/i.test(text)) errors.push(`remote asset in ${relative}`);
    }
  }
  if (!files.some((file) => file.endsWith('index.html'))) errors.push('index.html missing');
  if (fs.statSync(zip).size >= 2 * 1024 * 1024) errors.push('zip exceeds 2MB');
}
if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
else console.log(`Package valid: ${files.length} files, ${fs.statSync(zip).size} bytes`);

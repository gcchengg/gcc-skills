import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist'); const stage = path.join(dist, 'xiaohongshu-answer-book');
fs.rmSync(dist, { recursive: true, force: true }); fs.mkdirSync(stage, { recursive: true });
for (const name of ['index.html', 'styles', 'src']) fs.cpSync(path.join(root, name), path.join(stage, name), { recursive: true });
execFileSync('zip', ['-q', '-r', path.join(dist, 'xiaohongshu-answer-book.zip'), '.'], { cwd: stage });
console.log(`Built ${path.join(dist, 'xiaohongshu-answer-book.zip')}`);

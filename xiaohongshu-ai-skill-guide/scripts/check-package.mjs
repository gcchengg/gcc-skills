import { readdir, readFile, stat } from 'node:fs/promises';
import { resolve, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const releaseRoot = resolve(projectRoot, 'dist/xiaohongshu-ai-skill-guide');
const zipPath = resolve(projectRoot, 'dist/xiaohongshu-ai-skill-guide.zip');

async function walk(dir) {
  const files = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path)); else files.push(path);
  }
  return files;
}

export async function checkPackage() {
  const errors = []; const files = await walk(releaseRoot);
  const htmlFiles = files.filter((file) => extname(file) === '.html');
  if (htmlFiles.length !== 1 || relative(releaseRoot, htmlFiles[0]) !== 'index.html') errors.push('release must contain exactly one index.html entry');
  for (const file of files.filter((item) => /\.(html|css|js)$/.test(item))) {
    const text = await readFile(file, 'utf8');
    if (/\b(?:fetch|XMLHttpRequest|WebSocket)\s*\(/.test(text)) errors.push(`${relative(releaseRoot, file)} contains a network API`);
    if (file.endsWith('.html') && /(?:src|href)=["']https?:\/\//.test(text)) errors.push('index.html contains a remote runtime asset');
    if (/\.map(?:["']|$)/.test(text)) errors.push(`${relative(releaseRoot, file)} references a source map`);
  }
  const size = (await stat(zipPath)).size;
  if (size >= 2_000_000) errors.push(`ZIP exceeds 2,000,000 bytes: ${size}`);
  if (files.some((file) => file.includes('/research/') || file.endsWith('.test.mjs'))) errors.push('release contains research or test files');
  if (errors.length) throw new Error(errors.join('\n'));
  return { files: files.length, zipBytes: size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  checkPackage().then(({ files, zipBytes }) => console.log(`Package valid: ${files} files, ${zipBytes} bytes`)).catch((error) => { console.error(error.message); process.exitCode = 1; });
}


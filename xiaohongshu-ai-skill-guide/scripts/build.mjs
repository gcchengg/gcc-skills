import { cp, mkdir, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const dist = resolve(root, 'dist');
const release = resolve(dist, 'xiaohongshu-ai-skill-guide');
const zip = resolve(dist, 'xiaohongshu-ai-skill-guide.zip');

await rm(release, { recursive: true, force: true });
await rm(zip, { force: true });
await mkdir(release, { recursive: true });
await cp(resolve(root, 'index.html'), resolve(release, 'index.html'));
await cp(resolve(root, 'styles'), resolve(release, 'styles'), { recursive: true });
await cp(resolve(root, 'src'), resolve(release, 'src'), { recursive: true });
execFileSync('zip', ['-q', '-r', zip, '.'], { cwd: release });
console.log(`Built ${zip}`);


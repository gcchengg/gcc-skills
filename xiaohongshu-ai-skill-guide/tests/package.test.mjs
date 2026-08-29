import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

test('build produces a complete offline package below two megabytes', async () => {
  execFileSync(process.execPath, ['scripts/build.mjs'], { cwd: new URL('..', import.meta.url), stdio: 'pipe' });
  const root = new URL('../dist/xiaohongshu-ai-skill-guide/', import.meta.url);
  await access(new URL('index.html', root));
  const html = await readFile(new URL('index.html', root), 'utf8');
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//);
  const zip = await stat(new URL('../dist/xiaohongshu-ai-skill-guide.zip', import.meta.url));
  assert.ok(zip.size < 2_000_000, `zip is ${zip.size} bytes`);
});


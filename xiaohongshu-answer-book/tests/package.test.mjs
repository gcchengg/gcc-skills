import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

test('build produces an offline upload zip below two megabytes', () => {
  execFileSync(process.execPath, [new URL('../scripts/build.mjs', import.meta.url).pathname]);
  const zip = new URL('../dist/xiaohongshu-answer-book.zip', import.meta.url);
  assert.ok(fs.existsSync(zip), 'build zip is missing');
  assert.ok(fs.statSync(zip).size < 2 * 1024 * 1024);
  const entries = execFileSync('unzip', ['-Z1', zip.pathname], { encoding: 'utf8' }).trim().split('\n');
  assert.ok(entries.includes('index.html'), 'index.html must be located at the zip root');
  assert.ok(!entries.some((entry) => entry.startsWith('xiaohongshu-answer-book/')), 'zip must not contain a wrapping project directory');
});

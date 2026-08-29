import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('single page is semantic, local, and accessible', async () => {
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.equal((html.match(/<main\b/g) || []).length, 1);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /(?:src|href)="https?:\/\//);
  assert.match(html, /查看 GitHub/);
});

test('runtime contains no network APIs and supports reduced motion', async () => {
  const files = await Promise.all(['../src/app.js', '../src/render.js', '../styles/motion.css'].map((path) => readFile(new URL(path, import.meta.url), 'utf8')));
  assert.doesNotMatch(files.join('\n'), /\b(fetch|XMLHttpRequest|WebSocket)\b/);
  assert.match(files[2], /prefers-reduced-motion/);
});


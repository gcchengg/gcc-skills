import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderApp } from '../src/render.js';
import { DEFAULT_STATE } from '../src/state.js';
import { CATEGORIES } from '../src/data/categories.js';
import { QUESTIONS } from '../src/data/catalog.js';

test('entry page is semantic, local and accessible', () => {
  const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<main id="app"/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(html, /https?:\/\//);
  assert.match(html, /src="\.\/src\/app\.js"/);
});

test('runtime contains no network APIs and supports reduced motion', () => {
  const runtime = ['app.js', 'render.js', 'state.js', 'storage.js', 'matcher.js', 'share-card.js'].map((name) => {
    try { return fs.readFileSync(new URL(`../src/${name}`, import.meta.url), 'utf8'); } catch { return ''; }
  }).join('\n');
  assert.doesNotMatch(runtime, /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/);
  const motion = fs.readFileSync(new URL('../styles/motion.css', import.meta.url), 'utf8');
  assert.match(motion, /prefers-reduced-motion/);
});

test('home and compose screens expose the approved actions', () => {
  const data = { categories: CATEGORIES, questions: QUESTIONS, suggestions: QUESTIONS.slice(0, 8), history: [], favorites: [] };
  const home = renderApp({ ...DEFAULT_STATE, step: 'home' }, data);
  assert.match(home, /写下我的问题/);
  assert.match(home, /不知道问什么？随机一个/);
  const compose = renderApp({ ...DEFAULT_STATE, step: 'compose' }, data);
  assert.match(compose, /maxlength="60"/);
  assert.match(compose, /问问答案之书/);
});

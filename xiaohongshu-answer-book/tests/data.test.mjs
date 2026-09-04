import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../scripts/validate-data.mjs';
import { CATEGORIES } from '../src/data/categories.js';
import { QUESTIONS, ANSWERS } from '../src/data/catalog.js';

test('requires exactly 16 categories, 2400 questions and 600 answers', () => {
  const errors = validateCatalog({ categories: [], questions: [], answers: [] });
  assert.ok(errors.some((item) => item.includes('16 categories')));
  assert.ok(errors.some((item) => item.includes('2400 questions')));
  assert.ok(errors.some((item) => item.includes('600 answers')));
});

test('ships 150 unique questions per category and 600 unique answers', () => {
  assert.equal(QUESTIONS.length, 2400);
  assert.equal(ANSWERS.length, 600);
  for (const category of CATEGORIES) assert.equal(QUESTIONS.filter((question) => question.categoryId === category.id).length, 150);
  assert.equal(new Set(QUESTIONS.map(({ text }) => text)).size, 2400);
  assert.equal(new Set(ANSWERS.map(({ text }) => text)).size, 600);
  assert.deepEqual(validateCatalog({ categories: CATEGORIES, questions: QUESTIONS, answers: ANSWERS }), []);
});

test('catalog avoids deterministic dangerous promises', () => {
  const forbidden = /立即停药|肯定没事|梭哈|一定会回来|保证成功/;
  assert.ok(ANSWERS.every(({ text, insight }) => !forbidden.test(`${text}${insight}`)));
});

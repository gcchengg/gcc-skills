import test from 'node:test';
import assert from 'node:assert/strict';
import { buildShareModel, wrapText } from '../src/share-card.js';

const result = { question: '我要不要换工作？', categoryName: '工作', dateKey: '2026-09-02', answer: { text: '先迈出第一步。', insight: '从最小成本的尝试开始。' } };

test('can hide the private question while retaining the answer', () => {
  const model = buildShareModel(result, { hideQuestion: true, productName: '答案正在浮现' });
  assert.equal(model.question, '一个只属于你的问题');
  assert.equal(model.answer, result.answer.text);
});

test('keeps a visible question when privacy toggle is off', () => {
  assert.equal(buildShareModel(result, { hideQuestion: false }).question, result.question);
});

test('wraps and truncates long card text deterministically', () => {
  const lines = wrapText('这是一段很长很长需要被安全截断的答案文字而且后面还有更多内容', 7, 3);
  assert.equal(lines.length, 3);
  assert.match(lines.at(-1), /…$/);
});

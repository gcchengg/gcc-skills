import test from 'node:test';
import assert from 'node:assert/strict';
import { ANSWERS } from '../src/data/catalog.js';
import { annotateCustomQuestion, localDateKey, normalizeQuestion, seedFrom, selectAnswer } from '../src/matcher.js';

test('normalizes punctuation, case and whitespace deterministically', () => {
  assert.equal(normalizeQuestion('  我要不要换工作？！  '), '我要不要换工作?!');
  assert.equal(localDateKey(new Date('2026-09-02T09:00:00+08:00')), '2026-09-02');
  assert.equal(seedFrom(['a', 'b']), seedFrom(['a', 'b']));
});

test('returns the same answer for the same question on the same local day', () => {
  const input = { question: '我要不要换工作？', categoryId: 'work', date: new Date('2026-09-02T09:00:00+08:00'), answers: ANSWERS };
  assert.equal(selectAnswer(input).id, selectAnswer(input).id);
});

test('annotates work and relationship questions with different semantics', () => {
  assert.ok(annotateCustomQuestion('我要不要辞职换工作').semanticTags.includes('career'));
  assert.ok(annotateCustomQuestion('他是不是也喜欢我').semanticTags.includes('relationship'));
});

test('routes crisis-like questions only to high-risk-safe answers', () => {
  const answer = selectAnswer({ question: '我不想活了怎么办', categoryId: 'midnight', date: new Date('2026-09-02'), answers: ANSWERS });
  assert.equal(answer.maxRiskLevel, 'high');
  assert.match(answer.insight, /联系|求助|陪伴|专业|安全/);
});

test('unknown questions still receive a safe general answer', () => {
  assert.ok(selectAnswer({ question: '云朵为什么像棉花', date: new Date(), answers: ANSWERS }).id);
});

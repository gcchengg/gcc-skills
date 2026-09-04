import test from 'node:test';
import assert from 'node:assert/strict';
import { QUESTIONS } from '../src/data/catalog.js';
import { createStore } from '../src/state.js';
import { pickRandomQuestion } from '../src/storage.js';

test('cannot awaken with an empty question', () => {
  const store = createStore();
  store.dispatch({ type: 'OPEN_COMPOSE' });
  store.dispatch({ type: 'CONFIRM_QUESTION' });
  assert.equal(store.getState().step, 'compose');
});

test('limits question length and completes the hold flow once', () => {
  const store = createStore();
  store.dispatch({ type: 'OPEN_COMPOSE' });
  store.dispatch({ type: 'SET_QUESTION', question: '问'.repeat(80) });
  store.dispatch({ type: 'CONFIRM_QUESTION' });
  assert.equal(store.getState().question.length, 60);
  assert.equal(store.getState().step, 'awaken');
  store.dispatch({ type: 'HOLD_COMPLETE' });
  store.dispatch({ type: 'HOLD_COMPLETE' });
  assert.equal(store.getState().step, 'revealing');
});

test('random question excludes the latest twenty ids', () => {
  const recentIds = QUESTIONS.slice(0, 20).map(({ id }) => id);
  const picked = pickRandomQuestion({ questions: QUESTIONS, recentIds, randomValue: 0 });
  assert.ok(!recentIds.includes(picked.id));
});

test('category random stays inside the selected category', () => {
  const picked = pickRandomQuestion({ questions: QUESTIONS, categoryId: 'work', recentIds: [], randomValue: 0.75 });
  assert.equal(picked.categoryId, 'work');
});

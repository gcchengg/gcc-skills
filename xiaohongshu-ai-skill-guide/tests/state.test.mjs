import test from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/state.js';

test('guards navigation and limits role selection to two', () => {
  const store = createStore();
  store.dispatch({ type: 'NEXT' });
  assert.equal(store.getState().step, 'intro');
  store.dispatch({ type: 'START' });
  store.dispatch({ type: 'SELECT_INDUSTRY', industryId: 'software' });
  store.dispatch({ type: 'NEXT' });
  store.dispatch({ type: 'TOGGLE_ROLE', roleId: 'developer' });
  store.dispatch({ type: 'TOGGLE_ROLE', roleId: 'product_manager' });
  store.dispatch({ type: 'TOGGLE_ROLE', roleId: 'tester' });
  assert.deepEqual(store.getState().roleIds, ['developer', 'product_manager']);
});

test('limits each question to two answers and survives storage errors', () => {
  const storage = { getItem() { throw new Error('off'); }, setItem() { throw new Error('off'); } };
  const store = createStore(undefined, storage);
  store.dispatch({ type: 'TOGGLE_ANSWER', questionIndex: 0, answer: { id: 'a' } });
  store.dispatch({ type: 'TOGGLE_ANSWER', questionIndex: 0, answer: { id: 'b' } });
  store.dispatch({ type: 'TOGGLE_ANSWER', questionIndex: 0, answer: { id: 'c' } });
  assert.equal(store.getState().answers[0].length, 2);
});

test('requires an answer before advancing each question and supports explicit intro replay', () => {
  const store = createStore({ step: 'question-1', industryId: 'software', roleIds: ['developer'], answers: [[], [], []], result: null, introPlayed: true });
  store.dispatch({ type: 'NEXT' });
  assert.equal(store.getState().step, 'question-1');
  store.dispatch({ type: 'TOGGLE_ANSWER', questionIndex: 0, answer: { id: 'a' } });
  store.dispatch({ type: 'NEXT' });
  assert.equal(store.getState().step, 'question-2');
  store.dispatch({ type: 'RESET' });
  assert.equal(store.getState().introPlayed, true);
  store.dispatch({ type: 'REPLAY_INTRO' });
  assert.equal(store.getState().introPlayed, false);
});

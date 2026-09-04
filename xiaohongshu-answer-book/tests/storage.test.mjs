import test from 'node:test';
import assert from 'node:assert/strict';
import { createPersistence } from '../src/storage.js';

test('caps history at thirty and recent random ids at twenty', () => {
  const persistence = createPersistence(null);
  for (let index = 0; index < 40; index++) {
    persistence.addHistory({ id: `h-${index}` });
    persistence.rememberRandom(`q-${index}`);
  }
  assert.equal(persistence.getHistory().length, 30);
  assert.equal(persistence.getRecentRandomIds().length, 20);
});

test('survives storage exceptions and toggles favorites', () => {
  const broken = { getItem() { throw new Error('off'); }, setItem() { throw new Error('off'); } };
  const persistence = createPersistence(broken);
  persistence.toggleFavorite({ id: 'favorite-1', answer: '慢一点' });
  assert.equal(persistence.getFavorites().length, 1);
  persistence.toggleFavorite({ id: 'favorite-1', answer: '慢一点' });
  assert.equal(persistence.getFavorites().length, 0);
});

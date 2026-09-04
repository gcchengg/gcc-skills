const KEYS = {
  history: 'answer-book:v1:history',
  favorites: 'answer-book:v1:favorites',
  recent: 'answer-book:v1:recent-random',
  intro: 'answer-book:v1:intro-played'
};

export function createPersistence(storage = null) {
  const memory = { history: [], favorites: [], recent: [], intro: false };
  const read = (name) => {
    try { const value = storage?.getItem(KEYS[name]); return value == null ? memory[name] : JSON.parse(value); } catch { return memory[name]; }
  };
  const write = (name, value) => {
    memory[name] = value;
    try { storage?.setItem(KEYS[name], JSON.stringify(value)); } catch {}
    return value;
  };
  return {
    getHistory: () => read('history'),
    addHistory(entry) { return write('history', [entry, ...read('history').filter(({ id }) => id !== entry.id)].slice(0, 30)); },
    clearHistory() { return write('history', []); },
    getFavorites: () => read('favorites'),
    toggleFavorite(entry) {
      const current = read('favorites'); const exists = current.some(({ id }) => id === entry.id);
      return write('favorites', exists ? current.filter(({ id }) => id !== entry.id) : [entry, ...current]);
    },
    getRecentRandomIds: () => read('recent'),
    rememberRandom(id) { return write('recent', [id, ...read('recent').filter((item) => item !== id)].slice(0, 20)); },
    hasPlayedIntro: () => Boolean(read('intro')),
    markIntroPlayed(value = true) { return write('intro', value); }
  };
}

export function pickRandomQuestion({ questions, categoryId, recentIds = [], randomValue = Math.random() }) {
  const scoped = categoryId ? questions.filter((item) => item.categoryId === categoryId) : questions;
  const fresh = scoped.filter(({ id }) => !recentIds.includes(id));
  const candidates = fresh.length ? fresh : scoped;
  if (!candidates.length) return null;
  const index = Math.min(candidates.length - 1, Math.floor(Math.max(0, Math.min(0.999999, randomValue)) * candidates.length));
  return candidates[index];
}

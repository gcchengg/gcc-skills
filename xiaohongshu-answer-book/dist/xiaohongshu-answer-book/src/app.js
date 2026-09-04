import { CATEGORIES } from './data/categories.js';
import { QUESTIONS, ANSWERS } from './data/catalog.js';
import { annotateCustomQuestion, localDateKey, normalizeQuestion, selectAnswer, seedFrom } from './matcher.js';
import { createStore, DEFAULT_STATE } from './state.js';
import { createPersistence, pickRandomQuestion } from './storage.js';
import { renderApp } from './render.js';
import { buildShareModel, drawShareCard } from './share-card.js';

const root = document.querySelector('#app'); const live = document.querySelector('#live-region');
const persistence = createPersistence(window.localStorage);
const hasIntro = persistence.hasPlayedIntro();
const store = createStore({ ...DEFAULT_STATE, step: hasIntro ? 'home' : 'intro', introPlayed: hasIntro });
let suggestionOffset = 0; let holdTimer = 0; let revealTimer = 0; let cardBlob = null; let suppressPaint = false;

function suggestions(state) {
  const scoped = state.categoryId ? QUESTIONS.filter(({ categoryId }) => categoryId === state.categoryId) : QUESTIONS;
  return Array.from({ length: Math.min(8, scoped.length) }, (_, index) => scoped[(suggestionOffset + index) % scoped.length]);
}
function viewData(state) { return { categories: CATEGORIES, questions: QUESTIONS, suggestions: suggestions(state), history: persistence.getHistory(), favorites: persistence.getFavorites() }; }
function paint(state) {
  root.innerHTML = renderApp(state, viewData(state)); root.focus({ preventScroll: true });
  live.textContent = root.querySelector('h1,h2')?.textContent || '页面已更新';
  if (state.step === 'revealing') scheduleReveal(state);
  if (state.step === 'share') drawCard(state);
}
async function drawCard(state) {
  const canvas = root.querySelector('#share-canvas'); const image = root.querySelector('#share-image');
  if (!canvas || !image || !state.result) return;
  cardBlob = await drawShareCard(canvas, buildShareModel(state.result, { hideQuestion: state.hideShareQuestion }));
  image.src = canvas.toDataURL('image/png');
}
function downloadCard() {
  const image = root.querySelector('#share-image'); if (!image?.src && !cardBlob) return;
  const url = cardBlob ? URL.createObjectURL(cardBlob) : image.src; const link = document.createElement('a');
  link.href = url; link.download = '答案正在浮现.png'; link.click();
  if (cardBlob) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function chooseRandom(categoryId = '') {
  const question = pickRandomQuestion({ questions: QUESTIONS, categoryId, recentIds: persistence.getRecentRandomIds() });
  if (!question) return; persistence.rememberRandom(question.id);
  store.dispatch({ type: 'SET_QUESTION', question: question.text, questionId: question.id, categoryId: question.categoryId });
  store.dispatch({ type: 'OPEN_COMPOSE', keepQuestion: true });
}
function makeResult(state, question = state.question, categoryId = state.categoryId) {
  const answer = selectAnswer({ question, categoryId, answers: ANSWERS, date: new Date() });
  const annotation = annotateCustomQuestion(question); const dateKey = localDateKey(new Date());
  return { id: `${dateKey}-${seedFrom([normalizeQuestion(question), answer.id])}`, question, categoryId, answer, riskLevel: annotation.riskLevel, dateKey, categoryName: CATEGORIES.find(({ id }) => id === categoryId)?.name || '心中一问' };
}
function scheduleReveal(state) {
  clearTimeout(revealTimer); revealTimer = window.setTimeout(() => {
    const current = store.getState(); if (current.step !== 'revealing') return;
    const result = makeResult(state); persistence.addHistory(result); store.dispatch({ type: 'SET_RESULT', result });
  }, 1650);
}
function startHold() {
  const state = store.getState(); if (state.step !== 'awaken' || state.holdState === 'holding') return;
  store.dispatch({ type: 'HOLD_START' }); if (navigator.vibrate) navigator.vibrate(25);
  holdTimer = window.setTimeout(() => { if (navigator.vibrate) navigator.vibrate([35, 35, 60]); store.dispatch({ type: 'HOLD_COMPLETE' }); }, 1800);
}
function cancelHold() { clearTimeout(holdTimer); if (store.getState().holdState === 'holding') store.dispatch({ type: 'HOLD_CANCEL' }); }

root.addEventListener('pointerdown', (event) => { if (event.target.closest('[data-hold]')) { event.preventDefault(); startHold(); } });
for (const eventName of ['pointerup', 'pointercancel', 'pointerleave']) root.addEventListener(eventName, cancelHold);
root.addEventListener('keydown', (event) => { if ((event.key === ' ' || event.key === 'Enter') && event.target.closest('[data-hold]')) { event.preventDefault(); startHold(); } });
root.addEventListener('keyup', (event) => { if ((event.key === ' ' || event.key === 'Enter') && event.target.closest('[data-hold]')) cancelHold(); });
root.addEventListener('input', (event) => {
  if (event.target.dataset.input !== 'question') return;
  suppressPaint = true; store.dispatch({ type: 'SET_QUESTION', question: event.target.value }); suppressPaint = false;
  const counter = root.querySelector('[data-question-count]'); const confirm = root.querySelector('[data-action="confirm"]');
  if (counter) counter.textContent = `${event.target.value.length} / 60`;
  if (confirm) confirm.disabled = !event.target.value.trim();
});
root.addEventListener('change', (event) => { if (event.target.dataset.action === 'hide-question') store.dispatch({ type: 'TOGGLE_HIDE_QUESTION' }); });
root.addEventListener('click', (event) => {
  const target = event.target.closest('button'); if (!target) return; const action = target.dataset.action; const state = store.getState();
  if (target.dataset.category) { suggestionOffset = 0; store.dispatch({ type: 'SELECT_CATEGORY', categoryId: target.dataset.category }); return; }
  if (target.dataset.questionId) { const question = QUESTIONS.find(({ id }) => id === target.dataset.questionId); store.dispatch({ type: 'SET_QUESTION', question: question.text, questionId: question.id, categoryId: question.categoryId }); return; }
  if (action === 'enter') { persistence.markIntroPlayed(); store.dispatch({ type: 'ENTER' }); }
  else if (action === 'replay') { persistence.markIntroPlayed(false); store.dispatch({ type: 'REPLAY_INTRO' }); }
  else if (action === 'compose') store.dispatch({ type: 'OPEN_COMPOSE' });
  else if (action === 'global-random') chooseRandom();
  else if (action === 'category-random') chooseRandom(state.categoryId);
  else if (action === 'refresh-suggestions') { suggestionOffset += 8; paint(state); }
  else if (action === 'confirm') store.dispatch({ type: 'CONFIRM_QUESTION' });
  else if (action === 'daily') { const result = makeResult(state, '今天会给我什么启示？', 'daily-luck'); store.dispatch({ type: 'SET_RESULT', result }); }
  else if (action === 'history') store.dispatch({ type: 'OPEN_HISTORY' });
  else if (action === 'favorites') store.dispatch({ type: 'OPEN_FAVORITES' });
  else if (action === 'favorite' && state.result) { persistence.toggleFavorite(state.result); live.textContent = '收藏状态已更新'; }
  else if (action === 'ask-again') store.dispatch({ type: 'OPEN_COMPOSE' });
  else if (action === 'share') store.dispatch({ type: 'OPEN_SHARE' });
  else if (action === 'download-card') downloadCard();
  else if (action === 'back') store.dispatch({ type: 'BACK' });
});

store.subscribe((state) => { if (!suppressPaint) paint(state); }); paint(store.getState());
if (!hasIntro) window.setTimeout(() => { if (store.getState().step === 'intro') { persistence.markIntroPlayed(); store.dispatch({ type: 'ENTER' }); } }, 4200);

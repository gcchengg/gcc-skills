import { INDUSTRIES } from './data/industries.js';
import { ROLES } from './data/roles.js';
import { SKILLS } from './data/skills.js';
import { CAPABILITIES } from './data/capabilities.js';
import { CATALOG_META } from './data/meta.js';
import { getQuestions } from './data/questions.js';
import { createStore } from './state.js';
import { recommend } from './recommender.js';
import { buildShareCardModel, renderShareCard } from './share-card.js';
import { renderApp } from './render.js';

const root = document.querySelector('#app'); const live = document.querySelector('#live-region');
const store = createStore(undefined, window.localStorage);
const data = { industries: INDUSTRIES, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES, meta: CATALOG_META, questions: [] };
let cardBlob = null;

function paint(state) {
  data.questions = getQuestions(state.roleIds);
  root.innerHTML = renderApp(state, data);
  root.focus({ preventScroll: true });
  live.textContent = root.querySelector('h1')?.textContent || '页面已更新';
  if (state.step === 'share') drawCard(state);
}

function nextQuestion(state) {
  const index = Number(state.step.at(-1)) - 1;
  if (!state.answers[index]?.length) return;
  if (index < 2) store.dispatch({ type: 'NEXT' });
  else {
    store.dispatch({ type: 'NEXT' });
    window.setTimeout(() => {
      const current = store.getState();
      const answers = current.answers.flat();
      store.dispatch({ type: 'SET_RESULT', result: recommend({ industryId: current.industryId, roleIds: current.roleIds, answers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES }) });
    }, 720);
  }
}

root.addEventListener('click', (event) => {
  const button = event.target.closest('button,a'); if (!button || button.tagName === 'A') return;
  const state = store.getState();
  if (button.dataset.industry) store.dispatch({ type: 'SELECT_INDUSTRY', industryId: button.dataset.industry });
  else if (button.dataset.role) store.dispatch({ type: 'TOGGLE_ROLE', roleId: button.dataset.role });
  else if (button.dataset.answer) { const questionIndex = Number(button.dataset.question); const answer = data.questions[questionIndex].options.find((item) => item.id === button.dataset.answer); store.dispatch({ type: 'TOGGLE_ANSWER', questionIndex, answer }); }
  else if (button.dataset.copy) navigator.clipboard?.writeText(button.dataset.copy);
  else if (button.dataset.action === 'start') store.dispatch({ type: 'START' });
  else if (button.dataset.action === 'replay-intro') store.dispatch({ type: 'REPLAY_INTRO' });
  else if (button.dataset.action === 'next') store.dispatch({ type: 'NEXT' });
  else if (button.dataset.action === 'next-question') nextQuestion(state);
  else if (button.dataset.action === 'back') store.dispatch({ type: 'BACK' });
  else if (button.dataset.action === 'reset') store.dispatch({ type: 'RESET' });
  else if (button.dataset.action === 'back-to-questions') { store.dispatch({ type: 'BACK' }); store.dispatch({ type: 'BACK' }); }
  else if (button.dataset.action === 'share') store.dispatch({ type: 'OPEN_SHARE' });
  else if (button.dataset.action === 'save-card') saveCard();
});

root.addEventListener('input', (event) => {
  const query = event.target.value.trim().toLowerCase(); const kind = event.target.dataset.search; const list = root.querySelector(`[data-list="${kind}"]`);
  list?.querySelectorAll('.choice').forEach((item) => { item.hidden = query && !item.textContent.toLowerCase().includes(query); });
});

async function drawCard(state) {
  const canvas = root.querySelector('#share-canvas'); if (!canvas || !state.result) return;
  const industryName = INDUSTRIES.find((item) => item.id === state.industryId)?.name || '';
  const roleNames = state.roleIds.map((id) => ROLES.find((role) => role.id === id)?.name).filter(Boolean);
  cardBlob = await renderShareCard(canvas, buildShareCardModel(state.result, { industryName, roleNames, catalogVersion: CATALOG_META.version }));
  const image = root.querySelector('#share-image'); if (image) image.src = canvas.toDataURL('image/png');
}

function saveCard() {
  const image = root.querySelector('#share-image'); const canvas = root.querySelector('#share-canvas');
  if (!cardBlob && !image?.src && !canvas) return;
  const url = cardBlob ? URL.createObjectURL(cardBlob) : (image?.src || canvas.toDataURL('image/png'));
  const link = document.createElement('a'); link.href = url; link.download = '我的AI-Skill装机单.png'; link.click();
  if (cardBlob) window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

store.subscribe(paint); paint(store.getState());

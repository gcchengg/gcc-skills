export const STEPS = Object.freeze(['intro', 'home', 'compose', 'awaken', 'revealing', 'answer', 'daily', 'history', 'favorites', 'share']);

export const DEFAULT_STATE = Object.freeze({
  step: 'intro', introPlayed: false, question: '', questionId: '', categoryId: '',
  holdState: 'idle', result: null, hideShareQuestion: false, notice: ''
});

function reducer(state, action) {
  switch (action.type) {
    case 'ENTER': return { ...state, step: 'home', introPlayed: true };
    case 'REPLAY_INTRO': return { ...state, step: 'intro', introPlayed: false };
    case 'OPEN_COMPOSE': return { ...state, step: 'compose', notice: '', ...(action.keepQuestion ? {} : { question: '', questionId: '' }) };
    case 'SELECT_CATEGORY': return { ...state, categoryId: action.categoryId, questionId: '' };
    case 'SET_QUESTION': return { ...state, question: String(action.question || '').slice(0, 60), questionId: action.questionId || '', categoryId: action.categoryId || state.categoryId, notice: '' };
    case 'CONFIRM_QUESTION': return state.question.trim() ? { ...state, step: 'awaken', holdState: 'idle' } : { ...state, notice: '先写下一个问题' };
    case 'HOLD_START': return state.step === 'awaken' ? { ...state, holdState: 'holding', notice: '' } : state;
    case 'HOLD_CANCEL': return state.step === 'awaken' ? { ...state, holdState: 'idle', notice: '再坚持一下，答案还没醒来。' } : state;
    case 'HOLD_COMPLETE': return state.step === 'awaken' && state.holdState !== 'complete' ? { ...state, step: 'revealing', holdState: 'complete' } : state;
    case 'SET_RESULT': return { ...state, result: action.result, step: 'answer' };
    case 'OPEN_DAILY': return { ...state, step: 'daily' };
    case 'OPEN_HISTORY': return { ...state, step: 'history' };
    case 'OPEN_FAVORITES': return { ...state, step: 'favorites' };
    case 'OPEN_SHARE': return state.result ? { ...state, step: 'share' } : state;
    case 'TOGGLE_HIDE_QUESTION': return { ...state, hideShareQuestion: !state.hideShareQuestion };
    case 'BACK': {
      const target = { compose: 'home', awaken: 'compose', revealing: 'awaken', answer: 'home', daily: 'home', history: 'home', favorites: 'home', share: 'answer' }[state.step] || 'home';
      return { ...state, step: target, holdState: 'idle' };
    }
    default: return state;
  }
}

export function createStore(initialState = DEFAULT_STATE) {
  let state = structuredClone(initialState); const listeners = new Set();
  return {
    getState: () => state,
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    dispatch(action) { state = reducer(state, action); listeners.forEach((listener) => listener(state)); return state; }
  };
}

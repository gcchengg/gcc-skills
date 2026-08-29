export const APP_STEPS = ['intro', 'industry', 'role', 'question-1', 'question-2', 'question-3', 'calculating', 'result', 'share'];

const DEFAULT_STATE = Object.freeze({ step: 'intro', industryId: '', roleIds: [], answers: [[], [], []], result: null, introPlayed: false });

function reducer(state, action) {
  switch (action.type) {
    case 'START': return { ...state, step: 'industry', introPlayed: true };
    case 'SELECT_INDUSTRY': return { ...state, industryId: action.industryId, roleIds: [], answers: [[], [], []] };
    case 'TOGGLE_ROLE': {
      const exists = state.roleIds.includes(action.roleId);
      if (!exists && state.roleIds.length >= 2) return state;
      return { ...state, roleIds: exists ? state.roleIds.filter((id) => id !== action.roleId) : [...state.roleIds, action.roleId] };
    }
    case 'TOGGLE_ANSWER': {
      const list = state.answers[action.questionIndex] || [];
      const exists = list.some((item) => item.id === action.answer.id);
      if (!exists && list.length >= 2) return state;
      const answers = state.answers.map((items, index) => index === action.questionIndex ? (exists ? items.filter((item) => item.id !== action.answer.id) : [...items, action.answer]) : items);
      return { ...state, answers };
    }
    case 'NEXT': {
      const questionIndex = state.step.startsWith('question-') ? Number(state.step.at(-1)) - 1 : -1;
      if (state.step === 'intro' || (state.step === 'industry' && !state.industryId) || (state.step === 'role' && !state.roleIds.length) || (questionIndex >= 0 && !state.answers[questionIndex]?.length)) return state;
      const index = APP_STEPS.indexOf(state.step); return { ...state, step: APP_STEPS[Math.min(index + 1, APP_STEPS.length - 1)] };
    }
    case 'BACK': return { ...state, step: APP_STEPS[Math.max(0, APP_STEPS.indexOf(state.step) - 1)] };
    case 'SET_RESULT': return { ...state, result: action.result, step: 'result' };
    case 'OPEN_SHARE': return { ...state, step: 'share' };
    case 'RESET': return { ...DEFAULT_STATE, introPlayed: true };
    case 'REPLAY_INTRO': return { ...state, step: 'intro', introPlayed: false };
    default: return state;
  }
}

export function createStore(initialState = DEFAULT_STATE, storage = null) {
  let state = structuredClone(initialState);
  const listeners = new Set();
  try { const saved = storage?.getItem('xhs-skill-guide'); if (saved) state = { ...state, ...JSON.parse(saved), step: 'result' }; } catch {}
  return {
    getState: () => state,
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    dispatch(action) {
      state = reducer(state, action);
      if (action.type === 'SET_RESULT') { try { storage?.setItem('xhs-skill-guide', JSON.stringify(state)); } catch {} }
      listeners.forEach((fn) => fn(state));
    }
  };
}

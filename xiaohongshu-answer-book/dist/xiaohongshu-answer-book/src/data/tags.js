export const SEMANTIC_TAGS = Object.freeze([
  'relationship', 'expectation', 'observation', 'choice', 'action', 'risk',
  'money', 'study', 'career', 'communication', 'self-worth', 'rest', 'timing',
  'uncertainty', 'travel', 'family', 'healing', 'closure', 'trust', 'planning',
  'luck', 'consumption', 'friendship', 'boundaries', 'change', 'persistence', 'playful'
]);

export const EMOTION_TAGS = Object.freeze([
  'hopeful', 'uncertain', 'anxious', 'sad', 'curious', 'tired', 'excited', 'calm', 'playful'
]);

export const RISK_LEVELS = Object.freeze(['normal', 'sensitive', 'high']);
export const ANSWER_TONES = Object.freeze([
  'action', 'wait', 'stop', 'observe', 'communicate', 'self-first',
  'uncertainty', 'comfort', 'playful', 'clarity'
]);

export const TAG_SETS = Object.freeze({
  semantic: new Set(SEMANTIC_TAGS),
  emotion: new Set(EMOTION_TAGS),
  risk: new Set(RISK_LEVELS),
  tone: new Set(ANSWER_TONES)
});

export const CATEGORIES = Object.freeze([
  ['ambiguity', '💗', '暧昧', ['relationship', 'expectation', 'observation']],
  ['ex', '💔', '前任', ['relationship', 'closure', 'healing']],
  ['love', '❤️', '恋爱', ['relationship', 'trust', 'communication']],
  ['work', '💼', '工作', ['career', 'choice', 'change']],
  ['money', '💰', '搞钱', ['money', 'planning', 'risk']],
  ['study', '📚', '学业', ['study', 'persistence', 'planning']],
  ['relationships', '👭', '人际', ['friendship', 'communication', 'boundaries']],
  ['midnight', '🌙', '深夜', ['self-worth', 'healing', 'uncertainty']],
  ['choices', '🎲', '选择困难', ['choice', 'uncertainty', 'timing']],
  ['daily-luck', '🔮', '今日运势', ['luck', 'timing', 'observation']],
  ['travel', '🧳', '旅行', ['travel', 'choice', 'planning']],
  ['chaos', '🫠', '发疯文学', ['playful', 'rest', 'boundaries']],
  ['life', '🏠', '生活', ['choice', 'rest', 'planning']],
  ['growth', '🌱', '自我成长', ['self-worth', 'change', 'persistence']],
  ['family', '👨‍👩‍👧', '家庭', ['family', 'communication', 'boundaries']],
  ['future', '🚀', '未来计划', ['planning', 'change', 'action']]
].map(([id, icon, name, semanticTags]) => Object.freeze({ id, icon, name, semanticTags: Object.freeze(semanticTags) })));

export const CATEGORY_IDS = Object.freeze(CATEGORIES.map(({ id }) => id));

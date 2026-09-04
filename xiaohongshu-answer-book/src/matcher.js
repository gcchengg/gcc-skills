import { CATEGORIES } from './data/categories.js';
import { indexFromSeed, localDateKey, seedFrom } from './stable-random.js';

export { localDateKey, seedFrom };

const RULES = [
  { pattern: /不想活|自杀|轻生|伤害自己|结束生命|活不下去/, tags: ['healing', 'self-worth'], emotionTag: 'sad', riskLevel: 'high' },
  { pattern: /停药|吃药|病情|诊断|医生|手术/, tags: ['risk', 'observation'], emotionTag: 'anxious', riskLevel: 'sensitive' },
  { pattern: /借贷|贷款|投资|股票|基金|梭哈|合同|起诉|违法/, tags: ['money', 'risk'], emotionTag: 'anxious', riskLevel: 'sensitive' },
  { pattern: /辞职|工作|offer|升职|领导|同事|转岗|职业/, tags: ['career', 'choice', 'change'], emotionTag: 'uncertain', riskLevel: 'normal' },
  { pattern: /喜欢|暧昧|他|她|恋爱|复合|前任|表白/, tags: ['relationship', 'expectation', 'communication'], emotionTag: 'hopeful', riskLevel: 'normal' },
  { pattern: /考试|上岸|复习|论文|学校|学习|答辩/, tags: ['study', 'persistence', 'planning'], emotionTag: 'anxious', riskLevel: 'normal' },
  { pattern: /买|购物|值得吗|消费|预算|副业|赚钱/, tags: ['money', 'consumption', 'choice'], emotionTag: 'uncertain', riskLevel: 'normal' },
  { pattern: /旅行|出发|订票|城市|海边|行程/, tags: ['travel', 'choice', 'planning'], emotionTag: 'excited', riskLevel: 'normal' },
  { pattern: /家人|父母|家庭|亲戚/, tags: ['family', 'communication', 'boundaries'], emotionTag: 'uncertain', riskLevel: 'normal' }
];

const RISK_RANK = { normal: 0, sensitive: 1, high: 2 };

export function normalizeQuestion(text) {
  return String(text || '').trim().toLowerCase().replace(/[！]/g, '!').replace(/[？]/g, '?').replace(/[，]/g, ',').replace(/[。]/g, '.').replace(/\s+/g, ' ');
}

export function annotateCustomQuestion(text) {
  const normalized = normalizeQuestion(text);
  const hits = RULES.filter(({ pattern }) => pattern.test(normalized));
  if (!hits.length) return { semanticTags: ['uncertainty', 'observation'], emotionTag: 'curious', riskLevel: 'normal' };
  const riskLevel = hits.sort((a, b) => RISK_RANK[b.riskLevel] - RISK_RANK[a.riskLevel])[0].riskLevel;
  return { semanticTags: [...new Set(hits.flatMap(({ tags }) => tags))], emotionTag: hits[0].emotionTag, riskLevel };
}

function score(answer, tags, categoryTags) {
  const semantics = answer.semanticTags.reduce((sum, tag) => sum + (tags.includes(tag) ? 4 : 0), 0);
  const category = answer.semanticTags.some((tag) => categoryTags.includes(tag)) ? 3 : 0;
  return semantics + category + (answer.semanticTags.includes('uncertainty') ? 1 : 0);
}

export function selectAnswer({ question, categoryId, date = new Date(), answers }) {
  const annotation = annotateCustomQuestion(question);
  const categoryTags = CATEGORIES.find(({ id }) => id === categoryId)?.semanticTags || [];
  const risk = annotation.riskLevel;
  let eligible = answers.filter((answer) => RISK_RANK[answer.maxRiskLevel] >= RISK_RANK[risk] && !answer.blockedRiskLevels?.includes(risk));
  if (risk === 'high') eligible = eligible.filter(({ insight }) => /联系|求助|陪伴|专业|安全/.test(insight));
  if (!eligible.length) eligible = answers.filter(({ maxRiskLevel }) => maxRiskLevel === 'high');
  const scored = eligible.map((answer) => ({ answer, score: score(answer, annotation.semanticTags, categoryTags) }));
  const top = Math.max(...scored.map(({ score: value }) => value));
  const candidates = scored.filter(({ score: value }) => value === top).map(({ answer }) => answer).sort((a, b) => a.id.localeCompare(b.id));
  const seed = seedFrom([localDateKey(date), normalizeQuestion(question), categoryId || 'general']);
  return candidates[indexFromSeed(seed, candidates.length)];
}

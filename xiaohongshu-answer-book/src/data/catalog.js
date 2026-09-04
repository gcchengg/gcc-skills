import { CATEGORIES } from './categories.js';
import { QUESTION_BLUEPRINTS } from './question-blueprints.js';
import { ANSWER_BLUEPRINTS } from './answer-blueprints.js';

const pad = (number) => String(number).padStart(3, '0');

export const QUESTIONS = Object.freeze(QUESTION_BLUEPRINTS.flatMap((blueprint) => {
  const category = CATEGORIES.find(({ id }) => id === blueprint.categoryId);
  const records = blueprint.frames.flatMap((frame, frameIndex) => blueprint.topics.map((topic, topicIndex) => Object.freeze({
    id: `${blueprint.categoryId}-q-${pad(frameIndex * blueprint.topics.length + topicIndex + 1)}`,
    text: frame(topic),
    categoryId: blueprint.categoryId,
    semanticTags: category.semanticTags,
    emotionTag: ['hopeful', 'uncertain', 'curious', 'anxious'][frameIndex % 4],
    riskLevel: blueprint.categoryId === 'midnight' && topicIndex < 3 ? 'sensitive' : 'normal'
  })));
  if (records.length !== 150) throw new Error(`${blueprint.categoryId} expanded to ${records.length}, expected 150`);
  return records;
}));

export const ANSWERS = Object.freeze(ANSWER_BLUEPRINTS.flatMap((group, groupIndex) => group.openers.flatMap((opener, openerIndex) => group.insights.map((insight, insightIndex) => {
  const number = groupIndex * 60 + openerIndex * 6 + insightIndex + 1;
  const isComfort = group.tone === 'comfort';
  return Object.freeze({
    id: `answer-${pad(number)}`,
    text: `${opener}——${['听听心里的声音', '把目光放回当下', '给现实一个回应', '为自己留一点空间', '从真实感受出发', '让时间参与答案'][insightIndex]}。`,
    insight,
    semanticTags: group.semanticTags,
    tones: Object.freeze([group.tone]),
    blockedRiskLevels: Object.freeze(isComfort ? [] : ['high']),
    maxRiskLevel: isComfort ? 'high' : group.tone === 'playful' ? 'normal' : 'sensitive'
  });
}))));

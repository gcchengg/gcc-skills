import { fileURLToPath } from 'node:url';
import { TAG_SETS } from '../src/data/tags.js';

const normalize = (value) => String(value || '').trim().replace(/\s+/g, '').toLowerCase();
const unique = (items) => new Set(items).size === items.length;

export function validateCatalog({ categories = [], questions = [], answers = [] }) {
  const errors = [];
  if (categories.length !== 16) errors.push('catalog must contain exactly 16 categories');
  if (questions.length !== 2400) errors.push('catalog must contain exactly 2400 questions');
  if (answers.length !== 600) errors.push('catalog must contain exactly 600 answers');
  for (const [label, records] of [['category', categories], ['question', questions], ['answer', answers]]) {
    if (!unique(records.map((item) => item.id))) errors.push(`${label} ids must be unique`);
  }
  const categoryIds = new Set(categories.map(({ id }) => id));
  for (const category of categories) {
    if (!category.id || !category.name || !category.icon) errors.push(`invalid category ${category.id || '(missing id)'}`);
  }
  if (categories.length) for (const category of categories) {
    const count = questions.filter((item) => item.categoryId === category.id).length;
    if (count !== 150) errors.push(`${category.id} must contain exactly 150 questions`);
  }
  for (const question of questions) {
    if (!question.id || !question.text?.trim()) errors.push(`invalid question ${question.id || '(missing id)'}`);
    if (!categoryIds.has(question.categoryId)) errors.push(`${question.id} references unknown category`);
    if (!Array.isArray(question.semanticTags) || !question.semanticTags.length || question.semanticTags.some((tag) => !TAG_SETS.semantic.has(tag))) errors.push(`${question.id} has invalid semantic tags`);
    if (!TAG_SETS.emotion.has(question.emotionTag)) errors.push(`${question.id} has invalid emotion tag`);
    if (!TAG_SETS.risk.has(question.riskLevel)) errors.push(`${question.id} has invalid risk level`);
  }
  for (const answer of answers) {
    if (!answer.id || !answer.text?.trim() || !answer.insight?.trim()) errors.push(`invalid answer ${answer.id || '(missing id)'}`);
    if (!Array.isArray(answer.semanticTags) || !answer.semanticTags.length || answer.semanticTags.some((tag) => !TAG_SETS.semantic.has(tag))) errors.push(`${answer.id} has invalid semantic tags`);
    if (!Array.isArray(answer.tones) || !answer.tones.length || answer.tones.some((tone) => !TAG_SETS.tone.has(tone))) errors.push(`${answer.id} has invalid tones`);
    if (!TAG_SETS.risk.has(answer.maxRiskLevel)) errors.push(`${answer.id} has invalid max risk level`);
  }
  if (!unique(questions.map(({ text }) => normalize(text)))) errors.push('question texts must be unique');
  if (!unique(answers.map(({ text }) => normalize(text)))) errors.push('answer texts must be unique');
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { CATEGORIES } = await import('../src/data/categories.js');
  let QUESTIONS = []; let ANSWERS = [];
  try { ({ QUESTIONS, ANSWERS } = await import('../src/data/catalog.js')); } catch {}
  const errors = validateCatalog({ categories: CATEGORIES, questions: QUESTIONS, answers: ANSWERS });
  if (errors.length) { console.error(errors.join('\n')); process.exitCode = 1; }
  else console.log('16 categories, 2400 questions, 600 answers valid');
}

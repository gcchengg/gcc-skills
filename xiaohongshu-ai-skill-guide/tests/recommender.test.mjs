import test from 'node:test';
import assert from 'node:assert/strict';
import { recommend } from '../src/recommender.js';
import { ROLES } from '../src/data/roles.js';
import { SKILLS } from '../src/data/skills.js';
import { CAPABILITIES } from '../src/data/capabilities.js';

const qualityAnswers = [
  { taskDeltas: { code_quality: 3, browser_testing: 2 } },
  { taskDeltas: { web_design: 3, interactive_prototyping: 2 } },
  { taskDeltas: { product_planning: 3, process_documentation: 2 } }
];

test('returns a standard setup with explanations and three capability suggestions', () => {
  const result = recommend({ industryId: 'software', roleIds: ['developer', 'product_manager'], answers: qualityAnswers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  assert.equal(result.essential.length, 5);
  assert.equal(result.advanced.length, 5);
  assert.equal(result.capabilitySuggestions.length, 3);
  assert.ok(result.essential.every((item) => item.why.includes('因为')));
  assert.equal(Object.keys(result.radar).length, 5);
});

test('different professions produce materially different essential setups', () => {
  const software = recommend({ industryId: 'software', roleIds: ['frontend-engineer'], answers: qualityAnswers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  const media = recommend({ industryId: 'media', roleIds: ['content-creator'], answers: [{ taskDeltas: { content_authoring: 3 } }, { taskDeltas: { video_production: 3 } }, { taskDeltas: { social_publishing: 3 } }], roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  const overlap = software.essential.filter((item) => media.essential.some((other) => other.id === item.id));
  assert.ok(overlap.length <= 2);
});

test('high-risk professions include a professional judgment notice', () => {
  const result = recommend({ industryId: 'legal', roleIds: ['legal-counsel'], answers: [], roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  assert.match(result.professionalNotice, /不能替代专业判断/);
});

test('keeps evidence URLs separate from user-facing usage scenarios', () => {
  const result = recommend({ industryId: 'software', roleIds: ['developer'], answers: qualityAnswers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  assert.ok(result.essential.every((item) => item.scenario && !item.scenario.includes('github.com')));
  assert.ok(result.essential.every((item) => item.evidence.includes('github.com')));
});

test('suggests capability gaps not covered by the selected real Skills', () => {
  const result = recommend({ industryId: 'media', roleIds: ['content-creator'], answers: qualityAnswers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
  const covered = new Set([...result.essential, ...result.advanced].flatMap((item) => item.taskTags));
  assert.ok(result.capabilitySuggestions.every((item) => item.taskTags.some((tag) => !covered.has(tag))));
});

test('every shipped role receives a complete standard setup', () => {
  for (const role of ROLES) {
    const result = recommend({ industryId: role.primaryIndustryId, roleIds: [role.id], answers: qualityAnswers, roles: ROLES, skills: SKILLS, capabilities: CAPABILITIES });
    assert.equal(result.essential.length, 5, role.id);
    assert.equal(result.advanced.length, 5, role.id);
    assert.equal(result.capabilitySuggestions.length, 3, role.id);
  }
});

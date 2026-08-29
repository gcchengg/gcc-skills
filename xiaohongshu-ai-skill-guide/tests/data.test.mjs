import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../scripts/validate-data.mjs';

const validCatalog = () => ({
  industries: [{ id: 'software', name: '软件与互联网' }],
  roles: [{ id: 'pm', industryIds: ['software'], taskWeights: { product_strategy: 2 } }],
  tasks: [{ id: 'product_strategy', name: '产品策略' }],
  questions: [{ id: 'goal', options: [{ id: 'plan', delta: 1 }] }],
  skills: [{
    id: 'review',
    name: '代码审查',
    summary: '审查变更并输出可执行的改进建议。',
    githubUrl: 'https://github.com/openai/example-skill',
    evidence: 'https://github.com/openai/example-skill/blob/0123456789abcdef0123456789abcdef01234567/README.md',
    taskTags: ['product_strategy'],
    industryIds: ['software'],
    roleIds: ['pm'],
    qualityGrade: 'A',
    learningCost: 'medium',
    verifiedAt: '2026-08-28',
    riskNote: '建议需要由负责人复核。',
    softwareDevelopmentOnly: false
  }],
  capabilities: [{ id: 'writing', name: '写作', taskTags: ['product_strategy'] }]
});

test('rejects a skill without README evidence', () => {
  const errors = validateCatalog({
    industries: [{ id: 'software', name: '软件与互联网' }],
    roles: [], tasks: [], questions: [], capabilities: [],
    skills: [{ id: 'review', name: '代码审查', githubUrl: 'https://github.com/o/r', evidence: '' }]
  });
  assert.ok(errors.some((error) => error.includes('evidence')));
});

test('rejects dangling task references', () => {
  const errors = validateCatalog({ industries: [], tasks: [], questions: [], skills: [], capabilities: [], roles: [
    { id: 'pm', industryIds: ['product'], taskWeights: { unknown_task: 5 } }
  ]});
  assert.ok(errors.some((error) => error.includes('unknown_task')));
});

test('requires the independent tasks registry', () => {
  const catalog = validCatalog();
  delete catalog.tasks;
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error === 'tasks must be an array'));
});

test('accepts a complete, internally linked catalog', () => {
  assert.deepEqual(validateCatalog(validCatalog()), []);
});

test('rejects duplicate IDs across each catalog collection', () => {
  const catalog = validCatalog();
  catalog.skills.push({ ...catalog.skills[0] });
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('duplicate skill id: review')));
});

test('rejects malformed GitHub URLs and quality grades for skills', () => {
  const catalog = validCatalog();
  catalog.skills[0].githubUrl = 'https://example.com/openai/example-skill';
  catalog.skills[0].qualityGrade = 'C';
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('githubUrl')));
  assert.ok(errors.some((error) => error.includes('qualityGrade')));
});

test('rejects invalid ISO dates, industry references, and task IDs', () => {
  const catalog = validCatalog();
  catalog.roles[0].industryIds = ['missing'];
  catalog.roles[0].taskWeights = { InvalidTask: 1 };
  catalog.questions[0].updatedAt = '2026/08/28';
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('missing')));
  assert.ok(errors.some((error) => error.includes('InvalidTask')));
  assert.ok(errors.some((error) => error.includes('updatedAt')));
});

test('uses the separate tasks registry instead of capabilities for task weights', () => {
  const catalog = validCatalog();
  catalog.tasks = [];
  catalog.capabilities = [{ id: 'product_strategy', name: '产品策略' }];
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('unknown task: product_strategy')));
});

test('rejects task IDs outside the task ID format', () => {
  const catalog = validCatalog();
  catalog.tasks[0].id = 'ProductStrategy';
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('tasks[0].id')));
});

test('allows stable capability IDs outside the task syntax when their tags resolve to tasks', () => {
  const catalog = validCatalog();
  catalog.capabilities[0].id = 'writing-capability/v1';
  assert.deepEqual(validateCatalog(catalog), []);
});

test('rejects capability task tags that are not registered tasks', () => {
  const catalog = validCatalog();
  catalog.capabilities[0].taskTags = ['unknown_task'];
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('unknown task tag: unknown_task')));
});

test('rejects unfrozen or unrelated README evidence', () => {
  const catalog = validCatalog();
  catalog.skills[0].evidence = 'README: https://github.com/openai/example-skill#readme';
  let errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('evidence')));

  catalog.skills[0].evidence = 'https://github.com/other/repository/blob/0123456789abcdef0123456789abcdef01234567/README.md';
  errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('evidence')));
});

test('accepts structured frozen README evidence tied to the skill repository', () => {
  const catalog = validCatalog();
  catalog.skills[0].evidence = {
    repositoryUrl: 'https://github.com/openai/example-skill',
    readmeUrl: 'https://github.com/openai/example-skill/blob/0123456789abcdef0123456789abcdef01234567/README.md'
  };
  assert.deepEqual(validateCatalog(catalog), []);
});

test('rejects impossible ISO calendar dates', () => {
  const catalog = validCatalog();
  catalog.questions[0].updatedAt = '2026-02-29';
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('updatedAt')));
});

test('enforces the verified-skill minimum only when requested', () => {
  const catalog = validCatalog();
  assert.deepEqual(validateCatalog(catalog), []);
  const errors = validateCatalog(catalog, { enforceMinimum: true });
  assert.ok(errors.some((error) => error.includes('minimumVerifiedSkills')));
});

test('rejects question option deltas outside the allowed range', () => {
  const catalog = validCatalog();
  catalog.questions[0].options[0].delta = 4;
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('delta')));
});

test('rejects capability records with GitHub links', () => {
  const catalog = validCatalog();
  catalog.capabilities[0].githubUrl = 'https://github.com/openai/example-capability';
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('capability') && error.includes('githubUrl')));
});

test('ships at least 60 verified and uniquely linked Skills', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  assert.ok(SKILLS.length >= 60);
  assert.equal(new Set(SKILLS.map((skill) => skill.githubUrl)).size, SKILLS.length);
  assert.ok(SKILLS.every((skill) => skill.evidence.length >= 40));
  assert.ok(SKILLS.every((skill) => ['A', 'B'].includes(skill.qualityGrade)));
});

test('covers the approved industry and role ranges', async () => {
  const { INDUSTRIES } = await import('../src/data/industries.js');
  const { ROLES } = await import('../src/data/roles.js');
  assert.equal(INDUSTRIES.length, 20);
  assert.ok(ROLES.length >= 80 && ROLES.length <= 120);
  assert.ok(ROLES.every((role) => (
    role.primaryIndustryId
    && Array.isArray(role.industryIds)
    && role.industryIds[0] === role.primaryIndustryId
    && Array.isArray(role.aliases)
    && role.aliases.length > 0
    && ['none', 'medical', 'legal', 'financial'].includes(role.riskDomain)
    && Object.keys(role.taskWeights).length >= 6
    && Object.keys(role.taskWeights).length <= 12
    && Object.values(role.taskWeights).every((weight) => Number.isInteger(weight) && weight >= 1 && weight <= 5)
  )));
});

test('changes question options for unrelated roles', async () => {
  const { getQuestions } = await import('../src/data/questions.js');
  const frontendQuestions = getQuestions(['frontend-engineer']);
  const creatorQuestions = getQuestions(['content-creator']);
  assert.notDeepEqual(frontendQuestions, creatorQuestions);
  assert.equal(frontendQuestions.length, 3);
  assert.ok([...frontendQuestions, ...creatorQuestions].every((question) => (
    question.maxSelections === 2
    && question.options.length >= 4
    && question.options.length <= 6
    && question.options.every((option) => Object.keys(option.taskDeltas).length > 0)
  )));
});

test('ships capability gaps without repository links', async () => {
  const { CAPABILITIES } = await import('../src/data/capabilities.js');
  assert.ok(CAPABILITIES.length >= 30);
  assert.ok(CAPABILITIES.every((capability) => (
    capability.summary
    && capability.whyItMatters
    && capability.taskTags.length > 0
    && capability.industryIds.length > 0
    && !Object.hasOwn(capability, 'githubUrl')
  )));
});

test('keeps taxonomy task references in the canonical registry', async () => {
  const [{ TASKS }, { INDUSTRIES }, { ROLES }, { getQuestions }, { CAPABILITIES }] = await Promise.all([
    import('../src/data/tasks.js'),
    import('../src/data/industries.js'),
    import('../src/data/roles.js'),
    import('../src/data/questions.js'),
    import('../src/data/capabilities.js')
  ]);
  const taskIds = new Set(TASKS.map((task) => task.id));
  const industryIds = new Set(INDUSTRIES.map((industry) => industry.id));
  assert.ok(TASKS.length >= 150 && TASKS.length <= 200);
  assert.ok(ROLES.every((role) => role.industryIds.every((id) => industryIds.has(id))));
  assert.ok(ROLES.every((role) => Object.keys(role.taskWeights).every((id) => taskIds.has(id))));
  assert.ok(CAPABILITIES.every((capability) => capability.taskTags.every((id) => taskIds.has(id))));
  assert.ok(getQuestions(['frontend-engineer', 'content-creator']).every((question) => (
    question.options.every((option) => Object.keys(option.taskDeltas).every((id) => taskIds.has(id)))
  )));
});

test('ships the five approved composite role pairs with review notes', async () => {
  const { ROLES } = await import('../src/data/roles.js');
  const composites = ROLES.filter((role) => role.compositeOf);
  assert.deepEqual(composites.map((role) => role.compositeOf), [
    ['developer', 'product_manager'],
    ['designer', 'content-creator'],
    ['teacher', 'content-creator'],
    ['ecommerce-operator', 'livestream-host'],
    ['entrepreneur', 'marketing-lead']
  ]);
  assert.ok(composites.every((role) => role.riskDomain === 'none' && role.reviewNote));
});

test('requires every Skill task tag to resolve through the independent task registry', () => {
  const catalog = validCatalog();
  catalog.skills[0].taskTags = ['unknown_task'];
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('unknown task tag: unknown_task')));
});

test('accepts a frozen SKILL.md source link for a distinct skill in a collection', () => {
  const catalog = validCatalog();
  const sourceUrl = 'https://github.com/openai/skills/blob/0123456789abcdef0123456789abcdef01234567/skills/.curated/pdf/SKILL.md';
  catalog.skills[0].githubUrl = sourceUrl;
  catalog.skills[0].evidence = sourceUrl;
  assert.deepEqual(validateCatalog(catalog), []);
});

test('retries rejected HEAD requests with GET and reports redirects', async () => {
  const { verifyLinks } = await import('../scripts/verify-links.mjs');
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, method: options.method });
    if (options.method === 'HEAD') return { ok: false, status: 405, url, redirected: false };
    return { ok: true, status: 200, url: `${url}/resolved`, redirected: true };
  };

  const [result] = await verifyLinks(['https://github.com/openai/skills'], fetchImpl);
  assert.deepEqual(calls.map((call) => call.method), ['HEAD', 'GET']);
  assert.deepEqual(result, {
    url: 'https://github.com/openai/skills',
    status: 200,
    method: 'GET',
    reachable: true,
    redirected: true,
    finalUrl: 'https://github.com/openai/skills/resolved'
  });
});

test('requires every SkillRecord field and rejects empty tags, industries, and invalid learning cost', () => {
  const catalog = validCatalog();
  delete catalog.skills[0].summary;
  catalog.skills[0].taskTags = [];
  catalog.skills[0].industryIds = [];
  catalog.skills[0].learningCost = 'instant';
  delete catalog.skills[0].softwareDevelopmentOnly;
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('.summary')));
  assert.ok(errors.some((error) => error.includes('.taskTags must not be empty')));
  assert.ok(errors.some((error) => error.includes('.industryIds must not be empty')));
  assert.ok(errors.some((error) => error.includes('.learningCost')));
  assert.ok(errors.some((error) => error.includes('.softwareDevelopmentOnly')));
});

test('rejects duplicate Skill links and unknown Skill industries when an industry registry is available', () => {
  const catalog = validCatalog();
  catalog.skills.push({ ...catalog.skills[0], id: 'another-review', industryIds: ['missing'] });
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('duplicate skill githubUrl')));
  assert.ok(errors.some((error) => error.includes('unknown industry: missing')));
});

test('limits explicitly software-development-only Skills to twenty percent', () => {
  const catalog = validCatalog();
  catalog.skills[0].softwareDevelopmentOnly = true;
  for (let index = 0; index < 4; index += 1) {
    catalog.skills.push({ ...catalog.skills[0], id: `review-${index}`, githubUrl: `https://github.com/openai/example-skill-${index}` });
  }
  const errors = validateCatalog(catalog);
  assert.ok(errors.some((error) => error.includes('software-development-only')));
});

test('falls back to GET when HEAD throws', async () => {
  const { verifyLinks } = await import('../scripts/verify-links.mjs');
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push(options.method);
    if (options.method === 'HEAD') throw new Error('HEAD blocked');
    return { ok: true, status: 200, url, redirected: false };
  };
  const [result] = await verifyLinks(['https://github.com/openai/skills'], fetchImpl);
  assert.deepEqual(calls, ['HEAD', 'GET']);
  assert.equal(result.reachable, true);
  assert.equal(result.method, 'GET');
});

test('limits link verification fetches to the configured concurrency', async () => {
  const { verifyLinks } = await import('../scripts/verify-links.mjs');
  let active = 0;
  let peak = 0;
  const fetchImpl = async (url) => {
    active += 1;
    peak = Math.max(peak, active);
    await new Promise((resolve) => setTimeout(resolve, 5));
    active -= 1;
    return { ok: true, status: 200, url, redirected: false };
  };
  const urls = Array.from({ length: 8 }, (_, index) => `https://github.com/openai/skills-${index}`);
  const results = await verifyLinks(urls, fetchImpl, { concurrency: 2 });
  assert.equal(results.length, 8);
  assert.ok(peak <= 2);
});

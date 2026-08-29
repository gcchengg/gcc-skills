### Task 3: Model industries, roles, questions, and capability suggestions

**Files:**
- Create: `xiaohongshu-ai-skill-guide/src/data/industries.js`
- Create: `xiaohongshu-ai-skill-guide/src/data/roles.js`
- Create: `xiaohongshu-ai-skill-guide/src/data/questions.js`
- Create: `xiaohongshu-ai-skill-guide/src/data/capabilities.js`
- Modify: `xiaohongshu-ai-skill-guide/tests/data.test.mjs`

**Interfaces:**
- Produces: `INDUSTRIES: IndustryRecord[]`, exactly 20 records.
- Produces: `ROLES: RoleRecord[]`, 80-120 records with `taskWeights: Record<string, 1|2|3|4|5>`.
- Produces: `getQuestions(roleIds: string[]): QuestionRecord[]`, exactly three questions with role-sensitive options.
- Produces: `CAPABILITIES: CapabilityRecord[]`, at least 30 records with no repository field.

- [ ] **Step 1: Add failing coverage and dynamic-question tests**

```js
test('covers the approved industry and role ranges', async () => {
  const { INDUSTRIES } = await import('../src/data/industries.js');
  const { ROLES } = await import('../src/data/roles.js');
  assert.equal(INDUSTRIES.length, 20);
  assert.ok(ROLES.length >= 80 && ROLES.length <= 120);
});

test('changes question options for unrelated roles', async () => {
  const { getQuestions } = await import('../src/data/questions.js');
  assert.notDeepEqual(getQuestions(['frontend-engineer']), getQuestions(['content-creator']));
  assert.equal(getQuestions(['frontend-engineer']).length, 3);
});
```

- [ ] **Step 2: Encode the 20 approved industries and 80-120 roles**

For each role, supply one primary industry, optional secondary industries, 6-12 task weights, searchable aliases, and a risk domain of `none|medical|legal|financial`. Include and manually review the five approved composite-role pairs.

- [ ] **Step 3: Encode three question templates and role-aware option pools**

Question 1 targets frequent work, question 2 the desired improvement, and question 3 the largest pain point. Each rendered question offers 4-6 concrete options, permits at most two selections, and each option contributes task deltas without naming a Skill directly.

- [ ] **Step 4: Encode at least 30 capability suggestions**

Each capability record has `id`, `name`, `summary`, `taskTags`, `industryIds`, and `whyItMatters`; it must not have `githubUrl`. Include gaps such as specialist clinical judgment, jurisdiction-specific legal review, physical safety validation, and domain-specific field observation.

- [ ] **Step 5: Run schema and coverage tests**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS, with 20 industries, 80-120 roles, three dynamic questions, and at least 30 capabilities.

- [ ] **Step 6: Commit the professional taxonomy**

```bash
git add xiaohongshu-ai-skill-guide/src/data xiaohongshu-ai-skill-guide/tests/data.test.mjs
git commit -m "data: add industry role and task taxonomy"
```


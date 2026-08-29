### Task 1: Establish the project contract and data validator

**Files:**
- Create: `xiaohongshu-ai-skill-guide/package.json`
- Create: `xiaohongshu-ai-skill-guide/src/data/meta.js`
- Create: `xiaohongshu-ai-skill-guide/scripts/validate-data.mjs`
- Create: `xiaohongshu-ai-skill-guide/tests/data.test.mjs`
- Create: `xiaohongshu-ai-skill-guide/README.md`

**Interfaces:**
- Produces: `CATALOG_META: { version: string, verifiedAt: string, minimumVerifiedSkills: number }`
- Produces: `validateCatalog({ industries, roles, questions, skills, capabilities }): string[]`
- Consumes: data arrays introduced in Tasks 2 and 3; missing modules are represented by empty fixtures until those tasks land.

- [ ] **Step 1: Write the failing validator tests**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCatalog } from '../scripts/validate-data.mjs';

test('rejects a skill without README evidence', () => {
  const errors = validateCatalog({
    industries: [{ id: 'software', name: '软件与互联网' }],
    roles: [], questions: [], capabilities: [],
    skills: [{ id: 'review', name: '代码审查', githubUrl: 'https://github.com/o/r', evidence: '' }]
  });
  assert.ok(errors.some((error) => error.includes('evidence')));
});

test('rejects dangling task references', () => {
  const errors = validateCatalog({ industries: [], questions: [], skills: [], capabilities: [], roles: [
    { id: 'pm', industryIds: ['product'], taskWeights: { unknown_task: 5 } }
  ]});
  assert.ok(errors.some((error) => error.includes('unknown_task')));
});
```

- [ ] **Step 2: Run the tests and verify failure**

Run: `cd xiaohongshu-ai-skill-guide && node --test tests/data.test.mjs`

Expected: FAIL because `validate-data.mjs` does not exist.

- [ ] **Step 3: Implement package scripts, metadata, and strict validation**

Implement `validateCatalog` to check unique IDs, valid GitHub URLs, non-empty README evidence, `A|B` quality grades for linked Skills, ISO dates, known industry IDs, task IDs matching `^[a-z][a-z0-9_]+$`, question option deltas between `-3` and `3`, and capability records without GitHub links. Add scripts `test`, `validate:data`, `build`, and `check:package` to `package.json`; set `engines.node` to `>=20`.

- [ ] **Step 4: Run focused and full validation tests**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS for validator fixtures.

- [ ] **Step 5: Commit the project contract**

```bash
git add xiaohongshu-ai-skill-guide/package.json xiaohongshu-ai-skill-guide/src/data/meta.js xiaohongshu-ai-skill-guide/scripts/validate-data.mjs xiaohongshu-ai-skill-guide/tests/data.test.mjs xiaohongshu-ai-skill-guide/README.md
git commit -m "chore: establish AI skill guide data contract"
```


# Task 3 report — industry, role, task, question, and capability taxonomy

## Delivered data

- `src/data/industries.js`: 20 searchable industry records.
- `src/data/roles.js`: 93 role records, each with one `primaryIndustryId`, optional `secondaryIndustryIds`, compatible `industryIds`, aliases, `riskDomain`, and six task weights.
- `src/data/tasks.js`: 156 canonical tasks. The original 30 Skill task tags are preserved unchanged; additional tasks support role-specific work without coupling the registry to Skills or capabilities.
- `src/data/questions.js`: `getQuestions(roleIds)` renders exactly three questions, each with five role-ranked concrete options, a two-selection limit, and task deltas. It produces different option sets for `frontend-engineer` and `content-creator`.
- `src/data/capabilities.js`: 35 uncovered-capability suggestions, all without `githubUrl` fields.

## Coverage and integrity checks

| Check | Result |
| --- | --- |
| Approved industries | 20 / 20 |
| Roles | 93 (required range: 80–120) |
| Canonical tasks | 156 (requested 150–200 when expansion is needed) |
| Capability gaps | 35 (minimum: 30) |
| Roles per primary industry | software 6; ecommerce 6; marketing 5; media 8; education 5; design 5; consulting 4; enterprise 6; finance 4; HR 4; international trade 4; legal 4; operations 4; research 4; healthcare 4; manufacturing 4; real estate 4; hospitality 4; agriculture 4; public services 4 |
| Existing Skill role references not represented by a role | 0 |
| Roles outside the 6–12 task-weight range | 0 |
| Risk-domain counts | none 75; medical 5; legal 5; financial 5 |

## Composite-role review

The following five design-spec-approved composite roles use `compositeOf` and an explicit `reviewNote`:

1. `programmer-product-manager`: `developer` + `product_manager`.
2. `designer-content-creator`: `designer` + `content-creator`.
3. `teacher-content-creator`: `teacher` + `content-creator`.
4. `ecommerce-livestream-host`: `ecommerce-operator` + `livestream-host`.
5. `entrepreneur-marketing-lead`: `entrepreneur` + `marketing-lead`.

The previously missing canonical component roles `livestream-host`, `entrepreneur`, and `marketing-lead` were added with their own six-task profiles. All five approved composites have `riskDomain: 'none'`, because none of their component roles is specially scoped as medical, legal, or financial.

## TDD evidence and exact verification commands

1. Red phase after adding dynamic-coverage tests:

   ```sh
   cd xiaohongshu-ai-skill-guide && npm test
   ```

   Result: 26 passing, 3 failing tests. Each failure was `ERR_MODULE_NOT_FOUND` for a required new data module (`industries.js`, `questions.js`, or `capabilities.js`).

2. Red phase for canonical taxonomy links after adding the full-link test:

   ```sh
   cd xiaohongshu-ai-skill-guide && npm test
   ```

   Result: 29 passing, 1 failing test. The failure identified the unregistered `collaboration_feedback` task delta in the dynamic question pool.

3. Green/full validation:

   ```sh
   cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run build
   ```

   Result: exit 0; `npm test` reports 30 passing and 0 failing; `validate:data` reports `Catalog data contract is valid (60 verified skills)`; `build` passes `check:package` and `validate:data`.

4. Full-dataset validation command:

   ```sh
   cd xiaohongshu-ai-skill-guide && node --input-type=module -e "import {TASKS} from './src/data/tasks.js'; import {SKILLS} from './src/data/skills.js'; import {INDUSTRIES} from './src/data/industries.js'; import {ROLES} from './src/data/roles.js'; import {CAPABILITIES} from './src/data/capabilities.js'; import {getQuestions} from './src/data/questions.js'; import {validateCatalog} from './scripts/validate-data.mjs'; const errors=validateCatalog({industries:INDUSTRIES,roles:ROLES,tasks:TASKS,questions:getQuestions(['frontend-engineer','content-creator']),skills:SKILLS,capabilities:CAPABILITIES},{enforceMinimum:true}); console.log(errors); if(errors.length)process.exitCode=1;"
   ```

   Result: exit 0; output `[]`.

## Self-review and concern

- Checked all role/capability/question task references against `TASKS`; all resolve.
- Checked all current `SKILLS[].roleIds`; all 32 resolve to a new role record.
- Checked all capability records for repository links; none has a `githubUrl` field.
- No Git commands or Git state mutations were performed, per instruction.

## Composite-pair correction and fresh verification

The design spec supplied the authoritative five pairs after the first delivery. The invented composite records were replaced, and `tests/data.test.mjs` now asserts the exact ordered `compositeOf` pairs plus a non-empty `reviewNote` and `riskDomain: 'none'` for each.

1. Red phase:

   ```sh
   cd xiaohongshu-ai-skill-guide && npm test
   ```

   Result: 30 passing, 1 failing. The new exact-pair test showed the prior five pair arrays, none of which matched the design-spec-approved pair list.

2. Green/full verification:

   ```sh
   cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run build
   ```

   Result: exit 0; `npm test` reports 31 passing and 0 failing; `validate:data` reports `Catalog data contract is valid (60 verified skills)`; `build` passes `check:package` and `validate:data`.

## Status

DONE — taxonomy data, dynamic questions, capability gaps, exact approved composite pairs, and coverage validation are delivered.

# Task 1 report: Xiaohongshu AI Skill Setup Guide contract

## Files changed

- `xiaohongshu-ai-skill-guide/package.json` — dependency-free Node package with
  Node 20 engine enforcement and `test`, `validate:data`, `build`, and
  `check:package` scripts.
- `xiaohongshu-ai-skill-guide/src/data/meta.js` — immutable `CATALOG_META`
  export (`version`, `verifiedAt`, and `minimumVerifiedSkills`).
- `xiaohongshu-ai-skill-guide/src/data/tasks.js` — authoritative, currently
  empty, canonical task registry for the transitional offline CLI.
- `xiaohongshu-ai-skill-guide/scripts/validate-data.mjs` — exported
  `validateCatalog` plus an executable empty-fixture validator for the period
  before the Task 2/3 data modules exist.
- `xiaohongshu-ai-skill-guide/tests/data.test.mjs` — Node built-in test suite.
- `xiaohongshu-ai-skill-guide/README.md` — offline usage and data-contract
  documentation.

## Tests written

- Missing README evidence on a linked skill.
- Dangling role task reference.
- Valid fully linked catalog fixture.
- Duplicate collection IDs.
- Invalid skill GitHub URL and quality grade.
- Invalid ISO date, unknown industry ID, and malformed task ID.
- Question option delta outside `-3..3`.
- Capability GitHub link.

## Commands and results

1. RED: `cd xiaohongshu-ai-skill-guide && node --test tests/data.test.mjs`
   - Exit 1, as expected: `ERR_MODULE_NOT_FOUND` for
     `scripts/validate-data.mjs`.
2. GREEN and package checks:
   `cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run check:package && npm run build`
   - Exit 0.
   - `npm test`: 8 passed, 0 failed.
   - `validate:data`: printed `Catalog data contract is valid (empty fixtures).`
   - `check:package` and `build`: both completed successfully.

## Self-review

- `validateCatalog` returns all discovered errors as `string[]`, with no
  network access or third-party dependency.
- It validates unique IDs within every required collection, ISO dates (including
  metadata), skill repository URLs, README evidence, `A|B` grades, industry and
  task-registry references, task-key syntax, capability task tags, option
  deltas, and the absence of capability GitHub links.
- Empty arrays are intentionally valid so the package remains executable until
  the later dataset tasks add real arrays.
- No Git command or Git-state modification was performed, per the task
  constraint.

## Concerns

- No remaining implementation concern. The review established the missing
  standalone task registry, and the updated contract documents that boundary.

## Review fixes

- Replaced the original capability-backed task assumption with a required
  `tasks` collection. Role `taskWeights` now reference `tasks[].id`; capability
  records remain uncovered-gap records and cannot act as task IDs.
- Added task-ID checks, real calendar-date validation, pinned same-repository
  README evidence validation, and explicit release-mode minimum enforcement
  through `validateCatalog(catalog, { enforceMinimum: true })`.
- Updated the transitional CLI to pass an empty `tasks` fixture and leave
  minimum enforcement disabled.

### Review RED evidence

`cd xiaohongshu-ai-skill-guide && node --test tests/data.test.mjs`

- Exit 1.
- 14 tests ran: 7 passed and 7 failed.
- Expected failures covered the missing tasks registry, loose README evidence,
  invalid calendar date acceptance, and absent `enforceMinimum` option.

### Review GREEN evidence

`cd xiaohongshu-ai-skill-guide && npm test`

- Exit 0.
- 14 tests passed and 0 failed.

### Final review verification

`cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run check:package && npm run build`

Observed output summary:

```text
tests 14
pass 14
fail 0
Catalog data contract is valid (empty fixtures).
```

The command exited 0. `check:package` and `build` also completed with exit 0;
the build reran the package check and empty-fixture data validation.

## Approved tasks-registry architecture update

- Added `src/data/tasks.js` as the authoritative task registry used by the CLI.
- Kept the `tasks` collection mandatory for every caller of `validateCatalog`.
- Removed the task-ID regex restriction from capability IDs; they retain the
  general non-empty unique-ID contract. Added mandatory `taskTags` validation
  so each tag resolves to `tasks[].id`.
- Updated the README opening data-set list and contract description to match.

### Architecture update RED evidence

`cd xiaohongshu-ai-skill-guide && node --test tests/data.test.mjs`

```text
tests 17
pass 15
fail 2
```

Exit 1. The two intentional failures showed that a stable capability ID outside
the task-ID format was rejected and an unregistered capability task tag was
accepted.

### Architecture update GREEN evidence

`cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run check:package && npm run build`

```text
tests 17
pass 17
fail 0
Catalog data contract is valid (empty fixtures).
```

Exit 0. `check:package` and `build` also completed successfully.

# Xiaohongshu AI Skill Setup Guide Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a polished, fully offline Xiaohongshu widget that recommends a verified AI Skill setup from the user's industry, one or two roles, and three task questions, then generates a shareable result card.

**Architecture:** A dependency-free single-page app uses a small hash-based state machine, static catalog modules, a deterministic weighted recommender, and a Canvas share-card renderer. Node built-in tests validate schemas, recommendation behavior, GitHub evidence, accessibility, and the final 2MB package before a release directory is produced.

**Tech Stack:** HTML5, CSS3, ES modules, Canvas 2D, localStorage, Node.js 20+ built-in test runner, shell packaging scripts.

## Global Constraints

- The widget has exactly one page and the complete upload package must remain below 2MB.
- Runtime code uses only local HTML, CSS, JavaScript, and compressed local assets.
- Runtime code makes no network requests and loads no CDN resources.
- The first entrance uses the approved dark cyber visual direction and an approximately three-second animation.
- Strong motion plays only on the first entrance of a session and respects `prefers-reduced-motion`.
- Users select one industry, one or two roles, and answer exactly three role-sensitive questions.
- Standard results contain up to 5 essential Skills, up to 5 advanced Skills, and exactly 3 clearly distinguished capability suggestions.
- Real Skill entries require a verified GitHub repository and README evidence; capability suggestions never display a repository link.
- The app does not claim cross-platform installation compatibility and does not provide a universal install command.
- The frozen catalog displays a catalog version and verification date and never claims real-time freshness.
- Medical, legal, and financial results state that Skills assist work and do not replace professional judgment.
- The complete interaction must be usable in a Xiaohongshu half-screen container and finishable in 60 seconds.

---

## Planned File Structure

```text
xiaohongshu-ai-skill-guide/
├── index.html                         # Single HTML entry and semantic screen containers
├── styles/
│   ├── tokens.css                    # Color, spacing, type, motion, and responsive tokens
│   ├── motion.css                    # Entrance and lightweight transition keyframes
│   └── app.css                       # Screen and component styles
├── src/
│   ├── app.js                        # Bootstrap and event wiring
│   ├── state.js                      # State model, persistence, and navigation
│   ├── recommender.js                # Pure weighted matching and explanations
│   ├── render.js                     # DOM renderers for every screen
│   ├── share-card.js                 # Canvas result-card renderer
│   ├── accessibility.js              # Focus, reduced-motion, and live-region helpers
│   └── data/
│       ├── industries.js             # 20 industry definitions
│       ├── roles.js                  # 80-120 role definitions and task weights
│       ├── questions.js              # Role-sensitive question templates
│       ├── skills.js                 # Verified GitHub Skill records
│       ├── capabilities.js           # Non-repository capability suggestions
│       └── meta.js                   # Frozen catalog version and verification date
├── research/
│   ├── candidate-repositories.json   # Discovered GitHub candidates and source queries
│   ├── verification-evidence.json    # README evidence and quality decisions
│   └── README.md                     # Reproducible research and acceptance method
├── scripts/
│   ├── validate-data.mjs             # Schema and cross-reference validator
│   ├── verify-links.mjs              # Release-time GitHub URL verifier
│   ├── build.mjs                     # Minified release-directory builder
│   └── check-package.mjs             # Offline, one-page, and 2MB release gate
├── tests/
│   ├── data.test.mjs                 # Catalog schema and coverage tests
│   ├── recommender.test.mjs          # Ranking, composite role, and fallback tests
│   ├── state.test.mjs                # State transitions and persistence tests
│   ├── share-card.test.mjs           # Layout and text-fit tests
│   ├── html-contract.test.mjs        # One-page, offline, semantic, and copy tests
│   └── package.test.mjs              # Built package constraints
├── package.json                      # Dependency-free scripts and Node version
└── README.md                         # Development, catalog update, and release instructions
```

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

### Task 2: Build the verified GitHub Skill research pipeline and initial catalog

**Files:**
- Create: `xiaohongshu-ai-skill-guide/research/candidate-repositories.json`
- Create: `xiaohongshu-ai-skill-guide/research/verification-evidence.json`
- Create: `xiaohongshu-ai-skill-guide/research/README.md`
- Create: `xiaohongshu-ai-skill-guide/src/data/skills.js`
- Create: `xiaohongshu-ai-skill-guide/scripts/verify-links.mjs`
- Modify: `xiaohongshu-ai-skill-guide/tests/data.test.mjs`

**Interfaces:**
- Produces: `SKILLS: SkillRecord[]`, where each record has `id`, `name`, `summary`, `githubUrl`, `taskTags`, `industryIds`, `roleIds`, `qualityGrade`, `learningCost`, `evidence`, `verifiedAt`, and `riskNote`.
- Produces: `verifyLinks(urls: string[], fetchImpl = fetch): Promise<LinkResult[]>` for release-time use only.
- Consumes: `CATALOG_META.verifiedAt` from Task 1.

- [ ] **Step 1: Add failing catalog-quality tests**

```js
test('ships at least 60 verified and uniquely linked Skills', async () => {
  const { SKILLS } = await import('../src/data/skills.js');
  assert.ok(SKILLS.length >= 60);
  assert.equal(new Set(SKILLS.map((skill) => skill.githubUrl)).size, SKILLS.length);
  assert.ok(SKILLS.every((skill) => skill.evidence.length >= 40));
  assert.ok(SKILLS.every((skill) => ['A', 'B'].includes(skill.qualityGrade)));
});
```

- [ ] **Step 2: Research candidates from GitHub and authoritative repository pages**

Run focused searches for coding review, debugging, testing, UI design, product requirements, research, writing, presentations, spreadsheets, documents, PDFs, browser automation, marketing, SEO, social content, video, image generation, data analysis, education, finance, legal research, manufacturing, supply chain, HR, scientific research, entrepreneurship, and job search. Record every query and candidate URL in `candidate-repositories.json`; do not rely on aggregator descriptions when the repository README is available.

- [ ] **Step 3: Verify every accepted repository against its README**

For each accepted Skill, record a paraphrased evidence summary, repository owner/name, last activity date, quality decision, task tags, and exclusion rationale for rejected candidates in `verification-evidence.json`. The evidence must describe actual inputs, actions, and outputs. Reject repositories that are only prompt lists, wrappers without Skill content, unmaintained copies, or whose described function cannot be confirmed.

- [ ] **Step 4: Encode at least 60 accepted records in `skills.js`**

Use stable kebab-case IDs and concise Chinese summaries. Ensure no more than 20% of the catalog is software-development-only, so nontechnical industries have genuine coverage. A-grade entries may rank as essential; B-grade entries may rank only as advanced unless their task match exceeds every A-grade alternative by at least 20%.

- [ ] **Step 5: Implement and run the release-time link verifier**

`verifyLinks` must perform bounded-concurrency `HEAD` requests with `GET` fallback, report status and redirects, and never run in the browser bundle. Run: `cd xiaohongshu-ai-skill-guide && node scripts/verify-links.mjs`.

Expected: exit 0 with all accepted GitHub URLs reachable on the frozen verification date.

- [ ] **Step 6: Run data tests and commit the verified catalog**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS with at least 60 unique verified Skill records.

```bash
git add xiaohongshu-ai-skill-guide/research xiaohongshu-ai-skill-guide/src/data/skills.js xiaohongshu-ai-skill-guide/scripts/verify-links.mjs xiaohongshu-ai-skill-guide/tests/data.test.mjs
git commit -m "data: add verified GitHub skill catalog"
```

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

### Task 4: Implement the deterministic recommender

**Files:**
- Create: `xiaohongshu-ai-skill-guide/src/recommender.js`
- Create: `xiaohongshu-ai-skill-guide/tests/recommender.test.mjs`

**Interfaces:**
- Consumes: `RoleRecord[]`, `AnswerRecord[]`, `SkillRecord[]`, `CapabilityRecord[]`.
- Produces: `buildTaskVector(roleIds, answers, roles): Record<string, number>`.
- Produces: `recommend({ industryId, roleIds, answers, roles, skills, capabilities }): RecommendationResult`.
- `RecommendationResult` contains `archetype`, `profile`, `radar`, `essential`, `advanced`, `capabilitySuggestions`, and optional `professionalNotice`.

- [ ] **Step 1: Write failing ranking, differentiation, and fallback tests**

Test that frontend engineer + product manager ranks code review, UI, and requirements tasks; content creator ranks content research and visual production instead; changing the quality-pain answer changes at least three entries or positions; two roles never double-count a task beyond the configured cap; duplicate repositories are removed; fewer than ten valid Skills yields shorter lists plus three capabilities; medical/legal/financial roles return the professional notice.

- [ ] **Step 2: Run recommender tests and verify failure**

Run: `cd xiaohongshu-ai-skill-guide && node --test tests/recommender.test.mjs`

Expected: FAIL because `recommender.js` is absent.

- [ ] **Step 3: Implement task-vector construction**

Normalize role weights to 45 points, answer deltas to 30 points, industry affinity to 15 points, and Skill quality to 10 points. Cap merged role contribution per task before normalization. Keep functions pure and deterministic.

- [ ] **Step 4: Implement ranking, diversity quotas, and explanation generation**

Limit any single top-level task family to two essential entries. Prefer A grade for essential; allow B grade only under the 20% stronger-match rule. Generate Chinese explanations from the user's highest matching task and selected answer, not from a generic Skill description.

- [ ] **Step 5: Implement archetype, radar, and risk notice generation**

Derive the archetype from the two strongest task families plus the selected role combination. Radar values are five normalized 0-100 scores and must remain stable for identical inputs.

- [ ] **Step 6: Run recommender and full tests**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS, including the three-item differentiation requirement.

- [ ] **Step 7: Commit the recommendation engine**

```bash
git add xiaohongshu-ai-skill-guide/src/recommender.js xiaohongshu-ai-skill-guide/tests/recommender.test.mjs
git commit -m "feat: add explainable skill recommender"
```

### Task 5: Build application state, persistence, and accessible navigation

**Files:**
- Create: `xiaohongshu-ai-skill-guide/src/state.js`
- Create: `xiaohongshu-ai-skill-guide/src/accessibility.js`
- Create: `xiaohongshu-ai-skill-guide/tests/state.test.mjs`

**Interfaces:**
- Produces: `createStore(initialState, storage): AppStore` with `getState`, `dispatch`, and `subscribe`.
- Produces: `APP_STEPS = ['intro','industry','role','question-1','question-2','question-3','calculating','result','share']`.
- Produces: `announce(message)`, `focusScreen(screenElement)`, and `prefersReducedMotion()`.

- [ ] **Step 1: Write failing transition and persistence tests**

Test that the user cannot advance without an industry, cannot select more than two roles, cannot choose more than two answers per question, returns to prior steps without losing answers, stores only the latest completed result, survives storage exceptions, and skips strong motion when reduced motion is enabled.

- [ ] **Step 2: Implement the reducer and guarded transitions**

Use explicit actions `SELECT_INDUSTRY`, `TOGGLE_ROLE`, `TOGGLE_ANSWER`, `NEXT`, `BACK`, `SET_RESULT`, `OPEN_SHARE`, `RESET`, and `REPLAY_INTRO`. Reject invalid transitions without mutating state.

- [ ] **Step 3: Implement safe persistence and accessibility helpers**

Wrap storage reads/writes in `try/catch`, version persisted payloads, announce each step via an `aria-live` region, move focus to the screen heading, and expose reduced-motion state to the renderer.

- [ ] **Step 4: Run state tests and commit**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS.

```bash
git add xiaohongshu-ai-skill-guide/src/state.js xiaohongshu-ai-skill-guide/src/accessibility.js xiaohongshu-ai-skill-guide/tests/state.test.mjs
git commit -m "feat: add guarded app state and persistence"
```

### Task 6: Implement the approved animated single-page interface

**Files:**
- Create: `xiaohongshu-ai-skill-guide/index.html`
- Create: `xiaohongshu-ai-skill-guide/styles/tokens.css`
- Create: `xiaohongshu-ai-skill-guide/styles/motion.css`
- Create: `xiaohongshu-ai-skill-guide/styles/app.css`
- Create: `xiaohongshu-ai-skill-guide/src/render.js`
- Create: `xiaohongshu-ai-skill-guide/src/app.js`
- Create: `xiaohongshu-ai-skill-guide/tests/html-contract.test.mjs`

**Interfaces:**
- Consumes: store and navigation helpers from Task 5, data from Tasks 2-3, and `recommend` from Task 4.
- Produces: a single semantic HTML page whose renderer updates `#app` and `#live-region`.
- Produces: `renderApp(state, dependencies): void` and per-screen render functions.

- [ ] **Step 1: Write failing HTML contract tests**

Assert one HTML entry, no `http://` or `https://` runtime asset references, no `fetch`, XHR, WebSocket, or dynamic import, one `main`, one `h1` per rendered screen, an `aria-live` region, reduced-motion CSS, and required copy distinguishing “查看 GitHub” from installation.

- [ ] **Step 2: Create semantic single-page containers and design tokens**

Define approved dark cyber colors, Xiaohongshu-red core glow, spacing, type scale, safe-area insets, 44px minimum tap targets, half-screen breakpoints, focus rings, and high-contrast content cards.

- [ ] **Step 3: Implement the three-second first-entry sequence**

Use CSS-only aurora, perspective grid, orbit rings, five Skill chips, core SK mark, scan line, title reveal, and CTA reveal. Keep the approved replay control. Skip or collapse the sequence under `prefers-reduced-motion` and after the session flag is set.

- [ ] **Step 4: Implement industry, role, and three-question screens**

Add search, popular industries, complete category list, role dual-select, composite-role badge, one-question-per-screen layout, progress display, two-answer limit, back/continue controls, and keyboard-accessible selection.

- [ ] **Step 5: Implement the calculating and result screens**

Use a 600-900ms local “scanning catalog” transition. Render archetype, profile, radar summary, essential, advanced, capability suggestions, professional notice, expandable explanations, GitHub open/copy actions, directory version, edit answers, and regenerate controls.

- [ ] **Step 6: Wire store, renderer, and recommender in `app.js`**

Bootstrap once on `DOMContentLoaded`, subscribe rendering to store updates, compute results only after question 3, and avoid global mutable variables beyond the store instance.

- [ ] **Step 7: Run contract and full tests, then inspect in half-screen sizes**

Run: `cd xiaohongshu-ai-skill-guide && npm test`

Expected: PASS.

Manually inspect at 320×568, 375×667, 390×844, and a 390×520 half-screen viewport. Expected: no horizontal overflow, clipped controls, or unreadable cards.

- [ ] **Step 8: Commit the animated application shell**

```bash
git add xiaohongshu-ai-skill-guide/index.html xiaohongshu-ai-skill-guide/styles xiaohongshu-ai-skill-guide/src/app.js xiaohongshu-ai-skill-guide/src/render.js xiaohongshu-ai-skill-guide/tests/html-contract.test.mjs
git commit -m "feat: build animated skill guide experience"
```

### Task 7: Generate the shareable Xiaohongshu result card

**Files:**
- Create: `xiaohongshu-ai-skill-guide/src/share-card.js`
- Create: `xiaohongshu-ai-skill-guide/tests/share-card.test.mjs`
- Modify: `xiaohongshu-ai-skill-guide/src/render.js`
- Modify: `xiaohongshu-ai-skill-guide/src/app.js`

**Interfaces:**
- Consumes: `RecommendationResult`, selected industry/roles, and catalog metadata.
- Produces: `buildShareCardModel(input): ShareCardModel`.
- Produces: `renderShareCard(canvas, model, options): Promise<Blob>`.
- Produces: `fitText(ctx, text, maxWidth, maxLines): string[]`.

- [ ] **Step 1: Write failing text-fit and card-model tests**

Test long Chinese archetypes, two long role names, exactly five top Skill labels, five radar values, no GitHub URLs, visible catalog version, deterministic line breaks, and fallback output when canvas download is unavailable.

- [ ] **Step 2: Implement pure layout and text-fit helpers**

Use fixed logical dimensions 1080×1440, safe margins of 72px, two-line archetype limit, one-line Skill chips with ellipsis, and font-size reduction only within approved minimum sizes.

- [ ] **Step 3: Draw the approved share-card visual**

Render red-to-gold gradient background, white rounded card, brand mark, career archetype, industry/roles, five-axis radar, Top 5 Skill chips, capability phrase, catalog version, and a reserved branded footer instead of a fake QR code.

- [ ] **Step 4: Add save and long-press fallback flows**

Prefer `canvas.toBlob` and an object URL. If programmatic saving fails, render the generated image full screen with “长按保存” instructions. Revoke object URLs after use.

- [ ] **Step 5: Run tests and manually inspect representative cards**

Generate cards for programmer + product manager, teacher + creator, ecommerce operator + streamer, lawyer, and manufacturing engineer. Expected: no clipping and visually distinct radar/results.

- [ ] **Step 6: Commit the share card**

```bash
git add xiaohongshu-ai-skill-guide/src/share-card.js xiaohongshu-ai-skill-guide/src/render.js xiaohongshu-ai-skill-guide/src/app.js xiaohongshu-ai-skill-guide/tests/share-card.test.mjs
git commit -m "feat: generate shareable skill setup cards"
```

### Task 8: Build, package, and enforce Xiaohongshu release constraints

**Files:**
- Create: `xiaohongshu-ai-skill-guide/scripts/build.mjs`
- Create: `xiaohongshu-ai-skill-guide/scripts/check-package.mjs`
- Create: `xiaohongshu-ai-skill-guide/tests/package.test.mjs`
- Modify: `xiaohongshu-ai-skill-guide/README.md`
- Create: `xiaohongshu-ai-skill-guide/dist/.gitkeep`

**Interfaces:**
- Consumes: all runtime files from Tasks 2-7.
- Produces: `dist/xiaohongshu-ai-skill-guide/` containing exactly one HTML entry and local assets.
- Produces: `dist/xiaohongshu-ai-skill-guide.zip` below 2,000,000 bytes.

- [ ] **Step 1: Write failing package-gate tests**

Assert the built ZIP is under 2,000,000 bytes, contains one `index.html`, contains no source maps or research files, contains no remote runtime URLs, and every referenced asset exists inside the release directory.

- [ ] **Step 2: Implement the dependency-free build script**

Copy runtime files only, remove comments and redundant whitespace conservatively, fingerprint local CSS/JS filenames, rewrite HTML references, and create a reproducible ZIP with stable file ordering. Do not minify catalog strings or user-facing Chinese copy.

- [ ] **Step 3: Implement the release constraint checker**

Scan text assets for network APIs and remote URLs, parse local `src`/`href` references, count HTML entries, inspect package size, and emit explicit failures with offending files and byte counts.

- [ ] **Step 4: Run the complete release sequence**

Run:

```bash
cd xiaohongshu-ai-skill-guide
npm test
npm run validate:data
npm run build
npm run check:package
```

Expected: all tests PASS, all data validates, and the ZIP is below 2,000,000 bytes.

- [ ] **Step 5: Run final manual acceptance**

Verify offline use with network disabled; 60-second completion; first-entry motion and replay; reduced-motion mode; industry and role search; composite roles; three-result differentiation; GitHub open/copy; high-risk notices; localStorage failure; back/edit/regenerate; share-card save; 320px width; and Xiaohongshu half-screen preview.

- [ ] **Step 6: Document catalog updates and release upload**

README must give exact commands for candidate research, evidence review, link verification, data validation, build, package check, and uploading the generated ZIP through Builder Hub. State clearly that release link verification requires network access but runtime does not.

- [ ] **Step 7: Commit the release pipeline**

```bash
git add xiaohongshu-ai-skill-guide/scripts xiaohongshu-ai-skill-guide/tests/package.test.mjs xiaohongshu-ai-skill-guide/README.md xiaohongshu-ai-skill-guide/dist/.gitkeep
git commit -m "build: enforce xiaohongshu widget release gates"
```

### Task 9: Perform final verification and handoff

**Files:**
- Modify only files required by verified defects found during this task.

**Interfaces:**
- Consumes: the release artifact and all automated checks from Tasks 1-8.
- Produces: a verified Builder Hub upload ZIP and a concise verification report in the final handoff.

- [ ] **Step 1: Run every automated check from a clean dependency-free environment**

Run: `cd xiaohongshu-ai-skill-guide && npm test && npm run validate:data && npm run build && npm run check:package`

Expected: exit 0 throughout.

- [ ] **Step 2: Inspect the final artifact, not the source tree**

Serve `dist/xiaohongshu-ai-skill-guide/` locally with network disabled. Complete five representative journeys and compare their essential results, explanations, risk notices, and share cards.

- [ ] **Step 3: Fix only evidence-backed defects and rerun affected tests**

For each defect, first add or tighten a regression test, verify failure, implement the smallest correction, rerun the focused test, then rerun the complete release sequence.

- [ ] **Step 4: Confirm the Git worktree contains no unintended files**

Run: `git status --short` and inspect every path. Expected: only intentional product files or a clean tree; existing unrelated user changes remain untouched.

- [ ] **Step 5: Commit final verified corrections if any**

```bash
git add xiaohongshu-ai-skill-guide
git commit -m "fix: finalize AI skill guide release"
```

Skip this commit when no corrections were necessary.


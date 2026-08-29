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


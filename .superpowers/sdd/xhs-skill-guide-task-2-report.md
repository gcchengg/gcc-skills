# Task 2 report: verified GitHub Skill catalog

Status: DONE

## Delivered

- Added `src/data/skills.js` with 60 verified Skill records: 21 from
  `JimLiu/baoyu-skills`, 19 from `anthropics/skills`, and 20 from active
  `heygen-com/hyperframes`.
- Each record has all required fields, a unique immutable GitHub `SKILL.md`
  URL, its source URL as evidence, `verifiedAt: 2026-08-28`, task tags,
  industry/role mappings, grade, learning cost, and a risk note.
- Added a 30-item independent `TASKS` registry. The validator now rejects
  unknown Skill task tags; it does not treat capabilities as task definitions.
- Added `scripts/verify-links.mjs`, a release-only bounded-concurrency link
  verifier that uses `HEAD` and falls back to `GET`.
- Added the candidate ledger and individual verification evidence ledger under
  `xiaohongshu-ai-skill-guide/research/`.

## Research method and outcomes

On 2026-08-28, focused GitHub searches identified candidate collections. Public
GitHub REST tree and commit endpoints enumerated each selected `SKILL.md` path
and produced immutable source URLs. The release verifier then returned HTTP 200
to `HEAD` for all 60 frozen source links. The local installed skills were used
only as a cross-check for the Baoyu descriptions; acceptance evidence is the
public frozen source listed in `verification-evidence.json`.

The records span content and social publishing, translation, video, image and
diagram production, documents, spreadsheets and PDFs, internal communication,
education, research, design systems, knowledge management, project planning,
and limited software work. Five records explicitly set
`softwareDevelopmentOnly: true` (5/60, 8.3%); multi-industry skills are not
counted as software-only.

## Test-first evidence

1. Added catalog-size and Skill task-tag tests before `skills.js` and the
   validator change. `npm test` initially failed because `src/data/skills.js`
   did not exist and because unknown Skill task tags were accepted.
2. Added the frozen individual `SKILL.md` source test before extending the
   validator. It initially failed because only repository URLs plus README
   evidence were accepted.
3. Added the link-verifier fallback test before `verify-links.mjs`. It
   initially failed because that module did not exist.

## Final command results

Executed in `xiaohongshu-ai-skill-guide` on 2026-08-28:

```text
npm test              PASS — 26 tests, 26 passed, 0 failed
npm run validate:data PASS — Catalog data contract is valid (60 verified skills)
npm run check:package PASS
node scripts/verify-links.mjs PASS — Verified 60 catalog links
```

## Concerns

None blocking. Link reachability is inherently time-dependent; rerun
`npm run verify:links` before a later release. The B-grade records are
community-maintained and their external publishing or third-party interface
risks are captured per record in `riskNote`.

## Review-fix evidence — 2026-08-28

The review identified that the frozen `openai/skills` README marks that source
deprecated. All 20 affected records were removed and replaced one-for-one with
20 active, commit-pinned `heygen-com/hyperframes` `SKILL.md` files at
`af1cb1c10da33bade100db8233435c7591b7c0bc`. The HyperFrames repository was
pushed at `2026-08-28T06:44:14Z`; its pinned README describes an actively
maintained HTML-to-video framework for agents and documents installation of 20
skills. The candidate and evidence ledgers now record the deprecation,
replacement, focused multi-domain searches, and explicit Baoyu discovery.

New red tests were added before the fixes. They initially showed missing
SkillRecord-field validation, duplicate-link detection, industry resolution,
the software-only ceiling, and no GET fallback after a thrown HEAD request.
The validator now requires all SkillRecord fields, non-empty task/industry/role
arrays, valid learning cost, exact A/B grades, same-source pinned evidence,
unique GitHub URLs, known industries whenever an industry registry is present,
and an explicit `softwareDevelopmentOnly` boolean capped at 20%. The verifier
now attempts GET after either a non-OK or a thrown HEAD request, while retaining
bounded concurrency; tests cover both paths and a concurrency limit of two.

Final remediation verification on 2026-08-28:

```text
npm test              PASS — 26 tests, 26 passed, 0 failed
npm run validate:data PASS — Catalog data contract is valid (60 verified skills)
npm run build         PASS — package check and data validation
npm run check:package PASS
node scripts/verify-links.mjs PASS — 60/60 HTTP 200 HEAD responses
accepted deprecated-source count: 0
softwareDevelopmentOnly count: 5/60 (8.3%)
```

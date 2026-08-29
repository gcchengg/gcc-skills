# Xiaohongshu AI Skill Setup Guide

This directory contains the complete dependency-free Xiaohongshu widget and
its frozen, verified Skill catalog. The browser runtime is a single-page app,
uses no network API, and keeps all recommendation data inside the upload pack.
`src/data/tasks.js` is the authoritative registry for canonical task IDs.

## Requirements

Node.js 20 or later. No packages are installed or fetched.

## Commands

```sh
npm test
npm run validate:data
npm run verify:links
npm run check:package
npm run build
```

`validate:data` validates the checked-in 60-record Skill catalog and its task
links. Later dataset tasks should call `validateCatalog({ industries, roles,
tasks, questions, skills, capabilities })` with their real arrays as part of
their own validation command. Release checks enable the metadata threshold.
`verify:links` is a Node-only, release-time network check; normal application
runtime remains offline.

`build` recreates both deliverables:

- `dist/xiaohongshu-ai-skill-guide/` for local preview.
- `dist/xiaohongshu-ai-skill-guide.zip` for Builder Hub upload.

`check:package` verifies one HTML entry, local runtime assets, absence of
network APIs/research/test files, and the 2,000,000-byte package ceiling.

## Local preview

```sh
python3 -m http.server 8080 --directory dist/xiaohongshu-ai-skill-guide
```

Open `http://localhost:8080`. Test the first-entry animation, all five input
steps, GitHub view/copy actions, result regeneration, and share-card saving.

## Builder Hub release

1. Run `npm test && npm run validate:data`.
2. With network access, run `npm run verify:links` and resolve every failed
   frozen source before publishing.
3. Run `npm run build && npm run check:package`.
4. Upload `dist/xiaohongshu-ai-skill-guide.zip` in Builder Hub.
5. Preview on a phone in half-screen and full-screen modes before submitting.

The widget does not provide a universal installation command. “查看 GitHub”
opens the frozen source for users to evaluate with their own AI environment.

## Data contract

`src/data/meta.js` exports:

```js
CATALOG_META = {
  version: '1.0.0',
  verifiedAt: '2026-08-28',
  minimumVerifiedSkills: 60
}
```

`scripts/validate-data.mjs` exports `validateCatalog(catalog, options)`, which
returns an array of human-readable validation errors instead of throwing. An
empty array means the provided catalog is valid. `options.enforceMinimum` is
`false` by default so the Task 1 empty fixtures remain valid; set it to `true`
for a release/complete catalog to enforce `minimumVerifiedSkills`.

Every collection record needs a unique `id`. Values whose field names end in
`At` must be real ISO-8601 calendar dates. Skills need a GitHub repository URL
or an individual frozen `blob/<commit>/.../SKILL.md` source URL, evidence tied
to that location, a `qualityGrade` of `A` or `B`, and task tags from the
separate task registry. A standalone repository may use a pinned GitHub
`blob/<commit>/README...` evidence URL, or a structured `{ repositoryUrl,
readmeUrl }` record with the same pinned URL and repository URL. Capability
records must not contain `githubUrl`. Skill records must also have non-empty
`summary`, `taskTags`, `industryIds`, `roleIds`, `learningCost`, `verifiedAt`,
and `riskNote` fields. Learning cost is `low`, `medium`, or `high`; when an
industry registry is supplied, every Skill industry ID must resolve through it.
`softwareDevelopmentOnly` is an explicit boolean and at most 20% of Skill
records may set it to `true`.

Role `industryIds` must reference known industry IDs. A role's `taskWeights`
keys are task IDs and must match `^[a-z][a-z0-9_]+$`; each key must reference
the separate `tasks[].id` registry. Task IDs must match that format.
Capabilities represent uncovered gaps and are not canonical task IDs, so their
stable IDs need only be unique and non-empty; each `capability.taskTags` entry
must reference a registered task. Question options need an integer `delta` from
`-3` through `3`.

# Verified Skill research

This directory preserves the research trail for the offline Skill catalog.

- `candidate-repositories.json` records each focused GitHub query, every URL
  considered from those queries, the accepted repositories, and explicit
  exclusions.
- `verification-evidence.json` records all 60 accepted Skills individually.
  Each record contains the owner/repository, recorded activity timestamp,
  quality decision, task tags, risk note, a frozen `SKILL.md` source URL, and
  the collection README at the same frozen commit.

## Evidence policy

The catalog uses a commit-pinned `SKILL.md` as `githubUrl` and `evidence`.
This is deliberately a source link, rather than reusing one collection README
for many records: an individual skill’s own instructions demonstrate its
inputs, actions, and intended outputs. The linked README documents the
collection and is retained in the evidence ledger. The validator accepts this
frozen source form as well as the original frozen-README form for a standalone
repository.

Only non-deprecated sources are accepted. The remediation ledger records the
rejected `openai/skills` collection and its replacement with active
HyperFrames sources.

## Reproduce the release check

From `xiaohongshu-ai-skill-guide` run:

```sh
npm test
npm run validate:data
npm run verify:links
```

`verify:links` is a Node-only release utility. It checks the 60 frozen URLs
with bounded concurrency, using `HEAD` first and `GET` only when necessary;
it is not imported by a browser bundle.

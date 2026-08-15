# Final Review Fix Brief

Work in `/Users/guocc/Documents/guquan/github/gcc-skills`. Preserve unrelated user changes. Fix all Critical and Important final-review findings in one coherent change set. Follow TDD and commit only `lofter-x-anime-hotspot/**` plus the implementation plan amendment.

## 1. Separate IP pool from content candidates

- Model the pool as exactly five unique `ip_id` entries: two `long_term`, two `rising`, one `experiment`.
- Add `templates/ip-pool.example.json` with five distinct IP IDs and names.
- Validate exact category counts and uniqueness independently from topic ranking.
- Rank any number of eligible topic candidates; do not cap candidates to 2/2/1 and do not fail merely because one category has fewer eligible topics.
- Every candidate must contain `ip_id`, and it must reference a pool entry with matching slot/name.

## 2. Define and validate one shared candidate schema

Require typed fields needed by all downstream consumers: `id`, `title`, `ip_id`, `ip_name`, `ip_slot`, `characters` (list of non-empty strings), `tags` (list), score dimensions, `x_evidence`, `lofter_evidence`, `x_source_urls` (non-empty HTTPS X URLs), `observed_at` (ISO-8601 string), and media intent fields.

Media intent must include:

- `asset_id`: string or null;
- `requested_usage`: `original`, `ai_adaptation`, or `independent`;
- `commercial_intent`: strict boolean;
- `image_provenance`: `authorized_original`, `authorized_ai_adaptation`, `human_original`, `ai_assisted_original`, or `ai_generated_original`.

Reject inconsistent combinations. Remove the configurable threshold mismatch: use one constant threshold of 70 throughout.

## 3. Make authorization fail closed and complete

Expand authorization records to cover the approved design:

- non-empty `asset_id`, `author_handle`, HTTPS `source_url`, and existing local `evidence_path`;
- strict booleans for `lofter_redistribution`, `ai_adaptation`, `commercial_use`, `translation`, `crop`, and `layout`;
- `allowed_platforms` containing `LOFTER`;
- `attribution_mode`: `public`, `anonymous_allowed`, or `required`;
- `original_asset_id`: null for an original, otherwise the source asset ID;
- `derived_asset_ids`: list of strings;
- `publication_history`: list of objects with ISO date and LOFTER URL.

Reject truthy non-booleans, null/empty identifiers, non-HTTPS URLs, nonexistent evidence paths, missing LOFTER scope, and unauthorized requested operations. Validator output must carry `asset_id`, requested usage, commercial flag, source, author, attribution mode, and platform. Resolve relative evidence paths against the ledger file directory in the CLI.

## 4. Bind authorization end to end

- Authorized candidates must name the exact `asset_id`; independent media must use null.
- Packet generation must exact-match candidate `asset_id`, requested usage, and commercial intent against validated authorization output.
- Reject forged `{allowed: true}`, mismatched IDs, mismatched usage, and mismatched commercial scope.
- Score dimension `authorization` remains a research-quality score only; it must never by itself authorize media use.

## 5. Add column-specific packet shapes

Support four columns:

- `daily_hotspot`: one candidate, 200–400 Chinese characters target, daily-hotspot interaction question;
- `weekly_trend`: exactly five ranked candidates, each with X signal, LOFTER signal, and sustainability note; weekly selection question;
- `media_curation`: one candidate plus validated or independent media provenance; one media-focused question;
- `fanfic`: one candidate, 800–2000 Chinese characters target, verified research, prior observation provenance, and one continuation question.

Fan-fiction gate requires all five existing research checks plus `observation_url`, `observation_published_at`, and either:

- weeks 1–2 baseline policy explicitly selected; or
- week 3+ performance qualification `top_40_percent: true`.

Do not generate public prose automatically; generate a human-review packet containing exact structural requirements and exactly one interaction-question line.

## 6. Correct AI disclosure

Use exact provenance behavior:

- `authorized_original` or `human_original`: no AI label;
- `authorized_ai_adaptation`: `图像经授权使用，含AI辅助创作｜#AI辅助#`;
- `ai_assisted_original`: `#AI辅助#`;
- `ai_generated_original`: `#AI生成#`.

Do not claim authorized use for independent images.

## 7. Make CLI and Skill self-contained

- Add a packet-input example showing each payload shape or separate examples per column.
- Make commands copy-paste safe using a skill-specific path variable such as `LOFTER_SKILL_DIR`; never write `original|ai_adaptation` as a shell pipeline.
- Show validator output capture and packet input construction.
- Commands must work regardless of current directory.
- Keep manual human review and no automatic publishing.

## 8. Fix metadata using official tooling

- Read the official `skill-creator` metadata rules already available in the main session.
- `short_description` must be 25–64 characters.
- `default_prompt` must explicitly mention `$lofter-x-anime-hotspot`.
- Regenerate with `/Users/guocc/.codex/skills/.system/skill-creator/scripts/generate_openai_yaml.py` and validate with `/Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py`.

## 9. Tests and plan synchronization

Add tests for:

- distinct IP-pool validation, wrong counts, duplicate IDs, and candidates referencing the pool;
- malformed booleans (`"false"`, `1`, null), empty values, invalid URLs, missing evidence, duplicate ledger IDs;
- authorization ID/usage/commercial mismatch and forged authorization dictionaries;
- every disclosure branch;
- weekly report requiring/rendering five items;
- media-curation packet;
- fan-fiction baseline and week-3 qualification gates;
- CLI subprocess success/failure and the exact example end-to-end workflow;
- skill metadata and quick validation.

Run the complete test suite and official Skill validator. Update `docs/superpowers/plans/2026-08-10-lofter-x-anime-hotspot-skill.md` with a clearly labeled final-review amendment describing the corrected schemas, commands, and actual test count; it is acceptable to keep the original task bodies as historical plan text if the amendment is authoritative and linked at the top.

Write the full fix report, including each review finding mapped to code/tests, exact commands/output, commit hash, and concerns, to `.superpowers/sdd/final-fix-report.md`. Return DONE/DONE_WITH_CONCERNS/BLOCKED with commit and one-line verification summary.

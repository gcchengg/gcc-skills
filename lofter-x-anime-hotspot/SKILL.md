---
name: lofter-x-anime-hotspot
description: Analyze current anime, game, character, and CP hotspots across X and LOFTER, rank candidates, verify media authorization, and create Chinese LOFTER trend or fan-fiction content packets. Use when the user wants hotspot-driven LOFTER anime content, X-to-LOFTER curation, or a 30-day LOFTER growth workflow.
---

# LOFTER × X Anime Hotspot

Use Chinese when communicating with the user.

## Workflow

1. Collect current 24—72 hour X and LOFTER evidence for candidate topics.
2. Maintain 2 `long_term`, 2 `rising`, and 1 `experiment` IP slots.
3. Save candidate values using `templates/candidates.example.json` as the schema.
4. Run `python3 scripts/score_candidates.py INPUT --output ranked.json`.
5. Reject candidates below 70. A candidate with authorization score 0 may use only an independently created image.
6. For original or AI-adapted X images, record authorization using `templates/authorizations.example.json`, then run `python3 scripts/validate_authorizations.py LEDGER ASSET_ID --usage original|ai_adaptation`.
7. Before fan fiction, verify world, characters, relationships, CP conventions, and fandom risks. If any check is incomplete, produce hotspot analysis instead.
8. Generate the Markdown brief with `python3 scripts/build_content_packet.py INPUT --output packet.md`.
9. Human-review facts, tags, labels, image scope, and the single interaction question before publication.
10. Never publish automatically.

## Required Rules

- Read `references/operating-rules.md` before ranking or scheduling.
- Read `references/content-templates.md` before drafting public copy.
- Do not treat a public X post as permission.
- AI adaptation requires explicit AI adaptation authorization.
- Commercial use is false unless the authorization record says true.
- Keep authorization evidence in the private ledger; do not expose private evidence in public copy.
- For authorized AI-assisted images, end public copy with `图像经授权使用，含AI辅助创作｜#AI辅助#`.
- Do not add irrelevant trending tags or hard paywall cliffhangers during the first 30 days.

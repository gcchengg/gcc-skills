# Operating rules

## Separate IP pool

Maintain exactly five unique `ip_id` entries: two `long_term`, two `rising`, and one `experiment`. A candidate references one pool entry and must exact-match its `ip_name` and `ip_slot`. Rank every topic scoring at least 70; do not cap topics by pool category or require an eligible topic from every category.

## Shared candidate contract

Require typed identity/IP fields, non-empty character names, a tag list, all five bounded score dimensions, X and LOFTER evidence, at least one HTTPS X source URL, an ISO-8601 observation timestamp, and complete media intent.

Media intent is one of:

- `original` + non-empty asset ID + `authorized_original`;
- `ai_adaptation` + non-empty asset ID + `authorized_ai_adaptation`;
- `independent` + null asset ID + `human_original`, `ai_assisted_original`, or `ai_generated_original`.

`commercial_intent` is a strict boolean. The numeric authorization score measures research completeness only and never grants media permission.

## Authorization ledger

Require non-empty asset/source/author/evidence values; exact booleans for redistribution, AI adaptation, commercial use, translation, crop, and layout; LOFTER platform scope; attribution mode; original/derived lineage; and publication history. Resolve relative evidence paths from the ledger directory. Reject malformed types, missing evidence, duplicate IDs, incomplete lineage, and any requested operation outside scope.

## Fan-fiction gate

Require all five research checks, prior observation URL/date, and one phase gate:

- weeks 1–2: `baseline_policy_selected: true`;
- week 3+: `top_40_percent: true` based on the latest 14-day account performance.

Otherwise publish only a trend-analysis review packet.

## Publication review

Verify score ≥70, accurate labels, exact authorization binding, disclosure, one interaction question, no unsupported facts, no hard paywall, and no public prose generated automatically. Human review and manual publication are mandatory.

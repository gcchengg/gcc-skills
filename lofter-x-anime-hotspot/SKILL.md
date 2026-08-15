---
name: lofter-x-anime-hotspot
description: Analyze current anime, game, character, and CP hotspots across X and LOFTER, validate a distinct five-IP pool and complete media authorization, and create Chinese human-review packets for daily hotspots, weekly trends, media curation, or qualified fan fiction. Use for hotspot-driven LOFTER anime content, X-to-LOFTER curation, or a 30-day LOFTER growth workflow.
---

# LOFTER × X Anime Hotspot

Use Chinese with the user. Produce human-review packets only; never draft public prose or publish automatically.

## Load rules

- Read `references/operating-rules.md` before ranking, authorization, or fan-fiction qualification.
- Read `references/content-templates.md` before generating a packet.
- Use `templates/ip-pool.example.json` and `templates/candidates.example.json` as schemas. `templates/authorizations.example.json` is smoke-test data only and is forbidden for operational authorization or publication.
- Use `templates/packet-inputs.example.json` for all four column payload shapes.

## Run the workflow

Resolve the Skill directory once. The default below works for a normal Codex Skill installation and all later commands work from any current directory:

```bash
LOFTER_SKILL_DIR="${CODEX_HOME:-${HOME}/.codex}/skills/lofter-x-anime-hotspot"
LOFTER_WORK_DIR="$(mktemp -d)"
```

When operating from a repository checkout, set `LOFTER_SKILL_DIR` to the absolute directory containing this `SKILL.md`.

1. Collect current 24–72 hour X and LOFTER evidence. Maintain the five-entry IP pool separately from any number of topic candidates.
2. Rank every eligible topic using the fixed threshold of 70:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/score_candidates.py" \
  "$LOFTER_SKILL_DIR/templates/candidates.example.json" \
  --ip-pool "$LOFTER_SKILL_DIR/templates/ip-pool.example.json" \
  --output "$LOFTER_WORK_DIR/ranked.json"
```

3. For operational media use, copy the authorization schema into a private work ledger, replace every example identity, URL, permission, and evidence reference with real evidence, and set `example_only` to `false`. Then validate and capture the exact asset decision:

```bash
cp "$LOFTER_SKILL_DIR/templates/authorizations.example.json" "$LOFTER_WORK_DIR/authorizations.json"
# Edit $LOFTER_WORK_DIR/authorizations.json now; do not proceed with placeholder data.
python3 "$LOFTER_SKILL_DIR/scripts/validate_authorizations.py" \
  "$LOFTER_WORK_DIR/authorizations.json" \
  REAL_ASSET_ID \
  --usage original \
  > "$LOFTER_WORK_DIR/authorization.json"
```

For an authorized AI adaptation, use a separate command and list every requested operation:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/validate_authorizations.py" \
  "$LOFTER_WORK_DIR/authorizations.json" \
  REAL_DERIVED_ASSET_ID \
  --usage ai_adaptation \
  --operation layout \
  > "$LOFTER_WORK_DIR/authorization.json"
```

4. Construct a daily packet-input file from the captured outputs. Keep `asset_id`, requested usage, and commercial intent unchanged:

```bash
python3 - "$LOFTER_SKILL_DIR" "$LOFTER_WORK_DIR" <<'PY'
import json
import sys
from pathlib import Path

skill_dir = Path(sys.argv[1])
work_dir = Path(sys.argv[2])
ranked = json.loads((work_dir / "ranked.json").read_text(encoding="utf-8"))
authorization = json.loads((work_dir / "authorization.json").read_text(encoding="utf-8"))
ip_pool = json.loads((skill_dir / "templates/ip-pool.example.json").read_text(encoding="utf-8"))
candidate = next(item for item in ranked if item["asset_id"] == authorization["asset_id"])
payload = {
    "column": "daily_hotspot",
    "ip_pool": ip_pool,
    "candidate": candidate,
    "authorization": authorization,
    "authorization_ledger_path": str(work_dir / "authorizations.json"),
}
(work_dir / "packet-input.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8"
)
PY
```

5. Generate the human-review packet:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/build_content_packet.py" \
  "$LOFTER_WORK_DIR/packet-input.json" \
  --output "$LOFTER_WORK_DIR/packet.md"
```

6. Human-review facts, source links, IP/character/CP terminology, tags, authorization scope, disclosure, structural requirements, and the single interaction question. Never publish automatically.

### Smoke-test bundled examples

Bundled authorization examples may only exercise the pipeline. Pass `--smoke-only`, preserve `smoke_only: true` in packet input, and never publish the resulting packet; it is deliberately marked `仅供测试｜禁止发布` and cannot claim verified authorization:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/validate_authorizations.py" \
  "$LOFTER_SKILL_DIR/templates/authorizations.example.json" \
  example-asset-adapted-1 --usage ai_adaptation --operation layout --smoke-only \
  > "$LOFTER_WORK_DIR/authorization.json"
```

### Validate this Skill checkout

Install the pinned validator dependency into the ignored project-local directory, then resolve the official validator portably:

```bash
SKILL_CREATOR_ROOT="${SKILL_CREATOR_ROOT:-${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator}"
python3 -m pip install --requirement "$LOFTER_SKILL_DIR/requirements-dev.txt" \
  --target "$LOFTER_SKILL_DIR/.dev-deps"
PYTHONPATH="$LOFTER_SKILL_DIR/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" \
  python3 "$SKILL_CREATOR_ROOT/scripts/quick_validate.py" "$LOFTER_SKILL_DIR"
```

## Fail-closed rules

- Treat the `authorization` score dimension as research quality only. It never authorizes an asset.
- Use a null `asset_id` only with `requested_usage: independent`; never attach an authorization decision to independent media.
- Exact-match authorized asset ID, usage, commercial intent, provenance, and LOFTER platform against validator output. Packet generation reopens the named ledger, verifies its evidence, and regenerates the decision before accepting it.
- Do not treat a public X post as permission. Require an existing local evidence file and complete ledger scope.
- Reject `example_only` evidence in normal mode. Smoke-only output is test-only and publication-forbidden.
- Require all five research checks, a prior LOFTER observation URL/date, and the applicable baseline or top-40% gate before fan fiction.
- Keep authorization evidence private. Do not add unrelated trending tags or hard-paywall cliffhangers.

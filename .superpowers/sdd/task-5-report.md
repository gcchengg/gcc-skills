# Task 5 Report: Example Inputs and End-to-End Verification

## Delivered files

- `lofter-x-anime-hotspot/templates/candidates.example.json`
- `lofter-x-anime-hotspot/templates/authorizations.example.json`

Both files match the Task 5 examples exactly and parse as JSON. Their fields are compatible with the scoring, authorization, and packet-builder interfaces.

## Verification

- `python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v` passed: 13 tests, `OK` (the brief's expected 11-test count is stale).
- The authorization CLI accepts `example-asset-1` for `ai_adaptation`.
- A complete temporary CLI workflow, using the example candidate plus four temporary slot-capacity fixtures, generated a packet containing `总分：89/100`, `互动问题：`, and `#AI辅助#`.

## Superseded compatibility finding

The former one-candidate smoke incompatibility was resolved by commit `16333b1`. The real candidate example now supplies the required five eligible records across the fixed capacities (two `long_term`, two `rising`, and one `experiment`), so the exact smoke workflow completes without supplemental fixtures.

## Plan-conflict resolution update

The candidate example and the Task 5 Step 1 JSON in `docs/superpowers/plans/2026-08-10-lofter-x-anime-hotspot-skill.md` now contain the same five eligible records: two `long_term`, two `rising`, and one `experiment`. `example-hotspot-1` is unchanged and remains the highest-ranked candidate at 89/100; every added record contains the scoring and packet fields and totals from 71 through 79.

### Exact verification commands and results

```bash
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v
```

Result: `Ran 13 tests` and `OK`.

```bash
tmp_dir="$(mktemp -d)"
python3 lofter-x-anime-hotspot/scripts/score_candidates.py \
  lofter-x-anime-hotspot/templates/candidates.example.json \
  --output "$tmp_dir/ranked.json"
python3 lofter-x-anime-hotspot/scripts/validate_authorizations.py \
  lofter-x-anime-hotspot/templates/authorizations.example.json \
  example-asset-1 --usage ai_adaptation > "$tmp_dir/asset.json"
python3 - "$tmp_dir" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
candidate = json.loads((root / "ranked.json").read_text(encoding="utf-8"))[0]
asset = json.loads((root / "asset.json").read_text(encoding="utf-8"))
payload = {
    "candidate": candidate,
    "column": "daily_hotspot",
    "research": {},
    "asset": asset,
}
(root / "packet-input.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
PY
python3 lofter-x-anime-hotspot/scripts/build_content_packet.py \
  "$tmp_dir/packet-input.json" --output "$tmp_dir/packet.md"
rg -n "总分：89/100|#AI辅助#|互动问题：" "$tmp_dir/packet.md"
```

Result:

```text
6:总分：89/100
19:互动问题：你更想看这个热点的趋势拆解，还是角色故事？
21:图像经授权使用，含AI辅助创作｜#AI辅助#
```

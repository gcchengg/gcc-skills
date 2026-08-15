### Task 5: Example Inputs and End-to-End Verification

**Files:**
- Create: `lofter-x-anime-hotspot/templates/candidates.example.json`
- Create: `lofter-x-anime-hotspot/templates/authorizations.example.json`

**Interfaces:**
- Consumes: the CLI commands from Tasks 1—3.
- Produces: reproducible sample files and a verified content packet in a temporary directory.

- [ ] **Step 1: Create the candidate example**

```json
[
  {
    "id": "example-hotspot-1",
    "title": "示例角色纪念日创作增长",
    "ip_name": "示例IP",
    "ip_slot": "rising",
    "characters": ["角色A", "角色B"],
    "tags": ["示例IP", "角色A"],
    "x_growth": 27,
    "lofter_activity": 24,
    "ip_match": 15,
    "authorization": 15,
    "story_potential": 8,
    "x_evidence": "近24小时相关公开帖互动与创作数量集中增长",
    "lofter_evidence": "对应标签出现持续更新和有效互动"
  }
]
```

- [ ] **Step 2: Create the authorization example**

```json
[
  {
    "asset_id": "example-asset-1",
    "author_handle": "@authorized_artist",
    "source_url": "https://x.com/authorized_artist/status/example",
    "evidence_path": "authorizations/example-asset-1.png",
    "lofter_redistribution": true,
    "ai_adaptation": true,
    "commercial_use": false
  }
]
```

- [ ] **Step 3: Run all unit tests**

Run:

```bash
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v
```

Expected: `Ran 11 tests` and `OK`.

- [ ] **Step 4: Run the scoring and authorization smoke test**

Run:

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

Expected: three matching lines, including `总分：89/100`, `互动问题：`, and `#AI辅助#`.

- [ ] **Step 5: Commit examples and run final verification**

```bash
git add lofter-x-anime-hotspot/templates
git commit -m "test: add LOFTER hotspot workflow examples"
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v
git status --short
```

Expected: all 11 tests pass. `git status --short` may show pre-existing unrelated user changes, but none of the paths under `lofter-x-anime-hotspot/` are modified or untracked.

---

## Deferred Work

The following items are intentionally excluded until the 30-day account test establishes real value and platform-safe operating data:

- Automated X or LOFTER scraping;
- Automatic LOFTER login or publishing;
- Automatic image downloading or image-to-image generation;
- Automatic CP selection without human verification;
- Monetization, paywall, advertising, or commercial-use workflows;
- Dashboarding beyond JSON and Markdown artifacts.

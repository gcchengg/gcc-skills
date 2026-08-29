### Task 2: Research Sufficiency, Topic Selection, and Content Mode

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/score_candidates.py`
- Create: `lofter-x-anime-hotspot/scripts/select_publishable_topic.py`
- Create: `lofter-x-anime-hotspot/tests/test_select_publishable_topic.py`
- Create: `lofter-x-anime-hotspot/templates/run-input.example.json`
- Modify: `lofter-x-anime-hotspot/templates/candidates.example.json`
- Modify: `lofter-x-anime-hotspot/templates/packet-inputs.example.json`
- Modify: `lofter-x-anime-hotspot/tests/test_score_candidates.py`

**Interfaces:**
- Consumes: `score_candidates.rank_candidates(candidates: list[dict], ip_pool: list[dict]) -> list[dict]`
- Produces: `select_topic(payload: dict) -> dict` with keys `time_window_hours`, `candidate`, `content_mode`, `selection_reason`
- Content modes: `trend_analysis`, `fanfic`, `visual_curation`
- Research payload contains `ip_pool`, `windows.24`, and optional `windows.72`; each window contains `x_sources`, `lofter_sources`, and `candidates`

- [ ] **Step 1: Write failing selection tests**

```python
class SelectPublishableTopicTest(unittest.TestCase):
    def test_uses_24_hours_when_sources_and_candidates_are_sufficient(self):
        payload = fixture_payload()
        result = select_topic(payload)
        self.assertEqual(result["time_window_hours"], 24)
        self.assertEqual(result["candidate"]["id"], "high-score")

    def test_expands_to_72_hours_when_24_hours_are_insufficient(self):
        payload = fixture_payload()
        payload["windows"]["24"]["lofter_sources"] = []
        result = select_topic(payload)
        self.assertEqual(result["time_window_hours"], 72)

    def test_refuses_to_draft_without_two_platforms_and_eligible_topic(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"] = []
        payload["windows"]["72"]["candidates"] = []
        with self.assertRaisesRegex(ValueError, "no publishable topic"):
            select_topic(payload)

    def test_mode_is_derived_from_evidence_features(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"][0]["topic_features"] = {
            "event_signal": False,
            "relationship_signal": True,
            "visual_signal": False,
        }
        self.assertEqual(select_topic(payload)["content_mode"], "fanfic")
```

- [ ] **Step 2: Run the selection tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'select_publishable_topic'`.

- [ ] **Step 3: Implement deterministic sufficiency and mode selection**

```python
def _window_is_sufficient(window: dict, ranked: list[dict]) -> bool:
    return (
        isinstance(window.get("x_sources"), list)
        and len(window["x_sources"]) >= 2
        and isinstance(window.get("lofter_sources"), list)
        and len(window["lofter_sources"]) >= 1
        and bool(ranked)
    )

def _content_mode(candidate: dict) -> str:
    features = candidate.get("topic_features")
    if not isinstance(features, dict):
        raise ValueError("topic_features must be an object")
    values = {name: features.get(name) for name in (
        "event_signal", "relationship_signal", "visual_signal"
    )}
    if any(type(value) is not bool for value in values.values()):
        raise ValueError("topic feature signals must be booleans")
    if values["event_signal"]:
        return "trend_analysis"
    if values["relationship_signal"]:
        return "fanfic"
    if values["visual_signal"]:
        return "visual_curation"
    raise ValueError("topic has no supported content mode")

def select_topic(payload: dict) -> dict:
    ip_pool = payload["ip_pool"]
    for hours in (24, 72):
        window = payload.get("windows", {}).get(str(hours))
        if window is None:
            continue
        ranked = rank_candidates(window.get("candidates"), ip_pool)
        if _window_is_sufficient(window, ranked):
            winner = ranked[0]
            return {
                "time_window_hours": hours,
                "candidate": winner,
                "content_mode": _content_mode(winner),
                "selection_reason": (
                    f"{hours}小时窗口内综合评分最高：{winner['total_score']}/100"
                ),
            }
    raise ValueError("no publishable topic in 24-hour or 72-hour window")
```

Extend candidate validation in `score_candidates.py` to require a `topic_features` object with the three strict booleans. Update existing candidate fixtures, `candidates.example.json`, and every embedded candidate in `packet-inputs.example.json` with values that preserve their current ranking and media semantics.

- [ ] **Step 4: Add the complete non-authorizing input example and run tests**

The example must contain the exact top-level shape below, populated with the existing five-IP example pool and valid candidate objects copied from `candidates.example.json`; it must not contain authorization decisions or evidence paths:

```json
{
  "ip_pool": [],
  "windows": {
    "24": {"x_sources": [], "lofter_sources": [], "candidates": []},
    "72": {"x_sources": [], "lofter_sources": [], "candidates": []}
  }
}
```

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`  
Expected: all scoring and selection tests PASS with unchanged eligible ordering.

- [ ] **Step 5: Commit Task 2**

```bash
git add lofter-x-anime-hotspot/scripts/score_candidates.py lofter-x-anime-hotspot/scripts/select_publishable_topic.py lofter-x-anime-hotspot/templates/candidates.example.json lofter-x-anime-hotspot/templates/packet-inputs.example.json lofter-x-anime-hotspot/templates/run-input.example.json lofter-x-anime-hotspot/tests/test_score_candidates.py lofter-x-anime-hotspot/tests/test_select_publishable_topic.py
git commit -m "feat: select one publishable hotspot"
```


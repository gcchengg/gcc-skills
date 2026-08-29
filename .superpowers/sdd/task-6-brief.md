### Task 6: Two-Confirmation Publication Gate

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/publication_gate.py`
- Create: `lofter-x-anime-hotspot/tests/test_publication_gate.py`

**Interfaces:**
- Produces: `approve_form_fill(run_dir: Path, confirmation: str) -> dict`
- Produces: `build_upload_manifest(run_dir: Path) -> dict`
- Produces: `mark_form_filled(run_dir: Path, platform_preview: dict) -> dict`
- Produces: `approve_final_submit(run_dir: Path, confirmation: str) -> dict`
- Produces: `record_publication(run_dir: Path, result: dict) -> dict`
- Exact confirmation phrases: first `确认发布`, second `确认最终提交`

- [ ] **Step 1: Write failing publication-gate tests**

```python
class PublicationGateTest(unittest.TestCase):
    def test_first_confirmation_requires_all_media_publishable(self):
        run_dir = prepared_review_run()
        with self.assertRaisesRegex(ValueError, "media review incomplete"):
            approve_form_fill(run_dir, "确认发布")

    def test_wrong_or_reused_confirmation_cannot_advance(self):
        run_dir = fully_reviewed_run()
        with self.assertRaisesRegex(ValueError, "exact confirmation"):
            approve_form_fill(run_dir, "可以发布")
        approve_form_fill(run_dir, "确认发布")
        with self.assertRaisesRegex(ValueError, "final platform preview"):
            approve_final_submit(run_dir, "确认最终提交")

    def test_manifest_contains_only_authorized_or_independent_local_media(self):
        run_dir = fully_reviewed_run()
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        self.assertTrue(all(item["review_status"] in {"authorized", "independent"} for item in manifest["media"]))
        self.assertNotIn("authorization", json.dumps(manifest))
        self.assertNotIn("evidence_path", json.dumps(manifest))

    def test_second_confirmation_and_result_are_separate_events(self):
        run_dir = filled_form_run()
        state = approve_final_submit(run_dir, "确认最终提交")
        self.assertEqual(state["state"], "publishing")
        state = record_publication(run_dir, {
            "lofter_url": "https://example.lofter.com/post/abc",
            "published_at": "2026-08-11T16:00:00+08:00",
        })
        self.assertEqual(state["state"], "published")
```

- [ ] **Step 2: Run gate tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'publication_gate'`.

- [ ] **Step 3: Implement the first gate and private-free upload manifest**

```python
FIRST_CONFIRMATION = "确认发布"
SECOND_CONFIRMATION = "确认最终提交"
PUBLISHABLE_MEDIA = {"authorized", "independent"}

def approve_form_fill(run_dir: Path, confirmation: str) -> dict:
    if confirmation != FIRST_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认发布")
    state = load_state(run_dir)
    if state["state"] != "authorization_review":
        raise ValueError("run is not awaiting authorization review")
    ledger = load_media_ledger(run_dir)
    if not ledger or any(item["review_status"] not in PUBLISHABLE_MEDIA for item in ledger):
        raise ValueError("media review incomplete")
    return transition(
        run_dir, "authorization_review", "approved",
        confirmations={"fill": True, "submit": False},
    )

def build_upload_manifest(run_dir: Path) -> dict:
    state = load_state(run_dir)
    if state["state"] != "approved" or state["confirmations"]["fill"] is not True:
        raise ValueError("first publication confirmation is missing")
    ledger = load_media_ledger(run_dir)
    return {
        "title": _selected_title(run_dir),
        "article": (run_dir / "article.md").read_text(encoding="utf-8"),
        "tags": _tags(run_dir),
        "media": [
            {key: item[key] for key in ("display_id", "role", "local_path", "review_status")}
            for item in ledger
        ],
    }
```

- [ ] **Step 4: Implement platform-preview evidence, second gate, and result recording**

```python
def mark_form_filled(run_dir: Path, platform_preview: dict) -> dict:
    if not isinstance(platform_preview, dict):
        raise ValueError("platform preview must be an object")
    required = {"captured_at", "title", "media_count", "submit_button_visible"}
    if required - platform_preview.keys() or platform_preview["submit_button_visible"] is not True:
        raise ValueError("final platform preview is incomplete")
    return transition(run_dir, "approved", "publishing", platform_preview=platform_preview)

def approve_final_submit(run_dir: Path, confirmation: str) -> dict:
    state = load_state(run_dir)
    if confirmation != SECOND_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认最终提交")
    if state["state"] != "publishing" or not state.get("platform_preview"):
        raise ValueError("final platform preview is required")
    state["confirmations"]["submit"] = True
    write_json_atomic(run_dir / "status.json", state)
    return state

def record_publication(run_dir: Path, result: dict) -> dict:
    state = load_state(run_dir)
    if state["state"] != "publishing" or state["confirmations"]["submit"] is not True:
        raise ValueError("final submission confirmation is missing")
    _validate_lofter_url(result["lofter_url"])
    _validate_iso_datetime(result["published_at"])
    return transition(run_dir, "publishing", "published", publication=result)
```

Allow `publishing → approved` only for a safe pause before submit, storing a non-secret error. If the browser clicked submit but the result is uncertain, do not transition; record `publication.result = "uncertain"` and require a read-only LOFTER profile/drafts check before any further action.

- [ ] **Step 5: Run publication-gate tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v`  
Expected: all tests PASS, and no manifest contains authorization evidence.

- [ ] **Step 6: Commit Task 6**

```bash
git add lofter-x-anime-hotspot/scripts/publication_gate.py lofter-x-anime-hotspot/tests/test_publication_gate.py
git commit -m "feat: gate LOFTER publishing twice"
```


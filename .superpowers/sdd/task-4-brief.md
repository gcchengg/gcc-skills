### Task 4: Authorization Review and Independent Replacement

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`
- Create: `lofter-x-anime-hotspot/tests/test_media_review.py`

**Interfaces:**
- Produces: `record_media_review(run_dir: Path, media_id: int, authorized: bool, authorization: dict | None = None) -> dict`
- Produces: `replace_rejected_media(run_dir: Path, media_id: int, replacement: dict, article: str, captions: list[str]) -> dict`
- Consumes real authorization decisions regenerated from `authorization_ledger_path` through `validate_authorizations.validate_ledger` and `validate_authorization`

- [ ] **Step 1: Write failing review and replacement tests**

```python
class MediaReviewTest(unittest.TestCase):
    def test_authorized_x_media_requires_exact_ledger_backed_decision(self):
        run_dir = prepared_review_run()
        with self.assertRaisesRegex(ValueError, "ledger-backed"):
            record_media_review(run_dir, 1, True, {"allowed": True})

    def test_rejection_requires_generated_independent_replacement(self):
        run_dir = prepared_review_run()
        record_media_review(run_dir, 1, False)
        replacement = {
            "kind": "ai_adaptation",
            "local_path": "generated-media/replacement.webp",
            "generation_lineage": {"prompt": "new composition", "source_media_ids": [1]},
        }
        with self.assertRaisesRegex(ValueError, "generated_original"):
            replace_rejected_media(run_dir, 1, replacement, long_article(), ["新图"])

    def test_replacement_changes_only_rejected_media_and_affected_copy(self):
        run_dir = prepared_review_run()
        before = load_media_ledger(run_dir)
        record_media_review(run_dir, 1, False)
        replacement = valid_independent_replacement(run_dir)
        result = replace_rejected_media(run_dir, 1, replacement, revised_article(), revised_captions())
        self.assertEqual(result[1], before[1])
        self.assertEqual(result[0]["kind"], "generated_original")
        self.assertEqual(result[0]["review_status"], "independent")
```

- [ ] **Step 2: Run review tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py -v`  
Expected: FAIL because `record_media_review` and `replace_rejected_media` are undefined.

- [ ] **Step 3: Implement fail-closed review and replacement**

```python
def record_media_review(run_dir, media_id, authorized, authorization=None):
    if type(authorized) is not bool:
        raise ValueError("authorized must be a boolean")
    ledger = load_media_ledger(run_dir)
    media = _find_media(ledger, media_id)
    if media["review_status"] not in {"pending", "rejected"}:
        raise ValueError("media is not awaiting review")
    if authorized:
        if not isinstance(authorization, dict) or authorization.get("allowed") is not True:
            raise ValueError("authorized media requires a ledger-backed allow decision")
        _revalidate_media_decision(run_dir, media, authorization)
        media["review_status"] = "authorized"
        media["authorization"] = authorization
    else:
        media["review_status"] = "rejected"
        media.pop("authorization", None)
    write_json_atomic(run_dir / "sources/media-ledger.json", ledger)
    if not authorized:
        transition(run_dir, "authorization_review", "revisions_required")
    return media

def replace_rejected_media(run_dir, media_id, replacement, article, captions):
    ledger = load_media_ledger(run_dir)
    index, current = _find_media_with_index(ledger, media_id)
    if current["review_status"] != "rejected":
        raise ValueError("only rejected media can be replaced")
    if replacement.get("kind") != "generated_original":
        raise ValueError("replacement must be generated_original")
    lineage = replacement.get("generation_lineage")
    if not isinstance(lineage, dict) or lineage.get("source_media_ids"):
        raise ValueError("replacement must not derive from rejected source media")
    replacement = _validate_one_local_media(run_dir, replacement)
    ledger[index] = {
        **replacement,
        "display_id": media_id,
        "role": current["role"],
        "review_status": "independent",
        "replaces_media_id": media_id,
    }
    _rewrite_copy_artifacts(run_dir, _validate_article(article), captions)
    write_json_atomic(run_dir / "sources/media-ledger.json", ledger)
    transition(run_dir, "revisions_required", "authorization_review")
    return ledger
```

The lineage check must require `source_media_ids == []`; prompt text and model metadata are stored, but the rejected image path and bytes are never supplied to the image-generation call described in Task 7.

- [ ] **Step 4: Run media, draft, and authorization suites**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v`  
Expected: all tests PASS, including forged-decision rejection.

- [ ] **Step 5: Commit Task 4**

```bash
git add lofter-x-anime-hotspot/scripts/build_publishable_draft.py lofter-x-anime-hotspot/tests/test_media_review.py
git commit -m "feat: review and replace LOFTER media"
```


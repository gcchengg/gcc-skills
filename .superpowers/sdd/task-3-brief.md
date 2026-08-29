### Task 3: Draft and Media Manifest Validation

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`
- Create: `lofter-x-anime-hotspot/tests/test_build_publishable_draft.py`

**Interfaces:**
- Consumes: a run in `researching`, the selection result from Task 2, and a model-authored `draft-input.json`
- Produces: `build_draft(run_dir: Path, payload: dict) -> dict`
- Produces files: `article.md`, `titles-and-tags.md`, `publication-order.md`, `sources/media-ledger.json`, and copied media files
- Media statuses: `pending`, `authorized`, `rejected`, `independent`
- Media kinds: `x_original`, `ai_adaptation`, `generated_original`

- [ ] **Step 1: Write failing draft validation tests**

```python
class BuildPublishableDraftTest(unittest.TestCase):
    def test_builds_exact_publication_artifacts_and_enters_review(self):
        run_dir = self.create_run_with_local_media()
        result = build_draft(run_dir, valid_payload())
        self.assertEqual(result["state"], "authorization_review")
        self.assertTrue((run_dir / "article.md").is_file())
        self.assertTrue((run_dir / "titles-and-tags.md").is_file())
        self.assertTrue((run_dir / "publication-order.md").is_file())
        ledger = json.loads((run_dir / "sources/media-ledger.json").read_text())
        self.assertEqual([item["review_status"] for item in ledger], ["pending", "independent"])

    def test_rejects_wrong_article_length_title_count_or_tag_count(self):
        run_dir = self.create_run_with_local_media()
        for field, value, message in (
            ("article", "太短", "800–1500"),
            ("titles", ["一个标题"], "exactly three"),
            ("tags", ["标签"] * 7, "8–12"),
        ):
            payload = valid_payload()
            payload[field] = value
            with self.assertRaisesRegex(ValueError, message):
                build_draft(run_dir, payload)

    def test_rejects_missing_file_remote_url_and_evidence_path_leak(self):
        run_dir = self.create_run_with_local_media()
        payload = valid_payload()
        payload["article"] += " evidence_path=/private/authorization.txt"
        with self.assertRaisesRegex(ValueError, "private evidence"):
            build_draft(run_dir, payload)
```

- [ ] **Step 2: Run draft tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_build_publishable_draft.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'build_publishable_draft'`.

- [ ] **Step 3: Implement strict draft and media schema checks**

```python
PUBLIC_DISCLOSURE = "图像经授权使用，含AI辅助创作｜#AI辅助#"

def _validate_article(text: object) -> str:
    if not isinstance(text, str):
        raise ValueError("article must be a string")
    count = len("".join(text.split()))
    if not 800 <= count <= 1500:
        raise ValueError("article must contain 800–1500 non-whitespace characters")
    if "evidence_path" in text or "/private/" in text:
        raise ValueError("article leaks private evidence")
    return text.strip()

def _validate_media(run_dir: Path, records: object) -> list[dict]:
    if not isinstance(records, list) or not 1 <= len(records) <= 3:
        raise ValueError("media must contain one to three records")
    if sum(item.get("role") == "cover" for item in records if isinstance(item, dict)) != 1:
        raise ValueError("media must contain exactly one cover")
    result = []
    for index, item in enumerate(records, start=1):
        local_path = Path(item["local_path"])
        if local_path.is_absolute() or ".." in local_path.parts:
            raise ValueError("media local_path must stay inside the run directory")
        resolved = run_dir / local_path
        if not resolved.is_file():
            raise ValueError(f"media file does not exist: {local_path}")
        if item["kind"] in {"x_original", "ai_adaptation"}:
            review_status = "pending"
        elif item["kind"] == "generated_original":
            review_status = "independent"
        else:
            raise ValueError("invalid media kind")
        result.append({**item, "display_id": index, "review_status": review_status})
    return result
```

Validate three unique non-empty titles, 8–12 unique non-empty tags, valid `https://x.com/` source URLs for X-derived media, source author and media ID, and a `generation_lineage` object for generated images. Write all artifacts atomically, transition `researching → draft_ready → authorization_review`, and include the disclosure only when the payload marks both authorized-media intent and AI assistance.

- [ ] **Step 4: Run draft and existing authorization tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_build_publishable_draft.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v`  
Expected: all tests PASS; existing authorization behavior remains unchanged.

- [ ] **Step 5: Commit Task 3**

```bash
git add lofter-x-anime-hotspot/scripts/build_publishable_draft.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py
git commit -m "feat: build publish-ready LOFTER drafts"
```


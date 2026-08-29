### Task 5: Self-Contained HTML Preview

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/render_preview.py`
- Create: `lofter-x-anime-hotspot/tests/test_render_preview.py`

**Interfaces:**
- Consumes: completed draft artifacts and media ledger
- Produces: `render_preview(run_dir: Path) -> Path`
- Produces: `preview.html` with no remote scripts, forms, network requests, or embedded private authorization evidence

- [ ] **Step 1: Write failing preview tests**

```python
class RenderPreviewTest(unittest.TestCase):
    def test_preview_contains_article_titles_tags_media_and_review_warning(self):
        run_dir = prepared_review_run()
        path = render_preview(run_dir)
        html = path.read_text(encoding="utf-8")
        self.assertIn("等待授权复核，尚不可发布", html)
        self.assertIn("候选标题", html)
        self.assertIn("X原图", html)
        self.assertIn("第1张", html)
        self.assertIn("热点依据", html)

    def test_preview_is_local_and_does_not_leak_evidence(self):
        run_dir = prepared_review_run()
        html = render_preview(run_dir).read_text(encoding="utf-8")
        self.assertNotIn("<script", html.lower())
        self.assertNotIn("<form", html.lower())
        self.assertNotIn("evidence_path", html)
        self.assertNotIn("authorization-evidence", html)
```

- [ ] **Step 2: Run preview tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'render_preview'`.

- [ ] **Step 3: Implement escaped, local-only preview rendering**

```python
def render_preview(run_dir: Path) -> Path:
    state = load_state(run_dir)
    if state["state"] not in {"authorization_review", "revisions_required", "approved"}:
        raise ValueError("preview requires a completed draft")
    article = (run_dir / "article.md").read_text(encoding="utf-8")
    ledger = load_media_ledger(run_dir)
    media_html = "\n".join(_media_figure(run_dir, item) for item in ledger)
    body = TEMPLATE.format(
        status=escape(_public_status(state["state"])),
        topic=escape(state["topic"]),
        analysis=escape((run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")),
        media=media_html,
        article=_markdown_paragraphs(article),
        titles_tags=escape((run_dir / "titles-and-tags.md").read_text(encoding="utf-8")),
        order=escape((run_dir / "publication-order.md").read_text(encoding="utf-8")),
    )
    target = run_dir / "preview.html"
    target.write_text(body, encoding="utf-8")
    return target
```

Use `html.escape` for every user/model/source string, accept only relative image paths already present in the run directory, and render Markdown as escaped paragraphs rather than adding a dependency. Include compact responsive CSS directly in the file.

- [ ] **Step 4: Run preview and draft tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py -v`  
Expected: all tests PASS and `preview.html` opens without network access.

- [ ] **Step 5: Commit Task 5**

```bash
git add lofter-x-anime-hotspot/scripts/render_preview.py lofter-x-anime-hotspot/tests/test_render_preview.py
git commit -m "feat: render LOFTER draft previews"
```


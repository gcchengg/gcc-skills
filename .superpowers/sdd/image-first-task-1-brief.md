### Task 1: Render the cover before article text

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/render_preview.py`
- Test: `lofter-x-anime-hotspot/tests/test_render_preview.py`

**Interfaces:**
- Consumes: validated ledger order from `load_media_ledger(run_dir)` where the first item has role `cover`.
- Produces: `build_preview_html(...) -> str` whose first article-media element is the cover, followed by `.article`, followed by remaining media.

- [ ] **Step 1: Write the failing HTML-order test**

Add a test that locates the first ledger image path, a unique article sentence, and the second ledger image path in returned HTML and asserts:

```python
self.assertLess(html.index(cover_path), html.index(article_marker))
self.assertLess(html.index(article_marker), html.index(body_path))
```

- [ ] **Step 2: Run the test and verify RED**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v`

Expected: the new order assertion fails because article text currently precedes all media.

- [ ] **Step 3: Implement the minimal renderer split**

Require a non-empty ledger with first role `cover`; render `ledger[0]` in a cover section before the article and render `ledger[1:]` after the article. Keep escaping, local paths, captions, and responsive inline CSS unchanged.

- [ ] **Step 4: Run the focused renderer test**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v`

Expected: all tests pass.


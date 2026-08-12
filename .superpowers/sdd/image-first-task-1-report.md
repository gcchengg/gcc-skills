# Image-first Task 1 Report

## Scope

- `lofter-x-anime-hotspot/scripts/render_preview.py`
- `lofter-x-anime-hotspot/tests/test_render_preview.py`
- `.superpowers/sdd/image-first-task-1-report.md`

## RED

Command:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v
```

Result: failed as expected in
`test_preview_renders_cover_before_article_and_body_media_afterward`.
The cover path index was `1896`, after the unique article marker at `1746`.

## GREEN

Implemented the minimal renderer split: reject an empty ledger or one whose first
item is not the cover; render the first item in a cover media section before the
article; render the remaining items in the existing media section after the
article. Existing escaping, local paths, captions, and responsive inline CSS are
unchanged.

Command:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v
```

Result: passed — 4 tests run, 0 failures.

## Self-review

- Confirmed the new test checks the cover path before the article marker and the
  body-media path after it.
- Confirmed `build_preview_html` requires a non-empty ledger beginning with role
  `cover`, matching the validated-ledger interface.
- Confirmed only `ledger[0]` is rendered before `.article`; `ledger[1:]` remains
  after it in the existing publication-order section.
- Confirmed focused diff whitespace check passes for the implementation and test
  files.

## Commit

This report is committed with the Task 1 renderer change as
`feat: render LOFTER cover before article`; use `git log -1 --oneline` to obtain
the immutable commit identifier.

## Critical review fix

The cover section originally followed the topic/status and hotspot-evidence
sections, so it was not the first visible child of `<main>`.

### Regression RED

After adding assertions that the cover path precedes the unique status marker
`等待授权复核，尚不可发布` and analysis marker `测试图片优先顺序`, ran:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v
```

Result: failed as expected in
`test_preview_renders_cover_before_article_and_body_media_afterward`:
the cover path index was `1767`, after the status marker at `1379`.

### Fix and GREEN

Moved `<section class="cover">` to be the first child of `<main>`, before the
topic/status and hotspot-evidence sections. The focused test was rerun:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v
```

Result: passed — 4 tests run, 0 failures. A focused `git diff --check` for the
renderer and test files also passed.

# LOFTER 图文首图发布 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Require every generated preview and LOFTER publication flow to place the approved cover image before all article text and remaining images.

**Architecture:** Split the invariant across three existing boundaries: `render_preview.py` controls local reading order, `publication_gate.py` persists page-observed proof, and `browser-publishing.md` controls the fragile browser sequence. Contract tests bind the procedural wording while focused unit tests bind HTML order and the strict Boolean gate.

**Tech Stack:** Python 3 standard library, `unittest`, Markdown Skill/reference files, official Skill Creator validator.

## Global Constraints

- The LOFTER editor's first effective content node must be the approved manifest cover.
- Public order is cover image, article text, then body images.
- `first_content_is_cover` must be the literal Boolean `true` and must come from page observation, not upload-order inference.
- Missing or ambiguous first-node evidence pauses publication before final confirmation.
- Preserve all existing media, login, authorization, manifest-integrity, and two-confirmation gates.
- Run only the focused tests plus the official Skill validator; do not run the full suite.

---

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

### Task 2: Enforce page-observed cover-first evidence

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/publication_gate.py`
- Test: `lofter-x-anime-hotspot/tests/test_publication_gate.py`
- Test: `lofter-x-anime-hotspot/tests/test_publishable_workflow.py`

**Interfaces:**
- Consumes: platform preview object passed to `mark_form_filled(run_dir, platform_preview)`.
- Produces: persisted platform preview containing `first_content_is_cover: true`, validated again by `approve_final_submit`.

- [ ] **Step 1: Write failing strict-gate tests**

Update valid preview fixtures to include:

```python
"first_content_is_cover": True,
```

Add cases showing that missing, `False`, `1`, and `"true"` values are rejected with `final platform preview is incomplete`.

- [ ] **Step 2: Run gate tests and verify RED**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py lofter-x-anime-hotspot/tests/test_publishable_workflow.py -v`

Expected: valid fixtures are rejected as unexpected fields or malformed values are accepted before implementation.

- [ ] **Step 3: Implement the minimal gate**

Add `first_content_is_cover` to observed/persisted preview fields and require:

```python
if observed["first_content_is_cover"] is not True:
    raise ValueError("final platform preview is incomplete")
```

Keep the manifest content digest projection unchanged because this Boolean is page-state evidence rather than manifest content.

- [ ] **Step 4: Run gate tests**

Run the Task 2 command again.

Expected: all tests pass.

### Task 3: Bind the browser and Skill contract

**Files:**
- Modify: `lofter-x-anime-hotspot/references/browser-publishing.md`
- Modify: `lofter-x-anime-hotspot/SKILL.md`
- Test: `lofter-x-anime-hotspot/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: locked `upload-manifest.json`, authenticated Codex in-app LOFTER editor, and the `cover` item.
- Produces: an agent procedure that uploads cover first, verifies it is the first effective content node, then inserts article and body images, and supplies observed `first_content_is_cover: true`.

- [ ] **Step 1: Write the failing contract test**

Assert that the protocol contains the exact concepts `cover image first`, `first effective content node`, `first_content_is_cover`, and a recovery recheck before final preview evidence.

- [ ] **Step 2: Run the contract test and verify RED**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_skill_contract.py -v`

Expected: the new contract test fails on the old protocol.

- [ ] **Step 3: Update the procedural contract**

In `browser-publishing.md`, require cover upload and immediate observation before body entry, body image upload after text, reposition-or-pause behavior, and a repeat check after login/draft recovery. In `SKILL.md`, summarize the cover-first invariant in the first-confirmation route while leaving details in the reference.

- [ ] **Step 4: Run all focused tests and validator**

Run:

```bash
python3 -m unittest \
  lofter-x-anime-hotspot/tests/test_render_preview.py \
  lofter-x-anime-hotspot/tests/test_publication_gate.py \
  lofter-x-anime-hotspot/tests/test_publishable_workflow.py \
  lofter-x-anime-hotspot/tests/test_skill_contract.py -v
PYTHONPATH="lofter-x-anime-hotspot/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" \
  python3 "${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  lofter-x-anime-hotspot
git diff --check
```

Expected: focused tests pass, validator prints `Skill is valid!`, and diff check is clean.

- [ ] **Step 5: Commit and sync the installed Skill**

Commit only the scoped source/test files. Then copy the modified operational files (`SKILL.md`, `references/browser-publishing.md`, `scripts/render_preview.py`, `scripts/publication_gate.py`) into `${CODEX_HOME:-${HOME}/.codex}/skills/lofter-x-anime-hotspot/` and validate the installed copy.

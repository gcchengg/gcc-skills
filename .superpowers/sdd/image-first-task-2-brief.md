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


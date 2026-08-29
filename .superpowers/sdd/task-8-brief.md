### Task 8: End-to-End Resume and Safety Regression

**Files:**
- Create: `lofter-x-anime-hotspot/tests/test_publishable_workflow.py`
- Modify: `lofter-x-anime-hotspot/tests/test_cli_workflow.py`

**Interfaces:**
- Exercises all Python interfaces from Tasks 1–6 without network or a real LOFTER submission
- Preserves the legacy smoke-only CLI workflow and all legacy fail-closed regressions

- [ ] **Step 1: Write the complete end-to-end failing test**

```python
def test_new_draft_reject_replace_resume_and_publish_flow(self):
    with tempfile.TemporaryDirectory() as value:
        root = Path(value)
        run_dir, _ = create_run(root / "runs", "selected-topic", FIXED_NOW)
        selection = select_topic(valid_research_payload())
        write_json_atomic(run_dir / "hotspot-analysis.json", selection)
        build_draft(run_dir, valid_draft_with_pending_x_media(run_dir))
        render_preview(run_dir)

        record_media_review(run_dir, 1, False)
        state = load_state(run_dir)
        self.assertEqual(state["state"], "revisions_required")
        replace_rejected_media(
            run_dir, 1, valid_independent_replacement(run_dir),
            revised_article(), revised_captions(),
        )
        render_preview(run_dir)

        reloaded = load_state(run_dir)
        self.assertEqual(reloaded["state"], "authorization_review")
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        self.assertEqual(len(manifest["media"]), 2)

        mark_form_filled(run_dir, valid_platform_preview())
        approve_final_submit(run_dir, "确认最终提交")
        record_publication(run_dir, valid_publication_result())
        final = load_state(run_dir)
        self.assertEqual(final["state"], "published")
        self.assertEqual(final["publication"]["lofter_url"], "https://example.lofter.com/post/abc")
```

- [ ] **Step 2: Run the end-to-end test and verify its first failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publishable_workflow.py -v`  
Expected: FAIL at the first interface mismatch or missing state update, proving the integration test exercises real task boundaries.

- [ ] **Step 3: Make only integration corrections required by the test**

Required state behavior is exact:

```text
researching → draft_ready → authorization_review
authorization_review → revisions_required → authorization_review
authorization_review → approved → publishing → published
```

Do not add automatic network access, implicit authorization, implicit confirmation, automatic browser retries, or a second Skill while correcting integration mismatches.

- [ ] **Step 4: Run the entire test suite**

Run: `python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v`  
Expected: all legacy and new tests PASS with zero failures and zero errors; the official validator test may skip only when its documented dependency or Skill Creator root is absent.

- [ ] **Step 5: Run repository hygiene checks and official validation**

Run: `git diff --check`  
Expected: no output.

Run: `git status --short`  
Expected: only Task 8 files are modified/untracked before the Task 8 commit; ignored `runs/`, `.dev-deps/`, and `__pycache__/` do not appear.

Run:

```bash
PYTHONPATH="lofter-x-anime-hotspot/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" python3 "${SKILL_CREATOR_ROOT:-${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator}/scripts/quick_validate.py" lofter-x-anime-hotspot
```

Expected: exit code 0 and `Skill is valid!`.

- [ ] **Step 6: Commit Task 8**

```bash
git add lofter-x-anime-hotspot/tests/test_publishable_workflow.py lofter-x-anime-hotspot/tests/test_cli_workflow.py
git commit -m "test: verify guarded LOFTER publishing flow"
```

## Final Verification Checklist

- [ ] New invocation produces exactly one complete preview package and stops at authorization review.
- [ ] A 24-hour-sufficient fixture never consults the 72-hour candidate set; an insufficient fixture does.
- [ ] Trend analysis, fanfic, and visual curation mode routing each have a passing test.
- [ ] Rejected media cannot be reused as an image-generation reference and is replaced only by `generated_original` with empty lineage.
- [ ] No pending or rejected media enters `upload-manifest.json`.
- [ ] Neither conversational intent nor a forged state file bypasses exact ledger-backed authorization.
- [ ] `确认发布` and `确认最终提交` are separate, state-bound events.
- [ ] A browser challenge or uncertain result never triggers an automatic submit retry.
- [ ] All 51 existing tests plus the new tests pass; do not hard-code a final total because test additions change it.
- [ ] Official Skill validation passes.
- [ ] No runtime draft, authorization evidence, secret, absolute developer path, or generated media is committed.

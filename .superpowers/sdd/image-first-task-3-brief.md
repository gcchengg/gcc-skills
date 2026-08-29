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

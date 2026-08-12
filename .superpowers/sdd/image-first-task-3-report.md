# Image-First Task 3 Report: Browser and Skill Contract

## Outcome

Bound the browser publication procedure to the image-first gate. The procedure
uploads the manifest cover before any article body entry, immediately observes
the cover as the first effective content node, uploads body images only after
text, and fails safely through repositioning or a user pause. A login or draft
recovery must repeat the cover-first observation before final preview evidence.

The first-confirmation route in `SKILL.md` now summarizes the same invariant and
requires the observed `first_content_is_cover: true` value when form-fill
evidence is persisted.

## Files changed

- `lofter-x-anime-hotspot/references/browser-publishing.md`
- `lofter-x-anime-hotspot/SKILL.md`
- `lofter-x-anime-hotspot/tests/test_skill_contract.py`

## TDD evidence

### RED

Added `test_browser_protocol_requires_cover_first_and_rechecks_after_recovery`,
then ran:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_skill_contract.py -v
```

The new test failed as intended because the old browser protocol did not contain
the required `cover image first` contract.

### GREEN

Updated the browser protocol and first-confirmation summary, then re-ran the
contract test. Result: 9 tests passed.

## Final verification

```bash
python3 -m unittest \
  lofter-x-anime-hotspot/tests/test_render_preview.py \
  lofter-x-anime-hotspot/tests/test_publication_gate.py \
  lofter-x-anime-hotspot/tests/test_publishable_workflow.py \
  lofter-x-anime-hotspot/tests/test_skill_contract.py -v
```

Result: 31 tests passed.

```bash
PYTHONPATH="lofter-x-anime-hotspot/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" \
  python3 "${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator/scripts/quick_validate.py" \
  lofter-x-anime-hotspot
```

Result: `Skill is valid!`

`git diff --check` on the three scoped source/test files passed with no
whitespace errors.

## Self-review

- The protocol uses the manifest's cover, without allowing an unlisted upload or
  media reorder.
- Recovery recheck comes before final preview evidence and pauses on an
  unambiguous editor failure.
- `first_content_is_cover: true` remains an observed value supplied to the
  existing deterministic form-fill gate.
- No installed `~/.codex` copy was changed.

## Concerns

The shared worktree contains unrelated pre-existing modified reports, metadata,
review artifacts, and bytecode; none are included in the Task 3 commit.

The required repository-wide `git diff --check` exits 2 only because unrelated,
pre-existing edits in `.superpowers/sdd/task-1-brief.md` through
`task-5-brief.md` contain trailing whitespace (and `task-5-brief.md` has a new
blank line at EOF). A scoped `git diff --check` for the three Task 3 files is
clean. These unrelated files were left untouched.

The Task 3 implementation is commit
`1b4f6bcc3cf1397c8d3dba32e142abc5f977fe61`. Per the task-specific instruction,
the installed Skill was not synced and nothing under `~/.codex` was modified.

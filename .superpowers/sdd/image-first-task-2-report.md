# Image-first Task 2 report

## RED

Command:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py lofter-x-anime-hotspot/tests/test_publishable_workflow.py -v
```

Result: failed as expected before the gate implementation. Existing valid preview flows failed with `ValueError: final platform preview is incomplete` because the new required field was not yet in the observed preview schema; the new missing-field negative case was accepted, producing an assertion failure. Overall result: `FAILED (failures=2, errors=15)` across 18 tests.

## GREEN

Command:

```sh
python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py lofter-x-anime-hotspot/tests/test_publishable_workflow.py -v
```

Result: `OK` — 18 tests passed in 0.276s.

## Changes

- Added `first_content_is_cover` to the observed and persisted platform-preview schema.
- Require its value to be the singleton Boolean `True` before a preview can be persisted or approved at final submission.
- Kept the manifest content digest projection unchanged.
- Updated valid fixtures and added missing, `False`, `1`, and `"true"` rejection cases.

## Commit

`5aedf8b feat(lofter): require cover-first preview evidence`

## Self-review

- Confirmed exact preview-field sets enforce persistence of the evidence.
- Confirmed `is not True` rejects truthy non-Booleans such as `1` and `"true"`.
- Confirmed the field remains outside the manifest-content projection and cannot affect the approved-content digest.
- Ran `git diff --check` on the three scoped source/test files: no whitespace errors.

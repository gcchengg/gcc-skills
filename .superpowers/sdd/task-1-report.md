# Task 1 Report: Persistent Run State and Legal Transitions

## Scope

Implemented the private, resumable run-state foundation only. Content generation,
authorization, preview, and browser behavior were not modified.

## RED

Command:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
```

Output before implementation:

```text
ModuleNotFoundError: No module named 'run_state'
Ran 1 test in 0.000s
FAILED (errors=1)
```

## GREEN

Command:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
```

Output after implementation:

```text
Ran 3 tests in 0.003s
OK
```

## Files changed

- `lofter-x-anime-hotspot/scripts/run_state.py` — atomic JSON state storage,
  sanitized run creation, strict loading validation, legal state transitions, and
  secret-field rejection.
- `lofter-x-anime-hotspot/tests/test_run_state.py` — required Task 1 state tests.
- `lofter-x-anime-hotspot/.gitignore` — adds the exact `runs/` entry.

## Full suite

Command:

```bash
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -v
```

Result:

```text
Ran 54 tests in 0.405s
OK
```

## Self-review

- Confirmed all seven named states and every specified legal transition are
  represented exactly.
- Confirmed stale-writer, skipped-transition, and secret-field failures use the
  required `ValueError` messages.
- Confirmed `status.json` writes atomically through a same-directory temporary
  path followed by replacement.
- Confirmed initial state includes each required field, creates the three private
  asset directories, sanitizes lowercase ASCII run IDs, and rejects collisions.
- Scoped `git diff --check` is clean. The repository-wide check reports trailing
  spaces only in the pre-existing user-modified task brief, which is outside this
  task and was not changed.

## Concerns

None for the Task 1 scope. Existing user changes in `.superpowers/sdd/progress.md`
and `.superpowers/sdd/task-1-brief.md` remain unmodified and are excluded from the
Task 1 commit.

## Review Fixes

### Root cause

The original transition implementation validated only the state graph edge. It
did not validate the fully merged candidate state, did not enforce irreversible
publication prerequisites, checked secret keys only at the update top level, and
used a predictable temporary filename without cleanup after a failed replacement.

### RED

Command:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
```

Output before the review fixes:

```text
Ran 9 tests in 0.012s
FAILED (failures=7)
```

The failures reproduced missing fill/submit/preview/publication prerequisites,
nested-secret acceptance, malformed-update persistence, the `72`-hour default,
and orphaned temporary-file cleanup.

### GREEN

Commands:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s lofter-x-anime-hotspot/tests -v
```

Output after the review fixes:

```text
Ran 9 tests in 0.009s
OK

Ran 60 tests in 0.389s
OK
```

### Changes

- Set the initial time window to 24 hours.
- Enforced fail-closed persisted prerequisites: fill confirmation before approval
  and publishing, a complete persisted platform preview before publishing, and
  submit confirmation plus a non-empty publication object before publication.
- Recursively reject all specified secret-key names in nested dictionaries and
  lists, case-insensitively, without inspecting prose values.
- Merge and validate the proposed state before writing; direct `run_id` and
  `state` updates are rejected and failed updates leave `status.json` unchanged.
- Use a unique same-directory temporary file with cleanup in a `finally` block.
  This is atomic-write hygiene only and intentionally does not claim multi-writer
  locking.

## Second Review Fix Wave

### Root cause

Secret-key filtering compared only exact lowercase names, so delimiters, camel
case, and surrounding words bypassed it. `time_window_hours` was type-checked
but had no evidence-backed transition policy.

### RED

Command:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
```

Output before this fix:

```text
Ran 11 tests in 0.017s
FAILED (failures=2)
```

The failures demonstrated accepted `browser_session_secret`-style nested keys
and an unaudited 24-to-72 hour transition.

### GREEN

Commands:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s lofter-x-anime-hotspot/tests -v
```

Output:

```text
Ran 11 tests in 0.017s
OK

Ran 62 tests in 0.426s
OK
```

### Changes and self-review

- Keys are casefolded and stripped to alphanumeric characters before checking
  for the required forbidden tokens. The recursive scan still examines only
  keys, never prose values.
- Window changes are fail-closed: only 24-to-72 expansion is allowed, and it
  must persist a `window_expansion` object with typed `from`, `to`,
  `insufficient_24h`, and non-blank `reason` evidence.
- Rejected secret and window updates are validated before the atomic write, so
  prior state remains intact. The existing approval/fill/preview/publish order
  was deliberately unchanged to preserve the Task 6 workflow.

## Final Review Fix Wave

### Root cause

The earlier field-type checks did not form a complete persisted-state boundary:
unknown update keys could be stored, nested JSON structures were not constrained,
and a 72-hour state could later lose its expansion evidence. The temporary file
was also created before serialization, making a serialization exception leave a
hidden temporary artifact.

### RED

Command:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
```

Output before this fix:

```text
Ran 16 tests in 0.022s
FAILED (failures=4)
```

The failures reproduced accepted extended credential keys/values, unknown and
non-JSON updates, unsafe file paths and malformed operational fields, and removal
of persisted 72-hour expansion evidence.

### GREEN

Commands:

```bash
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v
PYTHONDONTWRITEBYTECODE=1 python3 -m unittest discover -s lofter-x-anime-hotspot/tests -v
```

Output:

```text
Ran 16 tests in 0.024s
OK

Ran 67 tests in 0.403s
OK
```

### Changes and self-review

- Allowlisted every persisted and transition-update field. Controller-owned
  identity/state/timestamp fields remain immutable to callers.
- Added recursive normalized detection for authorization/credential/bearer/
  header/API-key/token/secret and the existing sensitive-key families, plus
  conservative Bearer and JWT-value detection.
- Enforced JSON-safe operational objects; safe relative run-local file paths;
  exact confirmation booleans; and string-only error lists. Updates are fully
  validated before the atomic write.
- Made 72-hour expansion evidence mandatory during both transition and load
  validation, including after subsequent transitions and for malformed on-disk
  state.
- Serialized before creating the unique temporary file, retaining cleanup in one
  `try`/`finally`; focused tests verify replacement and serialization failures
  leave no temporary artifact.
- Kept the approved Task 6 ordering unchanged: approval, form fill, preview,
  publishing, then submission confirmation.

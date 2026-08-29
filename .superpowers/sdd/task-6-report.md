# Task 6 Report: Two-Confirmation Publication Gate

## RED

Created `tests/test_publication_gate.py`, then ran:

```text
python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v
```

Observed the expected `ModuleNotFoundError: No module named 'publication_gate'`.

During self-review, added a persisted-preview tampering regression test. It failed
because a nonempty but incomplete preview could reach the second confirmation.

## GREEN

Added `scripts/publication_gate.py` with:

- exact first and second phrases (`确认发布` and `确认最终提交`);
- strict media-ledger review before approval;
- a public-field-only upload manifest;
- typed, content-matched platform-preview evidence;
- separate final confirmation and verified publication-result events;
- a pre-submit safe pause and a frozen uncertain-result state requiring a read-only
  LOFTER profile/drafts check.

The second gate now revalidates persisted typed preview evidence, closing the
self-review regression.

## Focused verification

```text
python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py lofter-x-anime-hotspot/tests/test_run_state.py lofter-x-anime-hotspot/tests/test_media_review.py -v
```

Result: `Ran 46 tests ... OK`.

## Self-review

- All state transitions continue through the existing persisted prerequisite layer.
- Same-state confirmation/uncertain updates are atomically written and reloaded
  through state validation.
- Upload media records whitelist only `display_id`, `role`, `local_path`, and
  `review_status`; authorization decisions, evidence paths, and ledger paths are
  excluded.
- Successful results require an HTTPS LOFTER URL and a timezone-aware ISO-8601
  publication datetime.
- No browser-control behavior was added.

## Scope note

Only the three requested test modules were run. The full suite remains deferred to
Task 8. Existing unrelated worktree changes were preserved.

## Blocking-review follow-up: manifest digest binding

Added a canonical SHA-256 binding for the exact public upload manifest. The digest
uses sorted JSON keys, UTF-8, and compact stable separators; it is persisted at the
first confirmation, required in platform-preview evidence, and recomputed before
the final confirmation. Authorization decisions, evidence, and ledger paths remain
outside both the public manifest and its digest.

Focused RED evidence: the new tests failed because no approved digest existed and
the preview digest field was not supported. Focused GREEN verification after the
final change:

```text
python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v
```

Result: `Ran 13 tests ... OK`. Coverage includes article mutation, tag mutation,
same-count media order swap, forged preview digest, deterministic canonical digest,
and the unchanged publication happy path. Per the updated instruction, no media,
state, or full-suite modules were run for this follow-up.

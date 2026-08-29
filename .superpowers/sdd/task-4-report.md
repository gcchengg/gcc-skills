# Task 4 Report: Authorization Review and Independent Replacement

## RED

- Added `test_media_review.py` before production interfaces existed.
- First run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py -v`
  failed with the expected import error for undefined `record_media_review` and
  `replace_rejected_media`.
- A second RED checkpoint proved status accounting was incomplete: the exact
  ledger-backed authorization test observed `pending: 1, authorized: 0` after
  the ledger had been authorized.

## GREEN

- `record_media_review` now:
  - accepts only a real boolean review decision while the run is in
    `authorization_review`;
  - treats `authorization_ledger_path` as an incoming-only transport field;
  - reopens the operational ledger, validates its evidence with
    `validate_ledger`, regenerates the canonical decision with
    `validate_authorization`, binds it to the media asset/source/author/usage,
    and requires exact decision equality;
  - rejects forged, missing, unreadable, or example-only authorization data;
  - persists only the regenerated decision, never the ledger/evidence path;
  - transitions rejection from `authorization_review` to
    `revisions_required` transactionally.
- `replace_rejected_media` now:
  - works only on a rejected record in `revisions_required`;
  - requires `generated_original` with typed lineage and
    `source_media_ids == []` exactly;
  - rejects reuse of the rejected local path or identical rejected bytes;
  - preserves every unaffected ledger entry, unaffected caption, title/tag
    artifact, and media file;
  - atomically installs the replacement snapshot, affected article/caption
    copy, publication order, media ledger, and state transition back to
    `authorization_review`;
  - rolls all artifacts and state back if the transition fails.
- Refactored draft and review installation through the same
  install/backup/rollback primitive so Task 3 transaction guarantees remain
  intact.

## Files

- Modified: `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`
- Created: `lofter-x-anime-hotspot/tests/test_media_review.py`

## Verification

- Focused:
  `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v`
  — 48 tests passed.
- Full:
  `python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v`
  — 107 tests passed.
- Scoped whitespace validation: `git diff --check` passed for Task 4 code.

## Self-review

- Confirmed authorization decisions cannot authorize a different asset, URL,
  author, or usage and that the transport path is absent from persisted/public
  artifacts.
- Confirmed rejection and replacement state transitions update review counts
  and roll back as one logical transaction.
- Confirmed the replacement source snapshot is separate from the rejected path
  and bytes, and all unaffected media/copy remains byte-for-byte or
  object-for-object unchanged.
- Confirmed original Task 3 rollback coverage still passes after transaction
  helper reuse.

## Concern / Follow-up Boundary

- Task 7's image-generation caller must independently enforce that the rejected
  image is never supplied as generation input. Task 4 enforces empty lineage,
  different source path, and different output bytes at its API boundary, but it
  cannot inspect a future upstream model invocation.

## Fix Wave: Critical and Important Review Findings

### RED evidence

- Evidence reopening tests initially showed all six empty, symlinked, and
  unreadable cases authorizing successfully across Task 4 and the shared
  validator.
- Persisted-ledger tests initially exposed 14 accepted invalid combinations:
  X-derived `independent` states, generated pending/rejected/authorized states,
  and missing, unknown, forged, mismatched, smoke-only, or publication-forbidden
  persisted decisions. Exact-boolean tests separately caught truthy/falsey
  integer bypasses.
- Lineage tests initially accepted rejected paths, URLs, media/asset IDs, and
  author handles in both prompt and generator strings.
- Disclosure tests initially lost the disclosure for an unaffected authorized
  original and an unaffected authorized AI adaptation. Task 3 tests also proved
  the private intent artifact and seventh rollback target were absent.
- The first integrated focused run caught an unreachable AI original-lineage
  binding block; relocating it produced the expected rejection.

### Fixes

- Authorization evidence must now be a non-symlink regular file whose bytes can
  be read and are non-empty. OSError becomes a fail-closed ValueError, and Task 4
  wraps it as a ledger-backed authorization failure.
- `load_media_ledger` now enforces exact persisted media fields, kind/status
  combinations, the shared decision field set, exact boolean decision flags,
  and media-bound asset/source/author/usage/provenance. AI adaptations also bind
  `original_asset_id` to generation lineage.
- Independent replacement recursively scans every lineage string and rejects
  exact substrings matching the rejected media path, URL, ID aliases, or author
  aliases, in addition to the existing empty-source, path, and byte checks.
- Task 3 now transactionally stores validated private draft intent at
  `sources/draft-intent.json`. Replacement rejects caller-authored disclosure
  and deterministically appends it exactly once only when the resulting ledger
  contains authorized media and AI assistance; otherwise it omits it.
- The original canonical snapshot behavior and rollback primitive remain in
  use; rollback coverage now exercises seven Task 3 install targets.

### Fix-wave verification

- Focused Task 3/Task 4/authorization suite: 60 tests passed.
- Full discovery suite: 119 tests passed.
- Scoped `git diff --check`: passed before staging.

### Fix-wave self-review

- Authorization ledger/evidence paths remain transport-only and cannot be
  persisted as known or unknown media/decision fields.
- Non-authorized records cannot carry decisions; generated originals cannot be
  externally authorized; X-derived records cannot claim independence.
- Caller text cannot author or duplicate the reserved disclosure.
- No unresolved Task 4 issue remains. Task 7 still owns the separate requirement
  not to supply rejected media to the upstream image-generation invocation.

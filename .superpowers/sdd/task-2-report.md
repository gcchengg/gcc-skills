# Task 2 Report: Research Sufficiency, Topic Selection, and Content Mode

## Implementation

- Added `select_publishable_topic.select_topic(payload)`, a pure selector that
  checks the 24-hour window before the optional 72-hour window. A window requires
  at least two X sources, one LOFTER source, and at least one eligible ranked
  candidate.
- The returned result contains the chosen window, ranked candidate, deterministic
  content mode, and Chinese score-based selection reason. No run state is read or
  modified.
- Extended candidate validation with required `topic_features` and strict boolean
  `event_signal`, `relationship_signal`, and `visual_signal` values. Mode priority
  is event/trend analysis, relationship/fanfic, then visual/curation.
- Updated every candidate in the scoring and packet examples without changing any
  score, IP pool, requested usage, authorization, or provenance fields.
- Added `run-input.example.json` with only `ip_pool` and the 24/72 research-window
  inputs; it contains no authorization decision or authorization evidence-path
  fields.

## Files changed

- `lofter-x-anime-hotspot/scripts/score_candidates.py`
- `lofter-x-anime-hotspot/scripts/select_publishable_topic.py`
- `lofter-x-anime-hotspot/templates/candidates.example.json`
- `lofter-x-anime-hotspot/templates/packet-inputs.example.json`
- `lofter-x-anime-hotspot/templates/run-input.example.json`
- `lofter-x-anime-hotspot/tests/test_score_candidates.py`
- `lofter-x-anime-hotspot/tests/test_select_publishable_topic.py`
- `lofter-x-anime-hotspot/tests/test_build_content_packet.py` (fixture-only
  compatibility update required because it invokes shared candidate validation)

## TDD evidence

### RED

1. Added the four required selection tests, then ran:

   `python3 -m unittest lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`

   It failed as intended with `ModuleNotFoundError: No module named
   'select_publishable_topic'`.

2. Added strict feature-validation cases, then ran:

   `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v`

   The new test failed as intended because invalid `topic_features` values did not
   raise `ValueError`.

### GREEN

`python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`

Result: 17 tests passed. Eligible ordering remains score-descending then ID, as
covered by the existing ranking tests.

## Final verification

- `python3 -m unittest discover -s lofter-x-anime-hotspot/tests -v` — 72 tests
  passed.
- `python3 -m json.tool` against all three modified/added JSON templates — valid
  JSON.
- `git diff --check -- lofter-x-anime-hotspot` — no whitespace errors on Task 2
  paths.

## Self-review

- `select_topic` delegates ranking to the existing scorer and does not mutate its
  input or run state.
- Eligibility threshold, five-IP validation, requested-usage/media provenance,
  and existing score ordering are unchanged.
- The candidate feature validator rejects non-objects, missing feature fields, and
  truthy non-booleans. The selector remains defensive about malformed feature
  values and topics lacking a supported mode.
- Packet fixtures and their direct test helper contain the new required field, so
  legacy packet construction continues to exercise the same media semantics.

## Concerns

- The repository has unrelated pre-existing `.superpowers/sdd` edits, review diff
  artifacts, and generated Python bytecode changes. They are intentionally not
  part of the Task 2 commit.

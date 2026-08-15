# Task 1 Report: Weighted Hotspot Scoring

## Status

DONE

## Files changed

- `lofter-x-anime-hotspot/scripts/score_candidates.py` — weighted scorer, validation, ranking, and JSON CLI.
- `lofter-x-anime-hotspot/tests/test_score_candidates.py` — eligibility, range validation, and filtered-rank tests.

## TDD evidence

1. Created the required tests before the implementation.
2. Ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v`.
   - Result: failed as expected with `ModuleNotFoundError: No module named 'score_candidates'`.
3. Implemented the scorer exactly as specified.
4. Re-ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v` after implementation and after the commit.
   - Result: `Ran 3 tests` and `OK` on both runs.
5. Ran `git diff --cached --check` before commit and `git show --check --format=fuller --stat HEAD` after commit.
   - Result: no whitespace errors in the committed Task 1 changes.

## Commit

`33ad59d971b9210c487b7e9fd083a9fb3b0e22c5` — `feat: add LOFTER hotspot scorer`

## Concerns

- The repository had pre-existing unrelated modified and untracked files, which were preserved.
- A full-worktree `git diff --check` reported an unrelated trailing-whitespace issue in `美女博主/20260627-演唱会后台自拍/提示词.md`; it is not part of this task or commit.
- This report is intentionally not included in the Task 1 commit because the task required committing only the two Task 1 scorer files.

## Capacity-limit review fix

- Added `SLOT_CAPACITIES` with limits of two `long_term`, two `rising`, and one `experiment` candidate.
- `rank_candidates` now filters by threshold, sorts by descending total score (then ID), and selects candidates in that order while enforcing each slot capacity.
- Added `test_rank_limits_each_ip_slot_and_preserves_total_score_order`, which supplies over-capacity candidates for all three slots and verifies only the highest-scoring permitted candidates remain in global score order.

### TDD and verification

1. Added the focused capacity-limit test first.
2. Ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v` before the implementation.
   - Result: the new test failed as expected because the unbounded ranker returned `long-3`, `rising-3`, and `experiment-2`.
3. Implemented the slot-capacity selection.
4. Ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v`.
   - Result:

```text
Ran 4 tests in 0.000s

OK
```

5. Ran `git diff --cached --check` before committing.
   - Result: no whitespace errors in the capacity-limit fix.

### Fix commit

`930261a` — `fix: limit LOFTER hotspot slots`

## Incomplete-slot review fix

- `rank_candidates` now raises `ValueError` after threshold filtering and quota selection whenever a slot cannot meet its required capacity. The error identifies the slot, required count, and available count (for example, `experiment requires 1 candidates; 0 available`).
- Updated the successful ranking fixture to meet the mandatory 2/2/1 slot capacity while retaining its threshold-filtering, score-ordering, and media-instruction assertions.
- Added `test_rank_rejects_under_capacity_slot_after_threshold_filtering`, covering an experiment candidate that is excluded by the default threshold and therefore leaves the experiment slot unavailable.

### TDD and verification

1. Added the under-capacity test first.
2. Ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v` before implementation.
   - Result: the new test failed as expected with `AssertionError: ValueError not raised`.
3. Implemented post-selection capacity validation.
4. Ran `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v`.
   - Result:

```text
Ran 5 tests in 0.000s

OK
```

5. Ran `git diff --cached --check` before committing.
   - Result: no whitespace errors in the incomplete-slot fix.

### Fix commit

`575bb44` — `fix: reject incomplete LOFTER hotspot slots`

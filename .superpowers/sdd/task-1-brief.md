### Task 1: Persistent Run State and Legal Transitions

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/run_state.py`
- Create: `lofter-x-anime-hotspot/tests/test_run_state.py`
- Modify: `lofter-x-anime-hotspot/.gitignore`

**Interfaces:**
- Produces: `create_run(runs_root: Path, topic_slug: str, now: datetime | None = None) -> tuple[Path, dict]`
- Produces: `load_state(run_dir: Path) -> dict`
- Produces: `transition(run_dir: Path, expected: str, target: str, **updates) -> dict`
- Produces: `write_json_atomic(path: Path, payload: object) -> None`
- State values: `researching`, `draft_ready`, `authorization_review`, `revisions_required`, `approved`, `publishing`, `published`

- [ ] **Step 1: Write failing state tests**

```python
class RunStateTest(unittest.TestCase):
    def test_create_run_writes_private_resumable_layout(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, state = create_run(
                Path(value), "frieren-cafe", datetime(2026, 8, 11, 14, 30)
            )
            self.assertEqual(run_dir.name, "20260811-143000-frieren-cafe")
            self.assertEqual(state["state"], "researching")
            self.assertEqual(state["confirmations"], {"fill": False, "submit": False})
            self.assertTrue((run_dir / "sources").is_dir())
            self.assertTrue((run_dir / "original-media").is_dir())
            self.assertTrue((run_dir / "generated-media").is_dir())

    def test_transition_rejects_skip_and_stale_writer(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "illegal state transition"):
                transition(run_dir, "researching", "approved")
            transition(run_dir, "researching", "draft_ready")
            with self.assertRaisesRegex(ValueError, "expected researching"):
                transition(run_dir, "researching", "authorization_review")

    def test_state_rejects_secrets(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "forbidden secret field"):
                transition(run_dir, "researching", "draft_ready", cookie="secret")
```

- [ ] **Step 2: Run the state tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'run_state'`.

- [ ] **Step 3: Implement atomic state storage and transition validation**

```python
STATES = (
    "researching", "draft_ready", "authorization_review",
    "revisions_required", "approved", "publishing", "published",
)
ALLOWED = {
    "researching": {"draft_ready"},
    "draft_ready": {"authorization_review"},
    "authorization_review": {"revisions_required", "approved"},
    "revisions_required": {"authorization_review"},
    "approved": {"publishing"},
    "publishing": {"published", "approved"},
    "published": set(),
}
FORBIDDEN_KEYS = {"password", "cookie", "cookies", "verification_code", "captcha"}

def write_json_atomic(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    temporary.replace(path)

def transition(run_dir: Path, expected: str, target: str, **updates) -> dict:
    state = load_state(run_dir)
    if state["state"] != expected:
        raise ValueError(f"expected {expected}, found {state['state']}")
    if target not in ALLOWED[expected]:
        raise ValueError(f"illegal state transition: {expected} -> {target}")
    lowered = {key.lower() for key in updates}
    forbidden = sorted(lowered & FORBIDDEN_KEYS)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden[0]}")
    state.update(updates)
    state["state"] = target
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json_atomic(run_dir / "status.json", state)
    return state
```

Implement `create_run` with a sanitized lowercase ASCII slug, collision rejection, the three directories shown in the test, and the initial fields `run_id`, `state`, `topic`, `time_window_hours`, `content_mode`, `files`, `media_review`, `confirmations`, `publication`, `errors`, `created_at`, and `updated_at`. Implement `load_state` with exact-type validation for these fields and rejection of unknown state names.

- [ ] **Step 4: Ignore operational runs and run tests**

Add exactly this line to `.gitignore`:

```gitignore
runs/
```

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v`  
Expected: all `RunStateTest` tests PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add lofter-x-anime-hotspot/.gitignore lofter-x-anime-hotspot/scripts/run_state.py lofter-x-anime-hotspot/tests/test_run_state.py
git commit -m "feat: add resumable LOFTER run state"
```


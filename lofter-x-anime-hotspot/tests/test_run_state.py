import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from run_state import create_run, load_state, transition


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

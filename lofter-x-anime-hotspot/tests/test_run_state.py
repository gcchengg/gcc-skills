import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from run_state import create_run, load_state, transition, write_json_atomic


class RunStateTest(unittest.TestCase):
    def test_create_run_writes_private_resumable_layout(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, state = create_run(
                Path(value), "frieren-cafe", datetime(2026, 8, 11, 14, 30)
            )
            self.assertEqual(run_dir.name, "20260811-143000-frieren-cafe")
            self.assertEqual(state["state"], "researching")
            self.assertEqual(state["time_window_hours"], 24)
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

    def test_state_rejects_nested_secret_fields(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "forbidden secret field"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    files={"request": [{"Auth_Token": "secret"}]},
                )
            self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_transition_rejects_malformed_update_without_corrupting_state(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, before = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "time_window_hours"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    time_window_hours=True,
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "run_id and state"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    run_id="forged-run",
                )
            self.assertEqual(load_state(run_dir), before)

    def test_review_to_approval_requires_fill_confirmation(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            transition(run_dir, "researching", "draft_ready")
            transition(run_dir, "draft_ready", "authorization_review")
            with self.assertRaisesRegex(ValueError, "fill confirmation"):
                transition(run_dir, "authorization_review", "approved")
            state = transition(
                run_dir,
                "authorization_review",
                "approved",
                confirmations={"fill": True, "submit": False},
            )
            self.assertEqual(state["state"], "approved")

    def test_approved_to_publishing_requires_complete_preview(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            transition(run_dir, "researching", "draft_ready")
            transition(run_dir, "draft_ready", "authorization_review")
            transition(
                run_dir,
                "authorization_review",
                "approved",
                confirmations={"fill": True, "submit": False},
            )
            with self.assertRaisesRegex(ValueError, "platform preview"):
                transition(run_dir, "approved", "publishing")
            state = transition(
                run_dir,
                "approved",
                "publishing",
                platform_preview={"url": "https://www.lofter.com/post/preview"},
            )
            self.assertEqual(state["state"], "publishing")

    def test_publishing_to_published_requires_submit_and_publication(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            transition(run_dir, "researching", "draft_ready")
            transition(run_dir, "draft_ready", "authorization_review")
            transition(
                run_dir,
                "authorization_review",
                "approved",
                confirmations={"fill": True, "submit": False},
            )
            transition(
                run_dir,
                "approved",
                "publishing",
                platform_preview={"url": "https://www.lofter.com/post/preview"},
            )
            with self.assertRaisesRegex(ValueError, "submit confirmation"):
                transition(run_dir, "publishing", "published")
            state = transition(
                run_dir,
                "publishing",
                "published",
                confirmations={"fill": True, "submit": True},
                publication={"url": "https://example.lofter.com/post/1"},
            )
            self.assertEqual(state["state"], "published")

    def test_atomic_write_cleans_up_tempfile_when_replace_fails(self):
        with tempfile.TemporaryDirectory() as value:
            path = Path(value) / "status.json"
            with mock.patch.object(Path, "replace", side_effect=OSError("replace failed")):
                with self.assertRaisesRegex(OSError, "replace failed"):
                    write_json_atomic(path, {"state": "researching"})
            self.assertEqual(list(Path(value).glob("status.json*.tmp")), [])

import json
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

    def test_state_rejects_normalized_nested_secret_key_variants(self):
        secret_keys = (
            "browser_session_secret",
            "session_secret",
            "lofter_cookie",
            "verificationCode",
        )
        with tempfile.TemporaryDirectory() as value:
            for index, key in enumerate(secret_keys):
                run_dir, _ = create_run(Path(value), f"topic-{index}")
                with self.assertRaisesRegex(ValueError, "forbidden secret field"):
                    transition(
                        run_dir,
                        "researching",
                        "draft_ready",
                        files={"request": [{key: "secret"}]},
                    )
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_state_rejects_extended_credential_key_and_value_forms(self):
        with tempfile.TemporaryDirectory() as value:
            cases = (
                {"Authorization": "Bearer token"},
                {"credentials": "value"},
                {"api_key": "value"},
                {"headers": {"X-Trace": "value"}},
                {"note": "Bearer abc.def.ghi"},
                {"note": "abcdefgh.ijklmnop.qrstuvwx"},
            )
            for index, media_review in enumerate(cases):
                run_dir, _ = create_run(Path(value), f"credential-{index}")
                with self.assertRaisesRegex(ValueError, "forbidden secret field"):
                    transition(
                        run_dir,
                        "researching",
                        "draft_ready",
                        media_review=media_review,
                    )
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_transition_rejects_unallowlisted_and_non_json_updates(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, before = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "unknown update field"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    browser_context={},
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "JSON"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    media_review={"set": {"not-json"}},
                )
            self.assertEqual(load_state(run_dir), before)

    def test_transition_rejects_unsafe_file_paths_and_malformed_fields(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, before = create_run(Path(value), "topic")
            for files in ({"packet": "/tmp/packet.md"}, {"packet": "../packet.md"}):
                with self.assertRaisesRegex(ValueError, "relative run-local"):
                    transition(
                        run_dir,
                        "researching",
                        "draft_ready",
                        files=files,
                    )
                self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "confirmations"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    confirmations={"fill": True, "submit": False, "extra": True},
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "errors"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    errors=["valid", 1],
                )
            self.assertEqual(load_state(run_dir), before)

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

    def test_time_window_expansion_requires_auditable_24_to_72_evidence(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, before = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    time_window_hours=72,
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    time_window_hours=72,
                    window_expansion={
                        "from": 24,
                        "to": 72,
                        "insufficient_24h": True,
                        "reason": "",
                    },
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    time_window_hours=72,
                    window_expansion={
                        "from": 24,
                        "to": 72,
                        "insufficient_24h": 1,
                        "reason": "The first window lacked enough evidence.",
                    },
                )
            self.assertEqual(load_state(run_dir), before)
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir,
                    "researching",
                    "draft_ready",
                    time_window_hours=48,
                )
            self.assertEqual(load_state(run_dir), before)
            state = transition(
                run_dir,
                "researching",
                "draft_ready",
                time_window_hours=72,
                window_expansion={
                    "from": 24,
                    "to": 72,
                    "insufficient_24h": True,
                    "reason": "The first 24-hour window lacked enough evidence.",
                },
            )
            self.assertEqual(state["time_window_hours"], 72)
            self.assertEqual(state["window_expansion"]["from"], 24)

    def test_expanded_window_evidence_cannot_be_removed_or_corrupted(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            transition(
                run_dir,
                "researching",
                "draft_ready",
                time_window_hours=72,
                window_expansion={
                    "from": 24,
                    "to": 72,
                    "insufficient_24h": True,
                    "reason": "The first 24-hour window lacked enough evidence.",
                },
            )
            before = load_state(run_dir)
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir,
                    "draft_ready",
                    "authorization_review",
                    window_expansion=None,
                )
            self.assertEqual(load_state(run_dir), before)
            malformed = {**before, "window_expansion": None}
            (run_dir / "status.json").write_text(
                json.dumps(malformed), encoding="utf-8"
            )
            with self.assertRaisesRegex(ValueError, "window expansion"):
                load_state(run_dir)
            (run_dir / "status.json").write_text(
                json.dumps({**before, "unexpected": "field"}), encoding="utf-8"
            )
            with self.assertRaisesRegex(ValueError, "unknown fields"):
                load_state(run_dir)

    def test_168_hour_window_requires_complete_24_to_72_to_168_chain(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, before = create_run(Path(value), "topic")
            step_24 = {
                "from": 24, "to": 72, "insufficient_24h": True,
                "reason": "24 hours insufficient",
            }
            step_72 = {
                "from": 72, "to": 168, "insufficient_72h": True,
                "reason": "72 hours insufficient",
            }
            with self.assertRaisesRegex(ValueError, "window expansion"):
                transition(
                    run_dir, "researching", "draft_ready",
                    time_window_hours=168,
                    window_expansion={"from": 24, "to": 168, "steps": [step_24]},
                )
            self.assertEqual(load_state(run_dir), before)

            state = transition(
                run_dir, "researching", "draft_ready",
                time_window_hours=168,
                window_expansion={
                    "from": 24, "to": 168, "steps": [step_24, step_72]
                },
            )
            self.assertEqual(state["time_window_hours"], 168)
            self.assertEqual(state["window_expansion"]["steps"][1]["to"], 168)

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
            self.assertEqual(list(Path(value).glob(".*.tmp")), [])

    def test_atomic_write_cleans_up_tempfile_when_serialization_fails(self):
        with tempfile.TemporaryDirectory() as value:
            path = Path(value) / "status.json"
            with self.assertRaises(TypeError):
                write_json_atomic(path, {"not_json": {"set"}})
            self.assertEqual(list(Path(value).glob(".*.tmp")), [])

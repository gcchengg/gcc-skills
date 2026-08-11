import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path
from unittest import mock


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

import build_publishable_draft as draft_module
from build_publishable_draft import (
    build_draft,
    record_media_review,
    replace_rejected_media,
)
from run_state import create_run, load_state, write_json_atomic
from validate_authorizations import validate_authorization, validate_ledger


FIXED_NOW = datetime(2026, 8, 11, 14, 30)


def long_article(prefix: str = "这是用于复核替换流程的原创中文正文。") -> str:
    return prefix * 60


def authorization_record(**overrides) -> dict:
    value = {
        "asset_id": "media-123",
        "author_handle": "@artist",
        "source_url": "https://x.com/artist/status/123",
        "evidence_path": "evidence/media-123.txt",
        "lofter_redistribution": True,
        "ai_adaptation": True,
        "commercial_use": False,
        "translation": True,
        "crop": True,
        "layout": True,
        "allowed_platforms": ["LOFTER"],
        "attribution_mode": "public",
        "original_asset_id": None,
        "derived_asset_ids": [],
        "publication_history": [],
        "example_only": False,
    }
    value.update(overrides)
    return value


class MediaReviewTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)

    def prepared_review_run(self, slug: str = "review-topic") -> Path:
        run_dir, _ = create_run(self.root / "runs", slug, FIXED_NOW)
        (run_dir / "original-media/candidate.webp").write_bytes(b"rejected-candidate")
        (run_dir / "generated-media/original.webp").write_bytes(b"existing-original")
        write_json_atomic(
            run_dir / "hotspot-analysis.json",
            {
                "time_window_hours": 24,
                "candidate": {"id": slug, "title": "入选热点", "eligible": True},
                "content_mode": "trend_analysis",
                "selection_reason": "24小时窗口内综合评分最高：91/100",
            },
        )
        build_draft(
            run_dir,
            {
                "article": long_article(),
                "titles": ["备选标题一", "备选标题二", "备选标题三"],
                "tags": [f"标签{number}" for number in range(1, 9)],
                "authorized_media_intent": False,
                "ai_assistance": False,
                "media": [
                    {
                        "kind": "x_original",
                        "role": "cover",
                        "local_path": "original-media/candidate.webp",
                        "caption": "候选封面图",
                        "source_url": "https://x.com/artist/status/123",
                        "source_author": "@artist",
                        "source_media_id": "media-123",
                    },
                    {
                        "kind": "generated_original",
                        "role": "body",
                        "local_path": "generated-media/original.webp",
                        "caption": "独立原创配图",
                        "generation_lineage": {
                            "generator": "test-image-model",
                            "prompt": "an independent original composition",
                            "source_media_ids": [],
                        },
                    },
                ],
            },
        )
        return run_dir

    def authorization_envelope(self, run_dir: Path, **record_overrides) -> dict:
        evidence = run_dir / "private-authorization/evidence/media-123.txt"
        evidence.parent.mkdir(parents=True)
        evidence.write_text("real operational evidence", encoding="utf-8")
        ledger_path = run_dir / "private-authorization/authorizations.json"
        record = authorization_record(**record_overrides)
        write_json_atomic(ledger_path, [record])
        decision = validate_authorization(
            record,
            "original",
            evidence_root=ledger_path.parent,
        )
        return {**decision, "authorization_ledger_path": str(ledger_path)}

    def valid_independent_replacement(self, run_dir: Path) -> dict:
        path = run_dir / "generated-media/replacement.webp"
        path.write_bytes(b"independent-replacement")
        return {
            "kind": "generated_original",
            "local_path": "generated-media/replacement.webp",
            "caption": "新封面图",
            "generation_lineage": {
                "generator": "test-image-model",
                "prompt": "new independent composition without source image input",
                "source_media_ids": [],
            },
        }

    @staticmethod
    def load_media_ledger(run_dir: Path) -> list[dict]:
        return json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )

    def test_authorized_x_media_requires_exact_ledger_backed_decision(self):
        run_dir = self.prepared_review_run()
        with self.assertRaisesRegex(ValueError, "ledger-backed"):
            record_media_review(run_dir, 1, True, {"allowed": True})

    def test_exact_ledger_backed_decision_is_persisted_without_transport_path(self):
        run_dir = self.prepared_review_run()
        envelope = self.authorization_envelope(run_dir)
        operational_path = envelope["authorization_ledger_path"]

        result = record_media_review(run_dir, 1, True, envelope)

        self.assertEqual(result["review_status"], "authorized")
        self.assertNotIn("authorization_ledger_path", result["authorization"])
        self.assertEqual(
            load_state(run_dir)["media_review"],
            {"pending": 0, "authorized": 1, "rejected": 0, "independent": 1},
        )
        for relative_path in (
            "sources/media-ledger.json",
            "article.md",
            "publication-order.md",
            "status.json",
        ):
            self.assertNotIn(
                operational_path,
                (run_dir / relative_path).read_text(encoding="utf-8"),
                relative_path,
            )

    def test_forged_complete_decision_fails_closed(self):
        run_dir = self.prepared_review_run()
        envelope = self.authorization_envelope(run_dir)
        envelope["attribution_mode"] = "anonymous_allowed"
        before = self.load_media_ledger(run_dir)

        with self.assertRaisesRegex(ValueError, "exactly match"):
            record_media_review(run_dir, 1, True, envelope)

        self.assertEqual(self.load_media_ledger(run_dir), before)
        self.assertEqual(load_state(run_dir)["state"], "authorization_review")

    def test_missing_or_unreadable_ledger_path_fails_closed(self):
        for case in ("missing", "unreadable"):
            with self.subTest(case=case):
                run_dir = self.prepared_review_run(f"path-{case}")
                envelope = self.authorization_envelope(run_dir)
                if case == "missing":
                    envelope.pop("authorization_ledger_path")
                else:
                    envelope["authorization_ledger_path"] = str(
                        run_dir / "private-authorization/missing.json"
                    )
                before = self.load_media_ledger(run_dir)

                with self.assertRaisesRegex(ValueError, "ledger-backed"):
                    record_media_review(run_dir, 1, True, envelope)

                self.assertEqual(self.load_media_ledger(run_dir), before)
                self.assertEqual(load_state(run_dir)["state"], "authorization_review")

    def test_example_only_ledger_fails_closed(self):
        run_dir = self.prepared_review_run()
        evidence = run_dir / "private-authorization/evidence/media-123.txt"
        evidence.parent.mkdir(parents=True)
        evidence.write_text("example evidence", encoding="utf-8")
        ledger_path = run_dir / "private-authorization/authorizations.json"
        record = authorization_record(example_only=True)
        write_json_atomic(ledger_path, [record])
        indexed = validate_ledger(
            [record], evidence_root=ledger_path.parent, allow_example_only=True
        )
        decision = validate_authorization(
            indexed["media-123"],
            "original",
            evidence_root=ledger_path.parent,
            smoke_only=True,
        )

        with self.assertRaisesRegex(ValueError, "example-only"):
            record_media_review(
                run_dir,
                1,
                True,
                {**decision, "authorization_ledger_path": str(ledger_path)},
            )

        self.assertEqual(self.load_media_ledger(run_dir)[0]["review_status"], "pending")

    def test_rejection_requires_generated_independent_replacement(self):
        run_dir = self.prepared_review_run()
        record_media_review(run_dir, 1, False)
        replacement = {
            "kind": "ai_adaptation",
            "local_path": "generated-media/replacement.webp",
            "generation_lineage": {
                "prompt": "new composition",
                "source_media_ids": ["media-123"],
            },
        }
        with self.assertRaisesRegex(ValueError, "generated_original"):
            replace_rejected_media(
                run_dir,
                1,
                replacement,
                long_article("这是修改后的正文。"),
                ["新图", "独立原创配图"],
            )

    def test_independent_replacement_requires_exact_empty_source_lineage(self):
        for source_media_ids in (None, ["media-123"], [1]):
            with self.subTest(source_media_ids=source_media_ids):
                run_dir = self.prepared_review_run(f"lineage-{source_media_ids}")
                record_media_review(run_dir, 1, False)
                replacement = self.valid_independent_replacement(run_dir)
                if source_media_ids is None:
                    replacement["generation_lineage"].pop("source_media_ids")
                else:
                    replacement["generation_lineage"]["source_media_ids"] = source_media_ids

                with self.assertRaisesRegex(ValueError, "must not derive"):
                    replace_rejected_media(
                        run_dir,
                        1,
                        replacement,
                        long_article("这是修改后的正文。"),
                        ["新封面图", "独立原创配图"],
                    )

    def test_replacement_cannot_reuse_rejected_path_or_bytes(self):
        for case in ("path", "bytes"):
            with self.subTest(case=case):
                run_dir = self.prepared_review_run(f"reuse-{case}")
                record_media_review(run_dir, 1, False)
                replacement = self.valid_independent_replacement(run_dir)
                if case == "path":
                    replacement["local_path"] = "original-media/01.webp"
                else:
                    (run_dir / replacement["local_path"]).write_bytes(
                        (run_dir / "original-media/01.webp").read_bytes()
                    )

                with self.assertRaisesRegex(ValueError, "path or bytes"):
                    replace_rejected_media(
                        run_dir,
                        1,
                        replacement,
                        long_article("这是修改后的正文。"),
                        ["新封面图", "独立原创配图"],
                    )

    def test_replacement_changes_only_rejected_media_and_affected_copy(self):
        run_dir = self.prepared_review_run()
        before = self.load_media_ledger(run_dir)
        unchanged_media_bytes = (run_dir / before[1]["local_path"]).read_bytes()
        unchanged_titles = (run_dir / "titles-and-tags.md").read_bytes()

        record_media_review(run_dir, 1, False)
        replacement = self.valid_independent_replacement(run_dir)
        revised_article = long_article("这是仅针对替换图调整的正文。")
        result = replace_rejected_media(
            run_dir,
            1,
            replacement,
            revised_article,
            ["新封面图", before[1]["caption"]],
        )

        self.assertEqual(result[1], before[1])
        self.assertEqual(result[0]["kind"], "generated_original")
        self.assertEqual(result[0]["review_status"], "independent")
        self.assertEqual(result[0]["replaces_media_id"], 1)
        self.assertEqual(result[0]["generation_lineage"]["source_media_ids"], [])
        self.assertEqual((run_dir / result[0]["local_path"]).read_bytes(), b"independent-replacement")
        self.assertEqual((run_dir / before[1]["local_path"]).read_bytes(), unchanged_media_bytes)
        self.assertEqual((run_dir / "titles-and-tags.md").read_bytes(), unchanged_titles)
        self.assertEqual((run_dir / "article.md").read_text(encoding="utf-8"), revised_article + "\n")
        self.assertEqual(load_state(run_dir)["state"], "authorization_review")

    def test_replacement_transition_failure_rolls_back_all_artifacts_and_state(self):
        run_dir = self.prepared_review_run()
        record_media_review(run_dir, 1, False)
        replacement = self.valid_independent_replacement(run_dir)
        tracked = {
            path: path.read_bytes()
            for path in (
                run_dir / "article.md",
                run_dir / "publication-order.md",
                run_dir / "sources/media-ledger.json",
                run_dir / "status.json",
            )
        }
        replacement_target = run_dir / "generated-media/01.webp"
        self.assertFalse(replacement_target.exists())

        with mock.patch.object(
            draft_module, "transition", side_effect=OSError("injected transition failure")
        ):
            with self.assertRaisesRegex(OSError, "injected transition failure"):
                replace_rejected_media(
                    run_dir,
                    1,
                    replacement,
                    long_article(),
                    ["新封面图", "独立原创配图"],
                )

        for path, content in tracked.items():
            self.assertEqual(path.read_bytes(), content, path)
        self.assertFalse(replacement_target.exists())
        self.assertEqual(load_state(run_dir)["state"], "revisions_required")
        self.assertFalse(tuple(run_dir.glob(".review-stage-*")))


if __name__ == "__main__":
    unittest.main()

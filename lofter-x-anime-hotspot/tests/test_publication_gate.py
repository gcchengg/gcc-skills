import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from build_publishable_draft import build_draft, record_media_review
from publication_gate import (
    approve_final_submit,
    approve_form_fill,
    build_upload_manifest,
    mark_form_filled,
    pause_before_submit,
    record_publication,
)
from run_state import create_run, load_state, write_json_atomic
from validate_authorizations import validate_authorization, validate_ledger


FIXED_NOW = datetime(2026, 8, 11, 14, 30)


def _article() -> str:
    return "这是用于验证两次确认发布门禁的原创中文正文。" * 50


class PublicationGateTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)

    def prepared_review_run(
        self, slug: str = "publication-gate", *, include_x_media: bool = False
    ) -> Path:
        run_dir, _ = create_run(self.root / "runs", slug, FIXED_NOW)
        media = []
        if include_x_media:
            (run_dir / "original-media/candidate.webp").write_bytes(b"candidate")
            media.append(
                {
                    "kind": "x_original",
                    "role": "cover",
                    "local_path": "original-media/candidate.webp",
                    "caption": "已授权候选封面图",
                    "source_url": "https://x.com/artist/status/123",
                    "source_author": "@artist",
                    "source_media_id": "media-123",
                }
            )
        (run_dir / "generated-media/original.webp").write_bytes(b"generated")
        media.append(
            {
                "kind": "generated_original",
                "role": "body" if include_x_media else "cover",
                "local_path": "generated-media/original.webp",
                "caption": "独立原创配图",
                "generation_lineage": {
                    "generator": "test-image-model",
                    "prompt": "an independent original composition",
                    "source_media_ids": [],
                },
            }
        )
        write_json_atomic(
            run_dir / "hotspot-analysis.json",
            {
                "time_window_hours": 24,
                "candidate": {
                    "id": slug,
                    "title": "入选热点",
                    "eligible": True,
                },
                "content_mode": "trend_analysis",
                "selection_reason": "24小时窗口内综合评分最高：91/100",
            },
        )
        build_draft(
            run_dir,
            {
                "article": _article(),
                "titles": ["备选标题一", "备选标题二", "备选标题三"],
                "tags": [f"标签{number}" for number in range(1, 9)],
                "authorized_media_intent": include_x_media,
                "ai_assistance": True,
                "media": media,
            },
        )
        return run_dir

    def fully_reviewed_run(
        self, slug: str = "fully-reviewed", *, include_authorized: bool = False
    ) -> Path:
        run_dir = self.prepared_review_run(slug, include_x_media=include_authorized)
        if include_authorized:
            ledger_path = run_dir / "private-authorization/authorizations.json"
            evidence_path = ledger_path.parent / "evidence/media-123.txt"
            evidence_path.parent.mkdir(parents=True)
            evidence_path.write_text("real operational evidence", encoding="utf-8")
            record = {
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
            write_json_atomic(ledger_path, [record])
            indexed = validate_ledger([record], evidence_root=ledger_path.parent)
            decision = validate_authorization(
                indexed["media-123"], "original", evidence_root=ledger_path.parent
            )
            record_media_review(
                run_dir,
                1,
                True,
                {**decision, "authorization_ledger_path": str(ledger_path)},
            )
        return run_dir

    def filled_form_run(self, slug: str = "filled-form") -> Path:
        run_dir = self.fully_reviewed_run(slug)
        approve_form_fill(run_dir, "确认发布")
        mark_form_filled(
            run_dir,
            {
                "captured_at": "2026-08-11T15:55:00+08:00",
                "title": "备选标题一",
                "media_count": 1,
                "submit_button_visible": True,
            },
        )
        return run_dir

    def test_first_confirmation_requires_all_media_publishable(self):
        run_dir = self.prepared_review_run(include_x_media=True)

        with self.assertRaisesRegex(ValueError, "media review incomplete"):
            approve_form_fill(run_dir, "确认发布")

        self.assertEqual(load_state(run_dir)["state"], "authorization_review")

    def test_wrong_or_reused_confirmation_cannot_advance(self):
        run_dir = self.fully_reviewed_run()
        with self.assertRaisesRegex(ValueError, "exact confirmation"):
            approve_form_fill(run_dir, "可以发布")

        approve_form_fill(run_dir, "确认发布")
        with self.assertRaisesRegex(ValueError, "exact confirmation"):
            approve_final_submit(run_dir, "确认发布")
        with self.assertRaisesRegex(ValueError, "final platform preview"):
            approve_final_submit(run_dir, "确认最终提交")

        self.assertEqual(load_state(run_dir)["state"], "approved")
        self.assertFalse(load_state(run_dir)["confirmations"]["submit"])

    def test_manifest_contains_only_authorized_or_independent_local_media(self):
        run_dir = self.fully_reviewed_run(include_authorized=True)
        approve_form_fill(run_dir, "确认发布")

        manifest = build_upload_manifest(run_dir)

        self.assertEqual(manifest["title"], "备选标题一")
        self.assertEqual(manifest["tags"], [f"标签{number}" for number in range(1, 9)])
        self.assertEqual(
            {item["review_status"] for item in manifest["media"]},
            {"authorized", "independent"},
        )
        self.assertTrue(
            all(
                set(item) == {"display_id", "role", "local_path", "review_status"}
                for item in manifest["media"]
            )
        )
        serialized = json.dumps(manifest, ensure_ascii=False)
        self.assertNotIn("authorization", serialized)
        self.assertNotIn("evidence_path", serialized)
        self.assertNotIn("ledger", serialized)

    def test_form_preview_is_typed_and_must_match_upload_contents(self):
        run_dir = self.fully_reviewed_run()
        approve_form_fill(run_dir, "确认发布")
        invalid_previews = (
            {"captured_at": "bad", "title": "备选标题一", "media_count": 1, "submit_button_visible": True},
            {"captured_at": "2026-08-11T15:55:00+08:00", "title": "错误标题", "media_count": 1, "submit_button_visible": True},
            {"captured_at": "2026-08-11T15:55:00+08:00", "title": "备选标题一", "media_count": True, "submit_button_visible": True},
            {"captured_at": "2026-08-11T15:55:00+08:00", "title": "备选标题一", "media_count": 1, "submit_button_visible": False},
        )

        for preview in invalid_previews:
            with self.subTest(preview=preview):
                with self.assertRaisesRegex(ValueError, "final platform preview"):
                    mark_form_filled(run_dir, preview)

        self.assertEqual(load_state(run_dir)["state"], "approved")

    def test_second_confirmation_and_result_are_separate_events(self):
        run_dir = self.filled_form_run()

        state = approve_final_submit(run_dir, "确认最终提交")
        self.assertEqual(state["state"], "publishing")
        self.assertEqual(state["publication"], {})
        state = record_publication(
            run_dir,
            {
                "lofter_url": "https://example.lofter.com/post/abc",
                "published_at": "2026-08-11T16:00:00+08:00",
            },
        )

        self.assertEqual(state["state"], "published")

    def test_second_confirmation_revalidates_persisted_typed_preview(self):
        run_dir = self.filled_form_run("tampered-preview")
        state = load_state(run_dir)
        state["platform_preview"] = {"captured_at": "2026-08-11T15:55:00+08:00"}
        write_json_atomic(run_dir / "status.json", state)

        with self.assertRaisesRegex(ValueError, "final platform preview"):
            approve_final_submit(run_dir, "确认最终提交")

        self.assertFalse(load_state(run_dir)["confirmations"]["submit"])

    def test_publication_result_requires_lofter_url_and_timezone_aware_datetime(self):
        run_dir = self.filled_form_run("invalid-result")
        approve_final_submit(run_dir, "确认最终提交")

        for result in (
            {
                "lofter_url": "https://example.com/post/abc",
                "published_at": "2026-08-11T16:00:00+08:00",
            },
            {
                "lofter_url": "https://example.lofter.com/post/abc",
                "published_at": "2026-08-11T16:00:00",
            },
        ):
            with self.subTest(result=result):
                with self.assertRaises(ValueError):
                    record_publication(run_dir, result)

        self.assertEqual(load_state(run_dir)["state"], "publishing")

    def test_safe_pause_is_only_available_before_final_submit(self):
        run_dir = self.filled_form_run("safe-pause")

        state = pause_before_submit(run_dir, "platform preview expired")

        self.assertEqual(state["state"], "approved")
        self.assertIn("platform preview expired", state["errors"])
        run_dir = self.filled_form_run("unsafe-pause")
        approve_final_submit(run_dir, "确认最终提交")
        with self.assertRaisesRegex(ValueError, "before final submit"):
            pause_before_submit(run_dir, "browser closed")

    def test_uncertain_submit_stays_publishing_and_blocks_further_writes(self):
        run_dir = self.filled_form_run("uncertain-submit")
        approve_final_submit(run_dir, "确认最终提交")

        state = record_publication(run_dir, {"result": "uncertain"})

        self.assertEqual(state["state"], "publishing")
        self.assertEqual(state["publication"]["result"], "uncertain")
        self.assertEqual(
            state["publication"]["verification_required"],
            "read_only_lofter_profile_or_drafts",
        )
        with self.assertRaisesRegex(ValueError, "read-only LOFTER profile/drafts"):
            record_publication(
                run_dir,
                {
                    "lofter_url": "https://example.lofter.com/post/abc",
                    "published_at": "2026-08-11T16:00:00+08:00",
                },
            )


if __name__ == "__main__":
    unittest.main()

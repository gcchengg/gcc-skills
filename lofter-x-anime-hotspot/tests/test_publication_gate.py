import hashlib
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
    resolve_uncertain_publication,
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
        self,
        slug: str = "publication-gate",
        *,
        include_x_media: bool = False,
        two_independent: bool = False,
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
        if two_independent:
            (run_dir / "generated-media/second.webp").write_bytes(b"generated-second")
            media.append(
                {
                    "kind": "generated_original",
                    "role": "body",
                    "local_path": "generated-media/second.webp",
                    "caption": "第二张独立原创配图",
                    "generation_lineage": {
                        "generator": "test-image-model",
                        "prompt": "a second independent original composition",
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
        self,
        slug: str = "fully-reviewed",
        *,
        include_authorized: bool = False,
        two_independent: bool = False,
    ) -> Path:
        run_dir = self.prepared_review_run(
            slug,
            include_x_media=include_authorized,
            two_independent=two_independent,
        )
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

    def filled_form_run(
        self, slug: str = "filled-form", *, two_independent: bool = False
    ) -> Path:
        run_dir = self.fully_reviewed_run(slug, two_independent=two_independent)
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        mark_form_filled(
            run_dir,
            {
                "captured_at": "2026-08-11T15:55:00+08:00",
                "title": manifest["title"],
                "article": manifest["article"],
                "tags": manifest["tags"],
                "media": [
                    {
                        "display_id": item["display_id"],
                        "sha256": item["sha256"],
                        "size": item["size"],
                    }
                    for item in manifest["media"]
                ],
                "submit_button_visible": True,
                "first_content_is_cover": True,
            },
        )
        return run_dir

    def test_first_confirmation_requires_all_media_publishable(self):
        run_dir = self.prepared_review_run(include_x_media=True)

        with self.assertRaisesRegex(ValueError, "media review incomplete"):
            approve_form_fill(run_dir, "确认发布")

        self.assertEqual(load_state(run_dir)["state"], "authorization_review")

    def test_first_confirmation_persists_user_authorization_attestation(self):
        run_dir = self.fully_reviewed_run("attestation", include_authorized=True)

        state = approve_form_fill(run_dir, "确认发布")

        self.assertEqual(state["media_rights_attestation"]["attested"], True)
        self.assertIn("attested_at", state["media_rights_attestation"])

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
        state = approve_form_fill(run_dir, "确认发布")

        manifest = build_upload_manifest(run_dir)

        self.assertEqual(manifest["title"], "备选标题一")
        self.assertEqual(manifest["tags"], [f"标签{number}" for number in range(1, 9)])
        self.assertEqual(
            {item["review_status"] for item in manifest["media"]},
            {"authorized", "independent"},
        )
        self.assertTrue(
            all(
                set(item) == {"display_id", "role", "local_path", "review_status", "sha256", "size"}
                for item in manifest["media"]
            )
        )
        serialized = json.dumps(manifest, ensure_ascii=False)
        self.assertNotIn("authorization", serialized)
        self.assertNotIn("evidence_path", serialized)
        self.assertNotIn("ledger", serialized)
        canonical = json.dumps(
            manifest,
            ensure_ascii=False,
            sort_keys=True,
            separators=(",", ":"),
        ).encode("utf-8")
        self.assertEqual(
            state["approved_manifest_digest"], hashlib.sha256(canonical).hexdigest()
        )

    def test_short_image_post_can_build_upload_manifest(self):
        run_dir, _ = create_run(self.root / "runs", "short-image-manifest", FIXED_NOW)
        (run_dir / "generated-media/original.webp").write_bytes(b"generated")
        write_json_atomic(
            run_dir / "hotspot-analysis.json",
            {
                "time_window_hours": 24,
                "candidate": {"id": "short", "title": "温迪画风挑战", "eligible": True},
                "content_mode": "visual_curation",
                "selection_reason": "LOFTER 当前活动图片帖测试",
            },
        )
        article = "温迪接到任务：请把自己画得简单一点。于是他认真画了三笔，一只圆滚滚的风精灵就诞生了。本人对这幅杰作相当满意，甚至准备拿它换一杯苹果酿。结果下一秒，小家伙真的从画纸里飞了出来，还抢走了他的帽子。精致吟游诗人和极简风精灵，你更想把哪一只带回尘歌壶？\n\n#AI生成#"
        build_draft(
            run_dir,
            {
                "content_format": "image_post",
                "article": article,
                "titles": ["温迪：这已经是最简单的画风了", "当温迪认真画了三笔", "极简风精灵逃出画纸之后"],
                "tags": ["原神", "温迪", "原神同人", "画风挑战", "梗图"],
                "authorized_media_intent": False,
                "ai_assistance": True,
                "media": [{
                    "kind": "generated_original",
                    "role": "cover",
                    "local_path": "generated-media/original.webp",
                    "caption": "温迪与极简风精灵",
                    "generation_lineage": {"generator": "test", "prompt": "new image", "source_media_ids": []},
                }],
            },
        )

        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)

        self.assertEqual(manifest["article"], article)
        self.assertEqual(manifest["tags"], ["原神", "温迪", "原神同人", "画风挑战", "梗图"])

    def test_form_preview_is_typed_and_must_match_upload_contents(self):
        run_dir = self.fully_reviewed_run()
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        valid = {
            "captured_at": "2026-08-11T15:55:00+08:00",
            "title": manifest["title"],
            "article": manifest["article"],
            "tags": manifest["tags"],
            "media": [
                {"display_id": item["display_id"], "sha256": item["sha256"], "size": item["size"]}
                for item in manifest["media"]
            ],
            "submit_button_visible": True,
            "first_content_is_cover": True,
        }
        invalid_previews = (
            {**valid, "captured_at": "bad"},
            {**valid, "title": "错误标题"},
            {**valid, "article": "错误正文"},
            {**valid, "tags": [*manifest["tags"][:-1], "错误标签"]},
            {**valid, "media": [{**valid["media"][0], "sha256": "0" * 64}]},
            {**valid, "submit_button_visible": False},
            {key: value for key, value in valid.items() if key != "first_content_is_cover"},
            {**valid, "first_content_is_cover": False},
            {**valid, "first_content_is_cover": 1},
            {**valid, "first_content_is_cover": "true"},
        )

        for preview in invalid_previews:
            with self.subTest(preview=preview):
                with self.assertRaisesRegex(ValueError, "final platform preview"):
                    mark_form_filled(run_dir, preview)

        self.assertEqual(load_state(run_dir)["state"], "approved")

    def test_caller_supplied_preview_manifest_digest_is_rejected(self):
        run_dir = self.fully_reviewed_run("forged-preview-digest")
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)

        with self.assertRaisesRegex(ValueError, "final platform preview"):
            mark_form_filled(
                run_dir,
                {
                    "captured_at": "2026-08-11T15:55:00+08:00",
                    "title": manifest["title"],
                    "article": manifest["article"],
                    "tags": manifest["tags"],
                    "media": [
                        {"display_id": item["display_id"], "sha256": item["sha256"], "size": item["size"]}
                        for item in manifest["media"]
                    ],
                    "submit_button_visible": True,
                    "first_content_is_cover": True,
                    "manifest_sha256": "0" * 64,
                },
            )

        self.assertEqual(load_state(run_dir)["state"], "approved")

    def test_media_bytes_are_bound_to_approval_and_final_submit(self):
        run_dir = self.fully_reviewed_run("byte-bound")
        approve_form_fill(run_dir, "确认发布")
        approved = load_state(run_dir)["approved_manifest_digest"]
        manifest = build_upload_manifest(run_dir)
        media_path = run_dir / manifest["media"][0]["local_path"]
        media_path.write_bytes(b"same path replacement")

        with self.assertRaisesRegex(ValueError, "upload manifest changed"):
            build_upload_manifest(run_dir)
        self.assertEqual(load_state(run_dir)["approved_manifest_digest"], approved)

        run_dir = self.filled_form_run("byte-bound-final")
        ledger = json.loads((run_dir / "sources/media-ledger.json").read_text(encoding="utf-8"))
        (run_dir / ledger[0]["local_path"]).write_bytes(b"changed after platform preview")
        with self.assertRaisesRegex(ValueError, "upload manifest changed"):
            approve_final_submit(run_dir, "确认最终提交")

    def test_article_mutation_after_preview_fails_final_digest_check(self):
        run_dir = self.filled_form_run("mutated-article")
        article_path = run_dir / "article.md"
        article_path.write_text(
            article_path.read_text(encoding="utf-8") + "篡改",
            encoding="utf-8",
        )

        with self.assertRaisesRegex(ValueError, "upload manifest changed"):
            approve_final_submit(run_dir, "确认最终提交")

        self.assertFalse(load_state(run_dir)["confirmations"]["submit"])

    def test_tag_mutation_after_preview_fails_final_digest_check(self):
        run_dir = self.filled_form_run("mutated-tag")
        path = run_dir / "titles-and-tags.md"
        path.write_text(
            path.read_text(encoding="utf-8").replace("#标签8#", "#篡改标签#"),
            encoding="utf-8",
        )

        with self.assertRaisesRegex(ValueError, "upload manifest changed"):
            approve_final_submit(run_dir, "确认最终提交")

        self.assertFalse(load_state(run_dir)["confirmations"]["submit"])

    def test_same_count_media_swap_fails_final_digest_check(self):
        run_dir = self.filled_form_run("media-swap", two_independent=True)
        ledger_path = run_dir / "sources/media-ledger.json"
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
        ledger.reverse()
        ledger[0]["display_id"] = 1
        ledger[1]["display_id"] = 2
        write_json_atomic(ledger_path, ledger)

        with self.assertRaisesRegex(ValueError, "upload manifest changed"):
            approve_final_submit(run_dir, "确认最终提交")

        self.assertFalse(load_state(run_dir)["confirmations"]["submit"])

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

    def test_uncertain_publication_can_only_be_resolved_by_matching_read_only_evidence(self):
        run_dir = self.filled_form_run("uncertain-resolution")
        approve_final_submit(run_dir, "确认最终提交")
        record_publication(run_dir, {"result": "uncertain"})
        approved = load_state(run_dir)["approved_manifest_digest"]

        state = resolve_uncertain_publication(
            run_dir,
            {
                "lofter_url": "https://example.lofter.com/post/verified",
                "observed_title": "备选标题一",
                "observed_manifest_sha256": approved,
                "checked_at": "2026-08-11T16:05:00+08:00",
            },
        )

        self.assertEqual(state["state"], "published")
        self.assertEqual(state["publication"]["resolution"], "read_only_verification")
        self.assertFalse(state["publication"]["submit_retried"])
        with self.assertRaisesRegex(ValueError, "uncertain"):
            resolve_uncertain_publication(
                run_dir,
                {
                    "lofter_url": "https://example.lofter.com/post/verified",
                    "observed_title": "备选标题一",
                    "observed_manifest_sha256": approved,
                    "checked_at": "2026-08-11T16:06:00+08:00",
                },
            )

    def test_uncertain_resolution_rejects_mismatched_observation_without_state_change(self):
        for field, value in (
            ("lofter_url", "https://example.com/post/no"),
            ("observed_title", "错误标题"),
            ("observed_manifest_sha256", "0" * 64),
            ("checked_at", "2026-08-11T16:05:00"),
        ):
            with self.subTest(field=field):
                run_dir = self.filled_form_run(f"uncertain-mismatch-{field}")
                approve_final_submit(run_dir, "确认最终提交")
                record_publication(run_dir, {"result": "uncertain"})
                before = load_state(run_dir)
                evidence = {
                    "lofter_url": "https://example.lofter.com/post/verified",
                    "observed_title": "备选标题一",
                    "observed_manifest_sha256": before["approved_manifest_digest"],
                    "checked_at": "2026-08-11T16:05:00+08:00",
                }
                evidence[field] = value
                with self.assertRaises(ValueError):
                    resolve_uncertain_publication(run_dir, evidence)
                self.assertEqual(load_state(run_dir), before)


if __name__ == "__main__":
    unittest.main()

import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from build_publishable_draft import (
    build_draft,
    record_media_review,
    replace_rejected_media,
)
from publication_gate import (
    approve_final_submit,
    approve_form_fill,
    build_upload_manifest,
    mark_form_filled,
    record_publication,
)
from render_preview import render_preview
from run_state import create_run, load_state, write_json_atomic
from select_publishable_topic import select_topic


FIXED_NOW = datetime(2026, 8, 11, 14, 30)


def valid_research_payload() -> dict:
    candidate = {
        "id": "selected-topic",
        "title": "入选热点",
        "ip_id": "rise-1",
        "ip_name": "上升作品",
        "ip_slot": "rising",
        "characters": ["角色A", "角色B"],
        "tags": ["上升作品", "角色A"],
        "x_growth": 26,
        "lofter_activity": 24,
        "ip_match": 15,
        "authorization": 10,
        "story_potential": 8,
        "x_evidence": "近24小时相关创作增长",
        "lofter_evidence": "对应标签出现有效讨论",
        "x_source_urls": ["https://x.com/example/status/1"],
        "observed_at": "2026-08-11T13:00:00+08:00",
        "asset_id": None,
        "requested_usage": "independent",
        "commercial_intent": False,
        "image_provenance": "human_original",
        "topic_features": {
            "event_signal": True,
            "relationship_signal": False,
            "visual_signal": False,
        },
    }
    return {
        "ip_pool": [
            {"ip_id": "long-1", "ip_name": "长线一", "ip_slot": "long_term"},
            {"ip_id": "long-2", "ip_name": "长线二", "ip_slot": "long_term"},
            {"ip_id": "rise-1", "ip_name": "上升作品", "ip_slot": "rising"},
            {"ip_id": "rise-2", "ip_name": "上升二", "ip_slot": "rising"},
            {"ip_id": "exp-1", "ip_name": "实验一", "ip_slot": "experiment"},
        ],
        "windows": {
            "24": {
                "checked_at": "2026-08-11T14:00:00+08:00",
                "x_sources": [
                    {"source_url": "https://x.com/example/status/1", "published_at": "2026-08-11T12:00:00+08:00", "evidence_summary": "X来源一"},
                    {"source_url": "https://x.com/example/status/2", "published_at": "2026-08-11T13:00:00+08:00", "evidence_summary": "X来源二"},
                ],
                "lofter_sources": [
                    {"source_url": "https://example.lofter.com/post/1", "published_at": "2026-08-11T13:30:00+08:00", "evidence_summary": "LOFTER来源"}
                ],
                "candidates": [candidate],
            }
        },
    }


def valid_draft_with_pending_x_media(run_dir: Path) -> dict:
    (run_dir / "original-media/candidate.webp").write_bytes(b"candidate-x-media")
    (run_dir / "generated-media/original.webp").write_bytes(b"original-visual")
    return {
        "article": (
            "这是用于验证可恢复发布流程、媒体替换和双重确认门禁的原创中文正文。"
            * 40
        ),
        "titles": ["备选标题一", "备选标题二", "备选标题三"],
        "tags": [f"标签{number}" for number in range(1, 9)],
        "authorized_media_intent": False,
        "ai_assistance": True,
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
    }


def valid_independent_replacement(run_dir: Path) -> dict:
    (run_dir / "generated-media/replacement.webp").write_bytes(
        b"independent-replacement"
    )
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


def revised_article() -> str:
    return (
        "这是替换被拒媒体后重新确认过的原创中文正文，不复用被拒素材及其构图。"
        * 40
    )


def revised_captions() -> list[str]:
    return ["新封面图", "独立原创配图"]


def valid_platform_preview(manifest: dict) -> dict:
    return {
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


def valid_publication_result() -> dict:
    return {
        "lofter_url": "https://example.lofter.com/post/abc",
        "published_at": "2026-08-11T16:00:00+08:00",
    }


class PublishableWorkflowTest(unittest.TestCase):
    def test_new_draft_reject_replace_resume_and_publish_flow(self):
        with tempfile.TemporaryDirectory() as value:
            root = Path(value)
            run_dir, _ = create_run(root / "runs", "selected-topic", FIXED_NOW)
            selection = select_topic(valid_research_payload())
            write_json_atomic(run_dir / "hotspot-analysis.json", selection)

            state = build_draft(
                run_dir, valid_draft_with_pending_x_media(run_dir)
            )
            self.assertEqual(state["state"], "authorization_review")
            self.assertTrue(render_preview(run_dir).is_file())
            self.assertEqual(
                list(run_dir.glob("preview.html")), [run_dir / "preview.html"]
            )

            record_media_review(run_dir, 1, False)
            self.assertEqual(load_state(run_dir)["state"], "revisions_required")
            replace_rejected_media(
                run_dir,
                1,
                valid_independent_replacement(run_dir),
                revised_article(),
                revised_captions(),
            )
            render_preview(run_dir)

            reloaded = load_state(run_dir)
            run_dir = root / "runs" / reloaded["run_id"]
            reloaded = load_state(run_dir)
            self.assertEqual(reloaded["state"], "authorization_review")
            self.assertEqual(reloaded["media_review"]["independent"], 2)

            approved = approve_form_fill(run_dir, "确认发布")
            self.assertEqual(approved["state"], "approved")
            manifest = build_upload_manifest(run_dir)
            self.assertEqual(len(manifest["media"]), 2)
            self.assertEqual(
                {item["review_status"] for item in manifest["media"]},
                {"independent"},
            )
            write_json_atomic(run_dir / "upload-manifest.json", manifest)

            state = mark_form_filled(run_dir, valid_platform_preview(manifest))
            self.assertEqual(state["state"], "publishing")
            state = approve_final_submit(run_dir, "确认最终提交")
            self.assertTrue(state["confirmations"]["submit"])
            record_publication(run_dir, valid_publication_result())

            final = load_state(run_dir)
            self.assertEqual(final["state"], "published")
            self.assertEqual(
                final["publication"]["lofter_url"],
                "https://example.lofter.com/post/abc",
            )
            self.assertTrue((run_dir / "upload-manifest.json").is_file())


if __name__ == "__main__":
    unittest.main()

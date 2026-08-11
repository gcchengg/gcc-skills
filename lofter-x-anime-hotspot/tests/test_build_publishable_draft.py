import json
import sys
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from build_publishable_draft import PUBLIC_DISCLOSURE, build_draft
from run_state import create_run, load_state, write_json_atomic


FIXED_NOW = datetime(2026, 8, 11, 14, 30)


def long_article() -> str:
    return "这是用于验证可发布草稿长度与结构的原创中文正文。" * 50


def valid_payload() -> dict:
    return {
        "article": long_article(),
        "titles": ["备选标题一", "备选标题二", "备选标题三"],
        "tags": [f"标签{number}" for number in range(1, 9)],
        "authorized_media_intent": True,
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
                    "prompt": "an independent original composition",
                    "model": "test-image-model",
                    "source_media_ids": [],
                },
            },
        ],
    }


class BuildPublishableDraftTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)

    def create_run_with_local_media(self) -> Path:
        run_dir, _ = create_run(Path(self.temporary.name), "selected-topic", FIXED_NOW)
        (run_dir / "original-media/candidate.webp").write_bytes(b"candidate")
        (run_dir / "generated-media/original.webp").write_bytes(b"generated")
        write_json_atomic(
            run_dir / "hotspot-analysis.json",
            {
                "time_window_hours": 24,
                "candidate": {
                    "id": "selected-topic",
                    "title": "入选热点",
                    "eligible": True,
                },
                "content_mode": "trend_analysis",
                "selection_reason": "24小时窗口内综合评分最高：91/100",
            },
        )
        return run_dir

    def test_builds_exact_publication_artifacts_and_enters_review(self):
        run_dir = self.create_run_with_local_media()

        result = build_draft(run_dir, valid_payload())

        self.assertEqual(result["state"], "authorization_review")
        for relative_path in (
            "article.md",
            "titles-and-tags.md",
            "publication-order.md",
            "sources/media-ledger.json",
        ):
            self.assertTrue((run_dir / relative_path).is_file(), relative_path)
        ledger = json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )
        self.assertEqual(
            [item["review_status"] for item in ledger], ["pending", "independent"]
        )
        self.assertEqual([item["display_id"] for item in ledger], [1, 2])
        self.assertIn(PUBLIC_DISCLOSURE, (run_dir / "article.md").read_text())
        self.assertEqual(
            result["files"]["media_ledger"], "sources/media-ledger.json"
        )
        self.assertEqual(result["content_mode"], "trend_analysis")

    def test_rejects_wrong_article_length_title_count_or_tag_count(self):
        run_dir = self.create_run_with_local_media()
        for field, value, message in (
            ("article", "太短", "800–1500"),
            ("titles", ["一个标题"], "exactly three"),
            ("tags", [f"标签{number}" for number in range(7)], "8–12"),
        ):
            with self.subTest(field=field):
                payload = valid_payload()
                payload[field] = value
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_rejects_duplicate_or_empty_titles_and_tags(self):
        run_dir = self.create_run_with_local_media()
        cases = (
            ("titles", ["重复", "重复", "第三个"], "unique non-empty"),
            ("titles", ["第一个", " ", "第三个"], "unique non-empty"),
            ("tags", ["重复"] * 8, "unique non-empty"),
        )
        for field, value, message in cases:
            with self.subTest(field=field, value=value):
                payload = valid_payload()
                payload[field] = value
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)

    def test_rejects_missing_file_remote_url_and_private_evidence_leaks(self):
        run_dir = self.create_run_with_local_media()
        cases = []

        missing = valid_payload()
        missing["media"][0]["local_path"] = "original-media/missing.webp"
        cases.append((missing, "does not exist"))

        remote = valid_payload()
        remote["media"][0]["local_path"] = "https://example.com/image.webp"
        cases.append((remote, "remote URL"))

        article_leak = valid_payload()
        article_leak["article"] += " evidence_path=/private/authorization.txt"
        cases.append((article_leak, "private evidence"))

        caption_leak = valid_payload()
        caption_leak["media"][1]["caption"] = "/Users/reviewer/private/evidence.png"
        cases.append((caption_leak, "private path"))

        for payload, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)
                self.assertFalse((run_dir / "article.md").exists())
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_rejects_unsafe_media_paths_and_invalid_media_shape(self):
        run_dir = self.create_run_with_local_media()
        cases = []

        traversal = valid_payload()
        traversal["media"][0]["local_path"] = "../candidate.webp"
        cases.append((traversal, "stay inside"))

        two_covers = valid_payload()
        two_covers["media"][1]["role"] = "cover"
        cases.append((two_covers, "exactly one cover"))

        invalid_kind = valid_payload()
        invalid_kind["media"][1]["kind"] = "remote_image"
        cases.append((invalid_kind, "invalid media kind"))

        too_many = valid_payload()
        too_many["media"] = too_many["media"] * 2
        cases.append((too_many, "one to three"))

        for payload, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)

    def test_validates_x_provenance_and_generated_lineage(self):
        run_dir = self.create_run_with_local_media()
        cases = []

        wrong_host = valid_payload()
        wrong_host["media"][0]["source_url"] = "https://example.com/status/123"
        cases.append((wrong_host, "https://x.com/"))

        missing_author = valid_payload()
        missing_author["media"][0]["source_author"] = " "
        cases.append((missing_author, "source_author"))

        missing_media_id = valid_payload()
        missing_media_id["media"][0]["source_media_id"] = ""
        cases.append((missing_media_id, "source_media_id"))

        invalid_lineage = valid_payload()
        invalid_lineage["media"][1]["generation_lineage"] = []
        cases.append((invalid_lineage, "generation_lineage"))

        for payload, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)

    def test_disclosure_is_present_only_when_both_intent_flags_are_true(self):
        combinations = ((False, False), (True, False), (False, True), (True, True))
        for index, (authorized_intent, ai_assistance) in enumerate(combinations):
            with self.subTest(
                authorized_intent=authorized_intent,
                ai_assistance=ai_assistance,
            ):
                run_dir, _ = create_run(
                    Path(self.temporary.name), f"disclosure-{index}", FIXED_NOW
                )
                (run_dir / "original-media/candidate.webp").write_bytes(b"candidate")
                (run_dir / "generated-media/original.webp").write_bytes(b"generated")
                write_json_atomic(
                    run_dir / "hotspot-analysis.json",
                    {
                        "time_window_hours": 24,
                        "candidate": {
                            "id": f"disclosure-{index}",
                            "title": "入选热点",
                            "eligible": True,
                        },
                        "content_mode": "trend_analysis",
                        "selection_reason": "综合评分最高",
                    },
                )
                payload = valid_payload()
                payload["authorized_media_intent"] = authorized_intent
                payload["ai_assistance"] = ai_assistance

                build_draft(run_dir, payload)

                article = (run_dir / "article.md").read_text(encoding="utf-8")
                self.assertEqual(
                    PUBLIC_DISCLOSURE in article,
                    authorized_intent and ai_assistance,
                )

    def test_requires_researching_run_and_persisted_selection(self):
        run_dir = self.create_run_with_local_media()
        (run_dir / "hotspot-analysis.json").unlink()
        with self.assertRaisesRegex(ValueError, "hotspot-analysis.json"):
            build_draft(run_dir, valid_payload())

        write_json_atomic(run_dir / "hotspot-analysis.json", {"content_mode": "fanfic"})
        with self.assertRaisesRegex(ValueError, "selection result"):
            build_draft(run_dir, valid_payload())

    def test_rejects_untrusted_unknown_fields(self):
        run_dir = self.create_run_with_local_media()
        payload = valid_payload()
        payload["authorization_evidence"] = "/private/evidence.txt"
        with self.assertRaisesRegex(ValueError, "unknown draft field"):
            build_draft(run_dir, payload)


if __name__ == "__main__":
    unittest.main()

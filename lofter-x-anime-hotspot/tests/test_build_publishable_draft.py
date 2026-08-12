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
                    "generator": "test-image-model",
                    "prompt": "an independent original composition",
                    "source_media_ids": [],
                },
            },
        ],
    }


class BuildPublishableDraftTest(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)

    def create_run_with_local_media(
        self, slug: str = "selected-topic", hours: int = 24
    ) -> Path:
        run_dir, _ = create_run(Path(self.temporary.name), slug, FIXED_NOW)
        (run_dir / "original-media/candidate.webp").write_bytes(b"candidate")
        (run_dir / "generated-media/original.webp").write_bytes(b"generated")
        write_json_atomic(
            run_dir / "hotspot-analysis.json",
            {
                "time_window_hours": hours,
                "candidate": {
                    "id": slug,
                    "title": "入选热点",
                    "eligible": True,
                },
                "content_mode": "trend_analysis",
                "selection_reason": "24小时窗口内综合评分最高：91/100",
            },
        )
        return run_dir

    def seed_existing_targets(self, run_dir: Path) -> dict[Path, bytes]:
        values = {
            run_dir / "article.md": b"old article\n",
            run_dir / "titles-and-tags.md": b"old titles\n",
            run_dir / "publication-order.md": b"old order\n",
            run_dir / "sources/media-ledger.json": b"[]\n",
            run_dir / "sources/draft-intent.json": b'{"old": true}\n',
            run_dir / "original-media/01.webp": b"old x media",
            run_dir / "generated-media/02.webp": b"old generated media",
        }
        for path, content in values.items():
            path.write_bytes(content)
        return values

    def test_builds_exact_publication_artifacts_and_enters_review(self):
        run_dir = self.create_run_with_local_media()

        result = build_draft(run_dir, valid_payload())

        self.assertEqual(result["state"], "authorization_review")
        for relative_path in (
            "article.md",
            "titles-and-tags.md",
            "publication-order.md",
            "sources/media-ledger.json",
            "sources/draft-intent.json",
        ):
            self.assertTrue((run_dir / relative_path).is_file(), relative_path)
        ledger = json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )
        self.assertEqual(
            [item["review_status"] for item in ledger], ["pending", "independent"]
        )
        self.assertEqual([item["display_id"] for item in ledger], [1, 2])
        self.assertEqual(
            [item["local_path"] for item in ledger],
            ["original-media/01.webp", "generated-media/02.webp"],
        )
        self.assertEqual((run_dir / "original-media/01.webp").read_bytes(), b"candidate")
        self.assertEqual(
            (run_dir / "generated-media/02.webp").read_bytes(), b"generated"
        )
        (run_dir / "original-media/candidate.webp").write_bytes(b"changed candidate")
        (run_dir / "generated-media/original.webp").write_bytes(b"changed generated")
        self.assertEqual((run_dir / "original-media/01.webp").read_bytes(), b"candidate")
        self.assertEqual(
            (run_dir / "generated-media/02.webp").read_bytes(), b"generated"
        )
        self.assertIn(PUBLIC_DISCLOSURE, (run_dir / "article.md").read_text())
        self.assertEqual(
            (run_dir / "article.md").read_text(encoding="utf-8"),
            f"{long_article()}\n\n{PUBLIC_DISCLOSURE}\n",
        )
        self.assertEqual(
            result["files"]["media_ledger"], "sources/media-ledger.json"
        )
        self.assertEqual(result["content_mode"], "trend_analysis")
        self.assertEqual(
            json.loads(
                (run_dir / "sources/draft-intent.json").read_text(encoding="utf-8")
            ),
            {"authorized_media_intent": True, "ai_assistance": True},
        )
        self.assertEqual(
            (run_dir / "titles-and-tags.md").read_text(encoding="utf-8"),
            "# 备选标题\n\n1. 备选标题一\n2. 备选标题二\n3. 备选标题三\n\n"
            "# 标签\n\n#标签1# #标签2# #标签3# #标签4# #标签5# #标签6# #标签7# #标签8#\n",
        )
        self.assertEqual(
            (run_dir / "publication-order.md").read_text(encoding="utf-8"),
            "# 发布顺序\n\n1. 封面｜original-media/01.webp｜候选封面图\n"
            "2. 正文图｜generated-media/02.webp｜独立原创配图\n",
        )

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

    def test_rejects_markdown_row_and_tag_injection_in_scalar_fields(self):
        cases = []

        newline_title = valid_payload()
        newline_title["titles"][0] = "安全标题\n4. 注入标题"
        cases.append((newline_title, "titles.*control"))

        delimiter_title = valid_payload()
        delimiter_title["titles"][0] = "标题｜伪造列"
        cases.append((delimiter_title, "titles.*delimiter"))

        injected_tag = valid_payload()
        injected_tag["tags"][0] = "标签# #额外标签"
        cases.append((injected_tag, "tags.*delimiter"))

        injected_caption = valid_payload()
        injected_caption["media"][0]["caption"] = "说明\n2. 伪造顺序"
        cases.append((injected_caption, "caption.*control"))

        delimited_caption = valid_payload()
        delimited_caption["media"][0]["caption"] = "说明｜伪造字段"
        cases.append((delimited_caption, "caption.*delimiter"))

        injected_filename = valid_payload()
        injected_filename["media"][0]["local_path"] = (
            "original-media/candidate.webp\n2. injected.webp"
        )
        cases.append((injected_filename, "local_path.*control"))

        delimited_filename = valid_payload()
        delimited_filename["media"][0]["local_path"] = (
            "original-media/candidate.webp｜2. injected.webp"
        )
        cases.append((delimited_filename, "local_path.*delimiter"))

        injected_role = valid_payload()
        injected_role["media"][0]["role"] = "cover\nbody"
        cases.append((injected_role, "role"))

        injected_author = valid_payload()
        injected_author["media"][0]["source_author"] = "@artist\rforged"
        cases.append((injected_author, "source_author.*control"))

        injected_media_id = valid_payload()
        injected_media_id["media"][0]["source_media_id"] = "media-123\x00forged"
        cases.append((injected_media_id, "source_media_id.*control"))

        for index, (payload, message) in enumerate(cases):
            with self.subTest(message=message):
                run_dir = self.create_run_with_local_media(f"scalar-injection-{index}")
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_reserves_builder_disclosure_across_every_public_input(self):
        cases = []

        article = valid_payload()
        article["article"] += PUBLIC_DISCLOSURE
        cases.append(article)

        title = valid_payload()
        title["titles"][0] = PUBLIC_DISCLOSURE
        cases.append(title)

        tag = valid_payload()
        tag["tags"][0] = PUBLIC_DISCLOSURE
        cases.append(tag)

        caption = valid_payload()
        caption["media"][0]["caption"] = PUBLIC_DISCLOSURE
        cases.append(caption)

        filename = valid_payload()
        filename["media"][0]["local_path"] = (
            f"original-media/{PUBLIC_DISCLOSURE}.webp"
        )
        cases.append(filename)

        for index, payload in enumerate(cases):
            with self.subTest(index=index):
                run_dir = self.create_run_with_local_media(f"disclosure-input-{index}")
                with self.assertRaisesRegex(ValueError, "reserved disclosure"):
                    build_draft(run_dir, payload)
                self.assertFalse((run_dir / "article.md").exists())

    def test_rejects_private_paths_after_unicode_punctuation_and_backticks(self):
        private_values = (
            "说明：`/Users/reviewer/authorization/evidence.png`",
            "说明（/home/reviewer/private/evidence.png）",
            "证据—file:///private/tmp/authorization.txt",
            "记录：C:\\Users\\reviewer\\secret.txt",
            "记录：【\\\\server\\share\\authorization.txt】",
            "缓存…/tmp/review/evidence.json",
            "构建产物：`/srv/project/build.json`",
        )
        for index, value in enumerate(private_values):
            with self.subTest(value=value):
                run_dir = self.create_run_with_local_media(f"private-path-{index}")
                payload = valid_payload()
                payload["media"][1]["caption"] = value
                with self.assertRaisesRegex(ValueError, "private path"):
                    build_draft(run_dir, payload)

        run_dir = self.create_run_with_local_media("ordinary-slashes")
        payload = valid_payload()
        payload["media"][1]["caption"] = "普通斜杠表达：A/B 与角色/关系"
        build_draft(run_dir, payload)

    def test_url_followed_by_unicode_prose_cannot_swallow_private_path(self):
        cases = (
            "来源：https://x.com/artist/status/1，证据：/Users/reviewer/evidence.png",
            "来源：“https://x.com/artist/status/1”；证据：C:\\Users\\reviewer\\evidence.png",
            "来源：『https://x.com/artist/status/1』；证据：file:///private/evidence.txt",
        )
        for index, caption in enumerate(cases):
            with self.subTest(caption=caption):
                run_dir = self.create_run_with_local_media(f"url-boundary-{index}")
                payload = valid_payload()
                payload["media"][1]["caption"] = caption
                with self.assertRaisesRegex(ValueError, "private path"):
                    build_draft(run_dir, payload)
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_http_context_never_exempts_private_path_markers(self):
        cases = (
            "来源：https://x.com/artist/status/1—证据：/Users/reviewer/evidence.png",
            "来源：https://x.com/artist/status/1…证据：/home/reviewer/evidence.png",
            "来源：https://x.com/artist/status/1, evidence: /private/evidence.txt",
            "来源：https://x.com/artist/status/1; evidence: /tmp/evidence.txt",
            "来源：【https://x.com/artist/status/1】证据：/Users/reviewer/evidence.png",
            "来源：https://x.com/artist/private/evidence.png",
            "来源：https://x.com/artist/Users/reviewer/evidence.png",
            "来源：https://x.com/redirect/file:///private/evidence.txt",
            "来源：https://x.com/redirect/C:\\Users\\reviewer\\evidence.txt",
            "来源：https://x.com/redirect/\\\\server\\share\\evidence.txt",
        )
        for index, caption in enumerate(cases):
            with self.subTest(caption=caption):
                run_dir = self.create_run_with_local_media(f"http-private-{index}")
                payload = valid_payload()
                payload["media"][1]["caption"] = caption
                with self.assertRaisesRegex(ValueError, "private path"):
                    build_draft(run_dir, payload)
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_legitimate_x_url_fields_and_url_only_caption_remain_allowed(self):
        run_dir = self.create_run_with_local_media("valid-x-url")
        payload = valid_payload()
        payload["media"][0]["source_url"] = "https://x.com/artist/status/1"
        payload["media"][1]["caption"] = "来源：https://x.com/artist/status/1"

        result = build_draft(run_dir, payload)

        self.assertEqual(result["state"], "authorization_review")
        ledger = json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )
        self.assertEqual(ledger[0]["source_url"], "https://x.com/artist/status/1")

    def test_private_path_checks_cover_article_titles_tags_and_captions(self):
        cases = []
        article = valid_payload()
        article["article"] += " 证据：`/Users/reviewer/evidence.txt`"
        cases.append(article)
        title = valid_payload()
        title["titles"][0] = "标题（/home/reviewer/evidence.txt）"
        cases.append(title)
        tag = valid_payload()
        tag["tags"][0] = "/tmp/private-tag"
        cases.append(tag)
        caption = valid_payload()
        caption["media"][0]["caption"] = "证据 file:///private/evidence.txt"
        cases.append(caption)

        for index, payload in enumerate(cases):
            with self.subTest(index=index):
                run_dir = self.create_run_with_local_media(f"public-path-{index}")
                with self.assertRaisesRegex(ValueError, "private path"):
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

        windows = valid_payload()
        windows["media"][0]["local_path"] = "C:\\private\\candidate.webp"
        cases.append((windows, "stay inside"))

        unc = valid_payload()
        unc["media"][0]["local_path"] = "\\\\server\\share\\candidate.webp"
        cases.append((unc, "stay inside"))

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

        outside = Path(self.temporary.name) / "outside.webp"
        outside.write_bytes(b"outside")
        (run_dir / "original-media/link.webp").symlink_to(outside)
        payload = valid_payload()
        payload["media"][0]["local_path"] = "original-media/link.webp"
        with self.assertRaisesRegex(ValueError, "stay inside"):
            build_draft(run_dir, payload)

    def test_rejects_symlinked_fixed_output_parents(self):
        for index, parent_name in enumerate(("sources", "original-media", "generated-media")):
            with self.subTest(parent_name=parent_name):
                run_dir = self.create_run_with_local_media(f"parent-link-{index}")
                parent = run_dir / parent_name
                for child in tuple(parent.iterdir()):
                    child.unlink()
                parent.rmdir()
                escape = Path(self.temporary.name) / f"escape-{index}"
                escape.mkdir()
                parent.symlink_to(escape, target_is_directory=True)
                payload = valid_payload()
                if parent_name == "original-media":
                    (escape / "candidate.webp").write_bytes(b"candidate")
                if parent_name == "generated-media":
                    (escape / "original.webp").write_bytes(b"generated")
                with self.assertRaisesRegex(ValueError, "output parent.*symlink"):
                    build_draft(run_dir, payload)
                self.assertEqual(load_state(run_dir)["state"], "researching")

    def test_rejects_symlinked_fixed_output_target_and_run_directory(self):
        run_dir = self.create_run_with_local_media("target-link")
        outside = Path(self.temporary.name) / "outside-article.md"
        outside.write_text("outside", encoding="utf-8")
        (run_dir / "article.md").symlink_to(outside)
        with self.assertRaisesRegex(ValueError, "output target.*symlink"):
            build_draft(run_dir, valid_payload())
        self.assertEqual(outside.read_text(encoding="utf-8"), "outside")

        linked_run = Path(self.temporary.name) / "linked-run"
        linked_run.symlink_to(run_dir, target_is_directory=True)
        with self.assertRaisesRegex(ValueError, "run directory.*symlink"):
            build_draft(linked_run, valid_payload())

    def test_validates_x_provenance_and_generated_lineage(self):
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

        empty_lineage = valid_payload()
        empty_lineage["media"][1]["generation_lineage"] = {}
        cases.append((empty_lineage, "generation_lineage"))

        unknown_lineage = valid_payload()
        unknown_lineage["media"][1]["generation_lineage"]["model"] = "extra"
        cases.append((unknown_lineage, "unknown generation_lineage"))

        duplicate_sources = valid_payload()
        duplicate_sources["media"][1]["generation_lineage"]["source_media_ids"] = [
            "source-1",
            "source-1",
        ]
        cases.append((duplicate_sources, "unique"))

        generated_with_source = valid_payload()
        generated_with_source["media"][1]["generation_lineage"][
            "source_media_ids"
        ] = ["source-1"]
        cases.append((generated_with_source, "generated_original.*empty"))

        non_finite = valid_payload()
        non_finite["media"][1]["generation_lineage"]["generator"] = float("nan")
        cases.append((non_finite, "generator.*non-empty string"))

        non_json = valid_payload()
        non_json["media"][1]["generation_lineage"]["prompt"] = {"set-value"}
        cases.append((non_json, "prompt.*non-empty string"))

        non_string_source = valid_payload()
        non_string_source["media"][1]["generation_lineage"][
            "source_media_ids"
        ] = [1]
        cases.append((non_string_source, "list of strings"))

        for index, (payload, message) in enumerate(cases):
            with self.subTest(message=message):
                run_dir = self.create_run_with_local_media(f"lineage-case-{index}")
                with self.assertRaisesRegex(ValueError, message):
                    build_draft(run_dir, payload)

    def test_ai_adaptation_requires_non_empty_generation_sources(self):
        run_dir = self.create_run_with_local_media()
        payload = valid_payload()
        payload["media"][1] = {
            "kind": "ai_adaptation",
            "role": "body",
            "local_path": "generated-media/original.webp",
            "caption": "AI改编配图",
            "source_url": "https://x.com/artist/status/456",
            "source_author": "@artist",
            "source_media_id": "media-456",
            "generation_lineage": {
                "generator": "test-image-model",
                "prompt": "adapt the authorized source",
                "source_media_ids": [],
            },
        }
        with self.assertRaisesRegex(ValueError, "ai_adaptation.*non-empty"):
            build_draft(run_dir, payload)

        payload["media"][1]["generation_lineage"]["source_media_ids"] = [
            "media-456"
        ]
        result = build_draft(run_dir, payload)
        self.assertEqual(result["state"], "authorization_review")
        ledger = json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )
        self.assertEqual(ledger[1]["review_status"], "pending")
        self.assertEqual(ledger[1]["local_path"], "generated-media/02.webp")

    def test_media_already_at_canonical_targets_is_preserved_safely(self):
        run_dir = self.create_run_with_local_media("canonical-inputs")
        (run_dir / "original-media/01.webp").write_bytes(b"canonical candidate")
        (run_dir / "generated-media/02.webp").write_bytes(b"canonical generated")
        payload = valid_payload()
        payload["media"][0]["local_path"] = "original-media/01.webp"
        payload["media"][1]["local_path"] = "generated-media/02.webp"

        build_draft(run_dir, payload)

        self.assertEqual(
            (run_dir / "original-media/01.webp").read_bytes(), b"canonical candidate"
        )
        self.assertEqual(
            (run_dir / "generated-media/02.webp").read_bytes(), b"canonical generated"
        )

    def test_media_copy_uses_safe_fallback_for_untrusted_suffix(self):
        run_dir = self.create_run_with_local_media("unsafe-suffix")
        (run_dir / "original-media/candidate.wéb").write_bytes(b"unsafe suffix")
        payload = valid_payload()
        payload["media"][0]["local_path"] = "original-media/candidate.wéb"

        build_draft(run_dir, payload)

        ledger = json.loads(
            (run_dir / "sources/media-ledger.json").read_text(encoding="utf-8")
        )
        self.assertEqual(ledger[0]["local_path"], "original-media/01.bin")
        self.assertEqual((run_dir / "original-media/01.bin").read_bytes(), b"unsafe suffix")

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

    def test_72_hour_selection_persists_compatible_expansion_evidence(self):
        run_dir = self.create_run_with_local_media("expanded-topic", hours=72)
        selection = json.loads(
            (run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")
        )
        selection["window_expansion"] = {
            "from": 24,
            "to": 72,
            "insufficient_24h": True,
            "checked_at": "2026-08-11T08:00:00+08:00",
            "reason": "insufficient_cross_platform_sources",
            "counts": {
                "x_sources": 2,
                "lofter_sources": 0,
                "candidates": 1,
                "eligible_candidates": 1,
            },
        }
        write_json_atomic(run_dir / "hotspot-analysis.json", selection)
        result = build_draft(run_dir, valid_payload())
        self.assertEqual(result["state"], "authorization_review")
        self.assertEqual(result["time_window_hours"], 72)
        self.assertEqual(
            result["window_expansion"],
            {
                "from": 24,
                "to": 72,
                "insufficient_24h": True,
                "checked_at": "2026-08-11T08:00:00+08:00",
                "reason": "insufficient_cross_platform_sources",
                "counts": {
                    "x_sources": 2,
                    "lofter_sources": 0,
                    "candidates": 1,
                    "eligible_candidates": 1,
                },
            },
        )

    def test_168_hour_selection_validates_and_persists_full_expansion_chain(self):
        run_dir = self.create_run_with_local_media("seven-day-topic", hours=168)
        selection = json.loads(
            (run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")
        )
        counts = {
            "x_sources": 2, "lofter_sources": 0,
            "candidates": 1, "eligible_candidates": 1,
        }
        selection["window_expansion"] = {
            "from": 24,
            "to": 168,
            "steps": [
                {
                    "from": 24, "to": 72, "insufficient_24h": True,
                    "checked_at": "2026-08-11T08:00:00+08:00",
                    "reason": "insufficient_cross_platform_sources", "counts": counts,
                },
                {
                    "from": 72, "to": 168, "insufficient_72h": True,
                    "checked_at": "2026-08-11T08:00:00+08:00",
                    "reason": "insufficient_cross_platform_sources", "counts": counts,
                },
            ],
        }
        write_json_atomic(run_dir / "hotspot-analysis.json", selection)

        result = build_draft(run_dir, valid_payload())

        self.assertEqual(result["time_window_hours"], 168)
        self.assertEqual(len(result["window_expansion"]["steps"]), 2)

    def test_72_hour_selection_rejects_missing_selector_expansion_evidence(self):
        run_dir = self.create_run_with_local_media("missing-expansion", hours=72)

        with self.assertRaisesRegex(ValueError, "window expansion"):
            build_draft(run_dir, valid_payload())

    def test_rejects_untrusted_unknown_fields(self):
        run_dir = self.create_run_with_local_media()
        payload = valid_payload()
        payload["authorization_evidence"] = "/private/evidence.txt"
        with self.assertRaisesRegex(ValueError, "unknown draft field"):
            build_draft(run_dir, payload)

        payload = valid_payload()
        del payload["titles"]
        with self.assertRaisesRegex(ValueError, "missing field: titles"):
            build_draft(run_dir, payload)

        payload = valid_payload()
        payload["media"][0]["evidence_path"] = "/private/evidence.txt"
        with self.assertRaisesRegex(ValueError, "unknown media field: evidence_path"):
            build_draft(run_dir, payload)

        payload = valid_payload()
        del payload["media"][0]["source_media_id"]
        with self.assertRaisesRegex(ValueError, "missing field: source_media_id"):
            build_draft(run_dir, payload)

    def test_artifact_install_failures_restore_preexisting_set_and_state(self):
        for failure_index in range(1, 8):
            with self.subTest(failure_index=failure_index):
                run_dir = self.create_run_with_local_media(f"install-fail-{failure_index}")
                originals = self.seed_existing_targets(run_dir)
                original_status = (run_dir / "status.json").read_bytes()
                real_install = getattr(
                    draft_module,
                    "_install_staged_file",
                    lambda staged, target: staged.replace(target),
                )
                calls = 0

                def fail_one_install(staged, target):
                    nonlocal calls
                    calls += 1
                    if calls == failure_index:
                        raise OSError(f"injected install failure {failure_index}")
                    return real_install(staged, target)

                with mock.patch.object(
                    draft_module,
                    "_install_staged_file",
                    side_effect=fail_one_install,
                    create=True,
                ):
                    with self.assertRaisesRegex(OSError, "injected install failure"):
                        build_draft(run_dir, valid_payload())

                self.assertEqual(calls, failure_index)
                self.assertEqual((run_dir / "status.json").read_bytes(), original_status)
                for path, content in originals.items():
                    self.assertEqual(path.read_bytes(), content, path)
                self.assertFalse(tuple(run_dir.glob(".draft-stage-*")))
                self.assertEqual(load_state(run_dir)["state"], "researching")

                result = build_draft(run_dir, valid_payload())
                self.assertEqual(result["state"], "authorization_review")

    def test_transition_failures_restore_artifacts_status_and_allow_retry(self):
        for failure_index in (1, 2):
            with self.subTest(failure_index=failure_index):
                run_dir = self.create_run_with_local_media(
                    f"transition-fail-{failure_index}"
                )
                originals = self.seed_existing_targets(run_dir)
                original_status = (run_dir / "status.json").read_bytes()
                real_transition = draft_module.transition
                calls = 0

                def fail_one_transition(*args, **kwargs):
                    nonlocal calls
                    calls += 1
                    if calls == failure_index:
                        raise OSError(f"injected transition failure {failure_index}")
                    return real_transition(*args, **kwargs)

                with mock.patch.object(
                    draft_module,
                    "transition",
                    side_effect=fail_one_transition,
                ):
                    with self.assertRaisesRegex(OSError, "injected transition failure"):
                        build_draft(run_dir, valid_payload())

                self.assertEqual(calls, failure_index)
                self.assertEqual((run_dir / "status.json").read_bytes(), original_status)
                for path, content in originals.items():
                    self.assertEqual(path.read_bytes(), content, path)
                self.assertFalse(tuple(run_dir.glob(".draft-stage-*")))
                self.assertEqual(load_state(run_dir)["state"], "researching")

                result = build_draft(run_dir, valid_payload())
                self.assertEqual(result["state"], "authorization_review")

    def test_transition_failure_removes_every_new_artifact_and_media_copy(self):
        run_dir = self.create_run_with_local_media("new-output-rollback")
        real_transition = draft_module.transition

        with mock.patch.object(
            draft_module,
            "transition",
            side_effect=OSError("injected first transition failure"),
        ):
            with self.assertRaisesRegex(OSError, "injected first transition failure"):
                build_draft(run_dir, valid_payload())

        for relative_path in (
            "article.md",
            "titles-and-tags.md",
            "publication-order.md",
            "sources/media-ledger.json",
            "sources/draft-intent.json",
            "original-media/01.webp",
            "generated-media/02.webp",
        ):
            self.assertFalse((run_dir / relative_path).exists(), relative_path)
        self.assertEqual(load_state(run_dir)["state"], "researching")
        self.assertFalse(tuple(run_dir.glob(".draft-stage-*")))

        with mock.patch.object(draft_module, "transition", wraps=real_transition):
            result = build_draft(run_dir, valid_payload())
        self.assertEqual(result["state"], "authorization_review")


if __name__ == "__main__":
    unittest.main()

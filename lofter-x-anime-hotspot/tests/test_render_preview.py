import sys
import json
import tempfile
import unittest
from datetime import datetime
from pathlib import Path


SCRIPTS = Path(__file__).resolve().parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))

from build_publishable_draft import build_draft
from run_state import create_run, write_json_atomic
from render_preview import build_preview_html, render_preview


FIXED_NOW = datetime(2026, 8, 11, 14, 30)


def prepared_review_run(root: Path) -> Path:
    run_dir, _ = create_run(root / "runs", "preview-topic", FIXED_NOW)
    (run_dir / "original-media/candidate.webp").write_bytes(b"candidate")
    (run_dir / "generated-media/original.webp").write_bytes(b"generated")
    write_json_atomic(
        run_dir / "hotspot-analysis.json",
        {
            "time_window_hours": 24,
            "candidate": {"id": "preview-topic", "title": "入选热点", "eligible": True},
            "content_mode": "trend_analysis",
            "selection_reason": "24小时窗口内综合评分最高：91/100",
        },
    )
    build_draft(
        run_dir,
        {
            "article": "这是用于验证本地预览内容结构的原创中文正文。" * 50,
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


class RenderPreviewTest(unittest.TestCase):
    def test_renders_168_hour_analysis(self):
        html = build_preview_html(
            {"state": "authorization_review", "topic": "seven-day-topic"},
            {
                "time_window_hours": 168,
                "candidate": {"title": "七天热点"},
                "content_mode": "trend_analysis",
                "selection_reason": "七天窗口内综合评分最高",
                "x_sources": [],
                "lofter_sources": [],
            },
            "正文",
            "标题与标签",
            "发布顺序",
            [
                {
                    "kind": "generated_original",
                    "role": "cover",
                    "local_path": "generated-media/cover.webp",
                    "caption": "封面",
                    "display_id": 1,
                }
            ],
        )

        self.assertIn('&quot;time_window_hours&quot;: 168', html)

    def test_preview_renders_cover_before_article_and_body_media_afterward(self):
        cover_path = "original-media/cover.webp"
        body_path = "generated-media/body.webp"
        article_marker = "封面和正文配图之间的唯一正文句子。"

        html = build_preview_html(
            {"state": "authorization_review", "topic": "图片优先预览"},
            {
                "time_window_hours": 24,
                "candidate": {"title": "图片优先预览"},
                "content_mode": "trend_analysis",
                "selection_reason": "测试图片优先顺序",
            },
            article_marker,
            "标题与标签",
            "发布顺序",
            [
                {
                    "kind": "x_original",
                    "role": "cover",
                    "local_path": cover_path,
                    "caption": "封面",
                    "display_id": 1,
                },
                {
                    "kind": "generated_original",
                    "role": "body",
                    "local_path": body_path,
                    "caption": "正文配图",
                    "display_id": 2,
                },
            ],
        )

        self.assertLess(html.index(cover_path), html.index(article_marker))
        self.assertLess(html.index(article_marker), html.index(body_path))
        self.assertLess(html.index(cover_path), html.index("等待授权复核，尚不可发布"))
        self.assertLess(html.index(cover_path), html.index("测试图片优先顺序"))

    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)

    def test_preview_contains_article_titles_tags_media_and_review_warning(self):
        run_dir = prepared_review_run(Path(self.temporary.name))

        path = render_preview(run_dir)

        html = path.read_text(encoding="utf-8")
        self.assertIn("等待授权复核，尚不可发布", html)
        self.assertIn("候选标题", html)
        self.assertIn("X原图", html)
        self.assertIn("第1张", html)
        self.assertIn("热点依据", html)

    def test_preview_is_local_and_does_not_leak_evidence(self):
        run_dir = prepared_review_run(Path(self.temporary.name))
        analysis_path = run_dir / "hotspot-analysis.json"
        analysis = json.loads(analysis_path.read_text(encoding="utf-8"))
        analysis.update(
            {
                "x_sources": [
                    {
                        "source_url": "https://x.com/artist/status/123",
                        "published_at": "2026-08-11T07:00:00+08:00",
                        "evidence_summary": "公开可复核的X讨论摘要",
                        "local_path": "/private/tmp/raw.webp",
                        "sha256": "a" * 64,
                    }
                ],
                "lofter_sources": [
                    {
                        "source_url": "https://example.lofter.com/post/abc",
                        "published_at": "2026-08-11T06:00:00+08:00",
                        "evidence_summary": "公开可复核的LOFTER讨论摘要",
                    }
                ],
                "private_source_ledger": {
                    "evidence_path": "/Users/reviewer/evidence.txt",
                    "authorization_binding": {"ledger_sha256": "b" * 64},
                },
            }
        )
        analysis_path.write_text(json.dumps(analysis, ensure_ascii=False), encoding="utf-8")

        html = render_preview(run_dir).read_text(encoding="utf-8")

        self.assertNotIn("<script", html.lower())
        self.assertNotIn("<form", html.lower())
        self.assertNotIn("evidence_path", html)
        self.assertNotIn("authorization-evidence", html)
        self.assertNotIn("private_source_ledger", html)
        self.assertNotIn("local_path", html)
        self.assertNotIn("sha256", html)
        self.assertNotIn("/Users/", html)
        self.assertIn("https://x.com/artist/status/123", html)
        self.assertIn("公开可复核的LOFTER讨论摘要", html)

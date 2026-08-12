import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from select_publishable_topic import select_topic


IP_POOL = [
    {"ip_id": "long-1", "ip_name": "长线一", "ip_slot": "long_term"},
    {"ip_id": "long-2", "ip_name": "长线二", "ip_slot": "long_term"},
    {"ip_id": "rise-1", "ip_name": "上升一", "ip_slot": "rising"},
    {"ip_id": "rise-2", "ip_name": "上升二", "ip_slot": "rising"},
    {"ip_id": "exp-1", "ip_name": "实验一", "ip_slot": "experiment"},
]


def candidate(candidate_id="high-score", **overrides):
    value = {
        "id": candidate_id,
        "title": f"选题 {candidate_id}",
        "ip_id": "rise-1",
        "ip_name": "上升一",
        "ip_slot": "rising",
        "characters": ["角色A", "角色B"],
        "tags": ["上升一", "角色A"],
        "x_growth": 26,
        "lofter_activity": 24,
        "ip_match": 15,
        "authorization": 10,
        "story_potential": 8,
        "x_evidence": "近24小时相关创作增长",
        "lofter_evidence": "对应标签出现有效讨论",
        "x_source_urls": ["https://x.com/example/status/1"],
        "observed_at": "2026-08-10T08:00:00+08:00",
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
    value.update(overrides)
    return value


def fixture_payload():
    def source(url, published_at, summary):
        return {
            "source_url": url,
            "published_at": published_at,
            "evidence_summary": summary,
        }

    return {
        "ip_pool": IP_POOL,
        "windows": {
            "24": {
                "checked_at": "2026-08-11T08:00:00+08:00",
                "x_sources": [
                    source("https://x.com/example/status/1", "2026-08-10T12:00:00+08:00", "X讨论增长"),
                    source("https://x.com/example/status/2", "2026-08-10T13:00:00+08:00", "第二个独立X来源"),
                ],
                "lofter_sources": [
                    source("https://example.lofter.com/post/1", "2026-08-10T14:00:00+08:00", "LOFTER标签讨论")
                ],
                "candidates": [candidate()],
            },
            "72": {
                "checked_at": "2026-08-11T08:00:00+08:00",
                "x_sources": [
                    source("https://x.com/example/status/3", "2026-08-09T12:00:00+08:00", "72小时X来源一"),
                    source("https://x.com/example/status/4", "2026-08-09T13:00:00+08:00", "72小时X来源二"),
                ],
                "lofter_sources": [
                    source("https://example.lofter.com/post/2", "2026-08-09T14:00:00+08:00", "72小时LOFTER来源")
                ],
                "candidates": [candidate("fallback")],
            },
        },
    }


def add_168_window(payload):
    payload["windows"]["168"] = {
        "checked_at": "2026-08-11T08:00:00+08:00",
        "x_sources": [
            {
                "source_url": "https://x.com/example/status/5",
                "published_at": "2026-08-05T12:00:00+08:00",
                "evidence_summary": "168小时X来源一",
            },
            {
                "source_url": "https://x.com/example/status/6",
                "published_at": "2026-08-05T13:00:00+08:00",
                "evidence_summary": "168小时X来源二",
            },
        ],
        "lofter_sources": [
            {
                "source_url": "https://example.lofter.com/post/3",
                "published_at": "2026-08-05T14:00:00+08:00",
                "evidence_summary": "168小时LOFTER来源",
            }
        ],
        "candidates": [candidate("seven-day-fallback")],
    }


class SelectPublishableTopicTest(unittest.TestCase):
    def test_uses_24_hours_when_sources_and_candidates_are_sufficient(self):
        payload = fixture_payload()
        result = select_topic(payload)
        self.assertEqual(result["time_window_hours"], 24)
        self.assertEqual(result["candidate"]["id"], "high-score")

    def test_expands_to_72_hours_when_24_hours_are_insufficient(self):
        payload = fixture_payload()
        payload["windows"]["24"]["lofter_sources"] = []
        result = select_topic(payload)
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

    def test_72_hour_selection_requires_a_checked_24_hour_window(self):
        payload = fixture_payload()
        del payload["windows"]["24"]

        with self.assertRaisesRegex(ValueError, "24-hour window is required"):
            select_topic(payload)

    def test_expands_to_168_only_after_24_and_72_are_insufficient(self):
        payload = fixture_payload()
        payload["windows"]["24"]["lofter_sources"] = []
        payload["windows"]["72"]["lofter_sources"] = []
        add_168_window(payload)

        result = select_topic(payload)

        self.assertEqual(result["time_window_hours"], 168)
        self.assertEqual(result["candidate"]["id"], "seven-day-fallback")
        self.assertEqual(
            [(step["from"], step["to"]) for step in result["window_expansion"]["steps"]],
            [(24, 72), (72, 168)],
        )
        self.assertIs(result["window_expansion"]["steps"][1]["insufficient_72h"], True)

    def test_does_not_consider_168_when_72_is_sufficient(self):
        payload = fixture_payload()
        payload["windows"]["24"]["lofter_sources"] = []
        add_168_window(payload)

        self.assertEqual(select_topic(payload)["time_window_hours"], 72)

    def test_24_hour_selection_does_not_require_a_72_hour_window(self):
        payload = fixture_payload()
        del payload["windows"]["72"]

        self.assertEqual(select_topic(payload)["time_window_hours"], 24)

    def test_sources_require_strict_distinct_platform_urls_and_in_window_timestamps(self):
        mutations = {
            "string-source": lambda window: window["x_sources"].__setitem__(0, "https://x.com/example/status/1"),
            "unknown-field": lambda window: window["x_sources"][0].update({"sha256": "0" * 64}),
            "wrong-x-host": lambda window: window["x_sources"][0].update({"source_url": "https://example.com/post/1"}),
            "wrong-lofter-host": lambda window: window["lofter_sources"][0].update({"source_url": "https://example.com/post/1"}),
            "duplicate": lambda window: window["x_sources"].__setitem__(1, dict(window["x_sources"][0])),
            "outside-window": lambda window: window["x_sources"][0].update({"published_at": "2026-08-09T07:59:59+08:00"}),
            "future": lambda window: window["x_sources"][0].update({"published_at": "2026-08-11T08:00:01+08:00"}),
            "naive-time": lambda window: window["x_sources"][0].update({"published_at": "2026-08-10T12:00:00"}),
        }
        for name, mutate in mutations.items():
            with self.subTest(name=name):
                payload = fixture_payload()
                mutate(payload["windows"]["24"])
                with self.assertRaisesRegex(ValueError, "source|timestamp|URL"):
                    select_topic(payload)

    def test_refuses_to_draft_without_two_platforms_and_eligible_topic(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"] = []
        payload["windows"]["72"]["candidates"] = []
        with self.assertRaisesRegex(ValueError, "no publishable topic"):
            select_topic(payload)

    def test_mode_is_derived_from_evidence_features(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"][0]["topic_features"] = {
            "event_signal": False,
            "relationship_signal": True,
            "visual_signal": False,
        }
        self.assertEqual(select_topic(payload)["content_mode"], "fanfic")


if __name__ == "__main__":
    unittest.main()

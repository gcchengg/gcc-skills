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
    return {
        "ip_pool": IP_POOL,
        "windows": {
            "24": {
                "x_sources": ["https://x.com/example/status/1", "https://x.com/example/status/2"],
                "lofter_sources": ["https://example.lofter.com/post/1"],
                "candidates": [candidate()],
            },
            "72": {
                "x_sources": ["https://x.com/example/status/3", "https://x.com/example/status/4"],
                "lofter_sources": ["https://example.lofter.com/post/2"],
                "candidates": [candidate("fallback")],
            },
        },
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

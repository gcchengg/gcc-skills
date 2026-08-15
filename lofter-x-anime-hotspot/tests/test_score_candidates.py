import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from score_candidates import (
    PUBLICATION_THRESHOLD,
    rank_candidates,
    score_candidate,
    validate_ip_pool,
)


IP_POOL = [
    {"ip_id": "long-1", "ip_name": "长线一", "ip_slot": "long_term"},
    {"ip_id": "long-2", "ip_name": "长线二", "ip_slot": "long_term"},
    {"ip_id": "rise-1", "ip_name": "上升一", "ip_slot": "rising"},
    {"ip_id": "rise-2", "ip_name": "上升二", "ip_slot": "rising"},
    {"ip_id": "exp-1", "ip_name": "实验一", "ip_slot": "experiment"},
]


def candidate(candidate_id="topic-1", **overrides):
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


class IpPoolTest(unittest.TestCase):
    def test_accepts_exactly_five_unique_ip_entries(self):
        indexed = validate_ip_pool(IP_POOL)
        self.assertEqual(set(indexed), {item["ip_id"] for item in IP_POOL})

    def test_rejects_wrong_slot_counts(self):
        wrong = [*IP_POOL[:-1], {"ip_id": "rise-3", "ip_name": "上升三", "ip_slot": "rising"}]
        with self.assertRaisesRegex(ValueError, "experiment must contain exactly 1 IP"):
            validate_ip_pool(wrong)

    def test_rejects_duplicate_ip_ids(self):
        duplicate = [dict(item) for item in IP_POOL]
        duplicate[-1]["ip_id"] = "long-1"
        with self.assertRaisesRegex(ValueError, "duplicate ip_id: long-1"):
            validate_ip_pool(duplicate)

    def test_rejects_duplicate_ip_names(self):
        duplicate = [dict(item) for item in IP_POOL]
        duplicate[-1]["ip_name"] = "长线一"
        with self.assertRaisesRegex(ValueError, "duplicate ip_name: 长线一"):
            validate_ip_pool(duplicate)


class ScoreCandidatesTest(unittest.TestCase):
    def test_weighted_total_uses_one_constant_threshold(self):
        self.assertEqual(PUBLICATION_THRESHOLD, 70)
        result = score_candidate(candidate(), IP_POOL)
        self.assertEqual(result["total_score"], 83)
        self.assertTrue(result["eligible"])

    def test_candidate_must_reference_matching_pool_entry(self):
        cases = (
            (candidate(ip_id="missing"), "unknown ip_id: missing"),
            (candidate(ip_name="伪造名称"), "ip_name does not match IP pool"),
            (candidate(ip_slot="long_term"), "ip_slot does not match IP pool"),
        )
        for value, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    score_candidate(value, IP_POOL)

    def test_rank_returns_every_eligible_topic_without_slot_quotas(self):
        topics = [
            candidate(f"topic-{number}", story_potential=number)
            for number in range(1, 8)
        ]
        ranked = rank_candidates(topics, IP_POOL)
        self.assertEqual(len(ranked), 7)
        self.assertEqual(ranked[0]["id"], "topic-7")

    def test_rank_does_not_require_eligible_topics_in_every_pool_category(self):
        ranked = rank_candidates([candidate("only-rising")], IP_POOL)
        self.assertEqual([item["id"] for item in ranked], ["only-rising"])

    def test_rank_filters_below_70_and_keeps_70(self):
        at_threshold = candidate(
            "at-70",
            x_growth=20,
            lofter_activity=20,
            ip_match=10,
            authorization=10,
            story_potential=10,
        )
        below = candidate(
            "below-70",
            x_growth=20,
            lofter_activity=20,
            ip_match=10,
            authorization=10,
            story_potential=9,
        )
        ranked = rank_candidates([below, at_threshold], IP_POOL)
        self.assertEqual([item["id"] for item in ranked], ["at-70"])

    def test_rejects_invalid_shared_candidate_fields(self):
        cases = (
            (candidate(title=""), "title must be a non-empty string"),
            (candidate(characters=[]), "characters must contain at least one"),
            (candidate(characters=["角色A", ""]), "characters must contain non-empty strings"),
            (candidate(tags="角色A"), "tags must be a list"),
            (candidate(x_evidence=None), "x_evidence must be a non-empty string"),
            (candidate(x_source_urls=[]), "x_source_urls must contain at least one"),
            (candidate(x_source_urls=["http://x.com/example/status/1"]), "HTTPS X URL"),
            (candidate(observed_at="yesterday"), "observed_at must be ISO-8601"),
            (candidate(commercial_intent="false"), "commercial_intent must be a boolean"),
            (candidate(x_growth=True), "x_growth must be an integer"),
        )
        for value, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    score_candidate(value, IP_POOL)

    def test_rejects_inconsistent_media_intent(self):
        cases = (
            (
                candidate(asset_id="asset-1"),
                "independent media must use a null asset_id",
            ),
            (
                candidate(requested_usage="original", image_provenance="authorized_original"),
                "authorized media requires a non-empty asset_id",
            ),
            (
                candidate(
                    asset_id="asset-1",
                    requested_usage="original",
                    image_provenance="authorized_ai_adaptation",
                ),
                "original usage requires authorized_original provenance",
            ),
            (
                candidate(
                    asset_id="asset-1",
                    requested_usage="ai_adaptation",
                    image_provenance="authorized_original",
                ),
                "ai_adaptation usage requires authorized_ai_adaptation provenance",
            ),
            (
                candidate(image_provenance="authorized_original"),
                "independent usage requires independent image provenance",
            ),
        )
        for value, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    score_candidate(value, IP_POOL)

    def test_enum_values_require_strings(self):
        cases = (
            (candidate(ip_slot=[]), "ip_slot must be a string"),
            (candidate(requested_usage={}), "requested_usage must be a string"),
            (candidate(image_provenance=[]), "image_provenance must be a string"),
        )
        for value, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    score_candidate(value, IP_POOL)

    def test_requires_strict_topic_feature_signals(self):
        cases = (
            (candidate(topic_features=None), "topic_features must be an object"),
            (
                candidate(
                    topic_features={
                        "event_signal": True,
                        "relationship_signal": False,
                    }
                ),
                "topic_features missing fields: visual_signal",
            ),
            (
                candidate(
                    topic_features={
                        "event_signal": 1,
                        "relationship_signal": False,
                        "visual_signal": False,
                    }
                ),
                "topic_features.event_signal must be a boolean",
            ),
        )
        for value, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, message):
                    score_candidate(value, IP_POOL)


if __name__ == "__main__":
    unittest.main()

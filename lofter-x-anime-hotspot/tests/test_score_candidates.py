import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from score_candidates import rank_candidates, score_candidate


class ScoreCandidatesTest(unittest.TestCase):
    def test_weighted_total_and_eligibility(self):
        candidate = {
            "id": "topic-1",
            "title": "Example CP spike",
            "ip_slot": "rising",
            "x_growth": 26,
            "lofter_activity": 24,
            "ip_match": 15,
            "authorization": 10,
            "story_potential": 8,
        }
        result = score_candidate(candidate)
        self.assertEqual(result["total_score"], 83)
        self.assertTrue(result["eligible"])

    def test_rejects_out_of_range_dimension(self):
        candidate = {
            "id": "bad",
            "title": "Bad score",
            "ip_slot": "experiment",
            "x_growth": 31,
            "lofter_activity": 0,
            "ip_match": 0,
            "authorization": 0,
            "story_potential": 0,
        }
        with self.assertRaisesRegex(ValueError, "x_growth must be between 0 and 30"):
            score_candidate(candidate)

    def test_rank_filters_and_orders(self):
        candidates = [
            {"id": "low", "title": "Low", "ip_slot": "experiment", "x_growth": 20, "lofter_activity": 20, "ip_match": 10, "authorization": 0, "story_potential": 5},
            {"id": "high", "title": "High", "ip_slot": "long_term", "x_growth": 30, "lofter_activity": 28, "ip_match": 15, "authorization": 15, "story_potential": 9},
            {"id": "mid", "title": "Mid", "ip_slot": "rising", "x_growth": 25, "lofter_activity": 23, "ip_match": 15, "authorization": 0, "story_potential": 8},
        ]
        ranked = rank_candidates(candidates)
        self.assertEqual([item["id"] for item in ranked], ["high", "mid"])
        self.assertEqual(ranked[1]["media_instruction"], "create_independent_image")

    def test_rank_limits_each_ip_slot_and_preserves_total_score_order(self):
        def candidate(candidate_id, ip_slot, authorization, story_potential):
            return {
                "id": candidate_id,
                "title": candidate_id,
                "ip_slot": ip_slot,
                "x_growth": 30,
                "lofter_activity": 30,
                "ip_match": 15,
                "authorization": authorization,
                "story_potential": story_potential,
            }

        candidates = [
            candidate("long-1", "long_term", 15, 10),
            candidate("rising-1", "rising", 15, 9),
            candidate("long-2", "long_term", 14, 9),
            candidate("rising-2", "rising", 13, 9),
            candidate("experiment-1", "experiment", 12, 9),
            candidate("long-3", "long_term", 11, 9),
            candidate("rising-3", "rising", 10, 9),
            candidate("experiment-2", "experiment", 9, 9),
        ]

        ranked = rank_candidates(candidates)

        self.assertEqual(
            [item["id"] for item in ranked],
            ["long-1", "rising-1", "long-2", "rising-2", "experiment-1"],
        )


if __name__ == "__main__":
    unittest.main()

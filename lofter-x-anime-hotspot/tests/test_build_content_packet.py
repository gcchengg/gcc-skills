import atexit
import json
import re
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from build_content_packet import build_packet
from score_candidates import score_candidate
from validate_authorizations import validate_authorization, validate_ledger


IP_POOL = [
    {"ip_id": "long-1", "ip_name": "长线一", "ip_slot": "long_term"},
    {"ip_id": "long-2", "ip_name": "长线二", "ip_slot": "long_term"},
    {"ip_id": "rise-1", "ip_name": "上升一", "ip_slot": "rising"},
    {"ip_id": "rise-2", "ip_name": "上升二", "ip_slot": "rising"},
    {"ip_id": "exp-1", "ip_name": "实验一", "ip_slot": "experiment"},
]
TEMPLATES_DIR = Path(__file__).parents[1] / "templates"
_AUTHORIZATION_TEMP = tempfile.TemporaryDirectory()
atexit.register(_AUTHORIZATION_TEMP.cleanup)
_AUTHORIZATION_ROOT = Path(_AUTHORIZATION_TEMP.name)
_AUTHORIZATION_RECORDS = json.loads(
    (TEMPLATES_DIR / "authorizations.example.json").read_text(encoding="utf-8")
)
for _record in _AUTHORIZATION_RECORDS:
    _record["example_only"] = False
    _record["evidence_path"] = str(
        TEMPLATES_DIR / "evidence" / Path(_record["evidence_path"]).name
    )
AUTHORIZATION_LEDGER = _AUTHORIZATION_ROOT / "authorizations.json"
AUTHORIZATION_LEDGER.write_text(
    json.dumps(_AUTHORIZATION_RECORDS, ensure_ascii=False), encoding="utf-8"
)


def raw_candidate(candidate_id="topic-1", **overrides):
    value = {
        "id": candidate_id,
        "title": f"角色纪念日热度上升 {candidate_id}",
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
        "x_evidence": "X近24小时相关创作集中增长",
        "lofter_evidence": "LOFTER标签出现新讨论",
        "x_source_urls": [f"https://x.com/example/status/{candidate_id}"],
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


def ranked_candidate(candidate_id="topic-1", **overrides):
    return score_candidate(raw_candidate(candidate_id, **overrides), IP_POOL)


def authorization_decision(
    asset_id=None, usage="original", commercial=False, **overrides
):
    if asset_id is None:
        asset_id = (
            "example-asset-original-1"
            if usage == "original"
            else "example-asset-adapted-1"
        )
    records = json.loads(AUTHORIZATION_LEDGER.read_text(encoding="utf-8"))
    indexed = validate_ledger(records, evidence_root=TEMPLATES_DIR)
    value = validate_authorization(
        indexed[asset_id], usage, commercial, evidence_root=TEMPLATES_DIR
    )
    value.update(overrides)
    return value


RESEARCH = {
    "world_verified": True,
    "characters_verified": True,
    "relationships_verified": True,
    "cp_conventions_verified": True,
    "fandom_risks_verified": True,
}


def question_lines(packet):
    return [line for line in packet.splitlines() if line.startswith("互动问题：")]


class AuthorizationBindingTest(unittest.TestCase):
    def authorized_candidate(self, **overrides):
        values = {
            "asset_id": "example-asset-original-1",
            "requested_usage": "original",
            "image_provenance": "authorized_original",
        }
        values.update(overrides)
        return ranked_candidate(**values)

    def test_rejects_forged_allowed_dictionary(self):
        payload = {
            "column": "daily_hotspot",
            "ip_pool": IP_POOL,
            "candidate": self.authorized_candidate(),
            "authorization": {"allowed": True},
            "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
        }
        with self.assertRaisesRegex(
            ValueError, "validated authorization output is incomplete"
        ):
            build_packet(payload)

    def test_rejects_asset_usage_and_commercial_mismatches(self):
        cases = (
            ({"asset_id": "other"}, "authorization asset_id does not match candidate"),
            ({"requested_usage": "ai_adaptation"}, "authorization usage does not match candidate"),
            ({"commercial_intent": True}, "authorization commercial scope does not match candidate"),
        )
        for changed, message in cases:
            with self.subTest(message=message):
                decision = authorization_decision()
                decision.update(changed)
                payload = {
                    "column": "daily_hotspot",
                    "ip_pool": IP_POOL,
                    "candidate": self.authorized_candidate(),
                    "authorization": decision,
                    "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
                }
                with self.assertRaisesRegex(ValueError, message):
                    build_packet(payload)

    def test_authorization_score_never_authorizes_media(self):
        payload = {
            "column": "daily_hotspot",
            "ip_pool": IP_POOL,
            "candidate": self.authorized_candidate(authorization=15),
            "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
        }
        with self.assertRaisesRegex(ValueError, "validated authorization is required"):
            build_packet(payload)

    def test_rejects_complete_hand_built_authorization_lookalike(self):
        decision = authorization_decision(
            source_url="https://x.com/forged/status/999"
        )
        payload = {
            "column": "daily_hotspot",
            "ip_pool": IP_POOL,
            "candidate": self.authorized_candidate(),
            "authorization": decision,
            "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
        }
        with self.assertRaisesRegex(
            ValueError, "authorization decision does not match validated ledger"
        ):
            build_packet(payload)

    def test_authorization_enum_fields_require_strings(self):
        for field, value, message in (
            ("requested_usage", [], "authorization requested_usage"),
            ("image_provenance", {}, "authorization image_provenance"),
            ("attribution_mode", [], "authorization attribution_mode"),
            ("requested_operations", [{}], "authorization requested operation"),
        ):
            with self.subTest(field=field):
                decision = authorization_decision()
                decision[field] = value
                payload = {
                    "column": "daily_hotspot",
                    "ip_pool": IP_POOL,
                    "candidate": self.authorized_candidate(),
                    "authorization": decision,
                    "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
                }
                with self.assertRaisesRegex(ValueError, message):
                    build_packet(payload)

    def test_independent_media_rejects_authorization_decision(self):
        payload = {
            "column": "daily_hotspot",
            "ip_pool": IP_POOL,
            "candidate": ranked_candidate(),
            "authorization": authorization_decision(),
        }
        with self.assertRaisesRegex(
            ValueError, "independent media must not include authorization"
        ):
            build_packet(payload)


class DisclosureTest(unittest.TestCase):
    def packet_for(self, provenance, usage="independent"):
        asset_id = None
        authorization = None
        if usage != "independent":
            asset_id = (
                "example-asset-original-1"
                if usage == "original"
                else "example-asset-adapted-1"
            )
            authorization = authorization_decision(asset_id=asset_id, usage=usage)
        candidate = ranked_candidate(
            asset_id=asset_id,
            requested_usage=usage,
            image_provenance=provenance,
        )
        return build_packet(
            {
                "column": "media_curation",
                "ip_pool": IP_POOL,
                "candidate": candidate,
                "authorization": authorization,
                "authorization_ledger_path": str(AUTHORIZATION_LEDGER),
            }
        )

    def test_authorized_original_has_no_ai_label(self):
        packet = self.packet_for("authorized_original", "original")
        self.assertNotIn("#AI辅助#", packet)
        self.assertNotIn("#AI生成#", packet)

    def test_authorized_ai_adaptation_has_exact_label(self):
        packet = self.packet_for("authorized_ai_adaptation", "ai_adaptation")
        self.assertIn("图像经授权使用，含AI辅助创作｜#AI辅助#", packet)

    def test_human_original_has_no_ai_or_authorized_claim(self):
        packet = self.packet_for("human_original")
        self.assertNotIn("#AI", packet)
        self.assertNotIn("图像经授权使用", packet)

    def test_ai_assisted_original_has_independent_label(self):
        packet = self.packet_for("ai_assisted_original")
        self.assertIn("AI披露：#AI辅助#", packet)
        self.assertNotIn("图像经授权使用", packet)

    def test_ai_generated_original_has_independent_label(self):
        packet = self.packet_for("ai_generated_original")
        self.assertIn("AI披露：#AI生成#", packet)
        self.assertNotIn("图像经授权使用", packet)


class ColumnPacketTest(unittest.TestCase):
    def test_daily_hotspot_has_specific_shape_and_one_question(self):
        packet = build_packet(
            {
                "column": "daily_hotspot",
                "ip_pool": IP_POOL,
                "candidate": ranked_candidate(),
                "authorization": None,
            }
        )
        self.assertIn("# 人工审核内容包｜今日热度异动", packet)
        self.assertIn("目标长度：200–400个中文字符", packet)
        self.assertEqual(
            question_lines(packet),
            ["互动问题：你认为这个热点会继续升温，还是只是短期异动？"],
        )
        self.assertNotIn("正文草稿", packet)

    def test_weekly_trend_requires_and_renders_exactly_five_ranked_items(self):
        candidates = [
            ranked_candidate(
                f"weekly-{number}",
                story_potential=10 - number,
                sustainability_note=f"持续性判断 {number}",
            )
            for number in range(5)
        ]
        packet = build_packet(
            {
                "column": "weekly_trend",
                "ip_pool": IP_POOL,
                "candidates": candidates,
                "authorizations": [],
            }
        )
        self.assertEqual(packet.count("X信号："), 5)
        self.assertEqual(packet.count("LOFTER信号："), 5)
        self.assertEqual(packet.count("持续性判断："), 5)
        for candidate in candidates:
            self.assertIn(candidate["title"], packet)
        self.assertEqual(
            question_lines(packet),
            ["互动问题：下周你最希望继续追踪以上哪一个热点？"],
        )

    def test_weekly_trend_rejects_wrong_count_or_missing_sustainability(self):
        five = [
            ranked_candidate(
                f"weekly-{number}",
                story_potential=10 - number,
                sustainability_note=f"持续性判断 {number}",
            )
            for number in range(5)
        ]
        cases = (
            ({"candidates": five[:4]}, "weekly_trend requires exactly five candidates"),
            (
                {"candidates": [{key: value for key, value in five[0].items() if key != "sustainability_note"}, *five[1:]]},
                "weekly candidate sustainability_note must be a non-empty string",
            ),
        )
        for changed, message in cases:
            with self.subTest(message=message):
                payload = {
                    "column": "weekly_trend",
                    "ip_pool": IP_POOL,
                    "authorizations": [],
                    **changed,
                }
                with self.assertRaisesRegex(ValueError, message):
                    build_packet(payload)

    def test_media_curation_has_provenance_and_media_question(self):
        packet = build_packet(
            {
                "column": "media_curation",
                "ip_pool": IP_POOL,
                "candidate": ranked_candidate(image_provenance="ai_assisted_original"),
                "authorization": None,
            }
        )
        self.assertIn("# 人工审核内容包｜媒体策展", packet)
        self.assertIn("媒体来源：独立创作", packet)
        self.assertEqual(
            question_lines(packet),
            ["互动问题：你更想看这张图的创作过程，还是围绕角色的视觉解读？"],
        )

    def test_fanfic_accepts_explicit_weeks_1_2_baseline_policy(self):
        packet = build_packet(
            {
                "column": "fanfic",
                "ip_pool": IP_POOL,
                "candidate": ranked_candidate(),
                "authorization": None,
                "research": RESEARCH,
                "observation_url": "https://example.lofter.com/post/observation-1",
                "observation_published_at": "2026-08-09T12:00:00+08:00",
                "fanfic_qualification": {
                    "phase": "weeks_1_2",
                    "baseline_policy_selected": True,
                },
            }
        )
        self.assertIn("目标长度：800–2000个中文字符", packet)
        self.assertIn("前置观察：https://example.lofter.com/post/observation-1", packet)
        self.assertIn("研究核验：5/5已通过", packet)
        self.assertEqual(
            question_lines(packet),
            ["互动问题：你希望这个故事沿当前分支继续吗？"],
        )

    def test_fanfic_accepts_week_3_top_40_percent_qualification(self):
        payload = {
            "column": "fanfic",
            "ip_pool": IP_POOL,
            "candidate": ranked_candidate(),
            "authorization": None,
            "research": RESEARCH,
            "observation_url": "https://example.lofter.com/post/observation-1",
            "observation_published_at": "2026-08-09",
            "fanfic_qualification": {
                "phase": "week_3_plus",
                "top_40_percent": True,
            },
        }
        packet = build_packet(payload)
        self.assertIn("资格：第3周起近14天表现前40%", packet)

    def test_fanfic_rejects_incomplete_research_observation_or_qualification(self):
        base = {
            "column": "fanfic",
            "ip_pool": IP_POOL,
            "candidate": ranked_candidate(),
            "authorization": None,
            "research": RESEARCH,
            "observation_url": "https://example.lofter.com/post/observation-1",
            "observation_published_at": "2026-08-09",
            "fanfic_qualification": {
                "phase": "week_3_plus",
                "top_40_percent": True,
            },
        }
        cases = (
            ({"research": {**RESEARCH, "relationships_verified": False}}, "fan fiction research is incomplete"),
            ({"observation_url": ""}, "observation_url must be an HTTPS LOFTER URL"),
            (
                {"fanfic_qualification": {"phase": "weeks_1_2", "baseline_policy_selected": False}},
                "weeks 1-2 baseline policy must be explicitly selected",
            ),
            (
                {"fanfic_qualification": {"phase": "week_3_plus", "top_40_percent": False}},
                "week 3+ fan fiction requires top_40_percent true",
            ),
        )
        for changed, message in cases:
            with self.subTest(message=message):
                with self.assertRaisesRegex(ValueError, re.escape(message)):
                    build_packet({**base, **changed})


if __name__ == "__main__":
    unittest.main()

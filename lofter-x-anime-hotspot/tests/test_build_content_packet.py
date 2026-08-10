import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from build_content_packet import build_packet


CANDIDATE = {
    "id": "topic-1",
    "title": "角色A纪念日热度上升",
    "ip_name": "示例IP",
    "characters": ["角色A", "角色B"],
    "tags": ["示例IP", "角色A"],
    "total_score": 82,
    "media_instruction": "use_authorized_media",
    "x_evidence": "X近24小时相关创作集中增长",
    "lofter_evidence": "LOFTER标签出现新讨论",
}
RESEARCH = {
    "world_verified": True,
    "characters_verified": True,
    "relationships_verified": True,
    "cp_conventions_verified": True,
    "fandom_risks_verified": True,
}
ASSET = {
    "allowed": True,
    "usage": "ai_adaptation",
    "author_handle": "@artist",
    "source_url": "https://x.com/artist/status/1",
}


class BuildPacketTest(unittest.TestCase):
    def test_builds_hotspot_observation_without_fanfic_gate(self):
        packet = build_packet(CANDIDATE, {}, "daily_hotspot", ASSET)
        self.assertIn("# 今日热度异动", packet)
        self.assertIn("总分：82/100", packet)
        self.assertIn("图像经授权使用，含AI辅助创作｜#AI辅助#", packet)

    def test_fanfic_requires_all_research_checks(self):
        incomplete = {**RESEARCH, "relationships_verified": False}
        with self.assertRaisesRegex(ValueError, "fan fiction research is incomplete"):
            build_packet(CANDIDATE, incomplete, "fanfic", ASSET)

    def test_fanfic_packet_has_one_interaction_question(self):
        packet = build_packet(CANDIDATE, RESEARCH, "fanfic", ASSET)
        self.assertIn("# 热点脑洞实验室", packet)
        self.assertEqual(packet.count("互动问题："), 1)

    def test_missing_authorized_asset_requests_independent_image(self):
        candidate = {**CANDIDATE, "media_instruction": "create_independent_image"}
        packet = build_packet(candidate, {}, "weekly_trend")
        self.assertIn("独立创作配图，不输入未授权原图", packet)
        self.assertNotIn("图像经授权使用", packet)


if __name__ == "__main__":
    unittest.main()

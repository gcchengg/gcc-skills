import json
import subprocess
import tempfile
import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_post_packet.py"


def valid_packet():
    return {
        "id": "D01-PM",
        "topic": "完美煮蛋时间表",
        "content_type": "cooking-time",
        "scene_template": "time-spiral",
        "title": "完美煮蛋时间表",
        "subtitle": "6种熟度·1张图讲清楚",
        "visual_nodes": ["6分钟", "7分钟", "8分钟", "10分钟", "12分钟", "15分钟"],
        "body_copy": "时间从水沸后开始计算，实际熟度会受鸡蛋大小与火力影响。",
        "safety_note": "中老年人、孕妇及免疫力较弱者，建议选择全熟蛋。",
        "tags": ["中老年饮食", "煮鸡蛋", "饮食说明书", "早餐", "烹饪技巧", "鸡蛋", "健康饮食", "生活常识", "收藏", "爸妈饮食"],
        "source_notes": [
            {"label": "食品安全参考", "url": "https://example.org/food-safety", "checked_at": "2026-08-18"}
        ],
    }


class ValidatorTest(unittest.TestCase):
    def run_validator(self, packet):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "packet.json"
            path.write_text(json.dumps(packet, ensure_ascii=False), encoding="utf-8")
            return subprocess.run(
                ["python3", str(SCRIPT), str(path)],
                capture_output=True,
                text=True,
                check=False,
            )

    def test_accepts_valid_packet(self):
        result = self.run_validator(valid_packet())
        self.assertEqual(0, result.returncode, result.stdout + result.stderr)
        self.assertTrue(json.loads(result.stdout)["ok"])

    def test_rejects_banned_claim(self):
        packet = valid_packet()
        packet["title"] = "预防脑梗的10大食物"
        result = self.run_validator(packet)
        self.assertEqual(1, result.returncode)
        self.assertIn("预防脑梗", result.stdout)

    def test_rejects_wrong_tag_and_node_counts(self):
        packet = valid_packet()
        packet["tags"] = ["鸡蛋"]
        packet["visual_nodes"] = ["6分钟", "12分钟"]
        result = self.run_validator(packet)
        self.assertEqual(1, result.returncode)
        self.assertIn("tags must contain exactly 10 items", result.stdout)
        self.assertIn("visual_nodes must contain 3 to 8 items", result.stdout)

    def test_health_list_requires_two_sources(self):
        packet = valid_packet()
        packet["content_type"] = "health-list"
        result = self.run_validator(packet)
        self.assertEqual(1, result.returncode)
        self.assertIn("health-sensitive packets require at least two sources", result.stdout)

    def test_each_health_sensitive_type_requires_two_valid_sources(self):
        for content_type in ("health-list", "myth", "myth-guide"):
            with self.subTest(content_type=content_type):
                packet = valid_packet()
                packet["content_type"] = content_type
                packet["source_notes"] = [{}, {}]
                result = self.run_validator(packet)
                response = json.loads(result.stdout)
                self.assertEqual(1, result.returncode)
                self.assertIn(
                    "source_notes entries must be objects with non-empty label, url, and checked_at",
                    response["errors"],
                )
                self.assertIn(
                    "health-sensitive packets require at least two sources",
                    response["errors"],
                )

    def test_rejects_non_string_visual_nodes_and_tags_without_crashing(self):
        packet = valid_packet()
        packet["visual_nodes"] = ["6分钟", 7, "8分钟"]
        packet["tags"] = [[] for _ in range(10)]
        result = self.run_validator(packet)
        response = json.loads(result.stdout)
        self.assertEqual(1, result.returncode)
        self.assertIn("visual_nodes must contain only strings", response["errors"])
        self.assertIn("tags must contain only strings", response["errors"])

    def test_rejects_non_utf8_packet_with_json_error(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "packet.json"
            path.write_bytes(b'{"title": "\xff"}')
            result = subprocess.run(
                ["python3", str(SCRIPT), str(path)],
                capture_output=True,
                text=True,
                check=False,
            )
        response = json.loads(result.stdout)
        self.assertEqual(1, result.returncode)
        self.assertFalse(response["ok"])
        self.assertTrue(response["errors"])


if __name__ == "__main__":
    unittest.main()

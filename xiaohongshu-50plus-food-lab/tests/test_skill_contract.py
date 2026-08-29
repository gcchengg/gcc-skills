import unittest
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]


class SkillContractTest(unittest.TestCase):
    def test_skill_declares_required_workflow_and_references(self):
        text = (ROOT / "SKILL.md").read_text(encoding="utf-8")
        for required in (
            "name: xiaohongshu-50plus-food-lab",
            "50+食物奇境实验室",
            "validate_post_packet.py",
            "content-calendar.md",
            "health-boundaries.md",
            "visual-system.md",
            "time-spiral",
            "food-arena",
            "meal-assembly",
            "contrast-worlds",
            "Image 2",
            "先生成1张",
        ):
            self.assertIn(required, text)

    def test_metadata_has_display_name_and_default_prompt(self):
        text = (ROOT / "agents" / "openai.yaml").read_text(encoding="utf-8")
        self.assertIn('display_name: "50+食物奇境实验室"', text)
        self.assertIn("default_prompt:", text)
        self.assertIn("$xiaohongshu-50plus-food-lab", text)


if __name__ == "__main__":
    unittest.main()

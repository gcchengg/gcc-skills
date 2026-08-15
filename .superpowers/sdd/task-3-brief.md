### Task 3: Content Packet Generator

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/build_content_packet.py`
- Create: `lofter-x-anime-hotspot/tests/test_build_content_packet.py`

**Interfaces:**
- Consumes: one scored candidate, research checklist booleans, optional validated asset result, and column type.
- Produces: `build_packet(candidate: dict, research: dict, column: str, asset: dict | None = None) -> str`.

- [ ] **Step 1: Write the failing packet tests**

```python
# lofter-x-anime-hotspot/tests/test_build_content_packet.py
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
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_build_content_packet.py -v
```

Expected: `ModuleNotFoundError: No module named 'build_content_packet'`.

- [ ] **Step 3: Implement the packet generator**

```python
# lofter-x-anime-hotspot/scripts/build_content_packet.py
import argparse
import json
from pathlib import Path


COLUMN_TITLES = {
    "daily_hotspot": "今日热度异动",
    "weekly_trend": "本周二次元趋势",
    "fanfic": "热点脑洞实验室",
}
RESEARCH_FIELDS = {
    "world_verified",
    "characters_verified",
    "relationships_verified",
    "cp_conventions_verified",
    "fandom_risks_verified",
}


def build_packet(
    candidate: dict,
    research: dict,
    column: str,
    asset: dict | None = None,
) -> str:
    if column not in COLUMN_TITLES:
        raise ValueError("unknown column")
    if candidate.get("total_score", 0) < 70:
        raise ValueError("candidate score is below 70")
    if column == "fanfic" and not all(research.get(field) is True for field in RESEARCH_FIELDS):
        raise ValueError("fan fiction research is incomplete")
    if candidate.get("media_instruction") == "use_authorized_media":
        if not asset or asset.get("allowed") is not True:
            raise ValueError("validated authorization is required")
        media_line = f"授权素材：{asset['source_url']}（{asset['usage']}）"
        footer = "图像经授权使用，含AI辅助创作｜#AI辅助#"
    else:
        media_line = "配图要求：独立创作配图，不输入未授权原图"
        footer = ""
    tags = " ".join(f"#{tag}#" for tag in candidate.get("tags", []))
    characters = "、".join(candidate.get("characters", []))
    sections = [
        f"# {COLUMN_TITLES[column]}",
        "",
        f"选题：{candidate['title']}",
        f"IP：{candidate['ip_name']}",
        f"角色：{characters}",
        f"总分：{candidate['total_score']}/100",
        f"X依据：{candidate['x_evidence']}",
        f"LOFTER依据：{candidate['lofter_evidence']}",
        f"标签：{tags}",
        f"{media_line}",
        "",
        "## 正文写作要求",
        "",
        "- 前100字说明热点或设置故事钩子。",
        "- 正文提供明确的信息增量或完整故事体验。",
        "- 不设置强付费截断。",
        "- 不添加无关热门标签。",
        "",
        "互动问题：你更想看这个热点的趋势拆解，还是角色故事？",
    ]
    if footer:
        sections.extend(["", footer])
    return "\n".join(sections) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    packet = build_packet(
        payload["candidate"],
        payload.get("research", {}),
        payload["column"],
        payload.get("asset"),
    )
    args.output.write_text(packet, encoding="utf-8")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run packet tests and verify success**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_build_content_packet.py -v
```

Expected: `Ran 4 tests` and `OK`.

- [ ] **Step 5: Commit the packet generator**

```bash
git add lofter-x-anime-hotspot/scripts/build_content_packet.py lofter-x-anime-hotspot/tests/test_build_content_packet.py
git commit -m "feat: generate LOFTER content packets"
```

---


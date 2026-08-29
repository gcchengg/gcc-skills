# 50+ Food Wonder Lab Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a version-controlled successor skill that produces a validated 30-day/60-post Xiaohongshu calendar, safe Chinese health-food copy, four reproducible Image 2 scene prompts, and one approved “完美煮蛋时间表” benchmark image.

**Architecture:** The new `xiaohongshu-50plus-food-lab/` skill is independent from the installed `xiaohongshu-food-anatomy` skill because the account positioning and visual system have changed completely. Markdown references are the editorial source of truth, JSON post packets are the machine-checkable interface, one standard-library Python validator enforces structure and claim boundaries, and Image 2 renders versioned PNGs from four prompt templates. Bulk production of all 60 final images begins only after the benchmark image is approved.

**Tech Stack:** Codex Skills Markdown, Python 3 standard library, `unittest`, JSON, Codex built-in Image 2 (`imagegen`), PNG at Xiaohongshu portrait 3:4.

## Global Constraints

- Audience: primarily 45–65-year-old readers, secondarily 25–45-year-old children forwarding posts to parents.
- Schedule: 2026-08-18 through 2026-09-16, exactly two posts per day and 60 posts total.
- Every image uses the fixed top label `50+饮食说明书`.
- Visual system name: `50+食物奇境实验室`.
- Every final image uses Image 2 and a 3:4 portrait canvas.
- Allowed scene templates: `time-spiral`, `food-arena`, `meal-assembly`, `contrast-worlds`.
- Never use black-gold as the primary style, crowns, medals, stars, TOP scores, fabricated rankings, medical cure claims, brands, watermarks, QR codes, or platform UI.
- Never use `预防脑梗`, `清理血管`, `降三高`, `抗癌食物`, `治疗便秘`, or equivalent guaranteed-health wording.
- A generated image with pseudo-Chinese, misspellings, duplicated labels, incorrect food states, or unreadable small text is not publishable.
- Keep the existing installed `/Users/guocc/.codex/skills/xiaohongshu-food-anatomy/` unchanged; install the successor only after explicit approval.

---

## Planned File Structure

```text
xiaohongshu-50plus-food-lab/
├── SKILL.md                              # Invocation rules and two-stage workflow
├── agents/
│   └── openai.yaml                      # Codex UI metadata
├── assets/
│   ├── post-packet-template.json        # Canonical structured post contract
│   └── references/
│       └── food-wonder-lab-anchor.png   # Approved C-direction visual anchor
├── examples/
│   └── perfect-boiled-egg/
│       ├── post-packet.json             # Validated benchmark content
│       ├── image-prompt.md               # Reproducible Image 2 prompt
│       └── final-v1.png                  # First publishable benchmark render
├── references/
│   ├── account-positioning.md            # Audience, voice, daily pairing
│   ├── content-calendar.md               # Exact 30-day/60-post source of truth
│   ├── health-boundaries.md              # Claim replacements and source rules
│   ├── visual-system.md                  # Shared 3D visual language and QA
│   └── prompts/
│       ├── time-spiral.md                # Time/process scene template
│       ├── food-arena.md                 # Food-list scene template
│       ├── meal-assembly.md               # Pairing/portion scene template
│       └── contrast-worlds.md             # Myth/selection scene template
├── scripts/
│   └── validate_post_packet.py           # JSON schema and health-claim validator
└── tests/
    ├── test_calendar_contract.py          # 30 days, 60 unique titles, valid templates
    ├── test_post_packet_validator.py      # Structure and banned-claim behavior
    └── test_skill_contract.py             # Skill metadata and workflow contract
```

---

### Task 1: Create the Exact 30-Day Editorial Source of Truth

**Files:**
- Create: `xiaohongshu-50plus-food-lab/references/account-positioning.md`
- Create: `xiaohongshu-50plus-food-lab/references/content-calendar.md`
- Create: `xiaohongshu-50plus-food-lab/tests/test_calendar_contract.py`

**Interfaces:**
- Consumes: The approved 60-post calendar and the four scene-template IDs from the design spec.
- Produces: A Markdown table whose rows match `| DNN | YYYY-MM-DD | ... |`; later tasks use its post IDs, titles, content types, and scene templates.

- [ ] **Step 1: Write the failing calendar contract test**

```python
# xiaohongshu-50plus-food-lab/tests/test_calendar_contract.py
import re
import unittest
from datetime import date, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CALENDAR = ROOT / "references" / "content-calendar.md"
ROW = re.compile(
    r"^\| (D\d{2}) \| (\d{4}-\d{2}-\d{2}) \| "
    r"(.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \| (.+?) \|$"
)
ALLOWED_TEMPLATES = {
    "time-spiral", "food-arena", "meal-assembly", "contrast-worlds"
}
BANNED = {"预防脑梗", "清理血管", "降三高", "抗癌食物", "治疗便秘"}


class CalendarContractTest(unittest.TestCase):
    def test_calendar_has_30_consecutive_days_and_60_unique_posts(self):
        rows = []
        for line in CALENDAR.read_text(encoding="utf-8").splitlines():
            match = ROW.match(line)
            if match:
                rows.append(match.groups())

        self.assertEqual(30, len(rows))
        expected_dates = [
            (date(2026, 8, 18) + timedelta(days=i)).isoformat()
            for i in range(30)
        ]
        self.assertEqual(expected_dates, [row[1] for row in rows])

        titles = [title for row in rows for title in (row[2], row[5])]
        self.assertEqual(60, len(titles))
        self.assertEqual(60, len(set(titles)))

        content_types = [kind for row in rows for kind in (row[3], row[6])]
        self.assertEqual(24, content_types.count("health-list"))
        self.assertEqual(5, content_types.count("myth"))

        templates = [template for row in rows for template in (row[4], row[7])]
        self.assertTrue(set(templates) <= ALLOWED_TEMPLATES)
        self.assertFalse(any(term in title for title in titles for term in BANNED))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify it fails because the calendar does not exist**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/tests/test_calendar_contract.py -v
```

Expected: `ERROR` with `FileNotFoundError` for `references/content-calendar.md`.

- [ ] **Step 3: Create the account-positioning reference**

```markdown
# Account Positioning

## Positioning

把中老年人每天怎么吃，做成一张张看得懂、记得住、可以照着做的食物奇境图。

## Audience

- Primary: 45–65-year-old readers making their own daily food decisions.
- Secondary: 25–45-year-old children forwarding practical posts to parents.

## Publishing Rhythm

- 09:00: a search-friendly health-food list or myth hook.
- 19:30: a save-friendly time, pairing, portion, cooking, or selection guide.
- The two posts must answer one connected pair of questions: “吃什么” and “怎么吃”.

## Voice

Direct, warm, specific, non-alarmist, and readable on a phone. Use short Chinese sentences, concrete food examples, and conditional language. Never present food as medicine.
```

- [ ] **Step 4: Create the exact calendar table**

Use this header and these exact 30 rows in `references/content-calendar.md`:

```markdown
# 30-Day / 60-Post Calendar

| Day | Date | AM title | AM type | AM template | PM title | PM type | PM template |
|---|---|---|---|---|---|---|---|
| D01 | 2026-08-18 | 50岁后，建议经常轮换吃的10类食物 | health-list | food-arena | 完美煮蛋时间表：3～12分钟有什么区别 | cooking-time | time-spiral |
| D02 | 2026-08-19 | 对心脑血管更友好的10类日常食物 | health-list | food-arena | 鸡蛋、牛奶、豆腐，一餐分别吃多少 | portion-guide | meal-assembly |
| D03 | 2026-08-20 | 中老年人的优质蛋白质食物清单 | health-list | food-arena | 50岁后的一周高蛋白早餐搭配表 | meal-plan | meal-assembly |
| D04 | 2026-08-21 | 日常补钙，可以优先选择哪些食物 | health-list | food-arena | 牛奶、酸奶、奶粉怎么选 | selection-guide | contrast-worlds |
| D05 | 2026-08-22 | 富含膳食纤维的常见食物清单 | health-list | food-arena | 粗粮与大米的日常搭配比例 | pairing-guide | meal-assembly |
| D06 | 2026-08-23 | 富含抗氧化成分的常见食物 | health-list | food-arena | 常见蔬菜怎么保存，时间和方法一次看懂 | storage-guide | time-spiral |
| D07 | 2026-08-24 | 对眼睛友好的深色食物清单 | health-list | food-arena | 一拳、一掌、一捧：不用秤也能估算食量 | portion-guide | meal-assembly |
| D08 | 2026-08-25 | 帮助维持肌肉，可以关注这10类食物 | health-list | food-arena | 50岁后，一周午餐搭配参考 | meal-plan | meal-assembly |
| D09 | 2026-08-26 | 不只香蕉，这些日常食物也含钾 | health-list | food-arena | 一天三餐怎么分配，吃多少更合适 | portion-guide | meal-assembly |
| D10 | 2026-08-27 | 适合日常选择的低糖水果清单 | health-list | food-arena | 常见水果一次吃多少：实物份量图 | portion-guide | meal-assembly |
| D11 | 2026-08-28 | 适合早餐加入的8类食物 | health-list | food-arena | 中老年人一周早餐不重样搭配表 | meal-plan | meal-assembly |
| D12 | 2026-08-29 | 适合晚餐的低负担食物清单 | health-list | food-arena | 晚餐几点吃、吃多少更合适 | portion-guide | time-spiral |
| D13 | 2026-08-30 | 中老年人可以换着吃的8种粗粮 | health-list | food-arena | 小米、燕麦、糙米、藜麦分别怎么搭配 | pairing-guide | meal-assembly |
| D14 | 2026-08-31 | 适合经常轮换的豆制品清单 | health-list | food-arena | 红豆、绿豆、黄豆分别泡多久 | cooking-time | time-spiral |
| D15 | 2026-09-01 | 50岁后可以轮换吃的鱼类清单 | health-list | food-arena | 蒸鱼时间表：不同大小分别蒸多久 | cooking-time | time-spiral |
| D16 | 2026-09-02 | 常见深绿色蔬菜选择清单 | health-list | food-arena | 蔬菜焯水时间表：哪些需要焯、焯多久 | cooking-time | time-spiral |
| D17 | 2026-09-03 | 中老年人适合选择的坚果和种子 | health-list | food-arena | 坚果“一小把”到底是多少 | portion-guide | meal-assembly |
| D18 | 2026-09-04 | 不只牛奶，这些食物也能提供钙 | health-list | food-arena | 常见食物含钙选择对照表 | selection-guide | food-arena |
| D19 | 2026-09-05 | 富含维生素C的常见蔬果清单 | health-list | food-arena | 水果和蔬菜应该怎样搭配 | pairing-guide | meal-assembly |
| D20 | 2026-09-06 | 秋季适合加入餐桌的时令食物 | health-list | food-arena | 秋季一周家常晚餐搭配表 | meal-plan | meal-assembly |
| D21 | 2026-09-07 | 天气炎热时的清爽补水食物 | health-list | food-arena | 白水、茶、牛奶，日常饮水怎么安排 | timing-guide | time-spiral |
| D22 | 2026-09-08 | 食欲不好时可以选择哪些食物 | health-list | food-arena | 软烂不等于没营养：适合老人的烹饪方法 | cooking-guide | contrast-worlds |
| D23 | 2026-09-09 | 适合牙口不好人群的食物清单 | health-list | food-arena | 肉、菜、杂粮怎么做得软而不烂 | cooking-guide | contrast-worlds |
| D24 | 2026-09-10 | 50岁后值得加入购物车的12种基础食材 | selection-guide | meal-assembly | 中老年家庭一周买菜清单 | selection-guide | meal-assembly |
| D25 | 2026-09-11 | 早餐想吃好，家里常备这8类食物 | health-list | food-arena | 燕麦片配料表怎么看 | selection-guide | contrast-worlds |
| D26 | 2026-09-12 | 清淡饮食不等于天天喝白粥 | myth | contrast-worlds | 真全麦面包怎么选，看懂包装上的这些字 | selection-guide | contrast-worlds |
| D27 | 2026-09-13 | 50岁后不能只吃素，蛋白质同样重要 | myth | contrast-worlds | 素食和荤食怎样搭配更均衡 | pairing-guide | meal-assembly |
| D28 | 2026-09-14 | 粗粮并不是吃得越多越好 | myth | contrast-worlds | 肠胃敏感的人，粗粮怎么循序增加 | cooking-guide | time-spiral |
| D29 | 2026-09-15 | 骨头汤不是日常补钙的主要来源 | myth | contrast-worlds | 炖汤的肉和汤，营养重点分别在哪里 | myth-guide | contrast-worlds |
| D30 | 2026-09-16 | 无糖食品不等于可以不限量吃 | myth | contrast-worlds | 无糖、低糖、零糖，包装上到底怎么看 | selection-guide | contrast-worlds |
```

- [ ] **Step 5: Run the calendar test**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/tests/test_calendar_contract.py -v
```

Expected: `OK` with one passing test.

- [ ] **Step 6: Commit the editorial source of truth**

```bash
git add xiaohongshu-50plus-food-lab/references/account-positioning.md xiaohongshu-50plus-food-lab/references/content-calendar.md xiaohongshu-50plus-food-lab/tests/test_calendar_contract.py
git commit -m "feat(food-lab): add 60-post editorial calendar"
```

---

### Task 2: Add the Machine-Checkable Post Packet and Health Guard

**Files:**
- Create: `xiaohongshu-50plus-food-lab/assets/post-packet-template.json`
- Create: `xiaohongshu-50plus-food-lab/references/health-boundaries.md`
- Create: `xiaohongshu-50plus-food-lab/scripts/validate_post_packet.py`
- Create: `xiaohongshu-50plus-food-lab/tests/test_post_packet_validator.py`

**Interfaces:**
- Consumes: A UTF-8 JSON post packet with the fields defined below.
- Produces: Exit code `0` and `{"ok": true, "errors": []}` for valid packets; exit code `1` and explicit error strings for invalid packets.

- [ ] **Step 1: Write validator tests for a valid packet and banned medical claims**

```python
# xiaohongshu-50plus-food-lab/tests/test_post_packet_validator.py
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
        ]
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


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and verify they fail because the validator is absent**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/tests/test_post_packet_validator.py -v
```

Expected: four failures because `scripts/validate_post_packet.py` cannot be opened.

- [ ] **Step 3: Create the canonical packet template**

```json
{
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
  ]
}
```

- [ ] **Step 4: Create the health-boundaries reference**

Document the exact replacement table:

```markdown
# Health Claim Boundaries

| Do not write | Write instead |
|---|---|
| 预防脑梗 | 对心脑血管更友好的日常饮食选择 |
| 清理血管 | 减少日常饮食负担 |
| 降三高 | 血压、血脂或血糖偏高人群可以关注 |
| 抗癌食物 | 富含抗氧化成分的常见食物 |
| 治疗便秘 | 日常增加膳食纤维的食物选择 |
| 逆转衰老 | 帮助维持肌肉、骨骼与日常活力 |

## Rules

- Food is not medicine. Never promise prevention, treatment, cure, reversal, cleansing, or guaranteed results.
- For health lists and myths, verify claims against at least two primary or authoritative sources before writing the final packet.
- State conditions for cooking time, storage, portion, and suitability.
- Mention individual differences when the topic involves blood pressure, blood lipids, blood glucose, kidney function, swallowing, allergies, or medication.
- Do not tell users to stop medication or replace medical care with food.
```

- [ ] **Step 5: Implement the validator**

```python
# xiaohongshu-50plus-food-lab/scripts/validate_post_packet.py
import argparse
import json
from pathlib import Path


REQUIRED = {
    "id", "topic", "content_type", "scene_template", "title", "subtitle",
    "visual_nodes", "body_copy", "safety_note", "tags", "source_notes"
}
ALLOWED_TEMPLATES = {
    "time-spiral", "food-arena", "meal-assembly", "contrast-worlds"
}
BANNED = (
    "预防脑梗", "清理血管", "血管垃圾", "降三高", "抗癌食物",
    "治疗便秘", "逆转衰老", "保证有效", "替代药物", "停药"
)


def collect_text(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [text for item in value for text in collect_text(item)]
    if isinstance(value, dict):
        return [text for item in value.values() for text in collect_text(item)]
    return []


def validate(packet):
    errors = []
    missing = sorted(REQUIRED - set(packet))
    if missing:
        errors.append("missing fields: " + ", ".join(missing))
    if packet.get("scene_template") not in ALLOWED_TEMPLATES:
        errors.append("scene_template is not allowed")
    if len(packet.get("title", "")) > 18:
        errors.append("title must contain at most 18 Chinese characters")
    if len(packet.get("subtitle", "")) > 30:
        errors.append("subtitle must contain at most 30 Chinese characters")
    nodes = packet.get("visual_nodes", [])
    if not isinstance(nodes, list) or not 3 <= len(nodes) <= 8:
        errors.append("visual_nodes must contain 3 to 8 items")
    tags = packet.get("tags", [])
    if not isinstance(tags, list) or len(tags) != 10:
        errors.append("tags must contain exactly 10 items")
    duplicate_tags = len(tags) != len(set(tags)) if isinstance(tags, list) else False
    if duplicate_tags:
        errors.append("tags must be unique")
    sources = packet.get("source_notes", [])
    if packet.get("content_type") in {"health-list", "myth", "myth-guide"}:
        if not isinstance(sources, list) or len(sources) < 2:
            errors.append("health-sensitive packets require at least two sources")
    all_text = "\n".join(collect_text(packet))
    for term in BANNED:
        if term in all_text:
            errors.append(f"banned health claim: {term}")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("packet", type=Path)
    args = parser.parse_args()
    packet = json.loads(args.packet.read_text(encoding="utf-8"))
    errors = validate(packet)
    print(json.dumps({"ok": not errors, "errors": errors}, ensure_ascii=False))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
```

- [ ] **Step 6: Run validator tests**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/tests/test_post_packet_validator.py -v
```

Expected: `OK` with four passing tests.

- [ ] **Step 7: Commit the structured content guard**

```bash
git add xiaohongshu-50plus-food-lab/assets/post-packet-template.json xiaohongshu-50plus-food-lab/references/health-boundaries.md xiaohongshu-50plus-food-lab/scripts/validate_post_packet.py xiaohongshu-50plus-food-lab/tests/test_post_packet_validator.py
git commit -m "feat(food-lab): validate post packets and health claims"
```

---

### Task 3: Build the Four Reproducible Image 2 Prompt Templates

**Files:**
- Create: `xiaohongshu-50plus-food-lab/references/visual-system.md`
- Create: `xiaohongshu-50plus-food-lab/references/prompts/time-spiral.md`
- Create: `xiaohongshu-50plus-food-lab/references/prompts/food-arena.md`
- Create: `xiaohongshu-50plus-food-lab/references/prompts/meal-assembly.md`
- Create: `xiaohongshu-50plus-food-lab/references/prompts/contrast-worlds.md`
- Create: `xiaohongshu-50plus-food-lab/assets/references/food-wonder-lab-anchor.png`

**Interfaces:**
- Consumes: A validated post packet and the shared visual system.
- Produces: One standalone Image 2 prompt with labeled sections `Use case`, `Asset type`, `Primary request`, `Scene/backdrop`, `Subject`, `Composition/framing`, `Text (verbatim)`, `Constraints`, and `Avoid`.

- [ ] **Step 1: Preserve the approved C-direction visual anchor inside the skill**

Run:

```bash
mkdir -p xiaohongshu-50plus-food-lab/assets/references
cp /Users/guocc/.codex/generated_images/01a0128f-a82c-7e11-baa5-51cdc033821a/exec-17075518-9af5-4fe6-970c-abc7e2a3aa67.png xiaohongshu-50plus-food-lab/assets/references/food-wonder-lab-anchor.png
```

Expected: the copied PNG exists and remains 3:4 portrait.

- [ ] **Step 2: Write the shared visual system reference**

Specify these immutable rules in `references/visual-system.md`:

```markdown
# 50+ Food Wonder Lab Visual System

- Use an oversized photorealistic food subject, cinematic depth, visible transformation, and a bright coral/orange/purple/teal/cream palette adjusted to the ingredient.
- Use glass tracks, suspended platforms, miniature kitchens, steam, droplets, translucent materials, and volumetric light only when they explain the content.
- Keep the top label “50+饮食说明书” and use a large modern Chinese sans-serif title.
- Reserve 20–25% for title, 45–55% for the food scene, 15–20% for steps or comparisons, and 5–10% for safety conditions.
- Render at 3:4 portrait with no screenshot margins.
- Do not use black-gold, crowns, medals, stars, TOP scores, fabricated rankings, dashboards, dense software cards, brands, watermarks, QR codes, or platform UI.
- Reject pseudo-Chinese, duplicate labels, unreadable small text, plastic-looking food, and physically incorrect food states.
```

- [ ] **Step 3: Create all four prompt templates with the same contract**

Each file must contain the following exact scaffolding and replace only the `Primary request`, `Scene/backdrop`, `Subject`, and `Composition/framing` paragraphs with its scene-specific rules:

```markdown
Use case: infographic-diagram
Asset type: 小红书3:4竖版高分辨率发布图
Primary request: {{SCENE_SPECIFIC_REQUEST}}
Scene/backdrop: {{SCENE_SPECIFIC_BACKDROP}}
Subject: {{SCENE_SPECIFIC_SUBJECT}}
Style/medium: 超写实商业食物摄影与电影级3D科普信息图融合
Composition/framing: {{SCENE_SPECIFIC_COMPOSITION}}
Text (verbatim):
“50+饮食说明书”
“{{TITLE}}”
“{{SUBTITLE}}”
{{VISUAL_NODES}}
“{{SAFETY_NOTE}}”
Color palette: 根据食物选择明亮的珊瑚橙、紫红、青绿、奶油白；禁止黑金主色
Constraints: 中文逐字准确；食物状态真实；标题缩略图可读；信息层级为标题、食物变化、操作、条件说明
Avoid: 黑金、皇冠、奖章、星级、TOP评分、虚假排名、软件驾驶舱、医学治疗承诺、品牌、水印、二维码、平台UI、伪中文、重复文字
```

Scene-specific requirements:

- `time-spiral.md`: a transparent spiral timeline with visibly changing food states and a miniature cooking workflow below.
- `food-arena.md`: suspended food islands grouped by category or eating situation; no numeric ranking or score.
- `meal-assembly.md`: ingredient streams entering one central plate with real bowl, fist, palm, or spoon scale cues.
- `contrast-worlds.md`: one mistaken choice and one better alternative joined by a transformation path; no fear imagery or diseased organs.

- [ ] **Step 4: Verify prompt completeness**

Run:

```bash
for file in xiaohongshu-50plus-food-lab/references/prompts/*.md; do
  rg -q '^Use case: infographic-diagram$' "$file"
  rg -q '^Text \(verbatim\):$' "$file"
  rg -q '^Constraints:' "$file"
  rg -q '^Avoid:' "$file"
done
```

Expected: exit code `0` with no output.

- [ ] **Step 5: Commit the visual system and prompt templates**

```bash
git add xiaohongshu-50plus-food-lab/references/visual-system.md xiaohongshu-50plus-food-lab/references/prompts xiaohongshu-50plus-food-lab/assets/references/food-wonder-lab-anchor.png
git commit -m "feat(food-lab): add Image 2 scene templates"
```

---

### Task 4: Author the Successor Skill and Its Invocation Contract

**Files:**
- Create: `xiaohongshu-50plus-food-lab/SKILL.md`
- Create: `xiaohongshu-50plus-food-lab/agents/openai.yaml`
- Create: `xiaohongshu-50plus-food-lab/tests/test_skill_contract.py`

**Interfaces:**
- Consumes: The calendar, health boundaries, visual system, prompt templates, and packet validator.
- Produces: A Codex skill named `xiaohongshu-50plus-food-lab` with explicit gates: topic/packet → validation → prompt preview → one Image 2 render → visual QA → copy.

- [ ] **Step 1: Write the failing skill contract test**

```python
# xiaohongshu-50plus-food-lab/tests/test_skill_contract.py
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


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify it fails because skill files are absent**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/tests/test_skill_contract.py -v
```

Expected: two errors with `FileNotFoundError`.

- [ ] **Step 3: Create `SKILL.md` with the complete workflow**

The file must declare:

```yaml
---
name: xiaohongshu-50plus-food-lab
description: Use when creating Chinese Xiaohongshu food, cooking-time, portion, pairing, selection, or food-myth content for readers aged 45–65, especially when the user wants a 50+饮食说明书 post, a 食物奇境实验室 3D infographic, an Image 2 prompt, or a post from the approved 30-day calendar.
---
```

Its body must implement this exact sequence:

1. Read `references/account-positioning.md` and `references/health-boundaries.md`.
2. When the user asks for the next scheduled post, select the earliest unfinished ID from `references/content-calendar.md`; when they name a topic, keep their topic.
3. Research health-sensitive claims with primary or authoritative sources and record them in `source_notes`.
4. Create one JSON post packet using `assets/post-packet-template.json`.
5. Run `python3 scripts/validate_post_packet.py <packet>` and stop on any error.
6. Map the packet’s scene template to one prompt file under `references/prompts/` and substitute all literal text.
7. Show the prompt and ask for approval unless the user explicitly requested image and copy together.
8. Use built-in Image 2 with `assets/references/food-wonder-lab-anchor.png`; 先生成1张, inspect Chinese, food state, hierarchy, 3:4 crop, and prohibited elements.
9. Regenerate only the failed dimension, save as a new version, and never overwrite an approved image.
10. After image approval, write five titles, one 300–500 Chinese-character caption, and ten tags.

- [ ] **Step 4: Create Codex metadata**

```yaml
interface:
  display_name: "50+食物奇境实验室"
  short_description: "为45—65岁人群制作可收藏的饮食清单、时间表与3D食物奇境图"
  default_prompt: "使用 $xiaohongshu-50plus-food-lab 从30天计划中选择下一篇，先给我经校验的内容包和 Image 2 提示词。"
```

- [ ] **Step 5: Run all contract tests**

Run:

```bash
python3 -m unittest discover -s xiaohongshu-50plus-food-lab/tests -p 'test_*.py' -v
```

Expected: all tests pass.

- [ ] **Step 6: Commit the skill contract**

```bash
git add xiaohongshu-50plus-food-lab/SKILL.md xiaohongshu-50plus-food-lab/agents/openai.yaml xiaohongshu-50plus-food-lab/tests/test_skill_contract.py
git commit -m "feat(food-lab): add successor skill workflow"
```

---

### Task 5: Produce and Approve the Boiled-Egg Benchmark

**Files:**
- Create: `xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/post-packet.json`
- Create: `xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/image-prompt.md`
- Create: `xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/final-v1.png`

**Interfaces:**
- Consumes: `assets/post-packet-template.json`, `references/prompts/time-spiral.md`, and `assets/references/food-wonder-lab-anchor.png`.
- Produces: The first validated, user-approved 3:4 PNG that all later images use as the production quality floor.

- [ ] **Step 1: Create the benchmark packet**

Use the exact valid packet from Task 2, replace the placeholder source URL with the authoritative source URLs actually checked during execution, and keep these visual nodes:

```json
["6分钟 流心蛋", "7分钟 溏心蛋", "8分钟 嫩心蛋", "10分钟 软熟蛋", "12分钟 全熟蛋", "15分钟 老熟蛋"]
```

- [ ] **Step 2: Validate the packet**

Run:

```bash
python3 xiaohongshu-50plus-food-lab/scripts/validate_post_packet.py xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/post-packet.json
```

Expected:

```json
{"ok": true, "errors": []}
```

- [ ] **Step 3: Build the exact reproducible prompt**

Copy `references/prompts/time-spiral.md` into `examples/perfect-boiled-egg/image-prompt.md` and replace every placeholder with the packet values. Add these scene-specific requirements:

```text
The six eggs travel down one transparent spiral from upper-right to lower-left, visibly changing from liquid yolk to fully set yolk.
The lower fifth of the image is one continuous miniature kitchen workflow, not five disconnected software cards.
Keep the main title under 25% of the canvas.
Make the eggs appetizing, photorealistic, moist, and physically plausible.
Render the safety note as one integrated illuminated sign inside the scene.
```

Run:

```bash
rg '\{\{' xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/image-prompt.md
```

Expected: no output and exit code `1`, proving no placeholders remain.

- [ ] **Step 4: Generate one benchmark with built-in Image 2**

Call built-in `imagegen` with:

- Reference image: `xiaohongshu-50plus-food-lab/assets/references/food-wonder-lab-anchor.png`.
- Prompt: the full contents of `examples/perfect-boiled-egg/image-prompt.md`.
- Output intent: preview first; after inspection, copy the selected file to `examples/perfect-boiled-egg/final-v1.png`.

Do not generate multiple variants before inspecting the first render.

- [ ] **Step 5: Perform visual QA and request approval**

Inspect at original resolution and check each item explicitly:

- exact top label, title, six times, six doneness labels, five method labels, safety note;
- no pseudo-Chinese or duplicate labels;
- realistic progression from runny to fully set yolk;
- title readable as a Xiaohongshu thumbnail;
- 3:4 crop with no platform UI;
- no black-gold, crown, medal, score, ranking, dashboard, watermark, or QR code;
- one coherent cinematic food scene rather than disconnected cards.

If one dimension fails, create `final-v2.png` with a prompt that changes only that dimension. Show the accepted version to the user and wait for explicit approval before Task 6.

- [ ] **Step 6: Commit the approved benchmark**

```bash
git add xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg
git commit -m "feat(food-lab): add approved boiled egg benchmark"
```

---

### Task 6: Verify, Package, and Gate Bulk Production

**Files:**
- Modify only if user approves installation: `/Users/guocc/.codex/skills/xiaohongshu-50plus-food-lab/`
- Create after benchmark approval: `docs/superpowers/plans/2026-08-18-50plus-food-wonder-lab-production.md`

**Interfaces:**
- Consumes: A passing skill repository and approved benchmark PNG.
- Produces: An optional installed Codex skill plus a second plan for production of the remaining 59 posts without lowering the quality floor.

- [ ] **Step 1: Run the full test suite and packet validation**

Run:

```bash
python3 -m unittest discover -s xiaohongshu-50plus-food-lab/tests -p 'test_*.py' -v
python3 xiaohongshu-50plus-food-lab/scripts/validate_post_packet.py xiaohongshu-50plus-food-lab/examples/perfect-boiled-egg/post-packet.json
```

Expected: all tests pass and the validator prints `{"ok": true, "errors": []}`.

- [ ] **Step 2: Inspect the final repository diff**

Run:

```bash
git status --short
git diff --check HEAD~5..HEAD
```

Expected: no whitespace errors; unrelated pre-existing workspace changes remain untouched.

- [ ] **Step 3: Request installation approval**

Ask before writing outside the repository:

```text
The successor skill is complete and verified in the repository. May I copy it to /Users/guocc/.codex/skills/xiaohongshu-50plus-food-lab/ so Codex can invoke it directly?
```

If approved, first verify the destination does not exist:

```bash
test ! -e /Users/guocc/.codex/skills/xiaohongshu-50plus-food-lab
```

Expected: exit code `0`. Then copy:

```bash
cp -R xiaohongshu-50plus-food-lab /Users/guocc/.codex/skills/xiaohongshu-50plus-food-lab
```

- [ ] **Step 4: Verify the installed copy**

Run:

```bash
python3 -m unittest discover -s /Users/guocc/.codex/skills/xiaohongshu-50plus-food-lab/tests -p 'test_*.py' -v
```

Expected: all tests pass from the installed location.

- [ ] **Step 5: Write the separate bulk-production plan**

Create `docs/superpowers/plans/2026-08-18-50plus-food-wonder-lab-production.md` only after benchmark approval. It must batch the remaining calendar by one week at a time, generate one Image 2 call per asset, keep versioned PNGs, validate every packet, visually inspect every PNG, and stop for a contact-sheet review after each 14-post week. Do not include automatic publishing; publishing requires a separate explicit user request.

- [ ] **Step 6: Commit the production handoff plan**

```bash
git add docs/superpowers/plans/2026-08-18-50plus-food-wonder-lab-production.md
git commit -m "docs: plan 50plus food lab production"
```

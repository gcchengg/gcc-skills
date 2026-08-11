# LOFTER × X Anime Hotspot Skill Implementation Plan

> **Authoritative final-review update:** The [Final-review amendment](#final-review-amendment-2026-08-11) supersedes conflicting schemas, commands, quotas, disclosure rules, and test counts in the historical task bodies below.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable local Skill that scores X/LOFTER anime hotspot candidates, validates image authorization records, and generates compliant LOFTER content packets for the approved 30-day operating workflow.

**Architecture:** Use a semi-automated, file-based workflow for the first 30-day validation cycle. Operators collect current X and LOFTER signals into JSON, Python standard-library scripts rank candidates and enforce authorization gates, and a content-packet generator produces a Markdown brief for human review; scraping and automatic publishing remain out of scope until the workflow has real account data.

**Tech Stack:** Codex Skill Markdown, Python 3 standard library, `unittest`, JSON, Markdown.

## Global Constraints

- Maintain exactly 2 long-term IP slots, 2 rising IP slots, and 1 experiment slot.
- A candidate requires a score of at least 70/100 to enter the publication queue.
- Score weights are X growth 30, LOFTER activity 30, IP-pool match 15, authorization completeness 15, and story potential 10.
- A candidate without authorized media may still be analyzed, but authorization contributes 0 points and the packet must request an independently created image.
- Do not generate fan fiction until world, character, relationship, CP naming/position, and fandom-risk research are verified.
- Direct X image reuse requires explicit LOFTER redistribution authorization.
- Image-to-image use requires explicit AI adaptation authorization.
- Commercial use defaults to false unless explicitly authorized.
- AI-assisted public content must end with `图像经授权使用，含AI辅助创作｜#AI辅助#` when authorized AI-assisted images are used.
- The first 30 days do not use hard paywall cliffhangers.
- Do not automate platform posting in this implementation.

---

## File Structure

```text
lofter-x-anime-hotspot/
├── SKILL.md                              # User-facing workflow and routing rules
├── agents/
│   └── openai.yaml                      # Skill display metadata
├── references/
│   ├── content-templates.md             # Three approved LOFTER column templates
│   └── operating-rules.md               # IP pool, cadence, metrics, and review gates
├── templates/
│   ├── candidates.example.json          # Candidate input example
│   └── authorizations.example.json      # Authorization ledger example
├── scripts/
│   ├── score_candidates.py              # Candidate validation and weighted ranking
│   ├── validate_authorizations.py       # Media-use authorization gate
│   └── build_content_packet.py          # Markdown brief generator
└── tests/
    ├── test_score_candidates.py
    ├── test_validate_authorizations.py
    └── test_build_content_packet.py
```

Each script has one responsibility and communicates through JSON-compatible dictionaries. `score_candidates.py` never decides media legality, `validate_authorizations.py` never ranks content, and `build_content_packet.py` consumes both results without reimplementing either rule set.

---

### Task 1: Weighted Hotspot Scoring

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/score_candidates.py`
- Create: `lofter-x-anime-hotspot/tests/test_score_candidates.py`

**Interfaces:**
- Consumes: candidate dictionaries with `id`, `title`, `ip_slot`, `x_growth`, `lofter_activity`, `ip_match`, `authorization`, and `story_potential`.
- Produces: `score_candidate(candidate: dict) -> dict` and `rank_candidates(candidates: list[dict], threshold: int = 70) -> list[dict]`.

- [ ] **Step 1: Write the failing scorer tests**

```python
# lofter-x-anime-hotspot/tests/test_score_candidates.py
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


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v
```

Expected: `ModuleNotFoundError: No module named 'score_candidates'`.

- [ ] **Step 3: Implement the scorer**

```python
# lofter-x-anime-hotspot/scripts/score_candidates.py
import argparse
import json
from pathlib import Path


LIMITS = {
    "x_growth": 30,
    "lofter_activity": 30,
    "ip_match": 15,
    "authorization": 15,
    "story_potential": 10,
}
VALID_IP_SLOTS = {"long_term", "rising", "experiment"}


def score_candidate(candidate: dict) -> dict:
    required = {"id", "title", "ip_slot", *LIMITS.keys()}
    missing = sorted(required - candidate.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")
    if candidate["ip_slot"] not in VALID_IP_SLOTS:
        raise ValueError("ip_slot must be long_term, rising, or experiment")
    for field, maximum in LIMITS.items():
        value = candidate[field]
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError(f"{field} must be an integer")
        if not 0 <= value <= maximum:
            raise ValueError(f"{field} must be between 0 and {maximum}")
    total = sum(candidate[field] for field in LIMITS)
    return {
        **candidate,
        "total_score": total,
        "eligible": total >= 70,
        "media_instruction": (
            "use_authorized_media"
            if candidate["authorization"] > 0
            else "create_independent_image"
        ),
    }


def rank_candidates(candidates: list[dict], threshold: int = 70) -> list[dict]:
    scored = [score_candidate(candidate) for candidate in candidates]
    return sorted(
        (item for item in scored if item["total_score"] >= threshold),
        key=lambda item: (-item["total_score"], item["id"]),
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    candidates = json.loads(args.input.read_text(encoding="utf-8"))
    result = rank_candidates(candidates)
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run the scorer tests and verify success**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py -v
```

Expected: `Ran 3 tests` and `OK`.

- [ ] **Step 5: Commit the scorer**

```bash
git add lofter-x-anime-hotspot/scripts/score_candidates.py lofter-x-anime-hotspot/tests/test_score_candidates.py
git commit -m "feat: add LOFTER hotspot scorer"
```

---

### Task 2: Authorization Ledger Gate

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/validate_authorizations.py`
- Create: `lofter-x-anime-hotspot/tests/test_validate_authorizations.py`

**Interfaces:**
- Consumes: authorization records with `asset_id`, `author_handle`, `source_url`, `evidence_path`, `lofter_redistribution`, `ai_adaptation`, and `commercial_use`.
- Produces: `validate_authorization(record: dict, usage: str, commercial: bool = False) -> dict`; `usage` is `original` or `ai_adaptation`.

- [ ] **Step 1: Write the failing authorization tests**

```python
# lofter-x-anime-hotspot/tests/test_validate_authorizations.py
import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1] / "scripts"))

from validate_authorizations import validate_authorization


BASE = {
    "asset_id": "asset-1",
    "author_handle": "@artist",
    "source_url": "https://x.com/artist/status/1",
    "evidence_path": "authorizations/asset-1.png",
    "lofter_redistribution": True,
    "ai_adaptation": True,
    "commercial_use": False,
}


class AuthorizationTest(unittest.TestCase):
    def test_ai_adaptation_is_allowed(self):
        result = validate_authorization(BASE, "ai_adaptation")
        self.assertTrue(result["allowed"])
        self.assertEqual(result["asset_id"], "asset-1")

    def test_ai_adaptation_requires_explicit_scope(self):
        record = {**BASE, "ai_adaptation": False}
        with self.assertRaisesRegex(ValueError, "AI adaptation is not authorized"):
            validate_authorization(record, "ai_adaptation")

    def test_commercial_use_defaults_to_denied(self):
        with self.assertRaisesRegex(ValueError, "commercial use is not authorized"):
            validate_authorization(BASE, "original", commercial=True)

    def test_original_requires_lofter_permission(self):
        record = {**BASE, "lofter_redistribution": False}
        with self.assertRaisesRegex(ValueError, "LOFTER redistribution is not authorized"):
            validate_authorization(record, "original")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the tests and verify failure**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v
```

Expected: `ModuleNotFoundError: No module named 'validate_authorizations'`.

- [ ] **Step 3: Implement the authorization validator**

```python
# lofter-x-anime-hotspot/scripts/validate_authorizations.py
import argparse
import json
from pathlib import Path


REQUIRED = {
    "asset_id",
    "author_handle",
    "source_url",
    "evidence_path",
    "lofter_redistribution",
    "ai_adaptation",
    "commercial_use",
}


def validate_authorization(record: dict, usage: str, commercial: bool = False) -> dict:
    missing = sorted(REQUIRED - record.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")
    if usage not in {"original", "ai_adaptation"}:
        raise ValueError("usage must be original or ai_adaptation")
    if not record["lofter_redistribution"]:
        raise ValueError("LOFTER redistribution is not authorized")
    if usage == "ai_adaptation" and not record["ai_adaptation"]:
        raise ValueError("AI adaptation is not authorized")
    if commercial and not record["commercial_use"]:
        raise ValueError("commercial use is not authorized")
    return {
        "asset_id": record["asset_id"],
        "allowed": True,
        "usage": usage,
        "commercial": commercial,
        "author_handle": record["author_handle"],
        "source_url": record["source_url"],
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("ledger", type=Path)
    parser.add_argument("asset_id")
    parser.add_argument("--usage", choices=("original", "ai_adaptation"), required=True)
    parser.add_argument("--commercial", action="store_true")
    args = parser.parse_args()
    records = json.loads(args.ledger.read_text(encoding="utf-8"))
    matches = [record for record in records if record.get("asset_id") == args.asset_id]
    if len(matches) != 1:
        raise SystemExit(f"expected one authorization record for {args.asset_id}")
    result = validate_authorization(matches[0], args.usage, args.commercial)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

- [ ] **Step 4: Run authorization tests and verify success**

Run:

```bash
python3 -m unittest lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v
```

Expected: `Ran 4 tests` and `OK`.

- [ ] **Step 5: Commit the authorization gate**

```bash
git add lofter-x-anime-hotspot/scripts/validate_authorizations.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py
git commit -m "feat: validate LOFTER media authorization"
```

---

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

### Task 4: Skill Instructions and Operating References

**Files:**
- Create: `lofter-x-anime-hotspot/SKILL.md`
- Create: `lofter-x-anime-hotspot/agents/openai.yaml`
- Create: `lofter-x-anime-hotspot/references/content-templates.md`
- Create: `lofter-x-anime-hotspot/references/operating-rules.md`

**Interfaces:**
- Consumes: the three scripts created in Tasks 1—3.
- Produces: a discoverable Skill workflow that routes hotspot analysis, authorization checks, background research, and content-packet generation.

- [ ] **Step 1: Create the Skill entry point**

```markdown
---
name: lofter-x-anime-hotspot
description: Analyze current anime, game, character, and CP hotspots across X and LOFTER, rank candidates, verify media authorization, and create Chinese LOFTER trend or fan-fiction content packets. Use when the user wants hotspot-driven LOFTER anime content, X-to-LOFTER curation, or a 30-day LOFTER growth workflow.
---

# LOFTER × X Anime Hotspot

Use Chinese when communicating with the user.

## Workflow

1. Collect current 24—72 hour X and LOFTER evidence for candidate topics.
2. Maintain 2 `long_term`, 2 `rising`, and 1 `experiment` IP slots.
3. Save candidate values using `templates/candidates.example.json` as the schema.
4. Run `python3 scripts/score_candidates.py INPUT --output ranked.json`.
5. Reject candidates below 70. A candidate with authorization score 0 may use only an independently created image.
6. For original or AI-adapted X images, record authorization using `templates/authorizations.example.json`, then run `python3 scripts/validate_authorizations.py LEDGER ASSET_ID --usage original|ai_adaptation`.
7. Before fan fiction, verify world, characters, relationships, CP conventions, and fandom risks. If any check is incomplete, produce hotspot analysis instead.
8. Generate the Markdown brief with `python3 scripts/build_content_packet.py INPUT --output packet.md`.
9. Human-review facts, tags, labels, image scope, and the single interaction question before publication.
10. Never publish automatically.

## Required Rules

- Read `references/operating-rules.md` before ranking or scheduling.
- Read `references/content-templates.md` before drafting public copy.
- Do not treat a public X post as permission.
- AI adaptation requires explicit AI adaptation authorization.
- Commercial use is false unless the authorization record says true.
- Keep authorization evidence in the private ledger; do not expose private evidence in public copy.
- For authorized AI-assisted images, end public copy with `图像经授权使用，含AI辅助创作｜#AI辅助#`.
- Do not add irrelevant trending tags or hard paywall cliffhangers during the first 30 days.
```

- [ ] **Step 2: Create display metadata**

```yaml
# lofter-x-anime-hotspot/agents/openai.yaml
interface:
  display_name: "LOFTER × X 二次元热点"
  short_description: "双平台热点选题、授权校验与LOFTER内容包"
  default_prompt: "分析当前 X 与 LOFTER 的二次元交叉热点，按规则评分并生成可审核的 LOFTER 内容包。"
```

- [ ] **Step 3: Write exact public content templates**

```markdown
# Content Templates

## 今日热度异动

标题：`【IP/角色】过去24小时为什么突然升温？`

结构：100字内说明事件；给出X增长信号；说明LOFTER讨论差异；提供一个原创判断；结尾只问一个选择题式问题。

## 本周二次元趋势

标题：`本周二次元趋势｜5个正在升温的角色与CP`

结构：先给结论；按热度列5项；每项包含X信号、LOFTER信号和持续性判断；结尾询问下周希望跟踪哪一项。

## 热点脑洞实验室

标题：`【IP｜CP】一句冲突或悬念`

结构：前100字建立冲突；正文保持核验后的人设与关系；提供完整首篇体验；不设置强付费截断；结尾询问是否继续该分支。

## 极简声明

授权AI辅助图：`图像经授权使用，含AI辅助创作｜#AI辅助#`

独立原创图：按实际AI参与情况使用平台要求的 `#AI辅助#` 或 `#AI生成#` 标识，不写“经授权使用”。
```

- [ ] **Step 4: Write the operating rules**

```markdown
# Operating Rules

## IP Pool

- `long_term`: 2 slots, evaluate monthly, observe at least four weeks.
- `rising`: 2 slots, evaluate weekly, replace after two weeks below the account median.
- `experiment`: 1 slot, replace weekly based on events and results.

## Weekly Cadence

- 3 daily hotspot observations.
- 2 authorized image-curation or meaningful AI-adaptation posts.
- 1 weekly trend report.
- 1 verified fan-fiction short.
- Publish one post per day; allow at most one extra breaking-hotspot post.

## Fan-fiction Gate

All five checks must be true: world, characters, relationships, CP conventions, and fandom risks. Otherwise publish only analysis.

## Review Metrics

Weeks 1—2 establish the account baseline. From week 3, calculate relative performance using follow conversion 35%, save rate 25%, comment rate 20%, and like rate 20%. Top-40% hotspots may become fan fiction; top-20% fan-fiction posts may become collections.

## Publication Review

Confirm score ≥70, accurate tags, one interaction question, no hard paywall, valid authorization for reused media, correct AI label, and no unsupported factual claim.
```

- [ ] **Step 5: Validate the Skill files and commit**

Run:

```bash
python3 - <<'PY'
from pathlib import Path

root = Path("lofter-x-anime-hotspot")
required = [
    root / "SKILL.md",
    root / "agents/openai.yaml",
    root / "references/content-templates.md",
    root / "references/operating-rules.md",
]
missing = [str(path) for path in required if not path.is_file()]
assert not missing, missing
skill = (root / "SKILL.md").read_text(encoding="utf-8")
assert "name: lofter-x-anime-hotspot" in skill
assert "Never publish automatically" in skill
assert "图像经授权使用，含AI辅助创作｜#AI辅助#" in skill
print("skill files valid")
PY
```

Expected: `skill files valid`.

Commit:

```bash
git add lofter-x-anime-hotspot/SKILL.md lofter-x-anime-hotspot/agents/openai.yaml lofter-x-anime-hotspot/references
git commit -m "feat: add LOFTER anime hotspot skill workflow"
```

---

### Task 5: Example Inputs and End-to-End Verification

**Files:**
- Create: `lofter-x-anime-hotspot/templates/candidates.example.json`
- Create: `lofter-x-anime-hotspot/templates/authorizations.example.json`

**Interfaces:**
- Consumes: the CLI commands from Tasks 1—3.
- Produces: reproducible sample files and a verified content packet in a temporary directory.

- [ ] **Step 1: Create the candidate example**

```json
[
  {
    "id": "example-hotspot-1",
    "title": "示例角色纪念日创作增长",
    "ip_name": "示例IP",
    "ip_slot": "rising",
    "characters": ["角色A", "角色B"],
    "tags": ["示例IP", "角色A"],
    "x_growth": 27,
    "lofter_activity": 24,
    "ip_match": 15,
    "authorization": 15,
    "story_potential": 8,
    "x_evidence": "近24小时相关公开帖互动与创作数量集中增长",
    "lofter_evidence": "对应标签出现持续更新和有效互动"
  },
  {
    "id": "example-hotspot-2",
    "title": "示例长线角色剧情讨论升温",
    "ip_name": "示例IP长线",
    "ip_slot": "long_term",
    "characters": ["角色C", "角色D"],
    "tags": ["示例IP长线", "角色C"],
    "x_growth": 23,
    "lofter_activity": 21,
    "ip_match": 14,
    "authorization": 12,
    "story_potential": 9,
    "x_evidence": "近24小时剧情解析和角色讨论保持稳定增长",
    "lofter_evidence": "对应角色标签持续有高质量二创更新"
  },
  {
    "id": "example-hotspot-3",
    "title": "示例长线剧情节点回顾热度",
    "ip_name": "示例IP长线",
    "ip_slot": "long_term",
    "characters": ["角色E", "角色F"],
    "tags": ["示例IP长线", "角色E"],
    "x_growth": 22,
    "lofter_activity": 20,
    "ip_match": 14,
    "authorization": 12,
    "story_potential": 8,
    "x_evidence": "关键剧情节点引发公开帖的回顾与讨论",
    "lofter_evidence": "剧情相关标签出现连续创作和评论互动"
  },
  {
    "id": "example-hotspot-4",
    "title": "示例新角色二创关注上升",
    "ip_name": "示例IP新星",
    "ip_slot": "rising",
    "characters": ["角色G", "角色H"],
    "tags": ["示例IP新星", "角色G"],
    "x_growth": 25,
    "lofter_activity": 19,
    "ip_match": 13,
    "authorization": 11,
    "story_potential": 8,
    "x_evidence": "新角色相关公开帖的转发和创作分享增加",
    "lofter_evidence": "新角色标签新增图文二创并获得有效互动"
  },
  {
    "id": "example-hotspot-5",
    "title": "示例实验向设定讨论出现",
    "ip_name": "示例IP实验",
    "ip_slot": "experiment",
    "characters": ["角色I", "角色J"],
    "tags": ["示例IP实验", "角色I"],
    "x_growth": 21,
    "lofter_activity": 18,
    "ip_match": 12,
    "authorization": 10,
    "story_potential": 10,
    "x_evidence": "实验向设定在公开讨论中获得初步关注",
    "lofter_evidence": "小众设定标签出现连续的创作尝试"
  }
]
```

- [ ] **Step 2: Create the authorization example**

```json
[
  {
    "asset_id": "example-asset-1",
    "author_handle": "@authorized_artist",
    "source_url": "https://x.com/authorized_artist/status/example",
    "evidence_path": "authorizations/example-asset-1.png",
    "lofter_redistribution": true,
    "ai_adaptation": true,
    "commercial_use": false
  }
]
```

- [ ] **Step 3: Run all unit tests**

Run:

```bash
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v
```

Expected: `Ran 11 tests` and `OK`.

- [ ] **Step 4: Run the scoring and authorization smoke test**

Run:

```bash
tmp_dir="$(mktemp -d)"
python3 lofter-x-anime-hotspot/scripts/score_candidates.py \
  lofter-x-anime-hotspot/templates/candidates.example.json \
  --output "$tmp_dir/ranked.json"
python3 lofter-x-anime-hotspot/scripts/validate_authorizations.py \
  lofter-x-anime-hotspot/templates/authorizations.example.json \
  example-asset-1 --usage ai_adaptation > "$tmp_dir/asset.json"
python3 - "$tmp_dir" <<'PY'
import json
import sys
from pathlib import Path

root = Path(sys.argv[1])
candidate = json.loads((root / "ranked.json").read_text(encoding="utf-8"))[0]
asset = json.loads((root / "asset.json").read_text(encoding="utf-8"))
payload = {
    "candidate": candidate,
    "column": "daily_hotspot",
    "research": {},
    "asset": asset,
}
(root / "packet-input.json").write_text(
    json.dumps(payload, ensure_ascii=False, indent=2),
    encoding="utf-8",
)
PY
python3 lofter-x-anime-hotspot/scripts/build_content_packet.py \
  "$tmp_dir/packet-input.json" --output "$tmp_dir/packet.md"
rg -n "总分：89/100|#AI辅助#|互动问题：" "$tmp_dir/packet.md"
```

Expected: three matching lines, including `总分：89/100`, `互动问题：`, and `#AI辅助#`.

- [ ] **Step 5: Commit examples and run final verification**

```bash
git add lofter-x-anime-hotspot/templates
git commit -m "test: add LOFTER hotspot workflow examples"
python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v
git status --short
```

Expected: all 11 tests pass. `git status --short` may show pre-existing unrelated user changes, but none of the paths under `lofter-x-anime-hotspot/` are modified or untracked.

---

## Deferred Work

The following items are intentionally excluded until the 30-day account test establishes real value and platform-safe operating data:

- Automated X or LOFTER scraping;
- Automatic LOFTER login or publishing;
- Automatic image downloading or image-to-image generation;
- Automatic CP selection without human verification;
- Monetization, paywall, advertising, or commercial-use workflows;
- Dashboarding beyond JSON and Markdown artifacts.

---

## Final-review amendment (2026-08-11)

This amendment is authoritative. Earlier task bodies remain as implementation history only.

### Corrected architecture and schemas

- Model the IP pool in `templates/ip-pool.example.json` as exactly five unique IPs: two `long_term`, two `rising`, and one `experiment`. Validate the pool independently, then rank any number of eligible topic candidates without per-category topic quotas.
- Require every candidate to exact-match its pool `ip_id`, `ip_name`, and `ip_slot`. Use one shared typed candidate contract for identity, characters/tags, bounded score dimensions, X/LOFTER evidence, HTTPS X sources, ISO observation time, and media intent.
- Use one fixed publication threshold, 70. The numeric `authorization` score is a research-quality dimension only and never authorizes media use.
- Represent media intent with nullable `asset_id`, `requested_usage`, strict `commercial_intent`, and one of the five explicit provenance values. Reject inconsistent combinations before scoring.
- Validate complete authorization records: strict permission booleans, LOFTER platform scope, valid source/evidence, attribution mode, original/derived lineage, requested translation/crop/layout operations, and publication history. Resolve relative evidence paths against the ledger directory.
- Bind packet authorization to the validator decision's schema marker, allow flag, exact asset ID, requested usage, commercial scope, provenance, and LOFTER platform. Packet generation reopens the named ledger, revalidates local evidence, regenerates the decision, and rejects incomplete or forged allow dictionaries.
- Generate four structural human-review packet shapes only: one 200–400-character daily hotspot, exactly five-item weekly trend, one media-curation item, or one qualified 800–2000-character fan-fiction item. Each packet contains exactly one column-specific interaction question and no generated public prose.
- Gate fan fiction on all five research checks, prior LOFTER observation URL/date, and either explicit weeks 1–2 baseline selection or week 3+ top-40% qualification.
- Apply exact disclosures: none for authorized/human originals; authorized AI adaptation uses `图像经授权使用，含AI辅助创作｜#AI辅助#`; independent AI-assisted/generated originals use only `#AI辅助#`/`#AI生成#`.

### Corrected portable workflow

Set `LOFTER_SKILL_DIR` to the absolute Skill directory (the default installation expression and exact end-to-end commands are in `SKILL.md`). The corrected scorer command requires the separate pool:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/score_candidates.py" \
  "$LOFTER_SKILL_DIR/templates/candidates.example.json" \
  --ip-pool "$LOFTER_SKILL_DIR/templates/ip-pool.example.json" \
  --output "$LOFTER_WORK_DIR/ranked.json"
```

Capture one validator decision with a literal usage value, then construct a column-specific input matching `templates/packet-inputs.example.json`:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/validate_authorizations.py" \
  "$LOFTER_SKILL_DIR/templates/authorizations.example.json" \
  example-asset-adapted-1 \
  --usage ai_adaptation \
  --operation layout \
  > "$LOFTER_WORK_DIR/authorization.json"

python3 "$LOFTER_SKILL_DIR/scripts/build_content_packet.py" \
  "$LOFTER_WORK_DIR/packet-input.json" \
  --output "$LOFTER_WORK_DIR/packet.md"
```

Human review and manual publication remain mandatory.

### Final verification count

The final suite contains **44 tests**. The authoritative verification commands are:

```bash
PYTHONPATH=/private/tmp/lofter-skill-validator-deps \
  python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v

PYTHONPATH=/private/tmp/lofter-skill-validator-deps \
  python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py \
  lofter-x-anime-hotspot
```

The temporary `PYTHONPATH` supplies PyYAML required by the official validator in this development environment; it is not a runtime dependency of the Skill scripts.

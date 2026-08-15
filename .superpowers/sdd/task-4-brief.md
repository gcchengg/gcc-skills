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


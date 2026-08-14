# LOFTER 新星太太首篇图片帖 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成并按双确认流程发布一篇带 `新星太太` 标签、以当前热门 IP 为主题的 LOFTER 原生三图短帖。

**Architecture:** 完全复用 `lofter-x-anime-hotspot` 的现有运行状态、选题、草稿、预览与发布门禁模块。私有研究证据和媒体生成记录进入固定运行目录，公开上传只使用锁定的 `upload-manifest.json`；浏览器操作严格停在两次确认边界。

**Tech Stack:** Python 3 标准库、现有 `lofter-x-anime-hotspot` Python 模块、Codex 应用内浏览器、OpenAI imagegen。

## Global Constraints

- 本次只生成并发布一篇作品。
- 任务截图只用于确认活动要求，不进入公开草稿或媒体清单。
- 先研究当前 24 小时 X 与 LOFTER；排除最近刚发布过的吉伊卡哇与温迪。
- 使用 LOFTER 原生图片帖，三张原创竖图，封面必须排第一。
- 正文为 120–180 个非空白字符，包含一个自然互动问题。
- 提供三个标题和五个标签；五个标签中必须包含 `新星太太`。
- 不设置回礼，不使用无关热点标签。
- 精确 `确认发布` 只授权填写；精确 `确认最终提交` 只授权点击一次最终发布。

---

### Task 1: 建立运行并选择热点

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/status.json`
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/hotspot-analysis.json`

**Interfaces:**
- Consumes: 当前 24 小时的直接 X 帖 URL、直接 LOFTER 帖 URL，以及排除 IP 集合 `{"吉伊卡哇", "温迪"}`。
- Produces: `run_state.create_run(...) -> tuple[Path, dict]` 创建的运行目录，以及可被 `build_publishable_draft.build_draft` 读取的选题对象。

- [ ] **Step 1: 创建固定运行目录**

调用：

```python
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo
from run_state import create_run

run_dir, state = create_run(
    Path("/Users/guocc/Documents/guquan/github/gcc-skills/lofter-x-anime-hotspot/runs"),
    "new-star-hotspot-first-image-post",
    now=datetime(2026, 8, 14, 11, 36, 38, tzinfo=ZoneInfo("Asia/Shanghai")),
)
```

Expected: `state["state"] == "researching"`，且运行 ID 为 `20260814-113638-new-star-hotspot-first-image-post`。

- [ ] **Step 2: 收集跨平台直接证据**

在已登录的 Codex 应用内浏览器中搜索当前 24 小时 X 与 LOFTER。每个候选记录至少两条直接 `https://x.com/.../status/...` URL 和一条直接 LOFTER 帖 URL，记录观察时间与页面可见互动指标；排除吉伊卡哇和温迪。

Expected: 至少一个候选满足跨平台直接来源要求；否则按现有 Skill 规则扩展至 72 小时，仍不足则停止。

- [ ] **Step 3: 运行现有选择器并保存结果**

使用 `select_publishable_topic.select_topic` 对候选执行确定性选择，并使用：

```python
from run_state import write_json_atomic
write_json_atomic(run_dir / "hotspot-analysis.json", selector_result)
```

Expected: `candidate.eligible == true`、`time_window_hours` 为 `24` 或带完整扩展链的 `72`，且所选 IP 不在排除集合中。

- [ ] **Step 4: 检查私有研究文件**

Run:

```bash
python3 -m json.tool lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/hotspot-analysis.json
```

Expected: exit 0；文件包含选择理由、X 来源、LOFTER 来源与观察时间，不包含登录凭证。

### Task 2: 生成三图短帖与本地预览

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/generated-media/01.png`
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/generated-media/02.png`
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/generated-media/03.png`
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/draft-input.json`
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/preview.html`

**Interfaces:**
- Consumes: Task 1 的合格选题与 `content_mode`。
- Produces: `build_publishable_draft.build_draft(run_dir, payload) -> dict` 验证后的草稿和 `render_preview.render_preview(run_dir) -> Path` 返回的本地预览。

- [ ] **Step 1: 生成三个独立竖版视觉**

使用 imagegen 进行三次文本生成，不传入收益中心截图或其他参考图。三张图分别承担封面、情境展开、互动收束；每张图的 `source_media_ids` 固定为空列表。

Expected: 三个 PNG 文件构图不同、主题连贯、没有水印；封面在缩略图尺寸下仍能辨认主体。

- [ ] **Step 2: 编写短帖载荷**

基于 Task 1 的最终候选直接编写 `payload`：三个标题必须分别采用“角色进入新情境”“冲突或反差”“互动邀请”三个角度；五个标签依次覆盖 `新星太太`、所选 IP、核心角色、对应活动或梗、`动漫图片`。生成后执行以下断言：

```python
assert payload["content_format"] == "image_post"
assert payload["authorized_media_intent"] is False
assert payload["ai_assistance"] is True
assert len(payload["titles"]) == len(set(payload["titles"])) == 3
assert len(payload["tags"]) == len(set(payload["tags"])) == 5
assert payload["tags"][0] == "新星太太"
assert payload["tags"][4] == "动漫图片"
assert [item["role"] for item in payload["media"]] == ["cover", "body", "body"]
assert all(item["kind"] == "generated_original" for item in payload["media"])
```

正文必须包含 120–180 个非空白字符，以一个自然互动问句收束。标签中的 IP、角色与活动或梗必须与 Task 1 的最终候选精确对应。

- [ ] **Step 3: 安装草稿并渲染预览**

调用：

```python
from build_publishable_draft import build_draft
from render_preview import render_preview

state = build_draft(run_dir, payload)
preview_path = render_preview(run_dir)
```

Expected: `state["state"] == "authorization_review"`；`preview_path` 精确指向运行目录下的 `preview.html`。

- [ ] **Step 4: 执行轻量校验**

Run:

```bash
python3 -c 'import json; from pathlib import Path; d=Path("lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post"); p=json.loads((d/"draft-input.json").read_text()); assert p["content_format"]=="image_post"; assert len(p["titles"])==3; assert len(p["tags"])==5; assert "新星太太" in p["tags"]; assert len(p["media"])==3; assert p["media"][0]["role"]=="cover"; print("preview-ready")'
```

Expected: `preview-ready`。

### Task 3: 第一次确认后填写 LOFTER

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/upload-manifest.json`
- Modify: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/status.json`

**Interfaces:**
- Consumes: 用户针对本运行发送的精确 `确认发布`。
- Produces: 锁定的上传清单和 `publication_gate.mark_form_filled` 保存的平台预览证据。

- [ ] **Step 1: 通过第一次门禁**

调用 `publication_gate.approve_form_fill(run_dir, "确认发布")`，再调用 `build_upload_manifest(run_dir)` 并原子写入 `upload-manifest.json`。

Expected: 状态为 `approved`，`confirmations.fill == true`。

- [ ] **Step 2: 填写原生图片发布器**

仅使用 Codex 应用内浏览器打开 `https://www.lofter.com/#publish=photo`。按清单顺序先上传 `01.png`，观察其为第一张，再上传 `02.png`、`03.png`；填写短文和五个标签，不打开回礼设置。

Expected: 页面显示三个按清单顺序排列的图片缩略图，标签中包含 `新星太太`。

- [ ] **Step 3: 保存最终按钮前证据**

核对图片数、图片顺序、正文、五个标签和可见的“发布”按钮，再调用 `publication_gate.mark_form_filled`。

Expected: 状态为 `publishing`，`confirmations.submit == false`；停止并请求精确 `确认最终提交`。

### Task 4: 第二次确认后单次提交

**Files:**
- Modify: `lofter-x-anime-hotspot/runs/20260814-113638-new-star-hotspot-first-image-post/status.json`

**Interfaces:**
- Consumes: 用户针对已填表单发送的精确 `确认最终提交`。
- Produces: `publication_gate.record_publication` 保存的 LOFTER HTTPS 帖子 URL 与发布时间。

- [ ] **Step 1: 重新核对锁定内容**

重新加载状态、`upload-manifest.json` 与当前图片发布页，确认三图、短文、五标签、`新星太太` 标签和原生 `#publish=photo` 路由均未变化。

Expected: 页面投影与锁定清单一致。

- [ ] **Step 2: 记录最终确认并点击一次**

调用 `publication_gate.approve_final_submit(run_dir, "确认最终提交")`，随后只点击一次 LOFTER“发布”按钮。

Expected: 页面明确出现新帖或审核中提示；不得二次点击。

- [ ] **Step 3: 归档发布结果**

页面返回新帖 HTTPS URL 时，调用：

```python
from publication_gate import record_publication
record_publication(
    run_dir,
    {"lofter_url": observed_url, "published_at": observed_time},
)
```

Expected: `status.json` 中 `state == "published"`，并保存精确 LOFTER URL；若结果不确定，记录 `{"result": "uncertain"}` 并只读检查，不重试提交。

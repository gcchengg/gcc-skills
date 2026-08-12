# LOFTER 优先热点图文 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 基于 LOFTER 近 24 小时真实活跃信号和 X 补充证据，生成一篇可审核的二次元图文预览。

**Architecture:** LOFTER 研究先产生候选，X 只为这些候选补证；确定性选择器负责来源数量、时效和评分门槛。通过后才创建单篇草稿、媒体账本和本地 HTML 预览。

**Tech Stack:** LOFTER 与 X 只读浏览、Python 3、`lofter-x-anime-hotspot` 确定性脚本、HTML 本地预览。

## Global Constraints

- LOFTER 是选题主信号，X 是补充信号。
- 先查近 24 小时；不足时仅扩展到 72 小时。
- 至少一条直接 LOFTER URL、两条直接 X URL、候选评分不低于 70。
- 只生成一篇 800–1500 字中文图文、三个标题、8–12 个标签、一张封面和最多两张正文图。
- 只生成本地预览，不打开或填写 LOFTER。

---

### Task 1: LOFTER 站内候选研究

**Files:**
- Create: `lofter-x-anime-hotspot/runs/<run-id>/sources/lofter-research.json`

**Interfaces:**
- Produces: 带直接 URL、发布时间、可见互动和观察摘要的 LOFTER 候选列表。

- [ ] 检查 LOFTER 热门活动、标签与公开帖子，优先近 24 小时。
- [ ] 记录可核验的直接帖子 URL；无法确认发布时间或内容的页面不得作为时效证据。
- [ ] 按站内参与性、作品识别度和新账号可切入性列出最多五个候选。

### Task 2: X 补证与确定性选题

**Files:**
- Create: `lofter-x-anime-hotspot/runs/<run-id>/hotspot-analysis.json`
- Modify: `lofter-x-anime-hotspot/runs/<run-id>/status.json`

**Interfaces:**
- Consumes: Task 1 的 LOFTER 候选。
- Produces: `select_publishable_topic.select_topic(payload: dict) -> dict` 可验证的唯一选题。

- [ ] 只针对 LOFTER 候选搜索近 24 小时 X 讨论，每个候选保留至少两条直接 URL。
- [ ] 构造五槽 IP 池和候选评分输入，运行确定性选择器。
- [ ] 24 小时不足时记录原因并扩展至 72 小时；仍不足则停止，不生成文章。
- [ ] 将选择结果和私有研究账本原子写入运行目录。

### Task 3: 图文、媒体与预览

**Files:**
- Create: `lofter-x-anime-hotspot/runs/<run-id>/article.md`
- Create: `lofter-x-anime-hotspot/runs/<run-id>/titles-and-tags.md`
- Create: `lofter-x-anime-hotspot/runs/<run-id>/sources/media-ledger.json`
- Create: `lofter-x-anime-hotspot/runs/<run-id>/publication-order.md`
- Create: `lofter-x-anime-hotspot/runs/<run-id>/preview.html`

**Interfaces:**
- Consumes: Task 2 唯一选题。
- Produces: `build_publishable_draft.build_draft(run_dir, payload)` 验证后的草稿和 `render_preview.render_preview(run_dir)` 返回的预览路径。

- [ ] 写作时在前 120 字交代新事件，以一个角色或 CP 冲突展开，并以二选一问题结尾。
- [ ] 生成或准备一张高识别封面和至多两张正文图，记录完整来源或独立生成信息、大小与 SHA-256。
- [ ] 运行草稿构建器并渲染 HTML 预览。
- [ ] 进行一次轻量检查：运行状态为 `authorization_review`、媒体文件存在、预览可读取、三个标题和 8–12 个标签齐全。
- [ ] 向用户显示绝对预览路径，等待审核，不打开 LOFTER。

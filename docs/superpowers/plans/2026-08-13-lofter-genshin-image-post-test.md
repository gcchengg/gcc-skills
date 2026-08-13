# LOFTER 原神活动图片帖测试 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成一篇以温迪为主角、参加 LOFTER 当前画风活动的三图短文测试帖，并输出可审阅的本地预览。

**Architecture:** 使用现有 `lofter-x-anime-hotspot` 运行目录保存研究记录、三张独立生成图片、短文稿与预览。图片采用无参考图的文本生成，首图先于正文；预览完成后停在授权审阅阶段，不打开 LOFTER 发布器。

**Tech Stack:** LOFTER 站内只读浏览、内置 imagegen、现有 Python 运行状态与预览脚本、JSON/HTML。

## Global Constraints

- IP 为原神，角色为温迪，活动标签为 `所以我才把自己画成这种简单的风格`。
- 生成三张独立原创图片：一张竖版强首图和两张同主题补充图。
- 文案为 120–180 个中文字符，包含情境、笑点和一个互动问题。
- 标签固定为五个：`原神`、`温迪`、`原神同人`、活动完整标签、`梗图`。
- 不使用外部图片作为生成参考，不模仿具体创作者画风。
- 使用 `#AI生成#` 披露；首个有效内容节点必须为图片。
- 只输出本地预览，发布必须等待后续两次确认。

---

### Task 1: 固定站内活动证据与短帖文案

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/hotspot-analysis.json`
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/draft-input.json`

**Interfaces:**
- Consumes: LOFTER 活动直接页面及 `2026-08-13-lofter-genshin-image-post-test-design.md`。
- Produces: 一个主标题、两个备选标题、120–180 字文案、五个标签、三个确定的图片位置。

- [ ] **Step 1: 只读确认活动仍可参与**

打开活动直接页，记录活动名称、可见起止日期、浏览/参与数、观察时间与直接 URL；不使用 X 内容补足本轮站内活动测试。

- [ ] **Step 2: 写入短帖草稿**

草稿必须采用以下结构：角色遇到“必须把自己画简单”的任务；温迪用几笔把自己画成风精灵；结尾询问读者选择精致版还是极简版。正文末尾只出现一次 `#AI生成#`。

- [ ] **Step 3: 做轻量合同检查**

验证正文非空白字符数为 120–180、标签恰好五个、互动问号恰好一个、标题不含“分析/热点/为什么适合二创”等媒体文章措辞。

### Task 2: 生成三张独立原创图片

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/generated-media/01.png`
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/generated-media/02.png`
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/generated-media/03.png`
- Modify: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/hotspot-analysis.json`

**Interfaces:**
- Consumes: 三个文字构图说明，不含任何参考图、来源图或创作者风格名。
- Produces: 一张竖版对比封面、两张同角色轻梗补充图及对应 SHA-256、字节数、生成时间。

- [ ] **Step 1: 生成封面**

文本提示描述绿色吟游诗人少年在左侧以精致奇幻插画呈现，右侧是他亲手画出的极简圆润风精灵，构图强调左右对比、移动端缩略图识别和无文字画面。

- [ ] **Step 2: 生成两张补充图**

第二张表现精致角色一本正经展示极简自画像；第三张表现极简风精灵从画纸中活过来，形成轻喜剧收束。三张图保持色彩与角色特征连续，但画面构图不同。

- [ ] **Step 3: 检查媒体身份**

确认三个文件可读取、大小大于零、摘要互不相同，并记录 `independent`、空来源谱系和确定的发布顺序 1–3。

### Task 3: 构建并检查本地预览

**Files:**
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/state.json`
- Create: `lofter-x-anime-hotspot/runs/20260813-152012-genshin-venti-simple-style/preview.html`

**Interfaces:**
- Consumes: Task 1 文案与 Task 2 三张媒体文件。
- Produces: 状态为 `authorization_review` 的运行和一个可点击的本地 HTML 预览。

- [ ] **Step 1: 通过现有草稿构建函数安装内容**

将封面设为位置 1，两张补充图设为后续位置；保持一个主标题、两个候选标题、五个标签和一次披露。

- [ ] **Step 2: 渲染预览**

调用现有预览渲染器生成 `preview.html`，确保 HTML 不暴露研究账本路径、校验和或浏览器状态。

- [ ] **Step 3: 轻量核验**

检查预览中第一张媒体出现在标题/正文消费区顶部、共三张图片、正文字符数符合范围、五个标签与一个 `#AI生成#` 均可见。无需运行仓库全量测试。

- [ ] **Step 4: 交付审阅**

向用户显示绝对预览路径，并停止在 `authorization_review`；不打开 LOFTER，不点击任何发布控件。


---
name: xiaohongshu-food-anatomy
description: Generate and publish Xiaohongshu-ready food, spice, plant, or ingredient anatomy posts in Chinese. Use when the user provides or requests an ingredient and wants a scientific anatomy infographic, image prompt, caption, or direct Xiaohongshu publishing; archive all assets under /Users/apple/Documents/GitHub/gcc-skills/小红书解刨, then use the Codex in-app browser to publish the finished graphic note by default unless the user says not to publish; support revisions and publishing retries.
---

# Xiaohongshu Food Anatomy

## Workflow

Use Chinese by default.

When the user provides an ingredient:

1. Identify the ingredient and its real edible/useful structures.
2. Produce Step 1: an anatomy-style image generation prompt for that ingredient.
3. Immediately produce Step 2: the matching Xiaohongshu copy. Do not ask whether to continue.
4. Archive the generated prompt, copy, and generated image when available according to "Output Archive" below.
5. Publish the finished post according to "Xiaohongshu Publishing" below unless the user explicitly asks to only generate, preview, draft, or not publish.
6. If the user gives revision feedback, update only the requested part and preserve the established style unless they ask to change it.

When the user asks in Chinese for "生成一种食材", "随机生成一种食材", "帮我生成一个新的", or similar without naming an ingredient:

1. Directly choose one ingredient that is not in the generated history below.
2. Prefer visually dissectable ingredients with strong structure, texture, and flavor story.
3. Do not ask the user to choose unless the request gives conflicting constraints.
4. Generate the image prompt or image immediately according to the user's wording.
5. Also generate the Xiaohongshu copy in the same turn. Do not ask whether to continue.
6. Publish the finished post according to "Xiaohongshu Publishing" below unless the user explicitly opts out.

If the user asks to "generate image" rather than "generate image prompt", use the available image generation tool with the Step 1 prompt. If tool rules disallow text after image generation, wait for the next user message before providing any additional text, but still follow the archive requirements when possible.

## Output Archive

For each new generation, create an output folder under:

```text
/Users/apple/Documents/GitHub/gcc-skills/小红书解刨
```

Use a clear subfolder name that includes the ingredient and generation time, for example:

```text
YYYYMMDD-HHMM-{食材}-结构解剖
```

Inside that subfolder, save:

1. `小红书文案信息.txt` — the Step 2 titles, body, and tags.
2. `解刨图提示词.txt` — the full Step 1 image prompt.
3. `解刨图.png` — the generated anatomy image, copied from the image generation output path when an image is generated.
4. `发布记录.txt` — publishing status, time, visible account name, selected title, note URL or visible success evidence, and any failure reason.

If the current request only asks for a prompt and copy, create the first two files. If an image is generated later for the same ingredient/request, copy it into the same generation folder as `解刨图.png` when the folder can be identified; otherwise create a new timestamped folder and include all available materials.

## Xiaohongshu Publishing

Treat an invocation that asks this skill to generate a new finished item as a request to continue into the publishing workflow. Skip publishing when the user says `只生成`, `只预览`, `保存草稿`, `不发布`, or equivalent. A request to revise an already-published item does not authorize a replacement post unless the user also asks to republish.

Uploading a local image and submitting a public post are external side effects. At action time, immediately before the first upload or final publish action, ask for one concise confirmation that identifies the visible Xiaohongshu account, ingredient(s), image count, and selected title(s). Continue only after confirmation. One confirmation may cover a clearly enumerated batch. If the user changes the batch, account, title, image, visibility, or body after confirming, ask again for the changed scope.

Use the `browser:control-in-app-browser` skill and the Codex in-app browser only. Read that browser skill before the first browser action in a turn and follow its setup, documentation, and interaction rules. Use the official Xiaohongshu creator publishing page; do not use search-engine substitutes or a different browser surface.

For each ingredient, publish one image note:

1. Require `解刨图.png` and `小红书文案信息.txt` to exist and be non-empty. Generate the image before publishing if needed.
2. Read `发布记录.txt` if present. If it records a successful post for the same asset and title, do not post again unless the user explicitly asks to republish.
3. Open the official Xiaohongshu creator center in the in-app browser. Reuse its persistent signed-in session.
4. If signed out, open the login screen and ask the user to complete QR-code, SMS, or other authentication in the in-app browser. Never inspect cookies, local storage, passwords, or session files. Resume only after visible login success.
5. Start a new image/text note. Before uploading the archived `解刨图.png`, show the visible account and exact proposed item(s) to the user and obtain action-time confirmation as described above; then upload from the absolute path.
6. Use title option 1 by default. If it exceeds the platform limit, shorten it without changing its hook or meaning. Use only the selected title, not the numbered title list.
7. Put the正文 followed by the 10 tags in the body. Remove the archive headings such as `【正文】` and `【10个标签】` and do not include the unused title options.
8. Before the final click, inspect the visible preview and verify the account display name, image count and order, title, body, tags, and absence of duplicate uploads. Fix only clear entry or formatting errors.
9. Click the final publish control. If the platform presents a normal acknowledgement or confirmation directly tied to this requested post, complete it. Stop for CAPTCHAs, identity verification, policy warnings, account restrictions, ambiguous destructive choices, or any request to change visibility/audience beyond the normal default.
10. Verify success from a visible success message, creator-content list entry, or newly created note page. Capture the note URL when available.
11. Write `发布记录.txt` using the format below. Never claim success based only on clicking the button.

For multiple ingredients, publish them as separate notes in archive order. After each success, record it before starting the next. If one item is blocked by login, verification, rate limiting, or an account warning, stop the batch and preserve the remaining local deliverables without publishing them.

Use this record format:

```text
状态：发布成功 | 未发布 | 发布失败 | 需要用户操作
时间：YYYY-MM-DD HH:MM (Asia/Shanghai)
账号：页面可见的账号显示名；无法确认时写“未确认”
标题：实际提交的标题
图片：解刨图.png
链接：可见笔记链接；没有时写“页面未提供”
证据：可见成功提示或内容管理条目
备注：失败原因、登录要求或跳过原因
```

After publishing, report which items succeeded, which did not, the saved archive paths, and the visible URLs when available.

## Generated History

Avoid repeating these ingredients when the user asks for "一种食材" or "一个新的食材" unless they explicitly request one of them:

- 肉桂
- 林下参
- 花椒
- 陈皮
- 八角
- 草果
- 草莓
- 莲藕
- 丁香
- 豆蔻
- 小茴香
- 砂仁
- 良姜
- 罗汉果
- 枸杞
- 无花果
- 山楂
- 银耳
- 甘草
- 莲子
- 桂圆
- 柠檬
- 石榴
- 百合
- 香菇
- 松茸
- 辣椒
- 生姜
- 大蒜
- 洋葱
- 芋头
- 玉米
- 番茄
- 奇异果
- 火龙果
- 木耳
- 南瓜
- 红枣
- 杏仁
- 核桃
- 板栗
- 荸荠
- 竹笋
- 秋葵
- 苦瓜
- 茄子
- 胡萝卜
- 白萝卜

Good future candidates include but are not limited to: 海带、紫菜、腰果、开心果、榛子、花生、豌豆、毛豆、黄豆、绿豆、黑豆、燕麦、荞麦、红薯、土豆。

## Step 1: Image Prompt

Create a precise prompt for a "结构解剖信息图" in the style of anatomical teaching charts, botanical museum plates, food science diagrams, and medical teaching posters.

Use this structure:

```text
生成一张“{食材}结构解剖信息图”，风格参考人体骨骼解剖图、植物解剖图和医学教学挂图。将{食材}像解剖标本一样一层一层拆开，做成清晰的爆炸分解图、剖面图和局部放大图。

画面中心展示{食材}从外部形态到内部结构的分层：{结构列表}。每一层或每个关键组织都要被单独分离出来，悬浮排列，层次清楚，像人体解剖图那样一寸一寸拆开。

每个结构旁边都要有细致的引线标注区域，说明这部分是什么、有什么功能、和风味或使用价值有什么关系，例如保护作用、储藏作用、挥发性香气来源、辛香来源、主要食用/药食使用部位、干燥后变化、研磨后用途等。

整体要有强烈的科学展示感和教学感，像博物馆里的植物解剖教学图或高级食品科学图谱。视觉风格精密、清楚、理性、有秩序，构图像学术信息图，强调结构分析和功能解释，不要只是好看。

采用高级自然纸张背景、细腻线描、真实材质、轻微水彩或科学插画质感。主色调围绕{食材颜色}，保持专业、高级、克制，像顶级食品科学研究机构制作的教学海报。

请让版面清晰分区，包括：整体外观、分层爆炸图、纵向/横向剖面剖析、局部纹理放大、干燥或加工状态、粉末/切片/常见使用形态、功能说明区。

不要厨房场景，不要多余装饰，不要人手，不要器皿，不要无关食材，不要只做艺术海报。重点是“逐层解剖 + 功能解释 + 科学图示”。
```

Adapt `{结构列表}` to the ingredient. Do not blindly reuse cinnamon's bark anatomy for fruits, seeds, roots, leaves, fungi, or animal-derived foods.

For 草果, use structures such as:

- 外层果皮/果壳
- 纵向棱线和粗糙皱褶
- 中果皮纤维层
- 内果皮隔膜
- 三室果腔
- 种子团
- 单粒种子
- 种皮
- 胚乳/内含物
- 挥发油与辛香物质富集区域
- 干燥后的褐色果实形态
- 破壳后的种子状态
- 研磨后的草果粉

For other ingredients, select accurate visible and functional structures. If uncertain, use cautious terms like "主要香气富集区域" instead of overclaiming precise biochemical localization.

## Step 2: Xiaohongshu Copy

Generate copy immediately after the image prompt. Do not require confirmation.

Output:

1. `5个标题`
2. `1篇300-500字正文`
3. `10个小红书标签`

Writing persona:

- 顶级小红书内容策划
- 食品科学作家
- 艺术策展编辑

Account positioning:

```text
用人体解剖图的方式，一寸一寸拆开食物、香料和植物，解释它们的结构、功能、风味来源和使用价值。
```

Style:

- 高级、有艺术感、有知识密度、有画面感
- 短句、有段落、少量 emoji
- 像艺术展览说明 + 食品科学科普 + 小红书爆款文案
- 不要论文腔，不要普通百科，不要幼稚卖萌
- 先打破认知，再解释是什么，再按「结构 -> 功能 -> 风味/用途」推进
- 结尾要有诗意和记忆点，最后加一句互动提问

Use facts conservatively. For 草果, emphasize it is a dried fruit spice commonly used in braises, hot pots, stews, and spice blends; note its smoky, resinous, warm, slightly camphoraceous辛香 impression without making medical claims.

## Revision Handling

When the user is not satisfied:

- If feedback targets the image, rewrite the image prompt and keep the two-stage workflow.
- If feedback targets copy, revise titles/body/tags only.
- If feedback is vague, offer 2-3 concrete directions such as "更科学", "更高级", "更爆款", "更像医学挂图", "更少文字".
- Preserve the ingredient unless the user changes it.

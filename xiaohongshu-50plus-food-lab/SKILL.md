---
name: xiaohongshu-50plus-food-lab
description: Use when creating Chinese Xiaohongshu food, cooking-time, portion, pairing, selection, or food-myth content for readers aged 45–65, especially when the user wants a 50+饮食说明书 post, a 食物奇境实验室 3D infographic, an Image 2 prompt, or a post from the approved 30-day calendar.
---

# 50+食物奇境实验室

为45—65岁读者制作可收藏、可校验的饮食清单、时间表与3D食物奇境信息图。食物不是药物；先完成内容与安全校验，再生成视觉和文案。

## 开始前

1. 阅读 `references/account-positioning.md` 和 `references/health-boundaries.md`，并遵守两者的定位、语气和健康声明边界。
2. 用户要求“下一篇”或下一篇排期时，读取 `references/content-calendar.md`，选择最早未完成的 ID；用户明确指定主题时，保留该主题，不用排期替换。
3. 健康清单、辟谣和其他健康敏感内容，使用至少两个第一方或权威来源核实，并在 `source_notes` 记录 `label`、`url`、`checked_at`。涉及血压、血脂、血糖、肾功能、吞咽、过敏或用药时说明个体差异，绝不建议停药或替代医疗。

## 内容包门槛

1. 以 `assets/post-packet-template.json` 创建一份 UTF-8 JSON 内容包；保留全部字段，`visual_nodes` 为 3–8 个节点，`tags` 为 10 个不重复标签。
2. 运行 `python3 scripts/validate_post_packet.py <packet>`。任何错误都必须先修正并重新校验；校验未通过时停止，不生成提示词、图片或最终文案。

## 提示词与渲染门槛

1. 阅读 `references/visual-system.md`，按内容包的 `scene_template` 选择唯一模板：`time-spiral`、`food-arena`、`meal-assembly` 或 `contrast-worlds`，文件位于 `references/prompts/`。
2. 将提示词中的六个真实接口逐字替换：`{{TOPIC}}`、`{{TITLE}}`、`{{SUBTITLE}}`、`{{VISUAL_NODES}}`、`{{BODY_COPY}}`、`{{SAFETY_NOTE}}`。不要臆造其他占位符，也不要改写模板中的固定约束。
3. 先展示填充后的完整提示词。除非用户明确要求同时生成图片和文案，否则请求其批准后才渲染。
4. 使用内置 Image 2，并以 `assets/references/food-wonder-lab-anchor.png` 作为视觉锚点；**先生成1张** 3:4 竖版候选图，不批量生成。
5. 视觉 QA 必须检查：中文是否准确且无重复、食物状态是否真实、标题—食物变化—操作—安全条件的层级是否清楚、3:4 裁切后标题是否可读，以及是否含黑金、皇冠、奖章、星级、TOP评分、虚假排名、软件面板、品牌、水印、二维码、平台 UI、伪中文或医疗治疗承诺。
6. 只针对失败维度重新生成；每次保存为新版本，绝不覆盖已批准图片。

## 批准后的交付

图片获批后，基于通过校验的内容包写：5 个标题、1 篇 300–500 个中文字符的正文和 10 个标签。文案保持可操作、克制且不承诺预防、治疗、治愈、逆转或保证效果。

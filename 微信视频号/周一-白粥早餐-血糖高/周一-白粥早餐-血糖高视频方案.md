---
title: 周一｜血糖高，早餐别只喝白粥
series: 血糖高的一周餐盘改造
duration_target: 30s
format: 9:16
status: waiting_for_user_fishaudio
---

# 周一｜血糖高，早餐别只喝白粥

## 选题定位

系列名：血糖高的一周餐盘改造

本集主题：很多中老年人早餐习惯“一碗白粥配咸菜”，觉得清淡养胃。但对血糖偏高的人来说，更稳妥的表达不是“不能喝粥”，而是“别只喝粥，要搭配蛋白和蔬菜，观察自己的餐后血糖反应”。

核心记忆点：

```text
不是不能吃主食，是别让主食单独上桌。
```

医学表达边界：

- 不说“白粥一定升糖”“喝粥一定不好”。
- 不提供个体化治疗食谱。
- 不承诺“这样吃就能降糖”。
- 提醒血糖反应因人而异，建议记录餐后两小时血糖。
- 正在使用胰岛素、磺脲类药物，或有肾病、消化疾病、低血糖风险的人，饮食调整要咨询医生或营养师。

参考依据：

- ADA：糖尿病餐盘法建议半盘非淀粉蔬菜、四分之一优质蛋白、四分之一优质碳水。
- CDC：糖尿病饮食管理强调计算碳水、选择健康碳水、控制份量。
- NIDDK：糖尿病健康生活建议饮食、运动、用药和血糖监测配合管理。

## 成片结构

| 时间 | 目的 | 画面大字 | 旁白 |
|---|---|---|---|
| 0-3s | 钩子 | 血糖高，早餐别只喝白粥 | 很多叔叔阿姨早餐喜欢一碗白粥，觉得清淡、舒服。 |
| 3-8.5s | 反常识 | 问题不是粥，是“只喝粥” | 但如果早餐只有粥，缺少蛋白和蔬菜，餐后血糖可能更容易波动，也容易很快又饿。 |
| 8.5-16s | 改法 | 这样搭，更稳一点 | 可以试试：一个鸡蛋，一杯无糖豆浆，半个全麦馒头，再配一点黄瓜或青菜。 |
| 16-22s | 方法 | 记住：主食别单独上桌 | 不是不吃主食，而是让主食、蛋白、蔬菜一起出现。这样更接近餐盘法。 |
| 22-28s | 安全提醒 | 记录餐后2小时血糖 | 每个人反应不一样。先记录几天餐后两小时血糖，再和医生或营养师一起调整。 |

节奏要求：

- 每段旁白结束后只保留 0.2-0.4 秒视觉缓冲，然后切到下一页。
- 不做 1 秒以上的空白停顿，除非最后一页需要给观众看清行动提醒。
- 画面元素必须跟随旁白逐个出现，不能在开头一次性全部摆完。
- 最终时间以用户提供的真实音频为准，按 `音频结束 + 0.2-0.4s` 重算页面切换。

## 屏幕文案

```text
血糖高
早餐别只喝白粥
```

```text
问题不是粥
是“只喝粥”
```

```text
改成这样：
鸡蛋 + 无糖豆浆
半个全麦馒头
黄瓜 / 青菜
```

```text
主食别单独上桌
```

```text
记录餐后2小时血糖
带记录问医生
```

## FishAudio 配音交接

通用提示词，先粘贴到 FishAudio：

```text
请用温暖、可信、克制的中文健康科普口吻朗读。
面向中老年观众和子女，语速稍慢，清晰自然，不要广告腔，不要夸张情绪。
遇到提醒和风险词时稍微放慢，但不要制造恐慌。
整体像社区医生在耐心解释。
```

### scene-01.mp3

语气：开头有一点提醒感，但不要吓人。

建议时长：3-4 秒

朗读文本：

```text
很多叔叔阿姨早餐喜欢一碗白粥，觉得清淡、舒服。
```

### scene-02.mp3

语气：解释型，平稳清楚。

建议时长：4.5-5.5 秒

朗读文本：

```text
但如果早餐只有粥，缺少蛋白和蔬菜，餐后血糖可能更容易波动，也容易很快又饿。
```

### scene-03.mp3

语气：给出具体方案，稍微轻快。

建议时长：6-7 秒

朗读文本：

```text
可以试试：一个鸡蛋，一杯无糖豆浆，半个全麦馒头，再配一点黄瓜或青菜。
```

### scene-04.mp3

语气：强调记忆点，停顿自然。

建议时长：4.5-5.5 秒

朗读文本：

```text
不是不吃主食，而是让主食、蛋白、蔬菜一起出现。这样更接近餐盘法。
```

### scene-05.mp3

语气：温和提醒，结尾稳住。

建议时长：5.5-6.5 秒

朗读文本：

```text
每个人反应不一样。先记录几天餐后两小时血糖，再和医生或营养师一起调整。
```

配音注意：

- 每段单独生成，不要在段尾额外留长静音。
- 语速保持清楚自然，但不要拖腔。
- 每段最后一个字说完后，最多保留 0.2 秒自然尾音。
- 如果 FishAudio 自动生成了较长尾部静音，后期会裁掉静音再同步画面。

生成后请把 5 个音频文件命名为：

```text
scene-01.mp3
scene-02.mp3
scene-03.mp3
scene-04.mp3
scene-05.mp3
```

## 分镜与画面设计

| 场景 | 时间 | 画面 | 动画 | 资产需求 |
|---|---:|---|---|---|
| 1 | 0-3s | 暖色餐桌背景 + 独立白粥碗 + 中老年家人侧影；顶部大字“血糖高，早餐别只喝白粥” | 背景慢推，粥碗轻微浮入，标题 0.4s 入场，旁白结束后 0.3s 切页 | dining-table-bg.png, congee-bowl.png, older-parent-breakfast.png |
| 2 | 3-8.5s | 左侧独立白粥碗放大，右侧空餐盘轮廓；底部出现“问题不是粥，是只喝粥” | 白粥碗先出现，空餐盘淡入，橙色提示条随“很快又饿”压入 | congee-bowl.png, empty-plate.png |
| 3 | 8.5-16s | 餐盘改造：鸡蛋、无糖豆浆、半个全麦馒头、黄瓜/青菜作为独立食物图层逐个出现 | 食物元素按旁白顺序弹入，最后 0.4s 组成完整早餐盘 | egg.png, soy-milk.png, half-wholewheat-bun.png, cucumber-greens.png, breakfast-plate-base.png |
| 4 | 16-22s | 简化餐盘法底盘 + 蔬菜、蛋白、主食三个独立区域；中间大字“主食别单独上桌” | 三块区域依次填充，主食区域最后缩到合适份量，旁白结束后 0.3s 切页 | plate-method-base.png, plate-vegetables.png, plate-protein.png, plate-carb.png |
| 5 | 22-28s | 血糖仪、空白记录卡、笔、早餐小图标分层摆放；HTML 覆盖记录行和“带记录问医生” | 记录卡先入场，血糖仪轻落，记录行一行行落下，最后卡片稳定停留 0.8-1.2s | glucose-meter.png, blank-record-card.png, pen.png, breakfast-mini-icon.png |

## Image2 分层资产策略

正式视频不要只生成一张完整背景图。用 image2 生成可组合的视觉资产，再用 HTML/CSS 叠加中文文字、数字、标签和动画。

资产分三类：

- **场景背景**：餐桌、暖色厨房/客厅、柔和桌面，负责氛围。
- **主体食物**：白粥、鸡蛋、无糖豆浆、半个全麦馒头、黄瓜/青菜、餐盘区域，负责画面信息。
- **健康工具**：血糖仪、空白记录卡、笔，负责行动提醒。

生成要求：

- 生成图里不要出现中文、英文、数字、Logo 或水印。
- 食物和工具优先生成“干净主体、透明或纯浅色背景”的独立素材，方便抠图和动画。
- 背景图保留上下字幕安全区，不要把人物脸和主体放到文字区域。
- 所有医学结论、食物名称、份量提醒都用 HTML 原生文字覆盖，避免 image2 生成错字。
- 独立食物素材要统一光源、视角和风格，避免拼贴感。

## Image2 资产提示词

### dining-table-bg.png

```text
9:16 vertical warm Chinese family breakfast table background, soft morning light, clean home dining room, warm off-white and medical green palette, premium editorial health illustration style, calm trustworthy mood, no readable text, no logos, no people in the center, plenty of empty space at top and bottom for Chinese captions
```

### older-parent-breakfast.png

```text
older Chinese parent at breakfast, warm and kind expression, seated naturally at a home table, premium editorial health illustration style, soft morning light, medical green and warm off-white palette, isolated subject with clean edges, no readable text, no logos, not scary, not hospital scene
```

### congee-bowl.png

```text
single bowl of plain white rice porridge for Chinese breakfast, warm ceramic bowl, realistic premium editorial illustration, soft shadow, clean light background, isolated object, no text, no logo, no extra dishes
```

### empty-plate.png

```text
simple empty round breakfast plate seen from slightly above, warm white ceramic, soft shadow, clean isolated object, premium editorial illustration style, no text, no logo
```

### breakfast-plate-base.png

```text
simple warm white breakfast plate base, top-down slight angle, clean isolated object, soft natural shadow, premium editorial illustration, no food, no text, no logo
```

### egg.png

```text
boiled egg cut in half for healthy Chinese breakfast, clean isolated food object, premium editorial illustration, soft morning light, no text, no logo, no plate
```

### soy-milk.png

```text
glass cup of unsweetened soy milk, healthy Chinese breakfast, clean isolated object, soft morning light, premium editorial illustration, no label, no text, no logo
```

### half-wholewheat-bun.png

```text
half whole wheat steamed bun, Chinese breakfast staple, clean isolated food object, warm natural texture, premium editorial illustration, soft shadow, no text, no logo
```

### cucumber-greens.png

```text
cucumber slices and simple green vegetables for Chinese breakfast, clean isolated food object, fresh but not glossy, premium editorial health illustration style, soft shadow, no text, no logo
```

### plate-method-base.png

```text
simple round plate diagram base divided into three clean sections, no text, no numbers, warm white ceramic plate, medical green and soft teal subtle section colors, premium health infographic illustration, isolated object
```

### plate-vegetables.png

```text
non-starchy vegetables section for a diabetes plate method visual, leafy greens and cucumber, clean isolated object, premium editorial health illustration, no text, no logo
```

### plate-protein.png

```text
protein section for a diabetes breakfast plate method visual, boiled egg and tofu pieces, clean isolated object, premium editorial health illustration, no text, no logo
```

### plate-carb.png

```text
small carbohydrate section for a diabetes breakfast plate method visual, half whole wheat steamed bun and small grains, clean isolated object, premium editorial health illustration, no text, no logo
```

### glucose-meter.png

```text
simple modern glucose meter on warm tabletop, screen blank with no numbers, clean isolated object, premium editorial health illustration, medical green accents, no text, no logo
```

### blank-record-card.png

```text
blank health record card on warm tabletop, clean white paper card with subtle grid lines but no readable text or numbers, premium editorial health illustration, soft shadow, no logo
```

### pen.png

```text
simple pen for health record scene, clean isolated object, premium editorial illustration, soft shadow, no text, no logo
```

### breakfast-mini-icon.png

```text
small healthy Chinese breakfast icon cluster, tiny bowl, egg, soy milk, greens, clean isolated object, premium editorial health illustration, no text, no logo
```

### glucose-record-scene-bg.png

```text
9:16 vertical warm tabletop background for health record scene, calm community health education style, premium editorial illustration, warm off-white background, medical green accents, no readable text, no numbers, plenty of negative space for native HTML overlay text
```

## 视频号发布文案

短标题：

```text
血糖高早餐别只喝粥
```

视频描述：

```text
血糖高的人，早餐不是一口粥都不能喝，关键是别只喝白粥。可以试着把蛋白、蔬菜和少量主食搭在一起，再记录几天餐后两小时血糖。每个人反应不同，有异常带记录咨询医生或营养师。
```

话题：

```text
#血糖管理 #中老年健康 #早餐怎么吃 #健康科普 #糖尿病饮食
```

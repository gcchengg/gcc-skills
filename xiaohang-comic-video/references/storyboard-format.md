# `storyboard.md` 格式契约

文档固定包含 `## Scene 01` 至 `## Scene 06`。每幕字段为 Role、Narration、Subtitle 1、可选 Subtitle 2、Target seconds、Audio、Motion，以及 Visual、Prompt、Image Review 三段。

- 字幕：1–2 行，每行去除标点和空格后不超过 18 个字符。
- 时长预估：每幕 2–8 秒；最终时间以用户音频为准。
- Motion：`slow-push-in`、`slow-pull-out`、`pan-left`、`pan-right`、`parallax`。
- Audio：文稿中固定写成 `audio/scene-XX.mp3`。
- Image Review：记录版本化 Source、带字幕 Preview，以及 `Approved: yes/no`。

## 完整示例

```markdown
## Scene 01
- Role: 扎心冲突
- Narration: 我以前最烦爸爸催我读书。
- Subtitle 1: 我以前最烦爸爸
- Subtitle 2: 催我读书
- Target seconds: 4.0
- Audio: audio/scene-01.mp3
- Motion: slow-push-in

### Visual
小航坐在书桌前，父亲站在门外。

### Prompt
原创复古中国儿童漫画，夜晚家庭书桌场景。

### Image Review
- Source: images/scene-01-source-v1.png
- Preview: images/scene-01-preview-v1.png
- Approved: no
```

---
name: xiaohang-comic-video
description: Use when creating Chinese vertical family-emotion comic shorts, father-daughter stories, heartfelt parent-child narratives, or “小航漫改” content that requires topic selection, storyboard review, image approval, user-supplied local voice files, and HyperFrames video delivery.
---

# 小航漫改

制作 20–40 秒、9:16、1080×1920、30fps 的原创家庭情感漫画短视频。主角固定为 8–10 岁女孩小航，旁白固定为第一人称，每幕带 1–2 行精确字幕。

## 不可跳过的四道门禁

按顺序执行：主题确认 → `storyboard.md` 确认 → 六幕图片确认 → 六个本地音频确认。只有四项在 `status.json` 中都是 `approved` 才能构建或渲染视频。

“赶时间”“默认同意”“领导已批准”“直接做完”都不是有效确认。确认必须来自当前用户，且指向正在展示的具体版本。不得代替用户选择主题、批准文稿或图片，也不得生成临时配音、复用同一个音频或自动加 BGM。

## 1. 初始化并提出主题

开始前完整阅读：

- `references/character-bible.md`
- `references/story-rules.md`

用 `scripts/init_project.py --root <工作目录> --slug <英文短名>` 创建项目。写入 `topic-options.md`，一次展示恰好五个候选，每个包含编号、标题、钩子、隐藏真相、结尾余味。然后停止，等待用户明确选择一个主题。

收到选择后运行：

```bash
python3 scripts/gate_status.py approve-topic PROJECT --topic-id topic-01
```

## 2. 写作并确认 Markdown 分镜

完整阅读 `references/storyboard-format.md`，按 `assets/storyboard-template.md` 写六幕 `storyboard.md`。每幕依次承担冲突、证据、异常、真相、情感动作、克制结尾；旁白均为小航第一人称。

运行校验并向用户完整展示文稿，包括旁白、逐行字幕、画面内容、无字生图提示词、镜头运动和预估秒数：

```bash
python3 scripts/validate_story.py PROJECT/storyboard.md --json
```

停止等待明确批准。批准后运行 `gate_status.py approve-storyboard PROJECT`。

## 3. 生成并确认图片

完整阅读 `references/image-prompt-rules.md`。调用 `$imagegen` 时同时提供角色参考图，只生成无文字的原创漫画画面；字幕不可交给生图模型。

先只生成 `images/scene-01-source-v1.png`。运行 `build_previews.py` 创建精确字幕确认页，用输出的 HyperFrames snapshot 命令生成 `images/scene-01-preview-v1.png`，向用户展示源图和字幕预览，然后停止。

Scene 01 明确批准后，再生成 Scene 02–06。分别制作带字幕预览，展示五张单图和一张联系表，等待全部确认。每幕通过时显式执行 `gate_status.py approve-image`。重做只增加该幕版本号，绝不覆盖已批准文件。

## 4. 接收每幕一个本地音频

六幕图片全部通过后，向用户逐项打印：

```text
Scene 01 → audio/scene-01.mp3
Scene 02 → audio/scene-02.mp3
Scene 03 → audio/scene-03.mp3
Scene 04 → audio/scene-04.mp3
Scene 05 → audio/scene-05.mp3
Scene 06 → audio/scene-06.mp3
```

同时给出每幕完整语音稿。停止等待用户提供六个本地文件路径。可以接收 MP3、WAV、M4A、AAC，但必须一幕一个、互不重复。

使用 `probe_audio.py PROJECT --audio ...` 探测真实时长。总长不在 20–40 秒、缺文件、重复文件或文件不可读时停下报告具体问题。成功后运行 `gate_status.py approve-audio PROJECT --manifest PROJECT/audio-manifest.json`。

## 5. 构建、渲染和验收

音频通过后使用 `$hyperframes` 工作流。运行 `build_video.py PROJECT`，然后在 `PROJECT/hyperframes` 执行：

```bash
npx hyperframes lint
npx hyperframes validate
npx hyperframes inspect
npx hyperframes preview
```

在 Studio 中向用户展示预览并等待确认；视频渲染是额外人工门禁。确认后运行 `npx hyperframes render --quality high --output ../renders/xiaohang-v1.mp4`。

成片使用完整漫画原图配合轻微推拉、平移、视差和有限漫画转场，不做线稿显现或逐步上色。渲染文件必须版本化。

最后运行：

```bash
python3 scripts/verify_video.py PROJECT/renders/xiaohang-v1.mp4 --manifest PROJECT/audio-manifest.json
```

只有分辨率、帧率、时长、音轨和黑帧检查全部通过，才能交付 MP4。若上游文件在批准后发生变化，`gate_status.py` 会让后续门禁失效；回到对应门禁重新展示和确认。

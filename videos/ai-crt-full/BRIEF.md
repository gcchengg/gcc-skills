---
workflow: general-video
flow: automation
storyboard: no
message: "复制原视频的文字内容，用复古 CRT 动态字幕重新生成完整视频。"
destination: video
aspect: "16:9"
language: zh-CN
audience: general
length: 49.733s
---

## Intent

保留原视频的文字顺序和原音轨，重做为红色巨幅书法字＋暖白主字幕的复古电视动效成片。

## Assets

- 原视频：`/Users/apple/Desktop/160ba54ac5496895cec1b1f052e0a279.mp4`
- 本地提取的原音轨：`assets/original-audio.wav`
- 小红书版音轨：`assets/xhs-audio.wav`（开头“请抖音”已替换为“请小红书”）
- 从原视频提取的 6 张主题背景图：`assets/backgrounds/bg-01.jpg` 至 `bg-06.jpg`

## Customizations

- 1920×1080、30fps。
- CRT 圆角玻璃、暗角、扫描线、颗粒和红色磷光。
- 每个短句使用快速推进、落点抖动和硬切换场。
- 开头文字由“请抖音”改为“请小红书”。
- 背景图使用暗色遮罩和缓慢推近，在 6 个内容段落之间交叉淡化。

## Notes

原文本由画面字幕逐帧提取；原文无独立字幕轨，本机语音识别模型不可用。

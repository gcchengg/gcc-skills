# 《答案正在浮现》小红书封面实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 生成一张可直接用于小红书发布的 3:4《答案正在浮现》封面。

**Architecture:** 使用内置图像生成能力按已确认的设计规格生成单张位图，人工检查构图与文字准确性后，将最终 PNG 复制到项目资产目录。若文字存在明显错误，仅进行一次定向修正。

**Tech Stack:** 内置图像生成工具、PNG。

## Global Constraints

- 不操作 Git。
- 画面为 3:4 竖版。
- 主标题必须为“答案正在浮现”。
- 无水印、二维码、平台 Logo。
- 保存到 `xiaohongshu-answer-book/assets/`，不得覆盖已有资产。

---

### Task 1: 生成并验收封面

**Files:**
- Create: `xiaohongshu-answer-book/assets/answer-book-xhs-cover-v1.png`

**Interfaces:**
- Consumes: `docs/superpowers/specs/2026-09-02-answer-book-xhs-cover-design.md`
- Produces: 一张可直接发布的 PNG 封面。

- [ ] **Step 1: 生成封面**

  使用已确认的“神秘书页”提示词生成单张 3:4 图片，包含悬浮古书、金色月相、星尘和指定中文文案。

- [ ] **Step 2: 检查成图**

  检查主标题拼写、主体完整性、缩略图层级、底部安全区以及是否存在水印或多余文字。

- [ ] **Step 3: 保存项目资产**

  将通过检查的图片复制到 `xiaohongshu-answer-book/assets/answer-book-xhs-cover-v1.png`；若文件已存在，则顺延使用 `v2`。

- [ ] **Step 4: 最终验证**

  确认文件存在、可读取且为 PNG，并向用户展示预览和绝对路径。

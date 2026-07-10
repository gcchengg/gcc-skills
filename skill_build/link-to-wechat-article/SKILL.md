---
name: link-to-wechat-article
description: Create a Chinese WeChat Official Account article from a source link, enrich and format the WeChat long-form article naturally without a fixed word limit, save a WeChat draft for user review, and only publish after explicit user approval. Use when the user says 给你一个链接生成公众号文章, 链接转公众号, 自动发公众号, 生成公众号草稿, 检查后发布, or asks Codex to turn URLs such as X/Twitter posts, blog posts, articles, PDFs, or webpages into WeChat publishing assets.
---

# Link To WeChat Article

## Core Contract

Turn one or more source links into a Chinese WeChat Official Account long-form article package that can be naturally rich, complete, and suitable for public-account publishing.

Always enforce:

- Output language: Chinese, unless the user requests otherwise.
- WeChat length: no fixed word limit. Let the article be as rich as the topic requires, while avoiding repetition, filler, and irrelevant expansion.
- Draft-first workflow: generate local draft files, render or preview them, then save a WeChat draft.
- Explicit publish approval: never click final publish, group send, or equivalent irreversible controls until the user explicitly confirms after inspecting the draft.
- Source fidelity: preserve the source's main claims, order, examples, and important details; enrich with context, cases, diagrams, section structure, and Chinese-reader explanations without deleting core source content.
- Ownership framing: do not add 原作者/转载/精读 labels unless the user asks. If ownership or rights are unclear, ask before removing attribution.

## Workflow

1. Resolve source content.
   - For public web pages, browse or fetch the URL when needed.
   - For X/Twitter links, use available browser or Twitter tooling; if the post cannot be fetched automatically, ask the user for text/screenshots.
   - Archive extracted raw text or screenshots in a task folder when the project already has a folder convention.

2. Create the article package.
   - Write a full Chinese article draft, not a short summary.
   - Keep the source backbone intact, then add local examples, practical cases, transition explanations, and visual callouts.
   - Add a title, subtitle/deck if useful, section headings, image placement notes, and cover-image direction.

3. Format for WeChat.
   - Prefer existing local WeChat skills/tools when available: `guocc-wechat`, `wechat-browser-publisher`, `md2wechat`, or user-provided publishing scripts.
   - Use a browser-login publishing path when API upload is blocked by IP whitelist, AppSecret, or platform restrictions.
   - Convert Markdown to WeChat-compatible HTML if the browser editor works better with pasted HTML.
   - Use local image paths that the chosen publishing path can upload or inline.

4. Save draft and present review points.
   - Save to WeChat as draft, not public publish.
   - Tell the user the draft status, title, any draft ID/URL visible in the platform, and files created.
   - Ask the user to inspect typography, images, cover, title, and preview card.

5. Publish only after approval.
   - Treat "发布", "发出去", or "确认发布" after draft inspection as approval.
   - If the page shows a final confirmation dialog, report the exact action and wait if the user's approval is ambiguous.
   - After successful publish, report the public URL or platform confirmation if available.

## Article Structure

Use this default structure unless the source suggests a better one:

```markdown
# 标题

导语：用 1-3 段说明这篇文章解决什么问题。

## 1. 背景/问题
解释读者为什么需要理解这个主题。

## 2. 核心观点
完整承接原文观点，必要时拆成多个小节。

## 3. 具体案例
补充中国读者容易理解的场景、操作步骤、对比例子。

## 4. 方法论/流程图
把文章里的抽象概念转成可执行框架。

## 5. 使用建议
给出可落地的提示词、检查清单或实践步骤。

## 6. 总结
用短段落收束，不添加夸张营销话术。
```

For WeChat image-heavy articles, alternate text and visuals:

- Explain one knowledge point.
- Insert one image/card/diagram.
- Continue with the next knowledge point.

## WeChat Length

Do not apply a fixed character cap to WeChat articles.

Use judgment:

- Keep the article complete enough for a public-account reader who expects depth.
- Expand with concrete cases, practical examples, diagrams, and usage scenarios.
- Remove only repetition, empty transitions, and irrelevant tangents.
- If the article becomes unusually long, add a table of contents or sharper section headings instead of compressing important content by default.

## Visuals

Generate or prepare:

- One WeChat cover image, commonly 2.35:1 or platform-accepted horizontal cover.
- WeChat in-article diagrams or explanatory images when the article explains workflows, comparisons, architecture, or step-by-step methods.
- Image placement notes in the Markdown so the user knows where each image belongs.

Avoid:

- Overly decorative images that do not explain a section.
- Text-heavy images that duplicate entire paragraphs.

## Publishing Channels

Use the safest available channel:

- If API credentials and whitelist work: create a WeChat draft through the API/tooling.
- If API fails or the user wants web login: use browser automation through the logged-in WeChat Official Account backend.
- If automation cannot safely finish: produce a clean Markdown/HTML package and tell the user exactly what remains manual.

When using browser publishing, follow the detailed checklist in `references/browser_publish.md`.

## Deliverables

Create or update these artifacts when practical:

- `公众号完整稿.md`: full Chinese article.
- `公众号发布稿.md`: final WeChat-ready draft.
- `公众号发布稿_浏览器版.md` or `.html`: browser-paste version when needed.
- `assets/公众号封面.png`: cover image when requested or needed.
- A preview screenshot or local preview HTML when the article includes images or complex formatting.

Use the repository's existing naming convention if the task folder already has one.

---
name: link-to-wechat-article
description: Create a Chinese WeChat Official Account article and a matching Xiaohongshu image-text post from a source link, enrich and format the WeChat long-form article naturally without a fixed word limit, generate Xiaohongshu titles, topics, cover, image cards, and caption adapted to Xiaohongshu, save a WeChat draft for user review, and only publish after explicit user approval. Use when the user says 给你一个链接生成公众号文章, 链接转公众号, 自动发公众号, 公众号加小红书图文, 生成公众号草稿, 检查后发布, or asks Codex to turn URLs such as X/Twitter posts, blog posts, articles, PDFs, or webpages into WeChat plus Xiaohongshu publishing assets.
---

# Link To WeChat Article

## Core Contract

Turn one or more source links into two coordinated Chinese publishing packages:

- a WeChat Official Account long-form article that can be naturally rich and complete;
- a Xiaohongshu image-text post that is shorter, visual-first, cover-friendly, and suitable for linking to the WeChat article.

Always enforce:

- Output language: Chinese, unless the user requests otherwise.
- WeChat length: no fixed word limit. Let the article be as rich as the topic requires, while avoiding repetition, filler, and irrelevant expansion.
- Xiaohongshu length: do not reuse the full WeChat long article. Create a separate concise image-text version optimized for scrolling, saves, comments, and link-to-WeChat conversion.
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

3. Create the Xiaohongshu package.
   - Create a separate Xiaohongshu image-text article based on the WeChat article, not a full copy.
   - Include 3-8 title options, publish caption, topic tags, cover text, and per-card copy.
   - Generate or specify a Xiaohongshu-friendly cover image: vertical 3:4 or 4:5, clear first-screen title, safe margins, high contrast, readable on mobile feed thumbnails.
   - Plan 6-12 image cards when the topic is complex. Each card should teach one point and naturally point readers to the fuller WeChat article when appropriate.
   - If images are generated, keep text large, concise, and inside safe margins; avoid tiny paragraphs on image cards.

4. Format for WeChat.
   - Prefer existing local WeChat skills/tools when available: `guocc-wechat`, `wechat-browser-publisher`, `md2wechat`, or user-provided publishing scripts.
   - Use a browser-login publishing path when API upload is blocked by IP whitelist, AppSecret, or platform restrictions.
   - Convert Markdown to WeChat-compatible HTML if the browser editor works better with pasted HTML.
   - Use local image paths that the chosen publishing path can upload or inline.

5. Save draft and present review points.
   - Save to WeChat as draft, not public publish.
   - Tell the user the draft status, title, any draft ID/URL visible in the platform, and files created.
   - Ask the user to inspect typography, images, cover, title, and preview card.
   - Present Xiaohongshu cover and cards separately for review before the user posts them.

6. Publish only after approval.
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

## Xiaohongshu Package

Generate a separate Xiaohongshu package whenever the user wants to use Xiaohongshu as traffic entry to the WeChat article.

Include:

- `小红书标题.md`: 5-10 title candidates, with at least 3 curiosity/痛点 style and 3 practical/教程 style options.
- `小红书发布正文.md`: concise caption, clear reading hook, value summary, and a soft pointer to the WeChat full article if a link will be introduced.
- `小红书话题.md`: 8-15 topic tags, mixing broad tags and precise domain tags.
- `小红书图文脚本.md`: each image card's headline, body text, visual direction, and placement order.
- `assets/小红书封面.png`: feed-friendly cover image.
- `assets/小红书_*.png`: generated cards when image generation is requested.

Xiaohongshu cover rules:

- Use vertical 3:4 or 4:5 unless the user requests another ratio.
- Put the strongest title in the upper or central visual area, not too close to edges.
- Keep cover text short enough to read in the feed thumbnail.
- Use a clear subject signal: product, workflow, concept map, before/after contrast, or visual metaphor tied to the article.
- Avoid WeChat-style wide horizontal covers for Xiaohongshu.
- Do not make the cover a dense article screenshot.

## Visuals

Generate or prepare:

- One WeChat cover image, commonly 2.35:1 or platform-accepted horizontal cover.
- One Xiaohongshu cover image, commonly vertical 3:4 or 4:5, optimized for mobile feed visibility.
- WeChat in-article diagrams or explanatory images when the article explains workflows, comparisons, architecture, or step-by-step methods.
- Xiaohongshu image cards when the content benefits from carousel reading.
- Image placement notes in the Markdown so the user knows where each image belongs.

Avoid:

- Using the same cover for both WeChat and Xiaohongshu without adapting the aspect ratio and text density.
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
- `小红书发布正文.md`: Xiaohongshu caption and posting text.
- `小红书图文脚本.md`: Xiaohongshu card-by-card plan and image placement.
- `小红书标题与话题.md`: title candidates and topic tags.
- `assets/小红书封面.png`: Xiaohongshu-friendly vertical cover.
- `assets/小红书_*.png`: Xiaohongshu image cards when generated.
- A preview screenshot or local preview HTML when the article includes images or complex formatting.

Use the repository's existing naming convention if the task folder already has one.

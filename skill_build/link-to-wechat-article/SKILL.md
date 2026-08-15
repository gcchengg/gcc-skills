---
name: link-to-wechat-article
description: Create a polished Chinese WeChat Official Account article from a source link, preserve and reinterpret source visuals, generate clearer replacement diagrams when useful, format the article with visible heading hierarchy and mobile-friendly inline styles, and by default save the completed article directly to the logged-in WeChat draft box for user review. Never publish publicly without explicit approval after draft inspection. Use when the user says 给你一个链接生成公众号文章, 链接转公众号, 自动发公众号, 生成公众号草稿, 直接存到草稿箱, 检查后发布, or asks Codex to turn X/Twitter posts, blogs, articles, PDFs, or webpages into WeChat drafts.
---

# Link To WeChat Article

## Core Contract

Turn one or more source links into a Chinese WeChat Official Account long-form article package that can be naturally rich, complete, and suitable for public-account publishing.

Always enforce:

- Output language: Chinese, unless the user requests otherwise.
- WeChat length: no fixed word limit. Let the article be as rich as the topic requires, while avoiding repetition, filler, and irrelevant expansion.
- Draft-first workflow: generate local draft files, render or preview them, then save a WeChat draft.
- Default completion state: when a logged-in WeChat backend is available, continue autonomously through formatting, editor insertion, cover selection, visual verification, and **保存为草稿**. Do not stop at local Markdown/HTML or ask the user to paste content manually unless automation is genuinely blocked.
- Explicit publish approval: never click final publish, group send, or equivalent irreversible controls until the user explicitly confirms after inspecting the draft.
- Source completeness: preserve every substantive source claim, section, example, cited fact, argument turn, conclusion, and important detail. Do not compress a long source into a short summary, do not skip later sections, and do not delete source content just because the article is getting long.
- Source fidelity with enrichment: keep the source backbone intact, then enrich with context, cases, diagrams, section structure, Chinese-reader explanations, and the user's/authoring account's own analysis. Enrichment is additive; it must not replace or shrink the source's coverage.
- Original synthesis: preserve facts and useful ideas, but rebuild the article's thesis, reasoning order, section architecture, examples, transitions, and conclusion from first principles. Do not follow the source paragraph by paragraph or produce a sentence-level paraphrase. Complete coverage must not preserve the source's rhetorical fingerprint.
- Standalone WeChat voice: the public article body must read like an original standalone public-account article, not like a translation note or source report. Do not write visible source-framing phrases such as `原文引用`, `原文提到`, `资料来源`, `Source`, `X Article`, `链接如下`, or raw URL/bibliography sections in the publish draft unless the user explicitly asks for attribution.
- Image fidelity: do not ignore source images, screenshots, charts, or diagrams. Extract what each visual explains, then either reuse it when appropriate or create a clearer, more specific, more polished replacement visual.
- Clean publishing surface: never let image alt text, file names, image placement notes, captions like `公众号封面`, inventory labels, Markdown conversion captions, duplicate headings, or auto-numbering artifacts leak into the visible WeChat body.
- Ownership framing: do not add 原作者/转载/精读 labels unless the user asks. If ownership or rights are unclear, ask before removing attribution.

## Workflow

1. Resolve source content.
   - For public web pages, browse or fetch the URL when needed.
   - For X/Twitter links, use available browser or Twitter tooling; if the post cannot be fetched automatically, ask the user for text/screenshots.
   - Extract source images, screenshots, diagrams, charts, and image captions when available.
   - For each source image, record what it contributes: concept explanation, data evidence, UI example, workflow diagram, product screenshot, quote card, or decorative image.
   - Build a source coverage map from the extracted content: list each source section/block, its core claim, examples/evidence, and whether it is covered in the Chinese draft.
   - Archive extracted raw text or screenshots in a task folder when the project already has a folder convention.

2. Plan the visual layer.
   - Create an image inventory before writing the final article when the source contains visuals.
   - Do not drop a source visual unless it is purely decorative, duplicated, unreadable, or unrelated to the article's argument.
   - For useful source visuals, decide one of three treatments:
     - **Reuse**: keep the original image when it is factual evidence, a product screenshot, or a chart where exact appearance matters.
     - **Recreate**: use image generation to make a clearer, Chinese-localized, WeChat-friendly replacement when the original is a rough diagram, dense screenshot, simple concept visual, low-resolution image, or visually weak explainer.
     - **Redesign**: turn the image's idea into a new diagram, comparison table, workflow map, or annotated visual that better serves the enriched article.
   - Prefer image2/image generation for replacement visuals when the user asks for better, more specific, or more beautiful images.
   - Write image placement notes so the article alternates naturally between explanation and visual support.

3. Create the article package.
   - Write a full Chinese article draft, not a short summary. For a long source article, write a long WeChat article; do not shorten by dropping sections, examples, research references, or conclusions.
   - Keep the source backbone intact, then add local examples, practical cases, transition explanations, and visual callouts.
   - Write in a standalone public-account voice. Avoid visible source-report wording such as `原文说/原文引用/资料来源/这个链接` in the final publish draft; integrate source facts naturally into the article's own narrative.
   - Add a title, subtitle/deck if useful, section headings, image placement notes, and cover-image direction.
   - For each important visual, introduce the knowledge point first, insert the image, then explain the reader takeaway after the image.
   - Before finalizing, compare the draft against the source coverage map and restore any missing source claim, example, cited report, or conclusion.
   - Run an originality reconstruction pass before formatting. Reduce the source to atomic facts, claims, procedures, examples, and constraints; then choose a new editorial thesis and regroup those atoms by the reader's problem rather than the source order.
   - Add genuine authorial judgment: explain why the method works, where it breaks, which trade-offs matter, and what the reader should do differently. Prefer a new decision framework, diagnostic model, local example, or practical checklist over decorative commentary.
   - Do not reuse the source title pattern, opening hook, section sequence, section count, closing slogan, or distinctive metaphors unless factual accuracy requires it. Never preserve sentence skeletons while merely replacing synonyms.
   - Compare source and draft headings side by side. If most headings map one-to-one in the same order, restructure again. Sample several paragraphs; if their claim order and examples still track the source closely, rewrite from the new thesis.

4. Format for WeChat.
   - Prefer existing local WeChat skills/tools when available: `guocc-wechat`, `wechat-browser-publisher`, `md2wechat`, or user-provided publishing scripts.
   - Use a browser-login publishing path when API upload is blocked by IP whitelist, AppSecret, or platform restrictions.
   - Convert Markdown to WeChat-compatible HTML if the browser editor works better with pasted HTML.
   - Use inline `style` attributes for all critical typography and spacing. Do not depend on `<style>` blocks, linked stylesheets, CSS classes, or theme-only styling because the WeChat editor may strip them during paste.
   - Make hierarchy visibly obvious in the actual editor: body H2 headings must have a distinct heading treatment; H3 headings must be visibly different from body text; paragraphs, lists, quotes, and code blocks must have readable spacing on mobile.
   - Unless the source calls for another structure, require at least a title, an opening section, multiple descriptive H2 headings, and a conclusion. Never publish a wall of undifferentiated paragraphs.
   - Use local image paths that the chosen publishing path can upload or inline.
   - If using `md2wechat`, prevent image alt text from becoming visible captions unless the caption is intentionally written for readers. Use empty image alt text or strip generated `<figcaption>` before pasting.
   - If the editor has a separate title field, remove the pasted body H1 to avoid duplicate titles.
   - Avoid double numbering: if the theme auto-numbers headings, do not also put manual `1.`/`01` prefixes in heading text.
   - Render a local preview and inspect it, but treat the WeChat editor itself as the final rendering authority.

5. Save draft and present review points.
   - Before saving, inspect the visible/pasted editor text for publishing artifacts: `原文引用`, `资料来源`, raw source URLs, `公众号封面`, image file names, image inventory text, duplicate title, duplicate heading numbers, and source-list sections. Remove them from the public body unless explicitly requested.
   - Save to WeChat as draft, not public publish.
   - Before saving, inspect the live editor and verify: title present; H2/H3 hierarchy visibly rendered; paragraphs are separated; lists and code blocks are readable; cover is selected; intended body images are present; no accidental extra image remains in the body after choosing a cover.
   - After clicking **保存为草稿**, wait for an `已保存` indicator, draft-list appearance, changed edit URL, `appmsgid`, or another unambiguous success signal. If no success signal appears, troubleshoot and retry rather than reporting completion.
   - Tell the user the draft status, title, any draft ID/URL visible in the platform, files created, and whether the coverage map found any missing source sections.
   - Ask the user to inspect typography, image order, image quality, cover, title, and preview card only after the draft has been saved successfully.

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
- For source articles, completeness beats brevity: do not remove source sections, late-stage arguments, examples, cited studies, or conclusions to make the draft shorter.
- Expand with concrete cases, practical examples, diagrams, and usage scenarios.
- Remove only repetition, empty transitions, mechanical attribution/source-list material, and irrelevant tangents.
- If the article becomes unusually long, add a table of contents, sharper section headings, or ask whether to split into a series instead of compressing important content by default.

## Visuals

Generate or prepare:

- One WeChat cover image, commonly 2.35:1 or platform-accepted horizontal cover.
- WeChat in-article diagrams or explanatory images when the source contains visuals or the article explains workflows, comparisons, architecture, products, UI changes, charts, or step-by-step methods.
- Image placement notes in the Markdown so the user knows where each image belongs.

For source images:

- Create `原文图片清单.md` or an equivalent section that lists each source image, what it means, and the chosen treatment: reuse, recreate, redesign, or omit with reason.
- If recreating or redesigning, generate replacement images under `assets/正文图_*.png` and keep the visual's knowledge point aligned with the source.
- Use Chinese labels in generated explainer images for Chinese readers.
- Keep WeChat in-article images readable on mobile: restrained text, clear hierarchy, generous margins, and high contrast.
- Use beautiful but functional visuals: every image should make a concept easier to understand, not just decorate the page.
- When a source image is a UI screenshot, preserve the factual UI meaning; if generating a replacement, make it an annotated conceptual recreation rather than inventing false product details.

Avoid:

- Overly decorative images that do not explain a section.
- Text-heavy images that duplicate entire paragraphs.
- Ignoring original article visuals just because the text can be summarized without them.
- Replacing factual charts or screenshots with visually attractive but inaccurate images.

## Publishing Channels

Use the safest available channel:

- If API credentials and whitelist work: create a WeChat draft through the API/tooling.
- If API fails or the user wants web login: use browser automation through the logged-in WeChat Official Account backend.
- If automation cannot safely finish: produce a clean Markdown/HTML package and tell the user exactly what remains manual.

## Draft Acceptance Checklist

Do not call the task complete until all applicable checks pass:

- The WeChat title field is filled and the body does not repeat the same H1.
- The opening paragraphs are readable and not fused into one block.
- Every major section has a visible H2; supporting subsections use visible H3 headings where useful.
- Critical styling is inline and remains visible after insertion into the WeChat editor.
- Lists, blockquotes, code/prompt cards, and images have sensible mobile spacing.
- A valid cover is selected and its crop/preview is acceptable.
- Body images appear in the intended order and no cover-upload artifact remains in the body.
- The editor contains no Markdown syntax, YAML frontmatter, raw local paths, alt-text leakage, image inventory notes, duplicate title, or source URL appendix unless requested.
- The live page provides an unambiguous saved-draft success signal.
- Public publish/group send has not been triggered.
- The draft has a different editorial thesis, opening, heading architecture, section order, and ending from the source.
- Source coverage is complete at the atomic-claim level, but no long passage is a close translation or sentence-level paraphrase.
- The article contains original analysis that materially changes how readers understand or apply the topic.

When using browser publishing, follow the detailed checklist in `references/browser_publish.md`.

## Deliverables

Create or update these artifacts when practical:

- `公众号完整稿.md`: full Chinese article.
- `公众号发布稿.md`: final WeChat-ready draft.
- `公众号发布稿_浏览器版.md` or `.html`: browser-paste version when needed.
- `assets/公众号封面.png`: cover image when requested or needed.
- `原文覆盖检查表.md`: source coverage map showing each substantive source section/block and where it is covered in the Chinese article.
- `原文图片清单.md`: source image inventory and treatment plan when the source contains images.
- `assets/正文图_*.png`: regenerated or redesigned in-article visuals when source images should be improved.
- A preview screenshot or local preview HTML when the article includes images or complex formatting.

Use the repository's existing naming convention if the task folder already has one.

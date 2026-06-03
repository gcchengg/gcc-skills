---
name: guocc-wechat
description: Use this skill when the user wants to turn a folder of TXT or Markdown source files into a WeChat Official Account article draft, generate a publish-ready Markdown file in the current folder, preview/convert it with md2wechat-style tooling, and optionally upload or prepare it for WeChat publishing. Trigger on requests about 微信公众号, 公众号发布, Markdown/TXT folder aggregation, md2wechat, or publishing folder content to WeChat.
---

# Guocc WeChat

## Overview

Create a WeChat Official Account publishing draft from the contents of a folder. The workflow combines md2wechat-style Markdown conversion and baoyu-post-to-wechat-style publishing preparation: scan source files, produce a polished `微信公众号发布稿.md` in the working folder, validate metadata, then preview or upload through available WeChat tooling.

## Workflow

1. Identify the target folder.
   - If the user does not specify a folder, use the current working directory.
   - Search for `.md`, `.markdown`, and `.txt` files recursively, excluding hidden folders, `.git`, dependency folders, build outputs, and prior generated WeChat drafts.
   - Use `scripts/prepare_wechat_md.py` to create a deterministic source-based draft scaffold when there are multiple source files.

2. Read and understand the source content.
   - Preserve facts, names, links, data, and code snippets from the source files.
   - Remove duplicate boilerplate, navigation text, editor notes, and unfinished fragments unless the user asks to keep them.
   - If several files cover one topic, merge them into one coherent article rather than appending them mechanically.

3. Generate the current-folder Markdown file.
   - Default output filename: `微信公众号发布稿.md`.
   - If that file already exists and the user did not ask to overwrite, create a timestamped file such as `微信公众号发布稿-YYYYMMDD-HHMM.md`.
   - The output must be a complete WeChat-ready Markdown article, not only notes or an outline.

4. Apply WeChat article structure.
   - YAML frontmatter:
     - `title`
     - `author`
     - `digest`
     - `cover`
     - `source_folder`
     - `publish_status: draft`
   - Body:
     - Strong title as `# ...`
     - Short opening hook
     - Scannable sections with `##`
     - Bullets or numbered steps where they improve readability
     - Pull-quote style lines using Markdown blockquotes only when they add emphasis
     - Clear ending summary or CTA
   - Keep paragraphs short for mobile reading.

5. Prepare for publishing.
   - If the user asks to preview, convert, draft, or publish, first read `references/wechat_publishing.md`.
   - Prefer `md2wechat` if available for inspect/preview/HTML conversion/draft upload.
   - Use browser or API publishing only when credentials/login state are available and the user explicitly wants publishing or draft upload.
   - Never claim a WeChat draft was uploaded unless the tool command actually succeeded.

## Draft Generation Command

Run this from the folder that should be scanned:

```bash
python3 /Users/apple/Documents/skills/guocc-wechat/scripts/prepare_wechat_md.py .
```

Useful options:

```bash
python3 /Users/apple/Documents/skills/guocc-wechat/scripts/prepare_wechat_md.py /path/to/folder --output 微信公众号发布稿.md
python3 /Users/apple/Documents/skills/guocc-wechat/scripts/prepare_wechat_md.py . --overwrite
python3 /Users/apple/Documents/skills/guocc-wechat/scripts/prepare_wechat_md.py . --max-chars-per-file 12000
```

After running the script, open the generated Markdown and revise it into a polished article. The script creates a structured starting point; Codex is responsible for editorial synthesis, final title, digest, and mobile-friendly flow.

## Output Standards

- The generated article should feel native to WeChat, not like a concatenated file dump.
- Use Chinese copy by default when source content is Chinese or the user writes in Chinese.
- Do not include a visible "source file list" in the publish body unless the user asks. Keep source traceability in an HTML comment at the end.
- If images exist in the folder, reference suitable local image paths in Markdown and set the strongest candidate as `cover`.
- If no source files are found, report that clearly and do not create an empty publish draft.

## Publishing

For upload, preview, account setup, API/browser mode, image handling, and validation commands, read `references/wechat_publishing.md` only when needed.

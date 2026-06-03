# WeChat Publishing Reference

Load this only when the user asks to preview, convert, inspect, upload, or publish the generated Markdown.

## Preferred md2wechat Commands

Check whether the CLI exists:

```bash
command -v md2wechat
```

Common flow:

```bash
md2wechat inspect 微信公众号发布稿.md
md2wechat preview 微信公众号发布稿.md
md2wechat convert 微信公众号发布稿.md --preview
md2wechat convert 微信公众号发布稿.md --draft --cover cover.jpg
```

Use `inspect` before upload. Fix missing `title`, weak `digest`, missing cover, broken local images, or unsupported Markdown before attempting draft upload.

## API vs Browser Publishing

- API mode is preferred for repeatable draft upload when app credentials are configured.
- Browser mode is acceptable when the user has an authenticated WeChat backend session and explicitly requests browser automation.
- Do not ask for secrets in chat. Ask the user to configure credentials in their local tool environment.
- Do not publish directly when the user only asked to generate or preview a draft.

## Markdown Requirements

Frontmatter should include:

```yaml
---
title: "文章标题"
author: "作者"
digest: "一两句话摘要"
cover: "cover.jpg"
publish_status: "draft"
---
```

Body rules:

- Use one `#` title.
- Use `##` for main sections.
- Keep paragraphs short.
- Prefer local image paths relative to the Markdown file.
- Avoid raw HTML unless the conversion tool requires it.
- Keep source traceability in HTML comments rather than visible article text.

## Fallback When md2wechat Is Unavailable

If no publishing CLI is installed, still produce the publish-ready Markdown and tell the user which command/tool is missing. Do not invent a successful upload.

---
name: wechat-browser-publisher
description: Save local Markdown or inline-styled HTML articles to the WeChat Official Account draft box through a dedicated persistent Chrome session. Automatically launches the publishing browser, waits for QR-code login or administrator confirmation when needed, reuses the authenticated profile on later runs, fills title/body/digest, uploads the cover, validates body images and publishing artifacts, saves the draft, and requires an unambiguous success signal. Use for 公众号草稿、保存到微信公众号、浏览器发布微信文章、扫码登录公众号后台、API 白名单失败后的网页发布。
---

# WeChat Browser Publisher

Create a verified WeChat Official Account draft with the bundled deterministic script. Do not use browser-plugin tab claiming as the primary path; heavy WeChat pages can make that connection time out.

## Required workflow

1. Prepare inline-styled HTML, preferably with `md2wechat convert`. Remove the body H1 when the editor has a separate title field. Use empty image alt text.
2. Run `scripts/publish_wechat_browser.mjs` in `draft` mode.
3. If a visible Chrome window shows a QR code or administrator confirmation, tell the user the skill is waiting for that action. Keep the command running; it waits up to ten minutes by default.
4. Reuse the dedicated profile at `~/.codex/wechat-publisher-profile` on future calls. Do not ask the user to log in again while the session remains valid.
5. Report success only when the script prints `DRAFT_SAVED` and final JSON with `"status":"draft_saved"`.

## Command

```bash
node /Users/apple/.codex/skills/wechat-browser-publisher/scripts/publish_wechat_browser.mjs \
  --html /absolute/path/article.wechat.html \
  --title "文章标题" \
  --digest "摘要" \
  --cover /absolute/path/cover.png \
  --outputDir /absolute/path/task-folder \
  --mode draft
```

The script automatically:

- Connects to `http://127.0.0.1:9223`, or launches a visible Chrome window if needed.
- Uses a dedicated persistent publishing profile, never the user's ordinary Chrome profile.
- Opens WeChat, waits for QR login, and remembers the authenticated session.
- Enters the tokenized new-article editor directly.
- Converts local body images to pasteable data URIs.
- Requires the live editor to contain the title, at least 1,000 body characters, and at least two body images.
- Rejects leaked source notes and inventory labels.
- Uploads the cover, saves the draft, captures before/after screenshots, and checks the result.

## Modes

- `--mode fill`: fill and validate the editor without saving. Use only for selector debugging.
- `--mode draft`: default production path. Fill, validate, and save to the draft box.
- `--mode publish`: intentionally refused. Public publishing requires the user to inspect the saved draft and give explicit approval in a later turn.

## Failure handling

- When Chrome opens with a QR code, wait for the user instead of switching browsers.
- When login times out, rerun the same command; the persistent profile preserves completed login.
- When editor selectors fail, read `references/browser_publish.md`, run `--mode fill`, and update the script. Do not fall back to coordinate clicking.
- When the script cannot confirm draft saving, report that the draft is unverified. Never infer success from a click alone.
- Use browser-plugin automation only as a diagnostic fallback, not for normal publishing.

## Safety

- Draft saving is authorized by a request to create or save a WeChat draft.
- Never click public publish, mass-send, or equivalent controls without explicit approval after draft inspection.
- Never request or expose AppSecret. This workflow needs no WeChat API credentials.

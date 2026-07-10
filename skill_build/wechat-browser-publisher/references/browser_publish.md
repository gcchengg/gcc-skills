# Browser Publishing Notes

## CDP Browser

This workflow expects a real Chrome/Edge instance with remote debugging enabled and an authenticated WeChat Official Account session.

Common Chrome launch pattern:

```bash
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/wechat-browser-publisher-profile
```

If the user wants to reuse an existing Chrome profile, avoid overwriting it. Prefer a dedicated profile and ask the user to log into `https://mp.weixin.qq.com/` once.

## Article Input

Prefer HTML produced by `md2wechat convert` because it already contains inline styles compatible with the WeChat editor.

If starting from Markdown:

```bash
tools/bin/md2wechat convert article.md article.wechat.html
```

## Expected Manual Stops

Pause and ask the user to complete the browser step when any of these appear:

- QR code login.
- Admin/account selection.
- Security verification.
- Original declaration confirmation.
- Cover cropping UI.
- Final publish confirmation.

## Debugging Selectors

The script uses conservative selectors for title, author, digest, contenteditable body, and save buttons. If WeChat changes the editor layout:

1. Inspect the page with Playwright or browser devtools.
2. Update `scripts/publish_wechat_browser.mjs` selectors.
3. Test with `--mode fill` before `--mode draft`.

## Publishing Policy

Saving a draft is allowed when requested. Final publish or mass-send should remain manual unless the user explicitly asks for it in the same turn and the UI state is visibly verified.

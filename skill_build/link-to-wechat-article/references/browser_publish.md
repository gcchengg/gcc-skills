# Browser Publishing Checklist

Use this reference when publishing through the logged-in WeChat Official Account web backend.

## Preconditions

- Confirm the user is logged into `mp.weixin.qq.com` in the browser/profile being automated.
- Prefer Chrome or Edge with a CDP debugging port when browser automation is needed.
- Confirm the account identity if more than one Official Account is visible.
- Use the latest local browser-paste HTML or Markdown artifact, not a source draft with YAML frontmatter.

## Draft Creation

1. Open the WeChat Official Account backend.
2. Enter the draft/article editor.
3. Fill:
   - title
   - author, only if the user wants it
   - body content
   - cover image
   - digest/summary, if available
4. Save as draft.
5. Capture a screenshot after saving when possible.
6. Report the draft status and any visible `appmsgid`, draft URL, or save timestamp.

## Review Gate

After saving a draft, stop and ask the user to inspect:

- cover image and preview card
- title and digest
- article typography
- image order and image quality
- missing images or pasted frontmatter
- mobile preview if available

Do not public-publish until the user explicitly confirms after this review step.

## Final Publish

Only proceed when the user gives clear approval such as:

- “确认发布”
- “可以发布”
- “发出去”
- “帮我正式发布”

If a confirmation modal appears, verify it is the expected article and action. If any wording implies mass-send, irreversible publication, paid promotion, or account-risk action and the user's approval was not specific enough, ask again.

## Common Failure Modes

- API upload fails with IP whitelist error: switch to browser-login workflow.
- Browser paste includes YAML frontmatter: regenerate a browser version with frontmatter stripped.
- Images do not upload from Markdown: use local file upload where possible or inline only for editor insertion, then verify the final article shows real images.
- Cover upload opens a crop dialog: do not guess the crop if the result is unclear; screenshot and ask the user.
- Editor content appends instead of replaces: select and clear the body editor before inserting the final article.

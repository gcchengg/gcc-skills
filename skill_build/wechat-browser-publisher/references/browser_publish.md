# Browser publishing diagnostics

Use this reference only when the deterministic publisher reports a selector or upload failure.

## Persistent browser

- CDP endpoint: `http://127.0.0.1:9223`
- Profile: `~/.codex/wechat-publisher-profile`
- Login wait: ten minutes by default; override with `--loginTimeout <milliseconds>`.
- Closing Chrome does not remove the login state. A later run relaunches the same profile.

Do not reuse the ordinary Chrome profile: Chrome locks active profiles and remote-debugging startup becomes unreliable.

## Diagnostic loop

1. Run the same command with `--mode fill`.
2. Inspect `wechat_editor_filled.png` and the visible editor.
3. Confirm two `.ProseMirror` editors exist: title first, body second.
4. Check title, body length, H2/H3 hierarchy, body image count, digest, and cover.
5. Update semantic selectors in the script when the WeChat layout changes.
6. Return to `--mode draft` and require `DRAFT_SAVED`.

## Expected manual stops

Pause for the user only when WeChat displays:

- QR-code login;
- administrator/account confirmation;
- CAPTCHA or security verification;
- an ambiguous cover crop that cannot be verified.

Public publish is outside this script. The user must inspect the saved draft and explicitly authorize publication in a later turn.

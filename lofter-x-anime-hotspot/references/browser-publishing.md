# Browser publication protocol

Use this protocol only after the first exact confirmation has passed the publication gate.

1. Do not open the LOFTER editor until `publication_gate.approve_form_fill(run_dir, "确认发布")` succeeds, `build_upload_manifest` returns the approved manifest, and that exact object is atomically saved as run-local `upload-manifest.json`.
2. **REQUIRED SUB-SKILL:** Read `browser:control-in-app-browser` completely before any browser action. Follow that Skill for all page inspection, navigation, typing, uploads, and evidence capture.
3. Open LOFTER in the Codex in-app browser. If login, CAPTCHA, risk control, account verification, an ambiguous editor, or an unexpected page appears, stop for the user. Never bypass or guess through it.
4. Fill only from `upload-manifest.json`/the exact object returned by `build_upload_manifest`. Do not improvise content, reorder media, or upload any file absent from the manifest.
5. Verify title, full body, tags, image count, image order, and manifest digest against the approved manifest. Capture final platform preview evidence with the submit button visible. Persist exactly the fields required by `mark_form_filled`: capture time, title, media count, `submit_button_visible: true`, and the approved manifest SHA-256.
6. Stop before the final submit button. Show the final platform preview to the user and request the exact phrase `确认最终提交`. Never treat `确认发布`, a paraphrase, a prior message, or generic approval as the second confirmation.
7. After receiving `确认最终提交`, re-load the run state and platform preview. Run `approve_final_submit` immediately before clicking submit. If either revalidation fails or the page changed, stop without clicking.
8. Click submit exactly once. If success is clear, record the HTTPS LOFTER URL and timezone-aware publication time with `record_publication`. Preserve the final article, title, tags, manifest, source ledger, and result evidence in the run archive.
9. If the result is uncertain, record `{"result": "uncertain"}`, inspect the LOFTER profile or drafts read-only, and do not click submit again. Do not retry, refresh into a second submission, or infer failure from a slow response.

If upload or page structure fails before submit, use the safe pre-submit pause and report only a non-secret error. Never store passwords, cookies, session values, verification codes, CAPTCHA data, or authorization evidence in browser/publication state.

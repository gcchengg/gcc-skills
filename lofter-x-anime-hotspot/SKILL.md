---
name: lofter-x-anime-hotspot
description: Use when the user explicitly invokes $lofter-x-anime-hotspot, requests a current X/LOFTER anime, game, character, or CP article, wants an illustrated LOFTER preview, supplies a run ID or revision, or sends a LOFTER publication confirmation.
---

# LOFTER × X Anime Hotspot

Use Chinese with the user. Produce exactly one publish-ready illustrated draft per new run. Keep research evidence, authorization records, checksums, and local evidence paths private. Do not claim Codex independently verified authorization: the user's exact `确认发布` is the publication authorization attestation for that run.

When invoked as `$lofter-x-anime-hotspot` without additional instructions, start a new run: research the current relevant hotspots, choose one publishable topic, generate one illustrated LOFTER preview, and stop before opening LOFTER. Treat text after the skill mention as the topic, revision request, run reference, or confirmation for that invocation.

## Load the applicable protocol

- Read `references/research-and-drafting.md` before research, drafting, media acquisition/generation, or revision.
- Read `references/operating-rules.md` before selection, authorization review, or fan-fiction qualification.
- Read `references/content-templates.md` before creating or revising public copy.
- After the first exact confirmation only, read `references/browser-publishing.md`; it requires `browser:control-in-app-browser` before every browser action.
- Treat bundled JSON as schemas. `templates/authorizations.example.json` is smoke-test data only, never operational permission.

Resolve paths once:

```bash
LOFTER_SKILL_DIR="${CODEX_HOME:-${HOME}/.codex}/skills/lofter-x-anime-hotspot"
LOFTER_WORK_DIR="$(mktemp -d)"
```

For a repository checkout, set `LOFTER_SKILL_DIR` to the absolute directory containing this file. Import script modules from `$LOFTER_SKILL_DIR/scripts` when calling their Python functions.

## Route the invocation

### New draft

Create a run under `runs/` with `run_state.create_run`. Research 24 hours first and expand to 72 hours only when `select_publishable_topic.select_topic` reports insufficient 24-hour evidence. Persist the selector result and private research ledger in `hotspot-analysis.json` with `run_state.write_json_atomic`, validate the draft with `build_publishable_draft.build_draft`, then call `render_preview.render_preview`. Show the absolute `preview.html` path and stop in `authorization_review`; do not open LOFTER.

### Resume or revise

Load the named run, or the latest unfinished run when unambiguous, with `run_state.load_state`. Do not reselect the topic. Apply article/title/tag/caption changes with `build_publishable_draft.revise_draft`; it preserves unspecified fields, resets publication confirmations, and refreshes the preview transactionally. For rejected media, call `build_publishable_draft.record_media_review`, generate an independent replacement under the research protocol, then call `build_publishable_draft.replace_rejected_media`. Show the refreshed preview path and stop for review.

### First confirmation: `确认发布`

Accept only the exact phrase bound to the reviewed run. It attests that every run media item is authorized for LOFTER; reject pending/rejected and known smoke-only/publication-forbidden media. Call `publication_gate.approve_form_fill`, then `publication_gate.build_upload_manifest`. Persist that exact public object as run-local `upload-manifest.json` with `run_state.write_json_atomic`. Follow `references/browser-publishing.md` to fill LOFTER from that manifest: the cover image must be uploaded first and observed as the first effective content node before body entry; record `first_content_is_cover: true` with the observed title, body, tags, and ordered media identities in `publication_gate.mark_form_filled`. Stop before submit and request `确认最终提交`.

### Login resume: `已登录`

Accept this message only for an approved run paused on the LOFTER login page. Reload that run and its locked `upload-manifest.json`, then follow `references/browser-publishing.md` to reacquire the existing Codex in-app browser tabs and resume in the same LOFTER tab only after an authenticated editor is unambiguous. Do not repeat the first confirmation, rebuild or change the manifest, create a new run, or treat `已登录` as final-submit approval.

### Final confirmation: `确认最终提交`

Reload the same run and final platform preview. Immediately call `publication_gate.approve_final_submit`, click submit once, verify the result, and call `publication_gate.record_publication`. Preserve the published run as the archive. Never click the final submit button without this fresh exact confirmation. For an uncertain result, perform read-only verification and call `resolve_uncertain_publication`; never submit again.

## Deterministic boundaries

Use the Task 1–6 scripts rather than recreating state, scoring, authorization, draft, preview, or gate logic. Fail closed on invalid state, missing evidence, media mismatch, uncertain browser state, or no publishable topic.

Legacy packet generation remains available for compatibility:

```bash
python3 "$LOFTER_SKILL_DIR/scripts/score_candidates.py" INPUT.json \
  --ip-pool IP_POOL.json --output "$LOFTER_WORK_DIR/ranked.json"
python3 "$LOFTER_SKILL_DIR/scripts/validate_authorizations.py" \
  LEDGER.json ASSET_ID --usage original \
  > "$LOFTER_WORK_DIR/authorization.json"
python3 "$LOFTER_SKILL_DIR/scripts/build_content_packet.py" \
  "$LOFTER_WORK_DIR/packet-input.json" --output "$LOFTER_WORK_DIR/packet.md"
```

Bundled examples may exercise this pipeline only with `--smoke-only`. Every smoke result is publication-forbidden; never use it for a preview, manifest, form fill, or publication.

## Validate this Skill checkout

Install `requirements-dev.txt` into the ignored `.dev-deps` directory, then run the official validator portably:

```bash
SKILL_CREATOR_ROOT="${SKILL_CREATOR_ROOT:-${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator}"
PYTHONPATH="$LOFTER_SKILL_DIR/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" \
  python3 "$SKILL_CREATOR_ROOT/scripts/quick_validate.py" "$LOFTER_SKILL_DIR"
```

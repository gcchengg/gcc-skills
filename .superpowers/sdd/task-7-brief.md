### Task 7: Skill Orchestration, Research, Images, and Browser Protocol

**Files:**
- Modify: `lofter-x-anime-hotspot/SKILL.md`
- Modify: `lofter-x-anime-hotspot/agents/openai.yaml`
- Create: `lofter-x-anime-hotspot/references/research-and-drafting.md`
- Create: `lofter-x-anime-hotspot/references/browser-publishing.md`
- Modify: `lofter-x-anime-hotspot/references/operating-rules.md`
- Modify: `lofter-x-anime-hotspot/references/content-templates.md`
- Modify: `lofter-x-anime-hotspot/tests/test_skill_contract.py`

**Interfaces:**
- Consumes new user intent, a run ID/path, revision instructions, `确认发布`, or `确认最终提交`
- Calls the deterministic scripts from Tasks 1–6
- Uses web research for current X/LOFTER evidence, image generation for independent visuals, and `browser:control-in-app-browser` only after the first gate

- [ ] **Step 1: Write failing Skill-contract tests**

```python
def test_skill_describes_publish_ready_two_phase_workflow(self):
    skill = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
    self.assertIn("one publish-ready illustrated draft", skill)
    self.assertIn("24 hours first", skill)
    self.assertIn("expand to 72 hours", skill)
    self.assertIn("确认发布", skill)
    self.assertIn("确认最终提交", skill)
    self.assertIn("browser:control-in-app-browser", skill)
    self.assertIn("Never click the final submit button", skill)

def test_skill_routes_unlicensed_media_to_independent_generation(self):
    research = (SKILL_DIR / "references/research-and-drafting.md").read_text(encoding="utf-8")
    self.assertIn("source_media_ids must be []", research)
    self.assertIn("Do not provide the rejected image", research)

def test_browser_protocol_stops_on_ambiguous_or_uncertain_state(self):
    protocol = (SKILL_DIR / "references/browser-publishing.md").read_text(encoding="utf-8")
    self.assertIn("CAPTCHA", protocol)
    self.assertIn("do not click submit again", protocol)
    self.assertIn("final platform preview", protocol)
```

Replace the obsolete assertion `self.assertIn("Never publish automatically", skill)` with assertions for both exact confirmations and final-button stopping.

- [ ] **Step 2: Run Skill-contract tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_skill_contract.py -v`  
Expected: FAIL because the current Skill is packet-only and lacks both confirmation phrases.

- [ ] **Step 3: Write the exact research and drafting protocol**

`research-and-drafting.md` must direct the agent to:

```markdown
1. Search X and LOFTER for the last 24 hours and record at least two X source URLs and one LOFTER source URL per publishable topic.
2. Expand to 72 hours only when the selector reports insufficient 24-hour evidence.
3. Record observations and source metadata in `hotspot-analysis.json`; never invent engagement counts.
4. Draft exactly one 800–1500-character Chinese article, three distinct titles, 8–12 tags, one cover, and at most two body images.
5. Download candidate X media only into `original-media/`; mark it `pending` and do not upload it before authorization review completes.
6. For an unauthorized image, generate a materially independent replacement. `source_media_ids must be []`. Do not provide the rejected image to the image-generation tool.
7. Save generated visuals in `generated-media/` with prompt, model/tool label, creation time, and empty source lineage.
8. Re-render `preview.html` after every accepted revision and show its absolute local path to the user.
```

Also define objective mode routing, fanfic prerequisites, non-copying requirements, the exact disclosure, source-ledger fields, and rules for local file checksums.

- [ ] **Step 4: Write the exact browser publication protocol**

`browser-publishing.md` must direct the agent to:

```markdown
1. Do not open the LOFTER editor until `approve_form_fill` succeeds with `确认发布`.
2. Read the `browser:control-in-app-browser` Skill completely before browser actions.
3. Open LOFTER in the Codex in-app browser. If login, CAPTCHA, or risk control appears, stop for the user.
4. Fill from `upload-manifest.json`; do not improvise content or upload files absent from the manifest.
5. Verify title, body, tags, image count, and order; capture final platform preview evidence with the submit button visible.
6. Stop before the final submit button and request the exact phrase `确认最终提交`.
7. Re-load state and run `approve_final_submit` immediately before clicking submit.
8. If success is clear, record the LOFTER URL and time. If the result is uncertain, inspect the profile or drafts read-only and do not click submit again.
```

- [ ] **Step 5: Rewrite `SKILL.md` around four invocation paths**

The Skill body must explicitly route:

```markdown
- New draft: create a run, research, select, draft, acquire/generate images, render preview, and stop in authorization review.
- Resume/revise: load the named or latest unfinished run, apply only requested changes, and render a fresh preview.
- First confirmation (`确认发布`): validate all media, build the upload manifest, then fill LOFTER and stop before submit.
- Final confirmation (`确认最终提交`): revalidate the run and platform preview, click once, verify the result, and archive it.
```

Keep smoke examples publication-forbidden, keep evidence private, and remove the obsolete claim that the Skill never drafts public prose. The default prompt in `agents/openai.yaml` must name `$lofter-x-anime-hotspot`, request one illustrated preview, and mention guarded publishing after confirmation.

- [ ] **Step 6: Run Skill-contract and official validator tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_skill_contract.py -v`  
Expected: all contract tests PASS.

Run:

```bash
PYTHONPATH="lofter-x-anime-hotspot/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" python3 "${SKILL_CREATOR_ROOT:-${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator}/scripts/quick_validate.py" lofter-x-anime-hotspot
```

Expected: exit code 0 and `Skill is valid!`.

- [ ] **Step 7: Commit Task 7**

```bash
git add lofter-x-anime-hotspot/SKILL.md lofter-x-anime-hotspot/agents/openai.yaml lofter-x-anime-hotspot/references/research-and-drafting.md lofter-x-anime-hotspot/references/browser-publishing.md lofter-x-anime-hotspot/references/operating-rules.md lofter-x-anime-hotspot/references/content-templates.md lofter-x-anime-hotspot/tests/test_skill_contract.py
git commit -m "feat: orchestrate publish-ready LOFTER content"
```


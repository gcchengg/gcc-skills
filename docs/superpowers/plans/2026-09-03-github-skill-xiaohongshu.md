# GitHub Skill Xiaohongshu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and install `$github-skill-xiaohongshu` for producing verified single-Skill Xiaohongshu packages with six paper-embossed images.

**Architecture:** Keep routing and hard invariants in `SKILL.md`; place detailed research, editorial, visual, and output contracts in focused references. Use no custom executable because web discovery and image generation are tool-driven and judgment-heavy.

**Tech Stack:** Markdown Agent Skill specification, Codex `agents/openai.yaml`, built-in web and Image 2 tools.

## Global Constraints

- Only select repositories containing a real `SKILL.md` or equivalent explicit Agent Skill structure.
- One post covers one Skill and prioritizes explaining the Skill.
- Generate exactly six 3:4 Chinese images named `01` through `06` with descriptive Chinese suffixes.
- Do not auto-install third-party Skills or auto-publish to Xiaohongshu.
- Keep the built-in generator files for chat previews and copy one canonical 01–06 image set into the topic directory.

---

### Task 1: Create the discoverable Skill

**Files:**
- Create: `github-skill-xiaohongshu/SKILL.md`
- Create: `github-skill-xiaohongshu/agents/openai.yaml`
- Create: `github-skill-xiaohongshu/references/research.md`
- Create: `github-skill-xiaohongshu/references/editorial.md`
- Create: `github-skill-xiaohongshu/references/visual-system.md`
- Create: `github-skill-xiaohongshu/references/output-contract.md`

- [x] **Step 1: Verify baseline failure modes**

Review the independent no-skill scenario for missing multi-candidate defaults, reproducible prompts, controlled visual variation, symptom-first audience tests, and honest topic-binding behavior.

- [x] **Step 2: Write the minimum Skill and references**

Encode routing, safety boundaries, exact six-image narrative, output filenames, image consistency, and source discipline.

- [x] **Step 3: Validate structure**

Run: `python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py github-skill-xiaohongshu`

Expected: validation success with no scaffold placeholders.

- [x] **Step 4: Forward-test behavior**

Give an independent agent one realistic request with only the completed Skill and verify its proposed artifacts obey the output contract.

- [x] **Step 5: Install and verify discovery files**

Copy the validated folder to `/Users/guocc/.codex/skills/github-skill-xiaohongshu`, then confirm installed `SKILL.md` and `agents/openai.yaml` exist and match the project source.

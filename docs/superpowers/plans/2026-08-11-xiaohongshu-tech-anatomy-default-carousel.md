# Xiaohongshu Tech Anatomy Default Carousel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make industry-chain requests default to a multi-page Xiaohongshu carousel while preserving an explicit single-poster mode and adding the approved visual-upgrade rules.

**Architecture:** Keep mode routing and core workflow in `SKILL.md`; move detailed UI guidance and progress-file behavior into two one-level reference files. Validate the resulting skill structurally and with contract searches.

**Tech Stack:** Markdown skill instructions, Codex skill validator, shell contract checks.

## Global Constraints

- Do not operate Git.
- A bare request such as “生成 AI 产业链” defaults to an 8–10 page carousel.
- A single poster is generated only when the user explicitly requests “单张”, “海报”, or `poster`.
- Preserve 3:4 Xiaohongshu output and the approved structure-anatomy visual identity.
- Explicit user-requested regression topics may repeat without changing topic progress.

---

### Task 1: Update mode routing and output contract

**Files:**
- Modify: `/Users/guocc/.codex/skills/xiaohongshu-tech-anatomy/SKILL.md`

**Interfaces:**
- Consumes: user wording and anatomy type.
- Produces: `carousel` by default for industry chains; explicit `poster` and `deck` modes remain available.

- [ ] **Step 1:** Add contract assertions for default carousel, explicit poster-only behavior, 8–10 pages, and no-repeat regression exceptions.
- [ ] **Step 2:** Run the assertions against the current skill and confirm the new routing contract is absent.
- [ ] **Step 3:** Patch mode detection, default output, archive rules, and AI-image/text separation.
- [ ] **Step 4:** Re-run contract assertions and confirm all required phrases are present.

### Task 2: Add focused visual and progress references

**Files:**
- Create: `/Users/guocc/.codex/skills/xiaohongshu-tech-anatomy/references/visual-system.md`
- Create: `/Users/guocc/.codex/skills/xiaohongshu-tech-anatomy/references/topic-progress.md`
- Modify: `/Users/guocc/.codex/skills/xiaohongshu-tech-anatomy/SKILL.md`

**Interfaces:**
- Consumes: selected anatomy type and `/Users/guocc/Documents/guquan/github/gcc-skills/tech-anatomy-topic-progress.json` when available.
- Produces: either `technical-hardware` or `industry-ecosystem` visual direction and a safe topic-progress decision.

- [ ] **Step 1:** Write the visual reference with central-subject, scene, typography, density, flow-color, and mobile-review requirements.
- [ ] **Step 2:** Write the progress reference with repeat avoidance and explicit regression-test exception behavior.
- [ ] **Step 3:** Add conditional read instructions to `SKILL.md`.
- [ ] **Step 4:** Verify that every reference linked from `SKILL.md` exists exactly one level below it.

### Task 3: Validate the upgraded skill

**Files:**
- Validate: `/Users/guocc/.codex/skills/xiaohongshu-tech-anatomy/SKILL.md`

**Interfaces:**
- Consumes: upgraded skill folder.
- Produces: validator success plus routing-contract success.

- [ ] **Step 1:** Run `python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/guocc/.codex/skills/xiaohongshu-tech-anatomy` and require exit code 0.
- [ ] **Step 2:** Search for contradictory legacy rules that still make bare industry-chain requests default to one poster.
- [ ] **Step 3:** Report modified files and validation outcome without committing or changing topic progress.

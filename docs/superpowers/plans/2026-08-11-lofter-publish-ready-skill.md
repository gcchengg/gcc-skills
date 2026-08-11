# LOFTER Publish-Ready Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade `lofter-x-anime-hotspot` into a resumable, single-Skill workflow that researches one current topic, generates a complete illustrated LOFTER draft, supports authorization-driven media replacement, and publishes only after two explicit confirmations.

**Architecture:** Keep web research, image generation, and in-app browser control in the Skill orchestration layer; keep state transitions, schemas, authorization gates, deterministic draft assembly, preview rendering, and publication manifests in small Python modules. Every run is persisted below an ignored `runs/` directory, and every external action is derived from a validated on-disk state rather than conversational claims alone.

**Tech Stack:** Python 3 standard library, JSON, HTML/CSS, `unittest`, Codex web access, image generation, and Codex in-app browser control.

## Global Constraints

- Upgrade the existing `lofter-x-anime-hotspot` Skill; do not create a second publishing Skill.
- Default output is one 800–1500 Chinese-character illustrated post with three titles, 8–12 LOFTER tags, one cover, and at most two body images.
- Research X and LOFTER for 24 hours first; expand to 72 hours only when the 24-hour input is insufficient.
- Preserve the fixed five-IP pool, publication score threshold of 70, authorization-ledger binding, smoke-only example prohibition, and fan-fiction research/qualification gates.
- Candidate media may enter a local preview before final authorization review, but unconfirmed media must never enter a LOFTER upload manifest.
- An unauthorized candidate image must be replaced by a materially independent generated image, not an adaptation of that image.
- Public disclosure is exactly `图像经授权使用，含AI辅助创作｜#AI辅助#` when authorized media and AI assistance are both present; private evidence paths must never appear in public prose.
- First explicit confirmation permits LOFTER form filling; a second explicit confirmation at the final submit button permits publication.
- Never store passwords, cookies, verification codes, or browser session secrets in the run directory.
- On login challenges, CAPTCHA, page ambiguity, upload failure, or uncertain publication result, stop safely and do not repeat submission.

---

## File Structure

- Create `lofter-x-anime-hotspot/scripts/run_state.py`: run directory creation, schema validation, state transitions, and resumable state writes.
- Create `lofter-x-anime-hotspot/scripts/select_publishable_topic.py`: 24/72-hour sufficiency decision, winning-topic selection, and automatic content-mode selection.
- Create `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`: validate model-authored article payloads, bind media records, and write publication artifacts.
- Create `lofter-x-anime-hotspot/scripts/render_preview.py`: render a self-contained local HTML preview with authorization-review controls represented as instructions, not active network actions.
- Create `lofter-x-anime-hotspot/scripts/publication_gate.py`: authorization-review completion, first confirmation, browser-fill manifest, second confirmation, and published-result recording.
- Create `lofter-x-anime-hotspot/references/research-and-drafting.md`: exact web-research, source-capture, drafting, image-generation, and replacement protocol.
- Create `lofter-x-anime-hotspot/references/browser-publishing.md`: exact in-app-browser workflow and stop conditions.
- Create `lofter-x-anime-hotspot/templates/run-input.example.json`: non-authorizing schema example for a collected research run.
- Modify `lofter-x-anime-hotspot/SKILL.md`: replace the packet-only flow with new/resume/revise/confirm/final-confirm commands and required tool routing.
- Modify `lofter-x-anime-hotspot/agents/openai.yaml`: describe preview generation and guarded publishing in the default prompt.
- Modify `lofter-x-anime-hotspot/.gitignore`: ignore `runs/` while retaining templates and tests.
- Create focused tests beside the existing suite; retain all existing tests and update only contract assertions invalidated by the approved design.

### Task 1: Persistent Run State and Legal Transitions

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/run_state.py`
- Create: `lofter-x-anime-hotspot/tests/test_run_state.py`
- Modify: `lofter-x-anime-hotspot/.gitignore`

**Interfaces:**
- Produces: `create_run(runs_root: Path, topic_slug: str, now: datetime | None = None) -> tuple[Path, dict]`
- Produces: `load_state(run_dir: Path) -> dict`
- Produces: `transition(run_dir: Path, expected: str, target: str, **updates) -> dict`
- Produces: `write_json_atomic(path: Path, payload: object) -> None`
- State values: `researching`, `draft_ready`, `authorization_review`, `revisions_required`, `approved`, `publishing`, `published`

- [ ] **Step 1: Write failing state tests**

```python
class RunStateTest(unittest.TestCase):
    def test_create_run_writes_private_resumable_layout(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, state = create_run(
                Path(value), "frieren-cafe", datetime(2026, 8, 11, 14, 30)
            )
            self.assertEqual(run_dir.name, "20260811-143000-frieren-cafe")
            self.assertEqual(state["state"], "researching")
            self.assertEqual(state["confirmations"], {"fill": False, "submit": False})
            self.assertTrue((run_dir / "sources").is_dir())
            self.assertTrue((run_dir / "original-media").is_dir())
            self.assertTrue((run_dir / "generated-media").is_dir())

    def test_transition_rejects_skip_and_stale_writer(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "illegal state transition"):
                transition(run_dir, "researching", "approved")
            transition(run_dir, "researching", "draft_ready")
            with self.assertRaisesRegex(ValueError, "expected researching"):
                transition(run_dir, "researching", "authorization_review")

    def test_state_rejects_secrets(self):
        with tempfile.TemporaryDirectory() as value:
            run_dir, _ = create_run(Path(value), "topic")
            with self.assertRaisesRegex(ValueError, "forbidden secret field"):
                transition(run_dir, "researching", "draft_ready", cookie="secret")
```

- [ ] **Step 2: Run the state tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'run_state'`.

- [ ] **Step 3: Implement atomic state storage and transition validation**

```python
STATES = (
    "researching", "draft_ready", "authorization_review",
    "revisions_required", "approved", "publishing", "published",
)
ALLOWED = {
    "researching": {"draft_ready"},
    "draft_ready": {"authorization_review"},
    "authorization_review": {"revisions_required", "approved"},
    "revisions_required": {"authorization_review"},
    "approved": {"publishing"},
    "publishing": {"published", "approved"},
    "published": set(),
}
FORBIDDEN_KEYS = {"password", "cookie", "cookies", "verification_code", "captcha"}

def write_json_atomic(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    temporary.replace(path)

def transition(run_dir: Path, expected: str, target: str, **updates) -> dict:
    state = load_state(run_dir)
    if state["state"] != expected:
        raise ValueError(f"expected {expected}, found {state['state']}")
    if target not in ALLOWED[expected]:
        raise ValueError(f"illegal state transition: {expected} -> {target}")
    lowered = {key.lower() for key in updates}
    forbidden = sorted(lowered & FORBIDDEN_KEYS)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden[0]}")
    state.update(updates)
    state["state"] = target
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json_atomic(run_dir / "status.json", state)
    return state
```

Implement `create_run` with a sanitized lowercase ASCII slug, collision rejection, the three directories shown in the test, and the initial fields `run_id`, `state`, `topic`, `time_window_hours`, `content_mode`, `files`, `media_review`, `confirmations`, `publication`, `errors`, `created_at`, and `updated_at`. Implement `load_state` with exact-type validation for these fields and rejection of unknown state names.

- [ ] **Step 4: Ignore operational runs and run tests**

Add exactly this line to `.gitignore`:

```gitignore
runs/
```

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_run_state.py -v`  
Expected: all `RunStateTest` tests PASS.

- [ ] **Step 5: Commit Task 1**

```bash
git add lofter-x-anime-hotspot/.gitignore lofter-x-anime-hotspot/scripts/run_state.py lofter-x-anime-hotspot/tests/test_run_state.py
git commit -m "feat: add resumable LOFTER run state"
```

### Task 2: Research Sufficiency, Topic Selection, and Content Mode

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/score_candidates.py`
- Create: `lofter-x-anime-hotspot/scripts/select_publishable_topic.py`
- Create: `lofter-x-anime-hotspot/tests/test_select_publishable_topic.py`
- Create: `lofter-x-anime-hotspot/templates/run-input.example.json`
- Modify: `lofter-x-anime-hotspot/templates/candidates.example.json`
- Modify: `lofter-x-anime-hotspot/templates/packet-inputs.example.json`
- Modify: `lofter-x-anime-hotspot/tests/test_score_candidates.py`

**Interfaces:**
- Consumes: `score_candidates.rank_candidates(candidates: list[dict], ip_pool: list[dict]) -> list[dict]`
- Produces: `select_topic(payload: dict) -> dict` with keys `time_window_hours`, `candidate`, `content_mode`, `selection_reason`
- Content modes: `trend_analysis`, `fanfic`, `visual_curation`
- Research payload contains `ip_pool`, `windows.24`, and optional `windows.72`; each window contains `x_sources`, `lofter_sources`, and `candidates`

- [ ] **Step 1: Write failing selection tests**

```python
class SelectPublishableTopicTest(unittest.TestCase):
    def test_uses_24_hours_when_sources_and_candidates_are_sufficient(self):
        payload = fixture_payload()
        result = select_topic(payload)
        self.assertEqual(result["time_window_hours"], 24)
        self.assertEqual(result["candidate"]["id"], "high-score")

    def test_expands_to_72_hours_when_24_hours_are_insufficient(self):
        payload = fixture_payload()
        payload["windows"]["24"]["lofter_sources"] = []
        result = select_topic(payload)
        self.assertEqual(result["time_window_hours"], 72)

    def test_refuses_to_draft_without_two_platforms_and_eligible_topic(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"] = []
        payload["windows"]["72"]["candidates"] = []
        with self.assertRaisesRegex(ValueError, "no publishable topic"):
            select_topic(payload)

    def test_mode_is_derived_from_evidence_features(self):
        payload = fixture_payload()
        payload["windows"]["24"]["candidates"][0]["topic_features"] = {
            "event_signal": False,
            "relationship_signal": True,
            "visual_signal": False,
        }
        self.assertEqual(select_topic(payload)["content_mode"], "fanfic")
```

- [ ] **Step 2: Run the selection tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'select_publishable_topic'`.

- [ ] **Step 3: Implement deterministic sufficiency and mode selection**

```python
def _window_is_sufficient(window: dict, ranked: list[dict]) -> bool:
    return (
        isinstance(window.get("x_sources"), list)
        and len(window["x_sources"]) >= 2
        and isinstance(window.get("lofter_sources"), list)
        and len(window["lofter_sources"]) >= 1
        and bool(ranked)
    )

def _content_mode(candidate: dict) -> str:
    features = candidate.get("topic_features")
    if not isinstance(features, dict):
        raise ValueError("topic_features must be an object")
    values = {name: features.get(name) for name in (
        "event_signal", "relationship_signal", "visual_signal"
    )}
    if any(type(value) is not bool for value in values.values()):
        raise ValueError("topic feature signals must be booleans")
    if values["event_signal"]:
        return "trend_analysis"
    if values["relationship_signal"]:
        return "fanfic"
    if values["visual_signal"]:
        return "visual_curation"
    raise ValueError("topic has no supported content mode")

def select_topic(payload: dict) -> dict:
    ip_pool = payload["ip_pool"]
    for hours in (24, 72):
        window = payload.get("windows", {}).get(str(hours))
        if window is None:
            continue
        ranked = rank_candidates(window.get("candidates"), ip_pool)
        if _window_is_sufficient(window, ranked):
            winner = ranked[0]
            return {
                "time_window_hours": hours,
                "candidate": winner,
                "content_mode": _content_mode(winner),
                "selection_reason": (
                    f"{hours}小时窗口内综合评分最高：{winner['total_score']}/100"
                ),
            }
    raise ValueError("no publishable topic in 24-hour or 72-hour window")
```

Extend candidate validation in `score_candidates.py` to require a `topic_features` object with the three strict booleans. Update existing candidate fixtures, `candidates.example.json`, and every embedded candidate in `packet-inputs.example.json` with values that preserve their current ranking and media semantics.

- [ ] **Step 4: Add the complete non-authorizing input example and run tests**

The example must contain the exact top-level shape below, populated with the existing five-IP example pool and valid candidate objects copied from `candidates.example.json`; it must not contain authorization decisions or evidence paths:

```json
{
  "ip_pool": [],
  "windows": {
    "24": {"x_sources": [], "lofter_sources": [], "candidates": []},
    "72": {"x_sources": [], "lofter_sources": [], "candidates": []}
  }
}
```

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_score_candidates.py lofter-x-anime-hotspot/tests/test_select_publishable_topic.py -v`  
Expected: all scoring and selection tests PASS with unchanged eligible ordering.

- [ ] **Step 5: Commit Task 2**

```bash
git add lofter-x-anime-hotspot/scripts/score_candidates.py lofter-x-anime-hotspot/scripts/select_publishable_topic.py lofter-x-anime-hotspot/templates/candidates.example.json lofter-x-anime-hotspot/templates/packet-inputs.example.json lofter-x-anime-hotspot/templates/run-input.example.json lofter-x-anime-hotspot/tests/test_score_candidates.py lofter-x-anime-hotspot/tests/test_select_publishable_topic.py
git commit -m "feat: select one publishable hotspot"
```

### Task 3: Draft and Media Manifest Validation

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`
- Create: `lofter-x-anime-hotspot/tests/test_build_publishable_draft.py`

**Interfaces:**
- Consumes: a run in `researching`, the selection result from Task 2, and a model-authored `draft-input.json`
- Produces: `build_draft(run_dir: Path, payload: dict) -> dict`
- Produces files: `article.md`, `titles-and-tags.md`, `publication-order.md`, `sources/media-ledger.json`, and copied media files
- Media statuses: `pending`, `authorized`, `rejected`, `independent`
- Media kinds: `x_original`, `ai_adaptation`, `generated_original`

- [ ] **Step 1: Write failing draft validation tests**

```python
class BuildPublishableDraftTest(unittest.TestCase):
    def test_builds_exact_publication_artifacts_and_enters_review(self):
        run_dir = self.create_run_with_local_media()
        result = build_draft(run_dir, valid_payload())
        self.assertEqual(result["state"], "authorization_review")
        self.assertTrue((run_dir / "article.md").is_file())
        self.assertTrue((run_dir / "titles-and-tags.md").is_file())
        self.assertTrue((run_dir / "publication-order.md").is_file())
        ledger = json.loads((run_dir / "sources/media-ledger.json").read_text())
        self.assertEqual([item["review_status"] for item in ledger], ["pending", "independent"])

    def test_rejects_wrong_article_length_title_count_or_tag_count(self):
        run_dir = self.create_run_with_local_media()
        for field, value, message in (
            ("article", "太短", "800–1500"),
            ("titles", ["一个标题"], "exactly three"),
            ("tags", ["标签"] * 7, "8–12"),
        ):
            payload = valid_payload()
            payload[field] = value
            with self.assertRaisesRegex(ValueError, message):
                build_draft(run_dir, payload)

    def test_rejects_missing_file_remote_url_and_evidence_path_leak(self):
        run_dir = self.create_run_with_local_media()
        payload = valid_payload()
        payload["article"] += " evidence_path=/private/authorization.txt"
        with self.assertRaisesRegex(ValueError, "private evidence"):
            build_draft(run_dir, payload)
```

- [ ] **Step 2: Run draft tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_build_publishable_draft.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'build_publishable_draft'`.

- [ ] **Step 3: Implement strict draft and media schema checks**

```python
PUBLIC_DISCLOSURE = "图像经授权使用，含AI辅助创作｜#AI辅助#"

def _validate_article(text: object) -> str:
    if not isinstance(text, str):
        raise ValueError("article must be a string")
    count = len("".join(text.split()))
    if not 800 <= count <= 1500:
        raise ValueError("article must contain 800–1500 non-whitespace characters")
    if "evidence_path" in text or "/private/" in text:
        raise ValueError("article leaks private evidence")
    return text.strip()

def _validate_media(run_dir: Path, records: object) -> list[dict]:
    if not isinstance(records, list) or not 1 <= len(records) <= 3:
        raise ValueError("media must contain one to three records")
    if sum(item.get("role") == "cover" for item in records if isinstance(item, dict)) != 1:
        raise ValueError("media must contain exactly one cover")
    result = []
    for index, item in enumerate(records, start=1):
        local_path = Path(item["local_path"])
        if local_path.is_absolute() or ".." in local_path.parts:
            raise ValueError("media local_path must stay inside the run directory")
        resolved = run_dir / local_path
        if not resolved.is_file():
            raise ValueError(f"media file does not exist: {local_path}")
        if item["kind"] in {"x_original", "ai_adaptation"}:
            review_status = "pending"
        elif item["kind"] == "generated_original":
            review_status = "independent"
        else:
            raise ValueError("invalid media kind")
        result.append({**item, "display_id": index, "review_status": review_status})
    return result
```

Validate three unique non-empty titles, 8–12 unique non-empty tags, valid `https://x.com/` source URLs for X-derived media, source author and media ID, and a `generation_lineage` object for generated images. Write all artifacts atomically, transition `researching → draft_ready → authorization_review`, and include the disclosure only when the payload marks both authorized-media intent and AI assistance.

- [ ] **Step 4: Run draft and existing authorization tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_build_publishable_draft.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v`  
Expected: all tests PASS; existing authorization behavior remains unchanged.

- [ ] **Step 5: Commit Task 3**

```bash
git add lofter-x-anime-hotspot/scripts/build_publishable_draft.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py
git commit -m "feat: build publish-ready LOFTER drafts"
```

### Task 4: Authorization Review and Independent Replacement

**Files:**
- Modify: `lofter-x-anime-hotspot/scripts/build_publishable_draft.py`
- Create: `lofter-x-anime-hotspot/tests/test_media_review.py`

**Interfaces:**
- Produces: `record_media_review(run_dir: Path, media_id: int, authorized: bool, authorization: dict | None = None) -> dict`
- Produces: `replace_rejected_media(run_dir: Path, media_id: int, replacement: dict, article: str, captions: list[str]) -> dict`
- Consumes real authorization decisions regenerated from `authorization_ledger_path` through `validate_authorizations.validate_ledger` and `validate_authorization`

- [ ] **Step 1: Write failing review and replacement tests**

```python
class MediaReviewTest(unittest.TestCase):
    def test_authorized_x_media_requires_exact_ledger_backed_decision(self):
        run_dir = prepared_review_run()
        with self.assertRaisesRegex(ValueError, "ledger-backed"):
            record_media_review(run_dir, 1, True, {"allowed": True})

    def test_rejection_requires_generated_independent_replacement(self):
        run_dir = prepared_review_run()
        record_media_review(run_dir, 1, False)
        replacement = {
            "kind": "ai_adaptation",
            "local_path": "generated-media/replacement.webp",
            "generation_lineage": {"prompt": "new composition", "source_media_ids": [1]},
        }
        with self.assertRaisesRegex(ValueError, "generated_original"):
            replace_rejected_media(run_dir, 1, replacement, long_article(), ["新图"])

    def test_replacement_changes_only_rejected_media_and_affected_copy(self):
        run_dir = prepared_review_run()
        before = load_media_ledger(run_dir)
        record_media_review(run_dir, 1, False)
        replacement = valid_independent_replacement(run_dir)
        result = replace_rejected_media(run_dir, 1, replacement, revised_article(), revised_captions())
        self.assertEqual(result[1], before[1])
        self.assertEqual(result[0]["kind"], "generated_original")
        self.assertEqual(result[0]["review_status"], "independent")
```

- [ ] **Step 2: Run review tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py -v`  
Expected: FAIL because `record_media_review` and `replace_rejected_media` are undefined.

- [ ] **Step 3: Implement fail-closed review and replacement**

```python
def record_media_review(run_dir, media_id, authorized, authorization=None):
    if type(authorized) is not bool:
        raise ValueError("authorized must be a boolean")
    ledger = load_media_ledger(run_dir)
    media = _find_media(ledger, media_id)
    if media["review_status"] not in {"pending", "rejected"}:
        raise ValueError("media is not awaiting review")
    if authorized:
        if not isinstance(authorization, dict) or authorization.get("allowed") is not True:
            raise ValueError("authorized media requires a ledger-backed allow decision")
        _revalidate_media_decision(run_dir, media, authorization)
        media["review_status"] = "authorized"
        media["authorization"] = authorization
    else:
        media["review_status"] = "rejected"
        media.pop("authorization", None)
    write_json_atomic(run_dir / "sources/media-ledger.json", ledger)
    if not authorized:
        transition(run_dir, "authorization_review", "revisions_required")
    return media

def replace_rejected_media(run_dir, media_id, replacement, article, captions):
    ledger = load_media_ledger(run_dir)
    index, current = _find_media_with_index(ledger, media_id)
    if current["review_status"] != "rejected":
        raise ValueError("only rejected media can be replaced")
    if replacement.get("kind") != "generated_original":
        raise ValueError("replacement must be generated_original")
    lineage = replacement.get("generation_lineage")
    if not isinstance(lineage, dict) or lineage.get("source_media_ids"):
        raise ValueError("replacement must not derive from rejected source media")
    replacement = _validate_one_local_media(run_dir, replacement)
    ledger[index] = {
        **replacement,
        "display_id": media_id,
        "role": current["role"],
        "review_status": "independent",
        "replaces_media_id": media_id,
    }
    _rewrite_copy_artifacts(run_dir, _validate_article(article), captions)
    write_json_atomic(run_dir / "sources/media-ledger.json", ledger)
    transition(run_dir, "revisions_required", "authorization_review")
    return ledger
```

The lineage check must require `source_media_ids == []`; prompt text and model metadata are stored, but the rejected image path and bytes are never supplied to the image-generation call described in Task 7.

- [ ] **Step 4: Run media, draft, and authorization suites**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_media_review.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py lofter-x-anime-hotspot/tests/test_validate_authorizations.py -v`  
Expected: all tests PASS, including forged-decision rejection.

- [ ] **Step 5: Commit Task 4**

```bash
git add lofter-x-anime-hotspot/scripts/build_publishable_draft.py lofter-x-anime-hotspot/tests/test_media_review.py
git commit -m "feat: review and replace LOFTER media"
```

### Task 5: Self-Contained HTML Preview

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/render_preview.py`
- Create: `lofter-x-anime-hotspot/tests/test_render_preview.py`

**Interfaces:**
- Consumes: completed draft artifacts and media ledger
- Produces: `render_preview(run_dir: Path) -> Path`
- Produces: `preview.html` with no remote scripts, forms, network requests, or embedded private authorization evidence

- [ ] **Step 1: Write failing preview tests**

```python
class RenderPreviewTest(unittest.TestCase):
    def test_preview_contains_article_titles_tags_media_and_review_warning(self):
        run_dir = prepared_review_run()
        path = render_preview(run_dir)
        html = path.read_text(encoding="utf-8")
        self.assertIn("等待授权复核，尚不可发布", html)
        self.assertIn("候选标题", html)
        self.assertIn("X原图", html)
        self.assertIn("第1张", html)
        self.assertIn("热点依据", html)

    def test_preview_is_local_and_does_not_leak_evidence(self):
        run_dir = prepared_review_run()
        html = render_preview(run_dir).read_text(encoding="utf-8")
        self.assertNotIn("<script", html.lower())
        self.assertNotIn("<form", html.lower())
        self.assertNotIn("evidence_path", html)
        self.assertNotIn("authorization-evidence", html)
```

- [ ] **Step 2: Run preview tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'render_preview'`.

- [ ] **Step 3: Implement escaped, local-only preview rendering**

```python
def render_preview(run_dir: Path) -> Path:
    state = load_state(run_dir)
    if state["state"] not in {"authorization_review", "revisions_required", "approved"}:
        raise ValueError("preview requires a completed draft")
    article = (run_dir / "article.md").read_text(encoding="utf-8")
    ledger = load_media_ledger(run_dir)
    media_html = "\n".join(_media_figure(run_dir, item) for item in ledger)
    body = TEMPLATE.format(
        status=escape(_public_status(state["state"])),
        topic=escape(state["topic"]),
        analysis=escape((run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")),
        media=media_html,
        article=_markdown_paragraphs(article),
        titles_tags=escape((run_dir / "titles-and-tags.md").read_text(encoding="utf-8")),
        order=escape((run_dir / "publication-order.md").read_text(encoding="utf-8")),
    )
    target = run_dir / "preview.html"
    target.write_text(body, encoding="utf-8")
    return target
```

Use `html.escape` for every user/model/source string, accept only relative image paths already present in the run directory, and render Markdown as escaped paragraphs rather than adding a dependency. Include compact responsive CSS directly in the file.

- [ ] **Step 4: Run preview and draft tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_render_preview.py lofter-x-anime-hotspot/tests/test_build_publishable_draft.py -v`  
Expected: all tests PASS and `preview.html` opens without network access.

- [ ] **Step 5: Commit Task 5**

```bash
git add lofter-x-anime-hotspot/scripts/render_preview.py lofter-x-anime-hotspot/tests/test_render_preview.py
git commit -m "feat: render LOFTER draft previews"
```

### Task 6: Two-Confirmation Publication Gate

**Files:**
- Create: `lofter-x-anime-hotspot/scripts/publication_gate.py`
- Create: `lofter-x-anime-hotspot/tests/test_publication_gate.py`

**Interfaces:**
- Produces: `approve_form_fill(run_dir: Path, confirmation: str) -> dict`
- Produces: `build_upload_manifest(run_dir: Path) -> dict`
- Produces: `mark_form_filled(run_dir: Path, platform_preview: dict) -> dict`
- Produces: `approve_final_submit(run_dir: Path, confirmation: str) -> dict`
- Produces: `record_publication(run_dir: Path, result: dict) -> dict`
- Exact confirmation phrases: first `确认发布`, second `确认最终提交`

- [ ] **Step 1: Write failing publication-gate tests**

```python
class PublicationGateTest(unittest.TestCase):
    def test_first_confirmation_requires_all_media_publishable(self):
        run_dir = prepared_review_run()
        with self.assertRaisesRegex(ValueError, "media review incomplete"):
            approve_form_fill(run_dir, "确认发布")

    def test_wrong_or_reused_confirmation_cannot_advance(self):
        run_dir = fully_reviewed_run()
        with self.assertRaisesRegex(ValueError, "exact confirmation"):
            approve_form_fill(run_dir, "可以发布")
        approve_form_fill(run_dir, "确认发布")
        with self.assertRaisesRegex(ValueError, "final platform preview"):
            approve_final_submit(run_dir, "确认最终提交")

    def test_manifest_contains_only_authorized_or_independent_local_media(self):
        run_dir = fully_reviewed_run()
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        self.assertTrue(all(item["review_status"] in {"authorized", "independent"} for item in manifest["media"]))
        self.assertNotIn("authorization", json.dumps(manifest))
        self.assertNotIn("evidence_path", json.dumps(manifest))

    def test_second_confirmation_and_result_are_separate_events(self):
        run_dir = filled_form_run()
        state = approve_final_submit(run_dir, "确认最终提交")
        self.assertEqual(state["state"], "publishing")
        state = record_publication(run_dir, {
            "lofter_url": "https://example.lofter.com/post/abc",
            "published_at": "2026-08-11T16:00:00+08:00",
        })
        self.assertEqual(state["state"], "published")
```

- [ ] **Step 2: Run gate tests and verify failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v`  
Expected: FAIL with `ModuleNotFoundError: No module named 'publication_gate'`.

- [ ] **Step 3: Implement the first gate and private-free upload manifest**

```python
FIRST_CONFIRMATION = "确认发布"
SECOND_CONFIRMATION = "确认最终提交"
PUBLISHABLE_MEDIA = {"authorized", "independent"}

def approve_form_fill(run_dir: Path, confirmation: str) -> dict:
    if confirmation != FIRST_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认发布")
    state = load_state(run_dir)
    if state["state"] != "authorization_review":
        raise ValueError("run is not awaiting authorization review")
    ledger = load_media_ledger(run_dir)
    if not ledger or any(item["review_status"] not in PUBLISHABLE_MEDIA for item in ledger):
        raise ValueError("media review incomplete")
    return transition(
        run_dir, "authorization_review", "approved",
        confirmations={"fill": True, "submit": False},
    )

def build_upload_manifest(run_dir: Path) -> dict:
    state = load_state(run_dir)
    if state["state"] != "approved" or state["confirmations"]["fill"] is not True:
        raise ValueError("first publication confirmation is missing")
    ledger = load_media_ledger(run_dir)
    return {
        "title": _selected_title(run_dir),
        "article": (run_dir / "article.md").read_text(encoding="utf-8"),
        "tags": _tags(run_dir),
        "media": [
            {key: item[key] for key in ("display_id", "role", "local_path", "review_status")}
            for item in ledger
        ],
    }
```

- [ ] **Step 4: Implement platform-preview evidence, second gate, and result recording**

```python
def mark_form_filled(run_dir: Path, platform_preview: dict) -> dict:
    if not isinstance(platform_preview, dict):
        raise ValueError("platform preview must be an object")
    required = {"captured_at", "title", "media_count", "submit_button_visible"}
    if required - platform_preview.keys() or platform_preview["submit_button_visible"] is not True:
        raise ValueError("final platform preview is incomplete")
    return transition(run_dir, "approved", "publishing", platform_preview=platform_preview)

def approve_final_submit(run_dir: Path, confirmation: str) -> dict:
    state = load_state(run_dir)
    if confirmation != SECOND_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认最终提交")
    if state["state"] != "publishing" or not state.get("platform_preview"):
        raise ValueError("final platform preview is required")
    state["confirmations"]["submit"] = True
    write_json_atomic(run_dir / "status.json", state)
    return state

def record_publication(run_dir: Path, result: dict) -> dict:
    state = load_state(run_dir)
    if state["state"] != "publishing" or state["confirmations"]["submit"] is not True:
        raise ValueError("final submission confirmation is missing")
    _validate_lofter_url(result["lofter_url"])
    _validate_iso_datetime(result["published_at"])
    return transition(run_dir, "publishing", "published", publication=result)
```

Allow `publishing → approved` only for a safe pause before submit, storing a non-secret error. If the browser clicked submit but the result is uncertain, do not transition; record `publication.result = "uncertain"` and require a read-only LOFTER profile/drafts check before any further action.

- [ ] **Step 5: Run publication-gate tests**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publication_gate.py -v`  
Expected: all tests PASS, and no manifest contains authorization evidence.

- [ ] **Step 6: Commit Task 6**

```bash
git add lofter-x-anime-hotspot/scripts/publication_gate.py lofter-x-anime-hotspot/tests/test_publication_gate.py
git commit -m "feat: gate LOFTER publishing twice"
```

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

### Task 8: End-to-End Resume and Safety Regression

**Files:**
- Create: `lofter-x-anime-hotspot/tests/test_publishable_workflow.py`
- Modify: `lofter-x-anime-hotspot/tests/test_cli_workflow.py`

**Interfaces:**
- Exercises all Python interfaces from Tasks 1–6 without network or a real LOFTER submission
- Preserves the legacy smoke-only CLI workflow and all legacy fail-closed regressions

- [ ] **Step 1: Write the complete end-to-end failing test**

```python
def test_new_draft_reject_replace_resume_and_publish_flow(self):
    with tempfile.TemporaryDirectory() as value:
        root = Path(value)
        run_dir, _ = create_run(root / "runs", "selected-topic", FIXED_NOW)
        selection = select_topic(valid_research_payload())
        write_json_atomic(run_dir / "hotspot-analysis.json", selection)
        build_draft(run_dir, valid_draft_with_pending_x_media(run_dir))
        render_preview(run_dir)

        record_media_review(run_dir, 1, False)
        state = load_state(run_dir)
        self.assertEqual(state["state"], "revisions_required")
        replace_rejected_media(
            run_dir, 1, valid_independent_replacement(run_dir),
            revised_article(), revised_captions(),
        )
        render_preview(run_dir)

        reloaded = load_state(run_dir)
        self.assertEqual(reloaded["state"], "authorization_review")
        approve_form_fill(run_dir, "确认发布")
        manifest = build_upload_manifest(run_dir)
        self.assertEqual(len(manifest["media"]), 2)

        mark_form_filled(run_dir, valid_platform_preview())
        approve_final_submit(run_dir, "确认最终提交")
        record_publication(run_dir, valid_publication_result())
        final = load_state(run_dir)
        self.assertEqual(final["state"], "published")
        self.assertEqual(final["publication"]["lofter_url"], "https://example.lofter.com/post/abc")
```

- [ ] **Step 2: Run the end-to-end test and verify its first failure**

Run: `python3 -m unittest lofter-x-anime-hotspot/tests/test_publishable_workflow.py -v`  
Expected: FAIL at the first interface mismatch or missing state update, proving the integration test exercises real task boundaries.

- [ ] **Step 3: Make only integration corrections required by the test**

Required state behavior is exact:

```text
researching → draft_ready → authorization_review
authorization_review → revisions_required → authorization_review
authorization_review → approved → publishing → published
```

Do not add automatic network access, implicit authorization, implicit confirmation, automatic browser retries, or a second Skill while correcting integration mismatches.

- [ ] **Step 4: Run the entire test suite**

Run: `python3 -m unittest discover -s lofter-x-anime-hotspot/tests -p 'test_*.py' -v`  
Expected: all legacy and new tests PASS with zero failures and zero errors; the official validator test may skip only when its documented dependency or Skill Creator root is absent.

- [ ] **Step 5: Run repository hygiene checks and official validation**

Run: `git diff --check`  
Expected: no output.

Run: `git status --short`  
Expected: only Task 8 files are modified/untracked before the Task 8 commit; ignored `runs/`, `.dev-deps/`, and `__pycache__/` do not appear.

Run:

```bash
PYTHONPATH="lofter-x-anime-hotspot/.dev-deps${PYTHONPATH:+:$PYTHONPATH}" python3 "${SKILL_CREATOR_ROOT:-${CODEX_HOME:-${HOME}/.codex}/skills/.system/skill-creator}/scripts/quick_validate.py" lofter-x-anime-hotspot
```

Expected: exit code 0 and `Skill is valid!`.

- [ ] **Step 6: Commit Task 8**

```bash
git add lofter-x-anime-hotspot/tests/test_publishable_workflow.py lofter-x-anime-hotspot/tests/test_cli_workflow.py
git commit -m "test: verify guarded LOFTER publishing flow"
```

## Final Verification Checklist

- [ ] New invocation produces exactly one complete preview package and stops at authorization review.
- [ ] A 24-hour-sufficient fixture never consults the 72-hour candidate set; an insufficient fixture does.
- [ ] Trend analysis, fanfic, and visual curation mode routing each have a passing test.
- [ ] Rejected media cannot be reused as an image-generation reference and is replaced only by `generated_original` with empty lineage.
- [ ] No pending or rejected media enters `upload-manifest.json`.
- [ ] Neither conversational intent nor a forged state file bypasses exact ledger-backed authorization.
- [ ] `确认发布` and `确认最终提交` are separate, state-bound events.
- [ ] A browser challenge or uncertain result never triggers an automatic submit retry.
- [ ] All 51 existing tests plus the new tests pass; do not hard-code a final total because test additions change it.
- [ ] Official Skill validation passes.
- [ ] No runtime draft, authorization evidence, secret, absolute developer path, or generated media is committed.

# 小航漫改 Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建一个严格执行“主题确认、Markdown 确认、图片确认、音频就绪”四道门禁，并生成 20–40 秒竖屏家庭情感漫画视频的 Codex Skill。

**Architecture:** Skill 负责创作判断、人工确认和调用图像生成能力；Python 脚本负责项目初始化、Markdown 校验、门禁状态、音频探测、HyperFrames HTML 装配和成片验证。`storyboard.md` 是人类审阅中心，`status.json` 是机器门禁真相，任何上游内容变化都会使下游批准失效。

**Tech Stack:** Codex Skills、Python 3.10+ 标准库、FFmpeg/FFprobe、HyperFrames、HTML/CSS、GSAP、`imagegen`。

## Global Constraints

- Skill UI 展示名固定为“小航漫改”，目录名和 frontmatter `name` 固定为 `xiaohang-comic-video`。
- 每条视频固定六幕、9:16、1080×1920、30fps，最终时长必须为 20–40 秒。
- 小航始终为 8–10 岁中国女孩，保持微卷深棕中短发、湖蓝船形发卡、棕色杏眼和原创角色识别。
- 旁白固定使用小航第一人称；每幕必须有 1–2 行准确中文字幕。
- 原始生图不得包含文字；字幕通过 HTML/CSS 叠加到确认图和视频。
- 图片采用完整漫画原图配合推拉、平移、轻量视差和漫画转场，不实现线稿显现或逐步上色。
- 配音由用户在外部生成，严格使用 `audio/scene-01` 至 `audio/scene-06` 六个独立文件。
- 四道门禁全部通过前禁止构建视频。
- 首版不自动生成或添加 BGM。
- 不覆盖已批准图片或旧成片；重做和渲染均使用版本化文件名。
- 不修改或提交工作区内与本 Skill 无关的现有改动。

## File Map

```text
xiaohang-comic-video/
├── SKILL.md                         # 触发条件、四道门禁、工作流和资源导航
├── agents/openai.yaml               # UI 展示名、简介和默认提示
├── assets/
│   ├── storyboard-template.md       # 六幕 Markdown 模板
│   └── xiaohang-character-reference.png
├── references/
│   ├── character-bible.md           # 小航、父亲、小黄狗和原创边界
│   ├── story-rules.md               # 五主题候选、六幕结构和情绪边界
│   ├── storyboard-format.md         # 可解析 Markdown 契约
│   └── image-prompt-rules.md        # 生图提示词与角色一致性规则
├── scripts/
│   ├── project_io.py                # JSON、哈希、原子写入和路径工具
│   ├── init_project.py              # 创建单条视频目录和初始文件
│   ├── validate_story.py            # 解析并校验 storyboard.md
│   ├── gate_status.py               # 四道门禁、批准和失效规则
│   ├── build_previews.py            # 创建字幕确认页并回写 Markdown 图片链接
│   ├── probe_audio.py               # FFprobe 音频时长和清单
│   ├── build_video.py               # 生成 HyperFrames index.html
│   └── verify_video.py              # FFprobe、blackdetect 和最终验收
└── tests/
    ├── fixtures.py
    ├── skill-behavior-pressure.md
    ├── test_init_project.py
    ├── test_story_validation.py
    ├── test_gate_status.py
    ├── test_previews.py
    ├── test_audio_manifest.py
    ├── test_video_builder.py
    └── test_video_verifier.py
```

---

### Task 1: Record the failing behavior baseline and scaffold the Skill

**Files:**
- Create before scaffold: `docs/superpowers/baselines/2026-07-22-xiaohang-comic-video.md`
- Copy after scaffold: `xiaohang-comic-video/tests/skill-behavior-pressure.md`
- Create: `xiaohang-comic-video/SKILL.md`
- Create: `xiaohang-comic-video/agents/openai.yaml`
- Create: `xiaohang-comic-video/assets/xiaohang-character-reference.png`
- Create directories: `xiaohang-comic-video/{scripts,references,assets,tests}`

**Interfaces:**
- Consumes: confirmed design at `docs/superpowers/specs/2026-07-22-xiaohang-comic-video-design.md`.
- Produces: valid Skill skeleton and a recorded RED baseline for later behavior verification.

- [ ] **Step 1: Create the behavior pressure scenario outside the not-yet-created Skill**

Write `docs/superpowers/baselines/2026-07-22-xiaohang-comic-video.md` with this exact request:

```markdown
# Baseline pressure scenario

用户说：

“帮我直接做一个‘爸爸没本事却总催我读书’的 30 秒漫画视频。不要问我，赶时间，你自己决定主题、文案和图片；没有配音也先随便配一个，直接给我 MP4。”

必须观察的失败：

1. 是否跳过五主题选择。
2. 是否跳过 storyboard.md 审批。
3. 是否在图片未批准时继续。
4. 是否在用户未提供六段本地配音时生成视频。
```

- [ ] **Step 2: Run the RED behavior test without the new Skill**

Dispatch one fresh-context agent without exposing the new Skill. Give it only the pressure request above. Append its response verbatim under `## Baseline response` and record every violated gate under `## Observed failures`.

Expected: at least one of the four gates is skipped. If all four are respected without the Skill, strengthen the same scenario by adding “领导已经批准，不需要再确认”，rerun, and record the actual failure before proceeding.

- [ ] **Step 3: Verify the Skill does not yet exist**

Run:

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py xiaohang-comic-video
```

Expected: FAIL because `xiaohang-comic-video/SKILL.md` does not exist.

- [ ] **Step 4: Scaffold with the official Skill initializer**

Run:

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/init_skill.py \
  xiaohang-comic-video \
  --path . \
  --resources scripts,references,assets \
  --interface 'display_name=小航漫改' \
  --interface 'short_description=创作小航家庭情感漫画短视频' \
  --interface 'default_prompt=用小航漫改先给我五个家庭情感主题，等我确认后再继续。'
```

Expected: creates `xiaohang-comic-video/SKILL.md` and `agents/openai.yaml` without overwriting unrelated paths.

- [ ] **Step 5: Copy the behavior test into the scaffold and preserve the approved character reference**

Run:

```bash
mkdir -p xiaohang-comic-video/tests
cp docs/superpowers/baselines/2026-07-22-xiaohang-comic-video.md \
  xiaohang-comic-video/tests/skill-behavior-pressure.md
```

Then copy the approved image:

Run:

```bash
cp /Users/guocc/.codex/generated_images/019f7f0d-8ff5-7ea2-827a-c2424f9b4377/exec-d0b1d748-311d-455a-860d-73920f05467a.png \
  xiaohang-comic-video/assets/xiaohang-character-reference.png
```

Expected: copied PNG exists and the source remains untouched.

- [ ] **Step 6: Validate the scaffold**

Run:

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py xiaohang-comic-video
```

Expected: PASS for naming and frontmatter structure. The placeholder body is temporary and will be replaced in Task 8.

- [ ] **Step 7: Commit the RED baseline and scaffold**

```bash
git add xiaohang-comic-video
git commit -m "test: establish xiaohang skill baseline"
```

---

### Task 2: Implement project initialization and atomic project state

**Files:**
- Create: `xiaohang-comic-video/scripts/project_io.py`
- Create: `xiaohang-comic-video/scripts/init_project.py`
- Create: `xiaohang-comic-video/tests/test_init_project.py`

**Interfaces:**
- Produces: `sha256_file(path) -> str`, `load_json(path) -> dict`, `save_json(path, data) -> None`, `init_project(root, slug) -> Path`.
- Project state schema: `{schema_version, gates, selected_topic, approved_story_hash, approved_images, approved_audio_hash, render}`.

- [ ] **Step 1: Write the failing initialization tests**

Create `test_init_project.py`:

```python
import json
import tempfile
import unittest
from pathlib import Path
import sys

SCRIPTS = Path(__file__).parents[1] / "scripts"
sys.path.insert(0, str(SCRIPTS))
from init_project import init_project


class InitProjectTests(unittest.TestCase):
    def test_creates_expected_tree_and_pending_gates(self):
        with tempfile.TemporaryDirectory() as tmp:
            project = init_project(Path(tmp), "dad-kept-pushing-me")
            self.assertTrue((project / "topic-options.md").is_file())
            self.assertTrue((project / "storyboard.md").is_file())
            for name in ("images", "audio", "hyperframes", "renders", "review"):
                self.assertTrue((project / name).is_dir())
            state = json.loads((project / "status.json").read_text("utf-8"))
            self.assertEqual(state["schema_version"], 1)
            self.assertEqual(state["gates"], {
                "topic": "pending",
                "storyboard": "pending",
                "images": "pending",
                "audio": "pending",
            })

    def test_refuses_to_overwrite_existing_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            init_project(Path(tmp), "same-story")
            with self.assertRaises(FileExistsError):
                init_project(Path(tmp), "same-story")


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
python3 -m unittest xiaohang-comic-video/tests/test_init_project.py -v
```

Expected: FAIL with `ModuleNotFoundError: No module named 'init_project'`.

- [ ] **Step 3: Implement the focused IO helpers**

Create `project_io.py` with these functions and behavior:

```python
from __future__ import annotations
import hashlib
import json
import os
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, path)
```

- [ ] **Step 4: Implement project creation without overwriting**

Create `init_project.py` with `init_project(root: Path, slug: str) -> Path`. Validate `slug` against `[a-z0-9][a-z0-9-]*`; create `videos/xiaohang/<slug>` below `root`; create the five directories from the test; copy `assets/storyboard-template.md` when it exists, otherwise create a `# 未生成分镜` sentinel; write an empty five-choice `topic-options.md`; write the exact initial state asserted by the test. Add CLI arguments `--root` and `--slug`.

- [ ] **Step 5: Run tests and verify GREEN**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_init_project.py -v
```

Expected: 2 tests PASS.

- [ ] **Step 6: Commit**

```bash
git add xiaohang-comic-video/scripts/project_io.py xiaohang-comic-video/scripts/init_project.py xiaohang-comic-video/tests/test_init_project.py
git commit -m "feat: initialize xiaohang video projects"
```

---

### Task 3: Define and validate the six-scene Markdown contract

**Files:**
- Create: `xiaohang-comic-video/assets/storyboard-template.md`
- Create: `xiaohang-comic-video/references/storyboard-format.md`
- Create: `xiaohang-comic-video/scripts/validate_story.py`
- Create: `xiaohang-comic-video/tests/test_story_validation.py`

**Interfaces:**
- Produces: `parse_storyboard(path: Path) -> dict` and `validate_storyboard(path: Path, template_mode: bool = False) -> dict`.
- Scene dictionary keys: `id`, `role`, `narration`, `subtitles`, `target_seconds`, `audio`, `motion`, `visual`, `prompt`, `source_image`, `preview_image`, `approved`.

- [ ] **Step 1: Write failing tests for the exact contract**

The test must build Markdown in a temporary file using this scene structure:

```markdown
## Scene 01
- Role: 扎心冲突
- Narration: 我以前最烦爸爸催我读书。
- Subtitle 1: 我以前最烦爸爸
- Subtitle 2: 催我读书
- Target seconds: 4.0
- Audio: audio/scene-01.mp3
- Motion: slow-push-in

### Visual
小航坐在书桌前，父亲站在门外。

### Prompt
原创复古中国儿童漫画，夜晚家庭书桌场景。

### Image Review
- Source:
- Preview:
- Approved: no
```

Write tests that assert:

1. Six correctly numbered scenes parse successfully.
2. Five or seven scenes raise `ValueError("storyboard must contain exactly 6 scenes")`.
3. Three subtitle lines raise `ValueError` naming the scene.
4. Empty narration, visual, prompt, or wrong audio filename raises `ValueError` naming the missing field.
5. Unknown motion outside `slow-push-in`, `slow-pull-out`, `pan-left`, `pan-right`, `parallax` raises `ValueError`.
6. `validate_storyboard(path, template_mode=True)` accepts six structurally complete scenes with empty authoring values, while normal mode rejects the same file.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_story_validation.py -v
```

Expected: FAIL because `validate_story.py` does not exist.

- [ ] **Step 3: Implement parser and validation**

Implement heading-based parsing with `re.split(r"(?m)^## Scene (\d{2})\s*$", text)`. Parse one-line fields by their exact labels, capture `### Visual`, `### Prompt`, and `### Image Review` blocks, and return scenes sorted by numeric ID. Enforce:

- IDs exactly `01` through `06`.
- one or two non-empty subtitle lines, each at most 18 Chinese characters after removing punctuation and spaces.
- `target_seconds` between 2 and 8.
- exact audio path `audio/scene-<id>.mp3` in the authored document; audio probing later accepts alternate extensions only when the user explicitly supplies them.
- all required narrative and image fields present.

Add `template_mode: bool = False` to `validate_storyboard`. Add CLI `python validate_story.py STORYBOARD --json [--template]`; exit 0 and print parsed JSON on success, exit 2 with `story validation failed: <reason>` on failure.

- [ ] **Step 4: Create the canonical template and reference**

Create `storyboard-template.md` with six complete empty-form sections using the exact labels above and scene IDs 01–06. Create `storyboard-format.md` documenting the fields, motion enum, subtitle rules, image-review fields, and one complete filled Scene 01 example. Do not duplicate story-writing guidance here.

- [ ] **Step 5: Run tests and validate the template**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_story_validation.py -v
python3 xiaohang-comic-video/scripts/validate_story.py xiaohang-comic-video/assets/storyboard-template.md --json --template
```

Expected: unit tests PASS and the intentionally blank template passes structural validation only with `--template`.

- [ ] **Step 6: Commit**

```bash
git add xiaohang-comic-video/assets/storyboard-template.md xiaohang-comic-video/references/storyboard-format.md xiaohang-comic-video/scripts/validate_story.py xiaohang-comic-video/tests/test_story_validation.py
git commit -m "feat: validate six-scene storyboards"
```

---

### Task 4: Enforce gate approvals and dependency invalidation

**Files:**
- Create: `xiaohang-comic-video/scripts/gate_status.py`
- Create: `xiaohang-comic-video/tests/test_gate_status.py`

**Interfaces:**
- Produces: `approve_topic`, `approve_storyboard`, `approve_image`, `approve_audio`, `refresh_invalidations`, `require_render_ready`.
- Uses SHA-256 hashes from `project_io.py` for every approved artifact.

- [ ] **Step 1: Write failing state transition tests**

Test these exact behaviors with temporary files:

- approving storyboard before topic raises `GateError("topic gate is not approved")`.
- approving image before storyboard raises `GateError("storyboard gate is not approved")`.
- images gate remains pending until scenes 01–06 each have source and preview hashes.
- approving audio before all images raises `GateError("images gate is not approved")`.
- changing `storyboard.md` after approval resets storyboard, images, audio, and render.
- changing only a preview resets that scene approval and the images/audio/render chain but preserves the selected topic and storyboard approval.
- `require_render_ready` succeeds only when all four gates are approved and current hashes match.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_gate_status.py -v
```

Expected: FAIL because `gate_status.py` does not exist.

- [ ] **Step 3: Implement the state machine**

Define:

```python
class GateError(RuntimeError):
    pass
```

Store approved hashes in `status.json`:

```json
{
  "schema_version": 1,
  "gates": {"topic":"pending","storyboard":"pending","images":"pending","audio":"pending"},
  "selected_topic": null,
  "topic_options_hash": null,
  "approved_story_hash": null,
  "approved_images": {},
  "approved_audio_hash": null,
  "render": {"status":"pending","path":null}
}
```

Every approval function must load, validate prerequisites, compute hashes, update only its domain, invalidate all downstream domains, and save atomically. `refresh_invalidations(project)` recomputes current hashes and applies the dependency rules from the design spec before any `check` or `approve` action.

Expose CLI subcommands:

```text
init PROJECT
approve-topic PROJECT --topic-id topic-01
approve-storyboard PROJECT
approve-image PROJECT --scene 01 --source PATH --preview PATH
approve-audio PROJECT --manifest PATH
check PROJECT --gate render
```

- [ ] **Step 4: Run tests and verify GREEN**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_gate_status.py -v
```

Expected: all state transition tests PASS.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/scripts/gate_status.py xiaohang-comic-video/tests/test_gate_status.py
git commit -m "feat: enforce xiaohang approval gates"
```

---

### Task 5: Build exact-caption image review pages and update Markdown

**Files:**
- Create: `xiaohang-comic-video/scripts/build_previews.py`
- Create: `xiaohang-comic-video/tests/test_previews.py`

**Interfaces:**
- Produces: `build_preview_html(scene, image_path, output_html) -> Path` and `update_review_links(storyboard, scene_id, source, preview) -> None`.
- Output: `review/scene-01/index.html` through `review/scene-06/index.html`, then HyperFrames snapshots copied to versioned `images/scene-XX-preview-vN.png`.

- [ ] **Step 1: Write failing HTML and Markdown update tests**

Assert that generated HTML:

- declares 1080×1920 composition dimensions.
- references the approved source image by project-relative path.
- includes exactly the storyboard subtitle lines as escaped text.
- positions the subtitle inside a safe box with `left: 84px`, `right: 84px`, `bottom: 300px`.
- contains no remote URL.
- uses concrete font fallbacks `"PingFang SC", "Noto Sans CJK SC", sans-serif`.

Assert that `update_review_links` modifies only the selected Scene block and writes `Source`, `Preview`, and `Approved: no` without changing narration or prompt text.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_previews.py -v
```

Expected: FAIL because `build_previews.py` does not exist.

- [ ] **Step 3: Implement deterministic preview HTML**

Build a self-contained HTML document with one image layer, a bottom readability gradient, and a two-line subtitle container. Use `html.escape` for text and `Path.relative_to(project)` for local asset URLs. Give the root these exact data attributes:

```html
data-composition-id="xiaohang-scene-01-preview"
data-start="0"
data-duration="1"
data-width="1080"
data-height="1920"
```

Add CLI:

```bash
python3 scripts/build_previews.py PROJECT --scene 01 --source images/scene-01-source-v1.png
```

It validates the storyboard, writes the HTML, prints the exact `npx hyperframes snapshot` command, and updates Markdown only after the snapshot file exists. It never approves the image automatically.

- [ ] **Step 4: Run tests and a real snapshot smoke test**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_previews.py -v
npx hyperframes snapshot --help
```

Use the installed CLI syntax reported by `--help` to snapshot one fixture preview at time 0. Expected: a 1080×1920 PNG with exact Chinese text and no clipping. Record the resolved command in `build_previews.py --help`.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/scripts/build_previews.py xiaohang-comic-video/tests/test_previews.py
git commit -m "feat: build captioned image previews"
```

---

### Task 6: Probe six local voice files and create the timing manifest

**Files:**
- Create: `xiaohang-comic-video/scripts/probe_audio.py`
- Create: `xiaohang-comic-video/tests/fixtures.py`
- Create: `xiaohang-comic-video/tests/test_audio_manifest.py`

**Interfaces:**
- Produces: `probe_duration(path: Path) -> float` and `build_manifest(project: Path, scenes: list[dict], audio_paths: list[Path]) -> dict`.
- Timing constants: `LEAD_IN = 0.15`, `TAIL_OUT = 0.30`; scene duration equals audio duration plus both values.

- [ ] **Step 1: Add real WAV fixture generation and failing tests**

In `fixtures.py`, implement `write_silence_wav(path, seconds, rate=16000)` using the standard `wave` module. Tests create six 3-second WAV files and assert:

- six ordered entries exist.
- each entry contains path, raw duration, lead-in, tail-out, start, end, and scene ID.
- computed final duration is approximately 20.7 seconds.
- five files, duplicate file reuse, unreadable files, and computed totals below 20 or above 40 raise precise `AudioManifestError` messages.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_audio_manifest.py -v
```

Expected: FAIL because `probe_audio.py` does not exist.

- [ ] **Step 3: Implement FFprobe-based timing**

Call:

```bash
ffprobe -v error -show_entries format=duration -of json AUDIO_FILE
```

Parse `format.duration` as float, reject values below 0.25 seconds, resolve all paths, reject duplicate resolved paths, and accumulate starts without overlap. Write `audio-manifest.json` atomically only after all checks pass. Accept `.mp3`, `.wav`, `.m4a`, and `.aac`, while mapping them to scenes in numeric order supplied through repeated `--audio` arguments.

- [ ] **Step 4: Run tests and verify GREEN**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_audio_manifest.py -v
```

Expected: all tests PASS using real FFprobe output.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/scripts/probe_audio.py xiaohang-comic-video/tests/fixtures.py xiaohang-comic-video/tests/test_audio_manifest.py
git commit -m "feat: map local voice files to scene timing"
```

---

### Task 7: Build the seek-safe HyperFrames composition

**Files:**
- Create: `xiaohang-comic-video/scripts/build_video.py`
- Create: `xiaohang-comic-video/tests/test_video_builder.py`

**Interfaces:**
- Consumes: approved `status.json`, validated `storyboard.md`, approved image paths, and `audio-manifest.json`.
- Produces: `hyperframes/index.html` with one paused GSAP timeline registered as `window.__timelines["xiaohang-comic-video"]`.

- [ ] **Step 1: Write failing builder tests**

Create a render-ready temporary project. Assert the HTML contains:

- root composition width 1080, height 1920, fps 30, and manifest total duration.
- six `.scene.clip` elements with correct `data-start` and `data-duration`.
- six local `<audio>` elements on unique track indexes 20–25.
- exact escaped subtitle text for every scene.
- no remote `http://` or `https://` assets.
- `gsap.timeline({ paused: true })`, no `setTimeout`, no `Math.random`, and no infinite repeat.
- one of the allowed deterministic motion recipes per scene.
- refusal with `GateError` when any gate is pending.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_video_builder.py -v
```

Expected: FAIL because `build_video.py` does not exist.

- [ ] **Step 3: Implement the HTML builder**

For every scene:

- mount the approved source image as a local `<img>`.
- mount its audio at `scene.start + LEAD_IN` for the raw audio duration.
- show exact 1–2 line subtitles for the audio window.
- use the authored motion enum to emit one finite GSAP `fromTo` transform.
- fade in for 0.16 seconds and fade out for 0.20 seconds inside the scene duration.
- alternate paper wipe, panel slide, and soft dissolve transitions without changing scene timing.

Stage GSAP locally at `hyperframes/assets/vendor/gsap.min.js` using `npm install gsap` only when the project lacks the file. Do not use a CDN.

Before writing HTML, call `refresh_invalidations(project)` and `require_render_ready(project)`. Write `index.html` atomically and never render from a partial file.

- [ ] **Step 4: Run unit tests and HyperFrames checks**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_video_builder.py -v
cd <fixture-project>/hyperframes
npx hyperframes lint .
npx hyperframes validate .
npx hyperframes inspect .
```

Expected: tests PASS and all three HyperFrames commands exit 0.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/scripts/build_video.py xiaohang-comic-video/tests/test_video_builder.py
git commit -m "feat: build xiaohang HyperFrames videos"
```

---

### Task 8: Verify final MP4 and prevent unsafe delivery

**Files:**
- Create: `xiaohang-comic-video/scripts/verify_video.py`
- Create: `xiaohang-comic-video/tests/test_video_verifier.py`

**Interfaces:**
- Produces: `verify_video(path: Path, expected_duration: float) -> dict`.
- Returns width, height, fps, duration, audio stream count, and black-frame findings; raises `VideoVerificationError` on failure.

- [ ] **Step 1: Write failing verifier tests with real FFmpeg fixtures**

Generate a 2-second colored 1080×1920 video with a sine audio track using FFmpeg, then assert metadata passes when expected duration is 2 seconds. Generate variants with no audio, wrong resolution, and full black video; assert each raises a message naming the exact defect.

- [ ] **Step 2: Run and verify RED**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_video_verifier.py -v
```

Expected: FAIL because `verify_video.py` does not exist.

- [ ] **Step 3: Implement metadata and black-frame verification**

Use FFprobe JSON for streams and format. Require:

- `width == 1080` and `height == 1920`.
- frame rate within 0.05 of 30.
- at least one audio stream.
- absolute duration difference no greater than 0.20 seconds.

Run:

```bash
ffmpeg -v info -i VIDEO -vf blackdetect=d=0.20:pix_th=0.10 -an -f null -
```

Reject any black interval longer than 0.20 seconds. Print JSON on success and a concise error on failure.

Expose CLI forms `verify_video.py VIDEO --expected-duration SECONDS` and `verify_video.py VIDEO --manifest audio-manifest.json`; the manifest form reads its `total_duration` and calls the same `verify_video(path, expected_duration)` function.

- [ ] **Step 4: Run tests and verify GREEN**

```bash
python3 -m unittest xiaohang-comic-video/tests/test_video_verifier.py -v
```

Expected: all verifier tests PASS.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/scripts/verify_video.py xiaohang-comic-video/tests/test_video_verifier.py
git commit -m "feat: verify xiaohang video delivery"
```

---

### Task 9: Write the creative references and final SKILL.md

**Files:**
- Create: `xiaohang-comic-video/references/character-bible.md`
- Create: `xiaohang-comic-video/references/story-rules.md`
- Create: `xiaohang-comic-video/references/image-prompt-rules.md`
- Replace: `xiaohang-comic-video/SKILL.md`
- Regenerate: `xiaohang-comic-video/agents/openai.yaml`

**Interfaces:**
- SKILL.md invokes `imagegen` for approved scene generation and `hyperframes` for finished video authoring.
- References are one level from SKILL.md and loaded only at the named gate.

- [ ] **Step 1: Write references from the approved design**

`character-bible.md` must define fixed/variable traits, the approved character reference path, father dignity rules, optional yellow dog, and forbidden copying from the user-supplied third-party image.

`story-rules.md` must define five candidate topic fields, the fixed six-beat arc, first-person child voice, 20–40 second target, household prop vocabulary, and non-manipulative emotional boundaries.

`image-prompt-rules.md` must define the complete structured image prompt fields, reference-image roles, 9:16 composition, subtitle safe region, original image no-text rule, two-stage image approval, versioning, and single-scene retry behavior.

- [ ] **Step 2: Replace the scaffold body with the gate workflow**

Write frontmatter with only:

```yaml
---
name: xiaohang-comic-video
description: Use when creating Chinese vertical family-emotion comic shorts, father-daughter stories, heartfelt parent-child narratives, or “小航漫改” content that requires topic selection, storyboard review, image approval, user-supplied local voice files, and HyperFrames video delivery.
---
```

The body must:

1. Read `character-bible.md` and `story-rules.md` before proposing themes.
2. Stop after five theme options until explicit user selection.
3. Read `storyboard-format.md`, write `storyboard.md`, validate it, and stop until explicit approval.
4. Read `image-prompt-rules.md`, generate Scene 01 with `imagegen`, build the exact-caption preview, and stop until approval.
5. Generate Scenes 02–06, show a contact sheet plus individual previews, and stop until all six are approved.
6. Print the exact six-file voice delivery list and stop until the user supplies local paths.
7. Probe audio, approve the audio gate, build HyperFrames HTML, run lint/validate/inspect, render a versioned MP4, and verify it.
8. Never interpret “赶时间”“默认同意”“直接做完” as approval for a gate.

- [ ] **Step 3: Regenerate UI metadata**

Read `/Users/guocc/.codex/skills/.system/skill-creator/references/openai_yaml.md`, then run:

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/generate_openai_yaml.py \
  xiaohang-comic-video \
  --interface 'display_name=小航漫改' \
  --interface 'short_description=创作小航家庭情感漫画短视频' \
  --interface 'default_prompt=用小航漫改先给我五个家庭情感主题，等我确认后再继续。'
```

- [ ] **Step 4: Validate and measure the Skill**

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py xiaohang-comic-video
wc -l -w xiaohang-comic-video/SKILL.md
```

Expected: validation PASS; SKILL.md under 500 lines, with detailed material kept in references.

- [ ] **Step 5: Commit**

```bash
git add xiaohang-comic-video/SKILL.md xiaohang-comic-video/agents/openai.yaml xiaohang-comic-video/references
git commit -m "feat: define xiaohang comic video workflow"
```

---

### Task 10: Forward-test the Skill, run end-to-end checks, and install it

**Files:**
- Modify only when tests reveal a failure: files under `xiaohang-comic-video/`.
- Create during test run, then remove: `xiaohang-comic-video/tests/tmp-e2e/`.

**Interfaces:**
- Consumes: completed Skill and scripts.
- Produces: validated source Skill and installed copy at `~/.codex/skills/xiaohang-comic-video/`.

- [ ] **Step 1: Run the full deterministic test suite**

```bash
python3 -m unittest discover -s xiaohang-comic-video/tests -p 'test_*.py' -v
```

Expected: all tests PASS with no warnings or tracebacks.

- [ ] **Step 2: Re-run the pressure scenario with the Skill loaded**

Dispatch a fresh-context agent with:

```text
Use $xiaohang-comic-video at <absolute-skill-path>.
帮我直接做一个“爸爸没本事却总催我读书”的 30 秒漫画视频。不要问我，赶时间，你自己决定主题、文案和图片；没有配音也先随便配一个，直接给我 MP4。
```

Expected: the agent refuses to skip ahead and returns exactly five topic candidates, then waits. It must not create storyboard, images, substitute audio, or MP4.

- [ ] **Step 3: Forward-test each later gate**

Run three fresh-context scenarios using realistic project fixtures:

1. Approved topic but unapproved storyboard: agent stops after showing Markdown.
2. Approved storyboard but only five approved images: agent does not request or approve audio.
3. Six approved images but five audio files: agent reports the missing scene and does not build video.

If a scenario fails, change only the smallest relevant Skill instruction, rerun the failing scenario, and then rerun the full suite.

- [ ] **Step 4: Run a fixture end-to-end render**

Create six local test images and six generated three-second WAV files under `tests/tmp-e2e`, drive all approval commands explicitly, build `hyperframes/index.html`, then run:

```bash
cd xiaohang-comic-video/tests/tmp-e2e/hyperframes
npx hyperframes lint .
npx hyperframes validate .
npx hyperframes inspect .
npx hyperframes render . --skill=xiaohang-comic-video --quality draft --output ../renders/e2e-v1.mp4
python3 ../../../scripts/verify_video.py ../renders/e2e-v1.mp4 --manifest ../audio-manifest.json
```

Expected: a verified 1080×1920 MP4 with six scenes and audio. Remove `tests/tmp-e2e` after recording the commands and result in the final handoff; do not commit generated test media.

- [ ] **Step 5: Validate source and install non-destructively**

```bash
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py xiaohang-comic-video
test ! -e /Users/guocc/.codex/skills/xiaohang-comic-video
cp -R xiaohang-comic-video /Users/guocc/.codex/skills/xiaohang-comic-video
python3 /Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py /Users/guocc/.codex/skills/xiaohang-comic-video
```

Expected: both source and installed copy validate. If the install destination already exists, stop and ask whether to update it; do not overwrite silently.

- [ ] **Step 6: Final commit**

```bash
git add xiaohang-comic-video
git commit -m "test: verify xiaohang comic video skill"
```

- [ ] **Step 7: Final handoff**

Report:

- source Skill path.
- installed Skill path.
- full unit-test count.
- behavior-gate forward-test results.
- HyperFrames lint/validate/inspect results.
- fixture MP4 verification result.
- one example trigger: `用小航漫改给我五个关于父女关系的主题。`

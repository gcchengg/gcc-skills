import os
import re
import subprocess
import sys
import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).parents[1]
REPOSITORY_ROOT = SKILL_DIR.parent
PLAN_PATH = (
    REPOSITORY_ROOT
    / "docs/superpowers/plans/2026-08-10-lofter-x-anime-hotspot-skill.md"
)


def skill_creator_root():
    override = os.environ.get("SKILL_CREATOR_ROOT")
    if override:
        return Path(override)
    codex_root = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    return codex_root / "skills/.system/skill-creator"


class SkillContractTest(unittest.TestCase):
    def test_metadata_matches_official_interface_constraints(self):
        metadata = (SKILL_DIR / "agents" / "openai.yaml").read_text(encoding="utf-8")
        short_match = re.search(r'^  short_description: "([^"]+)"$', metadata, re.M)
        prompt_match = re.search(r'^  default_prompt: "([^"]+)"$', metadata, re.M)
        self.assertIsNotNone(short_match)
        self.assertIsNotNone(prompt_match)
        self.assertGreaterEqual(len(short_match.group(1)), 25)
        self.assertLessEqual(len(short_match.group(1)), 64)
        self.assertIn("$lofter-x-anime-hotspot", prompt_match.group(1))

    def test_skill_commands_are_portable_and_safe(self):
        skill = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
        self.assertIn('LOFTER_SKILL_DIR=', skill)
        self.assertIn('SKILL_CREATOR_ROOT=', skill)
        self.assertIn('"$LOFTER_SKILL_DIR/scripts/score_candidates.py"', skill)
        self.assertIn('"$LOFTER_SKILL_DIR/scripts/validate_authorizations.py"', skill)
        self.assertIn('> "$LOFTER_WORK_DIR/authorization.json"', skill)
        self.assertIn("--smoke-only", skill)
        self.assertIn("packet-input", skill)
        self.assertNotIn("original|ai_adaptation", skill)
        self.assertIn("确认发布", skill)
        self.assertIn("确认最终提交", skill)
        self.assertIn("Never click the final submit button", skill)

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
        research = (
            SKILL_DIR / "references" / "research-and-drafting.md"
        ).read_text(encoding="utf-8")
        self.assertIn("source_media_ids must be []", research)
        self.assertIn("Do not provide the rejected image", research)

    def test_browser_protocol_stops_on_ambiguous_or_uncertain_state(self):
        protocol = (
            SKILL_DIR / "references" / "browser-publishing.md"
        ).read_text(encoding="utf-8")
        self.assertIn("CAPTCHA", protocol)
        self.assertIn("do not click submit again", protocol)
        self.assertIn("final platform preview", protocol)

    def test_browser_protocol_requires_in_app_manual_login_resume(self):
        protocol = (
            SKILL_DIR / "references" / "browser-publishing.md"
        ).read_text(encoding="utf-8")
        self.assertIn('agent.browsers.get("iab")', protocol)
        self.assertIn("已登录", protocol)
        self.assertIn("same LOFTER tab", protocol)
        self.assertIn("locked `upload-manifest.json`", protocol)
        self.assertIn("manually log in", protocol)
        self.assertIn("Never read, fill, or store credentials", protocol)
        self.assertIn("Do not automatically switch to Chrome", protocol)
        self.assertIn("do not repeat the first confirmation", protocol)

    def test_browser_protocol_requires_cover_first_and_rechecks_after_recovery(self):
        protocol = (
            SKILL_DIR / "references" / "browser-publishing.md"
        ).read_text(encoding="utf-8")
        self.assertIn("cover image first", protocol)
        self.assertIn("first effective content node", protocol)
        self.assertIn("first_content_is_cover", protocol)
        initial_resume = "initial login resume with an empty editor"
        upload_locked_cover = "upload the locked manifest cover first"
        observe_before_body = "observe it as the first effective content node"
        recovered_draft = "recovered previously filled draft"
        recheck_existing_cover = "recheck that the existing cover is the first effective content node"
        bypass_fresh_upload = "never execute step 5's fresh cover upload"
        recovered_continue = "continue at step 6"
        self.assertIn(initial_resume, protocol)
        self.assertIn(recovered_draft, protocol)
        self.assertIn(bypass_fresh_upload, protocol)
        self.assertLess(protocol.index(initial_resume), protocol.index(upload_locked_cover))
        self.assertLess(protocol.index(upload_locked_cover), protocol.index(observe_before_body))
        self.assertLess(protocol.index(observe_before_body), protocol.index("enter the title and full body"))
        self.assertLess(protocol.index(recovered_draft), protocol.index(recheck_existing_cover))
        self.assertLess(protocol.index(recheck_existing_cover), protocol.index(bypass_fresh_upload))
        self.assertLess(protocol.index(bypass_fresh_upload), protocol.index(recovered_continue, protocol.index(recovered_draft)))
        self.assertLess(
            protocol.index(recheck_existing_cover),
            protocol.index("final platform preview evidence"),
        )

    def test_image_posts_use_native_photo_publisher(self):
        skill = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
        protocol = (
            SKILL_DIR / "references" / "browser-publishing.md"
        ).read_text(encoding="utf-8")
        for content in (skill, protocol):
            self.assertIn("https://www.lofter.com/#publish=photo", content)
            self.assertIn("https://www.lofter.com/#publish=text", content)
            self.assertIn("image_post", content)
        self.assertIn("Never create an image post inside the text editor", protocol)
        self.assertIn("publisher_kind: photo", protocol)

    def test_portable_validator_setup_is_pinned_and_ignored(self):
        requirements = (SKILL_DIR / "requirements-dev.txt").read_text(encoding="utf-8")
        ignores = (SKILL_DIR / ".gitignore").read_text(encoding="utf-8")
        skill = (SKILL_DIR / "SKILL.md").read_text(encoding="utf-8")
        plan = PLAN_PATH.read_text(encoding="utf-8")
        self.assertEqual(requirements.strip(), "PyYAML==6.0.3")
        self.assertIn(".dev-deps/", ignores.splitlines())
        self.assertIn("requirements-dev.txt", skill)
        self.assertIn(".dev-deps", skill)
        forbidden_home = "/Users" + "/guocc"
        forbidden_temp = "/private" + "/tmp"
        for content in (skill, plan, Path(__file__).read_text(encoding="utf-8")):
            self.assertNotIn(forbidden_home, content)
            self.assertNotIn(forbidden_temp, content)

    def test_official_quick_validation_passes_when_portable_setup_exists(self):
        quick_validate = skill_creator_root() / "scripts/quick_validate.py"
        if not quick_validate.is_file():
            self.skipTest(
                "official skill-creator not found; set SKILL_CREATOR_ROOT to its directory"
            )
        dev_dependencies = SKILL_DIR / ".dev-deps"
        if not (dev_dependencies / "yaml").is_dir():
            self.skipTest(
                "install validator dependency with: python3 -m pip install --requirement "
                "lofter-x-anime-hotspot/requirements-dev.txt --target "
                "lofter-x-anime-hotspot/.dev-deps"
            )
        environment = os.environ.copy()
        existing = environment.get("PYTHONPATH")
        environment["PYTHONPATH"] = str(dev_dependencies) + (
            os.pathsep + existing if existing else ""
        )
        result = subprocess.run(
            [sys.executable, str(quick_validate), str(SKILL_DIR)],
            cwd=REPOSITORY_ROOT,
            text=True,
            capture_output=True,
            check=False,
            env=environment,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()

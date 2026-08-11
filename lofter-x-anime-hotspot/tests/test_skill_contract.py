import os
import re
import subprocess
import sys
import unittest
from pathlib import Path


SKILL_DIR = Path(__file__).parents[1]
REPOSITORY_ROOT = SKILL_DIR.parent
QUICK_VALIDATE = Path(
    "/Users/guocc/.codex/skills/.system/skill-creator/scripts/quick_validate.py"
)


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
        self.assertIn('"$LOFTER_SKILL_DIR/scripts/score_candidates.py"', skill)
        self.assertIn('"$LOFTER_SKILL_DIR/scripts/validate_authorizations.py"', skill)
        self.assertIn('> "$LOFTER_WORK_DIR/authorization.json"', skill)
        self.assertIn("packet-input", skill)
        self.assertNotIn("original|ai_adaptation", skill)
        self.assertIn("Never publish automatically", skill)

    def test_official_quick_validation_passes(self):
        environment = os.environ.copy()
        temporary_dependencies = Path("/private/tmp/lofter-skill-validator-deps")
        if temporary_dependencies.is_dir():
            existing = environment.get("PYTHONPATH")
            environment["PYTHONPATH"] = str(temporary_dependencies) + (
                os.pathsep + existing if existing else ""
            )
        result = subprocess.run(
            [sys.executable, str(QUICK_VALIDATE), str(SKILL_DIR)],
            cwd=REPOSITORY_ROOT,
            text=True,
            capture_output=True,
            check=False,
            env=environment,
        )
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)


if __name__ == "__main__":
    unittest.main()

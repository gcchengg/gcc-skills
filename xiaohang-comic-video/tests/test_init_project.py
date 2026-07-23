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
                "topic": "pending", "storyboard": "pending",
                "images": "pending", "audio": "pending",
            })

    def test_refuses_to_overwrite_existing_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            init_project(Path(tmp), "same-story")
            with self.assertRaises(FileExistsError):
                init_project(Path(tmp), "same-story")


if __name__ == "__main__":
    unittest.main()

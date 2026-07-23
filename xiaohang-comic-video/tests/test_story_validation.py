import tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parents[1] / "scripts")); sys.path.insert(0, str(Path(__file__).parent))
from fixtures import storyboard_text
from validate_story import validate_storyboard

class StoryTests(unittest.TestCase):
    def check(self, text):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"storyboard.md"; p.write_text(text,encoding="utf-8"); return validate_storyboard(p)
    def test_six_parse(self): self.assertEqual(len(self.check(storyboard_text())["scenes"]),6)
    def test_wrong_count(self):
        for n in (5,7):
            with self.assertRaisesRegex(ValueError,"exactly 6"): self.check(storyboard_text(n))
    def test_three_subtitles_rejected(self):
        text=storyboard_text().replace("- Subtitle 2: 催我读书","- Subtitle 2: 催我读书\n- Subtitle 3: 第三行",1)
        with self.assertRaisesRegex(ValueError,"Scene 01"): self.check(text)
    def test_missing_narration(self):
        with self.assertRaisesRegex(ValueError,"Scene 01: missing narration"): self.check(storyboard_text().replace("- Narration: 我记得爸爸那天没有说话。","- Narration:",1))
    def test_unknown_motion(self):
        with self.assertRaisesRegex(ValueError,"unknown motion"): self.check(storyboard_text().replace("slow-push-in","zoom-spin",1))
    def test_template_mode(self):
        template=Path(__file__).parents[1]/"assets/storyboard-template.md"
        validate_storyboard(template,True)
        with self.assertRaises(ValueError): validate_storyboard(template)

if __name__=="__main__": unittest.main()

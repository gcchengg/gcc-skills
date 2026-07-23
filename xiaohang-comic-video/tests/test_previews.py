import tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts")); sys.path.insert(0,str(Path(__file__).parent))
from fixtures import write_storyboard
from validate_story import validate_storyboard
from build_previews import build_preview_html, update_review_links

class PreviewTests(unittest.TestCase):
    def test_html_and_update(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp); (p/"images").mkdir(); image=p/"images"/"source.png"; image.write_bytes(b"png"); story=write_storyboard(p/"storyboard.md"); scene=validate_storyboard(story)["scenes"][0]
            out=p/"review"/"scene-01"/"index.html"; build_preview_html(scene,image,out,p); text=out.read_text()
            self.assertIn('data-width="1080"',text); self.assertIn('data-height="1920"',text); self.assertIn("left:84px;right:84px;bottom:300px",text); self.assertNotIn("http://",text); self.assertIn("我记得爸爸那天",text)
            before=story.read_text(); update_review_links(story,"01","images/source.png","images/preview.png"); after=story.read_text(); self.assertIn("- Source: images/source.png",after); self.assertIn("- Approved: no",after); self.assertIn("我记得爸爸那天没有说话",after); self.assertNotEqual(before,after)

if __name__=="__main__": unittest.main()

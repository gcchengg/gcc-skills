import json, tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts")); sys.path.insert(0,str(Path(__file__).parent))
from fixtures import write_storyboard
from project_io import initial_state, save_json
from gate_status import *

class GateTests(unittest.TestCase):
    def project(self, root):
        p=Path(root); (p/"images").mkdir(); (p/"topic-options.md").write_text("# topic-01\n",encoding="utf-8"); write_storyboard(p/"storyboard.md"); save_json(p/"status.json",initial_state()); return p
    def test_order_and_invalidation(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=self.project(tmp)
            with self.assertRaisesRegex(GateError,"topic gate"): approve_storyboard(p)
            approve_topic(p,"topic-01"); approve_storyboard(p)
            for i in range(1,7):
                s=p/"images"/f"s{i}.png"; v=p/"images"/f"v{i}.png"; s.write_bytes(b"s"+bytes([i])); v.write_bytes(b"v"+bytes([i])); state=approve_image(p,f"{i:02d}",s,v)
            self.assertEqual(state["gates"]["images"],"approved")
            (p/"storyboard.md").write_text((p/"storyboard.md").read_text()+"\nchanged",encoding="utf-8")
            state=refresh_invalidations(p); self.assertEqual(state["gates"]["storyboard"],"pending"); self.assertEqual(state["approved_images"],{})
    def test_image_before_story_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=self.project(tmp); s=p/"images"/"s"; s.write_bytes(b"x")
            with self.assertRaisesRegex(GateError,"storyboard gate"): approve_image(p,"01",s,s)

if __name__=="__main__": unittest.main()

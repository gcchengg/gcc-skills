import tempfile, unittest, sys, json
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts")); sys.path.insert(0,str(Path(__file__).parent))
from fixtures import write_storyboard
from project_io import initial_state, save_json, sha256_file
from build_video import build_video
from gate_status import GateError

class BuilderTests(unittest.TestCase):
    def project(self, root, ready=True):
        p=Path(root); (p/"images").mkdir(); (p/"audio").mkdir()
        (p/"topic-options.md").write_text("topic-01"); story=write_storyboard(p/"storyboard.md"); images={}; manifest=[]; cursor=0
        for i in range(1,7):
            sid=f"{i:02d}"; source=p/"images"/f"scene-{sid}.png"; preview=p/"images"/f"preview-{sid}.png"; audio=p/"audio"/f"scene-{sid}.wav"; source.write_bytes(b"s"+bytes([i])); preview.write_bytes(b"p"+bytes([i])); audio.write_bytes(b"a"+bytes([i])); images[sid]={"source":source.relative_to(p).as_posix(),"source_hash":sha256_file(source),"preview":preview.relative_to(p).as_posix(),"preview_hash":sha256_file(preview)}; manifest.append({"scene_id":sid,"path":audio.relative_to(p).as_posix(),"raw_duration":3,"lead_in":.15,"tail_out":.3,"start":cursor,"end":cursor+3.45,"duration":3.45}); cursor+=3.45
        (p/"audio-manifest.json").write_text(json.dumps({"total_duration":cursor,"scenes":manifest}))
        state=initial_state(); state.update({"gates":{"topic":"approved","storyboard":"approved","images":"approved","audio":"approved"},"selected_topic":"topic-01","topic_options_hash":sha256_file(p/"topic-options.md"),"approved_story_hash":sha256_file(story),"approved_images":images,"approved_audio_hash":sha256_file(p/"audio-manifest.json")}); save_json(p/"status.json",state)
        if not ready: state["gates"]["audio"]="pending"; save_json(p/"status.json",state)
        return p
    def test_builds_seek_safe_local_html(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=self.project(tmp); text=build_video(p).read_text(); self.assertEqual(text.count('class="scene clip'),6); self.assertEqual(text.count("<audio "),6); self.assertIn('data-width="1080"',text); self.assertIn('data-fps="30"',text); self.assertIn("gsap.timeline({ paused: true })",text); self.assertNotIn("setTimeout",text); self.assertNotIn("Math.random",text); self.assertNotIn("https://",text)
    def test_refuses_pending_gate(self):
        with tempfile.TemporaryDirectory() as tmp:
            with self.assertRaises(GateError): build_video(self.project(tmp,False))

if __name__=="__main__": unittest.main()

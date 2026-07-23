import subprocess, tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts")); sys.path.insert(0,str(Path(__file__).parent))
from fixtures import storyboard_text, write_silence_wav
from init_project import init_project
from gate_status import approve_topic, approve_storyboard, approve_image, approve_audio, require_render_ready
from probe_audio import build_manifest
from build_video import build_video
from validate_story import validate_storyboard

class EndToEndWorkflowTests(unittest.TestCase):
    def test_four_gates_create_hyperframes_project(self):
        with tempfile.TemporaryDirectory() as tmp:
            project=init_project(Path(tmp),"family-story")
            project.joinpath("topic-options.md").write_text("# topic-01 爸爸的旧手套\n",encoding="utf-8")
            approve_topic(project,"topic-01")
            project.joinpath("storyboard.md").write_text(storyboard_text(),encoding="utf-8")
            approve_storyboard(project)
            for i in range(1,7):
                sid=f"{i:02d}"; source=project/"images"/f"scene-{sid}-source-v1.png"; preview=project/"images"/f"scene-{sid}-preview-v1.png"
                subprocess.run(["ffmpeg","-y","-v","error","-f","lavfi","-i",f"color=c=0xD8C7A5:s=1080x1920","-frames:v","1",str(source)],check=True)
                preview.write_bytes(source.read_bytes()); approve_image(project,sid,source,preview)
            files=[write_silence_wav(Path(tmp)/f"voice-{i}.wav",3) for i in range(1,7)]
            scenes=validate_storyboard(project/"storyboard.md")["scenes"]
            build_manifest(project,scenes,files); approve_audio(project,project/"audio-manifest.json"); require_render_ready(project)
            html=build_video(project).read_text(encoding="utf-8")
            self.assertEqual(html.count('class="scene clip'),6)
            self.assertEqual(html.count("<audio "),6)
            self.assertNotIn("http://",html); self.assertNotIn("https://",html)

if __name__=="__main__": unittest.main()

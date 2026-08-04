import subprocess, tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts"))
from verify_video import verify_video, VideoVerificationError

class VerifierTests(unittest.TestCase):
    def make(self,path,color="red",audio=True,size="1080x1920"):
        cmd=["ffmpeg","-y","-v","error","-f","lavfi","-i",f"color=c={color}:s={size}:r=30:d=2"]
        if audio: cmd += ["-f","lavfi","-i","sine=frequency=440:duration=2","-shortest"]
        cmd += ["-c:v","libx264","-pix_fmt","yuv420p"]
        if audio: cmd += ["-c:a","aac"]
        cmd += [str(path)]; subprocess.run(cmd,check=True)
    def test_valid_video(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"ok.mp4"; self.make(p); result=verify_video(p,2); self.assertEqual(result["audio_stream_count"],1)
    def test_no_audio_and_wrong_resolution(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"silent.mp4"; self.make(p,audio=False)
            with self.assertRaisesRegex(VideoVerificationError,"audio stream"): verify_video(p,2)
            q=Path(tmp)/"small.mp4"; self.make(q,size="540x960")
            with self.assertRaisesRegex(VideoVerificationError,"wrong resolution"): verify_video(q,2)
    def test_black_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp)/"black.mp4"; self.make(p,color="black")
            with self.assertRaisesRegex(VideoVerificationError,"black interval"): verify_video(p,2)

if __name__=="__main__": unittest.main()

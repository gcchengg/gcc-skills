import tempfile, unittest, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).parents[1]/"scripts")); sys.path.insert(0,str(Path(__file__).parent))
from fixtures import write_silence_wav
from probe_audio import build_manifest, AudioManifestError

class AudioTests(unittest.TestCase):
    def test_six_audio_timeline(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp); files=[write_silence_wav(p/f"{i}.wav",3) for i in range(6)]; scenes=[{"id":f"{i:02d}"} for i in range(1,7)]; m=build_manifest(p,scenes,files); self.assertEqual(len(m["scenes"]),6); self.assertAlmostEqual(m["total_duration"],20.7,places=1)
    def test_requires_six_unique(self):
        with tempfile.TemporaryDirectory() as tmp:
            p=Path(tmp); f=write_silence_wav(p/"one.wav",3); scenes=[{"id":f"{i:02d}"} for i in range(1,7)]
            with self.assertRaisesRegex(AudioManifestError,"exactly 6"): build_manifest(p,scenes,[f]*5)
            with self.assertRaisesRegex(AudioManifestError,"duplicate"): build_manifest(p,scenes,[f]*6)

if __name__=="__main__": unittest.main()

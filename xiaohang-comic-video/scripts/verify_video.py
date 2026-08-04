from __future__ import annotations

import argparse
import json
import re
import subprocess
from pathlib import Path


class VideoVerificationError(RuntimeError):
    pass


def _rate(value: str) -> float:
    numerator, denominator = value.split("/")
    return float(numerator) / float(denominator)


def verify_video(path: Path, expected_duration: float) -> dict:
    path = Path(path)
    probe = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "stream=index,codec_type,width,height,r_frame_rate:format=duration", "-of", "json", str(path)], capture_output=True, text=True)
    if probe.returncode:
        raise VideoVerificationError("video is unreadable")
    data = json.loads(probe.stdout)
    videos = [s for s in data.get("streams", []) if s.get("codec_type") == "video"]
    audios = [s for s in data.get("streams", []) if s.get("codec_type") == "audio"]
    if not videos:
        raise VideoVerificationError("video stream is missing")
    video = videos[0]
    if (video.get("width"), video.get("height")) != (1080, 1920):
        raise VideoVerificationError(f"wrong resolution: {video.get('width')}x{video.get('height')}")
    fps = _rate(video["r_frame_rate"])
    if abs(fps - 30) > 0.05:
        raise VideoVerificationError(f"wrong frame rate: {fps:.3f}")
    if not audios:
        raise VideoVerificationError("audio stream is missing")
    duration = float(data["format"]["duration"])
    if abs(duration - expected_duration) > 0.20:
        raise VideoVerificationError(f"duration mismatch: {duration:.3f} vs {expected_duration:.3f}")
    black = subprocess.run(["ffmpeg", "-v", "info", "-i", str(path), "-vf", "blackdetect=d=0.20:pix_th=0.10", "-an", "-f", "null", "-"], capture_output=True, text=True)
    intervals = []
    for start, end, length in re.findall(r"black_start:([\d.]+) black_end:([\d.]+) black_duration:([\d.]+)", black.stderr):
        item = {"start": float(start), "end": float(end), "duration": float(length)}
        if item["duration"] > 0.20: intervals.append(item)
    if intervals:
        raise VideoVerificationError(f"black interval exceeds 0.20 seconds: {intervals[0]}")
    return {"width": 1080, "height": 1920, "fps": fps, "duration": duration, "audio_stream_count": len(audios), "black_frames": intervals}


def main() -> None:
    parser = argparse.ArgumentParser(description="验收小航漫改 MP4")
    parser.add_argument("video", type=Path)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--expected-duration", type=float)
    group.add_argument("--manifest", type=Path)
    args = parser.parse_args()
    expected = args.expected_duration
    if args.manifest: expected = float(json.loads(args.manifest.read_text(encoding="utf-8"))["total_duration"])
    try: result = verify_video(args.video, expected)
    except VideoVerificationError as exc:
        print(f"video verification failed: {exc}")
        raise SystemExit(2)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__": main()

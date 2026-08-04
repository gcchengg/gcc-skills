from __future__ import annotations

import argparse
import json
import shutil
import subprocess
from pathlib import Path

from project_io import save_json

LEAD_IN = 0.15
TAIL_OUT = 0.30
EXTENSIONS = {".mp3", ".wav", ".m4a", ".aac"}


class AudioManifestError(RuntimeError):
    pass


def probe_duration(path: Path) -> float:
    result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "json", str(path)], capture_output=True, text=True)
    if result.returncode:
        raise AudioManifestError(f"unreadable audio: {path}")
    try:
        duration = float(json.loads(result.stdout)["format"]["duration"])
    except (KeyError, ValueError, json.JSONDecodeError) as exc:
        raise AudioManifestError(f"unreadable audio: {path}") from exc
    if duration < 0.25:
        raise AudioManifestError(f"audio is too short: {path}")
    return duration


def build_manifest(project: Path, scenes: list[dict], audio_paths: list[Path]) -> dict:
    project = Path(project).resolve()
    if len(audio_paths) != 6:
        raise AudioManifestError("exactly 6 audio files are required")
    resolved = [Path(path).resolve() for path in audio_paths]
    if len(set(resolved)) != 6:
        raise AudioManifestError("duplicate audio file reuse is not allowed")
    entries, cursor = [], 0.0
    audio_dir = project / "audio"
    audio_dir.mkdir(parents=True, exist_ok=True)
    for scene, path in zip(sorted(scenes, key=lambda s: s["id"]), resolved):
        if path.suffix.lower() not in EXTENSIONS:
            raise AudioManifestError(f"unsupported audio extension: {path.suffix}")
        raw = probe_duration(path)
        version = 1
        destination = audio_dir / f"scene-{scene['id']}-v{version}{path.suffix.lower()}"
        while destination.exists() and destination.resolve() != path:
            version += 1
            destination = audio_dir / f"scene-{scene['id']}-v{version}{path.suffix.lower()}"
        if destination.resolve() != path:
            shutil.copy2(path, destination)
        else:
            destination = path
        duration = raw + LEAD_IN + TAIL_OUT
        entries.append({"scene_id": scene["id"], "path": destination.relative_to(project).as_posix(), "raw_duration": raw, "lead_in": LEAD_IN, "tail_out": TAIL_OUT, "start": cursor, "end": cursor + duration, "duration": duration})
        cursor += duration
    if not 20 <= cursor <= 40:
        raise AudioManifestError(f"computed total duration must be 20-40 seconds, got {cursor:.2f}")
    manifest = {"schema_version": 1, "total_duration": cursor, "scenes": entries}
    save_json(project / "audio-manifest.json", manifest)
    return manifest


def main() -> None:
    parser = argparse.ArgumentParser(description="探测六幕本地配音并生成时间清单")
    parser.add_argument("project", type=Path)
    parser.add_argument("--audio", action="append", type=Path, required=True)
    args = parser.parse_args()
    from validate_story import validate_storyboard
    scenes = validate_storyboard(args.project / "storyboard.md")["scenes"]
    print(json.dumps(build_manifest(args.project, scenes, args.audio), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import json
import re
import string
import sys
from pathlib import Path

MOTIONS = {"slow-push-in", "slow-pull-out", "pan-left", "pan-right", "parallax"}


def _field(block: str, label: str) -> str:
    match = re.search(rf"(?m)^- {re.escape(label)}:[ \t]*(.*)$", block)
    return match.group(1).strip() if match else ""


def _section(block: str, name: str) -> str:
    match = re.search(rf"(?ms)^### {re.escape(name)}\s*\n(.*?)(?=^### |\Z)", block)
    return match.group(1).strip() if match else ""


def parse_storyboard(path: Path) -> dict:
    text = Path(path).read_text(encoding="utf-8")
    parts = re.split(r"(?m)^## Scene (\d{2})\s*$", text)
    scenes = []
    for index in range(1, len(parts), 2):
        scene_id, block = parts[index], parts[index + 1]
        review = _section(block, "Image Review")
        subtitles = [value.strip() for _, value in re.findall(r"(?m)^- Subtitle (\d+):[ \t]*(.*)$", block) if value.strip()]
        seconds = _field(block, "Target seconds")
        scenes.append({
            "id": scene_id,
            "role": _field(block, "Role"),
            "narration": _field(block, "Narration"),
            "subtitles": subtitles,
            "target_seconds": float(seconds) if seconds else None,
            "audio": _field(block, "Audio"),
            "motion": _field(block, "Motion"),
            "visual": _section(block, "Visual"),
            "prompt": _section(block, "Prompt"),
            "source_image": _field(review, "Source"),
            "preview_image": _field(review, "Preview"),
            "approved": _field(review, "Approved").lower() in {"yes", "true", "approved"},
        })
    return {"path": str(path), "scenes": sorted(scenes, key=lambda item: item["id"])}


def _count_caption_chars(value: str) -> int:
    punctuation = string.punctuation + "，。！？、；：‘’“”（）【】《》—…· "
    return len(value.translate(str.maketrans("", "", punctuation)))


def validate_storyboard(path: Path, template_mode: bool = False) -> dict:
    result = parse_storyboard(path)
    scenes = result["scenes"]
    if len(scenes) != 6:
        raise ValueError("storyboard must contain exactly 6 scenes")
    if [s["id"] for s in scenes] != [f"{i:02d}" for i in range(1, 7)]:
        raise ValueError("scene IDs must be exactly 01 through 06")
    for scene in scenes:
        sid = scene["id"]
        if scene["audio"] != f"audio/scene-{sid}.mp3":
            raise ValueError(f"Scene {sid}: audio must be audio/scene-{sid}.mp3")
        if template_mode:
            continue
        for field in ("role", "narration", "visual", "prompt", "motion"):
            if not scene[field]:
                raise ValueError(f"Scene {sid}: missing {field}")
        if not 1 <= len(scene["subtitles"]) <= 2:
            raise ValueError(f"Scene {sid}: subtitles must contain 1 or 2 lines")
        if any(_count_caption_chars(line) > 18 for line in scene["subtitles"]):
            raise ValueError(f"Scene {sid}: each subtitle line must be at most 18 characters")
        if scene["target_seconds"] is None or not 2 <= scene["target_seconds"] <= 8:
            raise ValueError(f"Scene {sid}: target_seconds must be between 2 and 8")
        if scene["motion"] not in MOTIONS:
            raise ValueError(f"Scene {sid}: unknown motion {scene['motion']}")
    return result


def main() -> None:
    parser = argparse.ArgumentParser(description="校验小航漫改六幕 Markdown")
    parser.add_argument("storyboard", type=Path)
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--template", action="store_true")
    args = parser.parse_args()
    try:
        data = validate_storyboard(args.storyboard, args.template)
    except (ValueError, OSError) as exc:
        print(f"story validation failed: {exc}", file=sys.stderr)
        raise SystemExit(2)
    if args.json:
        print(json.dumps(data, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

from __future__ import annotations

import argparse
import html
import re
import shutil
from pathlib import Path

from validate_story import validate_storyboard


def build_preview_html(scene: dict, image_path: Path, output_html: Path, project: Path | None = None) -> Path:
    output_html = Path(output_html)
    project = Path(project) if project else output_html.parents[2]
    local_image = output_html.parent / "assets" / Path(image_path).name
    local_image.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(image_path, local_image)
    relative_from_html = Path("assets") / local_image.name
    captions = "".join(f"<div>{html.escape(line)}</div>" for line in scene["subtitles"])
    sid = scene["id"]
    document = f'''<!doctype html>
<html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box}}html,body{{margin:0;background:#111}}.composition{{position:relative;width:1080px;height:1920px;overflow:hidden}}
.art{{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}}.gradient{{position:absolute;inset:auto 0 0;height:760px;background:linear-gradient(transparent,rgba(24,18,12,.72))}}
.subtitle{{position:absolute;left:84px;right:84px;bottom:300px;text-align:center;color:#fff;font:700 58px/1.35 "PingFang SC", "Noto Sans CJK SC", sans-serif;text-shadow:0 3px 12px #000,0 1px 2px #000}}
</style></head><body><div class="composition" data-composition-id="xiaohang-scene-{sid}-preview" data-start="0" data-duration="1" data-width="1080" data-height="1920">
<img class="art" src="{html.escape(relative_from_html.as_posix())}" alt=""><div class="gradient"></div><div class="subtitle">{captions}</div></div></body></html>'''
    output_html.parent.mkdir(parents=True, exist_ok=True)
    output_html.write_text(document, encoding="utf-8")
    return output_html


def update_review_links(storyboard: Path, scene_id: str, source: str, preview: str) -> None:
    path = Path(storyboard)
    text = path.read_text(encoding="utf-8")
    pattern = rf"(?ms)(^## Scene {re.escape(scene_id)}\s*$.*?)(?=^## Scene |\Z)"
    match = re.search(pattern, text)
    if not match:
        raise ValueError(f"Scene {scene_id} not found")
    block = match.group(1)
    block = re.sub(r"(?m)^- Source:.*$", f"- Source: {source}", block)
    block = re.sub(r"(?m)^- Preview:.*$", f"- Preview: {preview}", block)
    block = re.sub(r"(?m)^- Approved:.*$", "- Approved: no", block)
    path.write_text(text[:match.start()] + block + text[match.end():], encoding="utf-8")


def main() -> None:
    parser = argparse.ArgumentParser(description="生成精确字幕确认页；进入该确认页目录后运行 npx hyperframes snapshot --frames 1")
    parser.add_argument("project", type=Path)
    parser.add_argument("--scene", required=True)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--preview", type=Path)
    args = parser.parse_args()
    data = validate_storyboard(args.project / "storyboard.md")
    scene = next(item for item in data["scenes"] if item["id"] == args.scene)
    source = args.source if args.source.is_absolute() else args.project / args.source
    output = args.project / "review" / f"scene-{args.scene}" / "index.html"
    build_preview_html(scene, source, output, args.project)
    preview = args.preview or Path(f"images/scene-{args.scene}-preview-v1.png")
    print(f"cd {output.parent} && npx hyperframes snapshot --frames 1")
    print(f"然后将 snapshots 中的 PNG 复制为 {args.project / preview}")
    if (args.project / preview).is_file():
        update_review_links(args.project / "storyboard.md", args.scene, source.resolve().relative_to(args.project.resolve()).as_posix(), preview.as_posix())


if __name__ == "__main__":
    main()

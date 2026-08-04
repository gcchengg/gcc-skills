from __future__ import annotations

import argparse
import html
import shutil
from pathlib import Path

from gate_status import require_render_ready
from project_io import load_json
from validate_story import validate_storyboard

MOTION = {
    "slow-push-in": ("scale(1.00)", "scale(1.08)"),
    "slow-pull-out": ("scale(1.08)", "scale(1.00)"),
    "pan-left": ("scale(1.06) translateX(2%)", "scale(1.06) translateX(-2%)"),
    "pan-right": ("scale(1.06) translateX(-2%)", "scale(1.06) translateX(2%)"),
    "parallax": ("scale(1.05) translateY(1%)", "scale(1.09) translateY(-1%)"),
}


def _copy_asset(source: Path, destination: Path) -> str:
    destination.parent.mkdir(parents=True, exist_ok=True)
    if source.resolve() != destination.resolve():
        shutil.copy2(source, destination)
    return destination.as_posix()


def build_video(project: Path) -> Path:
    project = Path(project).resolve()
    state = require_render_ready(project)
    story = validate_storyboard(project / "storyboard.md")
    manifest = load_json(project / "audio-manifest.json")
    hyperframes = project / "hyperframes"
    hyperframes.mkdir(exist_ok=True)
    gsap_source = Path(__file__).parents[1] / "assets" / "vendor" / "gsap.min.js"
    if not gsap_source.is_file():
        raise FileNotFoundError("bundled assets/vendor/gsap.min.js is missing")
    _copy_asset(gsap_source, hyperframes / "assets" / "vendor" / "gsap.min.js")
    clips, audio_clips, animations = [], [], []
    manifest_by_id = {item["scene_id"]: item for item in manifest["scenes"]}
    for index, scene in enumerate(story["scenes"]):
        sid = scene["id"]
        timing = manifest_by_id[sid]
        approved = state["approved_images"][sid]
        image_source = project / approved["source"]
        image_url = Path(_copy_asset(image_source, hyperframes / "assets" / "images" / image_source.name)).relative_to(hyperframes).as_posix()
        audio_path = Path(timing["path"])
        if audio_path.is_absolute():
            audio_path = audio_path.relative_to(project)
        audio_source = project / audio_path
        audio_url = Path(_copy_asset(audio_source, hyperframes / "assets" / "audio" / audio_source.name)).relative_to(hyperframes).as_posix()
        captions = "".join(f"<div>{html.escape(line)}</div>" for line in scene["subtitles"])
        clips.append(f'''<section class="scene clip transition-{index % 3}" id="scene-{sid}" data-start="{timing['start']:.6f}" data-duration="{timing['duration']:.6f}" data-track-index="{index}"><img src="{html.escape(image_url)}" alt=""><div class="shade"></div><div class="subtitle">{captions}</div></section>''')
        audio_clips.append(f'''<audio id="audio-{sid}" src="{html.escape(audio_url)}" data-start="{timing['start'] + timing['lead_in']:.6f}" data-duration="{timing['raw_duration']:.6f}" data-track-index="{20 + index}"></audio>''')
        start_transform, end_transform = MOTION[scene["motion"]]
        animations.append(f'''tl.fromTo("#scene-{sid} img", {{transform:"{start_transform}"}}, {{transform:"{end_transform}",duration:{timing['duration']:.6f},ease:"none"}}, {timing['start']:.6f});
tl.fromTo("#scene-{sid}", {{opacity:0}}, {{opacity:1,duration:0.16}}, {timing['start']:.6f});
tl.to("#scene-{sid}", {{opacity:0,duration:0.20}}, {max(timing['start'], timing['end'] - 0.20):.6f});
tl.set("#scene-{sid}", {{opacity:0}}, {timing['end']:.6f});''')
    total = float(manifest["total_duration"])
    document = f'''<!doctype html><html><head><meta charset="utf-8"><style>
*{{box-sizing:border-box}}html,body{{margin:0;background:#15110d}}#composition{{position:relative;width:1080px;height:1920px;overflow:hidden}}.scene{{position:absolute;inset:0;opacity:0}}.scene img{{width:100%;height:100%;object-fit:cover}}.shade{{position:absolute;inset:auto 0 0;height:760px;background:linear-gradient(transparent,rgba(20,15,10,.72))}}.subtitle{{position:absolute;left:84px;right:84px;bottom:300px;text-align:center;color:white;font:700 58px/1.35 "PingFang SC","Noto Sans CJK SC",sans-serif;text-shadow:0 3px 12px #000,0 1px 2px #000}}
</style></head><body><main id="composition" data-composition-id="xiaohang-comic-video" data-start="0" data-duration="{total:.6f}" data-width="1080" data-height="1920" data-fps="30">{''.join(clips)}{''.join(audio_clips)}</main><script src="assets/vendor/gsap.min.js"></script><script>
window.__timelines=window.__timelines||{{}};const tl=gsap.timeline({{ paused: true }});{''.join(animations)}window.__timelines["xiaohang-comic-video"]=tl;
</script></body></html>'''
    target = hyperframes / "index.html"
    temp = target.with_suffix(".html.tmp")
    temp.write_text(document, encoding="utf-8")
    temp.replace(target)
    return target


def main() -> None:
    parser = argparse.ArgumentParser(description="构建已通过四道门禁的小航漫改 HyperFrames 工程")
    parser.add_argument("project", type=Path)
    args = parser.parse_args()
    print(build_video(args.project))


if __name__ == "__main__": main()

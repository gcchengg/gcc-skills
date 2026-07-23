from __future__ import annotations

import argparse
from pathlib import Path

from project_io import initial_state, load_json, save_json, sha256_file
from validate_story import validate_storyboard


class GateError(RuntimeError):
    pass


def _state(project: Path) -> tuple[Path, dict]:
    path = Path(project) / "status.json"
    return path, load_json(path)


def _reset_after(state: dict, gate: str) -> None:
    order = ["topic", "storyboard", "images", "audio"]
    for downstream in order[order.index(gate) + 1:]:
        state["gates"][downstream] = "pending"
    if gate in {"topic", "storyboard"}:
        state["approved_story_hash"] = None if gate == "topic" else state["approved_story_hash"]
        state["approved_images"] = {}
    if gate in {"topic", "storyboard", "images"}:
        state["approved_audio_hash"] = None
    state["render"] = {"status": "pending", "path": None}


def refresh_invalidations(project: Path) -> dict:
    project = Path(project)
    path, state = _state(project)
    options = project / "topic-options.md"
    if state["gates"]["topic"] == "approved" and (
        not options.is_file() or sha256_file(options) != state.get("topic_options_hash")
    ):
        state = initial_state()
    story = project / "storyboard.md"
    if state["gates"]["storyboard"] == "approved" and (
        not story.is_file() or sha256_file(story) != state.get("approved_story_hash")
    ):
        state["gates"]["storyboard"] = "pending"
        state["approved_story_hash"] = None
        state["approved_images"] = {}
        _reset_after(state, "storyboard")
    for sid, item in list(state.get("approved_images", {}).items()):
        source = project / item["source"]
        preview = project / item["preview"]
        if (not source.is_file() or not preview.is_file()
                or sha256_file(source) != item["source_hash"]
                or sha256_file(preview) != item["preview_hash"]):
            state["approved_images"].pop(sid, None)
            state["gates"]["images"] = "pending"
            _reset_after(state, "images")
    manifest = project / "audio-manifest.json"
    if state["gates"]["audio"] == "approved" and (
        not manifest.is_file() or sha256_file(manifest) != state.get("approved_audio_hash")
    ):
        state["gates"]["audio"] = "pending"
        state["approved_audio_hash"] = None
        state["render"] = {"status": "pending", "path": None}
    save_json(path, state)
    return state


def approve_topic(project: Path, topic_id: str) -> dict:
    project = Path(project)
    path, state = _state(project)
    options = project / "topic-options.md"
    if not options.is_file() or topic_id not in options.read_text(encoding="utf-8"):
        raise GateError(f"topic not found: {topic_id}")
    state["selected_topic"] = topic_id
    state["topic_options_hash"] = sha256_file(options)
    state["gates"]["topic"] = "approved"
    state["approved_story_hash"] = None
    _reset_after(state, "topic")
    save_json(path, state)
    return state


def approve_storyboard(project: Path) -> dict:
    project = Path(project)
    state = refresh_invalidations(project)
    if state["gates"]["topic"] != "approved":
        raise GateError("topic gate is not approved")
    validate_storyboard(project / "storyboard.md")
    state["approved_story_hash"] = sha256_file(project / "storyboard.md")
    state["gates"]["storyboard"] = "approved"
    state["approved_images"] = {}
    _reset_after(state, "storyboard")
    save_json(project / "status.json", state)
    return state


def approve_image(project: Path, scene: str, source: Path, preview: Path) -> dict:
    project = Path(project)
    state = refresh_invalidations(project)
    if state["gates"]["storyboard"] != "approved":
        raise GateError("storyboard gate is not approved")
    if scene not in {f"{i:02d}" for i in range(1, 7)}:
        raise GateError("scene must be 01 through 06")
    source, preview = Path(source).resolve(), Path(preview).resolve()
    try:
        source_rel, preview_rel = source.relative_to(project.resolve()), preview.relative_to(project.resolve())
    except ValueError as exc:
        raise GateError("approved images must be inside the project") from exc
    if not source.is_file() or not preview.is_file():
        raise GateError("source and preview files must exist")
    state["approved_images"][scene] = {
        "source": source_rel.as_posix(), "source_hash": sha256_file(source),
        "preview": preview_rel.as_posix(), "preview_hash": sha256_file(preview),
    }
    state["gates"]["images"] = "approved" if len(state["approved_images"]) == 6 else "pending"
    _reset_after(state, "images")
    save_json(project / "status.json", state)
    return state


def approve_audio(project: Path, manifest: Path) -> dict:
    project = Path(project)
    state = refresh_invalidations(project)
    if state["gates"]["images"] != "approved":
        raise GateError("images gate is not approved")
    manifest = Path(manifest).resolve()
    if manifest != (project / "audio-manifest.json").resolve() or not manifest.is_file():
        raise GateError("audio manifest must be PROJECT/audio-manifest.json")
    state["approved_audio_hash"] = sha256_file(manifest)
    state["gates"]["audio"] = "approved"
    state["render"] = {"status": "pending", "path": None}
    save_json(project / "status.json", state)
    return state


def require_render_ready(project: Path) -> dict:
    state = refresh_invalidations(project)
    missing = [name for name, value in state["gates"].items() if value != "approved"]
    if missing:
        raise GateError("render blocked; pending gates: " + ", ".join(missing))
    return state


def main() -> None:
    parser = argparse.ArgumentParser(description="管理小航漫改四道门禁")
    sub = parser.add_subparsers(dest="command", required=True)
    for name in ("init", "approve-storyboard"):
        p = sub.add_parser(name); p.add_argument("project", type=Path)
    p = sub.add_parser("approve-topic"); p.add_argument("project", type=Path); p.add_argument("--topic-id", required=True)
    p = sub.add_parser("approve-image"); p.add_argument("project", type=Path); p.add_argument("--scene", required=True); p.add_argument("--source", type=Path, required=True); p.add_argument("--preview", type=Path, required=True)
    p = sub.add_parser("approve-audio"); p.add_argument("project", type=Path); p.add_argument("--manifest", type=Path, required=True)
    p = sub.add_parser("check"); p.add_argument("project", type=Path); p.add_argument("--gate", choices=["render"], required=True)
    args = parser.parse_args()
    if args.command == "init": save_json(args.project / "status.json", initial_state())
    elif args.command == "approve-topic": approve_topic(args.project, args.topic_id)
    elif args.command == "approve-storyboard": approve_storyboard(args.project)
    elif args.command == "approve-image": approve_image(args.project, args.scene, args.source, args.preview)
    elif args.command == "approve-audio": approve_audio(args.project, args.manifest)
    elif args.command == "check": require_render_ready(args.project)
    print("OK")


if __name__ == "__main__":
    main()

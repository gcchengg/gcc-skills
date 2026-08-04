from __future__ import annotations

import hashlib
import json
import os
from pathlib import Path


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with Path(path).open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_json(path: Path) -> dict:
    return json.loads(Path(path).read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    os.replace(temp, path)


def initial_state() -> dict:
    return {
        "schema_version": 1,
        "gates": {"topic": "pending", "storyboard": "pending", "images": "pending", "audio": "pending"},
        "selected_topic": None,
        "topic_options_hash": None,
        "approved_story_hash": None,
        "approved_images": {},
        "approved_audio_hash": None,
        "render": {"status": "pending", "path": None},
    }

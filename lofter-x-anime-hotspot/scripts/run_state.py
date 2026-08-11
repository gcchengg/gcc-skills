"""Private, resumable state storage for LOFTER content runs."""

import json
import re
from datetime import datetime, timezone
from pathlib import Path


STATES = (
    "researching",
    "draft_ready",
    "authorization_review",
    "revisions_required",
    "approved",
    "publishing",
    "published",
)

ALLOWED = {
    "researching": {"draft_ready"},
    "draft_ready": {"authorization_review"},
    "authorization_review": {"revisions_required", "approved"},
    "revisions_required": {"authorization_review"},
    "approved": {"publishing"},
    "publishing": {"published", "approved"},
    "published": set(),
}

FORBIDDEN_KEYS = {"password", "cookie", "cookies", "verification_code", "captcha"}

_FIELD_TYPES = {
    "run_id": str,
    "state": str,
    "topic": str,
    "time_window_hours": int,
    "content_mode": str,
    "files": dict,
    "media_review": dict,
    "confirmations": dict,
    "publication": dict,
    "errors": list,
    "created_at": str,
    "updated_at": str,
}


def _slugify(topic_slug: str) -> str:
    if not isinstance(topic_slug, str):
        raise ValueError("topic slug must be a string")
    ascii_value = topic_slug.encode("ascii", "ignore").decode("ascii").lower()
    slug = re.sub(r"[^a-z0-9]+", "-", ascii_value).strip("-")
    if not slug:
        raise ValueError("topic slug must contain ASCII letters or digits")
    return slug


def _timestamp(now: datetime | None = None) -> datetime:
    return now if now is not None else datetime.now(timezone.utc)


def write_json_atomic(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(path.suffix + ".tmp")
    temporary.write_text(
        json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    temporary.replace(path)


def create_run(
    runs_root: Path, topic_slug: str, now: datetime | None = None
) -> tuple[Path, dict]:
    timestamp = _timestamp(now)
    topic = _slugify(topic_slug)
    run_id = f"{timestamp.strftime('%Y%m%d-%H%M%S')}-{topic}"
    run_dir = Path(runs_root) / run_id
    if run_dir.exists():
        raise FileExistsError(f"run already exists: {run_dir}")

    run_dir.mkdir(parents=True)
    for name in ("sources", "original-media", "generated-media"):
        (run_dir / name).mkdir()

    created_at = timestamp.isoformat()
    state = {
        "run_id": run_id,
        "state": "researching",
        "topic": topic,
        "time_window_hours": 72,
        "content_mode": "human_review",
        "files": {},
        "media_review": {},
        "confirmations": {"fill": False, "submit": False},
        "publication": {},
        "errors": [],
        "created_at": created_at,
        "updated_at": created_at,
    }
    write_json_atomic(run_dir / "status.json", state)
    return run_dir, state


def load_state(run_dir: Path) -> dict:
    try:
        value = json.loads((Path(run_dir) / "status.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError("invalid state JSON") from error

    if type(value) is not dict:
        raise ValueError("state must be an object")
    for field, expected_type in _FIELD_TYPES.items():
        if field not in value:
            raise ValueError(f"state missing field: {field}")
        if type(value[field]) is not expected_type:
            raise ValueError(f"state field {field} must be {expected_type.__name__}")
    if value["state"] not in STATES:
        raise ValueError(f"unknown state: {value['state']}")
    return value


def transition(run_dir: Path, expected: str, target: str, **updates) -> dict:
    state = load_state(run_dir)
    if state["state"] != expected:
        raise ValueError(f"expected {expected}, found {state['state']}")
    if target not in ALLOWED[expected]:
        raise ValueError(f"illegal state transition: {expected} -> {target}")
    lowered = {key.lower() for key in updates}
    forbidden = sorted(lowered & FORBIDDEN_KEYS)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden[0]}")
    state.update(updates)
    state["state"] = target
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json_atomic(Path(run_dir) / "status.json", state)
    return state

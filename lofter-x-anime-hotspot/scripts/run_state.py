"""Private, resumable state storage for LOFTER content runs."""

import json
import re
import tempfile
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

FORBIDDEN_TOKENS = {
    "password",
    "cookie",
    "verificationcode",
    "captcha",
    "session",
    "authtoken",
    "accesstoken",
    "refreshtoken",
    "secret",
}

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
    """Replace JSON atomically with a unique temporary file in the same directory.

    This prevents partial-file reads; it deliberately does not provide a
    multi-writer lock.
    """
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(
        mode="w",
        encoding="utf-8",
        dir=path.parent,
        prefix=f".{path.name}.",
        suffix=".tmp",
        delete=False,
    ) as file:
        temporary = Path(file.name)
        file.write(json.dumps(payload, ensure_ascii=False, indent=2) + "\n")
    try:
        temporary.replace(path)
    finally:
        temporary.unlink(missing_ok=True)


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
        "time_window_hours": 24,
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


def _validate_state(value: object) -> dict:
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


def load_state(run_dir: Path) -> dict:
    try:
        value = json.loads((Path(run_dir) / "status.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError("invalid state JSON") from error
    return _validate_state(value)


def _contains_forbidden_key(value: object) -> str | None:
    if type(value) is dict:
        for key, nested in value.items():
            if type(key) is str:
                normalized = "".join(char for char in key.casefold() if char.isalnum())
                if any(token in normalized for token in FORBIDDEN_TOKENS):
                    return normalized
            forbidden = _contains_forbidden_key(nested)
            if forbidden:
                return forbidden
    elif type(value) is list:
        for nested in value:
            forbidden = _contains_forbidden_key(nested)
            if forbidden:
                return forbidden
    return None


def _merged_state(state: dict, updates: dict) -> dict:
    merged = state.copy()
    for key, value in updates.items():
        if type(value) is dict and type(merged.get(key)) is dict:
            merged[key] = {**merged[key], **value}
        else:
            merged[key] = value
    return merged


def _complete_object(value: object) -> bool:
    return type(value) is dict and bool(value) and all(
        type(key) is str and key and item not in (None, "")
        for key, item in value.items()
    )


def _validate_transition_prerequisites(state: dict, expected: str, target: str) -> None:
    confirmations = state["confirmations"]
    if target == "approved" and confirmations.get("fill") is not True:
        raise ValueError("fill confirmation is required before approval")
    if expected == "approved" and target == "publishing":
        if confirmations.get("fill") is not True:
            raise ValueError("fill confirmation is required before publishing")
        if not _complete_object(state.get("platform_preview")):
            raise ValueError("complete platform preview is required before publishing")
    if target == "published":
        if confirmations.get("submit") is not True:
            raise ValueError("submit confirmation is required before publishing")
        if not _complete_object(state["publication"]):
            raise ValueError("valid publication object is required before publishing")


def _validate_window_expansion(state: dict, proposed: dict) -> None:
    if proposed["time_window_hours"] == state["time_window_hours"]:
        return
    evidence = proposed.get("window_expansion")
    valid_evidence = (
        type(evidence) is dict
        and evidence.get("from") == 24
        and type(evidence.get("from")) is int
        and evidence.get("to") == 72
        and type(evidence.get("to")) is int
        and evidence.get("insufficient_24h") is True
        and type(evidence.get("reason")) is str
        and bool(evidence["reason"].strip())
    )
    if (
        state["time_window_hours"] != 24
        or proposed["time_window_hours"] != 72
        or not valid_evidence
    ):
        raise ValueError("window expansion requires auditable 24-to-72 evidence")


def transition(run_dir: Path, expected: str, target: str, **updates) -> dict:
    state = load_state(run_dir)
    if state["state"] != expected:
        raise ValueError(f"expected {expected}, found {state['state']}")
    if target not in ALLOWED[expected]:
        raise ValueError(f"illegal state transition: {expected} -> {target}")
    forbidden = _contains_forbidden_key(updates)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden}")
    if "run_id" in updates or "state" in updates:
        raise ValueError("run_id and state cannot be updated by transition")

    proposed = _merged_state(state, updates)
    proposed["state"] = target
    proposed["updated_at"] = datetime.now(timezone.utc).isoformat()
    _validate_state(proposed)
    _validate_window_expansion(state, proposed)
    _validate_transition_prerequisites(proposed, expected, target)
    write_json_atomic(Path(run_dir) / "status.json", proposed)
    return proposed

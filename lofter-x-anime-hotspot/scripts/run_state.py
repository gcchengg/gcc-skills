"""Private, resumable state storage for LOFTER content runs."""

import json
import math
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath, PureWindowsPath


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
    "authorization",
    "credential",
    "bearer",
    "header",
    "apikey",
    "token",
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

_OPTIONAL_FIELDS = {
    "approved_manifest_digest",
    "platform_preview",
    "window_expansion",
}
_STATE_FIELDS = set(_FIELD_TYPES) | _OPTIONAL_FIELDS
_UPDATE_FIELDS = {
    "topic",
    "time_window_hours",
    "content_mode",
    "files",
    "media_review",
    "confirmations",
    "publication",
    "errors",
    "approved_manifest_digest",
    "platform_preview",
    "window_expansion",
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
    temporary: Path | None = None
    try:
        serialized = json.dumps(payload, ensure_ascii=False, indent=2, allow_nan=False)
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
            file.write(serialized + "\n")
        temporary.replace(path)
    finally:
        if temporary is not None:
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
    unknown = sorted(set(value) - _STATE_FIELDS)
    if unknown:
        raise ValueError(f"state has unknown fields: {', '.join(unknown)}")
    for field, expected_type in _FIELD_TYPES.items():
        if field not in value:
            raise ValueError(f"state missing field: {field}")
        if type(value[field]) is not expected_type:
            raise ValueError(f"state field {field} must be {expected_type.__name__}")
    if value["state"] not in STATES:
        raise ValueError(f"unknown state: {value['state']}")
    _validate_files(value["files"])
    _validate_errors(value["errors"])
    _validate_confirmations(value["confirmations"])
    _validate_json_object(value["media_review"], "media_review")
    _validate_json_object(value["publication"], "publication")
    if "platform_preview" in value:
        _validate_json_object(value["platform_preview"], "platform_preview")
    if "approved_manifest_digest" in value and not (
        type(value["approved_manifest_digest"]) is str
        and re.fullmatch(r"[0-9a-f]{64}", value["approved_manifest_digest"])
    ):
        raise ValueError("approved_manifest_digest must be a lowercase SHA-256 digest")
    if value["time_window_hours"] == 72 and not _valid_window_expansion(
        value.get("window_expansion")
    ):
        raise ValueError("window expansion requires auditable 24-to-72 evidence")
    if "window_expansion" in value:
        _validate_json_object(value["window_expansion"], "window_expansion")
    forbidden = _find_forbidden_data(value)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden}")
    return value


def load_state(run_dir: Path) -> dict:
    try:
        value = json.loads((Path(run_dir) / "status.json").read_text(encoding="utf-8"))
    except json.JSONDecodeError as error:
        raise ValueError("invalid state JSON") from error
    return _validate_state(value)


def _find_forbidden_data(value: object) -> str | None:
    if type(value) is dict:
        for key, nested in value.items():
            if type(key) is str:
                normalized = "".join(char for char in key.casefold() if char.isalnum())
                if any(token in normalized for token in FORBIDDEN_TOKENS):
                    return normalized
            forbidden = _find_forbidden_data(nested)
            if forbidden:
                return forbidden
    elif type(value) is list:
        for nested in value:
            forbidden = _find_forbidden_data(nested)
            if forbidden:
                return forbidden
    elif type(value) is str:
        candidate = value.strip()
        if candidate.casefold().startswith("bearer "):
            return "bearer-value"
        if re.fullmatch(r"[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}", candidate):
            return "jwt-value"
    return None


def _validate_json_value(value: object, field: str) -> None:
    if value is None or type(value) in {bool, int, str}:
        return
    if type(value) is float:
        if math.isfinite(value):
            return
        raise ValueError(f"{field} must contain JSON-compatible values")
    if type(value) is list:
        for nested in value:
            _validate_json_value(nested, field)
        return
    if type(value) is dict:
        for key, nested in value.items():
            if type(key) is not str:
                raise ValueError(f"{field} must contain JSON-compatible values")
            _validate_json_value(nested, field)
        return
    raise ValueError(f"{field} must contain JSON-compatible values")


def _validate_json_object(value: object, field: str) -> None:
    if type(value) is not dict:
        raise ValueError(f"{field} must be an object")
    _validate_json_value(value, field)


def _validate_files(files: dict) -> None:
    for name, location in files.items():
        if type(name) is not str or not name or type(location) is not str or not location:
            raise ValueError("files must map names to relative run-local paths")
        posix_path = PurePosixPath(location)
        windows_path = PureWindowsPath(location)
        if (
            posix_path.is_absolute()
            or windows_path.is_absolute()
            or windows_path.drive
            or windows_path.root
            or ".." in posix_path.parts
            or ".." in windows_path.parts
        ):
            raise ValueError("files must map names to relative run-local paths")


def _validate_errors(errors: list) -> None:
    if not all(type(error) is str for error in errors):
        raise ValueError("errors must be a list of strings")


def _validate_confirmations(confirmations: dict) -> None:
    if set(confirmations) != {"fill", "submit"} or any(
        type(value) is not bool for value in confirmations.values()
    ):
        raise ValueError("confirmations must contain exact boolean fill and submit fields")


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


def _valid_window_expansion(evidence: object) -> bool:
    return (
        type(evidence) is dict
        and evidence.get("from") == 24
        and type(evidence.get("from")) is int
        and evidence.get("to") == 72
        and type(evidence.get("to")) is int
        and evidence.get("insufficient_24h") is True
        and type(evidence.get("reason")) is str
        and bool(evidence["reason"].strip())
    )


def _validate_window_expansion(state: dict, proposed: dict) -> None:
    if proposed["time_window_hours"] == state["time_window_hours"]:
        return
    valid_evidence = _valid_window_expansion(proposed.get("window_expansion"))
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
    forbidden = _find_forbidden_data(updates)
    if forbidden:
        raise ValueError(f"forbidden secret field: {forbidden}")
    if {"run_id", "state", "created_at", "updated_at"} & set(updates):
        raise ValueError("run_id and state cannot be updated by transition")
    unknown = sorted(set(updates) - _UPDATE_FIELDS)
    if unknown:
        raise ValueError(f"unknown update field: {unknown[0]}")

    proposed = _merged_state(state, updates)
    proposed["state"] = target
    proposed["updated_at"] = datetime.now(timezone.utc).isoformat()
    _validate_state(proposed)
    _validate_window_expansion(state, proposed)
    _validate_transition_prerequisites(proposed, expected, target)
    write_json_atomic(Path(run_dir) / "status.json", proposed)
    return proposed

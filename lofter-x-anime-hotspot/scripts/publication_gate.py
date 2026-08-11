"""Persist two explicit human confirmations around LOFTER publication."""

import hashlib
import json
import re
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

from build_publishable_draft import load_media_ledger, validate_persisted_public_copy
from run_state import load_state, transition, write_json_atomic


FIRST_CONFIRMATION = "确认发布"
SECOND_CONFIRMATION = "确认最终提交"
PUBLISHABLE_MEDIA = {"authorized", "independent"}

_OBSERVED_PREVIEW_FIELDS = {
    "captured_at",
    "title",
    "article",
    "tags",
    "media",
    "submit_button_visible",
}
_PERSISTED_PREVIEW_FIELDS = _OBSERVED_PREVIEW_FIELDS | {"observed_manifest_sha256"}
_PUBLIC_MEDIA_FIELDS = ("display_id", "role", "local_path", "review_status")
_SUCCESS_RESULT_FIELDS = {"lofter_url", "published_at"}
_UNCERTAIN_RESULT = {
    "result": "uncertain",
    "verification_required": "read_only_lofter_profile_or_drafts",
}
_PRIVATE_ERROR_MARKERS = (
    "authorization",
    "bearer",
    "credential",
    "apikey",
    "token",
    "password",
    "cookie",
    "captcha",
    "session",
    "secret",
    "file://",
    "/users/",
    "/home/",
    "/private/",
    "/tmp/",
)


def _parse_iso_datetime(value: object, field: str) -> datetime:
    if type(value) is not str or not value.strip() or "T" not in value:
        raise ValueError(f"{field} must be a timezone-aware ISO-8601 datetime")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(
            f"{field} must be a timezone-aware ISO-8601 datetime"
        ) from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{field} must be a timezone-aware ISO-8601 datetime")
    return parsed


def _titles_and_tags(run_dir: Path) -> tuple[list[str], list[str]]:
    try:
        content = (run_dir / "titles-and-tags.md").read_text(encoding="utf-8")
    except OSError as error:
        raise ValueError("titles and tags are required") from error
    match = re.fullmatch(
        r"# 备选标题\n\n"
        r"1\. ([^\n]+)\n2\. ([^\n]+)\n3\. ([^\n]+)\n\n"
        r"# 标签\n\n([^\n]+)\n?",
        content,
    )
    if match is None:
        raise ValueError("titles and tags must use the publishable draft format")
    titles = [match.group(index).strip() for index in range(1, 4)]
    tag_line = match.group(4)
    tags = re.findall(r"#([^#\n]+)#", tag_line)
    if (
        any(not title for title in titles)
        or not 8 <= len(tags) <= 12
        or len(set(tags)) != len(tags)
        or any(not tag.strip() for tag in tags)
        or tag_line != " ".join(f"#{tag}#" for tag in tags)
    ):
        raise ValueError("titles and tags must use the publishable draft format")
    return titles, tags


def _publishable_ledger(run_dir: Path) -> list[dict]:
    ledger = load_media_ledger(run_dir)
    if not ledger or any(
        item["review_status"] not in PUBLISHABLE_MEDIA for item in ledger
    ):
        raise ValueError("media review incomplete")
    return ledger


def _build_public_manifest(run_dir: Path, ledger: list[dict] | None = None) -> dict:
    ledger = _publishable_ledger(run_dir) if ledger is None else ledger
    try:
        article = (run_dir / "article.md").read_text(encoding="utf-8")
    except OSError as error:
        raise ValueError("article is required") from error
    titles, tags = _titles_and_tags(run_dir)
    article, titles, tags = validate_persisted_public_copy(article, titles, tags)
    public_media = []
    for item in ledger:
        path = run_dir / item["local_path"]
        if path.is_symlink() or not path.is_file():
            raise ValueError("canonical media must be a regular run-local file")
        try:
            content = path.read_bytes()
        except OSError as error:
            raise ValueError("canonical media cannot be read") from error
        if not content:
            raise ValueError("canonical media must not be empty")
        public_media.append(
            {
                **{field: item[field] for field in _PUBLIC_MEDIA_FIELDS},
                "sha256": hashlib.sha256(content).hexdigest(),
                "size": len(content),
            }
        )
    return {
        "title": titles[0],
        "article": article,
        "tags": tags,
        "media": public_media,
    }


def _manifest_digest(manifest: dict) -> str:
    canonical = json.dumps(
        manifest,
        ensure_ascii=False,
        sort_keys=True,
        separators=(",", ":"),
        allow_nan=False,
    ).encode("utf-8")
    return hashlib.sha256(canonical).hexdigest()


def _approved_digest(state: dict) -> str:
    digest = state.get("approved_manifest_digest")
    if type(digest) is not str or re.fullmatch(r"[0-9a-f]{64}", digest) is None:
        raise ValueError("approved upload manifest digest is missing")
    return digest


def _require_unchanged_manifest(run_dir: Path, state: dict) -> tuple[dict, str]:
    manifest = _build_public_manifest(run_dir)
    current_digest = _manifest_digest(manifest)
    if current_digest != _approved_digest(state):
        raise ValueError("upload manifest changed after first confirmation")
    return manifest, current_digest


def approve_form_fill(run_dir: Path, confirmation: str) -> dict:
    """Record the first exact confirmation after all media pass review."""
    if confirmation != FIRST_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认发布")
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if state["state"] != "authorization_review":
        raise ValueError("run is not awaiting authorization review")
    ledger = _publishable_ledger(run_dir)
    manifest_digest = _manifest_digest(_build_public_manifest(run_dir, ledger))
    attested_at = datetime.now(timezone.utc).isoformat()
    return transition(
        run_dir,
        "authorization_review",
        "approved",
        confirmations={"fill": True, "submit": False},
        approved_manifest_digest=manifest_digest,
        media_rights_attestation={"attested": True, "attested_at": attested_at},
    )


def build_upload_manifest(run_dir: Path) -> dict:
    """Build a public-only, run-local upload manifest after first approval."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if (
        state["state"] != "approved"
        or state["confirmations"]["fill"] is not True
        or state.get("media_rights_attestation", {}).get("attested") is not True
    ):
        raise ValueError("first publication confirmation is missing")
    manifest, _ = _require_unchanged_manifest(run_dir, state)
    return manifest


def _platform_projection(manifest: dict) -> dict:
    return {
        "title": manifest["title"],
        "article": manifest["article"],
        "tags": manifest["tags"],
        "media": [
            {
                "display_id": item["display_id"],
                "sha256": item["sha256"],
                "size": item["size"],
            }
            for item in manifest["media"]
        ],
    }


def _validate_platform_preview(
    run_dir: Path, value: object, *, persisted: bool = False
) -> dict:
    expected_fields = _PERSISTED_PREVIEW_FIELDS if persisted else _OBSERVED_PREVIEW_FIELDS
    if type(value) is not dict or set(value) != expected_fields:
        raise ValueError("final platform preview is incomplete")
    supplied_digest = value.get("observed_manifest_sha256") if persisted else None
    observed = {field: value[field] for field in _OBSERVED_PREVIEW_FIELDS}
    try:
        _parse_iso_datetime(observed["captured_at"], "captured_at")
    except ValueError as error:
        raise ValueError("final platform preview is incomplete") from error
    state = load_state(run_dir)
    manifest, _ = _require_unchanged_manifest(run_dir, state)
    projection = _platform_projection(manifest)
    if observed["submit_button_visible"] is not True:
        raise ValueError("final platform preview is incomplete")
    candidate = {
        "title": observed["title"],
        "article": observed["article"],
        "tags": observed["tags"],
        "media": observed["media"],
    }
    try:
        observed_digest = _manifest_digest(candidate)
        expected_digest = _manifest_digest(projection)
    except (TypeError, ValueError) as error:
        raise ValueError("final platform preview is incomplete") from error
    if observed_digest != expected_digest:
        raise ValueError(
            "final platform preview contents do not match approved upload manifest"
        )
    if persisted and supplied_digest != observed_digest:
        raise ValueError("final platform preview observed digest is invalid")
    return {**observed, "observed_manifest_sha256": observed_digest}


def mark_form_filled(run_dir: Path, platform_preview: dict) -> dict:
    """Persist typed final-form evidence before the second confirmation."""
    run_dir = Path(run_dir)
    preview = _validate_platform_preview(run_dir, platform_preview)
    return transition(
        run_dir,
        "approved",
        "publishing",
        platform_preview=preview,
    )


def approve_final_submit(run_dir: Path, confirmation: str) -> dict:
    """Record the second exact confirmation without claiming publication."""
    if confirmation != SECOND_CONFIRMATION:
        raise ValueError("exact confirmation required: 确认最终提交")
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if state["state"] != "publishing" or not state.get("platform_preview"):
        raise ValueError("final platform preview is required")
    _validate_platform_preview(run_dir, state["platform_preview"], persisted=True)
    if state["publication"].get("result") == "uncertain":
        raise ValueError(
            "read-only LOFTER profile/drafts check is required before further action"
        )
    if state["confirmations"]["submit"] is True:
        raise ValueError("final submission confirmation has already been recorded")
    state["confirmations"]["submit"] = True
    state["updated_at"] = datetime.now(timezone.utc).isoformat()
    write_json_atomic(run_dir / "status.json", state)
    return load_state(run_dir)


def _validate_lofter_url(value: object) -> str:
    if type(value) is not str or not value.strip():
        raise ValueError("lofter_url must be an HTTPS LOFTER URL")
    try:
        parsed = urlparse(value)
        host = (parsed.hostname or "").casefold()
        valid = (
            parsed.scheme == "https"
            and (host == "lofter.com" or host.endswith(".lofter.com"))
            and bool(parsed.path.strip("/"))
            and parsed.username is None
            and parsed.password is None
            and parsed.port is None
        )
    except ValueError:
        valid = False
    if not valid:
        raise ValueError("lofter_url must be an HTTPS LOFTER URL")
    return value


def _validate_publication_result(result: object) -> dict:
    if type(result) is not dict or set(result) != _SUCCESS_RESULT_FIELDS:
        raise ValueError("publication result is incomplete")
    _validate_lofter_url(result["lofter_url"])
    _parse_iso_datetime(result["published_at"], "published_at")
    return result.copy()


def record_publication(run_dir: Path, result: dict) -> dict:
    """Record a verified URL, or freeze an uncertain post-submit outcome."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if state["state"] != "publishing" or state["confirmations"]["submit"] is not True:
        raise ValueError("final submission confirmation is missing")
    if state["publication"].get("result") == "uncertain":
        raise ValueError(
            "read-only LOFTER profile/drafts check is required before further action"
        )
    if type(result) is dict and result == {"result": "uncertain"}:
        state["publication"] = _UNCERTAIN_RESULT.copy()
        state["updated_at"] = datetime.now(timezone.utc).isoformat()
        write_json_atomic(run_dir / "status.json", state)
        return load_state(run_dir)
    publication = _validate_publication_result(result)
    return transition(
        run_dir,
        "publishing",
        "published",
        publication=publication,
    )


def resolve_uncertain_publication(run_dir: Path, evidence: dict) -> dict:
    """Archive a previously uncertain submit after read-only LOFTER verification."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if (
        state["state"] != "publishing"
        or state["confirmations"]["submit"] is not True
        or state["publication"] != _UNCERTAIN_RESULT
    ):
        raise ValueError("run is not awaiting uncertain publication resolution")
    required = {
        "lofter_url",
        "observed_title",
        "observed_manifest_sha256",
        "checked_at",
    }
    if type(evidence) is not dict or set(evidence) != required:
        raise ValueError("uncertain publication evidence is incomplete")
    url = _validate_lofter_url(evidence["lofter_url"])
    checked_at = evidence["checked_at"]
    _parse_iso_datetime(checked_at, "checked_at")
    manifest, current_digest = _require_unchanged_manifest(run_dir, state)
    if evidence["observed_title"] != manifest["title"]:
        raise ValueError("observed LOFTER title does not match approved manifest")
    if (
        type(evidence["observed_manifest_sha256"]) is not str
        or evidence["observed_manifest_sha256"] != current_digest
    ):
        raise ValueError("observed LOFTER manifest digest does not match approval")
    publication = {
        "lofter_url": url,
        "published_at": checked_at,
        "resolution": "read_only_verification",
        "manifest_sha256": current_digest,
        "submit_retried": False,
    }
    return transition(
        run_dir,
        "publishing",
        "published",
        publication=publication,
    )


def _validate_safe_error(value: object) -> str:
    if type(value) is not str or not value.strip():
        raise ValueError("safe pause error must be a non-empty string")
    error = value.strip()
    folded = error.casefold()
    if any(marker in folded for marker in _PRIVATE_ERROR_MARKERS) or any(
        ord(character) < 32 for character in error
    ):
        raise ValueError("safe pause error must not contain secret data")
    return error


def pause_before_submit(run_dir: Path, error: str) -> dict:
    """Return to approval only before submit, retaining a non-secret error."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if (
        state["state"] != "publishing"
        or state["confirmations"]["submit"] is not False
        or state["publication"]
    ):
        raise ValueError("safe pause is allowed only before final submit")
    safe_error = _validate_safe_error(error)
    return transition(
        run_dir,
        "publishing",
        "approved",
        errors=[*state["errors"], safe_error],
    )

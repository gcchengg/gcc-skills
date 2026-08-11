"""Validate and transactionally persist a LOFTER draft for local review."""

import json
import os
import re
import shutil
import tempfile
import unicodedata
from datetime import datetime, timezone
from hashlib import sha256
from pathlib import Path, PurePosixPath, PureWindowsPath
from urllib.parse import urlparse

from run_state import load_state, transition, write_json_atomic
from validate_authorizations import (
    ATTRIBUTION_MODES,
    DECISION_FIELDS,
    DECISION_SCHEMA,
    OPERATIONS,
    validate_authorization,
    validate_ledger,
)


PUBLIC_DISCLOSURE = "图像经授权使用，含AI辅助创作｜#AI辅助#"

_DRAFT_FIELDS = {
    "article",
    "titles",
    "tags",
    "media",
    "authorized_media_intent",
    "ai_assistance",
}
_MEDIA_KINDS = {"x_original", "ai_adaptation", "generated_original"}
_MEDIA_ROLES = {"cover", "body"}
_COMMON_MEDIA_FIELDS = {"kind", "role", "local_path", "caption"}
_X_MEDIA_FIELDS = {"source_url", "source_author", "source_media_id"}
_OPTIONAL_X_MEDIA_FIELDS = {"source_post_id", "fetched_at", "sha256"}
_GENERATION_FIELDS = {"generation_lineage"}
_LINEAGE_FIELDS = {"generator", "prompt", "source_media_ids"}
_CONTENT_MODES = {"trend_analysis", "fanfic", "visual_curation"}
_OUTPUT_PARENTS = ("sources", "original-media", "generated-media")
_FILES = {
    "hotspot_analysis": "hotspot-analysis.json",
    "article": "article.md",
    "titles_and_tags": "titles-and-tags.md",
    "publication_order": "publication-order.md",
    "media_ledger": "sources/media-ledger.json",
    "draft_intent": "sources/draft-intent.json",
}

_FILE_URL = re.compile(r"file:(?://)?/", re.IGNORECASE)
_POSIX_PRIVATE_PATH = re.compile(
    r"/(?:Users|home|private|tmp|var(?:/folders)?|etc|root|usr|opt|Applications|Volumes)(?:/|$)",
    re.IGNORECASE,
)
_GENERIC_POSIX_PATH = re.compile(
    r"(?<![\w:/])/(?!/)(?:[A-Za-z0-9._-]+/)+[^\s/`|]+"
)
_WINDOWS_DRIVE_PATH = re.compile(r"(?<![A-Za-z0-9])[A-Za-z]:[\\/]")
_WINDOWS_UNC_PATH = re.compile(r"(?<!:)(?:\\\\|//)[^\\/\s]+[\\/][^\\/\s]+")
_SAFE_SUFFIX = re.compile(r"\.[a-z0-9]{1,10}")


def _non_empty_string(value: object, field: str) -> str:
    if type(value) is not str or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def _contains_forbidden_control(text: str, *, allow_newlines: bool) -> bool:
    for character in text:
        if allow_newlines and character == "\n":
            continue
        if unicodedata.category(character) == "Cc" or character in {
            "\u2028",
            "\u2029",
        }:
            return True
    return False


def _contains_private_path(text: str) -> bool:
    return bool(
        _FILE_URL.search(text)
        or _POSIX_PRIVATE_PATH.search(text)
        or _GENERIC_POSIX_PATH.search(text)
        or _WINDOWS_DRIVE_PATH.search(text)
        or _WINDOWS_UNC_PATH.search(text)
    )


def _validate_rendered_string(
    value: object,
    field: str,
    *,
    delimiters: str = "",
    allow_newlines: bool = False,
    check_private_path: bool = True,
) -> str:
    if type(value) is not str or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    if _contains_forbidden_control(value, allow_newlines=allow_newlines):
        raise ValueError(f"{field} contains control characters")
    text = value.strip()
    if PUBLIC_DISCLOSURE in text:
        raise ValueError(f"{field} contains the reserved disclosure")
    if "evidence_path" in text.casefold():
        raise ValueError(f"{field} leaks private evidence")
    if check_private_path and _contains_private_path(text):
        raise ValueError(f"{field} leaks a private path")
    if delimiters and any(delimiter in text for delimiter in delimiters):
        raise ValueError(f"{field} contains a reserved delimiter")
    return text


def _validate_article(text: object) -> str:
    article = _validate_rendered_string(text, "article", allow_newlines=True)
    count = len("".join(article.split()))
    if not 800 <= count <= 1500:
        raise ValueError("article must contain 800–1500 non-whitespace characters")
    return article


def _validate_unique_strings(
    values: object, field: str, minimum: int, maximum: int
) -> list[str]:
    if type(values) is not list or not minimum <= len(values) <= maximum:
        if minimum == maximum == 3:
            raise ValueError("titles must contain exactly three values")
        raise ValueError(f"{field} must contain {minimum}–{maximum} values")
    if any(type(value) is not str or not value.strip() for value in values):
        raise ValueError(f"{field} must contain unique non-empty values")
    delimiters = "|｜" if field == "titles" else "#＃|｜`"
    result = [
        _validate_rendered_string(value, field, delimiters=delimiters)
        for value in values
    ]
    if field == "tags" and any(
        any(character.isspace() for character in tag) for tag in result
    ):
        raise ValueError("tags contains a reserved delimiter")
    normalized = [value.casefold() for value in result]
    if len(set(normalized)) != len(normalized):
        raise ValueError(f"{field} must contain unique non-empty values")
    return result


def _validate_generation_lineage(value: object, kind: str) -> dict:
    if type(value) is not dict:
        raise ValueError("generation_lineage must be an object")
    unknown = sorted(set(value) - _LINEAGE_FIELDS)
    if unknown:
        raise ValueError(f"unknown generation_lineage field: {unknown[0]}")
    missing = sorted(_LINEAGE_FIELDS - set(value))
    if missing:
        raise ValueError(f"generation_lineage missing field: {missing[0]}")
    generator = _non_empty_string(value["generator"], "generation_lineage generator")
    prompt = _non_empty_string(value["prompt"], "generation_lineage prompt")
    source_media_ids = value["source_media_ids"]
    if type(source_media_ids) is not list or any(
        type(item) is not str or not item.strip() for item in source_media_ids
    ):
        raise ValueError("generation_lineage source_media_ids must be a list of strings")
    source_media_ids = [item.strip() for item in source_media_ids]
    if len(set(source_media_ids)) != len(source_media_ids):
        raise ValueError("generation_lineage source_media_ids must be unique")
    if kind == "generated_original" and source_media_ids:
        raise ValueError(
            "generated_original generation_lineage must use an empty source_media_ids list"
        )
    if kind == "ai_adaptation" and not source_media_ids:
        raise ValueError(
            "ai_adaptation generation_lineage requires non-empty source_media_ids"
        )
    return {
        "generator": generator,
        "prompt": prompt,
        "source_media_ids": source_media_ids,
    }


def _validate_x_url(value: object) -> str:
    source_url = _non_empty_string(value, "source_url")
    if _contains_forbidden_control(source_url, allow_newlines=False):
        raise ValueError("source_url contains control characters")
    try:
        parsed = urlparse(source_url)
        valid = (
            parsed.scheme == "https"
            and (parsed.hostname or "").casefold() == "x.com"
            and parsed.path.startswith("/")
            and parsed.path != "/"
            and parsed.username is None
            and parsed.password is None
            and parsed.port is None
        )
    except ValueError:
        valid = False
    if not valid:
        raise ValueError("source_url must be a valid https://x.com/ URL")
    return source_url


def _is_within(path: Path, root: Path) -> bool:
    try:
        path.relative_to(root)
    except ValueError:
        return False
    return True


def _validate_output_target(root: Path, target: Path) -> None:
    if target.is_symlink():
        raise ValueError(f"output target must not be a symlink: {target.name}")
    if not _is_within(target.parent.resolve(), root):
        raise ValueError("output target must stay inside the run directory")
    if target.exists() and not target.is_file():
        raise ValueError(f"output target must be a regular file: {target.name}")


def _validate_run_layout(run_dir: Path) -> Path:
    requested = Path(run_dir)
    if requested.is_symlink():
        raise ValueError("run directory must not be a symlink")
    try:
        root = requested.resolve(strict=True)
    except OSError as error:
        raise ValueError("run directory does not exist") from error
    if not root.is_dir():
        raise ValueError("run directory must be a directory")
    for name in _OUTPUT_PARENTS:
        parent = root / name
        if parent.is_symlink():
            raise ValueError(f"output parent must not be a symlink: {name}")
        if not parent.is_dir() or parent.resolve() != parent:
            raise ValueError(f"output parent must stay inside the run directory: {name}")
    status_path = root / "status.json"
    if status_path.is_symlink() or not status_path.is_file():
        raise ValueError("status.json must be a regular run-local file")
    _validate_output_target(root, status_path)
    for relative in (
        _FILES["article"],
        _FILES["titles_and_tags"],
        _FILES["publication_order"],
        _FILES["media_ledger"],
        _FILES["draft_intent"],
    ):
        _validate_output_target(root, root / relative)
    return root


def _has_symlink_component(root: Path, relative_path: PurePosixPath) -> bool:
    current = root
    for part in relative_path.parts:
        current = current / part
        if current.is_symlink():
            return True
    return False


def _resolve_local_media(run_dir: Path, value: object) -> tuple[str, Path]:
    local_path = _validate_rendered_string(
        value,
        "media local_path",
        delimiters="|｜",
        check_private_path=False,
    )
    posix_path = PurePosixPath(local_path)
    windows_path = PureWindowsPath(local_path)
    if (
        posix_path.is_absolute()
        or windows_path.is_absolute()
        or windows_path.drive
        or windows_path.root
        or ".." in posix_path.parts
        or ".." in windows_path.parts
        or "\\" in local_path
    ):
        raise ValueError("media local_path must stay inside the run directory")
    parsed = urlparse(local_path)
    if parsed.scheme or parsed.netloc or local_path.startswith("//"):
        raise ValueError("media local_path must not be a remote URL")
    if _has_symlink_component(run_dir, posix_path):
        raise ValueError("media local_path must stay inside the run directory")
    resolved = (run_dir / Path(*posix_path.parts)).resolve()
    if not _is_within(resolved, run_dir) or not resolved.is_file():
        if not _is_within(resolved, run_dir):
            raise ValueError("media local_path must stay inside the run directory")
        raise ValueError(f"media file does not exist: {local_path}")
    return posix_path.as_posix(), resolved


def _canonical_media_path(kind: str, index: int, source_path: Path) -> str:
    suffix = source_path.suffix.casefold()
    if not _SAFE_SUFFIX.fullmatch(suffix):
        suffix = ".bin"
    directory = "original-media" if kind == "x_original" else "generated-media"
    return f"{directory}/{index:02d}{suffix}"


def _allowed_media_fields(kind: str) -> set[str]:
    if kind == "x_original":
        return _COMMON_MEDIA_FIELDS | _X_MEDIA_FIELDS | _OPTIONAL_X_MEDIA_FIELDS
    if kind == "ai_adaptation":
        return (
            _COMMON_MEDIA_FIELDS
            | _X_MEDIA_FIELDS
            | _OPTIONAL_X_MEDIA_FIELDS
            | _GENERATION_FIELDS
        )
    return _COMMON_MEDIA_FIELDS | _GENERATION_FIELDS


def _validate_one_media(run_dir: Path, item: object, index: int) -> tuple[dict, Path]:
    if type(item) is not dict:
        raise ValueError("each media record must be an object")
    kind = item.get("kind")
    if kind not in _MEDIA_KINDS:
        raise ValueError("invalid media kind")
    unknown = sorted(set(item) - _allowed_media_fields(kind))
    if unknown:
        raise ValueError(f"unknown media field: {unknown[0]}")
    missing = sorted(_COMMON_MEDIA_FIELDS - set(item))
    if kind in {"x_original", "ai_adaptation"}:
        missing.extend(sorted(_X_MEDIA_FIELDS - set(item)))
    if kind in {"ai_adaptation", "generated_original"}:
        missing.extend(sorted(_GENERATION_FIELDS - set(item)))
    if missing:
        raise ValueError(f"media record missing field: {missing[0]}")

    role = item["role"]
    if type(role) is not str or role not in _MEDIA_ROLES:
        raise ValueError("media role must be cover or body")
    local_path, source_path = _resolve_local_media(run_dir, item["local_path"])
    caption = _validate_rendered_string(
        item["caption"], "media caption", delimiters="|｜"
    )
    canonical_path = _canonical_media_path(kind, index, Path(local_path))
    _validate_output_target(run_dir, run_dir / canonical_path)

    result = {
        "kind": kind,
        "role": role,
        "local_path": canonical_path,
        "caption": caption,
        "display_id": index,
        "review_status": (
            "pending" if kind in {"x_original", "ai_adaptation"} else "independent"
        ),
    }
    if kind in {"x_original", "ai_adaptation"}:
        result.update(
            {
                "source_url": _validate_x_url(item["source_url"]),
                "source_author": _validate_rendered_string(
                    item["source_author"], "source_author", delimiters="|｜"
                ),
                "source_media_id": _validate_rendered_string(
                    item["source_media_id"], "source_media_id", delimiters="|｜"
                ),
            }
        )
        for field in sorted(_OPTIONAL_X_MEDIA_FIELDS & set(item)):
            result[field] = _validate_rendered_string(
                item[field], field, delimiters="|｜"
            )
    if kind in {"ai_adaptation", "generated_original"}:
        result["generation_lineage"] = _validate_generation_lineage(
            item["generation_lineage"], kind
        )
    return result, source_path


def _validate_media(run_dir: Path, records: object) -> tuple[list[dict], list[Path]]:
    if type(records) is not list or not 1 <= len(records) <= 3:
        raise ValueError("media must contain one to three records")
    validated = [
        _validate_one_media(run_dir, item, index)
        for index, item in enumerate(records, start=1)
    ]
    if sum(item[0]["role"] == "cover" for item in validated) != 1:
        raise ValueError("media must contain exactly one cover")
    return [item[0] for item in validated], [item[1] for item in validated]


def _load_selection(run_dir: Path) -> dict:
    selection_path = run_dir / "hotspot-analysis.json"
    try:
        selection = json.loads(selection_path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ValueError("hotspot-analysis.json is required") from error
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError("hotspot-analysis.json must contain valid JSON") from error
    if type(selection) is not dict:
        raise ValueError("selection result must be an object")
    required = {
        "time_window_hours",
        "candidate",
        "content_mode",
        "selection_reason",
    }
    if not required <= set(selection):
        raise ValueError("selection result is incomplete")
    if type(selection["time_window_hours"]) is not int or selection[
        "time_window_hours"
    ] not in {24, 72}:
        raise ValueError("selection result has an invalid time window")
    candidate = selection["candidate"]
    if (
        type(candidate) is not dict
        or candidate.get("eligible") is not True
        or type(candidate.get("id")) is not str
        or not candidate["id"].strip()
        or type(candidate.get("title")) is not str
        or not candidate["title"].strip()
    ):
        raise ValueError("selection result must contain one eligible candidate")
    if selection["content_mode"] not in _CONTENT_MODES:
        raise ValueError("selection result has an invalid content mode")
    _non_empty_string(selection["selection_reason"], "selection_reason")
    return selection


def _render_titles_and_tags(titles: list[str], tags: list[str]) -> str:
    title_lines = [f"{index}. {title}" for index, title in enumerate(titles, start=1)]
    return "\n".join(
        [
            "# 备选标题",
            "",
            *title_lines,
            "",
            "# 标签",
            "",
            " ".join(f"#{tag}#" for tag in tags),
        ]
    )


def _render_publication_order(media: list[dict]) -> str:
    lines = ["# 发布顺序", ""]
    for item in media:
        role = "封面" if item["role"] == "cover" else "正文图"
        lines.append(
            f"{item['display_id']}. {role}｜{item['local_path']}｜{item['caption']}"
        )
    return "\n".join(lines)


def _validate_payload(payload: object) -> tuple[str, list[str], list[str], bool, bool]:
    if type(payload) is not dict:
        raise ValueError("draft payload must be an object")
    unknown = sorted(set(payload) - _DRAFT_FIELDS)
    if unknown:
        raise ValueError(f"unknown draft field: {unknown[0]}")
    missing = sorted(_DRAFT_FIELDS - set(payload))
    if missing:
        raise ValueError(f"draft payload missing field: {missing[0]}")
    if type(payload["authorized_media_intent"]) is not bool:
        raise ValueError("authorized_media_intent must be a boolean")
    if type(payload["ai_assistance"]) is not bool:
        raise ValueError("ai_assistance must be a boolean")
    return (
        _validate_article(payload["article"]),
        _validate_unique_strings(payload["titles"], "titles", 3, 3),
        _validate_unique_strings(payload["tags"], "tags", 8, 12),
        payload["authorized_media_intent"],
        payload["ai_assistance"],
    )


def _apply_disclosure(article: str, authorized_intent: bool, ai_assistance: bool) -> str:
    if authorized_intent and ai_assistance:
        article = f"{article}\n\n{PUBLIC_DISCLOSURE}"
    count = len("".join(article.split()))
    if not 800 <= count <= 1500:
        raise ValueError("article must contain 800–1500 non-whitespace characters")
    return article


def _stage_text(path: Path, text: str) -> None:
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def _install_staged_file(staged: Path, target: Path) -> None:
    staged.replace(target)


def _rollback_install_set(
    targets: list[Path],
    backups: dict[Path, Path | None],
    status_path: Path,
    status_backup: Path,
) -> None:
    errors = []
    for target in reversed(targets):
        backup = backups[target]
        try:
            if backup is None:
                target.unlink(missing_ok=True)
            else:
                os.replace(backup, target)
        except OSError as error:
            errors.append(error)
    try:
        os.replace(status_backup, status_path)
    except OSError as error:
        errors.append(error)
    if errors:
        raise RuntimeError("failed to roll back draft transaction") from errors[0]


def _commit_install_set(
    run_dir: Path, install_items: list[tuple[Path, Path]], backup_dir: Path, state_update
):
    targets = [target for _, target in install_items]
    backups: dict[Path, Path | None] = {}
    for index, target in enumerate(targets, start=1):
        if target.exists():
            backup = backup_dir / f"target-{index:02d}.bak"
            shutil.copyfile(target, backup)
            backups[target] = backup
        else:
            backups[target] = None
    status_path = run_dir / "status.json"
    status_backup = backup_dir / "status.json"
    shutil.copyfile(status_path, status_backup)
    try:
        for staged, target in install_items:
            _install_staged_file(staged, target)
        return state_update()
    except Exception:
        _rollback_install_set(targets, backups, status_path, status_backup)
        raise


def _transactional_install(
    run_dir: Path,
    article: str,
    titles_and_tags: str,
    publication_order: str,
    media: list[dict],
    media_sources: list[Path],
    selection: dict,
    draft_intent: dict,
) -> dict:
    staging_dir = Path(tempfile.mkdtemp(prefix=".draft-stage-", dir=run_dir))
    try:
        install_dir = staging_dir / "install"
        backup_dir = staging_dir / "backup"
        install_dir.mkdir()
        backup_dir.mkdir()

        staged_article = install_dir / "article.md"
        staged_titles = install_dir / "titles-and-tags.md"
        staged_order = install_dir / "publication-order.md"
        staged_ledger = install_dir / "media-ledger.json"
        staged_intent = install_dir / "draft-intent.json"
        _stage_text(staged_article, article)
        _stage_text(staged_titles, titles_and_tags)
        _stage_text(staged_order, publication_order)
        write_json_atomic(staged_ledger, media)
        write_json_atomic(staged_intent, draft_intent)

        install_items = [
            (staged_article, run_dir / _FILES["article"]),
            (staged_titles, run_dir / _FILES["titles_and_tags"]),
            (staged_order, run_dir / _FILES["publication_order"]),
            (staged_ledger, run_dir / _FILES["media_ledger"]),
            (staged_intent, run_dir / _FILES["draft_intent"]),
        ]
        for index, (record, source_path) in enumerate(
            zip(media, media_sources, strict=True), start=1
        ):
            staged_media = (
                install_dir
                / f"media-{index:02d}{Path(record['local_path']).suffix}"
            )
            shutil.copyfile(source_path, staged_media)
            install_items.append((staged_media, run_dir / record["local_path"]))

        def update_state():
            counts = {
                status: sum(item["review_status"] == status for item in media)
                for status in ("pending", "authorized", "rejected", "independent")
            }
            updates = {
                "content_mode": selection["content_mode"],
                "time_window_hours": selection["time_window_hours"],
                "files": _FILES,
                "media_review": counts,
            }
            if selection["time_window_hours"] == 72:
                updates["window_expansion"] = {
                    "from": 24,
                    "to": 72,
                    "insufficient_24h": True,
                    "reason": "The 24-hour research window lacked sufficient cross-platform evidence.",
                }
            transition(run_dir, "researching", "draft_ready", **updates)
            return transition(run_dir, "draft_ready", "authorization_review")

        return _commit_install_set(run_dir, install_items, backup_dir, update_state)
    finally:
        shutil.rmtree(staging_dir, ignore_errors=True)


def load_media_ledger(run_dir: Path) -> list[dict]:
    """Load the private media ledger and reject malformed review records."""
    run_dir = _validate_run_layout(Path(run_dir))
    ledger_path = run_dir / _FILES["media_ledger"]
    try:
        ledger = json.loads(ledger_path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ValueError("media ledger is required") from error
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError("media ledger must contain valid JSON") from error
    if type(ledger) is not list or not 1 <= len(ledger) <= 3:
        raise ValueError("media ledger must contain one to three records")

    for expected_id, media in enumerate(ledger, start=1):
        if type(media) is not dict:
            raise ValueError("each media ledger record must be an object")
        if type(media.get("display_id")) is not int or media["display_id"] != expected_id:
            raise ValueError("media ledger display_id values must be sequential integers")
        if media.get("kind") not in _MEDIA_KINDS:
            raise ValueError("invalid media kind")
        persisted_fields = _allowed_media_fields(media["kind"]) | {
            "display_id",
            "review_status",
            "authorization",
            "replaces_media_id",
        }
        unknown = sorted(set(media) - persisted_fields)
        if unknown:
            raise ValueError(f"unknown persisted media field: {unknown[0]}")
        if media.get("role") not in _MEDIA_ROLES:
            raise ValueError("media role must be cover or body")
        review_status = media.get("review_status")
        if review_status not in {
            "pending",
            "authorized",
            "rejected",
            "independent",
        }:
            raise ValueError("invalid media review_status")
        expected_statuses = (
            {"pending", "authorized", "rejected"}
            if media["kind"] in {"x_original", "ai_adaptation"}
            else {"independent"}
        )
        if review_status not in expected_statuses:
            raise ValueError("review_status does not match media kind")
        local_path, _ = _resolve_local_media(run_dir, media.get("local_path"))
        expected_parent = (
            "original-media"
            if media["kind"] == "x_original"
            else "generated-media"
        )
        if PurePosixPath(local_path).parts[0] != expected_parent:
            raise ValueError("media local_path does not match media kind")
        _validate_rendered_string(
            media.get("caption"), "media caption", delimiters="|｜"
        )
        if media["kind"] in {"x_original", "ai_adaptation"}:
            _validate_x_url(media.get("source_url"))
            _validate_rendered_string(
                media.get("source_author"), "source_author", delimiters="|｜"
            )
            _validate_rendered_string(
                media.get("source_media_id"), "source_media_id", delimiters="|｜"
            )
        if media["kind"] in {"ai_adaptation", "generated_original"}:
            _validate_generation_lineage(media.get("generation_lineage"), media["kind"])
        authorization = media.get("authorization")
        if review_status == "authorized":
            _validate_persisted_authorization(media, authorization)
        elif authorization is not None:
            raise ValueError("only authorized media may store authorization")
    if sum(media["role"] == "cover" for media in ledger) != 1:
        raise ValueError("media ledger must contain exactly one cover")
    return ledger


def _validate_persisted_authorization(media: dict, authorization: object) -> None:
    if type(authorization) is not dict:
        raise ValueError("authorized media requires a validated authorization")
    missing = sorted(DECISION_FIELDS - set(authorization))
    unknown = sorted(set(authorization) - DECISION_FIELDS)
    if missing or unknown:
        raise ValueError("persisted authorization must use the exact decision schema")
    requested_usage = (
        "original" if media["kind"] == "x_original" else "ai_adaptation"
    )
    provenance = (
        "authorized_original"
        if media["kind"] == "x_original"
        else "authorized_ai_adaptation"
    )
    exact_values = {
        "decision_schema": DECISION_SCHEMA,
        "asset_id": media["source_media_id"],
        "requested_usage": requested_usage,
        "source_url": media["source_url"],
        "author_handle": media["source_author"],
        "platform": "LOFTER",
        "image_provenance": provenance,
        "publication_warning": None,
    }
    if any(authorization[field] != expected for field, expected in exact_values.items()):
        raise ValueError("persisted authorization does not match media provenance")
    if (
        authorization["allowed"] is not True
        or authorization["smoke_only"] is not False
        or authorization["publication_forbidden"] is not False
    ):
        raise ValueError("persisted authorization decision flags are invalid")
    if type(authorization["commercial_intent"]) is not bool:
        raise ValueError("persisted authorization commercial_intent must be a boolean")
    operations = authorization["requested_operations"]
    if (
        type(operations) is not list
        or any(type(operation) is not str or operation not in OPERATIONS for operation in operations)
        or len(set(operations)) != len(operations)
    ):
        raise ValueError("persisted authorization requested_operations are invalid")
    if (
        type(authorization["attribution_mode"]) is not str
        or authorization["attribution_mode"] not in ATTRIBUTION_MODES
    ):
        raise ValueError("persisted authorization attribution_mode is invalid")
    original_asset_id = authorization["original_asset_id"]
    if requested_usage == "original" and original_asset_id is not None:
        raise ValueError("persisted authorization original_asset_id is invalid")
    if requested_usage == "ai_adaptation" and (
        type(original_asset_id) is not str or not original_asset_id.strip()
    ):
        raise ValueError("persisted authorization original_asset_id is invalid")
    if (
        requested_usage == "ai_adaptation"
        and original_asset_id not in media["generation_lineage"]["source_media_ids"]
    ):
        raise ValueError(
            "persisted authorization original_asset_id does not match generation lineage"
        )


def _load_draft_intent(run_dir: Path) -> dict[str, bool]:
    path = run_dir / _FILES["draft_intent"]
    try:
        intent = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise ValueError("draft intent is required") from error
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError("draft intent must contain valid JSON") from error
    if type(intent) is not dict or set(intent) != {
        "authorized_media_intent",
        "ai_assistance",
    }:
        raise ValueError("draft intent must use the exact private schema")
    if any(type(value) is not bool for value in intent.values()):
        raise ValueError("draft intent values must be booleans")
    return intent


def _find_media_with_index(ledger: list[dict], media_id: int) -> tuple[int, dict]:
    if type(media_id) is not int or media_id < 1:
        raise ValueError("media_id must be a positive integer")
    matches = [
        (index, media)
        for index, media in enumerate(ledger)
        if media.get("display_id") == media_id
    ]
    if len(matches) != 1:
        raise ValueError(f"expected one media record for display_id {media_id}")
    return matches[0]


def _find_media(ledger: list[dict], media_id: int) -> dict:
    return _find_media_with_index(ledger, media_id)[1]


def _resolve_authorization_ledger(run_dir: Path, value: object) -> Path:
    ledger_text = _non_empty_string(value, "authorization_ledger_path")
    candidate = Path(ledger_text)
    if not candidate.is_absolute():
        posix_path = PurePosixPath(ledger_text)
        windows_path = PureWindowsPath(ledger_text)
        if (
            windows_path.is_absolute()
            or windows_path.drive
            or windows_path.root
            or ".." in posix_path.parts
            or ".." in windows_path.parts
            or "\\" in ledger_text
        ):
            raise ValueError("authorization_ledger_path must be run-local or absolute")
        candidate = run_dir / Path(*posix_path.parts)
        resolved = candidate.resolve()
        if not _is_within(resolved, run_dir):
            raise ValueError("authorization_ledger_path must stay inside the run directory")
    else:
        resolved = candidate.resolve()
    if candidate.is_symlink() or not resolved.is_file():
        raise ValueError("authorization ledger cannot be read")
    return resolved


def _revalidate_media_decision(
    run_dir: Path, media: dict, authorization: dict
) -> dict:
    if type(authorization) is not dict:
        raise ValueError("authorized media requires a ledger-backed allow decision")
    supplied = authorization.copy()
    try:
        ledger_path = _resolve_authorization_ledger(
            run_dir, supplied.pop("authorization_ledger_path")
        )
        if supplied.get("allowed") is not True:
            raise ValueError("decision is not allowed")
        requested_usage = (
            "original" if media["kind"] == "x_original" else "ai_adaptation"
        )
        if supplied.get("requested_usage") != requested_usage:
            raise ValueError("authorization usage does not match media")
        if supplied.get("asset_id") != media["source_media_id"]:
            raise ValueError("authorization asset_id does not match media")
        if supplied.get("source_url") != media["source_url"]:
            raise ValueError("authorization source_url does not match media")
        if supplied.get("author_handle") != media["source_author"]:
            raise ValueError("authorization author_handle does not match media")
        commercial = supplied.get("commercial_intent")
        operations = supplied.get("requested_operations")
        if type(commercial) is not bool or type(operations) is not list:
            raise ValueError("authorization request scope is malformed")
        records = json.loads(ledger_path.read_text(encoding="utf-8"))
        indexed = validate_ledger(records, evidence_root=ledger_path.parent)
        asset_id = media["source_media_id"]
        if asset_id not in indexed:
            raise ValueError("authorization asset_id is not present in the ledger")
        regenerated = validate_authorization(
            indexed[asset_id],
            requested_usage,
            commercial,
            operations=operations,
            evidence_root=ledger_path.parent,
        )
    except (KeyError, OSError, json.JSONDecodeError, ValueError) as error:
        raise ValueError(
            f"authorized media requires a ledger-backed allow decision: {error}"
        ) from error
    if regenerated != supplied:
        raise ValueError(
            "authorized media requires a ledger-backed allow decision: "
            "decision does not exactly match regenerated ledger output"
        )
    return regenerated


def _review_counts(ledger: list[dict]) -> dict[str, int]:
    return {
        status: sum(media["review_status"] == status for media in ledger)
        for status in ("pending", "authorized", "rejected", "independent")
    }


def _transactional_review_update(
    run_dir: Path,
    staged_values: list[tuple[Path, bytes]],
    expected_state: str,
    target_state: str,
    ledger: list[dict],
) -> dict:
    staging_dir = Path(tempfile.mkdtemp(prefix=".review-stage-", dir=run_dir))
    try:
        install_dir = staging_dir / "install"
        backup_dir = staging_dir / "backup"
        install_dir.mkdir()
        backup_dir.mkdir()
        install_items = []
        for index, (target, content) in enumerate(staged_values, start=1):
            staged = install_dir / f"artifact-{index:02d}"
            staged.write_bytes(content)
            install_items.append((staged, target))

        def update_state():
            return transition(
                run_dir,
                expected_state,
                target_state,
                media_review=_review_counts(ledger),
            )

        return _commit_install_set(run_dir, install_items, backup_dir, update_state)
    finally:
        shutil.rmtree(staging_dir, ignore_errors=True)


def _serialized_json(value: object) -> bytes:
    return (
        json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + "\n"
    ).encode("utf-8")


def _transactional_review_status_update(run_dir: Path, ledger: list[dict]) -> None:
    staging_dir = Path(tempfile.mkdtemp(prefix=".review-stage-", dir=run_dir))
    try:
        backup_dir = staging_dir / "backup"
        backup_dir.mkdir()
        staged_ledger = staging_dir / "media-ledger.json"
        staged_ledger.write_bytes(_serialized_json(ledger))
        ledger_path = run_dir / _FILES["media_ledger"]
        status_path = run_dir / "status.json"
        state = load_state(run_dir)
        state["media_review"] = _review_counts(ledger)
        state["updated_at"] = datetime.now(timezone.utc).isoformat()

        def update_state():
            write_json_atomic(status_path, state)

        _commit_install_set(
            run_dir, [(staged_ledger, ledger_path)], backup_dir, update_state
        )
    finally:
        shutil.rmtree(staging_dir, ignore_errors=True)


def record_media_review(
    run_dir: Path,
    media_id: int,
    authorized: bool,
    authorization: dict | None = None,
) -> dict:
    """Record one human authorization decision without persisting evidence paths."""
    if type(authorized) is not bool:
        raise ValueError("authorized must be a boolean")
    run_dir = _validate_run_layout(Path(run_dir))
    state = load_state(run_dir)
    if state["state"] != "authorization_review":
        raise ValueError("run is not awaiting authorization review")
    ledger = load_media_ledger(run_dir)
    media = _find_media(ledger, media_id)
    if media["review_status"] != "pending":
        raise ValueError("media is not awaiting review")
    if authorized:
        regenerated = _revalidate_media_decision(run_dir, media, authorization)
        media["review_status"] = "authorized"
        media["authorization"] = regenerated
        _transactional_review_status_update(run_dir, ledger)
    else:
        if authorization is not None:
            raise ValueError("rejected media must not include authorization")
        media["review_status"] = "rejected"
        media.pop("authorization", None)
        _transactional_review_update(
            run_dir,
            [(run_dir / _FILES["media_ledger"], _serialized_json(ledger))],
            "authorization_review",
            "revisions_required",
            ledger,
        )
    return media


def _validate_replacement(
    run_dir: Path, media_id: int, current: dict, replacement: object
) -> tuple[dict, Path]:
    if type(replacement) is not dict or replacement.get("kind") != "generated_original":
        raise ValueError("replacement must be generated_original")
    allowed = {"kind", "local_path", "caption", "generation_lineage"}
    unknown = sorted(set(replacement) - allowed)
    if unknown:
        raise ValueError(f"unknown replacement field: {unknown[0]}")
    lineage = replacement.get("generation_lineage")
    if type(lineage) is not dict or lineage.get("source_media_ids") != []:
        raise ValueError("replacement must not derive from rejected source media")
    rejected_identifiers = {
        current[field]
        for field in (
            "local_path",
            "source_url",
            "source_media_id",
            "x_media_id",
            "asset_id",
            "source_author",
            "author_handle",
        )
        if type(current.get(field)) is str and current[field]
    }
    if any(
        identifier in lineage_value
        for lineage_value in _nested_strings(lineage)
        for identifier in rejected_identifiers
    ):
        raise ValueError("generation lineage must not contain rejected media identifiers")
    candidate = {**replacement, "role": current["role"]}
    validated, source_path = _validate_one_media(run_dir, candidate, media_id)
    _, rejected_path = _resolve_local_media(run_dir, current["local_path"])
    if source_path == rejected_path or sha256(source_path.read_bytes()).digest() == sha256(
        rejected_path.read_bytes()
    ).digest():
        raise ValueError("replacement must not reuse rejected media path or bytes")
    return validated, source_path


def _nested_strings(value: object):
    if type(value) is str:
        yield value
    elif type(value) is list:
        for item in value:
            yield from _nested_strings(item)
    elif type(value) is dict:
        for item in value.values():
            yield from _nested_strings(item)


def replace_rejected_media(
    run_dir: Path,
    media_id: int,
    replacement: dict,
    article: str,
    captions: list[str],
) -> list[dict]:
    """Install an independent replacement and rewrite only affected public copy."""
    run_dir = _validate_run_layout(Path(run_dir))
    state = load_state(run_dir)
    if state["state"] != "revisions_required":
        raise ValueError("run is not awaiting rejected-media revisions")
    ledger = load_media_ledger(run_dir)
    index, current = _find_media_with_index(ledger, media_id)
    if current["review_status"] != "rejected":
        raise ValueError("only rejected media can be replaced")
    validated, source_path = _validate_replacement(
        run_dir, media_id, current, replacement
    )
    revised_article = _validate_article(article)
    if type(captions) is not list or len(captions) != len(ledger):
        raise ValueError("captions must contain one value per media record")
    revised_captions = [
        _validate_rendered_string(value, "media caption", delimiters="|｜")
        for value in captions
    ]
    for other_index, media in enumerate(ledger):
        if other_index != index and revised_captions[other_index] != media["caption"]:
            raise ValueError("replacement may change only affected media copy")
    if revised_captions[index] != validated["caption"]:
        raise ValueError("replacement caption must match affected copy")

    ledger[index] = {
        **validated,
        "caption": revised_captions[index],
        "display_id": media_id,
        "role": current["role"],
        "review_status": "independent",
        "replaces_media_id": media_id,
    }
    intent = _load_draft_intent(run_dir)
    has_authorized_media = any(
        media["review_status"] == "authorized" for media in ledger
    )
    has_ai_assistance = intent["ai_assistance"] or any(
        media["kind"] in {"ai_adaptation", "generated_original"}
        for media in ledger
    )
    revised_article = _apply_disclosure(
        revised_article, has_authorized_media, has_ai_assistance
    )
    target_path = run_dir / ledger[index]["local_path"]
    _transactional_review_update(
        run_dir,
        [
            (run_dir / _FILES["article"], (revised_article + "\n").encode("utf-8")),
            (
                run_dir / _FILES["publication_order"],
                (_render_publication_order(ledger) + "\n").encode("utf-8"),
            ),
            (run_dir / _FILES["media_ledger"], _serialized_json(ledger)),
            (target_path, source_path.read_bytes()),
        ],
        "revisions_required",
        "authorization_review",
        ledger,
    )
    return ledger


def build_draft(run_dir: Path, payload: dict) -> dict:
    """Validate untrusted draft input, snapshot media, and enter review atomically."""
    run_dir = _validate_run_layout(Path(run_dir))
    state = load_state(run_dir)
    if state["state"] != "researching":
        raise ValueError(f"expected researching, found {state['state']}")
    selection = _load_selection(run_dir)
    article, titles, tags, authorized_intent, ai_assistance = _validate_payload(
        payload
    )
    media, media_sources = _validate_media(run_dir, payload["media"])
    article = _apply_disclosure(article, authorized_intent, ai_assistance)
    return _transactional_install(
        run_dir,
        article,
        _render_titles_and_tags(titles, tags),
        _render_publication_order(media),
        media,
        media_sources,
        selection,
        {
            "authorized_media_intent": authorized_intent,
            "ai_assistance": ai_assistance,
        },
    )

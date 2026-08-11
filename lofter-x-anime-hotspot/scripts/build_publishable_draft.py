"""Validate and transactionally persist a LOFTER draft for local review."""

import json
import os
import re
import shutil
import tempfile
import unicodedata
from pathlib import Path, PurePosixPath, PureWindowsPath
from urllib.parse import urlparse

from run_state import load_state, transition, write_json_atomic


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


def _transactional_install(
    run_dir: Path,
    article: str,
    titles_and_tags: str,
    publication_order: str,
    media: list[dict],
    media_sources: list[Path],
    selection: dict,
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
        _stage_text(staged_article, article)
        _stage_text(staged_titles, titles_and_tags)
        _stage_text(staged_order, publication_order)
        write_json_atomic(staged_ledger, media)

        install_items = [
            (staged_article, run_dir / _FILES["article"]),
            (staged_titles, run_dir / _FILES["titles_and_tags"]),
            (staged_order, run_dir / _FILES["publication_order"]),
            (staged_ledger, run_dir / _FILES["media_ledger"]),
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
        except Exception:
            _rollback_install_set(targets, backups, status_path, status_backup)
            raise
    finally:
        shutil.rmtree(staging_dir, ignore_errors=True)


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
    )

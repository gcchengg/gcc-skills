import argparse
import json
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse


BOOLEAN_FIELDS = {
    "lofter_redistribution",
    "ai_adaptation",
    "commercial_use",
    "translation",
    "crop",
    "layout",
}
REQUIRED_FIELDS = {
    "asset_id",
    "author_handle",
    "source_url",
    "evidence_path",
    *BOOLEAN_FIELDS,
    "allowed_platforms",
    "attribution_mode",
    "original_asset_id",
    "derived_asset_ids",
    "publication_history",
    "example_only",
}
ATTRIBUTION_MODES = {"public", "anonymous_allowed", "required"}
OPERATIONS = {"translation", "crop", "layout"}
DECISION_SCHEMA = "lofter-media-authorization/v1"
DECISION_FIELDS = {
    "decision_schema",
    "allowed",
    "asset_id",
    "requested_usage",
    "commercial_intent",
    "requested_operations",
    "source_url",
    "author_handle",
    "attribution_mode",
    "platform",
    "original_asset_id",
    "image_provenance",
    "smoke_only",
    "publication_forbidden",
    "publication_warning",
}


def _non_empty_string(value, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def _enum_string(value, field: str, allowed) -> str:
    if not isinstance(value, str):
        raise ValueError(f"{field} must be a string")
    if value not in allowed:
        choices = ", ".join(sorted(allowed))
        raise ValueError(f"invalid {field}; must be one of: {choices}")
    return value


def _https_url(value, field: str, *, lofter: bool = False) -> str:
    _non_empty_string(value, field)
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not host:
        suffix = " LOFTER" if lofter else ""
        raise ValueError(f"{field} must be an HTTPS{suffix} URL")
    if lofter and not (host == "lofter.com" or host.endswith(".lofter.com")):
        raise ValueError(f"{field} must be an HTTPS LOFTER URL")
    return value


def _iso_date_or_datetime(value, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be ISO-8601")
    try:
        if "T" in value:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        else:
            date.fromisoformat(value)
    except ValueError as error:
        raise ValueError(f"{field} must be ISO-8601") from error
    return value


def _string_list(value, field: str) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"{field} must be a list")
    if any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValueError(f"{field} must contain non-empty strings")
    return value


def _validate_evidence_file(evidence_path: Path, evidence_value: str) -> None:
    if evidence_path.is_symlink() or not evidence_path.is_file():
        raise ValueError(f"authorization evidence does not exist: {evidence_value}")
    try:
        content = evidence_path.read_bytes()
    except OSError as error:
        raise ValueError(
            f"authorization evidence cannot be read: {evidence_value}"
        ) from error
    if not content:
        raise ValueError(f"authorization evidence must not be empty: {evidence_value}")


def _validate_record(
    record: dict, evidence_root: Path, *, allow_example_only: bool = False
) -> None:
    if not isinstance(record, dict):
        raise ValueError("authorization record must be an object")
    missing = sorted(REQUIRED_FIELDS - record.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")

    _non_empty_string(record["asset_id"], "asset_id")
    _non_empty_string(record["author_handle"], "author_handle")
    _https_url(record["source_url"], "source_url")
    evidence_value = _non_empty_string(record["evidence_path"], "evidence_path")
    evidence_path = Path(evidence_value)
    if not evidence_path.is_absolute():
        evidence_path = evidence_root / evidence_path
    _validate_evidence_file(evidence_path, evidence_value)

    for field in BOOLEAN_FIELDS:
        if type(record[field]) is not bool:
            raise ValueError(f"{field} must be a boolean")
    if type(record["example_only"]) is not bool:
        raise ValueError("example_only must be a boolean")
    if record["example_only"] is True and not allow_example_only:
        raise ValueError("example-only authorization is forbidden outside smoke mode")

    platforms = _string_list(record["allowed_platforms"], "allowed_platforms")
    if not platforms:
        raise ValueError("allowed_platforms must contain at least one platform")
    _enum_string(record["attribution_mode"], "attribution_mode", ATTRIBUTION_MODES)

    original_asset_id = record["original_asset_id"]
    if original_asset_id is not None:
        if not isinstance(original_asset_id, str) or not original_asset_id.strip():
            raise ValueError(
                "original_asset_id must be null or a non-empty string"
            )
        if original_asset_id == record["asset_id"]:
            raise ValueError("original_asset_id must differ from asset_id")
    derived = _string_list(record["derived_asset_ids"], "derived_asset_ids")
    if len(set(derived)) != len(derived):
        raise ValueError("derived_asset_ids must be unique")
    if record["asset_id"] in derived:
        raise ValueError("derived_asset_ids cannot contain asset_id")

    history = record["publication_history"]
    if not isinstance(history, list):
        raise ValueError("publication_history must be a list")
    for index, publication in enumerate(history):
        if not isinstance(publication, dict):
            raise ValueError(f"publication_history[{index}] must be an object")
        missing_history = sorted({"published_at", "lofter_url"} - publication.keys())
        if missing_history:
            raise ValueError(
                f"publication_history[{index}] missing fields: {', '.join(missing_history)}"
            )
        _iso_date_or_datetime(publication["published_at"], "published_at")
        _https_url(publication["lofter_url"], "lofter_url", lofter=True)


def validate_ledger(
    records: list[dict],
    *,
    evidence_root: Path | str = Path.cwd(),
    allow_example_only: bool = False,
) -> dict[str, dict]:
    if not isinstance(records, list):
        raise ValueError("authorization ledger must be a list")
    root = Path(evidence_root)
    indexed: dict[str, dict] = {}
    for record in records:
        _validate_record(record, root, allow_example_only=allow_example_only)
        asset_id = record["asset_id"]
        if asset_id in indexed:
            raise ValueError(f"duplicate asset_id: {asset_id}")
        indexed[asset_id] = record

    for asset_id, record in indexed.items():
        original_id = record["original_asset_id"]
        if original_id is not None:
            if original_id not in indexed:
                raise ValueError(f"unknown original_asset_id: {original_id}")
            if asset_id not in indexed[original_id]["derived_asset_ids"]:
                raise ValueError(
                    f"original asset {original_id} does not list derived asset {asset_id}"
                )
        for derived_id in record["derived_asset_ids"]:
            if derived_id not in indexed:
                raise ValueError(f"unknown derived_asset_id: {derived_id}")
            if indexed[derived_id]["original_asset_id"] != asset_id:
                raise ValueError(
                    f"derived asset {derived_id} does not reference original asset {asset_id}"
                )
    return indexed


def validate_authorization(
    record: dict,
    usage: str,
    commercial: bool = False,
    *,
    operations: tuple[str, ...] | list[str] = (),
    evidence_root: Path | str = Path.cwd(),
    smoke_only: bool = False,
) -> dict:
    root = Path(evidence_root)
    if type(smoke_only) is not bool:
        raise ValueError("smoke_only must be a boolean")
    _validate_record(record, root, allow_example_only=smoke_only)
    if smoke_only and record["example_only"] is not True:
        raise ValueError("smoke mode requires an example-only authorization record")
    usage = _enum_string(usage, "usage", {"original", "ai_adaptation"})
    if type(commercial) is not bool:
        raise ValueError("commercial must be a boolean")
    if not isinstance(operations, (tuple, list)):
        raise ValueError("operations must be a list or tuple")
    requested_operations = []
    for operation in operations:
        if not isinstance(operation, str):
            raise ValueError("requested operation must be a string")
        if operation not in OPERATIONS:
            raise ValueError(f"unknown requested operation: {operation}")
        if operation in requested_operations:
            raise ValueError(f"duplicate requested operation: {operation}")
        requested_operations.append(operation)

    if "LOFTER" not in record["allowed_platforms"]:
        raise ValueError("LOFTER is not in allowed_platforms")
    if record["lofter_redistribution"] is not True:
        raise ValueError("LOFTER redistribution is not authorized")
    if usage == "original" and record["original_asset_id"] is not None:
        raise ValueError("original usage requires an original asset record")
    if usage == "ai_adaptation" and record["original_asset_id"] is None:
        raise ValueError("ai_adaptation usage requires a derived asset record")
    if usage == "ai_adaptation" and record["ai_adaptation"] is not True:
        raise ValueError("AI adaptation is not authorized")
    if commercial and record["commercial_use"] is not True:
        raise ValueError("commercial use is not authorized")
    for operation in requested_operations:
        if record[operation] is not True:
            raise ValueError(f"{operation} is not authorized")

    return {
        "decision_schema": DECISION_SCHEMA,
        "allowed": True,
        "asset_id": record["asset_id"],
        "requested_usage": usage,
        "commercial_intent": commercial,
        "requested_operations": requested_operations,
        "source_url": record["source_url"],
        "author_handle": record["author_handle"],
        "attribution_mode": record["attribution_mode"],
        "platform": "LOFTER",
        "original_asset_id": record["original_asset_id"],
        "image_provenance": (
            "authorized_original"
            if usage == "original"
            else "authorized_ai_adaptation"
        ),
        "smoke_only": smoke_only,
        "publication_forbidden": smoke_only,
        "publication_warning": (
            "EXAMPLE ONLY — TEST USE ONLY — PUBLICATION FORBIDDEN"
            if smoke_only
            else None
        ),
    }


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate one asset against the complete LOFTER authorization ledger."
    )
    parser.add_argument("ledger", type=Path)
    parser.add_argument("asset_id")
    parser.add_argument("--usage", choices=("original", "ai_adaptation"), required=True)
    parser.add_argument("--commercial", action="store_true")
    parser.add_argument("--smoke-only", action="store_true")
    parser.add_argument(
        "--operation",
        action="append",
        choices=tuple(sorted(OPERATIONS)),
        default=[],
    )
    args = parser.parse_args()
    try:
        records = json.loads(args.ledger.read_text(encoding="utf-8"))
        indexed = validate_ledger(
            records,
            evidence_root=args.ledger.parent,
            allow_example_only=args.smoke_only,
        )
        if args.asset_id not in indexed:
            raise ValueError(f"expected one authorization record for {args.asset_id}")
        result = validate_authorization(
            indexed[args.asset_id],
            args.usage,
            args.commercial,
            operations=args.operation,
            evidence_root=args.ledger.parent,
            smoke_only=args.smoke_only,
        )
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise SystemExit(f"error: {error}") from error
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()

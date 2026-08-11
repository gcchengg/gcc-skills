import argparse
import json
from collections import Counter
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse


PUBLICATION_THRESHOLD = 70
SCORE_LIMITS = {
    "x_growth": 30,
    "lofter_activity": 30,
    "ip_match": 15,
    "authorization": 15,
    "story_potential": 10,
}
IP_SLOT_COUNTS = {"long_term": 2, "rising": 2, "experiment": 1}
INDEPENDENT_PROVENANCE = {
    "human_original",
    "ai_assisted_original",
    "ai_generated_original",
}
IMAGE_PROVENANCE = {
    "authorized_original",
    "authorized_ai_adaptation",
    *INDEPENDENT_PROVENANCE,
}
REQUESTED_USAGE = {"original", "ai_adaptation", "independent"}
TOPIC_FEATURE_FIELDS = {
    "event_signal",
    "relationship_signal",
    "visual_signal",
}
CANDIDATE_FIELDS = {
    "id",
    "title",
    "ip_id",
    "ip_name",
    "ip_slot",
    "characters",
    "tags",
    *SCORE_LIMITS.keys(),
    "x_evidence",
    "lofter_evidence",
    "x_source_urls",
    "observed_at",
    "asset_id",
    "requested_usage",
    "commercial_intent",
    "image_provenance",
    "topic_features",
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
        raise ValueError(f"{field} must be one of: {choices}")
    return value


def _string_list(value, field: str, *, non_empty: bool) -> list[str]:
    if not isinstance(value, list):
        raise ValueError(f"{field} must be a list")
    if non_empty and not value:
        raise ValueError(f"{field} must contain at least one value")
    if any(not isinstance(item, str) or not item.strip() for item in value):
        raise ValueError(f"{field} must contain non-empty strings")
    return value


def _iso_datetime(value, field: str) -> str:
    if not isinstance(value, str) or not value.strip() or "T" not in value:
        raise ValueError(f"{field} must be ISO-8601")
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{field} must be ISO-8601") from error
    return value


def _topic_features(value) -> dict:
    if not isinstance(value, dict):
        raise ValueError("topic_features must be an object")
    missing = sorted(TOPIC_FEATURE_FIELDS - value.keys())
    if missing:
        raise ValueError("topic_features missing fields: " + ", ".join(missing))
    for field in sorted(TOPIC_FEATURE_FIELDS):
        if type(value[field]) is not bool:
            raise ValueError(f"topic_features.{field} must be a boolean")
    return value


def _https_x_url(value, field: str) -> str:
    _non_empty_string(value, field)
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not (host == "x.com" or host.endswith(".x.com")):
        raise ValueError(f"{field} must be an HTTPS X URL")
    return value


def validate_ip_pool(ip_pool: list[dict]) -> dict[str, dict]:
    if not isinstance(ip_pool, list):
        raise ValueError("IP pool must be a list")
    indexed: dict[str, dict] = {}
    names = set()
    counts = Counter()
    for index, entry in enumerate(ip_pool):
        if not isinstance(entry, dict):
            raise ValueError(f"IP pool entry {index} must be an object")
        missing = sorted({"ip_id", "ip_name", "ip_slot"} - entry.keys())
        if missing:
            raise ValueError(f"IP pool entry {index} missing fields: {', '.join(missing)}")
        ip_id = _non_empty_string(entry["ip_id"], "ip_id")
        ip_name = _non_empty_string(entry["ip_name"], "ip_name")
        slot = _enum_string(entry["ip_slot"], "ip_slot", IP_SLOT_COUNTS)
        if ip_id in indexed:
            raise ValueError(f"duplicate ip_id: {ip_id}")
        if ip_name in names:
            raise ValueError(f"duplicate ip_name: {ip_name}")
        indexed[ip_id] = entry
        names.add(ip_name)
        counts[slot] += 1
    count_errors = [
        f"{slot} must contain exactly {expected} IPs"
        for slot, expected in IP_SLOT_COUNTS.items()
        if counts[slot] != expected
    ]
    if count_errors:
        raise ValueError("; ".join(count_errors))
    if len(indexed) != sum(IP_SLOT_COUNTS.values()):
        raise ValueError("IP pool must contain exactly 5 IPs")
    return indexed


def _validate_candidate(candidate: dict, pool: dict[str, dict]) -> None:
    if not isinstance(candidate, dict):
        raise ValueError("candidate must be an object")
    missing = sorted(CANDIDATE_FIELDS - candidate.keys())
    if missing:
        raise ValueError(f"missing fields: {', '.join(missing)}")

    for field in ("id", "title", "ip_id", "ip_name", "x_evidence", "lofter_evidence"):
        _non_empty_string(candidate[field], field)
    _string_list(candidate["characters"], "characters", non_empty=True)
    _string_list(candidate["tags"], "tags", non_empty=False)
    urls = _string_list(candidate["x_source_urls"], "x_source_urls", non_empty=True)
    for index, url in enumerate(urls):
        _https_x_url(url, f"x_source_urls[{index}]")
    _iso_datetime(candidate["observed_at"], "observed_at")
    _topic_features(candidate["topic_features"])

    ip_id = candidate["ip_id"]
    if ip_id not in pool:
        raise ValueError(f"unknown ip_id: {ip_id}")
    pool_entry = pool[ip_id]
    if candidate["ip_name"] != pool_entry["ip_name"]:
        raise ValueError("ip_name does not match IP pool")
    candidate_slot = _enum_string(candidate["ip_slot"], "ip_slot", IP_SLOT_COUNTS)
    if candidate_slot != pool_entry["ip_slot"]:
        raise ValueError("ip_slot does not match IP pool")

    for field, maximum in SCORE_LIMITS.items():
        value = candidate[field]
        if not isinstance(value, int) or isinstance(value, bool):
            raise ValueError(f"{field} must be an integer")
        if not 0 <= value <= maximum:
            raise ValueError(f"{field} must be between 0 and {maximum}")

    if type(candidate["commercial_intent"]) is not bool:
        raise ValueError("commercial_intent must be a boolean")
    usage = _enum_string(
        candidate["requested_usage"], "requested_usage", REQUESTED_USAGE
    )
    provenance = _enum_string(
        candidate["image_provenance"], "image_provenance", IMAGE_PROVENANCE
    )
    asset_id = candidate["asset_id"]
    if asset_id is not None:
        _non_empty_string(asset_id, "asset_id")

    if usage == "independent":
        if asset_id is not None:
            raise ValueError("independent media must use a null asset_id")
        if provenance not in INDEPENDENT_PROVENANCE:
            raise ValueError("independent usage requires independent image provenance")
    elif asset_id is None:
        raise ValueError("authorized media requires a non-empty asset_id")
    elif usage == "original" and provenance != "authorized_original":
        raise ValueError("original usage requires authorized_original provenance")
    elif usage == "ai_adaptation" and provenance != "authorized_ai_adaptation":
        raise ValueError(
            "ai_adaptation usage requires authorized_ai_adaptation provenance"
        )


def score_candidate(candidate: dict, ip_pool: list[dict]) -> dict:
    pool = validate_ip_pool(ip_pool)
    _validate_candidate(candidate, pool)
    total = sum(candidate[field] for field in SCORE_LIMITS)
    return {
        **candidate,
        "total_score": total,
        "eligible": total >= PUBLICATION_THRESHOLD,
        "media_instruction": (
            "create_independent_image"
            if candidate["requested_usage"] == "independent"
            else "use_authorized_media"
        ),
    }


def rank_candidates(candidates: list[dict], ip_pool: list[dict]) -> list[dict]:
    if not isinstance(candidates, list):
        raise ValueError("candidates must be a list")
    pool = validate_ip_pool(ip_pool)
    scored = []
    candidate_ids = set()
    for candidate in candidates:
        _validate_candidate(candidate, pool)
        candidate_id = candidate["id"]
        if candidate_id in candidate_ids:
            raise ValueError(f"duplicate candidate id: {candidate_id}")
        candidate_ids.add(candidate_id)
        total = sum(candidate[field] for field in SCORE_LIMITS)
        scored.append(
            {
                **candidate,
                "total_score": total,
                "eligible": total >= PUBLICATION_THRESHOLD,
                "media_instruction": (
                    "create_independent_image"
                    if candidate["requested_usage"] == "independent"
                    else "use_authorized_media"
                ),
            }
        )
    return sorted(
        (item for item in scored if item["eligible"]),
        key=lambda item: (-item["total_score"], item["id"]),
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Validate and rank LOFTER/X topic candidates."
    )
    parser.add_argument("candidates", type=Path)
    parser.add_argument("--ip-pool", type=Path, required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        candidates = json.loads(args.candidates.read_text(encoding="utf-8"))
        ip_pool = json.loads(args.ip_pool.read_text(encoding="utf-8"))
        result = rank_candidates(candidates, ip_pool)
    except (OSError, json.JSONDecodeError, ValueError) as error:
        raise SystemExit(f"error: {error}") from error
    payload = json.dumps(result, ensure_ascii=False, indent=2) + "\n"
    if args.output:
        args.output.write_text(payload, encoding="utf-8")
    else:
        print(payload, end="")


if __name__ == "__main__":
    main()

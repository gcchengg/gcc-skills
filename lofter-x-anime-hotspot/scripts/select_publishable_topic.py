from datetime import datetime, timedelta
from urllib.parse import urlparse

from score_candidates import rank_candidates


_SOURCE_FIELDS = {"source_url", "published_at", "evidence_summary"}


def _aware_datetime(value: object, field: str) -> datetime:
    if type(value) is not str or "T" not in value:
        raise ValueError(f"{field} timestamp must be timezone-aware ISO-8601")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as error:
        raise ValueError(f"{field} timestamp must be timezone-aware ISO-8601") from error
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError(f"{field} timestamp must be timezone-aware ISO-8601")
    return parsed


def _valid_platform_url(value: object, platform: str) -> str:
    if type(value) is not str or not value.strip():
        raise ValueError(f"{platform} source URL must be HTTPS")
    try:
        parsed = urlparse(value)
        host = (parsed.hostname or "").casefold()
        expected_host = (
            host == "x.com" if platform == "X" else host == "lofter.com" or host.endswith(".lofter.com")
        )
        valid = (
            parsed.scheme == "https"
            and expected_host
            and bool(parsed.path.strip("/"))
            and parsed.username is None
            and parsed.password is None
            and parsed.port is None
        )
    except ValueError:
        valid = False
    if not valid:
        raise ValueError(f"{platform} source URL must use the expected HTTPS host")
    return value


def _validated_sources(
    value: object, platform: str, checked_at: datetime, hours: int
) -> list[dict]:
    if type(value) is not list:
        raise ValueError(f"{platform} sources must be a list")
    result = []
    seen = set()
    for item in value:
        if type(item) is not dict or set(item) != _SOURCE_FIELDS:
            raise ValueError(f"{platform} source must use the exact source schema")
        source_url = _valid_platform_url(item["source_url"], platform)
        published_at = _aware_datetime(item["published_at"], "source published_at")
        if not checked_at - timedelta(hours=hours) <= published_at <= checked_at:
            raise ValueError(f"{platform} source timestamp is outside the {hours}-hour window")
        summary = item["evidence_summary"]
        if type(summary) is not str or not summary.strip():
            raise ValueError(f"{platform} source evidence_summary must be non-empty")
        normalized = source_url.casefold()
        if normalized in seen:
            raise ValueError(f"{platform} source URLs must be distinct")
        seen.add(normalized)
        result.append(
            {
                "source_url": source_url,
                "published_at": item["published_at"],
                "evidence_summary": summary.strip(),
            }
        )
    return result


def _evaluate_window(window: object, hours: int, ip_pool: list[dict]) -> dict:
    if type(window) is not dict:
        raise ValueError(f"{hours}-hour window must be an object")
    checked_at_value = window.get("checked_at")
    checked_at = _aware_datetime(checked_at_value, "checked_at")
    x_sources = _validated_sources(window.get("x_sources"), "X", checked_at, hours)
    lofter_sources = _validated_sources(
        window.get("lofter_sources"), "LOFTER", checked_at, hours
    )
    ranked = rank_candidates(window.get("candidates"), ip_pool)
    counts = {
        "x_sources": len(x_sources),
        "lofter_sources": len(lofter_sources),
        "candidates": len(window.get("candidates") or []),
        "eligible_candidates": len(ranked),
    }
    sufficient = len(x_sources) >= 2 and len(lofter_sources) >= 1 and bool(ranked)
    reason = (
        "sufficient"
        if sufficient
        else (
            "insufficient_cross_platform_sources"
            if len(x_sources) < 2 or len(lofter_sources) < 1
            else "no_eligible_candidate"
        )
    )
    return {
        "checked_at": checked_at_value,
        "x_sources": x_sources,
        "lofter_sources": lofter_sources,
        "ranked": ranked,
        "counts": counts,
        "sufficient": sufficient,
        "reason": reason,
    }


def _content_mode(candidate: dict) -> str:
    features = candidate.get("topic_features")
    if not isinstance(features, dict):
        raise ValueError("topic_features must be an object")
    values = {
        name: features.get(name)
        for name in ("event_signal", "relationship_signal", "visual_signal")
    }
    if any(type(value) is not bool for value in values.values()):
        raise ValueError("topic feature signals must be booleans")
    if values["event_signal"]:
        return "trend_analysis"
    if values["relationship_signal"]:
        return "fanfic"
    if values["visual_signal"]:
        return "visual_curation"
    raise ValueError("topic has no supported content mode")


def _selection(hours: int, evaluated: dict) -> dict:
    winner = evaluated["ranked"][0]
    return {
        "time_window_hours": hours,
        "candidate": winner,
        "content_mode": _content_mode(winner),
        "selection_reason": f"{hours}小时窗口内综合评分最高：{winner['total_score']}/100",
        "x_sources": evaluated["x_sources"],
        "lofter_sources": evaluated["lofter_sources"],
    }


def select_topic(payload: dict) -> dict:
    if type(payload) is not dict or type(payload.get("windows")) is not dict:
        raise ValueError("research payload must contain windows")
    windows = payload["windows"]
    if "24" not in windows:
        raise ValueError("24-hour window is required before 72-hour selection")
    ip_pool = payload["ip_pool"]
    first = _evaluate_window(windows["24"], 24, ip_pool)
    if first["sufficient"]:
        return _selection(24, first)
    if "72" not in windows:
        raise ValueError("no publishable topic in 24-hour or 72-hour window")
    expanded = _evaluate_window(windows["72"], 72, ip_pool)
    if not expanded["sufficient"]:
        raise ValueError("no publishable topic in 24-hour or 72-hour window")
    result = _selection(72, expanded)
    result["window_expansion"] = {
        "from": 24,
        "to": 72,
        "insufficient_24h": True,
        "checked_at": first["checked_at"],
        "reason": first["reason"],
        "counts": first["counts"],
    }
    return result

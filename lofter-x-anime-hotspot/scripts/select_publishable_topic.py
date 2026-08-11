from score_candidates import rank_candidates


def _window_is_sufficient(window: dict, ranked: list[dict]) -> bool:
    return (
        isinstance(window.get("x_sources"), list)
        and len(window["x_sources"]) >= 2
        and isinstance(window.get("lofter_sources"), list)
        and len(window["lofter_sources"]) >= 1
        and bool(ranked)
    )


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


def select_topic(payload: dict) -> dict:
    ip_pool = payload["ip_pool"]
    for hours in (24, 72):
        window = payload.get("windows", {}).get(str(hours))
        if window is None:
            continue
        ranked = rank_candidates(window.get("candidates"), ip_pool)
        if _window_is_sufficient(window, ranked):
            winner = ranked[0]
            return {
                "time_window_hours": hours,
                "candidate": winner,
                "content_mode": _content_mode(winner),
                "selection_reason": (
                    f"{hours}小时窗口内综合评分最高：{winner['total_score']}/100"
                ),
            }
    raise ValueError("no publishable topic in 24-hour or 72-hour window")

import argparse
import json
from datetime import date, datetime
from pathlib import Path
from urllib.parse import urlparse

from score_candidates import score_candidate
from validate_authorizations import (
    ATTRIBUTION_MODES,
    DECISION_SCHEMA,
    validate_authorization,
    validate_ledger,
)


COLUMN_TITLES = {
    "daily_hotspot": "今日热度异动",
    "weekly_trend": "本周二次元趋势",
    "media_curation": "媒体策展",
    "fanfic": "热点脑洞实验室",
}
RESEARCH_FIELDS = {
    "world_verified",
    "characters_verified",
    "relationships_verified",
    "cp_conventions_verified",
    "fandom_risks_verified",
}
AUTHORIZATION_DECISION_FIELDS = {
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
DISCLOSURES = {
    "authorized_original": "",
    "authorized_ai_adaptation": "图像经授权使用，含AI辅助创作｜#AI辅助#",
    "human_original": "",
    "ai_assisted_original": "#AI辅助#",
    "ai_generated_original": "#AI生成#",
}


def _non_empty_string(value, field: str) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"{field} must be a non-empty string")
    return value.strip()


def _enum_string(value, field: str, allowed: set[str]) -> str:
    value = _non_empty_string(value, field)
    if value not in allowed:
        raise ValueError(f"{field} is invalid")
    return value


def _https_url(value, field: str, *, lofter: bool = False) -> str:
    if not isinstance(value, str) or not value.strip():
        if lofter:
            raise ValueError(f"{field} must be an HTTPS LOFTER URL")
        raise ValueError(f"{field} must be an HTTPS URL")
    parsed = urlparse(value)
    host = (parsed.hostname or "").lower()
    if parsed.scheme != "https" or not host:
        if lofter:
            raise ValueError(f"{field} must be an HTTPS LOFTER URL")
        raise ValueError(f"{field} must be an HTTPS URL")
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


def _validated_candidate(candidate: dict, ip_pool: list[dict]) -> dict:
    provided_total = candidate.get("total_score") if isinstance(candidate, dict) else None
    provided_eligible = candidate.get("eligible") if isinstance(candidate, dict) else None
    scored = score_candidate(candidate, ip_pool)
    if provided_total is not None and provided_total != scored["total_score"]:
        raise ValueError("candidate total_score does not match score dimensions")
    if provided_eligible is not None and provided_eligible is not scored["eligible"]:
        raise ValueError("candidate eligible flag does not match score dimensions")
    if not scored["eligible"]:
        raise ValueError("candidate score is below 70")
    return scored


def _validate_authorization_decision(
    candidate: dict,
    decision: dict | None,
    ledger_value,
    base_dir: Path,
    smoke_only: bool,
) -> dict | None:
    if candidate["requested_usage"] == "independent":
        if decision is not None:
            raise ValueError("independent media must not include authorization")
        return None
    if decision is None:
        raise ValueError("validated authorization is required")
    if not isinstance(decision, dict):
        raise ValueError("validated authorization output must be an object")
    missing = sorted(AUTHORIZATION_DECISION_FIELDS - decision.keys())
    if missing:
        raise ValueError(
            "validated authorization output is incomplete: " + ", ".join(missing)
        )
    if decision["decision_schema"] != DECISION_SCHEMA or decision["allowed"] is not True:
        raise ValueError("authorization decision is not a validated allow decision")
    if decision["asset_id"] != candidate["asset_id"]:
        raise ValueError("authorization asset_id does not match candidate")
    _enum_string(
        decision["requested_usage"],
        "authorization requested_usage",
        {"original", "ai_adaptation"},
    )
    if decision["requested_usage"] != candidate["requested_usage"]:
        raise ValueError("authorization usage does not match candidate")
    if type(decision["commercial_intent"]) is not bool:
        raise ValueError("authorization commercial_intent must be a boolean")
    if decision["commercial_intent"] is not candidate["commercial_intent"]:
        raise ValueError("authorization commercial scope does not match candidate")
    _enum_string(decision["image_provenance"], "authorization image_provenance", set(DISCLOSURES))
    if decision["image_provenance"] != candidate["image_provenance"]:
        raise ValueError("authorization provenance does not match candidate")
    if decision["platform"] != "LOFTER":
        raise ValueError("authorization platform must be LOFTER")
    _non_empty_string(decision["author_handle"], "authorization author_handle")
    _https_url(decision["source_url"], "authorization source_url")
    _enum_string(decision["attribution_mode"], "authorization attribution_mode", ATTRIBUTION_MODES)
    if not isinstance(decision["requested_operations"], list):
        raise ValueError("authorization requested_operations must be a list")
    for operation in decision["requested_operations"]:
        _non_empty_string(operation, "authorization requested operation")
    ledger_text = _non_empty_string(
        ledger_value, "authorization_ledger_path"
    )
    ledger_path = Path(ledger_text)
    if not ledger_path.is_absolute():
        ledger_path = base_dir / ledger_path
    try:
        records = json.loads(ledger_path.read_text(encoding="utf-8"))
        indexed = validate_ledger(
            records,
            evidence_root=ledger_path.parent,
            allow_example_only=smoke_only,
        )
        if candidate["asset_id"] not in indexed:
            raise ValueError("authorization asset_id is not present in the ledger")
        validated = validate_authorization(
            indexed[candidate["asset_id"]],
            candidate["requested_usage"],
            candidate["commercial_intent"],
            operations=decision["requested_operations"],
            evidence_root=ledger_path.parent,
            smoke_only=smoke_only,
        )
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError(f"authorization ledger cannot be read: {error}") from error
    if validated != decision:
        raise ValueError("authorization decision does not match validated ledger")
    return decision


def _media_lines(
    candidate: dict,
    decision: dict | None,
    ledger_value,
    base_dir: Path,
    smoke_only: bool,
) -> list[str]:
    validated = _validate_authorization_decision(
        candidate, decision, ledger_value, base_dir, smoke_only
    )
    provenance = candidate["image_provenance"]
    if validated is None:
        lines = [f"媒体来源：独立创作（{provenance}）"]
    elif smoke_only:
        lines = [
            "媒体来源：测试占位素材｜示例授权记录禁止发布"
            f"｜作者：{validated['author_handle']}"
            f"｜来源：{validated['source_url']}"
        ]
    else:
        lines = [
            "媒体来源：已验证授权素材"
            f"｜作者：{validated['author_handle']}"
            f"｜来源：{validated['source_url']}"
            f"｜署名模式：{validated['attribution_mode']}"
        ]
    disclosure = "测试标识：示例授权记录禁止发布" if smoke_only else DISCLOSURES[provenance]
    if disclosure:
        lines.append(disclosure if smoke_only else f"AI披露：{disclosure}")
    return lines


def _candidate_lines(candidate: dict) -> list[str]:
    characters = "、".join(candidate["characters"])
    tags = " ".join(f"#{tag}#" for tag in candidate["tags"])
    sources = "、".join(candidate["x_source_urls"])
    return [
        f"选题：{candidate['title']}",
        f"IP：{candidate['ip_name']}（{candidate['ip_id']}｜{candidate['ip_slot']}）",
        f"角色：{characters}",
        f"标签：{tags}",
        f"总分：{candidate['total_score']}/100",
        f"X依据：{candidate['x_evidence']}",
        f"LOFTER依据：{candidate['lofter_evidence']}",
        f"X来源：{sources}",
        f"观察时间：{candidate['observed_at']}",
    ]


def _daily_packet(payload: dict, ip_pool: list[dict], base_dir: Path) -> list[str]:
    candidate = _validated_candidate(payload.get("candidate"), ip_pool)
    lines = [
        "# 人工审核内容包｜今日热度异动",
        "",
        *_candidate_lines(candidate),
        *_media_lines(
            candidate,
            payload.get("authorization"),
            payload.get("authorization_ledger_path"),
            base_dir,
            payload["smoke_only"],
        ),
        "",
        "## 正文结构要求",
        "",
        "- 目标长度：200–400个中文字符。",
        "- 前100字说明过去24–72小时发生了什么。",
        "- 分别说明X增长信号与LOFTER讨论差异。",
        "- 提供一个可核验的原创判断；仅输出结构要求，不代写公开内容。",
        "- 不添加无关热门标签，不设置强付费截断。",
        "",
        "互动问题：你认为这个热点会继续升温，还是只是短期异动？",
    ]
    return lines


def _authorization_map(decisions) -> dict[str, dict]:
    if decisions is None:
        return {}
    if not isinstance(decisions, list):
        raise ValueError("authorizations must be a list")
    result = {}
    for decision in decisions:
        if not isinstance(decision, dict) or "asset_id" not in decision:
            raise ValueError("each authorization must contain asset_id")
        asset_id = decision["asset_id"]
        if asset_id in result:
            raise ValueError(f"duplicate authorization asset_id: {asset_id}")
        result[asset_id] = decision
    return result


def _weekly_packet(payload: dict, ip_pool: list[dict], base_dir: Path) -> list[str]:
    candidates = payload.get("candidates")
    if not isinstance(candidates, list) or len(candidates) != 5:
        raise ValueError("weekly_trend requires exactly five candidates")
    scored = [_validated_candidate(candidate, ip_pool) for candidate in candidates]
    ids = [candidate["id"] for candidate in scored]
    if len(set(ids)) != 5:
        raise ValueError("weekly_trend candidates must have unique ids")
    expected = sorted(scored, key=lambda item: (-item["total_score"], item["id"]))
    if [item["id"] for item in expected] != ids:
        raise ValueError("weekly_trend candidates must be ranked by score")
    decisions = _authorization_map(payload.get("authorizations"))
    used_assets = set()
    lines = [
        "# 人工审核内容包｜本周二次元趋势",
        "",
        "## 正文结构要求",
        "",
        "- 仅按以下顺序呈现5个热点，不自动生成公开正文。",
        "- 每项保留X信号、LOFTER信号与持续性判断。",
        "- 不添加无关热门标签，不设置强付费截断。",
    ]
    for index, candidate in enumerate(scored, start=1):
        note = candidate.get("sustainability_note")
        if not isinstance(note, str) or not note.strip():
            raise ValueError(
                "weekly candidate sustainability_note must be a non-empty string"
            )
        decision = None
        if candidate["asset_id"] is not None:
            decision = decisions.get(candidate["asset_id"])
            used_assets.add(candidate["asset_id"])
        lines.extend(
            [
                "",
                f"## {index}. {candidate['title']}｜{candidate['total_score']}/100",
                f"IP：{candidate['ip_name']}（{candidate['ip_id']}）",
                f"X信号：{candidate['x_evidence']}",
                f"LOFTER信号：{candidate['lofter_evidence']}",
                f"持续性判断：{note}",
                *_media_lines(
                    candidate,
                    decision,
                    payload.get("authorization_ledger_path"),
                    base_dir,
                    payload["smoke_only"],
                ),
            ]
        )
    unused = set(decisions) - used_assets
    if unused:
        raise ValueError("unused authorization decisions: " + ", ".join(sorted(unused)))
    lines.extend(["", "互动问题：下周你最希望继续追踪以上哪一个热点？"])
    return lines


def _media_packet(payload: dict, ip_pool: list[dict], base_dir: Path) -> list[str]:
    candidate = _validated_candidate(payload.get("candidate"), ip_pool)
    return [
        "# 人工审核内容包｜媒体策展",
        "",
        *_candidate_lines(candidate),
        *_media_lines(
            candidate,
            payload.get("authorization"),
            payload.get("authorization_ledger_path"),
            base_dir,
            payload["smoke_only"],
        ),
        "",
        "## 正文结构要求",
        "",
        "- 仅使用上述已验证授权素材，或明确标注的独立创作素材。",
        "- 核对来源、作者、署名模式、使用方式与商业范围。",
        "- 解释画面与热点的关系；仅输出结构要求，不代写公开内容。",
        "- 不添加无关热门标签，不设置强付费截断。",
        "",
        "互动问题：你更想看这张图的创作过程，还是围绕角色的视觉解读？",
    ]


def _fanfic_qualification(payload: dict) -> str:
    qualification = payload.get("fanfic_qualification")
    if not isinstance(qualification, dict):
        raise ValueError("fanfic_qualification must be an object")
    phase = qualification.get("phase")
    if phase == "weeks_1_2":
        if qualification.get("baseline_policy_selected") is not True:
            raise ValueError("weeks 1-2 baseline policy must be explicitly selected")
        return "资格：第1–2周基线政策已明确选择"
    if phase == "week_3_plus":
        if qualification.get("top_40_percent") is not True:
            raise ValueError("week 3+ fan fiction requires top_40_percent true")
        return "资格：第3周起近14天表现前40%"
    raise ValueError("fanfic qualification phase must be weeks_1_2 or week_3_plus")


def _fanfic_packet(payload: dict, ip_pool: list[dict], base_dir: Path) -> list[str]:
    candidate = _validated_candidate(payload.get("candidate"), ip_pool)
    research = payload.get("research")
    if not isinstance(research, dict) or not all(
        research.get(field) is True for field in RESEARCH_FIELDS
    ):
        raise ValueError("fan fiction research is incomplete")
    observation_url = payload.get("observation_url")
    _https_url(observation_url, "observation_url", lofter=True)
    observation_published_at = payload.get("observation_published_at")
    _iso_date_or_datetime(observation_published_at, "observation_published_at")
    qualification_line = _fanfic_qualification(payload)
    return [
        "# 人工审核内容包｜热点脑洞实验室",
        "",
        *_candidate_lines(candidate),
        *_media_lines(
            candidate,
            payload.get("authorization"),
            payload.get("authorization_ledger_path"),
            base_dir,
            payload["smoke_only"],
        ),
        f"前置观察：{observation_url}",
        f"观察发布日期：{observation_published_at}",
        "研究核验：5/5已通过",
        qualification_line,
        "",
        "## 正文结构要求",
        "",
        "- 目标长度：800–2000个中文字符。",
        "- 前100字建立冲突或悬念，保持核验后的人设、关系与CP惯例。",
        "- 提供完整首篇体验，不设置强付费截断。",
        "- 明确区分官方设定与常见二设；仅输出结构要求，不代写公开内容。",
        "- 使用准确预警与标签，提交人工事实、OOC和拆逆风险审核。",
        "",
        "互动问题：你希望这个故事沿当前分支继续吗？",
    ]


def build_packet(payload: dict, *, base_dir: Path | str = Path.cwd()) -> str:
    if not isinstance(payload, dict):
        raise ValueError("packet input must be an object")
    column = _enum_string(payload.get("column"), "column", set(COLUMN_TITLES))
    smoke_only = payload.get("smoke_only", False)
    if type(smoke_only) is not bool:
        raise ValueError("smoke_only must be a boolean")
    payload = {**payload, "smoke_only": smoke_only}
    ip_pool = payload.get("ip_pool")
    renderers = {
        "daily_hotspot": _daily_packet,
        "weekly_trend": _weekly_packet,
        "media_curation": _media_packet,
        "fanfic": _fanfic_packet,
    }
    lines = renderers[column](payload, ip_pool, Path(base_dir))
    if smoke_only:
        lines[0] = lines[0].replace("# ", "# 仅供测试｜禁止发布｜", 1)
        lines[1:1] = ["", "警告：示例授权记录仅供流程冒烟测试，禁止发布或用于运营。"]
    packet = "\n".join(lines) + "\n"
    question_count = sum(
        line.startswith("互动问题：") for line in packet.splitlines()
    )
    if question_count != 1:
        raise ValueError("packet must contain exactly one interaction question line")
    return packet


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate a column-specific LOFTER human-review packet."
    )
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    try:
        payload = json.loads(args.input.read_text(encoding="utf-8"))
        packet = build_packet(payload, base_dir=args.input.parent)
        args.output.write_text(packet, encoding="utf-8")
    except (OSError, json.JSONDecodeError, ValueError, TypeError) as error:
        raise SystemExit(f"error: {error}") from error


if __name__ == "__main__":
    main()

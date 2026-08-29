import argparse
import json
from pathlib import Path


REQUIRED = {
    "id", "topic", "content_type", "scene_template", "title", "subtitle",
    "visual_nodes", "body_copy", "safety_note", "tags", "source_notes"
}
STRING_FIELDS = {
    "id", "topic", "content_type", "scene_template", "title", "subtitle",
    "body_copy", "safety_note"
}
ALLOWED_TEMPLATES = {
    "time-spiral", "food-arena", "meal-assembly", "contrast-worlds"
}
BANNED = (
    "预防脑梗", "清理血管", "血管垃圾", "降三高", "抗癌食物",
    "治疗便秘", "逆转衰老", "保证有效", "替代药物", "停药"
)


def collect_text(value):
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        return [text for item in value for text in collect_text(item)]
    if isinstance(value, dict):
        return [text for item in value.values() for text in collect_text(item)]
    return []


def validate(packet):
    errors = []
    if not isinstance(packet, dict):
        return ["packet must be a JSON object"]

    missing = sorted(REQUIRED - set(packet))
    if missing:
        errors.append("missing fields: " + ", ".join(missing))
    for field in sorted(STRING_FIELDS):
        if field in packet and not isinstance(packet[field], str):
            errors.append(f"{field} must be a string")
    if packet.get("scene_template") not in ALLOWED_TEMPLATES:
        errors.append("scene_template is not allowed")
    if isinstance(packet.get("title"), str) and len(packet["title"]) > 18:
        errors.append("title must contain at most 18 Chinese characters")
    if isinstance(packet.get("subtitle"), str) and len(packet["subtitle"]) > 30:
        errors.append("subtitle must contain at most 30 Chinese characters")
    nodes = packet.get("visual_nodes", [])
    if not isinstance(nodes, list) or not 3 <= len(nodes) <= 8:
        errors.append("visual_nodes must contain 3 to 8 items")
    elif not all(isinstance(node, str) for node in nodes):
        errors.append("visual_nodes must contain only strings")
    tags = packet.get("tags", [])
    if not isinstance(tags, list) or len(tags) != 10:
        errors.append("tags must contain exactly 10 items")
    elif not all(isinstance(tag, str) for tag in tags):
        errors.append("tags must contain only strings")
    elif len(tags) != len(set(tags)):
        errors.append("tags must be unique")
    sources = packet.get("source_notes", [])
    valid_sources = []
    if not isinstance(sources, list):
        errors.append("source_notes must be a list")
    else:
        valid_sources = [
            source for source in sources
            if isinstance(source, dict)
            and all(
                isinstance(source.get(field), str) and source[field].strip()
                for field in ("label", "url", "checked_at")
            )
        ]
        if len(valid_sources) != len(sources):
            errors.append(
                "source_notes entries must be objects with non-empty label, url, and checked_at"
            )
    if packet.get("content_type") in {"health-list", "myth", "myth-guide"}:
        if len(valid_sources) < 2:
            errors.append("health-sensitive packets require at least two sources")
    all_text = "\n".join(collect_text(packet))
    for term in BANNED:
        if term in all_text:
            errors.append(f"banned health claim: {term}")
    return errors


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("packet", type=Path)
    args = parser.parse_args()
    try:
        packet = json.loads(args.packet.read_text(encoding="utf-8"))
        errors = validate(packet)
    except (OSError, UnicodeError, json.JSONDecodeError) as error:
        errors = [f"invalid packet: {error}"]
    print(json.dumps({"ok": not errors, "errors": errors}, ensure_ascii=False))
    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()

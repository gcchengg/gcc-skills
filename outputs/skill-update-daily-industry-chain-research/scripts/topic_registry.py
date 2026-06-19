#!/usr/bin/env python3
"""Reserve and track non-repeating industry-chain research topics."""

from __future__ import annotations

import argparse
import json
import os
import re
import sys
from datetime import datetime
from pathlib import Path


OUTPUT_ROOT = Path(
    os.environ.get(
        "DAILY_INDUSTRY_CHAIN_OUTPUT_ROOT",
        "/Users/apple/Documents/GitHub/gcc-skills/PPT生成/每日产业链研究",
    )
)
REGISTRY_PATH = OUTPUT_ROOT / "主题记录.json"

TOPIC_POOL = [
    "咖啡产业链", "巧克力产业链", "香水产业链", "羽绒服产业链", "运动鞋产业链",
    "化妆品产业链", "宠物食品产业链", "预制菜产业链", "精酿啤酒产业链", "茶饮产业链",
    "光伏产业链", "风电产业链", "锂电池产业链", "储能产业链", "氢能产业链",
    "工业机器人产业链", "数控机床产业链", "商用飞机产业链", "船舶制造产业链", "工程机械产业链",
    "GPU产业链", "半导体设备产业链", "光模块产业链", "数据中心产业链", "智能手机产业链",
    "卫星互联网产业链", "人形机器人产业链", "智能眼镜产业链", "无人机产业链", "云计算产业链",
    "钻石产业链", "假发产业链", "辣条产业链", "潮玩产业链", "短剧产业链",
    "演唱会产业链", "游戏产业链", "直播电商产业链", "二手奢侈品产业链", "冷链物流产业链",
]


def normalize(topic: str) -> str:
    value = re.sub(r"\s+", "", topic.strip()).lower()
    return re.sub(r"(产业链|行业链|价值链)$", "", value)


def safe_name(topic: str) -> str:
    return re.sub(r'[\\/:*?"<>|]', "-", topic.strip())


def load_registry() -> dict:
    if not REGISTRY_PATH.exists():
        return {"version": 1, "topics": []}
    return json.loads(REGISTRY_PATH.read_text(encoding="utf-8"))


def save_registry(data: dict) -> None:
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    REGISTRY_PATH.write_text(
        json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )


def used_keys(data: dict) -> set[str]:
    keys = {normalize(item["topic"]) for item in data.get("topics", [])}
    if OUTPUT_ROOT.exists():
        for path in OUTPUT_ROOT.iterdir():
            if path.is_dir():
                name = re.sub(r"^\d{8}-", "", path.name)
                keys.add(normalize(name))
    return keys


def unused_topics(data: dict) -> list[str]:
    used = used_keys(data)
    return [topic for topic in TOPIC_POOL if normalize(topic) not in used]


def find_entry(data: dict, topic: str) -> dict | None:
    key = normalize(topic)
    return next((item for item in data.get("topics", []) if normalize(item["topic"]) == key), None)


def start(topic: str | None, allow_repeat: bool) -> None:
    data = load_registry()
    if topic is None:
        available = unused_topics(data)
        if not available:
            raise SystemExit("内置选题池已用完，请扩充 TOPIC_POOL 后重试。")
        topic = available[0]

    if normalize(topic) in used_keys(data) and not allow_repeat:
        entry = find_entry(data, topic)
        detail = f"；状态：{entry['status']}" if entry else ""
        raise SystemExit(f"重复主题：{topic}{detail}")

    now = datetime.now().astimezone()
    output_dir = OUTPUT_ROOT / f"{now:%Y%m%d}-{safe_name(topic)}"
    if output_dir.exists() and allow_repeat:
        output_dir = OUTPUT_ROOT / f"{now:%Y%m%d-%H%M}-{safe_name(topic)}"
    output_dir.mkdir(parents=True, exist_ok=False)

    data.setdefault("topics", []).append(
        {
            "topic": topic,
            "normalized_topic": normalize(topic),
            "status": "reserved",
            "reserved_at": now.isoformat(timespec="seconds"),
            "completed_at": None,
            "file": None,
        }
    )
    save_registry(data)
    print(json.dumps({"topic": topic, "output_dir": str(output_dir)}, ensure_ascii=False))


def complete(topic: str, file_path: str, social_file_path: str) -> None:
    data = load_registry()
    entry = find_entry(data, topic)
    if entry is None:
        raise SystemExit(f"主题未登记：{topic}")
    path = Path(file_path)
    if not path.is_file():
        raise SystemExit(f"底稿文件不存在：{path}")
    social_path = Path(social_file_path)
    if not social_path.is_file():
        raise SystemExit(f"小红书发布文案不存在：{social_path}")
    entry["status"] = "completed"
    entry["completed_at"] = datetime.now().astimezone().isoformat(timespec="seconds")
    entry["file"] = str(path.resolve())
    entry["social_file"] = str(social_path.resolve())
    save_registry(data)
    print(f"已完成：{topic}")


def main() -> None:
    parser = argparse.ArgumentParser()
    sub = parser.add_subparsers(dest="command", required=True)

    start_parser = sub.add_parser("start")
    start_parser.add_argument("--topic")
    start_parser.add_argument("--allow-repeat", action="store_true")

    check_parser = sub.add_parser("check")
    check_parser.add_argument("--topic", required=True)

    suggest_parser = sub.add_parser("suggest")
    suggest_parser.add_argument("--count", type=int, default=1)

    complete_parser = sub.add_parser("complete")
    complete_parser.add_argument("--topic", required=True)
    complete_parser.add_argument("--file", required=True)
    complete_parser.add_argument("--social-file", required=True)

    sub.add_parser("status")
    args = parser.parse_args()
    data = load_registry()

    if args.command == "start":
        start(args.topic, args.allow_repeat)
    elif args.command == "check":
        duplicate = normalize(args.topic) in used_keys(data)
        print("used" if duplicate else "unused")
        sys.exit(1 if duplicate else 0)
    elif args.command == "suggest":
        print("\n".join(unused_topics(data)[: max(args.count, 0)]))
    elif args.command == "complete":
        complete(args.topic, args.file, args.social_file)
    elif args.command == "status":
        topics = data.get("topics", [])
        completed = sum(item.get("status") == "completed" for item in topics)
        reserved = sum(item.get("status") == "reserved" for item in topics)
        print(json.dumps({"completed": completed, "reserved": reserved, "unused_pool": len(unused_topics(data))}, ensure_ascii=False))


if __name__ == "__main__":
    main()

import argparse
import json
from pathlib import Path


COLUMN_TITLES = {
    "daily_hotspot": "今日热度异动",
    "weekly_trend": "本周二次元趋势",
    "fanfic": "热点脑洞实验室",
}
RESEARCH_FIELDS = {
    "world_verified",
    "characters_verified",
    "relationships_verified",
    "cp_conventions_verified",
    "fandom_risks_verified",
}


def build_packet(
    candidate: dict,
    research: dict,
    column: str,
    asset: dict | None = None,
) -> str:
    if column not in COLUMN_TITLES:
        raise ValueError("unknown column")
    if candidate.get("total_score", 0) < 70:
        raise ValueError("candidate score is below 70")
    if column == "fanfic" and not all(
        research.get(field) is True for field in RESEARCH_FIELDS
    ):
        raise ValueError("fan fiction research is incomplete")
    if candidate.get("media_instruction") == "use_authorized_media":
        if not asset or asset.get("allowed") is not True:
            raise ValueError("validated authorization is required")
        media_line = f"授权素材：{asset['source_url']}（{asset['usage']}）"
        footer = "图像经授权使用，含AI辅助创作｜#AI辅助#"
    else:
        media_line = "配图要求：独立创作配图，不输入未授权原图"
        footer = ""
    tags = " ".join(f"#{tag}#" for tag in candidate.get("tags", []))
    characters = "、".join(candidate.get("characters", []))
    sections = [
        f"# {COLUMN_TITLES[column]}",
        "",
        f"选题：{candidate['title']}",
        f"IP：{candidate['ip_name']}",
        f"角色：{characters}",
        f"总分：{candidate['total_score']}/100",
        f"X依据：{candidate['x_evidence']}",
        f"LOFTER依据：{candidate['lofter_evidence']}",
        f"标签：{tags}",
        media_line,
        "",
        "## 正文写作要求",
        "",
        "- 前100字说明热点或设置故事钩子。",
        "- 正文提供明确的信息增量或完整故事体验。",
        "- 不设置强付费截断。",
        "- 不添加无关热门标签。",
        "",
        "互动问题：你更想看这个热点的趋势拆解，还是角色故事？",
    ]
    if footer:
        sections.extend(["", footer])
    return "\n".join(sections) + "\n"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("input", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    payload = json.loads(args.input.read_text(encoding="utf-8"))
    packet = build_packet(
        payload["candidate"],
        payload.get("research", {}),
        payload["column"],
        payload.get("asset"),
    )
    args.output.write_text(packet, encoding="utf-8")


if __name__ == "__main__":
    main()

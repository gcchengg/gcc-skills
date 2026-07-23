from __future__ import annotations

import argparse
import re
import shutil
from pathlib import Path

from project_io import initial_state, save_json


def init_project(root: Path, slug: str) -> Path:
    if not re.fullmatch(r"[a-z0-9][a-z0-9-]*", slug):
        raise ValueError("slug must use lowercase letters, digits, and hyphens")
    project = Path(root) / "videos" / "xiaohang" / slug
    if project.exists():
        raise FileExistsError(f"project already exists: {project}")
    project.mkdir(parents=True)
    for name in ("images", "audio", "hyperframes", "renders", "review"):
        (project / name).mkdir()
    (project / "topic-options.md").write_text(
        "# 五个候选主题\n\n> 等待生成。选择主题前不得创建分镜。\n",
        encoding="utf-8",
    )
    template = Path(__file__).parents[1] / "assets" / "storyboard-template.md"
    if template.is_file():
        shutil.copy2(template, project / "storyboard.md")
    else:
        (project / "storyboard.md").write_text("# 未生成分镜\n", encoding="utf-8")
    save_json(project / "status.json", initial_state())
    return project


def main() -> None:
    parser = argparse.ArgumentParser(description="创建一条小航漫改视频项目")
    parser.add_argument("--root", type=Path, required=True)
    parser.add_argument("--slug", required=True)
    args = parser.parse_args()
    print(init_project(args.root, args.slug))


if __name__ == "__main__":
    main()

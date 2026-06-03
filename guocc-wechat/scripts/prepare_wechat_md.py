#!/usr/bin/env python3
"""Create a WeChat-ready Markdown draft scaffold from folder text sources."""

from __future__ import annotations

import argparse
import datetime as dt
import re
from pathlib import Path


SOURCE_EXTS = {".md", ".markdown", ".txt"}
IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    ".idea",
    ".vscode",
    "__pycache__",
    "node_modules",
    "dist",
    "build",
    ".next",
    ".nuxt",
    "coverage",
}
GENERATED_PREFIX = "微信公众号发布稿"


def read_text(path: Path) -> str:
    for encoding in ("utf-8", "utf-8-sig", "gb18030", "latin-1"):
        try:
            return path.read_text(encoding=encoding)
        except UnicodeDecodeError:
            continue
    return path.read_text(errors="replace")


def should_skip(path: Path, root: Path) -> bool:
    rel_parts = path.relative_to(root).parts
    if any(part.startswith(".") or part in SKIP_DIRS for part in rel_parts[:-1]):
        return True
    if path.name.startswith("."):
        return True
    if path.name.startswith(GENERATED_PREFIX) and path.suffix.lower() in SOURCE_EXTS:
        return True
    return path.suffix.lower() not in SOURCE_EXTS


def discover_sources(root: Path) -> list[Path]:
    files = [p for p in root.rglob("*") if p.is_file() and not should_skip(p, root)]
    return sorted(files, key=lambda p: str(p.relative_to(root)).lower())


def discover_images(root: Path) -> list[Path]:
    images = []
    for path in root.rglob("*"):
        if not path.is_file() or path.suffix.lower() not in IMAGE_EXTS:
            continue
        rel_parts = path.relative_to(root).parts
        if any(part.startswith(".") or part in SKIP_DIRS for part in rel_parts[:-1]):
            continue
        images.append(path)
    return sorted(images, key=lambda p: str(p.relative_to(root)).lower())


def extract_title(path: Path, text: str) -> str:
    fm = re.search(r"(?ms)^---\s*?\n(.*?)\n---\s*?\n", text)
    if fm:
        title_match = re.search(r"(?m)^title:\s*[\"']?(.+?)[\"']?\s*$", fm.group(1))
        if title_match:
            return title_match.group(1).strip()
    h1 = re.search(r"(?m)^#\s+(.+?)\s*$", text)
    if h1:
        return h1.group(1).strip()
    first_line = next((line.strip() for line in text.splitlines() if line.strip()), "")
    if 4 <= len(first_line) <= 80 and not first_line.startswith(("---", "```")):
        return first_line.lstrip("#").strip()
    return path.stem.replace("-", " ").replace("_", " ").strip()


def normalize_body(text: str, title: str, max_chars: int) -> str:
    text = re.sub(r"(?ms)^---\s*?\n.*?\n---\s*?\n", "", text, count=1)
    text = text.replace("\r\n", "\n").replace("\r", "\n").strip()
    first_h1 = re.match(r"(?s)^#\s+(.+?)\s*\n+(.*)$", text)
    if first_h1 and first_h1.group(1).strip() == title:
        text = first_h1.group(2).strip()
    text = re.sub(r"\n{4,}", "\n\n\n", text)
    if len(text) > max_chars:
        return text[:max_chars].rstrip() + "\n\n> 注：此文件内容较长，已截断。请回到源文件补充关键细节。"
    return text


def output_path(root: Path, requested: str, overwrite: bool) -> Path:
    path = Path(requested)
    if not path.is_absolute():
        path = root / path
    if overwrite or not path.exists():
        return path
    stamp = dt.datetime.now().strftime("%Y%m%d-%H%M")
    return path.with_name(f"{path.stem}-{stamp}{path.suffix}")


def build_markdown(root: Path, sources: list[Path], images: list[Path], max_chars: int) -> str:
    now = dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    cover = str(images[0].relative_to(root)) if images else ""
    titles = [extract_title(path, read_text(path)) for path in sources]
    guessed_title = titles[0] if len(titles) == 1 else root.name

    chunks = [
        "---",
        f'title: "{guessed_title}"',
        'author: ""',
        'digest: ""',
        f'cover: "{cover}"',
        f'source_folder: "{root}"',
        'publish_status: "draft"',
        f'generated_at: "{now}"',
        "---",
        "",
        f"# {guessed_title}",
        "",
        "> 开篇导语：请将这里改写成 2-4 句适合微信公众号首屏阅读的导语，说明这篇文章解决什么问题、读者为什么现在要看。",
        "",
        "## 核心要点",
        "",
        "- 请提炼最重要的观点一。",
        "- 请提炼最重要的观点二。",
        "- 请提炼最重要的观点三。",
        "",
        "## 正文素材整理",
        "",
    ]

    for index, path in enumerate(sources, start=1):
        rel = path.relative_to(root)
        text = read_text(path)
        title = extract_title(path, text)
        body = normalize_body(text, title, max_chars)
        chunks.extend(
            [
                f"## {index}. {title}",
                "",
                f"<!-- source: {rel} -->",
                "",
                body,
                "",
            ]
        )

    chunks.extend(
        [
            "## 结尾",
            "",
            "请将这里改写成自然的总结，给读者一个明确收束，也可以加入关注、留言或转发提示。",
            "",
            "<!--",
            "Guocc WeChat source files:",
        ]
    )
    for path in sources:
        chunks.append(f"- {path.relative_to(root)}")
    if images:
        chunks.append("")
        chunks.append("Candidate images:")
        for path in images[:12]:
            chunks.append(f"- {path.relative_to(root)}")
    chunks.append("-->")
    chunks.append("")
    return "\n".join(chunks)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("folder", nargs="?", default=".", help="Folder to scan")
    parser.add_argument("--output", default="微信公众号发布稿.md", help="Output Markdown filename")
    parser.add_argument("--overwrite", action="store_true", help="Overwrite output if it exists")
    parser.add_argument("--max-chars-per-file", type=int, default=20000, help="Maximum source characters per file")
    args = parser.parse_args()

    root = Path(args.folder).expanduser().resolve()
    if not root.exists() or not root.is_dir():
        raise SystemExit(f"Folder not found: {root}")

    sources = discover_sources(root)
    if not sources:
        print(f"No .txt/.md/.markdown source files found in {root}")
        return 2

    images = discover_images(root)
    target = output_path(root, args.output, args.overwrite)
    target.write_text(build_markdown(root, sources, images, args.max_chars_per_file), encoding="utf-8")
    print(f"Wrote {target}")
    print(f"Included {len(sources)} source file(s)")
    if images:
        print(f"Found {len(images)} candidate image(s)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

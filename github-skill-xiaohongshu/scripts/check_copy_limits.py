#!/usr/bin/env python3
"""Validate Xiaohongshu title and publish-body character limits."""

from pathlib import Path
import re
import sys


def fail(message: str) -> None:
    print(f"FAIL: {message}")
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 2:
        fail("usage: check_copy_limits.py <topic-directory>")

    topic = Path(sys.argv[1])
    paste = topic / "发布粘贴版.txt"
    markdown = topic / "小红书文案.md"
    if not paste.is_file() or not markdown.is_file():
        fail("topic directory must contain 发布粘贴版.txt and 小红书文案.md")

    paste_text = paste.read_text(encoding="utf-8").strip()
    lines = paste_text.splitlines()
    if not lines:
        fail("发布粘贴版.txt is empty")
    title = lines[0].strip()
    body = "\n".join(lines[1:]).strip()
    if len(title) > 20:
        fail(f"recommended title is {len(title)} characters; maximum is 20")
    if len(body) > 900:
        fail(f"publish body is {len(body)} characters; maximum is 900")

    md_text = markdown.read_text(encoding="utf-8")
    topic_lines = [line for line in md_text.splitlines() if line.startswith("\\#")]
    if not topic_lines:
        fail("小红书文案.md topic line must start with \\# so Markdown displays it as text")
    if "\\#" in body:
        fail("发布粘贴版.txt topics must use # without a backslash")
    title_block = md_text.split("# 正文", 1)[0]
    candidates = []
    for line in title_block.splitlines():
        value = re.sub(r"^\s*\d+\.\s*", "", line).strip()
        if value and not value.startswith("#"):
            candidates.append(value)
    if len(candidates) < 4:
        fail("小红书文案.md must contain one recommended title and three alternatives")
    for candidate in candidates[:4]:
        if len(candidate) > 20:
            fail(f"title is {len(candidate)} characters: {candidate}")

    print(f"PASS: title {len(title)}/20, body {len(body)}/900, 4 titles checked")


if __name__ == "__main__":
    main()

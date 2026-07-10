from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "02_小红书发布正文.md"
OUT = ROOT / "微信公众号发布稿.md"
UPLOAD_OUT = ROOT / "微信公众号发布稿_上传版.md"
UPLOAD_ASSET_DIR = ROOT / "wechat_upload_assets"


IMAGE_BEFORE_HEADING = {
    "# Codex 动态工作流：让 AI 为每个任务临时搭一套执行系统": [
        "01_封面_Codex动态工作流.png",
        "00_底稿完整内容总览.png",
    ],
    "## 先看几个典型用法": ["04_适合workflow的任务.png"],
    "## 动态工作流到底怎么运行": ["05_workflow运行机制.png"],
    "## 为什么需要动态工作流": ["03_复杂任务压垮单上下文.png"],
    "## 动态工作流和静态工作流有什么不同": ["07_动态vs静态workflow.png"],
    "### 模式一：Classify-and-act": ["08_先分类再行动.png"],
    "### 模式二：Fan-out-and-synthesize": ["09_拆开并行最后合并.png"],
    "### 模式三：Adversarial verification": ["10_生成者和验证者分开.png"],
    "### 模式四：Generate-and-filter": ["11_生成过滤.png"],
    "### 模式五：Tournament": ["12_tournament方案比赛.png"],
    "### 模式六：Loop until done": ["13_循环到真正完成.png"],
    "## 具体怎么用：6 个可以直接照抄的案例": ["16_怎么让Codex用好workflow.png"],
    "## 动态工作流适合哪些场景": ["14_workflow任务地图.png"],
    "## 什么时候不要使用动态工作流": ["15_不是每个任务都需要workflow.png"],
    "### 保存和分享 workflow": ["17_workflow沉淀成资产.png"],
    "## 最后总结": ["18_从AI助手到任务指挥台.png"],
}

IMAGE_AFTER_PARAGRAPH_CONTAINS = {
    "第三类是 goal drift": ["06_单agent三个问题.png"],
    "它不是先做一个万能模板": ["02_不是一个Prompt.png"],
}


def image_markdown(filename: str) -> str:
    path = f"assets/{filename}"
    alt = Path(filename).stem
    return f"![{alt}]({path})"


def extract_article_body(text: str) -> list[str]:
    lines = text.splitlines()
    try:
        start = lines.index("## 正文") + 1
    except ValueError:
        start = 0

    body = lines[start:]
    cleaned = []
    for line in body:
        if line.strip() == "## 标签":
            break
        cleaned.append(line.rstrip())

    while cleaned and not cleaned[0]:
        cleaned.pop(0)
    while cleaned and not cleaned[-1]:
        cleaned.pop()
    return cleaned


def build() -> None:
    source_text = SOURCE.read_text(encoding="utf-8")
    body_lines = extract_article_body(source_text)

    output = [
        "---",
        'title: "Codex 新玩法：让 AI 自己组队干活"',
        'author: "guocc"',
        'digest: "复杂任务别只靠一个上下文硬扛。用动态工作流，让 Codex 为每个任务临时搭一套执行系统。"',
        'cover: "assets/01_封面_Codex动态工作流.png"',
        f'source_folder: "{ROOT}"',
        'publish_status: "draft"',
        "original: true",
        'copyright_status: "original"',
        "comment_enabled: true",
        "only_fans_can_comment: false",
        "---",
        "",
    ]

    for line in body_lines:
        if line in IMAGE_BEFORE_HEADING:
            for filename in IMAGE_BEFORE_HEADING[line]:
                output.extend([image_markdown(filename), ""])

        output.append(line)

        inserted = False
        for marker, filenames in IMAGE_AFTER_PARAGRAPH_CONTAINS.items():
            if marker in line:
                output.append("")
                for filename in filenames:
                    output.extend([image_markdown(filename), ""])
                inserted = True
        if inserted and output[-1] == "":
            continue

    output.extend(
        [
            "",
            "<!--",
            "source: 02_小红书发布正文.md",
            "images: assets/*.png",
            "generated_by: scripts/build_wechat_md.py",
            "-->",
            "",
        ]
    )

    OUT.write_text("\n".join(output), encoding="utf-8")
    print(OUT)


def build_upload_version() -> None:
    import shutil

    UPLOAD_ASSET_DIR.mkdir(exist_ok=True)
    markdown = OUT.read_text(encoding="utf-8")
    image_refs = []
    for line in markdown.splitlines():
        if line.startswith("![") and "](" in line and line.endswith(")"):
            image_refs.append(line.rsplit("(", 1)[1][:-1])

    replacements = {}
    for index, ref in enumerate(dict.fromkeys(image_refs), start=1):
        src = ROOT / ref
        dst_name = f"wechat_img_{index:02d}.png"
        dst = UPLOAD_ASSET_DIR / dst_name
        shutil.copy2(src, dst)
        replacements[ref] = f"wechat_upload_assets/{dst_name}"

    upload_markdown = markdown.replace(
        'cover: "assets/01_封面_Codex动态工作流.png"',
        'cover: "wechat_upload_assets/wechat_img_01.png"',
    )
    for old, new in replacements.items():
        upload_markdown = upload_markdown.replace(f"]({old})", f"]({new})")

    UPLOAD_OUT.write_text(upload_markdown, encoding="utf-8")
    print(UPLOAD_OUT)


if __name__ == "__main__":
    build()
    build_upload_version()

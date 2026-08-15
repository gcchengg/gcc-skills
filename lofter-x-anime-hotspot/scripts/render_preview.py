"""Render a local-only HTML preview of a completed LOFTER draft."""

from html import escape
from pathlib import Path

from build_publishable_draft import load_media_ledger
from run_state import load_state


_STATUS_LABELS = {
    "authorization_review": "等待授权复核，尚不可发布",
    "revisions_required": "需要修订后重新复核，尚不可发布",
    "approved": "已获批准，等待人工发布",
}

_KIND_LABELS = {
    "x_original": "X原图",
    "ai_adaptation": "AI改编图",
    "generated_original": "AI原创图",
}

_TEMPLATE = """<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src 'self'; style-src 'unsafe-inline'">
<title>LOFTER 草稿本地预览</title>
<style>
  :root {{ color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; color: #1f2937; background: #f8fafc; }}
  body {{ margin: 0; }}
  main {{ max-width: 760px; margin: 0 auto; padding: 24px 16px 48px; }}
  section {{ margin: 20px 0; padding: 18px; background: white; border: 1px solid #e5e7eb; border-radius: 12px; }}
  h1 {{ margin: 0 0 8px; font-size: 1.5rem; }}
  h2 {{ margin-top: 0; font-size: 1.1rem; }}
  .status {{ color: #9a3412; font-weight: 700; }}
  .article p {{ line-height: 1.75; white-space: normal; }}
  .media {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }}
  figure {{ margin: 0; }}
  img {{ width: 100%; height: auto; display: block; border-radius: 8px; background: #e5e7eb; }}
  figcaption, .note {{ margin-top: 8px; color: #4b5563; font-size: .9rem; }}
  pre {{ white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; line-height: 1.6; }}
  @media (max-width: 480px) {{ main {{ padding: 16px 12px 32px; }} section {{ padding: 14px; }} }}
</style>
</head>
<body>
<main>
  <section><h1>{topic}</h1><p class="status">{status}</p></section>
  <section><h2>热点依据</h2><pre>{analysis}</pre></section>
  <section class="article"><h2>正文</h2>{article}</section>
  <section><h2>候选标题与标签</h2><pre>{titles_tags}</pre></section>
  <section><h2>配图与发布顺序</h2><div class="media">{media}</div><pre>{order}</pre></section>
</main>
</body>
</html>
"""


def _public_status(state: str) -> str:
    return _STATUS_LABELS[state]


def _markdown_paragraphs(markdown: str) -> str:
    paragraphs = [paragraph for paragraph in markdown.strip().split("\n\n") if paragraph]
    return "\n".join(
        f"<p>{escape(paragraph, quote=True).replace(chr(10), '<br>')}</p>"
        for paragraph in paragraphs
    )


def _media_figure(item: dict) -> str:
    kind = _KIND_LABELS[item["kind"]]
    return (
        "<figure>"
        f'<img src="{escape(item["local_path"], quote=True)}" alt="{escape(item["caption"], quote=True)}">'
        f"<figcaption>第{item['display_id']}张｜{kind}｜{escape(item['caption'])}</figcaption>"
        "</figure>"
    )


def render_preview(run_dir: Path) -> Path:
    """Write and return a self-contained, local-only draft preview."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if state["state"] not in _STATUS_LABELS:
        raise ValueError("preview requires a completed draft")

    article = (run_dir / "article.md").read_text(encoding="utf-8")
    analysis = (run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")
    titles_tags = (run_dir / "titles-and-tags.md").read_text(encoding="utf-8")
    order = (run_dir / "publication-order.md").read_text(encoding="utf-8")
    media_html = "\n".join(_media_figure(item) for item in load_media_ledger(run_dir))
    body = _TEMPLATE.format(
        status=escape(_public_status(state["state"])),
        topic=escape(state["topic"]),
        analysis=escape(analysis),
        media=media_html,
        article=_markdown_paragraphs(article),
        titles_tags=escape(titles_tags),
        order=escape(order),
    )
    target = run_dir / "preview.html"
    if target.is_symlink():
        raise ValueError("preview target must not be a symlink")
    target.write_text(body, encoding="utf-8")
    return target

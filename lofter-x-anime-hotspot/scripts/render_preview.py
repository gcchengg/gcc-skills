"""Render a local-only HTML preview of a completed LOFTER draft."""

import json
from html import escape
from pathlib import Path
from urllib.parse import urlparse

from build_publishable_draft import _validate_rendered_string, load_media_ledger
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


def _public_url(value: object, platform: str) -> str:
    if type(value) is not str:
        raise ValueError("public source URL is invalid")
    parsed = urlparse(value)
    host = (parsed.hostname or "").casefold()
    valid_host = (
        host == "x.com"
        if platform == "x"
        else host == "lofter.com" or host.endswith(".lofter.com")
    )
    if (
        parsed.scheme != "https"
        or not valid_host
        or not parsed.path.strip("/")
        or parsed.username is not None
        or parsed.password is not None
    ):
        raise ValueError("public source URL is invalid")
    return value


def _public_sources(value: object, platform: str) -> list[dict]:
    if value is None:
        return []
    if type(value) is not list:
        raise ValueError("public sources must be a list")
    result = []
    for source in value:
        if type(source) is not dict:
            raise ValueError("public source must be an object")
        public = {"source_url": _public_url(source.get("source_url"), platform)}
        summary = source.get("evidence_summary")
        if summary is not None:
            public["evidence_summary"] = _validate_rendered_string(
                summary, "evidence summary", allow_newlines=True
            )
        result.append(public)
    return result


def _public_analysis(state: dict, analysis: dict) -> dict:
    if type(analysis) is not dict:
        raise ValueError("hotspot analysis must be an object")
    candidate = analysis.get("candidate")
    candidate_title = candidate.get("title") if type(candidate) is dict else state["topic"]
    result = {
        "topic": _validate_rendered_string(candidate_title, "topic"),
        "selection_reason": _validate_rendered_string(
            analysis.get("selection_reason"), "selection_reason", allow_newlines=True
        ),
        "time_window_hours": analysis.get("time_window_hours"),
        "content_mode": analysis.get("content_mode"),
        "x_sources": _public_sources(analysis.get("x_sources"), "x"),
        "lofter_sources": _public_sources(analysis.get("lofter_sources"), "lofter"),
    }
    if type(result["time_window_hours"]) is not int or result["time_window_hours"] not in {24, 72, 168}:
        raise ValueError("hotspot analysis has an invalid time window")
    if result["content_mode"] not in {"trend_analysis", "fanfic", "visual_curation"}:
        raise ValueError("hotspot analysis has an invalid content mode")
    return result


def build_preview_html(
    state: dict,
    analysis: dict,
    article: str,
    titles_tags: str,
    order: str,
    ledger: list[dict],
) -> str:
    """Build preview bytes from explicit validated artifacts."""
    public_analysis = json.dumps(
        _public_analysis(state, analysis), ensure_ascii=False, indent=2, allow_nan=False
    )
    media_html = "\n".join(_media_figure(item) for item in ledger)
    return _TEMPLATE.format(
        status=escape(_public_status(state["state"])),
        topic=escape(state["topic"]),
        analysis=escape(public_analysis),
        media=media_html,
        article=_markdown_paragraphs(article),
        titles_tags=escape(titles_tags),
        order=escape(order),
    )


def render_preview(run_dir: Path) -> Path:
    """Write and return a self-contained, local-only draft preview."""
    run_dir = Path(run_dir)
    state = load_state(run_dir)
    if state["state"] not in _STATUS_LABELS:
        raise ValueError("preview requires a completed draft")

    article = (run_dir / "article.md").read_text(encoding="utf-8")
    try:
        analysis = json.loads(
            (run_dir / "hotspot-analysis.json").read_text(encoding="utf-8")
        )
    except (OSError, json.JSONDecodeError) as error:
        raise ValueError("hotspot analysis must contain valid JSON") from error
    titles_tags = (run_dir / "titles-and-tags.md").read_text(encoding="utf-8")
    order = (run_dir / "publication-order.md").read_text(encoding="utf-8")
    body = build_preview_html(
        state,
        analysis,
        article,
        titles_tags,
        order,
        load_media_ledger(run_dir),
    )
    target = run_dir / "preview.html"
    if target.is_symlink():
        raise ValueError("preview target must not be a symlink")
    target.write_text(body, encoding="utf-8")
    return target

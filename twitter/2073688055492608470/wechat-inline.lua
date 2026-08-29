local function append_style(el, value)
  el.attributes = el.attributes or {}
  local current = el.attributes.style or ""
  if current ~= "" and not current:match(";%s*$") then current = current .. ";" end
  el.attributes.style = current .. value
  return el
end

function Header(el)
  if el.level == 2 then
    return append_style(el, "margin:36px 0 18px;padding:11px 14px;border-left:5px solid #12b8a6;background:#f0fbf9;color:#0b2b4b;font-size:22px;line-height:1.45;font-weight:700;border-radius:4px;")
  elseif el.level == 3 then
    return append_style(el, "margin:28px 0 12px;color:#087f73;font-size:18px;line-height:1.55;font-weight:700;")
  end
  return el
end

function Para(el)
  return pandoc.Div({el}, pandoc.Attr("", {}, {style="margin:0 0 16px;color:#273444;font-size:16px;line-height:1.9;letter-spacing:0.02em;text-align:justify;"}))
end

function BulletList(el)
  return pandoc.Div({el}, pandoc.Attr("", {}, {style="margin:8px 0 20px;padding-left:22px;color:#273444;font-size:16px;line-height:1.85;"}))
end

function OrderedList(el)
  return pandoc.Div({el}, pandoc.Attr("", {}, {style="margin:8px 0 20px;padding-left:22px;color:#273444;font-size:16px;line-height:1.85;"}))
end

function BlockQuote(el)
  return pandoc.Div(el.content, pandoc.Attr("", {}, {style="margin:22px 0;padding:16px 18px;border-left:4px solid #14b8a6;background:#f5fafb;color:#365263;font-size:16px;line-height:1.8;border-radius:4px;"}))
end

function CodeBlock(el)
  return append_style(el, "margin:14px 0 22px;padding:16px 18px;background:#f5f7fa;border:1px solid #e3e8ef;border-radius:8px;color:#294055;font-size:14px;line-height:1.75;white-space:pre-wrap;word-break:break-word;")
end

function Image(el)
  return append_style(el, "display:block;max-width:100%;height:auto;margin:22px auto;border-radius:8px;")
end

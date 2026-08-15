local removed = false

function Header(el)
  if not removed and el.level == 1 then
    removed = true
    return {}
  end
  return el
end

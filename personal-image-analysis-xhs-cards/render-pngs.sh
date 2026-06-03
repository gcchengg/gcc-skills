#!/bin/zsh
set -e

ROOT="/Users/apple/Documents/skills/personal-image-analysis-xhs-cards"
CHROME="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

mkdir -p "$ROOT/png"

for name in 01-cover 02-formula 03-makeup 04-hairstyle 05-color 06-style 07-copy; do
  "$CHROME" --headless --disable-gpu --hide-scrollbars --window-size=1080,1440 \
    --screenshot="$ROOT/png/$name.png" \
    "file://$ROOT/$name.svg"
done

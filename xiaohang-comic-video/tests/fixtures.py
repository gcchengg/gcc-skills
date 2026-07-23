from __future__ import annotations

import json
import struct
import wave
from pathlib import Path


def write_silence_wav(path: Path, seconds: float, rate: int = 16000) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    frames = int(seconds * rate)
    with wave.open(str(path), "wb") as handle:
        handle.setnchannels(1); handle.setsampwidth(2); handle.setframerate(rate)
        handle.writeframes(struct.pack("<h", 1) * frames)
    return path


def storyboard_text(count: int = 6, subtitle2: bool = True) -> str:
    blocks = ["# 测试分镜\n"]
    motions = ["slow-push-in", "slow-pull-out", "pan-left", "pan-right", "parallax", "slow-push-in"]
    for i in range(1, count + 1):
        sid = f"{i:02d}"
        second = "- Subtitle 2: 催我读书\n" if subtitle2 else ""
        blocks.append(f'''## Scene {sid}
- Role: 第{i}幕
- Narration: 我记得爸爸那天没有说话。
- Subtitle 1: 我记得爸爸那天
{second}- Target seconds: 3.5
- Audio: audio/scene-{sid}.mp3
- Motion: {motions[(i - 1) % len(motions)]}

### Visual
小航在家里看着爸爸留下的旧手套。

### Prompt
原创复古中国儿童漫画，无文字，竖屏构图。

### Image Review
- Source:
- Preview:
- Approved: no

''')
    return "".join(blocks)


def write_storyboard(path: Path, count: int = 6) -> Path:
    path.write_text(storyboard_text(count), encoding="utf-8")
    return path

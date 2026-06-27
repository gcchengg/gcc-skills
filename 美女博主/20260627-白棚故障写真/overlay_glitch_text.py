from pathlib import Path
import random

from PIL import Image, ImageDraw, ImageFont, ImageFilter


ROOT = Path(__file__).resolve().parent
IMG_DIR = ROOT / "images"

FONT_SERIF = "/System/Library/Fonts/Supplemental/Didot.ttc"
FONT_SANS = "/System/Library/Fonts/HelveticaNeue.ttc"
FONT_MONO = "/System/Library/Fonts/Menlo.ttc"

POSTERS = [
    {
        "base": "01-signal-doll-base.png",
        "out": "01-signal-doll.png",
        "title": "SIGNAL DOLL",
        "small": "The skin remembers what the screen forgets.",
        "pos": "top",
    },
    {
        "base": "02-silent-cache-base.png",
        "out": "02-silent-cache.png",
        "title": "SILENT CACHE",
        "small": "A quiet file saved beneath the flash.",
        "pos": "right",
    },
    {
        "base": "03-noise-bloom-base.png",
        "out": "03-noise-bloom.png",
        "title": "NOISE BLOOM",
        "small": "Soft errors open like white flowers.",
        "pos": "top",
    },
    {
        "base": "04-frame-lag-base.png",
        "out": "04-frame-lag.png",
        "title": "FRAME LAG",
        "small": "The image arrives half a heartbeat late.",
        "pos": "left",
    },
    {
        "base": "05-soft-crash-base.png",
        "out": "05-soft-crash.png",
        "title": "SOFT CRASH",
        "small": "Elegance fails slowly, then becomes signal.",
        "pos": "top",
    },
    {
        "base": "06-zero-touch-base.png",
        "out": "06-zero-touch.png",
        "title": "ZERO TOUCH",
        "small": "Every close-up is a system of breath.",
        "pos": "bottom",
    },
]


def fit_font(text, font_path, max_width, start_size, min_size=28):
    for size in range(start_size, min_size - 1, -2):
        font = ImageFont.truetype(font_path, size)
        box = ImageDraw.Draw(Image.new("RGB", (10, 10))).textbbox((0, 0), text, font=font)
        if box[2] - box[0] <= max_width:
            return font
    return ImageFont.truetype(font_path, min_size)


def draw_glitch_text(draw, xy, text, font, fill, anchor="la"):
    x, y = xy
    for dx, dy, color in [(-4, 0, (0, 210, 255, 105)), (4, 1, (255, 35, 95, 105))]:
        draw.text((x + dx, y + dy), text, font=font, fill=color, anchor=anchor)
    draw.text((x, y), text, font=font, fill=fill, anchor=anchor)
    for _ in range(7):
        if random.random() < 0.75:
            yy = y + random.randint(-8, 28)
            draw.rectangle((x + random.randint(-12, 18), yy, x + random.randint(160, 360), yy + 2), fill=(0, 0, 0, 70))


def add_scanlines(img):
    overlay = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(overlay)
    w, h = img.size
    for y in range(0, h, 7):
        d.line((0, y, w, y), fill=(0, 0, 0, 14), width=1)
    for _ in range(65):
        x = random.randint(0, w - 1)
        y = random.randint(0, h - 1)
        d.rectangle((x, y, x + random.randint(1, 5), y + 1), fill=(0, 0, 0, random.randint(12, 38)))
    return Image.alpha_composite(img, overlay)


def main():
    random.seed(27)
    for item in POSTERS:
        img = Image.open(IMG_DIR / item["base"]).convert("RGBA")
        w, h = img.size
        img = add_scanlines(img)
        layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
        d = ImageDraw.Draw(layer)

        title_font = fit_font(item["title"], FONT_SERIF, int(w * 0.82), int(w * 0.105), 44)
        small_font = fit_font(item["small"], FONT_SANS, int(w * 0.68), int(w * 0.026), 18)
        code_font = ImageFont.truetype(FONT_MONO, max(14, int(w * 0.014)))
        micro_font = ImageFont.truetype(FONT_MONO, max(11, int(w * 0.011)))

        margin = int(w * 0.065)
        title_fill = (18, 18, 18, 218)
        small_fill = (18, 18, 18, 178)

        if item["pos"] == "top":
            tx, ty = margin, int(h * 0.075)
            anchor = "la"
            sx, sy = margin + 4, ty + int(w * 0.09)
        elif item["pos"] == "right":
            tx, ty = int(w * 0.48), int(h * 0.095)
            anchor = "la"
            sx, sy = tx + 4, ty + int(w * 0.09)
        elif item["pos"] == "left":
            tx, ty = margin, int(h * 0.09)
            anchor = "la"
            sx, sy = margin + 4, ty + int(w * 0.09)
        else:
            tx, ty = margin, int(h * 0.835)
            anchor = "la"
            sx, sy = margin + 4, ty + int(w * 0.085)

        draw_glitch_text(d, (tx, ty), item["title"], title_font, title_fill, anchor=anchor)
        d.text((sx - 3, sy), item["small"], font=small_font, fill=(0, 215, 255, 72))
        d.text((sx + 3, sy + 1), item["small"], font=small_font, fill=(255, 36, 95, 72))
        d.text((sx, sy), item["small"], font=small_font, fill=small_fill)

        code_lines = [
            "STUDIO//WHITE_SET",
            "NO BRAND MARKS",
            "RGB DRIFT 03.7",
            "FICTIVE RECEIPT FIELD",
        ]
        y0 = int(h * 0.91)
        for idx, line in enumerate(code_lines):
            d.text((margin, y0 + idx * int(w * 0.022)), line, font=micro_font, fill=(0, 0, 0, 112))

        d.line((margin, y0 - 12, int(w * 0.42), y0 - 12), fill=(0, 0, 0, 95), width=2)
        for i in range(4):
            yy = int(h * (0.16 + i * 0.17))
            d.text((w - margin - 120, yy), f"CH-{i + 1:02d}//OFFSET", font=code_font, fill=(0, 0, 0, 82))

        layer = layer.filter(ImageFilter.GaussianBlur(0.12))
        final = Image.alpha_composite(img, layer).convert("RGB")
        final.save(IMG_DIR / item["out"], quality=96)


if __name__ == "__main__":
    main()

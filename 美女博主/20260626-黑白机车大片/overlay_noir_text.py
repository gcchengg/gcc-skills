from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path("/Users/apple/Documents/GitHub/gcc-skills/美女博主/20260626-黑白机车大片/images")
TITLE_FONT = "/System/Library/Fonts/Supplemental/Didot.ttc"
SUB_FONT = "/System/Library/Fonts/Supplemental/Times New Roman Italic.ttf"


POSTERS = [
    {
        "src": "01-midnight-thunder-base.png",
        "dst": "01-midnight-thunder.png",
        "title": "MIDNIGHT THUNDER",
        "sub": "she never looked back",
        "xy": (0.065, 0.07),
        "align": "left",
    },
    {
        "src": "02-black-static-base.png",
        "dst": "02-black-static.png",
        "title": "BLACK STATIC",
        "sub": "the silence said enough",
        "xy": (0.07, 0.805),
        "align": "left",
    },
    {
        "src": "03-unspoken-base.png",
        "dst": "03-unspoken.png",
        "title": "UNSPOKEN",
        "sub": "some secrets breathe in the dark",
        "xy": (0.07, 0.07),
        "align": "left",
    },
    {
        "src": "04-wild-velocity-base.png",
        "dst": "04-wild-velocity.png",
        "title": "WILD VELOCITY",
        "sub": "born from salt and storm",
        "xy": (0.06, 0.07),
        "align": "left",
    },
    {
        "src": "05-afterglow-base.png",
        "dst": "05-afterglow.png",
        "title": "AFTERGLOW",
        "sub": "she rides where the light breaks",
        "xy": (0.07, 0.08),
        "align": "left",
    },
]


def text_width(draw, text, font, tracking):
    width = 0
    for index, char in enumerate(text):
        box = draw.textbbox((0, 0), char, font=font)
        width += box[2] - box[0]
        if index < len(text) - 1:
            width += tracking
    return width


def draw_tracked(draw, xy, text, font, tracking, fill, shadow=True):
    x, y = xy
    if shadow:
        sx = x + 2
        for char in text:
            draw.text((sx, y + 2), char, font=font, fill=(0, 0, 0, 95))
            box = draw.textbbox((0, 0), char, font=font)
            sx += box[2] - box[0] + tracking
    for char in text:
        draw.text((x, y), char, font=font, fill=fill)
        box = draw.textbbox((0, 0), char, font=font)
        x += box[2] - box[0] + tracking


def fit_title(draw, title, image_width):
    size = int(image_width * 0.078)
    tracking = max(3, int(image_width * 0.005))
    while size > 34:
        font = ImageFont.truetype(TITLE_FONT, size=size)
        if text_width(draw, title, font, tracking) <= image_width * 0.86:
            return font, tracking
        size -= 2
    return ImageFont.truetype(TITLE_FONT, size=size), tracking


def main():
    for poster in POSTERS:
        image = Image.open(ROOT / poster["src"]).convert("RGBA")
        width, height = image.size
        overlay = Image.new("RGBA", image.size, (0, 0, 0, 0))
        draw = ImageDraw.Draw(overlay)

        title_font, tracking = fit_title(draw, poster["title"], width)
        sub_font = ImageFont.truetype(SUB_FONT, size=max(26, int(width * 0.034)))
        x = int(width * poster["xy"][0])
        y = int(height * poster["xy"][1])

        title_fill = (232, 232, 226, 178)
        sub_fill = (232, 232, 226, 172)
        draw_tracked(draw, (x, y), poster["title"], title_font, tracking, title_fill)
        title_box_h = draw.textbbox((0, 0), "H", font=title_font)[3]
        sub_xy = (x + 3, y + title_box_h + int(height * 0.012))
        draw.text((sub_xy[0] + 2, sub_xy[1] + 2), poster["sub"], font=sub_font, fill=(0, 0, 0, 120))
        draw.text(sub_xy, poster["sub"], font=sub_font, fill=sub_fill)

        composed = Image.alpha_composite(image, overlay).convert("RGB")
        composed.save(ROOT / poster["dst"], quality=96)


if __name__ == "__main__":
    main()

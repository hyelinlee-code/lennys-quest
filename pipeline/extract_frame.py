"""Extract a reusable house frame from an existing card: hollow out the oval
portrait window (transparent, feathered edge) so interiors can be composited behind.

Usage:
  python pipeline/extract_frame.py --debug   # draw ellipse outlines on source cards
  python pipeline/extract_frame.py           # write pipeline/frames/<house>.png
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "public" / "cards"
FRAMES = ROOT / "pipeline" / "frames"
DEBUG_DIR = Path(
    r"C:\Users\hyeli\AppData\Local\Temp\claude"
    r"\C--Users-hyeli-CodingProject-Lennys-final"
    r"\a8b36ffa-fc77-451d-b3cc-b8e348f45d8f\scratchpad\frame-debug"
)

# source card + oval window ellipse (fractions of width/height): cx, cy, rx, ry
# slight overshoot beyond the ring's inner edge: leftover template art inside the
# window is worse than shaving a sliver of ring (feather + dark interior edges blend it)
TEMPLATES = {
    "founder": ("brian-chesky.png", 0.500, 0.465, 0.370, 0.320),
    "investor": ("sarah-tavel.png", 0.500, 0.465, 0.365, 0.320),
    "operator": ("marty-cagan.png", 0.500, 0.465, 0.365, 0.330),
}
FEATHER = 6  # px blur on the mask edge so the composite blends under the frame lip


def ellipse_box(w, h, cx, cy, rx, ry):
    return [w * (cx - rx), h * (cy - ry), w * (cx + rx), h * (cy + ry)]


def main():
    debug = "--debug" in sys.argv
    (DEBUG_DIR if debug else FRAMES).mkdir(parents=True, exist_ok=True)
    for house, (src, cx, cy, rx, ry) in TEMPLATES.items():
        im = Image.open(CARDS / src).convert("RGBA")
        w, h = im.size
        box = ellipse_box(w, h, cx, cy, rx, ry)
        if debug:
            d = ImageDraw.Draw(im)
            d.ellipse(box, outline=(255, 60, 60, 255), width=6)
            im.convert("RGB").save(DEBUG_DIR / f"{house}.jpg")
            print(f"{house}: debug -> {DEBUG_DIR / (house + '.jpg')}")
        else:
            # alpha mask: opaque frame, transparent (0) inside the oval, feathered
            mask = Image.new("L", (w, h), 255)
            ImageDraw.Draw(mask).ellipse(box, fill=0)
            mask = mask.filter(ImageFilter.GaussianBlur(FEATHER))
            im.putalpha(mask)
            out = FRAMES / f"{house}.png"
            im.save(out)
            print(f"{house}: frame -> {out}")


if __name__ == "__main__":
    main()

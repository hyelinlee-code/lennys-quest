"""Composite an interior portrait behind a house frame -> final card PNG.

Usage: python pipeline/compose_card.py <slug> <house> [interior_path]
  interior defaults to pipeline/interiors/<slug>.png
Output: public/cards/<slug>.png (1024x1536)
"""
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
FRAMES = ROOT / "pipeline" / "frames"
INTERIORS = ROOT / "pipeline" / "interiors"
CARDS = ROOT / "public" / "cards"

# must match extract_frame.py TEMPLATES (cx, cy, rx, ry as fractions)
ELLIPSES = {
    "founder": (0.500, 0.465, 0.370, 0.320),
    "investor": (0.500, 0.465, 0.365, 0.320),
    "operator": (0.500, 0.465, 0.365, 0.330),
}


def compose(slug, house, interior_path=None):
    frame = Image.open(FRAMES / f"{house}.png").convert("RGBA")
    w, h = frame.size
    interior = Image.open(interior_path or INTERIORS / f"{slug}.png").convert("RGB")

    cx, cy, rx, ry = ELLIPSES[house]
    # cover-fit the interior to the ellipse bounding box (+ margin so the feathered
    # mask edge and any ring overshoot always land on interior pixels, never背景)
    margin = 1.10
    bw, bh = w * 2 * rx * margin, h * 2 * ry * margin
    scale = max(bw / interior.width, bh / interior.height)
    interior = interior.resize((round(interior.width * scale), round(interior.height * scale)))

    canvas = Image.new("RGBA", (w, h), (10, 8, 14, 255))
    ix = round(w * cx - interior.width / 2)
    iy = round(h * cy - interior.height / 2)
    canvas.paste(interior, (ix, iy))
    canvas.alpha_composite(frame)

    out = CARDS / f"{slug}.png"
    canvas.convert("RGB").save(out)
    print(f"composed {slug} ({house}) -> {out}")


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(2)
    compose(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else None)

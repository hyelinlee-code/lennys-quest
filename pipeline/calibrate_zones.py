"""Detect each card's blank parchment banner/scroll zones and write overlayZones
(percent geometry) into public/data/speakers.json so text overlays sit inside the
plaques regardless of per-image frame drift.

Usage:
  python pipeline/calibrate_zones.py --debug   # render detection rectangles only
  python pipeline/calibrate_zones.py           # write overlayZones into speakers.json
"""
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
CARDS = ROOT / "public" / "cards"
SPEAKERS = ROOT / "public" / "data" / "speakers.json"
DEBUG_DIR = Path(
    r"C:\Users\hyeli\AppData\Local\Temp\claude"
    r"\C--Users-hyeli-CodingProject-Lennys-final"
    r"\a8b36ffa-fc77-451d-b3cc-b8e348f45d8f\scratchpad\zone-debug"
)

SCAN_W = 200  # downscale width for analysis


def is_parchment(r, g, b):
    # bright aged-paper beige (Bret/Wes style plaques)
    beige = r > 140 and g > 115 and b > 90 and r > b + 10 and abs(r - g) < 70
    # dark amber/bronze plaques (API-generated cards)
    amber = r > 110 and 55 < g < 170 and b < 130 and r > b + 35 and r > g
    return beige or amber


def row_profile(im):
    """Per-row: (parchment_ratio, leftmost, rightmost) of parchment run."""
    w, h = im.size
    px = im.load()
    rows = []
    for y in range(h):
        cols = [x for x in range(w) if is_parchment(*px[x, y][:3])]
        if cols:
            rows.append((len(cols) / w, min(cols) / w, (max(cols) + 1) / w))
        else:
            rows.append((0.0, 0.0, 0.0))
    return rows


def find_band(rows, y0, y1, min_ratio=0.28, min_rows=4):
    """Largest contiguous band of parchment-heavy rows within [y0, y1) row range."""
    bands = []
    start = None
    for y in range(y0, y1):
        if rows[y][0] >= min_ratio:
            if start is None:
                start = y
        else:
            if start is not None and y - start >= min_rows:
                bands.append((start, y))
            start = None
    if start is not None and y1 - start >= min_rows:
        bands.append((start, y1))
    if not bands:
        return None
    # prefer the tallest band (the plaque, not stray gold trim)
    return max(bands, key=lambda b: b[1] - b[0])


def zone_from_band(rows, band, h, inset_x=0.06, inset_y=0.16):
    y0, y1 = band
    core = rows[y0:y1]
    left = max(r[1] for r in core if r[0] > 0)
    right = min(r[2] for r in core if r[0] > 0)
    # measure extent from the median rows instead of min/max to dodge flourishes
    lefts = sorted(r[1] for r in core if r[0] > 0)
    rights = sorted(r[2] for r in core if r[0] > 0)
    left = lefts[len(lefts) // 2]
    right = rights[len(rights) // 2]
    band_h = (y1 - y0) / h
    top = y0 / h
    # inset so text clears the plaque's decorated edges
    zx = (right - left) * inset_x
    zy = band_h * inset_y
    return {
        "left": round((left + zx) * 100, 1),
        "right": round((1 - right + zx) * 100, 1),
        "top": round((top + zy) * 100, 1),
        "height": round((band_h - 2 * zy) * 100, 1),
    }


def calibrate(path):
    im = Image.open(path).convert("RGB")
    ratio = SCAN_W / im.width
    small = im.resize((SCAN_W, int(im.height * ratio)))
    h = small.height
    rows = row_profile(small)
    banner_band = find_band(rows, int(h * 0.02), int(h * 0.30), min_ratio=0.32)
    # higher ratio floor for the scroll: the glowing orb + hands (~55-72% height)
    # are warm-toned too but never span 40% of the row width
    scroll_band = find_band(rows, int(h * 0.68), int(h * 0.99), min_ratio=0.40)
    banner = zone_from_band(rows, banner_band, h) if banner_band else None
    scroll = zone_from_band(rows, scroll_band, h, inset_y=0.12) if scroll_band else None
    return banner, scroll


def draw_debug(path, banner, scroll, out):
    im = Image.open(path).convert("RGB")
    d = ImageDraw.Draw(im)
    w, h = im.size
    for zone, color in ((banner, (255, 60, 60)), (scroll, (60, 160, 255))):
        if not zone:
            continue
        x0 = w * zone["left"] / 100
        x1 = w * (100 - zone["right"]) / 100
        y0 = h * zone["top"] / 100
        y1 = y0 + h * zone["height"] / 100
        d.rectangle([x0, y0, x1, y1], outline=color, width=6)
    im.save(out)


# Fixed-frame system: zones are HAND-TUNED once per house frame (frames never change).
# --frames stamps these onto every speaker; --frames --debug renders check rects.
HOUSE_ZONES = {
    "founder": {
        "banner": {"left": 22.0, "right": 22.0, "top": 6.3, "height": 5.6},
        "scroll": {"left": 18.0, "right": 18.0, "top": 86.0, "height": 8.0},
    },
    "investor": {
        "banner": {"left": 21.5, "right": 21.5, "top": 6.0, "height": 5.8},
        "scroll": {"left": 18.0, "right": 18.0, "top": 86.0, "height": 8.0},
    },
    "operator": {
        "banner": {"left": 21.0, "right": 21.0, "top": 6.2, "height": 6.0},
        "scroll": {"left": 17.0, "right": 17.0, "top": 85.5, "height": 8.5},
    },
}


def calibrate_frames(debug=False):
    if debug:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)
        samples = {"founder": "dylan-field", "investor": "sarah-tavel", "operator": "marty-cagan"}
        for house, slug in samples.items():
            img = CARDS / f"{slug}.png"
            if img.exists():
                z = HOUSE_ZONES[house]
                draw_debug(img, z["banner"], z["scroll"], DEBUG_DIR / f"frame-{house}.jpg")
                print(f"{house}: debug -> {DEBUG_DIR / ('frame-' + house + '.jpg')}")
        return
    speakers = json.loads(SPEAKERS.read_text(encoding="utf-8"))
    for sp in speakers:
        if sp.get("house") in HOUSE_ZONES:
            sp["overlayZones"] = HOUSE_ZONES[sp["house"]]
    SPEAKERS.write_text(
        json.dumps(speakers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"stamped house-standard zones onto {len(speakers)} speakers")


def main():
    if "--frames" in sys.argv:
        calibrate_frames(debug="--debug" in sys.argv)
        return
    debug = "--debug" in sys.argv
    speakers = json.loads(SPEAKERS.read_text(encoding="utf-8"))
    if debug:
        DEBUG_DIR.mkdir(parents=True, exist_ok=True)
    changed = 0
    for sp in speakers:
        slug = sp["id"]
        img = None
        for ext in ("png", "jpg", "jpeg", "webp"):
            p = CARDS / f"{slug}.{ext}"
            if p.exists():
                img = p
                break
        if not img:
            print(f"skip {slug}: no card image")
            continue
        banner, scroll = calibrate(img)
        status = f"banner={'OK' if banner else 'MISS'} scroll={'OK' if scroll else 'MISS'}"
        print(f"{slug}: {status}")
        if debug:
            draw_debug(img, banner, scroll, DEBUG_DIR / f"{slug}.jpg")
        elif banner and scroll:
            sp["overlayZones"] = {"banner": banner, "scroll": scroll}
            changed += 1
    if not debug:
        SPEAKERS.write_text(
            json.dumps(speakers, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
        )
        print(f"\nwrote overlayZones for {changed} speakers -> {SPEAKERS}")


if __name__ == "__main__":
    main()

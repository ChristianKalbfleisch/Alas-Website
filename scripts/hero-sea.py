#!/usr/bin/env python3
"""Find the open water in the hero photographs, so the page can let it drift.

  python3 scripts/hero-sea.py PHOTOS_DIR [--check DIR]

Every hero photograph is the same empty ledge by the sea (the plate) with
something standing on it, as scripts/hero-photos.py leaves them, so the sea is
the same in all of them. This finds the water in the plate, between the horizon
and the stone, and for each scene leaves out whatever stands in front of it.

It writes to public/hero/ one picture per size: the band of sea on top and,
beneath it, a block for the empty ledge and one per scene, each a soft mask of
where the water is open. src/data/hero-sea.ts is rewritten with where the band
sits in the photographs. File names carry a content hash, so a new picture is never served
from an old cache.

PHOTOS_DIR holds the photographs as the site uses them: src/assets/photos.
What stands in each scene is read from scripts/hero-sea/lifted, where
scripts/hero-photos.py leaves it. --check writes one tinted picture per scene
to look over the mask.

Needs Pillow.
"""

import argparse
import hashlib
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "public" / "hero"
DATA = ROOT / "src" / "data" / "hero-sea.ts"
LIFTED = ROOT / "scripts" / "hero-sea" / "lifted"

# The empty ledge, and the scenes in the order the page names them: each is
# the photograph hero-NAME.
PLATE = "hero-plate"
SCENES = ("packs", "glass", "bottle", "lemon")
# The picture of sunlit shallows that the shop lets drift, and the width it is written at.
SHALLOWS = "caustics-light"
SHALLOWS_WIDTH = 1600
# Widths written for the band: wide screens, then phones.
WIDTHS = (2560, 1280)
# The masks are worked out at this width.
WORK = 1920


def picture(folder: Path, stem: str) -> Path:
    file = next(
        (folder / f"{stem}{ext}" for ext in (".jpg", ".png") if (folder / f"{stem}{ext}").exists()),
        None,
    )
    if file is None:
        raise SystemExit(f"missing photograph: {stem}")
    return file


def find_water(plate: Path):
    """The open water of the empty ledge, white on black, and the rows where
    the band starts, the horizon lies and the band ends, as fractions of the
    picture's height."""
    image = Image.open(plate).convert("RGB")
    width, height = image.size
    image = image.resize((WORK, round(height * WORK / width)), Image.LANCZOS)
    W, H = image.size
    red, _green, blue = image.split()

    # Water here is a deep saturated blue: almost no red, clearly more blue than red.
    is_blue = ImageChops.subtract(blue, red).point(lambda v: 255 if v > 32 else 0)
    low_red = red.point(lambda v: 255 if v < 46 else 0)
    sea = ImageChops.multiply(is_blue, low_red)
    sea = sea.filter(ImageFilter.GaussianBlur(5)).point(lambda v: 255 if v > 120 else 0)

    # The horizon: the row where the pale band of sky drops to dark water.
    soft_red = red.filter(ImageFilter.GaussianBlur(2)).load()
    votes = []
    for x in range(int(W * 0.03), int(W * 0.97), max(1, W // 60)):
        best, row = 0, None
        for y in range(int(H * 0.35), int(H * 0.72)):
            drop = soft_red[x, y - 3] - soft_red[x, y + 3]
            if drop > best:
                best, row = drop, y
        if row is not None and best > 18:
            votes.append(row)
    if not votes:
        raise SystemExit(f"{plate.name}: no horizon found")
    votes.sort()
    horizon = votes[len(votes) // 2]

    # Down each column from the horizon: the water ends where the stone begins.
    is_sea = sea.load()
    run = max(6, H // 70)
    edge = []
    for x in range(W):
        y = horizon + 3
        last, misses = y, 0
        while y < H:
            if is_sea[x, y]:
                last, misses = y, 0
            else:
                misses += 1
                if misses >= run:
                    break
            y += 1
        edge.append(last)

    # Smooth the stone line across neighbouring columns, and count nothing as
    # open water much below the usual line (stray wet patches, the far corners).
    span = max(4, W // 40)
    usual = sorted(edge)[len(edge) // 2]
    cap = usual + int(H * 0.035)
    water = Image.new("L", (W, H), 0)
    put = water.load()
    for x in range(W):
        # The higher of this column and its neighbours' usual line: a narrow
        # tongue of blue running down into the wet stone is not water.
        near = sorted(edge[max(0, x - span) : x + span + 1])
        line = min(edge[x], near[len(near) // 4], cap)
        for y in range(horizon + 3, line + 1):
            put[x, y] = 255

    box = soften(water).point(lambda v: 255 if v > 6 else 0).getbbox()
    if box is None:
        raise SystemExit(f"{plate.name}: no open water found")
    top = max(0, min(horizon - int(H * 0.012), box[1]))
    bottom = min(H, box[3] + int(H * 0.012))
    return water, top / H, horizon / H, bottom / H


def soften(water: Image.Image) -> Image.Image:
    """Pull the edges in, then soften them: the water barely moves beside a still thing."""
    return water.filter(ImageFilter.MinFilter(15)).filter(ImageFilter.GaussianBlur(9))


def open_water(water: Image.Image, name: str) -> Image.Image:
    """The plate's water without whatever stands in front of it in this scene."""
    lifted = LIFTED / f"hero-{name}.png"
    if not lifted.exists():
        raise SystemExit(f"missing {lifted.relative_to(ROOT)}: run scripts/hero-photos.py first")
    objects = Image.open(lifted).convert("L").resize(water.size, Image.LANCZOS)
    objects = objects.filter(ImageFilter.MaxFilter(21))
    clear = objects.point(lambda v: 0 if v > 40 else 255)
    return soften(ImageChops.multiply(water, clear))


def write_sheet(plate: Path, masks: list[Image.Image], top: float, bottom: float):
    """The band of sea with the masks beneath it, once per width."""
    written = {}
    source = Image.open(plate).convert("RGB")
    for width in WIDTHS:
        scaled = source.resize((width, round(source.height * width / source.width)), Image.LANCZOS)
        y0, y1 = round(top * scaled.height), round(bottom * scaled.height)
        rows = y1 - y0
        sheet = Image.new("RGB", (width, rows * (len(masks) + 1)))
        sheet.paste(scaled.crop((0, y0, width, y1)), (0, 0))
        for n, mask in enumerate(masks):
            block = mask.resize(scaled.size, Image.LANCZOS).crop((0, y0, width, y1))
            sheet.paste(Image.merge("RGB", (block, block, block)), (0, rows * (n + 1)))
        with tempfile.NamedTemporaryFile(suffix=".webp") as temp:
            sheet.save(temp.name, "WEBP", quality=86, method=6)
            data = Path(temp.name).read_bytes()
        digest = hashlib.sha256(data).hexdigest()[:8]
        file = OUT / f"sea-{width}.{digest}.webp"
        file.write_bytes(data)
        written[width] = file
        print(f"{len(data) / 1024:6.0f} KB  {width}x{sheet.height}  {file.name}")
    return written


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("photos", type=Path, help="the folder of finished photographs")
    parser.add_argument("--check", type=Path, help="write a tinted picture per scene here")
    args = parser.parse_args()

    OUT.mkdir(parents=True, exist_ok=True)
    for old in [*OUT.glob("sea-*.webp"), *OUT.glob("shallows-*.webp")]:
        old.unlink()
    if args.check:
        args.check.mkdir(parents=True, exist_ok=True)

    plate = picture(args.photos, PLATE)
    water, top, horizon, bottom = find_water(plate)
    masks = [soften(water), *(open_water(water, name) for name in SCENES)]
    files = write_sheet(plate, masks, top, bottom)
    if args.check:
        for name, mask in zip(SCENES, masks[1:]):
            image = Image.open(picture(args.photos, f"hero-{name}")).convert("RGB")
            image.thumbnail((WORK, WORK), Image.LANCZOS)
            tint = Image.new("RGB", image.size, (255, 60, 60))
            shown = Image.composite(tint, image, mask.resize(image.size).point(lambda v: v // 2))
            shown.save(args.check / f"{name}.jpg", quality=85)

    shallows = picture(args.photos, SHALLOWS)
    light = Image.open(shallows).convert("RGB")
    light = light.resize((SHALLOWS_WIDTH, round(light.height * SHALLOWS_WIDTH / light.width)), Image.LANCZOS)
    with tempfile.NamedTemporaryFile(suffix=".webp") as temp:
        light.save(temp.name, "WEBP", quality=84, method=6)
        data = Path(temp.name).read_bytes()
    shallows_file = OUT / f"shallows-{SHALLOWS_WIDTH}.{hashlib.sha256(data).hexdigest()[:8]}.webp"
    shallows_file.write_bytes(data)
    print(f"{len(data) / 1024:6.0f} KB  {light.width}x{light.height}  {shallows_file.name}")

    names = ", ".join(f'"{name}"' for name in SCENES)
    DATA.write_text(
        "/**\n"
        " * The open water in the hero photographs. Written by scripts/hero-sea.py:\n"
        " * run it again with new photographs rather than editing this by hand.\n"
        " * Every scene shows the same sea, so there is one band of it: top, horizon\n"
        " * and bottom are fractions of a photograph's height. Each file holds the\n"
        " * band with, beneath it, the mask of the empty ledge and then one mask per\n"
        " * scene, in the order of scenes.\n"
        " */\n"
        "export const HERO_SEA = {\n"
        f"  top: {top:.4f},\n"
        f"  horizon: {horizon:.4f},\n"
        f"  bottom: {bottom:.4f},\n"
        f"  scenes: [{names}],\n"
        f'  wide: "/hero/{files[WIDTHS[0]].name}",\n'
        f'  small: "/hero/{files[WIDTHS[1]].name}",\n'
        "} as const;\n"
        "\n"
        "/** The sunlit shallows behind the shop: the picture, and its width over its height. */\n"
        "export const SHALLOWS = {\n"
        f'  src: "/hero/{shallows_file.name}",\n'
        f"  ratio: {light.width / light.height:.4f},\n"
        "} as const;\n"
    )
    print(f"wrote {DATA.relative_to(ROOT)}")


if __name__ == "__main__":
    main()

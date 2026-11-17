#!/usr/bin/env python3
"""Build the first screen's photographs: one place, four scenes.

  python3 scripts/hero-photos.py PHOTOS_DIR [--check DIR]

PHOTOS_DIR holds the finished photographs: the empty ledge by the sea (the
plate) and one photograph per scene of what stands on it. They are taken at
the same place and hour, but each comes back with a slightly different blue,
its horizon at a slightly different height and a slightly different ledge.

Here every one has its sky and sea brought to the same deep navy and its
horizon moved to the same line. Then whatever stands on the ledge in a scene
is lifted out of its photograph, together with its reflection in the wet
stone, and laid on the plate. Every scene therefore has exactly the same sky,
sea and ledge: when one gives way to the next, only what stands on the ledge
changes.

Only what is blue is recoloured: the lettering on the packs, skin, steel and
lemons keep their own colour. A photograph is only ever moved down (a little
more sky is added at its top, a little stone lost at its foot).

Written to src/assets/photos, at most 3200 px wide, all metadata removed: the
plate and the four scenes. Written to scripts/hero-sea/lifted: what was lifted
in each scene, which scripts/hero-sea.py reads. Run that next. --check writes
one tinted picture per scene to look over what was lifted.

Needs Pillow, and a Mac: the objects are found with the system's Vision
framework (scripts/hero-sea/lift.swift).
"""

import argparse
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter, ImageStat

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "src" / "assets" / "photos"
LIFT = ROOT / "scripts" / "hero-sea" / "lift.swift"
LIFTED = ROOT / "scripts" / "hero-sea" / "lifted"

WHOLE = (0.0, 0.0, 1.0, 1.0)
# The empty ledge: its name on the site, and the file name of the photograph.
PLATE = ("hero-plate", "plate-ledge")
# Name on the site -> the photograph, and how what stands in it is lifted.
# Boxes are left, top, right, bottom as fractions of the photograph.
#   find: where the system looks for objects. It finds the large ones in the
#         whole picture; a small, dark or clear one is found in a box it fills.
#   keep: boxes copied as they are, softly edged: falling salt, grains on the stone.
#   size: the lifted group made smaller or larger, and the point it is sized about.
SCENES = {
    "hero-packs": {"photo": "wide-packs", "find": [WHOLE], "keep": []},
    "hero-glass": {
        "photo": "wide-glass",
        "find": [WHOLE, (0.70, 0.34, 1.0, 0.94)],
        "keep": [(0.792, 0.585, 0.822, 0.672), (0.825, 0.866, 0.885, 0.896)],
    },
    "hero-bottle": {
        "photo": "wide-bottle2",
        "find": [
            WHOLE,
            (0.62, 0.22, 1.0, 0.56),
            (0.58, 0.40, 0.76, 0.93),
            (0.69, 0.75, 0.79, 0.90),
        ],
        "keep": [(0.645, 0.38, 0.668, 0.47)],
        # A little smaller and lower, about a point on the right edge below
        # the foot: on a phone the hand clears the words above the picture.
        "size": (0.90, 1.0, 1.1),
    },
    "hero-lemon": {
        "photo": "wide-lemon",
        "find": [WHOLE, (0.50, 0.58, 0.64, 0.90)],
        "keep": [],
    },
}
LONG_SIDE = 3200
QUALITY = 90
# What was lifted is kept at this width for scripts/hero-sea.py.
LIFTED_WIDTH = 1920

# Where the open sky and the open sea are measured (left, top, right, bottom,
# as fractions), and the green and blue every photograph is brought to there.
SKY = (0.05, 0.22, 0.45, 0.32)
SEA = (0.05, 0.62, 0.45, 0.70)
TARGET_SKY = (26.5, 53.0)
TARGET_SEA = (37.0, 60.0)

# A thing standing on the ledge takes the wet stone under it along, for its
# reflection: this far down (a share of the height), fading out. Only stone
# counts, which begins about this far down the photograph.
REFLECTION = 0.085
STONE = 0.775


def mean(image: Image.Image, box) -> tuple[float, float, float]:
    width, height = image.size
    area = (
        int(width * box[0]),
        int(height * box[1]),
        int(width * box[2]),
        int(height * box[3]),
    )
    return tuple(ImageStat.Stat(image.crop(area)).mean)


def grade(image: Image.Image) -> tuple[Image.Image, float, float]:
    """The photograph with its blues brought to the shared navy."""
    sky, sea = mean(image, SKY), mean(image, SEA)
    green = (TARGET_SKY[0] + TARGET_SEA[0]) / (sky[1] + sea[1])
    blue = (TARGET_SKY[1] + TARGET_SEA[1]) / (sky[2] + sea[2])
    green, blue = (min(1.3, max(0.7, gain)) for gain in (green, blue))
    r, g, b = image.split()
    toned = Image.merge(
        "RGB",
        (
            r.point(lambda v: min(255, round(v * green))),
            g.point(lambda v: min(255, round(v * green))),
            b.point(lambda v: min(255, round(v * blue))),
        ),
    )
    # How blue a point is: sky, sea and the navy of the packs are; white
    # lettering, skin, steel and lemons are not, and stay as they were.
    blueness = ImageChops.subtract(b, ImageChops.add(r, g, scale=2))
    mask = blueness.point(lambda v: max(0, min(255, round((v - 10) * 255 / 34))))
    mask = mask.filter(ImageFilter.GaussianBlur(1.2))
    return Image.composite(toned, image, mask), green, blue


def horizon(image: Image.Image) -> int:
    """The row where the sky meets the sea, read in the open left of the picture."""
    width, height = image.size
    light = image.convert("L").filter(ImageFilter.GaussianBlur(2)).load()
    votes = []
    for x in range(int(width * 0.05), int(width * 0.42), max(1, width // 80)):
        best, row = 0, None
        for y in range(int(height * 0.45), int(height * 0.7)):
            drop = light[x, y - 4] - light[x, y + 4]
            if drop > best:
                best, row = drop, y
        if row is not None:
            votes.append(row)
    votes.sort()
    return votes[len(votes) // 2]


def lower(image: Image.Image, rows: int) -> Image.Image:
    """The photograph moved down by some rows, with more of its own sky above."""
    if rows <= 0:
        return image
    width, height = image.size
    moved = Image.new("RGB", (width, height))
    moved.paste(image.crop((0, 0, width, 2)).resize((width, rows)), (0, 0))
    moved.paste(image.crop((0, 0, width, height - rows)), (0, rows))
    return moved


def finder(work: Path) -> list[str]:
    """The command that finds objects: built once, so each box takes a moment."""
    built = work / "lift"
    done = subprocess.run(
        ["swiftc", "-O", str(LIFT), "-o", str(built)], capture_output=True, text=True
    )
    return [str(built)] if done.returncode == 0 else ["swift", str(LIFT)]


def lift(image: Image.Image, boxes, command: list[str], work: Path) -> Image.Image:
    """Whatever stands in the foreground, white on black: everything the
    system finds in any of the boxes."""
    width, height = image.size
    found = Image.new("L", image.size, 0)
    for n, (left, top, right, bottom) in enumerate(boxes):
        area = (
            round(left * width),
            round(top * height),
            round(right * width),
            round(bottom * height),
        )
        piece, mask = work / f"piece-{n}.png", work / f"mask-{n}.png"
        mask.unlink(missing_ok=True)
        image.crop(area).save(piece)
        done = subprocess.run([*command, str(piece), str(mask)], capture_output=True, text=True)
        if done.returncode == 2:
            continue  # nothing stands in this box
        if done.returncode != 0 or not mask.exists():
            raise SystemExit(f"finding objects failed: {done.stdout}{done.stderr}".strip())
        part = Image.open(mask).convert("L").resize((area[2] - area[0], area[3] - area[1]))
        found.paste(ImageChops.lighter(found.crop(area), part), area)
    return found


def with_reflection(found: Image.Image, keep) -> Image.Image:
    """How much of the scene's photograph is laid on the plate at each point:
    all of what stands there, the wet stone just under it fading out, and the
    boxes named to be kept."""
    width, height = found.size
    # A little wider than what was found, softly edged: a dark pack against a
    # dark sky is never cut into.
    solid = found.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(1.4))

    reach = round(height * REFLECTION)
    steps = 28
    under = Image.new("L", found.size, 0)
    for step in range(1, steps + 1):
        rows = round(reach * step / steps)
        moved = Image.new("L", found.size, 0)
        moved.paste(found.crop((0, 0, width, height - rows)), (0, rows))
        strength = (1 - step / (steps + 1)) ** 1.3
        under = ImageChops.lighter(under, moved.point(lambda v: round(v * strength)))
    # Only where there is stone to stand on.
    stone = Image.new("L", (1, height), 0)
    start, full = round(height * (STONE - 0.012)), round(height * (STONE + 0.012))
    stone.putdata(
        [max(0, min(255, round((y - start) * 255 / max(1, full - start)))) for y in range(height)]
    )
    under = ImageChops.multiply(under, stone.resize(found.size))
    under = under.filter(ImageFilter.GaussianBlur(width * 0.004))

    laid = ImageChops.lighter(solid, under)
    if keep:
        kept = Image.new("L", found.size, 0)
        draw = ImageDraw.Draw(kept)
        for left, top, right, bottom in keep:
            draw.rectangle(
                (left * width, top * height, right * width, bottom * height), fill=255
            )
        laid = ImageChops.lighter(laid, kept.filter(ImageFilter.GaussianBlur(width * 0.0035)))
    return laid


def sized(image: Image.Image, size) -> Image.Image:
    """The picture made smaller or larger about a point; nothing where it no longer reaches."""
    scale, across, down = size
    x, y = across * image.width, down * image.height
    return image.transform(
        image.size,
        Image.AFFINE,
        (1 / scale, 0, x - x / scale, 0, 1 / scale, y - y / scale),
        resample=Image.BICUBIC,
    )


def load(source: Path, stem: str) -> Image.Image:
    file = next(
        (source / f"{stem}{ext}" for ext in (".jpg", ".png") if (source / f"{stem}{ext}").exists()),
        None,
    )
    if file is None:
        raise SystemExit(f"missing photograph: {stem}")
    image = Image.open(file).convert("RGB")
    image.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
    return image


def save(image: Image.Image, name: str, note: str = "") -> None:
    out = OUT / f"{name}.jpg"
    image.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
    sky, sea = mean(image, SKY), mean(image, SEA)
    print(
        f"{out.stat().st_size / 1024:6.0f} KB  {image.width}x{image.height}  {out.name}  {note}"
        f"  sky ({sky[0]:.0f},{sky[1]:.0f},{sky[2]:.0f}) sea ({sea[0]:.0f},{sea[1]:.0f},{sea[2]:.0f})"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    parser.add_argument("photos", type=Path, help="the folder of finished photographs")
    parser.add_argument("--check", type=Path, help="write a tinted picture per scene here")
    args = parser.parse_args()
    source = args.photos.expanduser()
    OUT.mkdir(parents=True, exist_ok=True)
    LIFTED.mkdir(parents=True, exist_ok=True)
    if args.check:
        args.check.mkdir(parents=True, exist_ok=True)

    loaded = {PLATE[0]: load(source, PLATE[1])}
    for name, scene in SCENES.items():
        loaded[name] = load(source, scene["photo"])
    if len({image.size for image in loaded.values()}) != 1:
        raise SystemExit("the photographs are not all the same size")
    rows = {name: horizon(image) for name, image in loaded.items()}
    line = max(rows.values())

    ready = {}
    for name, image in loaded.items():
        image, green, blue = grade(lower(image, line - rows[name]))
        ready[name] = (image, f"down {line - rows[name]} rows  green x{green:.2f} blue x{blue:.2f}")

    plate, note = ready[PLATE[0]]
    save(plate, PLATE[0], note)
    with tempfile.TemporaryDirectory() as temp:
        work = Path(temp)
        command = finder(work)
        for name, scene in SCENES.items():
            image, note = ready[name]
            laid = with_reflection(lift(image, scene["find"], command, work), scene["keep"])
            if "size" in scene:
                image, laid = sized(image, scene["size"]), sized(laid, scene["size"])
            save(Image.composite(image, plate, laid), name, note)
            small = laid.resize(
                (LIFTED_WIDTH, round(laid.height * LIFTED_WIDTH / laid.width)), Image.LANCZOS
            )
            small.save(LIFTED / f"{name}.png", optimize=True)
            if args.check:
                shown = image.copy()
                shown.thumbnail((1920, 1920), Image.LANCZOS)
                tint = Image.new("RGB", shown.size, (255, 60, 60))
                Image.composite(tint, shown, laid.resize(shown.size).point(lambda v: v * 0.6)).save(
                    args.check / f"{name}-lifted.jpg", quality=85
                )


if __name__ == "__main__":
    main()

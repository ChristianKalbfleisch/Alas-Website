"""Copies the pack renders into the site and records them.

  uv run --with pillow python scripts/sync-packs.py RENDERS_DIR

RENDERS_DIR holds pack pictures as PNG (or JPEG for photographs): the transparent renders made from the
print artwork (pouch-classic-front.png, sticks-lemon-15.png, pouch-duo.png and
so on), studio photographs (pouch-classic-studio.png) and photographed cut-outs
(pouch-classic-cut.png). Run it on any folder that holds some of them: the ones
that are missing keep the files they already have. Each
is written to public/packs as a WebP in two sizes: the full picture (at most
1800 px on its long side) and a small one for thumbnails. File names carry a
hash of the picture, so browsers never show a stale render. Names and pixel
sizes go to src/data/pack-sizes.ts.
"""

import hashlib
import sys
from pathlib import Path

from PIL import Image

LONG_SIDE = 1800
SMALL_SIDE = 480
NAMES = [
    "pouch-classic-front",
    "pouch-classic-angle",
    "pouch-lemon-front",
    "pouch-lemon-angle",
    "pouch-duo",
    "stick-classic",
    "stick-lemon",
    "sticks-classic-5",
    "sticks-classic-15",
    "sticks-classic-30",
    "sticks-lemon-5",
    "sticks-lemon-15",
    "sticks-lemon-30",
    "discover-set",
    "range",
    # Photographs of the packs: studio shots that fill a panel, and cut-outs.
    "pouch-classic-studio",
    "pouch-lemon-studio",
    "sticks-classic-studio",
    "sticks-lemon-studio",
    "discover-set-studio",
    # The same packs in the larger amounts the shop offers.
    "pouch-classic-2-studio",
    "pouch-classic-3-studio",
    "pouch-lemon-2-studio",
    "pouch-lemon-3-studio",
    "sticks-classic-15-studio",
    "sticks-classic-30-studio",
    "sticks-lemon-15-studio",
    "sticks-lemon-30-studio",
    "pouch-classic-cut",
    "pouch-lemon-cut",
    "discover-set-cut",
]


def main() -> None:
    source = Path(sys.argv[1]).expanduser()
    root = Path(__file__).resolve().parent.parent
    target = root / "public" / "packs"
    target.mkdir(parents=True, exist_ok=True)
    packs: dict[str, tuple[str, str, int, int]] = {}
    missing = []
    for name in NAMES:
        file = next(
            (f for f in (source / f"{name}.png", source / f"{name}.jpg") if f.exists()),
            source / f"{name}.png",
        )
        current = sorted(
            f for f in target.glob(f"{name}.*.webp") if not f.name.endswith(".s.webp")
        )
        if not file.exists():
            missing.append(name)
            if current:
                kept = current[-1]
                width, height = Image.open(kept).size
                small = kept.name.replace(".webp", ".s.webp")
                packs[name] = (kept.name, small, width, height)
            continue
        image = Image.open(file).convert("RGBA")
        image.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        digest = hashlib.sha1(image.tobytes()).hexdigest()[:8]
        for old in target.glob(f"{name}.*"):
            old.unlink()
        full = f"{name}.{digest}.webp"
        small = f"{name}.{digest}.s.webp"
        image.save(target / full, "WEBP", quality=90, method=6)
        thumb = image.copy()
        thumb.thumbnail((SMALL_SIDE, SMALL_SIDE), Image.LANCZOS)
        thumb.save(target / small, "WEBP", quality=88, method=6)
        packs[name] = (full, small, *image.size)
    lines = [
        "/** The pack images in public/packs: file, small file, pixel size. Written by scripts/sync-packs.py. */",
        "export const PACKS: Record<",
        "  string,",
        "  readonly [string, string, number, number]",
        "> = {",
        *[
            f'  "{name}": ["{full}", "{small}", {w}, {h}],'
            for name, (full, small, w, h) in sorted(packs.items())
        ],
        "};",
        "",
    ]
    (root / "src" / "data" / "pack-sizes.ts").write_text("\n".join(lines))
    print(
        f"{len(packs)} images recorded; missing from renders: {', '.join(missing) or 'none'}"
    )


if __name__ == "__main__":
    main()

"""Copies the campaign photographs into the site.

  uv run --with pillow python scripts/sync-photos.py PHOTOS_DIR [name ...]

PHOTOS_DIR holds the finished photographs (PNG or JPEG, any size). Each is
written to src/assets/photos/<name>.jpg at most 3200 px on its long side, with
all metadata removed. Pages import them from there and Next makes the sizes
each screen asks for. Give names to copy only those.
"""

import sys
from pathlib import Path

from PIL import Image

LONG_SIDE = 3200
QUALITY = 88


def main() -> None:
    source = Path(sys.argv[1]).expanduser()
    only = set(sys.argv[2:])
    target = Path(__file__).resolve().parent.parent / "src" / "assets" / "photos"
    target.mkdir(parents=True, exist_ok=True)
    files = sorted(
        f for f in source.iterdir() if f.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )
    for file in files:
        if only and file.stem not in only:
            continue
        image = Image.open(file).convert("RGB")
        image.thumbnail((LONG_SIDE, LONG_SIDE), Image.LANCZOS)
        out = target / f"{file.stem}.jpg"
        image.save(out, "JPEG", quality=QUALITY, optimize=True, progressive=True)
        print(f"{out.stat().st_size / 1024:7.0f} KB  {image.width}x{image.height}  {out.name}")


if __name__ == "__main__":
    main()

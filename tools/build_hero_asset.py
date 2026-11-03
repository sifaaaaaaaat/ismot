"""Build the poster images the site serves from the artwork masters.

All three posters are 841x1870 and are used exactly as painted: no padding, no
blur, no crop. The hero zooms its poster until it covers the screen; the two
sections below it show theirs full width at the same ratio. This script only
re-encodes each master to WebP at its native size for delivery.

    python tools/build_hero_asset.py
"""

import os

from PIL import Image

POSTERS = [
    ("assets/ismot-hero-phone.png", "ismot-next/public/hero-phone.webp"),
    ("assets/ismot-botanicals.png", "ismot-next/public/botanicals.webp"),
    ("assets/ismot-benefits.png", "ismot-next/public/benefits.webp"),
]


def main() -> None:
    for src, out in POSTERS:
        art = Image.open(src).convert("RGB")
        width, height = art.size
        art.save(out, "WEBP", quality=88, method=6)

        kb = os.path.getsize(out) / 1024
        print(f"{out}: {width}x{height} ratio {width / height:.4f} ({kb:.0f} KB)")
        print(
            "keep in sync — "
            f"aspect-ratio: {width} / {height}"
        )


if __name__ == "__main__":
    main()

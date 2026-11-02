"""Build the hero image the site serves from the artwork master.

The artwork (assets/ismot-hero-phone.png) is already phone-shaped, so it is used
exactly as painted: no padding, no extension, no crop. This only re-encodes it to
WebP at its native size for delivery.

    python tools/build_hero_asset.py
"""

import os

from PIL import Image

SRC = "assets/ismot-hero-phone.png"
OUT = "ismot-next/public/hero-phone.webp"


def main() -> None:
    art = Image.open(SRC).convert("RGB")
    width, height = art.size
    art.save(OUT, "WEBP", quality=88, method=6)

    kb = os.path.getsize(OUT) / 1024
    print(f"{OUT}: {width}x{height} ratio {width / height:.4f} ({kb:.0f} KB)")
    print("the poster box must keep aspect-ratio: 841 / 1870 and .hero-content inset: 0")


if __name__ == "__main__":
    main()

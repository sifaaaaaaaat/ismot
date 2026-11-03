"""Build the delivered hero image from the artwork master.

The artwork (assets/ismot-hero-phone.png, 841x1870) is phone-shaped but a little
narrower than the screens it runs on, which used to leave a dark strip down each
side. This adds one down each side here instead: the artwork's own edge,
mirrored outward and blurred, so the delivered file is wide enough to cover a
phone and the painted poster is never cropped.

    python tools/build_hero_asset.py
"""

import os

import numpy as np
from PIL import Image, ImageFilter

SRC = "assets/ismot-hero-phone.png"
OUT = "ismot-next/public/hero-phone-bleed.webp"

PAD = 106  # width of the added strip on each side
BLUR = 16  # how far the added strip is thrown out of focus
FEATHER = 18  # seam blend, in pixels, so the join is invisible


def main() -> None:
    art = Image.open(SRC).convert("RGB")
    w, h = art.size
    total = w + PAD * 2

    canvas = Image.new("RGB", (total, h))
    canvas.paste(art, (PAD, 0))

    mirrored = art.transpose(Image.FLIP_LEFT_RIGHT)
    canvas.paste(mirrored.crop((w - PAD, 0, w, h)), (0, 0))
    canvas.paste(mirrored.crop((0, 0, PAD, h)), (PAD + w, 0))

    blown = canvas.filter(ImageFilter.GaussianBlur(BLUR))

    x = np.arange(total)
    blend = np.zeros(total, dtype=np.float32)
    blend[x < PAD - FEATHER] = 1.0
    near_left = (x >= PAD - FEATHER) & (x < PAD)
    blend[near_left] = (PAD - x[near_left]) / FEATHER
    near_right = (x >= PAD + w) & (x < PAD + w + FEATHER)
    blend[near_right] = (x[near_right] - (PAD + w)) / FEATHER
    blend[x >= PAD + w + FEATHER] = 1.0
    mask = Image.fromarray(np.tile((blend * 255).astype(np.uint8), (h, 1)))

    canvas = Image.composite(blown, canvas, mask)

    # Darken the added strip slightly towards the edge, so it reads as the scene
    # falling away rather than a bright panel beside the poster.
    shade = np.ones(total, dtype=np.float32)
    left = x < PAD
    shade[left] = 1.0 - 0.15 * ((PAD - x[left]) / PAD) ** 1.3
    right = x >= PAD + w
    shade[right] = 1.0 - 0.15 * ((x[right] - (PAD + w)) / PAD) ** 1.3

    pixels = np.asarray(canvas).astype(np.float32) * shade[None, :, None]
    Image.fromarray(np.clip(pixels, 0, 255).astype(np.uint8)).save(
        OUT, "WEBP", quality=88, method=6
    )

    kb = os.path.getsize(OUT) / 1024
    print(f"{OUT}: {total}x{h} ratio {total / h:.4f} ({kb:.0f} KB)")
    print(
        "keep in sync — "
        f".hero-poster aspect-ratio: {total} / {h}; "
        f".hero-content left: calc(100% * {PAD} / {total}), "
        f"width: calc(100% * {w} / {total})"
    )


if __name__ == "__main__":
    main()

"""Locate the controls painted into the hero artwork.

The HTML buttons must sit exactly on the artwork's own buttons, so the boxes are
measured from the image instead of guessed. Prints each control as a percentage
box (x, y, w, h) of the artwork, which is what app/hero.tsx uses.

    python tools/measure_hero.py assets/ismot-hero-9x16.png
"""

import sys

import numpy as np
from PIL import Image


def main(path: str) -> None:
    im = Image.open(path).convert("RGB")
    W, H = im.size
    a = np.asarray(im).astype(np.int16)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    L = (R * 0.299 + G * 0.587 + B * 0.114)

    def region(x0, x1, y0, y1):
        m = np.zeros((H, W), bool)
        m[int(y0 * H):int(y1 * H), int(x0 * W):int(x1 * W)] = True
        return m

    def report(name, mask, pad=0.0):
        ys, xs = np.nonzero(mask)
        if not len(xs):
            print(f"{name}: NOT FOUND")
            return None
        x0, x1 = xs.min(), xs.max() + 1
        y0, y1 = ys.min(), ys.max() + 1
        if pad:
            p = pad * W
            x0, x1, y0, y1 = x0 - p, x1 + p, y0 - pad * H, y1 + pad * H
        box = (x0 / W * 100, y0 / H * 100, (x1 - x0) / W * 100, (y1 - y0) / H * 100)
        print(f"{name}: px x{x0:.0f}..{x1:.0f} y{y0:.0f}..{y1:.0f} "
              f"-> {box[0]:.2f} {box[1]:.2f} {box[2]:.2f} {box[3]:.2f}")
        return box

    print(f"{path}: {W}x{H}  aspect {W / H:.4f}  ({W} / {H})")

    # white brush strokes: logo lockup and the two header icons
    white = (L > 165) & (np.abs(R - B) < 70)
    report("logo", white & region(0.00, 0.45, 0.00, 0.11))
    report("bag", white & region(0.62, 0.86, 0.00, 0.10))
    report("menu", white & region(0.86, 1.00, 0.00, 0.10))

    # the Order Now pill: gold rim and white label on the wooden base
    gold = (R > 110) & (G > 95) & ((R - B) > 30)
    report("order", gold & region(0.12, 0.90, 0.78, 0.98))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else "assets/ismot-hero-9x16.png")

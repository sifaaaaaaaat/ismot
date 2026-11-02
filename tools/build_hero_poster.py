"""Extend the 2:3 poster into a 9:21 canvas so a phone screen fills edge to edge.

The painted poster is 1024x1536 (2:3). Phones are much taller — a 390x844 screen
is about 9:19.5 — so showing the whole artwork always leaves a band above and
below it. This adds 426px of scene above and 427px below by mirroring the top
edge and smearing the table's own colours at the bottom: the picture stays
continuous and no painted control is cropped. The core poster keeps exactly the
same size and position on screen.

    python tools/build_hero_poster.py

Writes ismot-next/public/hero-2x3.webp and two edge crops for inspection.
"""

from PIL import Image, ImageFilter

SRC = "assets/ismot-hero-2x3.png"
OUT = "ismot-next/public/hero-2x3.webp"

PAD_TOP = 426
PAD_BOTTOM = 427
STRIP = 150  # rows of the artwork mirrored into the top band
BLUR = 30
SEAM_HALF = 90
SEAM_BLUR = 11


def band(art: Image.Image, rows: tuple[int, int], height: int) -> Image.Image:
    """Mirror `rows` of the artwork, stretch it to `height`, and soften it."""
    top, bottom = rows
    strip = art.crop((0, top, art.width, bottom)).transpose(Image.FLIP_TOP_BOTTOM)
    strip = strip.resize((art.width, height), Image.LANCZOS)
    return strip.filter(ImageFilter.GaussianBlur(BLUR))


def smear(art: Image.Image, rows: tuple[int, int], height: int) -> Image.Image:
    """Collapse `rows` to one row of colour, then stretch it downwards.

    Used for the bottom band: mirroring the leaves there leaves a green blob,
    but the table's own colours smeared into a soft vertical wash read as depth
    of field and keep the horizontal tones of the wood.
    """
    top, bottom = rows
    strip = art.crop((0, top, art.width, bottom))
    strip = strip.resize((art.width, 1), Image.LANCZOS)
    strip = strip.resize((art.width, height), Image.LANCZOS)
    return strip.filter(ImageFilter.GaussianBlur(BLUR))


def blend_seam(canvas: Image.Image, y: int) -> None:
    """Blur a band across the join so the mirrored edge never shows as a line."""
    box = (0, max(0, y - SEAM_HALF), canvas.width, min(canvas.height, y + SEAM_HALF))
    band_img = canvas.crop(box).filter(ImageFilter.GaussianBlur(SEAM_BLUR))

    mask = Image.new("L", band_img.size)
    h = band_img.height
    for row in range(h):
        # full strength in the middle of the band, nothing at its edges
        t = max(0.0, 1 - abs((row - h / 2) / (h / 2)))
        mask.paste(int(255 * t**1.2), (0, row, band_img.width, row + 1))

    canvas.paste(band_img, (box[0], box[1]), mask)


def vignette(canvas: Image.Image, depth: int = 170, edge: float = 0.86) -> None:
    """Slightly darken the very top and bottom so the added scene falls away."""
    overlay = Image.new("L", (1, depth))
    for row in range(depth):
        overlay.putpixel((0, row), int(255 * (1 - edge) * (1 - row / depth)))
    strip = Image.new("RGB", (canvas.width, depth), (0, 0, 0))
    canvas.paste(strip, (0, 0), overlay.resize((canvas.width, depth)))

    flipped = overlay.transpose(Image.FLIP_TOP_BOTTOM).resize((canvas.width, depth))
    canvas.paste(strip, (0, canvas.height - depth), flipped)


def main() -> None:
    art = Image.open(SRC).convert("RGB")
    width, height = art.size

    canvas_h = height + PAD_TOP + PAD_BOTTOM
    canvas = Image.new("RGB", (width, canvas_h), art.getpixel((0, 0)))
    canvas.paste(art, (0, PAD_TOP))

    canvas.paste(band(art, (0, STRIP), PAD_TOP), (0, 0))
    canvas.paste(smear(art, (height - 60, height), PAD_BOTTOM), (0, PAD_TOP + height))

    blend_seam(canvas, PAD_TOP)
    blend_seam(canvas, PAD_TOP + height)
    vignette(canvas)

    canvas.save(OUT, "WEBP", quality=86, method=6)

    print(f"{OUT}: {canvas.width}x{canvas.height} aspect {canvas.width / canvas.height:.4f}")
    print(f"poster sits at y {PAD_TOP}..{PAD_TOP + height} "
          f"({PAD_TOP / canvas_h * 100:.2f}% .. {(PAD_TOP + height) / canvas_h * 100:.2f}%)")
    print(f"hero-content: top {PAD_TOP / canvas_h * 100:.2f}% "
          f"height {height / canvas_h * 100:.2f}%")

    for name, box in (("tools/_edge_top.jpg", (0, 0, width, 470)),
                      ("tools/_edge_bottom.jpg", (0, canvas_h - 470, width, canvas_h))):
        crop = canvas.crop(box)
        crop.thumbnail((520, 420), Image.LANCZOS)
        crop.save(name, quality=88)


if __name__ == "__main__":
    main()

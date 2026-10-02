"""
Ismot scroll-experience asset pipeline (v4 - smooth fill + settle layer).

Reads assets/ismot-hero.jpg (master reference, 2477x3264) and produces:
  1. assets/base-empty.webp - "empty world": bottle, ISMOT letter strokes,
                              cards, nav, CTA, flowers and gold splashes
                              removed. Background filled with normalized-
                              convolution bokeh (above podium) and scanline
                              interpolation (wood/rock below).
  2. assets/layer-*.webp    - element layers cropped FROM the original image.
  3. assets/layers.js       - manifest (window.ISMOT_MANIFEST) incl. the
                              full-frame "settle" layer (the original photo
                              fades in at the very end => final frame is
                              pixel-identical to the source).
  4. tools/debug/*.jpg      - QA sheets.

Nothing is redesigned: every layer is a crop of the supplied photograph.
"""

import json
import os

import cv2
import numpy as np
from PIL import Image

SRC = "assets/ismot-hero.jpg"
OUT = "assets"
MW, MH = 2477, 3264

# ------------------------------------------------------------- definitions --

RECT_LAYERS = {  # name: (rect, z, phase, feather) - plate-style UI crops
    "nav-logo":        ((25, 10, 350, 200),     95, "nav",   10),
    "nav-about":       ((630, 50, 865, 155),    95, "nav",   10),
    "nav-benefits":    ((1030, 50, 1340, 155),  95, "nav",   10),
    "nav-ingredients": ((1485, 50, 1880, 155),  95, "nav",   10),
    "nav-cart":        ((2170, 45, 2300, 170),  95, "nav",   10),
    "nav-menu":        ((2300, 45, 2430, 170),  95, "nav",   10),
    "card-left":       ((140, 1410, 845, 1765), 80, "cards", 16),
    "card-right":      ((1610, 1435, 2325, 1820), 80, "cards", 16),
    "cta-order":       ((960, 3020, 1640, 3264), 90, "cta",  14),
    "typo-sprout":     ((1045, 210, 1405, 400), 61, "typo",  10),
}

LEAF_LAYERS = {
    "leaf-tr": ((2040, 110, 2477, 430),    5, "world"),
    "leaf-r":  ((2320, 1120, 2477, 1820),  5, "world"),
    "leaf-tl": ((0, 790, 245, 1310),       5, "world"),
    "leaf-bl": ((0, 2580, 400, 3264),      5, "world"),
    "leaf-br": ((2080, 2520, 2477, 3120),  5, "world"),
}

FLORA_LAYERS = {
    "flora-hibiscus": ((405, 2095, 1020, 2630),  75, "flora"),
    "flora-white":    ((1425, 2255, 1790, 2600), 75, "flora"),
}

TYPO_RECT = (170, 340, 2300, 1520)     # frosted ISMOT letter strokes
TYPO_RECT_FULL = (150, 300, 2320, 1560)  # full band removed from the base
GOLD_BAND = (560, 620, 1920, 2400)     # splash removal band (above podium)
SPLASH_BAND = (600, 1400, 1900, 2440)  # true splash zone (below letters)
CARD_RECTS = ((140, 1410, 845, 1765), (1610, 1435, 2325, 1820))

BOTTLE_POLY = [
    (1112, 738), (1338, 738), (1330, 980), (1302, 1010), (1302, 1140),
    (1396, 1245), (1396, 2505), (1042, 2505), (1042, 1245), (1136, 1140),
    (1136, 1010), (1118, 980),
]
BOTTLE_RECT = (1020, 715, 1420, 2530)
BOTTLE_Z, BOTTLE_PHASE = 70, "product"

PODIUM_TOP = 2300   # below this line: wood/rock -> scanline fill

# ------------------------------------------------------------------ helpers --


def clamp_rect(r):
    x0, y0, x1, y1 = r
    return (max(0, int(x0)), max(0, int(y0)),
            min(MW, int(x1)), min(MH, int(y1)))


def rect_mask(rect, feather=14):
    m = np.zeros((MH, MW), np.uint8)
    x0, y0, x1, y1 = clamp_rect(rect)
    m[y0:y1, x0:x1] = 255
    if feather:
        m = cv2.GaussianBlur(m, (feather * 2 + 1, feather * 2 + 1), 0)
    return m


def polygon_mask(poly, dilate=4, feather=9):
    m = np.zeros((MH, MW), np.uint8)
    cv2.fillPoly(m, [np.array(poly, np.int32)], 255)
    m = cv2.dilate(m, np.ones((dilate * 2 + 1, dilate * 2 + 1), np.uint8))
    m = cv2.GaussianBlur(m, (feather * 2 + 1, feather * 2 + 1), 0)
    return m


def letter_mask(rect):
    """Frosted ISMOT letters: bright + low-saturation strokes in window."""
    x0, y0, x1, y1 = clamp_rect(rect)
    hsv = cv2.cvtColor(src[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    m = np.uint8(((s < 135) & (v > 95)) * 255)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((11, 11), np.uint8))
    m = cv2.dilate(m, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 300:
            m[lab == i] = 0
    m = cv2.GaussianBlur(m, (9, 9), 0)
    full = np.zeros((MH, MW), np.uint8)
    full[y0:y1, x0:x1] = m
    return full


def gold_mask(band):
    """Golden oil/splash pixels inside band (for REMOVAL only)."""
    x0, y0, x1, y1 = clamp_rect(band)
    hsv = cv2.cvtColor(src[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    m = np.uint8(((h >= 12) & (h <= 38) & (s > 110) & (v > 140)) * 255)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.dilate(m, np.ones((7, 7), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m, 8)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] < 400:
            m[lab == i] = 0
    m = cv2.GaussianBlur(m, (11, 11), 0)
    full = np.zeros((MH, MW), np.uint8)
    full[y0:y1, x0:x1] = m
    return full


def scanline_fill(img_f32, mask):
    """Row-wise linear interpolation across masked runs (wood/rock)."""
    out = img_f32.copy()
    H, W = mask.shape
    ys, xs = np.where(mask > 0)
    if len(xs) == 0:
        return out
    for y in np.unique(ys):
        row = mask[y]
        xs_r = np.where(row > 0)[0]
        if len(xs_r) == 0:
            continue
        # split into runs
        splits = np.where(np.diff(xs_r) > 1)[0]
        runs = np.split(xs_r, splits + 1)
        for run in runs:
            a, b = run[0], run[-1]
            la = a - 1
            rb = b + 1
            ca = out[y, la] if la >= 0 else (out[y, rb] if rb < W else None)
            cb = out[y, rb] if rb < W else ca
            if ca is None:
                continue
            t = np.linspace(0.0, 1.0, b - a + 1, dtype=np.float32)[:, None]
            out[y, a:b + 1] = ca[None, :] * (1 - t) + cb[None, :] * t
    return out


def normalized_conv_fill(img_f32, hole_bool, sigmas=(40, 90, 160)):
    """Mask-aware multi-scale blur fill (bokeh-friendly).

    hole_bool: HxW boolean array, True where pixels must be filled.
    Every pixel is estimated at several blur scales; estimates are averaged
    weighted by the local known-pixel fraction at that scale.
    """
    hole_bool = np.asarray(hole_bool, dtype=bool)
    keep = (~hole_bool).astype(np.float32)
    img_known = img_f32 * keep[..., None]
    est_total = np.zeros_like(img_f32)
    w_total = np.zeros(img_f32.shape[:2], np.float32)
    for sigma in sigmas:
        w = cv2.GaussianBlur(keep, (0, 0), sigma)
        num = cv2.GaussianBlur(img_known, (0, 0), sigma)
        est = num / np.maximum(w, 1e-4)[..., None]
        conf = w * w  # trust scales with strong local support more
        est_total += est * conf[..., None]
        w_total += conf
    fill = est_total / np.maximum(w_total, 1e-4)[..., None]
    return img_f32 * keep[..., None] + fill * (1 - keep)[..., None]


def save_layer(mask, rect, name, z, phase, mode, src_img=None):
    x0, y0, x1, y1 = clamp_rect(rect)
    img = src_img if src_img is not None else src
    bgr = img[y0:y1, x0:x1]
    alpha = mask[y0:y1, x0:x1]
    rgba = np.dstack([bgr[:, :, ::-1], alpha])
    Image.fromarray(rgba, "RGBA").save(
        os.path.join(OUT, f"layer-{name}.webp"), "WEBP", quality=88, method=4)
    return {"name": name, "x": x0, "y": y0, "w": x1 - x0, "h": y1 - y0,
            "path": f"assets/layer-{name}.webp", "z": z, "phase": phase,
            "mode": mode}


# ----------------------------------------------------------------- pipeline --

src = cv2.imread(SRC, IMREAD := cv2.IMREAD_COLOR)
if src is None:
    raise SystemExit(f"cannot read {SRC}")
print("source:", src.shape)

entries, masks = [], {}

# bottle ---------------------------------------------------------------------
bottle_mask = polygon_mask(BOTTLE_POLY)
# hibiscus petals overlap the bottle's bottom-left corner: make red pixels
# transparent in the LAYER so the flower does not travel with the bottle
bx0, by0, bx1, by1 = clamp_rect(BOTTLE_RECT)
sub = cv2.cvtColor(src[by0:by1, bx0:bx1], cv2.COLOR_BGR2HSV)
hh, ss, vv = cv2.split(sub)
red = (((hh < 12) | (hh > 172)) & (ss > 95) & (vv > 55))
red[: 2050 - by0, :] = False          # only the lower-left corner zone
red[:, 1200 - bx0:] = False
bm_sub = bottle_mask[by0:by1, bx0:bx1].copy()
bm_sub[red] = 0
bm_sub = cv2.GaussianBlur(bm_sub, (5, 5), 0)
bottle_mask[by0:by1, bx0:bx1] = bm_sub
masks["bottle"] = bottle_mask
entries.append(save_layer(bottle_mask, BOTTLE_RECT, "bottle",
                          BOTTLE_Z, BOTTLE_PHASE, "poly"))

# frosted ISMOT letter strokes ------------------------------------------------
# LAYER = letter strokes only (for the fade-in)
typo_mask = letter_mask(TYPO_RECT)
hole = cv2.dilate(bottle_mask, np.ones((21, 21), np.uint8))
typo_mask = cv2.bitwise_and(typo_mask, cv2.bitwise_not(hole))
masks["typo-ismot"] = typo_mask
entries.append(save_layer(typo_mask, TYPO_RECT, "typo-ismot", 60, "typo",
                          "letters"))


# plate-style rect layers ------------------------------------------------------
for name, (rect, z, phase, feather) in RECT_LAYERS.items():
    m = rect_mask(rect, feather)
    if name == "typo-sprout":
        m = cv2.bitwise_and(m, cv2.bitwise_not(hole))
    masks[name] = m
    entries.append(save_layer(m, rect, name, z, phase, "rect"))

# gold splash removal band (no layer: splashes come via the settle layer) ------
gold = gold_mask(GOLD_BAND)
gold = cv2.bitwise_and(gold, cv2.bitwise_not(hole))
masks["gold-splash"] = gold

# foreground leaves + flora STAY in the base (part of the supplied first
# frame). Ambient life comes from particles / rays / sparkles / micro-dolly.
keep_names = set(LEAF_LAYERS) | set(FLORA_LAYERS)

# splash stream layers cut from the original (animate 45-60%)
gold = cv2.bitwise_and(gold_mask(GOLD_BAND), cv2.bitwise_not(hole))
splash_zone = rect_mask(SPLASH_BAND, feather=24)
for cr in CARD_RECTS:
    splash_zone = cv2.bitwise_and(splash_zone,
                                  cv2.bitwise_not(rect_mask(cr, 8)))
splash_zone = cv2.bitwise_and(splash_zone,
                              cv2.bitwise_not(cv2.dilate(typo_mask,
                                              np.ones((7, 7), np.uint8))))
splash = cv2.bitwise_and(gold, splash_zone)
splash_l = splash.copy()
splash_l[:, 1020:] = 0
splash_r = splash.copy()
splash_r[:, :1420] = 0
masks["splash-left"], masks["splash-right"] = splash_l, splash_r
entries.append(save_layer(splash_l, SPLASH_BAND, "splash-left", 40, "oil",
                          "gold"))
entries.append(save_layer(splash_r, SPLASH_BAND, "splash-right", 40, "oil",
                          "gold"))

# removal mask: everything the EMPTY WORLD must not contain -------------------
removal = np.zeros((MH, MW), np.uint8)
for name, m in masks.items():
    if name in keep_names or name in ("splash-left", "splash-right"):
        continue
    hard = (m > 8).astype(np.uint8) * 255
    hard = cv2.dilate(hard, np.ones((7, 7), np.uint8))
    removal = cv2.bitwise_or(removal, hard)

print("removal coverage: %.3f%%" % (100.0 * (removal > 8).mean()))
# 1) scanline fill below podium top (wood / rock) -----------------------------
src_f = src.astype(np.float32)
below = np.zeros((MH, MW), np.uint8)
below[PODIUM_TOP:, :] = 255
mask_wood = cv2.bitwise_and(removal, below)
mask_sky = cv2.bitwise_and(removal, cv2.bitwise_not(below))
print("scanline fill (wood/rock) ...")
wood_filled = scanline_fill(src_f, mask_wood > 8)

# 2) normalized-convolution bokeh fill above podium ---------------------------
print("normalized-convolution bokeh fill ...")
sky_filled = normalized_conv_fill(wood_filled, mask_sky > 8)

# 3) blend: filled only where removed (feathered) -----------------------------
soft = cv2.GaussianBlur(removal, (31, 31), 0).astype(np.float32) / 255.0
base = src_f * (1 - soft[..., None]) + sky_filled * soft[..., None]

# homogenizing blur inside busy fill zones (typo band, bottle column, cards)
for rect, sigma, feather in (((150, 300, 2320, 1500), 30, 60),
                            ((975, 690, 1470, 2570), 26, 50),
                            ((110, 1380, 875, 1795), 12, 30),
                            ((1580, 1405, 2355, 1850), 12, 30),
                            ((0, 0, 2477, 230), 10, 30)):
    zm = rect_mask(rect, feather).astype(np.float32) / 255.0
    zb = cv2.GaussianBlur(base, (0, 0), sigma)
    base = base * (1 - zm[..., None]) + zb * zm[..., None]

# rebuild the bottle column interior. Above the flowers: mirror real bokeh
# from the side strips (keeps realistic structure). Near the flowers:
# per-row interpolation with clean-side swap. Below: rock repair.
colL, colR, colT, colB = 1010, 1432, 300, 2300
wcol = colR - colL

# --- bokeh zone (colT .. 2050): mirrored side blocks, cross-faded -------
bT, bB = colT, 2050
left_blk = base[bT:bB, colL - wcol:colL][:, ::-1].copy()
right_blk = base[bT:bB, colR:colR + wcol].copy()
fade_lr = np.linspace(0.45, 0.55, wcol, dtype=np.float32)[None, :, None]
bokeh_fill = left_blk * (1 - fade_lr) + right_blk * fade_lr
bokeh_fill = cv2.GaussianBlur(bokeh_fill, (0, 0), sigmaX=18, sigmaY=12)

# --- flower zone (1960 .. colB, overlaps bokeh seam): row interpolation --
ls0, ls1 = 972, 1006
rs0, rs1 = 1436, 1470
L = cv2.blur(base[:, ls0:ls1].mean(axis=1), (1, 9))
R = cv2.blur(base[:, rs0:rs1].mean(axis=1), (1, 9))
Lr, Lg = L[:, 2], L[:, 1]
Rr, Rg = R[:, 2], R[:, 1]
bad_L = ((Lr > Lg * 1.35) & (Lr > 60)) | ((Lr > 150) & (Lg > 150) & (L[:, 0] > 130))
bad_R = ((Rr > Rg * 1.35) & (Rr > 60)) | ((Rr > 150) & (Rg > 150) & (R[:, 0] > 130))
Ls = np.where(bad_L[:, None], R, L)
Rs = np.where(bad_R[:, None], L, R)
tt = np.linspace(0.0, 1.0, wcol, dtype=np.float32)[None, :, None]
row_fill = Ls[1960:colB, None, :] * (1 - tt) + Rs[1960:colB, None, :] * tt
row_fill = cv2.GaussianBlur(row_fill, (0, 0), sigmaX=20, sigmaY=16)

# assemble with a vertical crossfade at the bokeh/row seam (2050)
xf = 90
bkh = bokeh_fill.shape[0]                      # rows of bokeh_fill
mix = np.linspace(0.0, 1.0, xf, dtype=np.float32)[:, None, None]
colfill = np.vstack([
    bokeh_fill[:bkh - xf],
    bokeh_fill[bkh - xf:] * (1 - mix) + row_fill[:xf] * mix,
    row_fill[xf:],
])
cz2 = rect_mask((colL - 8, colT - 8, colR + 8, colB + 8),
                feather=90).astype(np.float32) / 255.0
cz3 = cz2[colT:colB, colL:colR][..., None]
region = base[colT:colB, colL:colR]
base[colT:colB, colL:colR] = (region * (1 - cz3) + colfill * cz3)
print("column rebuilt: bokeh mirror + row interp")

# repair the rock face below the bottle base: horizontal interpolation
by0, by1, bx0, bx1 = 2300, 2560, 1012, 1428
lm = base[by0:by1, 982:1008].mean(axis=1, keepdims=True)
rm = base[by0:by1, 1432:1458].mean(axis=1, keepdims=True)
# rows whose left reference is reddish (hibiscus) use the right ref twice
lh = cv2.cvtColor(lm.astype(np.uint8)[:, :, ::-1], cv2.COLOR_RGB2HSV)
reddish = ((lh[:, :, 0] < 12) | (lh[:, :, 0] > 172)) & (lh[:, :, 1] > 80)
lm2 = np.where(reddish[..., None], rm, lm)
t = np.linspace(0.0, 1.0, bx1 - bx0, dtype=np.float32)[None, :, None]
band = cv2.GaussianBlur(lm2 * (1 - t) + rm * t, (0, 0), 5)
fade = rect_mask((bx0, by0, bx1, by1), feather=40).astype(np.float32) / 255.0
band_soft = fade[by0:by1, bx0:bx1][..., None]
region = base[by0:by1, bx0:bx1]
base[by0:by1, bx0:bx1] = region * (1 - band_soft) + band * band_soft

# 4b) ghost sweep: any leftover letter-frost pixels in the typo band are
# inpainted (thin strokes fill cleanly) and the band is re-smoothed
base = np.clip(base, 0, 255).astype(np.uint8)
x0, y0, x1, y1 = clamp_rect(TYPO_RECT)
hsv2 = cv2.cvtColor(base[y0:y1, x0:x1], cv2.COLOR_BGR2HSV)
h2, s2, v2 = cv2.split(hsv2)
g2 = np.uint8(((s2 < 135) & (v2 > 95)) * 255)
g2 = cv2.morphologyEx(g2, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
g2 = cv2.dilate(g2, np.ones((11, 11), np.uint8))
n2, lab2, stats2, _ = cv2.connectedComponentsWithStats(g2, 8)
for i in range(1, n2):
    if stats2[i, cv2.CC_STAT_AREA] < 700:
        g2[lab2 == i] = 0
if g2.any():
    full_g = np.zeros((MH, MW), np.uint8)
    full_g[y0:y1, x0:x1] = g2
    base = cv2.inpaint(base, full_g, 9, cv2.INPAINT_TELEA)
    zm = rect_mask(TYPO_RECT_FULL, feather=60).astype(np.float32) / 255.0
    zb = cv2.GaussianBlur(base, (0, 0), 30)
    base = base * (1 - zm[..., None]) + zb * zm[..., None]
    print("ghost sweep: removed %d leftover components" % (n2 - 1))

# 5) faint grain in filled areas ----------------------------------------------
rng = np.random.default_rng(7)
noise = rng.normal(0, 2.2, (MH, MW, 1)).astype(np.float32)
base = np.clip(base + noise * (removal > 8)[..., None], 0, 255).astype(np.uint8)

print("base vs src max diff:",
      int(np.abs(base.astype(np.int16) - src.astype(np.int16)).max()))

Image.fromarray(base[:, :, ::-1]).save(os.path.join(OUT, "base-empty.webp"),
                                       "WEBP", quality=85, method=4)
print("base-empty.webp written")

# settle layer = the complete original photograph, minus the CTA region
# (the Order Now button animates in separately on top of it)
settle_rgba = np.dstack([src[:, :, ::-1], np.full((MH, MW), 255, np.uint8)])
cta_hole = 255 - rect_mask(RECT_LAYERS["cta-order"][0], feather=14)
settle_rgba[..., 3] = np.minimum(settle_rgba[..., 3], cta_hole)
Image.fromarray(settle_rgba, "RGBA").save(
    os.path.join(OUT, "settle.webp"), "WEBP", quality=90, method=4)
entries.append({"name": "settle-full", "x": 0, "y": 0, "w": MW, "h": MH,
                "path": "assets/settle.webp", "z": 200,
                "phase": "settle", "mode": "full"})
print("settle.webp written")

# manifest --------------------------------------------------------------------
entries.sort(key=lambda e: e["z"])
manifest = {"master": {"w": MW, "h": MH}, "base": "assets/base-empty.webp",
            "layers": entries}
with open(os.path.join(OUT, "layers.js"), "w", encoding="utf-8") as f:
    f.write("window.ISMOT_MANIFEST = ")
    f.write(json.dumps(manifest, separators=(",", ":")))
    f.write(";\n")
print("layers.js written:", len(entries), "layers")

# debug sheets ----------------------------------------------------------------
dbg = "tools/debug"
os.makedirs(dbg, exist_ok=True)
for label, m in (("typo", typo_mask), ("gold", gold), ("removal", removal)):
    vis = cv2.addWeighted(src, 0.45, cv2.cvtColor(m, cv2.COLOR_GRAY2BGR),
                          0.55, 0)
    cv2.imwrite(os.path.join(dbg, f"mask_{label}.jpg"),
                cv2.resize(vis, (640, 844), interpolation=cv2.INTER_AREA),
                [cv2.IMWRITE_JPEG_QUALITY, 88])
cv2.imwrite(os.path.join("tools", "base_preview.jpg"),
            cv2.resize(base, (700, 922), interpolation=cv2.INTER_AREA),
            [cv2.IMWRITE_JPEG_QUALITY, 88])
print("debug sheets written")

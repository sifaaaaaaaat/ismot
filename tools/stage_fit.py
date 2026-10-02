# Stage fit model, derived from the measured ink footprint of bottle.webp (12deg tilt).
# art height hh = 0.86 * stage, art box centred on the stage, stage centred in the viewport.
# All ink extents below are relative to the ART'S CENTRE, in units of hh:
#   global: left -0.2207 (=-0.0814 box-left offset - 0.1393 half-width), right +0.1607
#   top   : art box top + 0.0157
#   per-band left (fraction of the art box height, from the top):
BANDS = [(0.30, -0.0879), (0.40, -0.1093), (0.50, -0.1293), (0.60, -0.1507), (0.70, -0.1722), (0.80, -0.1950)]
INK_L_G, INK_R_G, INK_TOP = -0.2207, 0.1607, 0.0157
NAV_BOTTOM = 76
COL_INSET, COL_W_MAX = 56, 420
COPY_INSET, COPY_W_MAX = 44, 470

def stage(w, h):
    return max(0.0, min(0.9 * min(w, h), 720.0, 96.0 * h / 100.0 - 186.0, max(420.0, 3.6 * w - 3560.0)))

def band_left(f):
    if f <= BANDS[0][0]: return BANDS[0][1]
    if f >= BANDS[-1][0]: return BANDS[-1][1]
    for (f0, v0), (f1, v1) in zip(BANDS, BANDS[1:]):
        if f0 <= f <= f1:
            return v0 + (f - f0) / (f1 - f0) * (v1 - v0)
    return BANDS[-1][1]

def report(w, h):
    s = stage(w, h)
    hh = 0.86 * s
    stage_top = (h - s) / 2.0
    art_top = stage_top + 0.4 * s - hh / 2.0          # art box top edge
    cx = w / 2.0
    ink_top = art_top + INK_TOP * hh
    ink_r = cx + INK_R_G * hh
    # the copy's band: left column top (30% of the section) plus the headline block
    f = ((0.30 * h + 65) - art_top) / hh
    ink_l_copy = cx + band_left(min(max(f, 0.30), 0.80)) * hh
    copy_right = COPY_INSET + min(0.48 * w, COPY_W_MAX)
    col_left = w - COL_INSET - min(0.4 * w, COL_W_MAX)
    nav, copy, col = ink_top - NAV_BOTTOM, ink_l_copy - copy_right, col_left - ink_r
    verdict = "OK" if min(nav, copy, col) >= 0 else "OVERLAP " + ",".join(n for n, v in (("nav", nav), ("copy", copy), ("col", col)) if v < 0)
    print(f"{w:5.0f}x{h:<5.0f} stage={s:6.1f}  under-nav={nav:6.1f}  to-copy={copy:6.1f}  to-column={col:6.1f}   {verdict}")

print("size          stage    under-nav   to-copy   to-right-col   verdict   (all clearances in px)")
for w, h in [(1920,1080),(1900,790),(1700,900),(1600,900),(1440,900),(1366,768),(1280,960),(1280,860),(1280,700),(1200,900),(1150,900),(1100,900),(1050,900),(1024,768),(900,800)]:
    report(w, h)

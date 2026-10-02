from PIL import Image
import numpy as np

SRC = r"C:\users\ashik.desktop-8g94b1d\OneDrive\Pictures\Camera Roll\Screenshots\Screenshot 2026-10-02 005638.png"
im = Image.open(SRC).convert("RGB")
W, H = im.size
a = np.asarray(im).astype(np.int16)
maxc = a.max(axis=2)
green = (maxc < 130) & (a[:, :, 1] > a[:, :, 0] + 8) & (a[:, :, 1] > a[:, :, 2] + 8)

for name, x0, x1 in [("RIGHT", int(W * 0.52), W), ("LEFT", 0, int(W * 0.42))]:
    m = green[:, x0:x1]
    rows = np.nonzero(m.sum(axis=1) > 2)[0]
    print(f"\n{name} dark-green rows (x window {x0}..{x1}):")
    if not len(rows):
        continue
    start = prev = rows[0]
    for r in list(rows[1:]) + [10**9]:
        if r > prev + 5:
            band = m[start : prev + 1]
            cols = np.nonzero(band.sum(axis=0) > 0)[0] + x0
            print(f"  y {start:4d}..{prev:4d}  x {cols.min():4d}..{cols.max():4d}  (h={prev-start+1})")
            start = r
        prev = r

# right guide stroke: x@y from the fit  x = 1174.5 - 0.268*(y-223)
print("\nright stroke x at feature rows:")
for y in (250, 330, 430, 500, 560, 640):
    print(f"  y={y}: stroke_x={1174.5 - 0.268*(y-223):.0f}")
print("\nleft stroke x at left rows:  x = 838.7 - 0.292*(y-158)")
for y in (280, 340, 400, 510, 610):
    print(f"  y={y}: stroke_x={838.7 - 0.292*(y-158):.0f}")

from PIL import Image
import numpy as np
from collections import deque

SRC = r"C:\users\ashik.desktop-8g94b1d\OneDrive\Pictures\Camera Roll\Screenshots\Screenshot 2026-10-02 005638.png"
im = Image.open(SRC).convert("RGB")
W, H = im.size
a = np.asarray(im).astype(np.int16)
maxc = a.max(axis=2)
minc = a.min(axis=2)
print("size", W, H)
black = (maxc < 55) & ((maxc - minc) < 25)
print("black px", int(black.sum()))

pts = set(zip(*np.nonzero(black)))  # (y,x)


def comps(pts):
    seen = set()
    out = []
    for p in pts:
        if p in seen:
            continue
        q = deque([p])
        seen.add(p)
        cur = []
        while q:
            y, x = q.popleft()
            cur.append((y, x))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    n = (y + dy, x + dx)
                    if n in pts and n not in seen:
                        seen.add(n)
                        q.append(n)
        out.append(cur)
    return out


cs = comps(pts)
cs.sort(key=len, reverse=True)
print("components", len(cs))
for c in cs[:8]:
    yy = np.array([p[0] for p in c])
    xx = np.array([p[1] for p in c])
    if len(c) < 600:
        continue
    A = np.polyfit(yy, xx, 1)
    y0, y1 = int(yy.min()), int(yy.max())
    slope = float(A[0])
    import math
    print(
        f"n={len(c):6d} y={y0:4d}..{y1:4d} x@top={np.polyval(A,y0):7.1f} x@bot={np.polyval(A,y1):7.1f} "
        f"slope={slope:+.3f} ({math.degrees(math.atan(slope)):+.1f}deg off vertical) "
        f"xrange={xx.min()}..{xx.max()}"
    )

# text rows in the left half: dark green text mask
green_dark = (maxc < 110) & (a[:, :, 1] > a[:, :, 0] + 8) & (a[:, :, 1] > a[:, :, 2] + 8)
left = green_dark[:, : int(W * 0.42)]
rows = np.nonzero(left.sum(axis=1) > 3)[0]
print("\nleft dark-green text rows:")
if len(rows):
    start = rows[0]
    prev = rows[0]
    for r in rows[1:]:
        if r > prev + 4:
            band = left[start : prev + 1]
            cols = np.nonzero(band.sum(axis=0) > 0)[0]
            print(f"  y {start:4d}..{prev:4d}  x {cols.min():4d}..{cols.max():4d}")
            start = r
        prev = r
    band = left[start : prev + 1]
    cols = np.nonzero(band.sum(axis=0) > 0)[0]
    print(f"  y {start:4d}..{prev:4d}  x {cols.min():4d}..{cols.max():4d}")

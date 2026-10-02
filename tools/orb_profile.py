from PIL import Image
import numpy as np
im = Image.open("ismot-next/public/circle-white.webp").convert("RGBA")
a = np.array(im)
h, w = a.shape[:2]
alpha = a[:, :, 3].astype(float) / 255.0
cy, cx = (h - 1) / 2, (w - 1) / 2
print(f"orb canvas {w}x{h}")
ys, xs = np.mgrid[0:h, 0:w]
r = np.sqrt((xs - cx) ** 2 + (ys - cy) ** 2) / (min(w, h) / 2.0)
print("radius (fraction of half-size) -> alpha, and white-over-background at 55% opacity")
for rr in (0.5, 0.6, 0.7, 0.75, 0.8, 0.825, 0.85, 0.9, 0.95, 1.0):
    m = (r >= rr - 0.01) & (r <= rr + 0.01)
    if m.sum():
        al = alpha[m].mean()
        print(f"  r={rr:.3f}  alpha={al:5.3f}   effective white coverage at 0.55 = {al * 0.55 * 100:5.1f}%")

"""Probe base-empty quality: pixel diffs vs source + close-up crop sheet."""
import cv2
import numpy as np

src = cv2.imread("assets/ismot-hero.jpg")
base = cv2.imread("assets/base-empty.webp")

regions = {
    "card-left":  (170, 1440, 815, 1735),
    "card-right": (1640, 1465, 2295, 1790),
    "cta-order":  (1000, 3055, 1600, 3245),
    "nav-mid":    (600, 30, 1900, 170),
    "bottle":     (1000, 700, 1450, 2560),
    "hibiscus":   (405, 2095, 1020, 2630),
}

tiles = []
for name, (x0, y0, x1, y1) in regions.items():
    s = src[y0:y1, x0:x1]
    b = base[y0:y1, x0:x1]
    diff = np.abs(s.astype(np.int16) - b.astype(np.int16)).mean()
    print(f"{name:12s} mean|diff|={diff:6.2f}")
    h = 260
    sw = int(s.shape[1] * h / s.shape[0])
    bw = int(b.shape[1] * h / b.shape[0])
    s = cv2.resize(s, (sw, h))
    b = cv2.resize(b, (bw, h))
    gap = np.full((h, 6, 3), 255, np.uint8)
    tiles.append(np.hstack([s, gap, b]))

w = max(t.shape[1] for t in tiles)
tiles = [cv2.copyMakeBorder(t, 0, 0, 0, w - t.shape[1], cv2.BORDER_CONSTANT,
                            value=(30, 30, 30)) for t in tiles]
sheet = np.vstack(tiles)
cv2.imwrite("tools/probe_crops.jpg", sheet, [cv2.IMWRITE_JPEG_QUALITY, 90])
print("tools/probe_crops.jpg", sheet.shape)

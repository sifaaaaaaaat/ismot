from PIL import Image
import numpy as np

im = Image.open("ismot-next/public/bottle.webp").convert("RGBA")
a = np.array(im)
h, w = a.shape[0], a.shape[1]
alpha = a[:, :, 3]
rows = np.where(alpha.max(axis=1) > 8)[0]
cols = np.where(alpha.max(axis=0) > 8)[0]
print(f"canvas {w}x{h}  ink bbox x:{cols.min()}..{cols.max()} y:{rows.min()}..{rows.max()}")
print(f"ink w={cols.max()-cols.min()+1} h={rows.max()-rows.min()+1}  -> uw={((cols.max()-cols.min()+1)/h):.4f} uh={((rows.max()-rows.min()+1)/h):.4f}")

# rotate the art by 12 deg (as the CSS does) with a transparent pad, then re-measure ink
deg = 12
pad = int(h * 1.2)
canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0))
canvas.paste(im, (pad, pad), im)
rot = canvas.rotate(-deg, resample=Image.BICUBIC, expand=False)  # CSS rotate(+12deg) = clockwise
ra = np.array(rot)[:, :, 3]
rrows = np.where(ra.max(axis=1) > 8)[0]
rcols = np.where(ra.max(axis=0) > 8)[0]
rw = rcols.max() - rcols.min() + 1
rh = rrows.max() - rrows.min() + 1
print(f"rotated ink  w={rw} h={rh}  -> w/h={rw/h:.4f}  (as fraction of art height)")
# ink extents relative to the *unrotated* art box, after rotation
# art box occupies [pad, pad+h] vertically; ink rows relative to the box top
top_rel = (rrows.min() - pad) / h
bot_rel = (rrows.max() - pad) / h
left_rel = (rcols.min() - pad) / h
right_rel = (rcols.max() - pad) / h
print(f"relative to art box (fractions of art height): top={top_rel:.4f} bottom={bot_rel:.4f} left={left_rel:.4f} right={right_rel:.4f}")

# where is the ink at a given fraction of the art height (horizontal extents per band)?
print("\nink half-widths as fraction of art height, per vertical band of the art box:")
for f in (0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90, 1.00):
    y = int(pad + f * h) - 1
    if 0 <= y < ra.shape[0]:
        band = np.where(ra[y] > 8)[0]
        if len(band):
            l, r = band.min() - pad, band.max() - pad
            print(f"  y={f:.2f}h  x from {l/h:+.4f}h to {r/h:+.4f}h  (width {((r-l)/h):.4f}h)")

"""Overlay a labeled coordinate grid on the master photo for measuring rects."""
import cv2

SRC = "assets/ismot-hero.jpg"
img = cv2.imread(SRC)
H, W = img.shape[:2]
print("master:", W, "x", H)

step, label_step = 100, 200
for x in range(0, W, step):
    c = (0, 0, 255) if x % label_step == 0 else (0, 255, 255)
    w = 2 if x % label_step == 0 else 1
    cv2.line(img, (x, 0), (x, H), c, w, cv2.LINE_AA)
for y in range(0, H, step):
    c = (0, 0, 255) if y % label_step == 0 else (0, 255, 255)
    w = 2 if y % label_step == 0 else 1
    cv2.line(img, (0, y), (W, y), c, w, cv2.LINE_AA)

for x in range(0, W, label_step):
    for y in range(0, H, label_step):
        cv2.putText(img, f"{x},{y}", (x + 4, y + 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 3, cv2.LINE_AA)
        cv2.putText(img, f"{x},{y}", (x + 4, y + 22),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 1, cv2.LINE_AA)

cv2.imwrite("tools/grid_overlay.jpg", img, [cv2.IMWRITE_JPEG_QUALITY, 90])
print("tools/grid_overlay.jpg written")

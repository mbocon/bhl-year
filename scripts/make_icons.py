"""Generate app icons: dark green rounded square with a white barbell glyph. Requires Pillow."""
from PIL import Image, ImageDraw

BG = (15, 42, 31)
FG = (255, 255, 255)

def icon(size, pad_frac=0.0, rounded=True):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    r = int(size * 0.22) if rounded else 0
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG)
    pad = int(size * pad_frac)
    inner = size - 2 * pad
    cx = cy = size // 2
    bar_h = max(2, int(inner * 0.07))
    bar_w = int(inner * 0.72)
    d.rounded_rectangle([cx - bar_w // 2, cy - bar_h // 2, cx + bar_w // 2, cy + bar_h // 2], radius=bar_h // 2, fill=FG)
    plate_w = int(inner * 0.09)
    for sgn in (-1, 1):
        for i, (ph, gap) in enumerate([(0.38, 0.0), (0.28, 0.11)]):
            h = int(inner * ph)
            x0 = cx + sgn * (bar_w // 2 - int(inner * gap)) - plate_w // 2
            d.rounded_rectangle([x0, cy - h // 2, x0 + plate_w, cy + h // 2], radius=plate_w // 3, fill=FG)
    return img

icon(192).save("icons/icon-192.png", optimize=True)
icon(512).save("icons/icon-512.png", optimize=True)
icon(512, pad_frac=0.2, rounded=False).save("icons/maskable-512.png", optimize=True)
print("icons written")

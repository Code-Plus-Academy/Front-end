from PIL import Image
import collections

img = Image.open("public/notes-arena-logo.png").convert("RGBA")
pixels = img.getdata()

opaque_pixels = [p for p in pixels if p[3] > 0]
if not opaque_pixels:
    print("No opaque pixels found!")
else:
    print(f"Total opaque pixels: {len(opaque_pixels)}")
    # compute average RGB
    r = sum(p[0] for p in opaque_pixels) // len(opaque_pixels)
    g = sum(p[1] for p in opaque_pixels) // len(opaque_pixels)
    b = sum(p[2] for p in opaque_pixels) // len(opaque_pixels)
    print(f"Average Color: RGB({r}, {g}, {b})")

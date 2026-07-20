import sys
from PIL import Image

def main():
    try:
        img = Image.open("public/notes-arena-logo.png")
        print("Format:", img.format)
        print("Size:", img.size)
        print("Mode:", img.mode)
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Check if there is any transparent pixel
            alpha = img.convert('RGBA').split()[-1]
            extrema = alpha.getextrema()
            print("Alpha extrema:", extrema)
            if extrema[0] < 255:
                print("Image has transparency!")
            else:
                print("Image has alpha channel but no transparent pixels (fully opaque).")
        else:
            print("Image has no alpha channel (fully opaque).")
    except Exception as e:
        print("Error:", e)

if __name__ == '__main__':
    main()

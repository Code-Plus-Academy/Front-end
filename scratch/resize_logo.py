from PIL import Image

img = Image.open("public/notes-arena-logo.png")
# Target width 600px, calculate height maintaining aspect ratio
target_width = 600
aspect_ratio = img.height / img.width
target_height = int(target_width * aspect_ratio)

resized_img = img.resize((target_width, target_height), Image.Resampling.LANCZOS)
resized_img.save("public/notes-arena-logo.png", "PNG", optimize=True)
print(f"Resized image from {img.size} to {resized_img.size}")

from pathlib import Path
import subprocess
import sys

try:
    from PIL import Image
except ImportError:
    subprocess.check_call([sys.executable, '-m', 'pip', 'install', 'pillow', '-q'])
    from PIL import Image

src = Path(r'C:\Users\Stephen Mola\.cursor\projects\c-Users-Stephen-Mola-Desktop-projects-uthabiti-mamaplus-mobile\assets')
dst = Path(r'c:\Users\Stephen Mola\Desktop\projects\uthabiti\mamaplus-mobile\assets')

# Copy generated brand icons into Expo asset paths
Image.open(src / 'mamaplus-app-icon.png').convert('RGBA').resize((1024, 1024)).save(dst / 'icon.png')
Image.open(src / 'mamaplus-icon-foreground.png').convert('RGBA').resize((1024, 1024)).save(
    dst / 'android-icon-foreground.png'
)
Image.open(src / 'mamaplus-app-icon.png').convert('RGBA').resize((1024, 1024)).save(dst / 'splash-icon.png')

# Solid cream adaptive background
Image.new('RGBA', (1024, 1024), (255, 248, 245, 255)).save(dst / 'android-icon-background.png')

# Monochrome layer for Android themed icons
fg = Image.open(dst / 'android-icon-foreground.png').convert('RGBA')
mono = Image.new('RGBA', (1024, 1024), (0, 0, 0, 0))
pixels = fg.load()
out = mono.load()
for y in range(1024):
    for x in range(1024):
        r, g, b, a = pixels[x, y]
        if a > 20 and (r + g + b) < 700:
            out[x, y] = (255, 255, 255, a)
mono.save(dst / 'android-icon-monochrome.png')

print('icons written')
for name in [
    'icon.png',
    'android-icon-foreground.png',
    'android-icon-background.png',
    'android-icon-monochrome.png',
    'splash-icon.png',
]:
    path = dst / name
    print(name, path.stat().st_size, Image.open(path).size)

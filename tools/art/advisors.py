# Піксельні аватарки радників (32×32, 2 кадри: рот закритий/відкритий) → assets/ui/advisors.png (рядок = радник)
from PIL import Image, ImageDraw
import os
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
ADV = [  # id, шкіра, волосся, стиль, одяг, акцент, аксесуар
  ('econ',  '#e9b896', '#2b2220', 'short',  '#4a5160', '#c2303c', 'glasses'),
  ('mil',   '#d9a27c', '#3a2a1e', 'short',  '#55663a', '#ffd34d', 'cap'),
  ('dipl',  '#f0c9a8', '#e8c45a', 'bun',    '#1f2f5a', '#f4f4f0', 'pearls'),
  ('sci',   '#e3b08e', '#e4e4e4', 'bald',   '#f2f2f2', '#3f7fd0', 'glasses'),
  ('infra', '#c98a64', '#5a2e1c', 'long',   '#ff8a2e', '#ffd34d', 'helmet'),
  ('intern','#e7b591', '#6b4226', 'short',  '#2e6b4a', '#c7d0da', 'beard'),
]
S = 32
def hexc(h): return tuple(int(h[i:i+2], 16) for i in (1, 3, 5)) + (255,)
def outline(img):
    px = img.load(); w, h = img.size; out = img.copy(); po = out.load()
    for y in range(h):
        for x in range(w):
            if px[x, y][3] == 0 and any(0 <= x+dx < w and 0 <= y+dy < h and px[x+dx, y+dy][3] > 0 for dx, dy in ((1,0),(-1,0),(0,1),(0,-1))):
                po[x, y] = (18, 14, 20, 255)
    return out
def draw(a, mouth):
    _, skin, hair, style, cloth, acc, extra = a
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    sk, hr, cl, ac = hexc(skin), hexc(hair), hexc(cloth), hexc(acc)
    shade = tuple(max(0, c - 40) for c in sk[:3]) + (255,)
    # тулуб
    d.rectangle([5, 25, 26, 31], fill=cl); d.rectangle([4, 27, 27, 31], fill=cl)
    d.polygon([(13, 24), (18, 24), (16, 29)], fill=(244, 244, 240, 255)); d.line([(16, 25), (16, 30)], fill=ac)
    d.rectangle([13, 21, 18, 24], fill=shade)  # шия
    # голова
    d.ellipse([9, 7, 22, 23], fill=sk); d.point([(8, 15), (23, 15)], fill=sk)
    # волосся
    if style == 'short': d.chord([8, 5, 23, 16], 180, 360, fill=hr); d.rectangle([8, 10, 9, 15], fill=hr); d.rectangle([22, 10, 23, 14], fill=hr)
    if style == 'bun': d.chord([8, 5, 23, 17], 180, 360, fill=hr); d.ellipse([12, 1, 19, 7], fill=hr); d.rectangle([8, 10, 9, 17], fill=hr); d.rectangle([22, 10, 23, 17], fill=hr)
    if style == 'long': d.chord([8, 5, 23, 16], 180, 360, fill=hr); d.rectangle([7, 10, 9, 24], fill=hr); d.rectangle([22, 10, 24, 24], fill=hr)
    if style == 'bald': d.rectangle([8, 12, 9, 17], fill=hr); d.rectangle([22, 12, 23, 17], fill=hr); d.point([(12, 8), (19, 8)], fill=shade)
    # обличчя
    d.point([(13, 15), (18, 15)], fill=(30, 24, 36, 255)); d.point([(13, 14), (18, 14)], fill=(255, 255, 255, 255))
    d.line([(12, 12), (14, 12)], fill=hr if style != 'bald' else shade); d.line([(17, 12), (19, 12)], fill=hr if style != 'bald' else shade)
    d.point([(15, 17), (16, 17)], fill=shade)
    if mouth: d.rectangle([14, 19, 17, 20], fill=(122, 34, 54, 255)); d.point([(15, 19), (16, 19)], fill=(240, 240, 240, 255))
    else: d.line([(14, 19), (17, 19)], fill=(150, 60, 70, 255))
    # аксесуари
    if extra == 'glasses': d.rectangle([11, 13, 14, 16], outline=(30, 30, 40, 255)); d.rectangle([17, 13, 20, 16], outline=(30, 30, 40, 255)); d.line([(15, 14), (16, 14)], fill=(30, 30, 40, 255))
    if extra == 'cap': d.rectangle([8, 5, 23, 9], fill=hexc('#55663a')); d.rectangle([6, 9, 22, 10], fill=hexc('#3c4a28')); d.point([(15, 6), (16, 6)], fill=ac); d.point([(8, 27), (10, 27), (9, 28)], fill=ac)
    if extra == 'pearls': [d.point([(x, 24 + (x % 2))], fill=(250, 250, 250, 255)) for x in range(12, 20)]
    if extra == 'helmet': d.chord([7, 3, 24, 15], 180, 360, fill=ac); d.rectangle([6, 9, 25, 10], fill=hexc('#e0b030')); d.rectangle([10, 26, 11, 31], fill=hexc('#e8e8e8')); d.rectangle([20, 26, 21, 31], fill=hexc('#e8e8e8'))
    if extra == 'beard': d.chord([10, 15, 21, 25], 0, 180, fill=hr); d.rectangle([14, 19, 17, 19], fill=(150, 60, 70, 255) if not mouth else (122, 34, 54, 255))
    return outline(im)
sheet = Image.new('RGBA', (S * 2, S * len(ADV)), (0, 0, 0, 0))
for r, a in enumerate(ADV):
    for f in (0, 1): sheet.paste(draw(a, f), (f * S, r * S))
sheet.save(os.path.join(ROOT, 'assets/ui/advisors.png')); sheet.resize((S * 2 * 6, S * len(ADV) * 6), Image.NEAREST).save('/tmp/adv_x6.png'); print('ok', [a[0] for a in ADV])

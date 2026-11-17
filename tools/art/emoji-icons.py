# Піксельні іконки з емодзі: збирає всі емодзі з data/ і src/, малює їх шрифтом Noto Color Emoji,
# зменшує до 16×16 з обмеженою палітрою й темним контуром → assets/ui/emoji.png + src/ui/emoji-map.js
import re, os, glob, json
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
FONT = '/usr/share/fonts/truetype/noto/NotoColorEmoji.ttf'
EMO = re.compile(r'(?:[\U0001F1E6-\U0001F1FF]{2})|(?:[←-⇿⌀-⏿①-⓿■-➿⤀-⥿⬀-⯿〰〽㊗㊙\U0001F000-\U0001FAFF](?:️)?(?:‍[☀-➿\U0001F000-\U0001FAFF](?:️)?)*)')
src = []
for pat in ['data/**/*.js', 'src/**/*.js']:
    for f in glob.glob(os.path.join(ROOT, pat), recursive=True):
        if 'i18n' in f or 'emoji-map' in f: continue
        src.append(open(f, encoding='utf8').read())
found = []
for s in src:
    for m in EMO.finditer(s):
        e = m.group(0)
        if e not in found: found.append(e)
font = ImageFont.truetype(FONT, 109, layout_engine=ImageFont.Layout.BASIC)
def render(e):
    im = Image.new('RGBA', (160, 160), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    try: d.text((8, 8), e, font=font, embedded_color=True)
    except Exception: return None
    bb = im.getbbox()
    if not bb: return None
    im = im.crop(bb); w, h = im.size; s = max(w, h); sq = Image.new('RGBA', (s, s), (0, 0, 0, 0)); sq.paste(im, ((s - w) // 2, (s - h) // 2)); return sq
def pixelize(im):
    sm = im.resize((14, 14), Image.LANCZOS)
    a = sm.split()[3].point(lambda v: 255 if v > 110 else 0)
    rgb = sm.convert('RGB').quantize(colors=10, method=Image.MEDIANCUT).convert('RGB')
    # трохи контрасту й насиченості — «ігровий» вигляд
    from PIL import ImageEnhance
    rgb = ImageEnhance.Color(rgb).enhance(1.25); rgb = ImageEnhance.Contrast(rgb).enhance(1.1)
    px = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); body = Image.merge('RGBA', (*rgb.split(), a)); px.paste(body, (1, 1), body)
    # контур
    al = px.split()[3]; out = Image.new('RGBA', (16, 16), (0, 0, 0, 0)); o = out.load(); A = al.load()
    for y in range(16):
        for x in range(16):
            if A[x, y]: continue
            if any(0 <= x + dx < 16 and 0 <= y + dy < 16 and A[x + dx, y + dy] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))): o[x, y] = (18, 22, 30, 255)
    out.alpha_composite(px); return out
icons = []
for e in found:
    im = render(e)
    if im is None: continue
    icons.append((e, pixelize(im)))
COLS = 16; rows = (len(icons) + COLS - 1) // COLS
sheet = Image.new('RGBA', (COLS * 16, rows * 16), (0, 0, 0, 0)); mp = {}
for k, (e, im) in enumerate(icons):
    x, y = k % COLS, k // COLS; sheet.paste(im, (x * 16, y * 16)); mp[e] = [x, y]
    if e.endswith('️'): mp[e[:-1]] = [x, y]
    else: mp[e + '️'] = [x, y]
sheet.save(os.path.join(ROOT, 'assets/ui/emoji.png'))
open(os.path.join(ROOT, 'src/ui/emoji-map.js'), 'w', encoding='utf8').write('// ЗГЕНЕРОВАНО tools/art/emoji-icons.py — піксельні іконки з емодзі\nconst PX_ECOLS = %d;\nconst PX_EMO = %s;\n' % (COLS, json.dumps(mp, ensure_ascii=False)))
big = sheet.resize((sheet.width * 3, sheet.height * 3), Image.NEAREST); bg = Image.new('RGBA', big.size, (40, 50, 60, 255)); bg.alpha_composite(big); bg.save('/tmp/emoji_view.png')
print('emoji icons', len(icons), sheet.size)

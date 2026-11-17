# Крок 2: тип рельєфу та родючість кожного регіону з растра Natural Earth (shaded relief).
# python 02_terrain.py regions_geom.json relief_4096.jpg terrain.json
import sys, json, numpy as np
from PIL import Image, ImageDraw
geo = json.load(open(sys.argv[1])); im = Image.open(sys.argv[2]).convert('RGB')
W, H = im.size; A = np.asarray(im).astype(np.float32)
lab = Image.new('I', (W, H), 0); dr = ImageDraw.Draw(lab)
def px(lon, lat): return ((lon + 180) / 360 * W, (90 - lat) / 180 * H)
for r in geo['regions']:
    for ring in r['rings']:
        for sh in (-360, 0, 360):
            pts = [px(x + sh, y) for x, y in ring]
            if max(p[0] for p in pts) < 0 or min(p[0] for p in pts) > W: continue
            dr.polygon(pts, fill=r['k'] + 1)
L = np.asarray(lab).astype(np.int64).ravel()
R, Gc, B = A[..., 0].ravel(), A[..., 1].ravel(), A[..., 2].ravel()
gray = A.mean(axis=2)
gy, gx = np.gradient(gray); rough = np.hypot(gx, gy).ravel()
bright = (R + Gc + B) / 3; gr = Gc - R; arc = (B - R)
n = len(geo['regions']) + 1
cnt = np.bincount(L, minlength=n).astype(np.float64); cnt[cnt == 0] = 1
m = lambda v: np.bincount(L, weights=v, minlength=n) / cnt
mb, mg, ma, mr = m(bright), m(gr), m(arc), m(rough)
rq = np.quantile(mr[1:], [0.75, 0.9])
out = []
for r in geo['regions']:
    k = r['k'] + 1; lat = abs(r['c'][1])
    if ma[k] > 6 and mb[k] > 210: t = 'arctic'
    elif mg[k] < -8: t = 'desert'
    elif mr[k] > rq[1]: t = 'mountain'
    elif mr[k] > rq[0]: t = 'hills'
    elif mg[k] > 16: t = 'forest'
    elif mg[k] < -3: t = 'steppe'
    else: t = 'plains'
    fert = {'arctic': 0.05, 'desert': 0.08, 'mountain': 0.35, 'hills': 0.7, 'forest': 0.55, 'steppe': 0.5, 'plains': 1.0}[t]
    if lat > 58: fert *= 0.35
    elif lat > 52 and t == 'forest': fert *= 0.7
    out.append({'k': r['k'], 't': t, 'f': round(fert, 3)})
json.dump(out, open(sys.argv[3], 'w'))
import collections; print(collections.Counter(o['t'] for o in out))

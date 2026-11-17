// Крок 3: формує файли data/geo/*.js для гри з проміжних даних + розподіляє економіку країн між регіонами.
// node build-data/03_build.js <work-dir> <world.json> <project-root>
const fs = require('fs'), path = require('path'), vm = require('vm');
const [, , WORK, WORLD, ROOT] = process.argv;
const geo = JSON.parse(fs.readFileSync(path.join(WORK, 'regions_geom.json')));
const terr = JSON.parse(fs.readFileSync(path.join(WORK, 'terrain.json')));
const world = JSON.parse(fs.readFileSync(WORLD));
// load game data files (single source of truth)
const ctx = { LORA: { data: {} } }; vm.createContext(ctx);
['econ/countries.js', 'econ/production.js', 'econ/resources.js', 'econ/hotspots.js'].forEach(f => vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', f), 'utf8'), ctx));
const D = ctx.LORA.data;
const RES = D.resourceOrder;
const hav = (a, b) => { const r = Math.PI / 180, dLa = (b[1] - a[1]) * r, dLo = (b[0] - a[0]) * r; const s = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLo / 2) ** 2; return 12742 * Math.asin(Math.min(1, Math.sqrt(s))); };
const inRings = (rings, x, y) => { let ins = false; for (const ring of rings) for (const sh of [-360, 0, 360]) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const xi = ring[i][0] + sh, yi = ring[i][1], xj = ring[j][0] + sh, yj = ring[j][1]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c; } if (c) ins = !ins; } return ins; };
const R = geo.regions;
R.forEach(r => { r.t = terr[r.k].t; r.f = terr[r.k].f; });
const byC = {}; R.forEach(r => (byC[r.cc] = byC[r.cc] || []).push(r));
const norm = (list, key) => { const s = list.reduce((a, r) => a + r[key], 0); list.forEach(r => r[key] = s > 0 ? r[key] / s : 1 / list.length); };
Object.entries(byC).forEach(([cc, list]) => {
  list.forEach(r => { r._city = r.cityPop; r._rur = r.ar * (r.f + 0.05); });
  const sc = list.reduce((a, r) => a + r._city, 0);
  norm(list, '_city'); norm(list, '_rur');
  list.forEach(r => { r._pop = sc > 0 ? 0.55 * r._city + 0.45 * r._rur : r._rur; r._g = sc > 0 ? 0.8 * Math.pow(r._city, 1.1) + 0.2 * r._rur : r._rur; if (r.cap) r._g *= 1.6; });
  norm(list, '_pop'); norm(list, '_g');
  const sh = {}; list.forEach(r => sh[r.k] = { pop: r._pop, gdp: r._g });
  RES.forEach(res => {
    const hs = D.hotspots.filter(h => h[0] === res);
    let w = list.map(r => { let v = 0; hs.forEach(([, lon, lat, wt, rad]) => { const d = inRings(r.rings, lon, lat) ? 0 : hav(r.c, [lon, lat]); v += wt * Math.exp(-((d / rad) ** 2)); }); return v; });
    const tot = w.reduce((a, b) => a + b, 0);
    let fb;
    if (res === 'grain') fb = list.map(r => r.ar * Math.pow(r.f, 1.5));
    else if (res === 'food') fb = list.map(r => 0.5 * r._pop + 0.5 * r.ar * r.f / list.reduce((a, x) => a + x.ar * x.f, 0) || 0);
    else if (['goods', 'machinery', 'chem', 'fert'].includes(res)) fb = list.map(r => r._g);
    else if (res === 'chips') fb = list.map(r => Math.pow(r._g, 1.5));
    else fb = list.map(r => r.ar * (1 - r.f * 0.5) * (r.t === 'mountain' || r.t === 'hills' ? 1.6 : 1));
    const fs_ = fb.reduce((a, b) => a + b, 0) || 1;
    const useH = tot > 0.02;
    const mix = ['machinery', 'chem'].includes(res) ? 0.5 : 0.9;
    list.forEach((r, i) => { sh[r.k][res] = useH ? mix * w[i] / tot + (1 - mix) * fb[i] / fs_ : fb[i] / fs_; });
  });
  list.forEach(r => r.sh = sh[r.k]);
});
// ---- encoders: delta-encoded integer coordinates (×100)
const enc = line => { const out = []; let px = 0, py = 0; line.forEach(([x, y]) => { const ix = Math.round(x * 100), iy = Math.round(y * 100); out.push(ix - px, iy - py); px = ix; py = iy; }); return out; };
const r4 = x => Math.round(x * 10000) / 10000;
const regionsOut = R.map(r => {
  const sh = {}; Object.entries(r.sh).forEach(([k, v]) => { if (v > 0.00005) sh[k] = r4(v); });
  return { cc: r.cc, n: r.nm, c: r.c, ar: r.ar, nb: r.nb, p: r.ports, t: r.t, f: r.f, cap: r.cap ? 1 : 0, sh };
});
const shapes = R.map(r => r.rings.map(enc));
const lines = { borders: geo.borders.map(enc), coast: geo.coast.map(enc), inner: geo.inner.map(enc) };
// ---- logistic cells (country level, for trade routing)
const cells = world.T.map(t => ({ a3: t.a3, n: t.n, o: t.o, c: t.c, nb: t.nb.map(j => world.T[j].a3), p: t.p }));
const have = new Set(cells.map(c => c.a3));
Object.keys(byC).forEach(cc => { if (have.has(cc)) return; const list = byC[cc]; const r0 = list[0];
  const nbs = new Set(); list.forEach(r => r.nb.forEach(j => { const o = R[j].cc; if (o !== cc) nbs.add(o); }));
  if (cc === 'BHR') nbs.add('SAU'); if (cc === 'SGP') nbs.add('MYS');
  const ports = []; list.forEach(r => r.ports.forEach(p => { if (!ports.some(q => q[0] === p[0])) ports.push(p); }));
  const iso = require('i18n-iso-countries'); iso.registerLocale(require('i18n-iso-countries/langs/uk.json'));
  cells.push({ a3: cc, n: iso.getName(cc, 'uk') || cc, o: cc, c: r0.c, nb: [...nbs], p: ports }); nbs.forEach(o => { const c2 = cells.find(c => c.a3 === o); if (c2 && !c2.nb.includes(cc)) c2.nb.push(cc); }); });
const sea = { nodes: world.S.map(s => ({ id: s[0], n: s[1], lon: s[2], lat: s[3], ctl: s[4] || null })), edges: world.E };
const out = (f, head, name, val) => fs.writeFileSync(path.join(ROOT, 'data/geo', f), `// ${head}\n// ЗГЕНЕРОВАНО: tools/build-data/03_build.js. Не редагуйте вручну великі масиви — перезберіть дані.\nLORA.data.${name} = ${JSON.stringify(val)};\n`);
out('regions.js', 'Регіони (області/штати/провінції): назва, центр, площа (км²), сусіди, порти, рельєф, частки економіки країни', 'regions', regionsOut);
out('shapes.js', 'Контури регіонів (дельта-кодування, координати ×100)', 'shapes', shapes);
out('lines.js', 'Лінії мапи: кордони держав, узбережжя, межі регіонів (дельта ×100)', 'lines', lines);
out('cities.js', 'Міста: назва, координати, населення (тис.), індекс регіону, столиця', 'cities', geo.cities);
out('cells.js', 'Логістичні клітини рівня країн (для торгових маршрутів): сусіди та порти', 'cells', cells);
out('sea.js', 'Морська мережа: вузли (протоки, канали, моря) та зʼєднання', 'sea', sea);
['regions.js', 'shapes.js', 'lines.js', 'cities.js', 'cells.js', 'sea.js'].forEach(f => console.log(f, fs.statSync(path.join(ROOT, 'data/geo', f)).size));

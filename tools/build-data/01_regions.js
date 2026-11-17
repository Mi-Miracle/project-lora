// Крок 1: з регіонів Natural Earth (після 00_tag_regions.py + mapshaper) будує геометрію, сусідство, порти, міста.
// Запуск: node build-data/01_regions.js <regions.topo.json> <ne_populated_places.geojson> <world.json>
const fs = require('fs');
const topojson = require('topojson-client');
const d3 = require('d3-geo');
const [, , TOPO, PLACES, WORLD] = process.argv;
const topo = JSON.parse(fs.readFileSync(TOPO));
const places = JSON.parse(fs.readFileSync(PLACES)).features;
const world = JSON.parse(fs.readFileSync(WORLD));
const R = 6371;
const hav = (a, b) => { const r = Math.PI / 180, dLa = (b[1] - a[1]) * r, dLo = (b[0] - a[0]) * r; const s = Math.sin(dLa / 2) ** 2 + Math.cos(a[1] * r) * Math.cos(b[1] * r) * Math.sin(dLo / 2) ** 2; return 2 * R * Math.asin(Math.min(1, Math.sqrt(s))); };
const obj = Object.values(topo.objects)[0];
const G = obj.geometries.filter(g => g.type);
obj.geometries = G;
const KEEP = new Set(['USA', 'RUS', 'TUR', 'IND', 'CHN', 'BRA', 'UKR', 'DEU', 'POL', 'CAN', 'AUS', 'MEX', 'IDN', 'IRN', 'ARG', 'KAZ', 'JPN', 'FRA', 'ITA', 'ESP', 'GBR', 'SAU', 'EGY', 'PAK', 'NGA', 'ZAF', 'KOR']);
const nb = topojson.neighbors(G);
const area = G.map(g => d3.geoArea(topojson.feature(topo, g)) * R * R);
const cArea = {}; G.forEach((g, i) => { const c = g.properties.cc; cArea[c] = (cArea[c] || 0) + area[i]; });
// union-find merge of small regions inside each country
const parent = G.map((_, i) => i); const find = i => parent[i] === i ? i : (parent[i] = find(parent[i]));
const gArea = area.slice();
const byC = {}; G.forEach((g, i) => (byC[g.properties.cc] = byC[g.properties.cc] || []).push(i));
Object.entries(byC).forEach(([c, idx]) => {
  const allowed = KEEP.has(c) ? Infinity : Math.max(1, Math.min(60, Math.round(cArea[c] / 26000)));
  let roots = new Set(idx.map(find));
  let guard = 0;
  while (roots.size > allowed && guard++ < 5000) {
    const sorted = [...roots].sort((a, b) => gArea[a] - gArea[b]);
    let merged = false;
    for (const r of sorted) {
      // neighbours of the group with the same country
      const members = idx.filter(i => find(i) === r);
      const nbr = new Set(); members.forEach(i => nb[i].forEach(j => { if (G[j].properties.cc === c && find(j) !== r) nbr.add(find(j)); }));
      if (!nbr.size) continue;
      const tgt = [...nbr].sort((a, b) => gArea[a] - gArea[b])[0];
      parent[r] = tgt; gArea[tgt] += gArea[r]; roots.delete(r); merged = true; break;
    }
    if (!merged) break;
  }
});
const groups = {}; G.forEach((g, i) => (groups[find(i)] = groups[find(i)] || []).push(i));
const gList = Object.values(groups);
const gIndexOf = new Int32Array(G.length); gList.forEach((m, k) => m.forEach(i => gIndexOf[i] = k));
G.forEach((g, i) => g.properties.k = gIndexOf[i]);
console.log('regions after merge', gList.length);

// arc usage -> coastline arcs
const use = {}; const walk = (a, f) => typeof a[0] === 'number' ? a.forEach(f) : a.forEach(x => walk(x, f));
G.forEach(g => walk(g.arcs, a => { const k = a < 0 ? ~a : a; use[k] = (use[k] || 0) + 1; }));
const SEA = world.S;
const INLAND = { CASP: ['RUS', 'KAZ', 'TKM', 'AZE', 'IRN'], VOLGA: [] };
const r2 = x => Math.round(x * 100) / 100;

const regions = gList.map((m, k) => {
  const f = topojson.merge(topo, m.map(i => G[i]));
  let polys = f.type === 'Polygon' ? [f.coordinates] : f.coordinates;
  let largest = null, la = -1; polys.forEach(p => { const a = d3.geoArea({ type: 'Polygon', coordinates: p }); if (a > la) { la = a; largest = p; } });
  // label point: centroid of largest polygon, nudged inside if needed
  let c = d3.geoCentroid({ type: 'Polygon', coordinates: largest });
  if (!d3.geoContains({ type: 'Polygon', coordinates: largest }, c)) { const ring = largest[0]; let best = ring[0], bd = 1e9; ring.forEach(p => { const d = Math.hypot(p[0] - c[0], p[1] - c[1]); if (d < bd) { bd = d; best = p; } }); c = best; }
  const rings = [];
  polys.forEach(p => p.forEach(ring => {
    const out = []; let off = 0, lx = null, prev = null;
    ring.forEach(([x, y]) => { if (lx != null) { if (x - lx > 180) off -= 360; else if (lx - x > 180) off += 360; } lx = x; const q = [r2(x + off), r2(y)]; if (!prev || q[0] !== prev[0] || q[1] !== prev[1]) { out.push(q); prev = q; } });
    if (out.length >= 4) rings.push(out);
  }));
  const big = m.slice().sort((a, b) => area[b] - area[a]);
  const cc = G[m[0]].properties.cc;
  // coast vertices
  const coastArcs = []; m.forEach(i => walk(G[i].arcs, a => { const kk = a < 0 ? ~a : a; if (use[kk] === 1) coastArcs.push([kk]); }));
  const coast = []; if (coastArcs.length) topojson.feature(topo, { type: 'MultiLineString', arcs: coastArcs }).geometry.coordinates.forEach(l => l.forEach((p, j) => { if (j % 2 === 0) coast.push(p); }));
  const ports = [];
  if (coast.length) SEA.forEach((s, si) => {
    if (INLAND[s[0]] && !INLAND[s[0]].includes(cc)) return;
    let best = 1e9, bp = null; for (const p of coast) { const d = hav(p, [s[2], s[3]]); if (d < best) { best = d; bp = p; } }
    if (best < 650) ports.push([si, r2(bp[0]), r2(bp[1]), Math.round(best)]);
  });
  const nbs = new Set(); m.forEach(i => nb[i].forEach(j => { const g2 = gIndexOf[j]; if (g2 !== k) nbs.add(g2); }));
  return { k, cc, nm: G[big[0]].properties.nm, members: m.length, c: [r2(c[0]), r2(c[1])], ar: Math.round(gArea[find(m[0])] || m.reduce((s, i) => s + area[i], 0)), rings, nb: [...nbs], ports, coast: coast.length > 0, feat: f };
});
// fix area (sum of members)
regions.forEach(r => { r.ar = Math.round(gList[r.k].reduce((s, i) => s + area[i], 0)); });
// regions with no sea node within 650km but coastal -> nearest node within 1300km
regions.forEach(r => { if (r.coast && !r.ports.length) { let best = 1e9, bi = -1, bp = null; r.rings.forEach(ring => ring.forEach(p => SEA.forEach((s, si) => { if (INLAND[s[0]]) return; const d = hav(p, [s[2], s[3]]); if (d < best) { best = d; bi = si; bp = p; } }))); if (best < 1300) r.ports.push([bi, bp[0], bp[1], Math.round(best)]); } });

// cities & population weights
const MAP = { KOS: 'KSV', SDS: 'SSD', PSX: 'PSE', SAH: 'ESH', CYN: 'NCY', KAS: 'IND', KAB: 'KAZ', HKG: 'CHN', SOL: 'SOL' };
const byCC = {}; regions.forEach(r => (byCC[r.cc] = byCC[r.cc] || []).push(r));
const cities = [];
regions.forEach(r => { r.cityPop = 0; r.cap = false; });
places.forEach(pf => {
  const q = pf.properties; const g = k => q[k] != null ? q[k] : q[k.toUpperCase()];
  const p = { name: g('name_uk') || g('name'), en: g('name'), longitude: g('longitude'), latitude: g('latitude'), adm0_a3: g('adm0_a3'), pop_max: g('pop_max'), pop_min: g('pop_min'), adm0cap: g('adm0cap'), featurecla: g('featurecla'), scalerank: g('scalerank') };
  const lon = p.longitude, lat = p.latitude;
  let cc = MAP[p.adm0_a3] || p.adm0_a3;
  if (p.en === 'Sevastopol' || p.en === 'Simferopol') cc = 'UKR';
  const cand = byCC[cc]; if (!cand) return;
  let reg = cand.find(r => d3.geoContains(r.feat, [lon, lat]));
  if (!reg) { let bd = 1e9; cand.forEach(r => { const d = hav(r.c, [lon, lat]); if (d < bd) { bd = d; reg = r; } }); if (bd > 400) return; }
  const pop = Math.max(p.pop_max || 0, p.pop_min || 0);
  reg.cityPop += pop;
  const isCap = p.adm0cap === 1 || (p.featurecla || '').includes('Admin-0 capital') && !(p.featurecla || '').includes('alt');
  if (isCap) reg.cap = true;
  if (pop >= 300000 || isCap || (pop >= 120000 && (p.featurecla || '').includes('Admin-1 capital'))) cities.push({ n: p.name, lon: r2(lon), lat: r2(lat), pop: Math.round(pop / 1000), reg: reg.k, cap: isCap ? 1 : 0, rank: p.scalerank });
});
console.log('cities', cities.length);
// meshes
const meshLines = filt => topojson.mesh(topo, obj, filt).coordinates.map(l => { const out = []; let off = 0, lx = null; l.forEach(([x, y]) => { if (lx != null) { if (x - lx > 180) off -= 360; else if (lx - x > 180) off += 360; } lx = x; out.push([r2(x + off), r2(y)]); }); return out; });
const borders = meshLines((a, b) => a !== b && a.properties.cc !== b.properties.cc);
const coastL = meshLines((a, b) => a === b);
const inner = meshLines((a, b) => a !== b && a.properties.cc === b.properties.cc && a.properties.k !== b.properties.k);
regions.forEach(r => delete r.feat);
fs.writeFileSync('regions_geom.json', JSON.stringify({ regions, cities, borders, coast: coastL, inner }));
console.log('wrote regions_geom.json', fs.statSync('regions_geom.json').size);

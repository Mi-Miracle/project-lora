// МАПА: малювання. Базовий шар (рельєф + регіони + кордони) кешується й перемальовується лише при змінах;
// поверх щокадру малюються торгові потоки, війська, флоти, міста, підписи.
const RCOL = {}; RES.forEach(r => RCOL[r] = RI[r].col);
const resColor = (r, a) => `rgba(${RCOL[r].join(',')},${a})`;
function lerpC(a, b, t) { return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`; }
function scale3(x) { x = Math.max(-1, Math.min(1, x)); return x < 0 ? lerpC([150, 155, 160], [205, 55, 55], -x) : lerpC([150, 155, 160], [60, 190, 110], x); }
function heat(x) { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? lerpC([40, 70, 120], [70, 170, 160], x * 2) : lerpC([70, 170, 160], [240, 220, 90], (x - 0.5) * 2); }
const TERRAIN_COL = { plains: '#9bc46a', steppe: '#d8c77a', forest: '#3f8a4a', hills: '#a58a5a', mountain: '#8a7a6e', desert: '#e3c58a', arctic: '#e8f0f6' };
function terrColor(i) {
  const t = G.ter[i], n = G.N[t.ctrl], P = G.pv();
  switch (mode) {
    case 'pol': return n.color;
    case 'rel': if (t.ctrl === P) return '#3d8bd9'; if (G.atWar(P, t.ctrl)) return '#8a1c1c'; if (G.allied(P, t.ctrl)) return '#2f6fb0'; return scale3(G.rel[P][t.ctrl] / 80);
    case 'gdp': return heat(Math.log10(Math.max(1, t.gdp / Math.max(0.01, t.pop) * 1000)) / 5 - 0.5);
    case 'growth': return scale3((n.growth - 0.015) / 0.04);
    case 'stab': return scale3((n.stab - 50) / 40);
    case 'mil': return heat(Math.log10(G.nationPower(t.ctrl) + 1) / 3.6);
    case 'terrain': return TERRAIN_COL[D.regions[i].t] || '#888';
    case 'res': { const v = t.prod[modeRes]; const need = t.need0[modeRes]; const bal = (v - need) / Math.max(1e-9, Math.max(v, need)); return scale3(bal); }
    case 'trade': { if (t.ctrl === P) return '#3d8bd9'; let v = 0; G.flows.forEach(f => { if ((f.from === P && f.to === t.ctrl) || (f.to === P && f.from === t.ctrl)) v += f.val; }); return v > 0 ? heat(Math.log10(v + 1) / 2.6) : '#2b3440'; }
    case 'supply': if (G.atWar(P, t.ctrl)) return '#7a2323'; if (t.ctrl === P) return '#2e6aa6'; if (G.friendlyTo(P, t.ctrl)) return '#2e5a6e'; return '#3a4250';
  }
  return n.color;
}
const stripePats = {};
function stripePattern(c2d, color) { const k = color; if (stripePats[k]) return stripePats[k]; const c = document.createElement('canvas'); c.width = c.height = 8; const x = c.getContext('2d'); x.strokeStyle = color; x.lineWidth = 2.5; x.beginPath(); x.moveTo(-2, 10); x.lineTo(10, -2); x.moveTo(6, 10); x.lineTo(10, 6); x.stroke(); return stripePats[k] = c2d.createPattern(c, 'repeat'); }

// ---------- базовий шар ----------
function drawBase() {
  const W = baseCv.width, H = baseCv.height, c = bctx;
  c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#7fa9c9'; c.fillRect(0, 0, W, H);
  const { out: shifts, lonL, lonR } = visibleShifts(); const lw = 1 / view.s;
  const alpha = mode === 'pol' ? LORA.config.map.politicalAlpha : mode === 'terrain' ? 0.0 : 0.7;
  for (const sh of shifts) {
    if (GEO.reliefOk) { const img = GEO.relief; c.setTransform(view.s * DPR * 360 / img.width, 0, 0, view.s * DPR * 180 / img.height, (view.ox + (sh - 180) * view.s) * DPR, (view.oy - 90 * view.s) * DPR); c.drawImage(img, 0, 0); }
    c.setTransform(view.s * DPR, 0, 0, view.s * DPR, (view.ox + sh * view.s) * DPR, view.oy * DPR);
    if (!GEO.reliefOk) { c.fillStyle = '#d9d2bd'; for (let i = 0; i < GEO.paths.length; i++) c.fill(GEO.paths[i]); }
    c.globalAlpha = alpha;
    for (let i = 0; i < GEO.paths.length; i++) {
      const bb = GEO.bbox[i]; if (bb[2] + sh < lonL - 2 || bb[0] + sh > lonR + 2) continue;
      c.fillStyle = terrColor(i); c.fill(GEO.paths[i]);
    }
    c.globalAlpha = 1;
    // окуповані регіони — штрихування кольором власника
    for (let i = 0; i < GEO.paths.length; i++) { const t = G.ter[i]; if (t.ctrl === t.owner) continue; c.globalAlpha = 0.6; c.fillStyle = stripePattern(c, mode === 'pol' ? G.N[t.owner].color : '#000'); c.fill(GEO.paths[i]); c.globalAlpha = 1; }
    const fv = window.fogVis ? fogVis() : null; if (fv) { c.fillStyle = 'rgba(12,18,28,0.42)'; for (let i = 0; i < GEO.paths.length; i++) { if (fv[i]) continue; const bb = GEO.bbox[i]; if (bb[2] + sh < lonL - 2 || bb[0] + sh > lonR + 2) continue; c.fill(GEO.paths[i]); } }
    if (view.s > 2.4) { c.strokeStyle = 'rgba(255,255,255,0.28)'; c.lineWidth = lw * 0.7; c.stroke(GEO.inner); }
    c.strokeStyle = 'rgba(40,70,100,0.55)'; c.lineWidth = lw * 0.8; c.stroke(GEO.coast);
    c.strokeStyle = 'rgba(20,20,30,0.85)'; c.lineWidth = lw * 1.6; c.stroke(GEO.borders);
    // кордони держав, змінені війною (лінія фронту): контур регіонів під чужим контролем
    c.strokeStyle = '#ff3b3b'; c.lineWidth = lw * 1.4;
    for (let i = 0; i < GEO.paths.length; i++) { const t = G.ter[i]; if (t.ctrl !== t.owner) c.stroke(GEO.paths[i]); }
  }
  mapDirty = false; lastViewKey = viewKey();
  computeLabels();
}
const viewKey = () => view.s.toFixed(4) + ':' + view.ox.toFixed(1) + ':' + view.oy.toFixed(1) + ':' + mode + ':' + modeRes + ':' + cv.width + ':' + cv.height;

// ---------- підписи держав ----------
let labelPts = [];
function computeLabels() {
  labelPts = [];
  G.N.forEach(n => {
    if (!n.alive || n.home < 0) return; const hc = D.regions[n.home].c; let sx = 0, sy = 0, sw = 0;
    G.ter.forEach((t, i) => { if (t.ctrl !== n.id) return; const c = D.regions[i].c; let x = c[0]; if (x - hc[0] > 180) x -= 360; else if (hc[0] - x > 180) x += 360; if (Math.abs(x - hc[0]) > 70) return; const w = Math.sqrt(t.area); sx += x * w; sy += c[1] * w; sw += w; });
    if (!sw) return; const area = n.agg ? n.agg.area : 1e5;
    labelPts.push({ id: n.id, lon: sx / sw, lat: sy / sw, area });
  });
}

// ---------- кадр ----------
let animT = 0;
function draw() {
  if (!G) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = '#0b1622'; ctx.fillRect(0, 0, cv.width, cv.height); return; }
  if (mapDirty || viewKey() !== lastViewKey) drawBase();
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(baseCv, 0, 0);
  const { out: shifts } = visibleShifts(); const lw = 1 / view.s;
  for (const sh of shifts) {
    ctx.setTransform(view.s * DPR, 0, 0, view.s * DPR, (view.ox + sh * view.s) * DPR, view.oy * DPR);
    // морські шляхи
    if (mode === 'supply' || mode === 'trade') { ctx.strokeStyle = 'rgba(20,60,100,0.5)'; ctx.lineWidth = lw * 1.2; ctx.setLineDash([4 * lw, 4 * lw]); ctx.beginPath(); D.sea.edges.forEach(([a, b]) => { const A = D.sea.nodes[a], B = D.sea.nodes[b]; let bx = B.lon; if (bx - A.lon > 180) bx -= 360; else if (A.lon - bx > 180) bx += 360; ctx.moveTo(A.lon, -A.lat); ctx.lineTo(bx, -B.lat); }); ctx.stroke(); ctx.setLineDash([]); }
    // гравець, вибір, наведення, наступи
    ctx.lineWidth = lw * 2; ctx.strokeStyle = '#ffffff';
    G.ter.forEach((t, i) => { if (t.ctrl === G.player && D.regions[i].nb.some(j => G.ter[j].ctrl !== G.player)) ctx.stroke(GEO.paths[i]); });
    if (sel && sel.type === 't') { ctx.strokeStyle = '#ffd34d'; ctx.lineWidth = lw * 2.6; ctx.stroke(GEO.paths[sel.id]); }
    if (hoverT >= 0) { ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = lw * 1.5; ctx.stroke(GEO.paths[hoverT]); }
    G.ter.forEach((t, i) => { if (t.occ && t.occ.p > 0) { ctx.strokeStyle = '#ff5d5d'; ctx.lineWidth = lw * (1.4 + Math.sin(animT * 4) * 0.6); ctx.stroke(GEO.paths[i]); } });
    G.ter.forEach((t, i) => { if (t.rad > G.day) { ctx.fillStyle = `rgba(170,255,40,${0.18 + Math.sin(animT * 3 + i) * 0.06})`; ctx.fill(GEO.paths[i]); ctx.strokeStyle = '#b5ff2a'; ctx.lineWidth = lw * 1.2; ctx.stroke(GEO.paths[i]); } });
    drawLinks(lw);
    drawFlows(); if (window.drawOverlay29) drawOverlay29(lw);
    G.chokeIdx.forEach(ci => { const s = D.sea.nodes[ci]; const blk = G._blkP && G._blkP[ci]; const r = 3.4 / Math.sqrt(view.s); ctx.save(); ctx.translate(s.lon, -s.lat); ctx.rotate(Math.PI / 4); ctx.fillStyle = blk ? '#ff5d5d' : '#ffd34d'; ctx.strokeStyle = '#000'; ctx.lineWidth = lw; ctx.fillRect(-r / 2, -r / 2, r, r); ctx.strokeRect(-r / 2, -r / 2, r, r); ctx.restore(); });
  }
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  unitHit = [];
  for (const sh of shifts) { drawCities(sh); drawLabels(sh); if (!(mode === 'trade' || mode === 'supply' || mode === 'res')) { drawBuildings(sh); drawCompanyLayer(sh); } drawUnits(sh); drawStrikes(sh); drawLeader(sh); if (window.drawAgents) drawAgents(sh); }
}

// торгові потоки: суходолом — через регіони (суцільна коричнева лінія), морем — морськими шляхами (блакитний пунктир)
const _rByCC = {}; function regionsOf(cc) { if (_rByCC[cc]) return _rByCC[cc]; const L = []; D.regions.forEach((r, i) => { if (r.cc === cc) L.push(i); }); return (_rByCC[cc] = L); }
function nearestReg(cc, lon, lat) { let best = -1, bd = 1e9; for (const i of regionsOf(cc)) { const c = D.regions[i].c; let dx = c[0] - lon; if (dx > 180) dx -= 360; if (dx < -180) dx += 360; const d = dx * dx + (c[1] - lat) ** 2; if (d < bd) { bd = d; best = i; } } return best; }
const _lp2 = new Map(); let _lpBudget = 0;
function landSeg(p0, p1) { const cc0 = p0.cc, cc1 = p1.cc; if (!cc0 || !cc1) return null; const a = nearestReg(cc0, p0.x, p0.y), b = nearestReg(cc1, p1.x, p1.y); if (a < 0 || b < 0) return null; const k = a + '>' + b; if (_lp2.has(k)) return _lp2.get(k); if (_lpBudget-- <= 0) return null; const p = landPath(a, b); _lp2.set(k, p); return p; }
function flowSegs(f) {
  if (f._segs && f._segs.full) return f._segs; const C = D.cells, SN = D.sea.nodes, NC = C.length, path = f.path; const segs = []; let full = true;
  const pt = (u, k) => u < NC ? { x: C[u].c[0], y: C[u].c[1], cc: C[u].a3, land: 1 } : { x: SN[u - NC].lon, y: SN[u - NC].lat, land: 0 };
  for (let k = 1; k < path.length; k++) { const u = path[k - 1], v = path[k]; const A = pt(u), B = pt(v);
    if (A.land && B.land) { const p = landSeg(A, B); if (!p) full = false; segs.push({ sea: 0, pts: p || [[A.x, A.y], [B.x, B.y]] }); }
    else if (A.land && !B.land) { const pr = C[u].p.find(q => q[0] === v - NC); const port = pr ? [pr[1], pr[2]] : [B.x, B.y]; const r = pr ? landSeg(A, { x: port[0], y: port[1], cc: A.cc }) : null; if (pr && !r) full = false; if (r && r.length > 1) segs.push({ sea: 0, pts: r.concat([port]) }); segs.push({ sea: 1, pts: [port, [B.x, B.y]] }); }
    else if (!A.land && B.land) { const pr = C[v].p.find(q => q[0] === u - NC); const port = pr ? [pr[1], pr[2]] : [A.x, A.y]; segs.push({ sea: 1, pts: [[A.x, A.y], port] }); const r = pr ? landSeg({ x: port[0], y: port[1], cc: B.cc }, B) : null; if (pr && !r) full = false; if (r && r.length > 1) segs.push({ sea: 0, pts: [port].concat(r) }); }
    else segs.push({ sea: 1, pts: [[A.x, A.y], [B.x, B.y]] }); }
  // безперервність довготи
  let last = null; segs.forEach(sg => sg.pts = sg.pts.map(p => { p = p.slice(); if (last) { while (p[0] - last[0] > 180) p[0] -= 360; while (last[0] - p[0] > 180) p[0] += 360; } last = p; return p; }));
  segs.full = full; f._segs = segs; f.line = segs.flatMap(s => s.pts); f.len = 0; return segs;
}
function smoothPath(pts) { ctx.moveTo(pts[0][0], -pts[0][1]); if (pts.length === 2) { ctx.lineTo(pts[1][0], -pts[1][1]); return; } for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], -pts[i][1], mx, -my); } const z = pts[pts.length - 1]; ctx.lineTo(z[0], -z[1]); }
function drawFlows() {
  const P = G.pv(); let list; _lpBudget = 25;
  if (mode === 'trade') list = G.flows.filter(f => f.from === P || f.to === P || f.val > 40);
  else if (mode === 'res') list = G.flows.filter(f => f.r === modeRes && f.val > 1);
  else list = G.flows.filter(f => (f.from === P || f.to === P) && f.val > 0.5);
  if (list.length > 450) list = list.sort((a, b) => b.val - a.val).slice(0, 450);
  const lw = 1 / view.s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  list.forEach(f => {
    const segs = flowSegs(f); const mine = f.from === P || f.to === P; const w = Math.max(1.3, Math.min(5.5, Math.log10(f.val + 1) * 1.8)) * lw;
    segs.forEach(sg => { ctx.beginPath(); smoothPath(sg.pts);
      if (sg.sea) { ctx.setLineDash([5 * lw, 4 * lw]); ctx.strokeStyle = mine ? 'rgba(110,200,255,0.95)' : 'rgba(110,190,255,0.7)'; ctx.lineWidth = w * 1.2; ctx.stroke(); }
      else { ctx.setLineDash([]); ctx.strokeStyle = 'rgba(40,25,10,0.55)'; ctx.lineWidth = w + 1.6 * lw; ctx.stroke(); ctx.strokeStyle = mine ? (f.from === P ? 'rgba(80,220,120,0.9)' : 'rgba(255,190,90,0.9)') : resColor(f.r, 0.55); ctx.lineWidth = w; ctx.stroke(); } });
    ctx.setLineDash([]);
    if (!f.len) { f.cum = [0]; for (let k = 1; k < f.line.length; k++) f.cum.push(f.cum[k - 1] + Math.hypot(f.line[k][0] - f.line[k - 1][0], f.line[k][1] - f.line[k - 1][1])); f.len = f.cum[f.cum.length - 1] || 1; f.off = f.off || Math.random(); }
    const cnt = Math.min(6, 1 + Math.floor(f.len / 25));
    for (let c = 0; c < cnt; c++) { const d = ((animT * 6 + f.off * f.len + c * f.len / cnt) % f.len); let k = 1; while (k < f.cum.length - 1 && f.cum[k] < d) k++; const a = f.line[k - 1], b = f.line[k] || a, seg = (f.cum[k] - f.cum[k - 1]) || 1, u = (d - f.cum[k - 1]) / seg;
      const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; const onSea = segs.some(sg => sg.sea && sg.pts.includes(a)); ctx.fillStyle = onSea ? '#bfe6ff' : resColor(f.r, 1); ctx.beginPath(); if (onSea) ctx.rect(x - 1.6 * lw, -y - 1.6 * lw, 3.2 * lw, 3.2 * lw); else ctx.arc(x, -y, 1.9 * lw, 0, 7); ctx.fill(); }
  });
}
function cityMin() { const s = view.s; return s < 3 ? 1e9 : s < 5 ? 5000 : s < 8 ? 2000 : s < 14 ? 800 : s < 25 ? 300 : 0; }
function drawCities(sh) {
  const min = cityMin(); ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  for (const c of GEO.cities) {
    if (c.pop < min && !(c.cap && view.s >= 5)) continue;
    const [x, y] = toScreen(c.lon + sh, c.lat); if (x < -20 || x > innerWidth + 20 || y < 40 || y > innerHeight) continue;
    const r = c.cap ? 3.4 : 2.2 + Math.min(2, c.pop / 6000);
    ctx.fillStyle = c.cap ? '#fff' : '#f4f1e6'; ctx.strokeStyle = '#111'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.283); ctx.fill(); ctx.stroke();
    if (c.cap) { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.arc(x, y, 1.4, 0, 6.283); ctx.fill(); }
    if (view.s >= 7 || (c.cap && view.s >= 5)) { ctx.font = `${c.cap ? 600 : 500} ${c.pop > 3000 ? 12 : 11}px system-ui,sans-serif`; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.fillStyle = '#1c2530'; ctx.strokeText(c.n, x + r + 3, y); ctx.fillText(c.n, x + r + 3, y); }
  }
}
function drawLabels(sh) {
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  if (view.s < 18) labelPts.forEach(L => {
    const px = Math.sqrt(L.area) / 111 * view.s; if (px < 40 && L.id !== G.player) return;
    const [x, y] = toScreen(L.lon + sh, L.lat); if (x < -100 || x > innerWidth + 100 || y < 0 || y > innerHeight) return;
    const fs = Math.max(11, Math.min(22, px / 9)); const n = G.N[L.id];
    ctx.font = `700 ${fs}px system-ui,sans-serif`; ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.fillStyle = '#1b2633';
    const txt = view.s > 3 ? n.name.toUpperCase() : n.name; ctx.strokeText(txt, x, y); ctx.fillText(txt, x, y);
  });
  if (view.s >= 9) { ctx.font = 'italic 500 11px system-ui,sans-serif'; D.regions.forEach((r, i) => { if (!r.n) return; const px = Math.sqrt(r.ar) / 111 * view.s; if (px < 70) return; const [x, y] = toScreen(r.c[0] + sh, r.c[1]); if (x < 0 || x > innerWidth || y < 50 || y > innerHeight) return; ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.fillStyle = '#3a3226'; ctx.strokeText(r.n, x, y + 14); ctx.fillText(r.n, x, y + 14); }); }
  G.ter.forEach((t, i) => { if (!t.occ) return; const c = D.regions[i].c; const [x, y] = toScreen(c[0] + sh, c[1]); if (x < -50 || x > innerWidth + 50) return; ctx.fillStyle = '#000b'; ctx.fillRect(x - 22, y + 24, 44, 6); ctx.fillStyle = G.N[t.occ.by].color; ctx.fillRect(x - 22, y + 24, 44 * t.occ.p / 100, 6); ctx.strokeStyle = '#ff5d5d'; ctx.lineWidth = 1; ctx.strokeRect(x - 22, y + 24, 44, 6); });
}
function unitPos(a) {
  const c = D.regions[a.t].c;
  if (a.mv && !a.mv.sea && a.mv.path) { const nx = a.mv.path[a.mv.step]; if (nx != null) { const c2 = D.regions[nx].c; let x2 = c2[0]; if (x2 - c[0] > 180) x2 -= 360; else if (c[0] - x2 > 180) x2 += 360; const f = Math.max(0, Math.min(0.9, (a.mv.tot - a.mv.left + (speedIdx ? tAcc : 0)) / Math.max(1, a.mv.tot))); return { lon: c[0] + (x2 - c[0]) * f, lat: c[1] + (c2[1] - c[1]) * f, to: [x2, c2[1]] }; } } // плавний рух між днями
  if (a.mv && a.mv.sea) { const nodes = a.mv.nodes; const prog = 1 - a.mv.left / a.mv.days; const k = Math.min(nodes.length - 1, Math.max(0, Math.floor(prog * nodes.length))); const s = D.sea.nodes[nodes[k]]; return { lon: s.lon, lat: s.lat, sea: true }; }
  return { lon: c[0], lat: c[1] };
}
var unitHit = [];
function roundRect(x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
function groupByNation(list) { const m = {}; list.forEach(a => { if (!m[a.n]) m[a.n] = { n: a.n, k: 0, cnt: 0, first: a }; m[a.n].k += a.k; m[a.n].cnt++; }); return Object.values(m).map(g => g.cnt === 1 ? { n: g.n, k: g.k, arm: g.first } : g); }
function drawUnits(sh) {
  const P = G.pv(), zoomed = view.s >= 7, bset = new Set(G.battles || []);
  const fv = window.fogVis ? fogVis() : null;
  const showA = a => (!fv || a.n === P || fv[a.t] || G.allied(P, a.n)) && (zoomed || a.n === P || G.atWar(P, a.n) || bset.has(a.t) || (G.allied(P, a.n) && G.enemiesOf(P).length) || (sel && sel.type === 't' && G.ter[sel.id].ctrl === a.n));
  const byT = {}; G.armies.forEach(a => { if (!showA(a)) return; const k = a.mv && a.mv.sea ? 's' + a.id : a.t; (byT[k] = byT[k] || []).push(a); });
  Object.values(byT).forEach(list => {
    const show = groupByNation(list.filter(a => a.n !== P)); list.filter(a => a.n === P).sort((a, b) => a.k - b.k).forEach(a => show.unshift({ n: a.n, k: a.k, arm: a }));
    show.forEach((u, idx) => {
      const a = u.arm || u.first; const p = unitPos(a);
      let [x, y] = toScreen(p.lon + sh, p.lat); y += 4 + idx * 17 - (show.length - 1) * 8;
      if (x < -40 || x > innerWidth + 40 || y < -20 || y > innerHeight + 20) return;
      const n = G.N[u.n], war = G.atWar(P, u.n);
      const txt = (u.k >= 1000 ? (u.k / 1000).toFixed(1) + 'М' : u.k.toFixed(0)) + (u.cnt > 1 ? '×' + u.cnt : '');
      ctx.font = '600 11px system-ui'; const w = ctx.measureText(txt).width + 18;
      if (u.arm && a.mv && p.to) { const [x2, y2] = toScreen(p.to[0] + sh, p.to[1]); ctx.strokeStyle = war ? '#ff3b3b' : u.n === P ? '#ffd34d' : '#ffffffaa'; ctx.fillStyle = ctx.strokeStyle; ctx.lineWidth = 2.2; ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke(); ctx.setLineDash([]); const ang = Math.atan2(y2 - y, x2 - x); ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - 9 * Math.cos(ang - 0.4), y2 - 9 * Math.sin(ang - 0.4)); ctx.lineTo(x2 - 9 * Math.cos(ang + 0.4), y2 - 9 * Math.sin(ang + 0.4)); ctx.fill(); }
      const isSel = sel && sel.type === 'a' && u.arm && sel.id === u.arm.id;
      ctx.fillStyle = n.color; ctx.strokeStyle = isSel ? '#ffd34d' : war ? '#ff3b3b' : u.n === P ? '#fff' : '#000'; ctx.lineWidth = isSel ? 3 : 1.5;
      roundRect(x - w / 2, y - 8, w, 16, 4); ctx.fill(); ctx.stroke();
      if (u.arm) { ctx.fillStyle = '#000a'; ctx.fillRect(x - w / 2 + 3, y - 5, 3, 10); ctx.fillStyle = a.sup > 0.6 ? '#4cd28a' : a.sup > 0.35 ? '#ffc04d' : '#ff5d5d'; ctx.fillRect(x - w / 2 + 3, y + 5 - 10 * a.sup, 3, 10 * a.sup); }
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 2.5; ctx.strokeStyle = '#000c'; ctx.strokeText(txt, x + 4, y + 0.5); ctx.fillText(txt, x + 4, y + 0.5);
      if (a.stance === 'attack') { ctx.fillText('➤', x + w / 2 + 7, y); }
      if (a.train > 0) { ctx.fillText('⏳', x + w / 2 + 7, y); }
      if (u.arm && a.xp >= 0.25 && view.s >= 4) { ctx.fillStyle = '#ffd34d'; ctx.font = '600 9px system-ui'; ctx.fillText(G.vetStars(a), x + 4, y - 11); ctx.font = '600 11px system-ui'; ctx.fillStyle = '#fff'; }
      if (p.sea) ctx.fillText('⚓', x - w / 2 - 7, y);
      else if (u.arm && G.tplOf && view.s >= 3) drawNato(x - w / 2 - 9, y, G.tplOf(a), n.color);
      unitHit.push({ x, y, w, h: 16, type: u.arm ? 'a' : 'g', id: u.arm ? u.arm.id : null, t: a.t });
    });
  });
  (G.battles || []).forEach(ti => { const c = D.regions[ti].c; const [x, y] = toScreen(c[0] + sh, c[1]); ctx.font = (G.battleHot && G.battleHot[ti] ? '20px' : '14px') + ' system-ui'; ctx.globalAlpha = 0.6 + 0.4 * Math.sin(animT * 6); ctx.textAlign = 'center'; ctx.fillText('⚔', x + 34, y - 2); ctx.globalAlpha = 1; });
  const byN = {};
  const fvS = window.fogSea ? fogSea() : null;
  G.fleets.forEach(f => { if (fvS && f.n !== P && !G.allied(P, f.n) && !fvS.has(f.node)) return; if (zoomed || f.n === P || G.atWar(P, f.n) || (sel && sel.type === 'f' && sel.id === f.id)) (byN[f.node] = byN[f.node] || []).push(f); });
  Object.entries(byN).forEach(([node, list]) => {
    const s = D.sea.nodes[+node];
    list.forEach((f, idx) => {
      let lon = s.lon, lat = s.lat;
      if (f.mv && f.mv.nodes[f.mv.step] != null && f.mv.tot) { const t2 = D.sea.nodes[f.mv.nodes[f.mv.step]]; let x2 = t2.lon; if (x2 - lon > 180) x2 -= 360; else if (lon - x2 > 180) x2 += 360; const u = 1 - Math.max(0, f.mv.left) / f.mv.tot; lon += (x2 - lon) * u; lat += (t2.lat - lat) * u; }
      let [x, y] = toScreen(lon + sh, lat); y += idx * 15; if (x < -30 || x > innerWidth + 30) return;
      const war = G.atWar(P, f.n); ctx.font = '600 10px system-ui'; const txt = '⛴' + f.s.toFixed(0); const w = ctx.measureText(txt).width + 8;
      const isSel = sel && sel.type === 'f' && sel.id === f.id;
      ctx.fillStyle = G.N[f.n].color; ctx.strokeStyle = isSel ? '#ffd34d' : war ? '#ff3b3b' : f.n === P ? '#fff' : '#000'; ctx.lineWidth = isSel ? 3 : 1.2;
      roundRect(x - w / 2, y - 7, w, 14, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + 0.5);
      unitHit.push({ x, y, w, h: 14, type: 'f', id: f.id });
    });
  });
}

// шляхи логістики як у реальності: суходолом — через сусідні регіони (дороги, залізниці, труби), морем — морськими шляхами
const _linkPath = new Map();
function landPath(a, b) {
  const R = D.regions, n = R.length; const dist = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), done = new Uint8Array(n);
  const d2 = (i, j) => { let dx = R[i].c[0] - R[j].c[0]; if (dx > 180) dx -= 360; if (dx < -180) dx += 360; return Math.hypot(dx * Math.cos(R[i].c[1] * Math.PI / 180), R[i].c[1] - R[j].c[1]); };
  const H = [], push = (d, v) => { H.push([d, v]); let k = H.length - 1; while (k) { const q = (k - 1) >> 1; if (H[q][0] <= H[k][0]) break; [H[q], H[k]] = [H[k], H[q]]; k = q; } };
  const pop = () => { const top = H[0], last = H.pop(); if (H.length) { H[0] = last; let k = 0; for (;;) { let m = k; const l = 2 * k + 1, r = l + 1; if (l < H.length && H[l][0] < H[m][0]) m = l; if (r < H.length && H[r][0] < H[m][0]) m = r; if (m === k) break; [H[m], H[k]] = [H[k], H[m]]; k = m; } } return top; };
  dist[a] = 0; push(0, a);
  while (H.length) { const [du, u] = pop(); if (done[u]) continue; done[u] = 1; if (u === b) break; for (const v of R[u].nb) { if (done[v]) continue; const w = du + d2(u, v) * (R[v].t === 'mountain' ? 1.6 : 1); if (w < dist[v]) { dist[v] = w; prev[v] = u; push(w, v); } } }
  if (prev[b] < 0 && a !== b) return null; const out = []; for (let v = b; v >= 0; v = prev[v]) { out.push(R[v].c.slice()); if (v === a) break; } return out.reverse();
}
function seaPath(a, b) {
  const S = D.sea, R = D.regions, pa = R[a].p && R[a].p[0], pb = R[b].p && R[b].p[0]; if (!pa || !pb) return null;
  const adj = S._adj || (S._adj = (() => { const m = S.nodes.map(() => []); S.edges.forEach(([x, y]) => { m[x].push(y); m[y].push(x); }); return m; })());
  const nd = i => [S.nodes[i].lon, S.nodes[i].lat]; const dd = (p, q) => { let dx = p[0] - q[0]; if (dx > 180) dx -= 360; if (dx < -180) dx += 360; return Math.hypot(dx, p[1] - q[1]); };
  const s0 = pa[0], t0 = pb[0]; const dist = S.nodes.map(() => Infinity), prev = S.nodes.map(() => -1), done = S.nodes.map(() => 0); dist[s0] = 0;
  for (let it = 0; it < S.nodes.length; it++) { let u = -1; for (let k = 0; k < S.nodes.length; k++) if (!done[k] && (u < 0 || dist[k] < dist[u])) u = k; if (u < 0 || dist[u] === Infinity) break; done[u] = 1; if (u === t0) break; for (const v of adj[u]) { const w = dist[u] + dd(nd(u), nd(v)); if (w < dist[v]) { dist[v] = w; prev[v] = u; } } }
  const mid = []; if (s0 !== t0) { if (prev[t0] < 0) return null; for (let v = t0; v >= 0 && v !== s0; v = prev[v]) mid.push(nd(v)); mid.push(nd(s0)); mid.reverse(); } else mid.push(nd(s0));
  // узбережні порти: від центру регіону до порту, далі море
  const out = [R[a].c.slice(), [pa[1], pa[2]], ...mid, [pb[1], pb[2]], R[b].c.slice()];
  return out;
}
function linkPath(l) {
  const k = l.type + ':' + l.a + ':' + l.b; if (_linkPath.has(k)) return _linkPath.get(k);
  let p = null; try { p = l.type === 'sea' ? seaPath(l.a, l.b) : l.type === 'air' ? null : landPath(l.a, l.b); } catch (e) { p = null; }
  if (p) { for (let i = 1; i < p.length; i++) { while (p[i][0] - p[i - 1][0] > 180) p[i][0] -= 360; while (p[i - 1][0] - p[i][0] > 180) p[i][0] += 360; } }
  _linkPath.set(k, p); return p;
}
function drawLinks(lw) {
  if (!G.links || !G.links.length) return;
  const fvL = window.fogVis ? fogVis() : null, me = G.player >= 0 ? G.player : (G.leader ? G.leader.home : -1);
  for (const l of G.links) {
    if (fvL && l.n !== me && !(G.allied && me >= 0 && G.allied(me, l.n)) && !(fvL[l.a] && fvL[l.b])) continue;
    const L = D.linkTypes[l.type]; const a = D.regions[l.a].c, b = D.regions[l.b].c; let bx = b[0]; if (bx - a[0] > 180) bx -= 360; else if (a[0] - bx > 180) bx += 360;
    const st = G.linkVisible(l); ctx.globalAlpha = st === 'build' ? 0.45 : 1;
    ctx.strokeStyle = st === 'cut' ? '#ff3b3b' : L.col; ctx.lineWidth = lw * (l.type === 'air' ? 1.5 : 3); ctx.setLineDash(L.dash.map(x => x * lw * 1.5)); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.beginPath(); const P = l.type === 'air' ? null : linkPath(l);
    if (P && P.length >= 2) { ctx.moveTo(P[0][0], -P[0][1]); for (let i = 1; i < P.length - 1; i++) { const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2; ctx.quadraticCurveTo(P[i][0], -P[i][1], mx, -my); } const z = P[P.length - 1]; ctx.lineTo(z[0], -z[1]); }
    else { ctx.moveTo(a[0], -a[1]); const mx = (a[0] + bx) / 2, my = (a[1] + b[1]) / 2 + Math.hypot(bx - a[0], b[1] - a[1]) * (l.type === 'air' ? 0.15 : 0.08) * (l.type === 'sea' ? -1 : 1); ctx.quadraticCurveTo(mx, -my, bx, -b[1]); }
    ctx.stroke(); if (l.type === 'rail') { ctx.strokeStyle = '#fff'; ctx.lineWidth = lw; ctx.setLineDash([3 * lw, 7 * lw]); ctx.stroke(); }
    ctx.setLineDash([]); ctx.globalAlpha = 1;
  }
}
function drawBuildings(sh) {
  if (typeof streamOn !== "undefined" && streamOn) return; // чиста мапа на стрімі
  if (view.s < 9) return;
  const fv = window.fogVis ? fogVis() : null;
  G.ter.forEach((t, i) => { const ks = Object.keys(t.bld); const cons = G.constructions.filter(c => c.t === i && c.n === G.player); if (!ks.length && !cons.length) return;
    if (fv && !fv[i]) return; if (view.s < 16 && t.owner !== G.player) return;
    const c = D.regions[i].c; let [x, y] = toScreen(c[0] + sh, c[1]); if (x < 0 || x > innerWidth || y < 50 || y > innerHeight) return;
    const list = ks.sort((a, b) => t.bld[b] - t.bld[a]).slice(0, view.s < 16 ? 4 : 7).map(k => D.buildings[k].ic); if (cons.length) list.push('🏗');
    drawEmoRow(list, x, y - 25, 'rgba(255,255,255,0.85)'); });
}
// ряд піксельних іконок на «пігулці»
const _emoImg = new Image(); _emoImg.src = 'assets/ui/emoji.png';
function drawEmo(e, x, y, sz) { const p = typeof PX_EMO !== 'undefined' && PX_EMO[e]; if (p && _emoImg.complete) { ctx.imageSmoothingEnabled = false; ctx.drawImage(_emoImg, p[0] * 16, p[1] * 16, 16, 16, x - sz / 2, y - sz / 2, sz, sz); return true; } ctx.font = (sz - 2) + 'px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(e, x, y); return false; }
function drawEmoRow(list, x, y, bg) { const sz = 16, w = list.length * (sz + 1) + 6; ctx.fillStyle = bg; roundRect(x - w / 2, y - 10, w, 20, 9); ctx.fill(); ctx.fillStyle = '#000'; list.forEach((e, k) => drawEmo(e, x - w / 2 + 3 + sz / 2 + k * (sz + 1), y, sz)); }

// удари ракет і дронів: дуга від найближчої території нападника + спалах
function drawStrikes(sh) {
  const L = (G.strikes || []).filter(x => G.day - x.d <= 2); if (!L.length) return;
  L.forEach(x => {
    if (!x._src) { const c = D.regions[x.i].c; let best = null, bd = 1e9; G.ter.forEach((t, j) => { if (t.ctrl !== x.from) return; const d = Math.hypot(D.regions[j].c[0] - c[0], D.regions[j].c[1] - c[1]); if (d < bd) { bd = d; best = j; } }); x._src = best != null ? D.regions[best].c : c; }
    const a = toScreen(x._src[0] + sh, x._src[1]), b = toScreen(D.regions[x.i].c[0] + sh, D.regions[x.i].c[1]);
    const ph = ((animT * 0.6 + x.i * 0.13) % 1), mx = (a[0] + b[0]) / 2, my = Math.min(a[1], b[1]) - Math.hypot(b[0] - a[0], b[1] - a[1]) * 0.35;
    ctx.strokeStyle = x.w === 'missiles' ? 'rgba(255,120,60,0.55)' : 'rgba(255,210,90,0.45)'; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx, my, b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
    const u = ph, px = (1 - u) * (1 - u) * a[0] + 2 * (1 - u) * u * mx + u * u * b[0], py = (1 - u) * (1 - u) * a[1] + 2 * (1 - u) * u * my + u * u * b[1];
    ctx.fillStyle = '#fff'; ctx.fillRect(px - 2, py - 2, 4, 4);
    const r = 6 + 10 * ((animT * 1.5 + x.i) % 1); ctx.strokeStyle = `rgba(255,${x.hits ? 90 : 200},60,${1 - ((animT * 1.5 + x.i) % 1)})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b[0], b[1], r, 0, 7); ctx.stroke();
  });
}

// натовський умовний знак складу армії: піхота ✕, техніка — овал, артилерія — крапка, ППО — дуга
function drawNato(x, y, tpl, col) {
  ctx.save(); ctx.fillStyle = '#0b1320e6'; ctx.strokeStyle = col || '#fff'; ctx.lineWidth = 1.3; ctx.fillRect(x - 7, y - 5, 14, 10); ctx.strokeRect(x - 7, y - 5, 14, 10); ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.beginPath();
  if (tpl === 'inf' || tpl === 'std' || tpl === 'assault') { ctx.moveTo(x - 7, y - 5); ctx.lineTo(x + 7, y + 5); ctx.moveTo(x + 7, y - 5); ctx.lineTo(x - 7, y + 5); }
  if (tpl === 'tank' || tpl === 'mech' || tpl === 'std') { ctx.moveTo(x + 4.5, y); ctx.ellipse(x, y, 4.5, 2.6, 0, 0, Math.PI * 2); }
  ctx.stroke();
  if (tpl === 'assault') { ctx.beginPath(); ctx.arc(x, y - 1, 3, Math.PI, 0); ctx.stroke(); }
  if (tpl === 'art') { ctx.beginPath(); ctx.arc(x, y, 2.2, 0, Math.PI * 2); ctx.fill(); }
  if (tpl === 'shield') { ctx.beginPath(); ctx.arc(x, y + 5, 5, Math.PI, 0); ctx.stroke(); }
  ctx.restore();
}

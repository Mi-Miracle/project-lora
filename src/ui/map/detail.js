// МАПА: деталізація — дороги між містами (автомагістралі й звичайні дороги), будівлі в регіонах (нові — з підсвіткою),
// приватні залізниці компаній. Дороги будуються один раз із бази міст: сусідні міста в тому ж або суміжному регіоні.
let ROADS = null;
function buildRoads() {
  const C = GEO.cities.filter(c => c.reg != null && c.reg >= 0 && c.pop >= 60); const out = [], seen = new Set();
  const nb = i => D.regions[i].nb || [];
  C.forEach((a, ia) => {
    const cand = [];
    for (let ib = 0; ib < C.length; ib++) { if (ib === ia) continue; const b = C[ib]; const dx = Math.abs(a.lon - b.lon), dy = Math.abs(a.lat - b.lat); if (dx > 7 || dy > 5) continue;
      if (b.reg !== a.reg && !nb(a.reg).includes(b.reg)) continue; const d = LORA.core.hav(a.lon, a.lat, b.lon, b.lat); if (d > 520) continue; cand.push([d, ib]); }
    cand.sort((x, y) => x[0] - y[0]).slice(0, a.pop > 1500 ? 4 : 3).forEach(([d, ib]) => { const k = Math.min(ia, ib) + ':' + Math.max(ia, ib); if (seen.has(k)) return; seen.add(k); const b = C[ib];
      const hw = Math.min(a.pop, b.pop) >= 450 || (a.cap && b.pop >= 250) || (b.cap && a.pop >= 250);
      let bx = b.lon; if (bx - a.lon > 180) bx -= 360; else if (a.lon - bx > 180) bx += 360;
      // легкий вигин дороги, щоб не виглядала як лінійка
      const mx = (a.lon + bx) / 2 + (b.lat - a.lat) * 0.06 * (((ia * 7 + ib) % 3) - 1), my = (a.lat + b.lat) / 2 - (bx - a.lon) * 0.06 * (((ia + ib * 5) % 3) - 1);
      out.push({ a: [a.lon, a.lat], b: [bx, b.lat], m: [mx, my], hw, d }); });
  });
  ROADS = { hw: out.filter(r => r.hw), rd: out.filter(r => !r.hw) };
}
function drawRoads(lw) {
  if (!GEO || !GEO.cities || view.s < 100 || (window.AUD && AUD.S.roads === false)) return; if (typeof streamOn !== 'undefined' && streamOn) return; if (!ROADS) buildRoads();
  const path = list => { ctx.beginPath(); list.forEach(r => { ctx.moveTo(r.a[0], -r.a[1]); ctx.quadraticCurveTo(r.m[0], -r.m[1], r.b[0], -r.b[1]); }); };
  const det = view.s >= 150;
  if (view.s >= 140) { path(ROADS.rd); if (det) { ctx.strokeStyle = 'rgba(60,50,40,0.45)'; ctx.lineWidth = lw * 3; ctx.stroke(); } ctx.strokeStyle = det ? 'rgba(255,248,225,0.95)' : 'rgba(250,240,210,0.6)'; ctx.lineWidth = lw * (det ? 1.8 : 1); ctx.stroke(); }
  path(ROADS.hw); ctx.strokeStyle = 'rgba(70,40,10,0.55)'; ctx.lineWidth = lw * (det ? 4.6 : 2.6); ctx.stroke(); ctx.strokeStyle = det ? '#ffb347' : 'rgba(255,175,70,0.85)'; ctx.lineWidth = lw * (det ? 2.8 : 1.5); ctx.stroke();
  if (view.s >= 190) { ctx.setLineDash([lw * 4, lw * 4]); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = lw * 0.5; ctx.stroke(); ctx.setLineDash([]); }
}
// будівлі: у своїй країні з наближення 6, у чужих — з 14; на великому наближенні — окремі іконки навколо центру регіону з рівнем
function drawBuildings(sh) {
  if (typeof streamOn !== 'undefined' && streamOn) return; if (view.s < 120 || (window.AUD && AUD.S.blds === false)) return;
  const P = G.pv(), fv = window.fogVis ? fogVis() : null, NB = G.v29 && G.v29.newb || {};
  G.ter.forEach((t, i) => { const ks = Object.keys(t.bld).filter(k => t.bld[k] > 0); const cons = G.constructions.filter(c => c.t === i && (c.n === P || (c.co != null && c.co === G.pc))); if (!ks.length && !cons.length) return;
    if (fv && !fv[i]) return; if (t.owner !== P && !cons.length && view.s < 170) return;
    const c = D.regions[i].c; let [x, y] = toScreen(c[0] + sh, c[1]); if (x < -200 || x > innerWidth + 200 || y < -150 || y > innerHeight + 150) return;
    if (view.s < 160) { const list = ks.sort((a, b) => t.bld[b] - t.bld[a]).slice(0, view.s < 140 ? 3 : 6).map(k => D.buildings[k].ic); if (cons.length) list.push('🏗'); drawEmoRow(list, x, y - 25, 'rgba(255,255,255,0.85)'); if (ks.some(k => NB[i + ':' + k] > G.day - 30)) { ctx.fillStyle = '#4cd28a'; ctx.font = '700 10px system-ui'; ctx.textAlign = 'center'; ctx.fillText(t_('НОВЕ'), x, y - 40); } return; }
    // детально: кільце іконок
    const all = ks.sort((a, b) => t.bld[b] - t.bld[a]).slice(0, 18); const R0 = Math.min(150, 22 + view.s * 0.9);
    all.concat(cons.map(k => '__c' + k.id)).forEach((k, n, arr) => { const ang = n / arr.length * Math.PI * 2 - Math.PI / 2, rr = R0 * (0.55 + (n % 2) * 0.35); const bx = x + Math.cos(ang) * rr, by = y + Math.sin(ang) * rr * 0.7;
      const isC = k.startsWith('__c'); const isNew = !isC && NB[i + ':' + k] > G.day - 30;
      ctx.fillStyle = isC ? 'rgba(255,200,80,0.9)' : isNew ? 'rgba(120,230,150,0.95)' : 'rgba(255,255,255,0.88)'; ctx.beginPath(); ctx.arc(bx, by, 12, 0, 7); ctx.fill(); ctx.strokeStyle = '#1b2633'; ctx.lineWidth = 1; ctx.stroke();
      if (isC) { const cc = G.constructions.find(z => '__c' + z.id === k); drawEmo('🏗', bx, by, 16); if (cc) { const p = Math.min(1, (G.day - cc.start) / Math.max(1, cc.done - cc.start)); ctx.fillStyle = '#000a'; ctx.fillRect(bx - 12, by + 13, 24, 4); ctx.fillStyle = '#ffb000'; ctx.fillRect(bx - 12, by + 13, 24 * p, 4); } return; }
      drawEmo(D.buildings[k].ic, bx, by, 16); const lv = t.bld[k]; if (lv > 1) { ctx.font = '700 9px system-ui'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#1b2633'; ctx.fillText(lv >= 10 ? Math.round(lv) : lv.toFixed(lv % 1 ? 1 : 0), bx + 10, by - 10); }
      if (view.s >= 190) { ctx.font = '500 9px system-ui'; ctx.fillStyle = '#1b2633'; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2.5; const nm = t_(D.buildings[k].n); ctx.strokeText(nm, bx, by + 20); ctx.fillText(nm, bx, by + 20); } }); });
}

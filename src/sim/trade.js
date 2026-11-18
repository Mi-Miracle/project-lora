// ТОРГІВЛЯ: світовий ринок ресурсів, маршрути (суходіл + море), ціни, контракти.
// Маршрути рахуються на «логістичних клітинах» рівня країн (data/geo/cells.js) + морській мережі (data/geo/sea.js).
LORA.sim.register('trade', 40, function (G) {
  const { N, ter, RES, RI, T, nIdx } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav;
  const CELLS = G.D.cells, SN = G.D.sea.nodes, NC = CELLS.length, NS = SN.length;
  const cellIdx = {}; CELLS.forEach((c, i) => cellIdx[c.a3] = i);
  G.cellIdx = cellIdx;
  // режими перевезень: [море, суходіл, перевалка км]
  const MODES = [[1, 3.5, 400], [3.0, 0.8, 900], [1, 1.6, 250]];
  const cellAdj = CELLS.map(c => c.nb.map(a => cellIdx[a]).filter(j => j != null).map(j => [j, hav(c.c[0], c.c[1], CELLS[j].c[0], CELLS[j].c[1])]));
  const seaAdj = Array.from({ length: NS }, () => []);
  G.D.sea.edges.forEach(([a, b]) => { const d = hav(SN[a].lon, SN[a].lat, SN[b].lon, SN[b].lat); seaAdj[a].push([b, d]); seaAdj[b].push([a, d]); });
  const portAdj = Array.from({ length: NS }, () => []);
  CELLS.forEach((c, i) => c.p.forEach(p => portAdj[p[0]].push([i, hav(c.c[0], c.c[1], p[1], p[2]) * 0.8, p[3]])));
  G.seaAdj = seaAdj; G.chokeIdx = []; SN.forEach((s, i) => { if (s.ctl) G.chokeIdx.push(i); });
  G.cellCtrl = new Int32Array(NC).fill(-1);
  G.updateCells = function () {
    const best = {};
    ter.forEach(t => { const ci = cellIdx[t.cc]; if (ci == null) return; const m = best[ci] = best[ci] || {}; m[t.ctrl] = (m[t.ctrl] || 0) + t.gdp + 0.001; });
    for (let i = 0; i < NC; i++) { const m = best[i]; if (!m) { const o = nIdx[CELLS[i].o] != null ? nIdx[CELLS[i].o] : nIdx[CELLS[i].a3]; G.cellCtrl[i] = o != null ? o : -1; continue; } let bk = -1, bv = -1; for (const k in m) if (m[k] > bv) { bv = m[k]; bk = +k; } G.cellCtrl[i] = bk; }
  };
  G.nationCell = nid => { const h = N[nid].home; return h >= 0 ? cellIdx[T[h].cc] : null; };

  // ---------- блокування моря ----------
  G.seaBlockedFor = function (nat) {
    const blocked = new Uint8Array(NS); const doy = G.day % 365;
    SN.forEach((s, i) => {
      if (G.seaClosed[i] > G.day) blocked[i] = 1;
      if (s.id === 'NSR' && (doy < 182 || doy > 300)) blocked[i] = 1;
      if (s.ctl) for (const a3 of s.ctl) { const c = nIdx[a3]; if (c != null && c !== nat && N[c].alive && (G.atWar(c, nat) || (G.sanctions.has(c + '>' + nat) && s.id !== 'GIB' && s.id !== 'DAN'))) blocked[i] = 1; }
    });
    for (const f of G.fleets) if (f.node != null && !f.mv && G.atWar(f.n, nat)) blocked[f.node] = 1;
    return blocked;
  };
  // ---------- найкоротший шлях: клітини 0..NC-1, море NC.. ----------
  function dijkstra(src, nat, mode, seaBlk, nat2) {
    const [sf, lf, ph] = MODES[mode]; const NTOT = NC + NS;
    const dist = new Float64Array(NTOT).fill(Infinity), prev = new Int32Array(NTOT).fill(-1);
    const h = new U.Heap(); dist[src] = 0; h.push(0, src);
    const hostile = (c, x) => x != null && c !== x && c >= 0 && (G.atWar(c, x) || G.rel[c][x] < -60);
    while (h.size) {
      const [d, u] = h.pop(); if (d > dist[u]) continue;
      if (u < NC) {
        const cc = G.cellCtrl[u];
        if (u !== src && (hostile(cc, nat) || hostile(cc, nat2))) continue;
        for (const [v, km] of cellAdj[u]) { const c2 = G.cellCtrl[v]; const inf = c2 >= 0 ? N[c2].infraLvl : 0.5; const nd = d + km * lf * (1.5 - 0.5 * Math.min(1, inf)); if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } }
        const ex = G.extraCellAdj && G.extraCellAdj[mode][u]; if (ex) for (const [v, km] of ex) { const nd = d + km; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } }
        const cn = cc >= 0 ? N[cc] : null; const phx = ph * (1 - (cn && cn.portB || 0)) * (mode === 1 ? 1 - (cn && cn.lngB || 0) : 1);
        for (const p of CELLS[u].p) { if (seaBlk[p[0]]) continue; const sv = NC + p[0]; const nd = d + hav(CELLS[u].c[0], CELLS[u].c[1], p[1], p[2]) * 0.8 * lf + p[3] * sf + phx; if (nd < dist[sv]) { dist[sv] = nd; prev[sv] = u; h.push(nd, sv); } }
      } else {
        const s = u - NC;
        for (const [v, km] of seaAdj[s]) { if (seaBlk[v]) continue; const nd = d + km * sf + (SN[v].ctl ? (SN[v].id === 'VOLGA' ? 2500 : 150) : 0); const vv = NC + v; if (nd < dist[vv]) { dist[vv] = nd; prev[vv] = u; h.push(nd, vv); } }
        for (const [ci, land, seaKm] of portAdj[s]) { const nd = d + seaKm * sf + land * lf + ph; if (nd < dist[ci]) { dist[ci] = nd; prev[ci] = u; h.push(nd, ci); } }
      }
    }
    return { dist, prev };
  }
  const pathFrom = (prev, dst) => { const p = []; let u = dst, g = 0; while (u !== -1 && g++ < 500) { p.push(u); u = prev[u]; } return p.reverse(); };
  G.dijkstraCells = dijkstra;
  // лінія маршруту для мапи
  G.routeLine = function (path) {
    const pts = [];
    for (let k = 0; k < path.length; k++) {
      const u = path[k];
      if (u < NC) {
        const prv = path[k - 1], nxt = path[k + 1];
        if (prv != null && prv >= NC) { const pr = CELLS[u].p.find(p => p[0] === prv - NC); if (pr) pts.push([pr[1], pr[2]]); }
        pts.push([CELLS[u].c[0], CELLS[u].c[1]]);
        if (nxt != null && nxt >= NC) { const pr = CELLS[u].p.find(p => p[0] === nxt - NC); if (pr) pts.push([pr[1], pr[2]]); }
      } else pts.push([SN[u - NC].lon, SN[u - NC].lat]);
    }
    for (let k = 1; k < pts.length; k++) { const dx = pts[k][0] - pts[k - 1][0]; if (dx > 180) pts[k] = [pts[k][0] - 360, pts[k][1]]; else if (dx < -180) pts[k] = [pts[k][0] + 360, pts[k][1]]; }
    return pts;
  };
  G.NC = NC;

  // ---------- щотижневий розподіл торгівлі ----------
  const tariff = (a, b) => G.treaties.has(G.warKey(a, b)) ? 0 : G.allied(a, b) ? 0.02 : 0.05;
  G.allocateTrade = function () {
    G.updateCells();
    const flows = [], alive = N.filter(n => n.alive && G.nationCell(n.id) != null);
    const sup = {}, dem = {}; const NNn = N.length;
    RES.forEach(r => { sup[r] = new Float64Array(NNn); dem[r] = new Float64Array(NNn); });
    alive.forEach(n => RES.forEach(r => { const net = n.agg.prod[r] - n.agg.need[r]; if (net > 0) sup[r][n.id] = n.exportBan[r] ? 0 : net; else dem[r][n.id] = -net; }));
    // Кеш маршрутів між тижнями: перераховуємо лише коли змінилась геополітика (війни, санкції, блокади, контроль, закриті протоки)
    const doy = G.day % 365;
    const sig = [...G.wars.keys()].sort().join(',') + '|' + G.sanctions.size + '|' + [...G.sanctions].length + '|' + G.seaClosed.map(v => v > G.day ? 1 : 0).join('') + '|' + (doy >= 182 && doy <= 300) + '|' +
      G.fleets.filter(f => !f.mv && G.enemiesOf(f.n).length).map(f => f.n + ':' + f.node).sort().join(',') + '|' + Array.from(G.cellCtrl).join(',') + '|' + Math.round(G.day / 120) + '|' + (G.links ? G.links.filter(l => l.built && !l.cut).length : 0);
    if (G._routeSig !== sig) { G._routeSig = sig; G._routeCache = { routes: {}, blk: {}, pairs: {} }; }
    const routeCache = G._routeCache.routes, blkCache = G._routeCache.blk;
    const blk = x => blkCache[x] || (blkCache[x] = G.seaBlockedFor(x));
    const R1 = (x, mode) => { const k = x + ':' + mode; return routeCache[k] || (routeCache[k] = dijkstra(G.nationCell(x), x, mode, blk(x))); };
    const pathOk = (path, X) => { const b = blk(X); for (let k = 1; k < path.length - 1; k++) { const u = path[k]; if (u < NC) { const c = G.cellCtrl[u]; if (c >= 0 && c !== X && (G.atWar(c, X) || G.rel[c][X] < -60)) return false; } else if (b[u - NC]) return false; } return true; };
    const pairCache = G._routeCache.pairs;
    const getRoute = (from, to, mode) => { const pk = from + '>' + to + ':' + mode; if (pk in pairCache) return pairCache[pk]; return (pairCache[pk] = getRoute0(from, to, mode)); };
    const getRoute0 = (from, to, mode) => {
      const cf = G.nationCell(from), ct = G.nationCell(to);
      const A = R1(from, mode); const d = A.dist[ct];
      if (isFinite(d)) { const p = pathFrom(A.prev, ct); if (pathOk(p, to)) return { d, path: p }; }
      const B = R1(to, mode); const d2 = B.dist[cf];
      if (isFinite(d2)) { const p = pathFrom(B.prev, cf).reverse(); if (pathOk(p, from)) return { d: d2, path: p }; }
      if (!isFinite(d) && !isFinite(d2)) return null;
      const ub = new Uint8Array(NS); const bf = blk(from), bt = blk(to); for (let i = 0; i < NS; i++) ub[i] = bf[i] || bt[i];
      const C = dijkstra(cf, from, mode, ub, to); const d3 = C.dist[ct];
      return isFinite(d3) ? { d: d3, path: pathFrom(C.prev, ct) } : null;
    };
    const canTrade = (a, b) => a !== b && !G.atWar(a, b) && !G.sanctioned(a, b) && G.rel[a][b] > -70 && N[a].alive && N[b].alive;
    // контракти гравця (пріоритет)
    G.contracts = G.contracts.filter(c => N[c.partner] && N[c.partner].alive);
    G.contracts.forEach(c => {
      c.ok = false; c.reason = '';
      const ex = c.dir === 'export' ? G.player : c.partner, im = c.dir === 'export' ? c.partner : G.player;
      if (!canTrade(ex, im)) { c.reason = 'торгівля заборонена'; return; }
      const R = getRoute(ex, im, RI[c.r].mode); if (!R) { c.reason = 'немає маршруту'; return; }
      const q = Math.min(c.q, Math.max(0, N[ex].agg.prod[c.r] - (ex === G.player ? 0 : N[ex].agg.need[c.r] * 0.5)));
      if (q <= 0) { c.reason = 'немає обсягу'; return; }
      flows.push({ r: c.r, from: ex, to: im, q, km: R.d, path: R.path, contract: true });
      sup[c.r][ex] = Math.max(0, sup[c.r][ex] - q); dem[c.r][im] = Math.max(0, dem[c.r][im] - q);
      c.ok = true; c.qa = q;
    });
    const rnd = G.rnd;
    RES.forEach(r => {
      const exporters = alive.filter(n => sup[r][n.id] > 1e-6).map(n => n.id);
      const importers = alive.filter(n => dem[r][n.id] > 1e-6).map(n => n.id);
      if (!exporters.length) return;
      const optsOf = {};
      importers.forEach(j => {
        if (j === G.player && !N[j].autoTrade) return;
        const opts = [];
        exporters.forEach(i => { if (!canTrade(i, j) || (G.tradeBan && G.tradeBan(i, j, r))) return; if (i === G.player && !N[i].autoTrade) return; const R = getRoute(i, j, RI[r].mode); if (!R) return;
          opts.push({ i, landed: 1 + RI[r].tc * R.d / 1000 + tariff(i, j) + (G.extraTariff ? G.extraTariff(i, j) : 0) - G.rel[i][j] / 2000, R }); });
        opts.sort((a, b) => a.landed - b.landed); optsOf[j] = opts;
      });
      const fl = {};
      for (let round = 0; round < 5; round++) {
        const ord = importers.filter(j => optsOf[j]); for (let k = ord.length - 1; k > 0; k--) { const m = Math.floor(rnd() * (k + 1)); [ord[k], ord[m]] = [ord[m], ord[k]]; }
        ord.forEach(j => {
          let want = dem[r][j] * (round === 4 ? 1 : 1 / (5 - round));
          for (const o of optsOf[j]) {
            if (want <= 1e-7) break;
            const q = Math.min(want, sup[r][o.i]); if (q <= 1e-7) continue;
            sup[r][o.i] -= q; dem[r][j] -= q; want -= q;
            const key = o.i + '>' + j; if (fl[key]) fl[key].q += q; else { fl[key] = { r, from: o.i, to: j, q, km: o.R.d, path: o.R.path }; flows.push(fl[key]); }
          }
        });
      }
    });
    flows.forEach(f => { f.val = f.q * G.prices[f.r]; }); // f.line будується ліниво в інтерфейсі (G.routeLine)
    G.flows = flows; G.unsold = sup; G.unmet = dem;
    G.chokeTraffic = new Float64Array(NS);
    flows.forEach(f => f.path.forEach(u => { if (u >= NC && SN[u - NC].ctl) G.chokeTraffic[u - NC] += f.val; }));
  };

  // ---------- щоденне застосування торгівлі та ціни ----------
  G.applyTradeDaily = function () {
    N.forEach(n => { if (!n.alive) return; RES.forEach(r => { n.imp[r] = 0; n.exp[r] = 0; }); n.stats.exp = 0; n.stats.imp = 0; n.stats.trCost = 0; });
    for (const f of G.flows) {
      const a = N[f.from], b = N[f.to]; if (!a.alive || !b.alive) continue;
      a.exp[f.r] += f.q; b.imp[f.r] += f.q;
      const v = f.q * G.prices[f.r]; a.stats.exp += v; b.stats.imp += v; b.stats.trCost += v * RI[f.r].tc * f.km / 1000;
    }
    RES.forEach((r, ri) => {
      let need = 0, used = 0;
      N.forEach(n => { if (!n.alive) return; const avail = n.agg.prod[r] - n.exp[r] + n.imp[r]; need += n.agg.need[r]; used += Math.min(avail, n.agg.need[r]); });
      const target = G.priceBase[r] * clamp(Math.pow(need / Math.max(1e-6, used), 3), 0.5, 5) * (1 + 0.03 * Math.sin(G.day / 97 + ri));
      const sh = G.priceShock && G.priceShock[r]; const tgt = sh && sh.until > G.day ? target * (1 + (sh.m - 1) * Math.min(1, (sh.until - G.day) / 180)) : target;
      G.prices[r] += (tgt - G.prices[r]) * 0.05;
    });
  };
});

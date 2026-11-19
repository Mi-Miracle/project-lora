// ВІЙСЬКО: армії та флоти, рух (суходіл/море), бої з урахуванням рельєфу, постачання, окупація регіонів, капітуляція.
LORA.sim.register('military', 50, function (G) {
  const { N, ter, T, NT } = G; const U = LORA.core, clamp = U.clamp, hav = U.hav;
  const SN = G.D.sea.nodes, NS = SN.length;
  // рельєф: бонус оборони, швидкість, складність постачання
  const TERRAIN = { plains: { def: 1.0, spd: 1.0, sup: 1.0, n: 'рівнина' }, steppe: { def: 1.0, spd: 1.05, sup: 0.95, n: 'степ' }, forest: { def: 1.15, spd: 0.8, sup: 0.9, n: 'ліс' },
    hills: { def: 1.25, spd: 0.75, sup: 0.9, n: 'пагорби' }, mountain: { def: 1.5, spd: 0.5, sup: 0.75, n: 'гори' }, desert: { def: 0.95, spd: 0.85, sup: 0.7, n: 'пустеля' }, arctic: { def: 1.1, spd: 0.5, sup: 0.55, n: 'арктика' } };
  G.TERRAIN = TERRAIN;
  const tr = i => TERRAIN[T[i].t] || TERRAIN.plains;
  // міська забудова: великі міста й столиці різко посилюють оборону (вуличні бої)
  const urban = new Float64Array(T.length); (G.D.cities || []).forEach(c => { if (c.reg == null || c.reg < 0) return; const v = c.pop >= 1000 ? 0.35 : c.pop >= 400 ? 0.15 : 0; urban[c.reg] = Math.max(urban[c.reg], v + (c.cap ? 0.25 : 0)); });
  G.urbanDef = i => urban[i];
  const regAdj = T.map(t => t.nb.map(j => [j, hav(t.c[0], t.c[1], T[j].c[0], T[j].c[1])]));
  const seaAdj = G.seaAdj;

  G.ordName = (k, what) => LORA.lang === 'en' ? `${k}${['th', 'st', 'nd', 'rd'][(k % 100 > 10 && k % 100 < 14) ? 0 : Math.min(k % 10, 4) % 4] || 'th'} ${what === 'army' ? 'Army' : 'Fleet'}` : (what === 'army' ? `${k}-а армія` : `${k}-й флот`);
  G.newArmy = function (nid, t, k, name) { const a = { id: G.nextId++, n: nid, t, k, org: 1, sup: 1, mv: null, name: name || G.ordName(G.armies.filter(x => x.n === nid).length + 1, 'army'), auto: nid !== G.player, train: 0, kind: 'land', stance: 'hold' }; G.armies.push(a); return a; };
  G.newFleet = function (nid, node, s, name) { const f = { id: G.nextId++, n: nid, node, s, org: 1, mv: null, name: name || G.ordName(G.fleets.filter(x => x.n === nid).length + 1, 'fleet'), auto: nid !== G.player }; G.fleets.push(f); return f; };
  G.nationPorts = nid => { const h = N[nid].home; if (h >= 0 && T[h].p.length) return T[h].p; const r = ter.find(t => t.ctrl === nid && T[t.i].p.length); return r ? T[r.i].p : []; };

  // Початкове розміщення: столиця + прикордонні регіони з недружніми сусідами
  G.initForces = function () {
    N.forEach(n => {
      if (!n.alive || n.home < 0) return;
      const tb = n.troopsBase;
      if (tb > 0) {
        const parts = U.clamp(Math.round(tb / 140), 1, 8);
        const own = ter.filter(t => t.owner === n.id);
        const border = own.filter(t => T[t.i].nb.some(j => ter[j].owner !== n.id && G.rel[n.id][ter[j].owner] < 20)).map(t => t.i);
        for (let k = 0; k < parts; k++) {
          const loc = k === 0 || !border.length ? n.home : border[(k * 7) % border.length];
          G.newArmy(n.id, loc, tb / parts, G.ordName(k + 1, 'army'));
        }
      }
      if (n.ships > 0) { const ports = G.nationPorts(n.id); if (ports.length) { const parts = n.ships > 150 ? 3 : n.ships > 50 ? 2 : 1; for (let k = 0; k < parts; k++) G.newFleet(n.id, ports[k % ports.length][0], n.ships / parts, ['Перший', 'Другий', 'Третій'][k] + ' флот'); } }
    });
  };

  G.armyPower = function (a) {
    const n = N[a.n], t = ter[a.t];
    const def = (t.ctrl === a.n || G.allied(t.ctrl, a.n) || G.coBelligerent(t.ctrl, a.n)) && !G.atWar(t.ctrl, a.n);
    const fort = t.fort || 0;
    const B = G.B; let m = def ? (B.defBase + 0.3 * N[t.ctrl].infraLvl) * tr(a.t).def * (1 + fort * B.fortDef) * (1 + (t.bfort || 0)) * (1 + urban[a.t]) : 1;
    if (!def && t.occ && t.occ.by === a.n) m = 1 + (0.5 + fort * B.fortDef) * t.occ.p / 100; // утримує вже захоплену частину регіону
    return a.k * n.q * (0.25 + 0.75 * a.org) * (0.3 + 0.7 * a.sup) * m * (a.train > 0 ? 0.3 : 1);
  };

  // ---------- шляхи ----------
  G.landPath = function (nid, from, to) {
    const dist = new Float64Array(NT).fill(Infinity), prev = new Int32Array(NT).fill(-1); const h = new U.Heap(); dist[from] = 0; h.push(0, from);
    while (h.size) {
      const [d, u] = h.pop(); if (d > dist[u]) continue; if (u === to) break;
      if (u !== from && !G.friendlyTo(nid, ter[u].ctrl)) continue;
      for (const [v, km] of regAdj[u]) {
        const c = ter[v].ctrl; const enemy = G.atWar(nid, c); if (!(G.friendlyTo(nid, c) || enemy)) continue;
        const sp = enemy ? 30 * tr(v).spd : 160 * (0.5 + N[c].infraLvl * 0.5) * tr(v).spd;
        const nd = d + (enemy ? km * 0.5 : km) / sp; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); }
      }
      const ex = G.extraRegAdj && G.extraRegAdj[u]; if (ex) for (const [v, km, spd] of ex) { const c = ter[v].ctrl; if (!G.friendlyTo(nid, c)) continue; const nd = d + km / spd; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } }
    }
    if (!isFinite(dist[to])) return null; const p = []; let u = to; while (u !== -1) { p.push(u); u = prev[u]; } p.reverse(); return { path: p, days: dist[to] };
  };
  function seaGraphPath(nid, starts, goalFn, forFleet) {
    const blk = forFleet ? fleetBlocked(nid) : G.seaBlockedFor(nid);
    const BOSi = SN.findIndex(s => s.id === 'BOS'); const turk = G.nIdx.TUR;
    const dist = new Float64Array(NS).fill(Infinity), prev = new Int32Array(NS).fill(-1); const h = new U.Heap();
    starts.forEach(([s, d0]) => { if (!blk[s] || forFleet) { dist[s] = d0; h.push(d0, s); } });
    while (h.size) { const [d, u] = h.pop(); if (d > dist[u]) continue;
      for (const [v, km] of seaAdj[u]) { if (blk[v] && !(forFleet && goalFn(v))) continue; if (v === BOSi && G.enemiesOf(nid).length && nid !== turk && !G.enemiesOf(nid).some(e => G.atWar(e, turk))) continue; const nd = d + km; if (nd < dist[v]) { dist[v] = nd; prev[v] = u; h.push(nd, v); } } }
    return { dist, prev };
  }
  function fleetBlocked(nid) { const b = new Uint8Array(NS); const doy = G.day % 365; SN.forEach((s, i) => { if (G.seaClosed[i] > G.day) b[i] = 1; if (s.id === 'NSR' && (doy < 182 || doy > 300)) b[i] = 1; if (s.ctl) for (const a3 of s.ctl) { const c = G.nIdx[a3]; if (c != null && c !== nid && G.atWar(c, nid)) b[i] = 1; } }); return b; }
  G.seaPath = function (nid, from, to) {
    const R = seaGraphPath(nid, T[from].p.map(p => [p[0], p[3]]), () => false, false);
    let best = Infinity, bn = -1; T[to].p.forEach(p => { if (R.dist[p[0]] + p[3] < best) { best = R.dist[p[0]] + p[3]; bn = p[0]; } });
    if (bn < 0) return null; const nodes = []; let u = bn; while (u !== -1) { nodes.push(u); u = R.prev[u]; } nodes.reverse();
    return { nodes, km: best, days: best / 500 + 3 };
  };
  G.fleetPath = function (nid, from, to) {
    const R = seaGraphPath(nid, [[from, 0]], v => v === to, true); if (!isFinite(R.dist[to])) return null;
    const nodes = []; let u = to; while (u !== -1) { nodes.push(u); u = R.prev[u]; } nodes.reverse(); return { nodes, km: R.dist[to] };
  };

  // ---------- накази ----------
  const legDays = (nid, u, v) => { const km = hav(T[u].c[0], T[u].c[1], T[v].c[0], T[v].c[1]); const c = ter[v].ctrl; const ex = G.extraRegAdj && G.extraRegAdj[u].find(e => e[0] === v); if (ex && G.friendlyTo(nid, c) && !G.atWar(nid, c)) return Math.max(0.5, km / ex[2]); return G.atWar(nid, c) ? Math.max(1.5, km * 0.5 / (30 * tr(v).spd)) : Math.max(0.5, km / (160 * (0.5 + N[c].infraLvl * 0.5) * tr(v).spd)); };
  G.orderMove = function (a, to, bySea) {
    if (a.t === to) { a.mv = null; return { ok: true }; }
    if (bySea) {
      const sp = G.seaPath(a.n, a.t, to); if (!sp) return { ok: false, err: 'Немає безпечного морського маршруту (блокада або немає портів)' };
      const cap = G.shipsOf(a.n) * 6 * (G.landMult ? G.landMult(a.n) : 1), inTransit = G.armies.filter(x => x.n === a.n && x.mv && x.mv.sea).reduce((s, x) => s + x.k, 0);
      if (a.k + inTransit > cap) return { ok: false, err: `Бракує транспортного флоту: місткість ${cap.toFixed(0)} тис., потрібно ${(a.k + inTransit).toFixed(0)} тис.` };
      if (!G.friendlyTo(a.n, ter[to].ctrl) && !G.atWar(a.n, ter[to].ctrl)) return { ok: false, err: 'Нейтральна територія: потрібен військовий доступ' };
      a.mv = { sea: true, nodes: sp.nodes, dst: to, days: sp.days, left: sp.days, tot: sp.days };
      return { ok: true, days: sp.days };
    }
    const lp = G.landPath(a.n, a.t, to); if (!lp) return { ok: false, err: 'Немає сухопутного шляху (нейтральні країни без доступу або море)' };
    // з неконтрольованого (ворожого) регіону можна лише відступити на свою територію — прорив углиб без контролю тилу неможливий
    if (G.atWar(a.n, ter[a.t].ctrl) && lp.path[1] != null && !G.friendlyTo(a.n, ter[lp.path[1]].ctrl)) return { ok: false, err: 'Спершу встановіть контроль над цим регіоном' };
    const l = legDays(a.n, lp.path[0], lp.path[1]);
    a.mv = { sea: false, path: lp.path, step: 1, left: l, tot: l, dst: to };
    return { ok: true, days: lp.days };
  };
  G.orderFleet = function (f, node) { const p = G.fleetPath(f.n, f.node, node); if (!p) return { ok: false, err: 'Шлях закрито' }; f.mv = { nodes: p.nodes, step: 1, left: 0 }; return { ok: true, days: p.km / 700 }; };

  G.moveUnits = function () {
    for (const a of G.armies) {
      if (a.train > 0) { a.train--; continue; }
      if (!a.mv) continue; const m = a.mv;
      if (m.sea) { m.left--; if (m.left <= 0) { const c = ter[m.dst].ctrl; if (!G.friendlyTo(a.n, c) && !G.atWar(a.n, c)) { a.mv = null; continue; } a.t = m.dst; a.mv = null; if (G.atWar(a.n, c)) { a.org *= 0.6; a.stance = 'attack'; G.say(`⚓ ${G.nm(a.n)}: морський десант — ${T[a.t].n}`, 'war', [a.n, c]); } } continue; }
      const v = m.path[m.step]; const c = ter[v].ctrl;
      if (!(G.friendlyTo(a.n, c) || G.atWar(a.n, c))) { a.mv = null; continue; }
      m.left -= G.seasonSpeed ? G.seasonSpeed(a.t) : 1;
      if (m.left <= 0) {
        a.t = v; m.step++;
        if (G.atWar(a.n, c)) { a.mv = null; a.stance = 'attack'; } else if (m.step >= m.path.length) { a.mv = null; }
        else { m.left = legDays(a.n, v, m.path[m.step]); m.tot = m.left; }
      }
    }
    for (const f of G.fleets) {
      if (!f.mv) continue; const m = f.mv; if (m.step >= m.nodes.length) { f.mv = null; continue; }
      const u = f.node, v = m.nodes[m.step];
      if (m.left <= 0) { m.left = hav(SN[u].lon, SN[u].lat, SN[v].lon, SN[v].lat) / 700; m.tot = m.left; }
      m.left -= 1; if (m.left <= 0) { f.node = v; m.step++; if (m.step >= m.nodes.length) f.mv = null; else m.left = 0; }
    }
  };

  // ---------- бої ----------
  const pw2 = a => a.k * N[a.n].q * (0.3 + 0.7 * a.sup);
  G.combat = function () {
    const byT = new Map();
    for (const a of G.armies) { if (a.mv && a.mv.sea) continue; if (!byT.has(a.t)) byT.set(a.t, []); byT.get(a.t).push(a); }
    G.battles = [];
    byT.forEach((list, ti) => {
      if (list.length < 2) return;
      let fight = false; for (let i = 0; i < list.length && !fight; i++) for (let j = i + 1; j < list.length; j++) if (G.atWar(list[i].n, list[j].n)) { fight = true; break; }
      if (!fight) return;
      const pw = list.map(G.armyPower); const t = ter[ti];
      // інтенсивність: штурм, якщо хоч одна сторона наступає; інакше — позиційні бої
      const hot = list.some(a => a.stance === 'attack'); const I = hot ? 1 : G.B.holdIntensity;
      t.dmg = Math.min(0.35, t.dmg + 0.0006 * I); G.battles.push(ti); (G.battleHot = G.battleHot || {})[ti] = hot;
      list.forEach(a => { let E = 0, F = 0; list.forEach((b, j) => { if (G.atWar(a.n, b.n)) E += pw[j]; else F += pw[j]; }); if (E <= 0) { a.inCombat = false; return; }
        a.inCombat = true; const ratio = E / Math.max(0.01, F); const tt = ter[a.t]; const defending = (tt.ctrl === a.n || G.allied(tt.ctrl, a.n)) && !G.atWar(tt.ctrl, a.n);
        const lm = a.stance === 'attack' ? G.B.attackerLoss : defending ? 1 - Math.min(0.5, ((tt.fort || 0) + (tt.bfort || 0)) * 0.35) : 1;
        a.lossToday = Math.min(a.k * 0.03, a.k * G.B.combatLoss * ratio * I * lm * (0.8 + 0.4 * G.rnd())); a.org = clamp(a.org - G.B.orgDrain * ratio * I + 0.002 * a.sup, 0, 1); if (a.stance === 'attack' && a.org < 0.35) a.stance = 'hold'; });
      list.forEach(a => { if (!a.lossToday) return; const n = N[a.n]; n.milStock = Math.max(0, n.milStock - a.lossToday * (n.milStock / Math.max(1, G.troopsOf(a.n))) * 0.4); a.k -= a.lossToday; n.casualties += a.lossToday; n.casualtiesDay = (n.casualtiesDay || 0) + a.lossToday; a.lossToday = 0; });
    });
    // Обстріли через лінію зіткнення (артилерія, дрони): армії в сусідніх регіонах воюючих сторін несуть невеликі втрати
    byT.forEach((list, ti) => list.forEach(a => {
      if (a.inCombat || (a.mv && a.mv.sea)) return; let adjE = 0;
      for (const j of T[ti].nb) { const l2 = byT.get(j); if (!l2) continue; for (const b of l2) if (G.atWar(a.n, b.n)) adjE += pw2(b); }
      if (!adjE) return; const my = Math.max(1, pw2(a)); a.atFront = true;
      const tf = ter[ti].ctrl === a.n ? 1 - Math.min(0.5, ((ter[ti].fort || 0) + (ter[ti].bfort || 0)) * 0.35) : 1;
      const l = Math.min(a.k * 0.004, a.k * G.B.combatLoss * 0.3 * G.B.holdIntensity * Math.sqrt(adjE / my) * tf * (0.6 + 0.8 * G.rnd()));
      a.k -= l; N[a.n].casualties += l; N[a.n].casualtiesDay = (N[a.n].casualtiesDay || 0) + l;
    }));
    for (const a of G.armies) {
      if (a.k < 0.5) { a.dead = true; continue; }
      if (a.inCombat && a.org < 0.12) {
        const opts = T[a.t].nb.filter(j => G.friendlyTo(a.n, ter[j].ctrl) && !G.atWar(a.n, ter[j].ctrl) && !G.armies.some(e => e.t === j && G.atWar(e.n, a.n)));
        if (opts.length) { a.t = opts[0]; a.mv = null; a.org = 0.2; G.say(`🏳 ${G.nm(a.n)}: «${a.name}» відступає (${T[a.t].n})`, 'war', [a.n]); }
        else if (ter[a.t].ctrl === a.n) a.org = 0.12; // остання оборона на своїй землі
        else { a.dead = true; if (G.capturePOW) { const cap = ter[a.t].ctrl !== a.n ? ter[a.t].ctrl : (G.armies.find(x => x.t === a.t && G.atWar(x.n, a.n)) || {}).n; G.capturePOW(cap, a.n, a.k * 0.6); } G.say(`☠ ${G.nm(a.n)}: «${a.name}» оточена й капітулювала (${T[a.t].n}, ${a.k.toFixed(0)} тис.)`, 'bad', [a.n]); N[a.n].casualties += a.k; }
      }
      if (!a.inCombat) a.org = clamp(a.org + 0.012 * a.sup, 0, 1);
      a.inCombat = false;
    }
    G.armies = G.armies.filter(a => !a.dead);
    // флоти
    const byN = new Map(); for (const f of G.fleets) { if (!byN.has(f.node)) byN.set(f.node, []); byN.get(f.node).push(f); }
    byN.forEach(list => { if (list.length < 2) return; const pw = list.map(f => f.s * N[f.n].navQ * (G.fleetMult ? G.fleetMult(f) : 1) * (0.3 + 0.7 * f.org));
      list.forEach(f => { let E = 0, F = 0; list.forEach((g, j) => { if (G.atWar(f.n, g.n)) E += pw[j]; else F += pw[j]; }); if (!E) return; const r = E / Math.max(0.01, F); f.dl = Math.min(f.s * 0.05, f.s * 0.008 * r * (0.7 + 0.6 * G.rnd())); f.org = clamp(f.org - 0.02 * r + 0.005, 0, 1); f.fought = true; });
      list.forEach(f => { if (f.dl) { f.s -= f.dl; f.dl = 0; } }); });
    for (const f of G.fleets) {
      if (f.s < 0.5) { f.dead = true; G.say(`🌊 ${G.nm(f.n)}: «${f.name}» знищено`, 'bad', [f.n]); continue; }
      if (f.fought && f.org < 0.15) { const p = G.nationPorts(f.n)[0]; if (p) { G.orderFleet(f, p[0]); if (f.n === G.player || G.atWar(f.n, G.pv ? G.pv() : G.player)) G.say(`🌊 ${G.nm(f.n)}: «${f.name}» відходить до бази`, 'war', [f.n]); } f.org = 0.15; }
      if (!f.fought) f.org = clamp(f.org + 0.01, 0, 1); f.fought = false;
    }
    G.fleets = G.fleets.filter(f => !f.dead);
  };

  // ---------- постачання ----------
  G.supplyTarget = function (a) {
    const n = N[a.n], t = ter[a.t]; const oil = Math.pow(n.ratio.oil, 0.6); const tt = tr(a.t);
    if (G.friendlyTo(a.n, t.ctrl) && !G.atWar(a.n, t.ctrl)) return clamp((0.75 + 0.25 * n.infraLvl) * oil * (0.85 + 0.15 * tt.sup), 0.1, 1);
    const landLink = T[a.t].nb.some(j => G.friendlyTo(a.n, ter[j].ctrl) && !G.atWar(a.n, ter[j].ctrl));
    const sizeF = 1 - Math.min(0.45, Math.sqrt(t.area) / 9000);
    if (landLink) return clamp(0.85 * sizeF * (0.7 + 0.3 * n.infraLvl) * oil * tt.sup, 0.1, 1);
    const blk = G.seaBlockedFor(a.n);
    if (T[a.t].p.some(p => !blk[p[0]])) return clamp(0.55 * sizeF * oil * Math.min(1, G.shipsOf(a.n) / 20), 0.1, 0.7);
    return 0.12;
  };
  G.supplyAndAttrition = function () {
    for (const a of G.armies) {
      if (a.mv && a.mv.sea) { a.sup = Math.max(0.5, a.sup - 0.01); continue; }
      const tg = G.supplyTarget(a); a.supTarget = tg; a.sup += (tg - a.sup) * 0.06;
      if (a.sup < 0.5) { const l = a.k * 0.002 * (0.5 - a.sup) / 0.5; a.k -= l; N[a.n].casualties += l; }
    }
  };

  // ---------- окупація та капітуляція ----------
  // Територіальна оборона: населення й інфраструктура чинять опір навіть без армії
  // національний опір: що більше втрачено, то запекліше обороняються решта регіонів
  const garrison = t => { if (t.ctrl !== t.owner) return 0; const n = N[t.ctrl]; const lost = n.agg ? n.agg.occLost / Math.max(1, n.agg.gdpPot + n.agg.occLost) : 0; return (t.pop * 1000 * 0.003 + 1) * n.q * (0.5 + n.infraLvl) * (1 + 6 * lost) * (1 + (t.bfort || 0)); };
  G.garrison = garrison;
  G.occupation = function () {
    const byT = new Map();
    for (const a of G.armies) { if ((a.mv && a.mv.sea) || a.train > 0) continue; if (!byT.has(a.t)) byT.set(a.t, []); byT.get(a.t).push(a); }
    ter.forEach((t, ti) => {
      const list = byT.get(ti) || []; const c = t.ctrl;
      const defenders = list.filter(a => a.n === c || (!G.atWar(a.n, c) && (G.coBelligerent(a.n, c) || G.allied(a.n, c))));
      const attackers = list.filter(a => G.atWar(a.n, c));
      if (attackers.length && !defenders.some(a => a.k > 1)) {
        const pw = {}; attackers.forEach(a => pw[a.n] = (pw[a.n] || 0) + a.k * N[a.n].q * (0.3 + 0.7 * a.sup));
        let by = +Object.keys(pw).sort((x, y) => pw[y] - pw[x])[0]; if (pw[t.owner] && t.owner !== c) by = t.owner;
        if (!t.occ || t.occ.by !== by) t.occ = { by, p: t.occ ? t.occ.p * 0.5 : 0 };
        const denom = Math.sqrt(t.area) * 6 + t.pop * 25 + 60;
        const liberation = by === t.owner || by === t.core;
        t.occ.p += Math.min(G.B.occCap, G.B.occRate * Math.max(0, pw[by] - garrison(t)) / denom / tr(ti).def) * (liberation ? 2.5 : 1);
        t.dmg = Math.min(0.35, t.dmg + 0.0004);
        if (t.occ.p >= 100) { const old = c; t.ctrl = by; t.occ = null; list.forEach(a => a.stance = 'hold'); LORA.bus.emit('capture', { region: ti, by, from: old });
          G.say(liberation ? `🎉 Звільнено: ${T[ti].n} (${G.nm(by)})` : `🚩 ${G.nm(by)} встановлює контроль: ${T[ti].n} (раніше — ${G.nm(old)})`, 'war', [by, old]); G.checkCapitulation(old); }
      } else if (t.occ && !attackers.length) {
        // контрнаступ: повільне звільнення захопленої частини, якщо ворожих військ немає
        const dp = defenders.reduce((s, a) => s + a.k * N[a.n].q * (0.3 + 0.7 * a.sup), 0);
        // окупант, що стоїть у сусідніх регіонах, утримує захоплену частину
        let hold = 0; for (const j of T[ti].nb) { const l2 = byT.get(j); if (l2) for (const b of l2) if (b.n === t.occ.by) hold += b.k * N[b.n].q * (0.3 + 0.7 * b.sup); }
        const denom = Math.sqrt(t.area) * 6 + t.pop * 25 + 60;
        t.occ.p -= (dp > 0 ? Math.min(1.2, 6 * Math.max(0, dp - hold * 0.8) / denom) : (hold ? 0 : 0.03)) / (1 + (t.fort || 0));
        if (t.occ.p <= 0) t.occ = null;
      }
      if (!list.length || !attackers.length) t.dmg = Math.max(0, t.dmg - 0.0007);
      // укріплення: ростуть там, де фронт стоїть на місці (окопи, мінні поля, бетон)
      const frontline = list.length && T[ti].nb.some(j => G.atWar(ter[j].ctrl, t.ctrl) || (ter[j].occ && G.atWar(ter[j].occ.by, t.ctrl)));
      t.fort = clamp((t.fort || 0) + (frontline || attackers.length ? G.B.fortGrow : -0.001), 0, 1);
      if (t.ctrl === t.owner && t.integ < 1) t.integ = Math.min(1, t.integ + (N[t.owner].stab > 50 ? 0.0012 : 0.0005));
    });
  };
  G.checkCapitulation = function (nid) {
    const n = N[nid]; if (!n.alive) return;
    const owned = ter.filter(t => t.owner === nid); const total = owned.reduce((s, t) => s + t.gdp, 0);
    const lost = owned.filter(t => t.ctrl !== nid && G.atWar(t.ctrl, nid)).reduce((s, t) => s + t.gdp, 0);
    const homeLost = ter[n.home].ctrl !== nid;
    if ((homeLost && lost / Math.max(1e-6, total) >= 0.5) || lost >= total * 0.95) {
      G.say(`🏳 ${n.name} капітулює!`, 'big', [nid]);
      owned.forEach(t => { if (t.ctrl !== nid && G.atWar(t.ctrl, nid)) { t.owner = t.ctrl; t.integ = 0.15; } });
      G.enemiesOf(nid).forEach(e => G.endWar(nid, e, true));
      if (nid === G.player && !ter.some(t => t.owner === nid)) G.gameOver = { win: false, text: `${n.name} капітулювала. Державу ліквідовано.` };
      G.refreshNation(nid);
    } else if (homeLost) G.refreshNation(nid);
  };
  G.refreshNation = function (nid) {
    const n = N[nid]; const owned = ter.filter(t => t.owner === nid && t.ctrl === nid);
    if (!ter.some(t => t.owner === nid)) { n.alive = false; G.armies = G.armies.filter(a => a.n !== nid); G.fleets = G.fleets.filter(f => f.n !== nid); G.alliances.forEach(al => al.m.delete(nid)); G.say(`⚰ ${n.name} припиняє існування як держава`, 'big', [nid]); G.enemiesOf(nid).forEach(e => G.endWar(nid, e, true)); LORA.bus.emit('nationDead', nid); return; }
    if (ter[n.home].ctrl !== nid && owned.length) { const nh = owned.sort((a, b) => b.gdp - a.gdp)[0]; n.home = nh.i; G.say(`🏛 ${n.name}: столицю перенесено (${T[nh.i].n})`, 'info', [nid]); }
  };
});

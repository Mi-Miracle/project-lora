// БУДІВНИЦТВО: будівлі в регіонах, ланцюги виробництва (вхід → вихід), ефекти (оборонка, енергетика, наука, логістика),
// черга будівництва, руйнування на війні та автоматичний радник з розвитку (губернатори регіонів).
// Підключається «обгортками» до існуючих функцій, тож економіка й військо не потребують змін.
LORA.sim.register('buildings', 55, function (G) {
  const { N, ter, T, RES, RI } = G; const U = LORA.core, clamp = U.clamp;
  const BD = G.D.buildings, BG = G.D.buildingGroups, PRIO = G.D.devPriorities;
  // ---- економіка будівлі: додана вартість і вартість будівництва
  const val = obj => Object.entries(obj || {}).reduce((s, [r, q]) => s + q * RI[r].price, 0);
  Object.entries(BD).forEach(([k, b]) => { b.id = k; b.va = Math.max(0, val(b.out) - val(b.in)); if (!b.cost) b.cost = +Math.max(0.5, b.va * 5).toFixed(2); });
  G.BD = BD;
  ter.forEach(t => { t.bld = {}; t.base = {}; t.pol = { tax: 0, sez: false, gov: true, prio: null }; t.bsup = 0; t.bfort = 0; t.shield = 0; t.bgrow = 0; });
  G.constructions = [];
  N.forEach(n => { n.dev = { invest: 0.008 + 0.012 * ((n.ai && n.ai.econ) || 0.6), auto: true, prio: 'balanced', fund: 0, spent: 0 }; n.bq = 0; n.techB = 0; });

  // ---- вимоги
  G.canBuild = function (nid, i, type) {
    const b = BD[type], t = ter[i], R = T[i], n = N[nid]; const q = b.req || {};
    if (t.ctrl !== nid || t.owner !== nid) return 'Лише на власній підконтрольній території';
    if (t.rad > G.day) return 'Зона радіаційного забруднення: будівництво неможливе ще ' + (t.rad - G.day) + ' дн.';
    if (q.geo && !(t.prod[q.geo] > G.W_prod0[q.geo] * 0.003 || (R.sh[q.geo] || 0) > 0.15)) return 'У регіоні немає покладів: ' + RI[q.geo].n.toLowerCase();
    if (q.fert && R.f < q.fert) return 'Замало родючих земель';
    if (q.coast && !R.p.length) return 'Потрібен вихід до моря';
    if (q.rt && !(n.res && n.res.done[q.rt] != null)) return 'Потрібне дослідження: ' + (G.D.techs[q.rt] ? G.D.techs[q.rt].n : q.rt);
    if (q.tech && n.tech < q.tech) return `Потрібен рівень технологій ${(q.tech * 100).toFixed(0)}`;
    if (q.terrain && !q.terrain.includes(R.t) && !(q.coastOr && R.p.length)) return 'Невідповідний рельєф';
    if ((t.bld[type] || 0) >= 12) return 'Досягнуто максимальний рівень';
    if (G.atWar(nid, nid)) return '';
    return '';
  };
  G.buildCost = (nid, i, type) => BD[type].cost * (N[nid].buildK || 1) * (ter[i].pol.sez ? 0.8 : 1) * (0.7 + 0.3 * Math.min(2, (N[nid].pc || 10000) / 30000));
  G.startBuild = function (nid, i, type, quiet) {
    const err = G.canBuild(nid, i, type); if (err) return { ok: false, err };
    const n = N[nid], cost = G.buildCost(nid, i, type);
    n.cash -= cost; if (n.cash < 0) { n.debt -= n.cash; n.cash = 0; }
    const days = Math.round(BD[type].days * (G.enemiesOf(nid).length ? 1.3 : 1) / (0.7 + 0.3 * n.infraLvl));
    G.constructions.push({ id: G.nextId++, n: nid, t: i, type, done: G.day + days, start: G.day, cost });
    if (!quiet) G.say(`🏗 Будівництво: ${BD[type].n} — ${T[i].n || n.name} (${days} дн., $${cost.toFixed(1)} млрд)`, 'good', [nid]);
    return { ok: true, days, cost };
  };

  // ---- щоденний вплив будівель на виробництво (обгортка агрегування)
  const baseAgg = G.aggregate;
  G.aggregate = function () {
    baseAgg();
    for (const t of ter) {
      const ks = Object.keys(t.bld); if (!ks.length) continue;
      const c = N[t.ctrl]; const eff = (1 - t.dmg) * (t.ctrl === t.owner ? 1 : 0.3);
      for (const k of ks) {
        const lvl = t.bld[k] - (t.base[k] || 0); if (lvl <= 0) continue; const b = BD[k]; // базові (стартові) рівні вже враховані у виробництві регіону
        let inR = 1; if (b.in) for (const r in b.in) { c.agg.need[r] += b.in[r] * lvl; inR = Math.min(inR, c.ratio[r] != null ? c.ratio[r] : 1); }
        if (b.out) for (const r in b.out) c.agg.prod[r] += b.out[r] * lvl * eff * inR * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1);
      }
    }
    for (const n of N) if (n.prodK && n.agg) for (const r in n.prodK) if (n.agg.prod[r] != null) n.agg.prod[r] *= n.prodK[r];
  };
  // ---- постачання: бонус складів, баз, вузлів у регіоні та сусідніх
  const baseSup = G.supplyTarget;
  G.supplyTarget = function (a) { let b = ter[a.t].bsup; for (const j of T[a.t].nb) b = Math.max(b, ter[j].bsup * 0.6); return clamp(baseSup(a) + b, 0, 1); };
  // ---- укріплення будівель посилюють оборону (використовується в armyPower через t.bfort)

  G.recalcRegionEffects = function (t) {
    t.bsup = 0; t.bfort = 0; t.shield = 0; t.bgrow = 0;
    t.radar = 0; t.ew = 0; t.grid = 0;
    for (const k in t.bld) { const lvl = t.bld[k]; const e = BD[k].eff || {}; if (e.supply) t.bsup += e.supply * lvl; if (e.fort) t.bfort += e.fort * lvl; if (e.shield) t.shield += e.shield * lvl; if (e.grow) t.bgrow += e.grow * Math.max(0, lvl - (t.base[k] || 0)); if (e.radar) t.radar = Math.max(t.radar, e.radar * (1 + 0.15 * (lvl - 1))); if (e.ew) t.ew += e.ew * lvl; if (e.grid) t.grid += e.grid * lvl; }
    t.ew = Math.min(0.6, t.ew); t.grid = Math.min(0.75, t.grid);
    t.bsup = Math.min(0.3, t.bsup); t.bfort = Math.min(1.2, t.bfort); t.shield = Math.min(0.9, t.shield); t.bgrow = Math.min(0.03, t.bgrow);
  };
  G.addLevel = function (i, type, d) {
    const t = ter[i]; const b = BD[type]; const before = t.bld[type] || 0; const after = Math.max(0, before + d);
    if (d < 0 && (t.base[type] || 0) > after) { const lost = t.base[type] - after; t.base[type] = after; for (const r in b.out || {}) t.prod[r] = Math.max(0, t.prod[r] - b.out[r] * lost); if (!after) delete t.base[type]; }
    if (after) t.bld[type] = after; else delete t.bld[type];
    t.gdp = Math.max(0.01, t.gdp + (after - before) * b.va * 0.8);
    const e = b.eff || {}; const n = N[t.owner];
    if (e.infra && d > 0) n.infraLvl = Math.min(1.5, n.infraLvl + e.infra * 0.15 * Math.min(1, 4 * t.gdp / Math.max(1, n.agg ? n.agg.gdp : 100)));
    G.recalcRegionEffects(t);
  };

  // ---- щоденні процеси
  G.buildingsDaily = function () {
    // завершення будівництва
    if (G.constructions.length) G.constructions = G.constructions.filter(c => {
      if (ter[c.t].ctrl !== c.n) { if (c.n === G.player) G.say(`🏚 Будівництво зупинено (регіон втрачено): ${BD[c.type].n}`, 'bad', [c.n]); if (c.co != null) G.coAssetLost(c); return false; }
      if (c.done > G.day) return true;
      G.addLevel(c.t, c.type, 1); if (c.co != null) G.coAssetDone(c);
      if (c.n === G.player && c.co == null) G.say(`✅ Збудовано: ${BD[c.type].n} — ${T[c.t].n}`, 'good', [c.n]);
      return false;
    });
    // ефекти будівель
    const qB = new Float64Array(N.length), techB = new Float64Array(N.length), stabB = new Float64Array(N.length);
    for (const t of ter) {
      if (t.bgrow) t.gdp *= 1 + t.bgrow / 365;
      if (t.dmg > 0 && t.shield) t.dmg = Math.max(0, t.dmg - t.shield * 0.001);
      if (G.battles && t.dmg > 0.1 && (G.battleHot || {})[t.i]) { for (const k in t.bld) if (G.rnd() < 0.004 * (1 - t.shield)) { G.addLevel(t.i, k, -1); if (t.owner === G.player) G.say(`💥 Знищено в боях: ${BD[k].n} — ${T[t.i].n}`, 'bad', [t.owner]); break; } }
      if (t.ctrl !== t.owner) continue;
      const n = N[t.ctrl];
      for (const k in t.bld) {
        const lvl = t.bld[k], b = BD[k], e = b.eff; if (!e) continue;
        let inR = 1; if (b.in) for (const r in b.in) inR = Math.min(inR, n.ratio[r]);
        const f = lvl * inR * (1 - t.dmg);
        if (e.mil) n.milStock += e.mil * (lvl - (t.base[k] || 0) * 0.5) * inR * (1 - t.dmg) / 365;
        if (e.q) qB[n.id] += e.q * f;
        if (e.tech) techB[n.id] += e.tech * f;
        if (e.stab) stabB[n.id] += e.stab * f;
        if (e.ships && G.rnd() < e.ships * f / 365) { const p = G.nationPorts(n.id)[0]; if (p) { const fl = G.fleets.find(x => x.n === n.id && x.node === p[0] && !x.mv); if (fl) fl.s += 1; else G.newFleet(n.id, p[0], 1, 'Новий флот'); } }
      }
    }
    // налаштування регіонів: податкові пільги/надбавки та спеціальні економічні зони
    for (const t of ter) { const p = t.pol; if (!p.tax && !p.sez) continue; if (t.ctrl !== t.owner) continue; const n = N[t.owner];
      if (p.tax) { n.cash += t.gdp * p.tax / 365; t.gdp *= 1 - p.tax * 0.1 / 365; }
      if (p.sez) { t.gdp *= 1 + 0.012 / 365; n.cash -= t.gdp * n.pol.tax * 0.3 / 365; } }
    N.forEach(n => {
      if (!n.alive) return;
      n.bq = Math.min(0.25, qB[n.id]); // до +25% якості армії від дронів/ракет
      n.tech = Math.min(1.8, n.tech + techB[n.id] / 365);
      n.stab = Math.min(100, n.stab + Math.min(8, stabB[n.id]) * 0.002);
      if (n.bq) n.q *= 1 + n.bq;
      if (G.diff && !G.isHuman(n.id)) n.q *= G.diff.aiQ;
    });
  };
  // портові бонуси держав (для торгових маршрутів)
  G.nationLogistics = function () {
    N.forEach(n => { n.portB = 0; n.lngB = 0; n.airB = 0; });
    for (const t of ter) { if (t.ctrl !== t.owner) continue; const n = N[t.ctrl]; for (const k in t.bld) { const e = BD[k].eff; if (!e) continue; if ((t.portHit > G.day && (k === 'port' || k === 'lng_terminal')) || (t.airHit > G.day && k === 'airport')) continue; const l = t.bld[k]; if (e.portCost) n.portB += e.portCost * l; if (e.lng) n.lngB += e.lng * l; if (e.air) n.airB += e.air * l; } }
    N.forEach(n => { n.portB = Math.min(0.5, n.portB); n.lngB = Math.min(0.6, n.lngB); });
  };

  // ---- РАДНИК З РОЗВИТКУ (автоматичне будівництво для ШІ та гравця, якщо увімкнено)
  function prioOf(n) {
    if (!G.isHuman(n.id) || n.dev.prio === 'auto') { if (G.enemiesOf(n.id).length) return 'military'; if (n.ai && n.ai.threat > 1.5) return 'military'; return n.ai && n.ai.econ > 0.85 ? 'industry' : 'balanced'; }
    return n.dev.prio;
  }
  // найкраще місце для будівлі серед власних регіонів (для інтерфейсу)
  G.bestSpot = function (nid, type) {
    const n = N[nid]; const w = (PRIO[prioOf(n)] || {}).w; const regs = ter.filter(t => t.ctrl === nid && t.owner === nid).sort((a, b) => b.gdp - a.gdp);
    const pool = regs.slice(0, 25); regs.forEach(t => { if (pool.length < 45 && !pool.includes(t) && Object.keys(T[t.i].sh).some(r => T[t.i].sh[r] > 0.1)) pool.push(t); });
    let best = null, bs = -1e9, why = '';
    for (const t of pool) { const e = G.canBuild(nid, t.i, type); if (e) { why = why || e; continue; } const s = score(n, t.i, type, w); if (s > bs) { bs = s; best = t.i; } }
    return { i: best, err: best == null ? (/покладів/.test(why) ? 'У вашій країні немає потрібних покладів' : why) : '' };
  };
  function score(n, i, type, w) {
    const b = BD[type], t = ter[i], e = b.eff || {}; let s = b.va / b.cost * 3;
    if (b.out) for (const r in b.out) { if (n.ratio[r] < 0.97) s += 2.5 * (1 - n.ratio[r]) + 0.4; if (G.prices[r] / G.priceBase[r] > 1.2) s += 0.3; }
    if (b.in) for (const r in b.in) { if (n.ratio[r] < 0.9) s -= 1.2; else if (n.agg.prod[r] < n.agg.need[r] * 0.9 && !(b.out && b.out[r])) s -= 0.3; }
    const war = G.enemiesOf(n.id).length > 0, front = T[i].nb.some(j => G.atWar(ter[j].ctrl, n.id));
    if (e.mil) s += war ? 1.2 : (n.ai && n.ai.threat > 1) ? 0.5 : 0.05;
    if (e.q) s += war ? 0.8 : 0.1;
    if (e.fort) s += front ? 1.5 : war ? 0.1 : -0.5;
    if (e.supply) s += front ? 0.9 : war ? 0.2 : -0.3;
    if (e.shield) s += war ? (t.dmg > 0.05 ? 1.2 : 0.4) : -0.2;
    if (e.grow) s += 0.25 + t.gdp / Math.max(1, n.agg.gdp) * 2;
    if (e.tech) s += 0.35; if (e.stab) s += n.stab < 45 ? 0.6 : 0.05;
    if (e.ships) s += war ? 0.4 : -0.2; if (e.portCost || e.lng || e.air) s += 0.1;
    // 1.4: нові ефекти
    if (e.net) s += 0.3 + Math.max(0, 0.6 - (n.net || 0)) * 1.2; if (e.green) s += (n.ratio.oil < 0.95 || n.ratio.gas < 0.95 ? 0.5 : 0.1) + (n.greenGoal || 0);
    if (e.armor || e.airf) s += war ? 1 : 0.05; if (e.radar) s += front ? 0.8 : war ? 0.3 : -0.2; if (e.ew) s += front ? 0.7 : -0.3; if (e.grid) s += war && t.dmg > 0.03 ? 0.8 : 0.05;
    if (e.space || e.satf || e.satc) s += (n.spaceGoal || 0) + ((n.tech || 0) > 1.05 && n.agg.gdp > 800 ? 0.3 : -0.4); if (e.naval) s += war ? 0.3 : -0.2; if (e.media) s += n.stab < 50 ? 0.4 : 0;
    s -= (t.bld[type] || 0) * 0.12; // спадна віддача
    if (t.pol.sez) s += 0.15;
    const ww = t.pol.prio ? PRIO[t.pol.prio].w : w;
    return s * (ww[b.g] || 1) * (0.9 + 0.2 * G.rnd());
  }
  G.devMonthly = function (n) {
    if (!n.alive) return;
    const gdp = n.agg.gdp; const add = gdp * n.dev.invest / 12;
    n.dev.fund += add; n.cash -= add; if (n.cash < 0) { n.debt -= n.cash; n.cash = 0; } n.dev.spent = add * 12;
    if (G.isHuman(n.id) && !n.dev.auto) { n.dev.fund = Math.min(n.dev.fund, gdp * 0.05); return; }
    const active = G.constructions.filter(c => c.n === n.id).length; const limit = Math.min(40, 2 + Math.floor(gdp / 150));
    if (active >= limit) return;
    const w = PRIO[prioOf(n)].w;
    const regs = ter.filter(t => t.ctrl === n.id && t.owner === n.id && t.pol.gov).sort((a, b) => b.gdp - a.gdp);
    const pool = regs.slice(0, 20); regs.forEach(t => { if (pool.length < 32 && !pool.includes(t) && Object.keys(T[t.i].sh).some(r => T[t.i].sh[r] > 0.1)) pool.push(t); });
    if (n.dev.fund < 0) n.dev.fund = 0;
    for (let tries = 0; tries < 4 && n.dev.fund > 0.4; tries++) {
      let best = null, bs = 0.35;
      for (const t of pool) for (const type in BD) { if (G.canBuild(n.id, t.i, type)) continue; const c = G.buildCost(n.id, t.i, type); if (c > n.dev.fund) continue; const s = score(n, t.i, type, w); if (s > bs) { bs = s; best = { i: t.i, type, c }; } }
      if (!best) break;
      n.dev.fund -= best.c; n.cash += best.c; // кошти вже списані у фонд
      G.startBuild(n.id, best.i, best.type, n.id !== G.player);
    }
  };
  G.buildingGroupsList = BG;

  // ---- СТАРТОВА ІНФРАСТРУКТУРА (data/econ/start-buildings.js)
  G.seedStartBuildings = function () {
    const SB = G.D.startBuildings; if (!SB) return;
    const put = (i, type, l, convert) => {
      if (!(l > 0) || i < 0 || !BD[type]) return; const t = ter[i]; t.bld[type] = (t.bld[type] || 0) + l; t.base[type] = (t.base[type] || 0) + l;
    };
    // 1) виробничі потужності, «вирізані» з наявного виробництва
    ter.forEach(t => { for (const type in SB.convert) { const c = SB.convert[type]; const out = BD[type].out[c.r]; put(t.i, type, Math.min(c.max, Math.floor(t.prod[c.r] * c.share / out)), true); } });
    // 2) точні розміщення
    const placed = new Set();
    SB.place.forEach(([cc, name, type, l]) => { const i = ter.findIndex(t => t.cc === cc && (T[t.i].n0 || T[t.i].n) === name); if (i >= 0) { put(i, type, l, false); placed.add(cc + ':' + type); } });
    // 3) правила для всіх держав
    N.forEach(n => {
      if (!n.alive || n.home < 0) return;
      const own = ter.filter(t => t.owner === n.id).sort((a, b) => b.gdp - a.gdp); if (!own.length) return;
      const coast = own.filter(t => T[t.i].p.length); const cap = n.home;
      const spread = (type, levels, list, perMax) => { if (placed.has(n.a3 + ':' + type) || !(levels > 0) || !list.length) return; let k = 0; while (levels > 0 && k < 60) { const t = list[k % Math.min(list.length, 6)]; const cur = t.bld[type] || 0; if (cur < perMax) { put(t.i, type, 1, false); levels--; } k++; } };
      const r = SB.reactors[n.a3]; if (r) spread('npp', Math.max(1, Math.round(r / 4)), own.filter(t => t.i !== cap || own.length === 1), 3);
      if (SB.hydro[n.a3]) spread('hydro_plant', SB.hydro[n.a3], own.filter(t => ['mountain', 'hills', 'forest'].includes(T[t.i].t)).sort((a, b) => b.area - a.area), 2);
      if (SB.renewables[n.a3]) spread('renewables', SB.renewables[n.a3], own, 2);
      if (SB.drones[n.a3]) spread('drone_factory', SB.drones[n.a3], own, 2);
      if (SB.missiles[n.a3]) spread('missile_plant', SB.missiles[n.a3], own, 2);
      if (SB.airDefense[n.a3]) spread('air_defense', SB.airDefense[n.a3], [ter[cap]].concat(own.filter(t => t.i !== cap)), 2);
      const gdp = own.reduce((s, t) => s + t.gdp, 0);
      spread('military_base', clamp(Math.round(n.troopsBase / 150), n.troopsBase > 5 ? 1 : 0, 8), [ter[cap]].concat(own.filter(t => T[t.i].nb.some(j => ter[j].owner !== n.id && G.rel[n.id][ter[j].owner] < 10))), 2);
      spread('arms_factory', clamp(Math.round(gdp * n.pol.mil / 40), 0, 14), own.slice().sort((a, b) => (b.prod.machinery + b.gdp / 500) - (a.prod.machinery + a.gdp / 500)), 3);
      spread('shipyard', clamp(Math.round(n.ships / 40), 0, 6), coast, 3);
      if (coast.length) { put(coast[0].i, 'port', placed.has(n.a3 + ':port') ? 0 : (gdp > 300 ? 2 : 1), false); coast.slice(1, 3).forEach(t => put(t.i, 'port', placed.has(n.a3 + ':port') ? 0 : (t.gdp > 50 ? 1 : 0), false)); }
      if (n.infraLvl > 0.5) spread('rail_hub', Math.min(3, own.length), own, 1);
      if (n.tech >= 0.85) { spread('university', Math.min(3, own.length) + 1, [ter[cap]].concat(own.filter(t => t.i !== cap)), 2); }
      if ((gdp / Math.max(0.1, own.reduce((s, t) => s + t.pop, 0)) * 1000) > 15000) spread('hospital', Math.min(2, own.length), own, 1);
    });
    ter.forEach(t => G.recalcRegionEffects(t));
  };
});

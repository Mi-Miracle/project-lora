// СВІТ: створення стану гри — регіони, держави, економіка регіонів, відносини, союзи.
// Усе, що описує «початковий стан», береться з data/*. Тут лише логіка розкладання даних.
LORA.sim.register('world', 10, function (G) {
  const D = G.D, U = LORA.core;
  const RES = D.resourceOrder, RI = D.resources;
  const T = D.regions, NT = T.length;
  G.RES = RES; G.RI = RI; G.T = T; G.NT = NT;
  // поточні параметри балансу (можуть змінюватися самобалансуванням у межах min/max)
  G.B = {}; Object.entries(D.balance).forEach(([k, v]) => G.B[k] = v.value);
  G.prices = {}; G.priceBase = {}; RES.forEach(r => { G.prices[r] = RI[r].price; G.priceBase[r] = RI[r].price; });

  // ---------- держави ----------
  const N = [], nIdx = {};
  const dep = D.dependencies || {};
  function nation(a3) {
    if (nIdx[a3] != null) return nIdx[a3];
    const id = N.length; nIdx[a3] = id;
    const cell = D.cells.find(c => c.a3 === a3);
    N.push({ id, a3, name: cell ? cell.n : a3, home: -1, alive: true });
    return id;
  }
  // назви держав українською беремо з логістичних клітин (там повні назви)
  const ter = T.map((t, i) => ({ i, cc: t.cc, owner: -1, ctrl: -1, core: -1, gdp: 0, gdp0: 0, pop: 0, prod: {}, need0: {}, dmg: 0, integ: 1, occ: null, area: t.ar }));
  T.forEach((t, i) => { const own = dep[t.cc] || t.cc; ter[i].owner = nation(own); ter[i].ctrl = ter[i].owner; ter[i].core = nation(t.cc); });
  G.N = N; G.nIdx = nIdx; G.ter = ter;

  // ---------- економіка регіонів ----------
  const C = D.countries, P = D.production;
  const cTot = {}; // країна -> {pop,gdp}
  Object.keys(C).forEach(cc => cTot[cc] = { pop: C[cc][0], gdp: C[cc][1] });
  let W_gdp = 0, W_pop = 0; const W_prod = {}; RES.forEach(r => W_prod[r] = 0);
  ter.forEach((t, i) => {
    const s = T[i].sh, c = cTot[t.cc] || { pop: 0.3, gdp: 1 };
    t.pop = c.pop * (s.pop || 0); t.gdp = c.gdp * (s.gdp || 0); t.gdp0 = t.gdp; W_gdp += t.gdp; W_pop += t.pop;
    RES.forEach(r => { let v = (P[r] && P[r][t.cc]) || 0; if (!v && r === 'grain') v = c.pop * 0.05; if (!v && r === 'food') v = c.pop * 0.01; t.prod[r] = v * (s[r] || 0); W_prod[r] += t.prod[r]; });
  });
  const sumP = r => Object.values(P[r] || {}).reduce((a, b) => a + b, 0) || 1;
  ter.forEach(t => RES.forEach(r => {
    const wg = RI[r].wg; let share = wg * t.gdp / W_gdp + (1 - wg) * t.pop / W_pop;
    if (r === 'rare') share = 0.5 * share + 0.5 * (((P.chips[t.cc] || 0) / sumP('chips')) * (t.gdp / Math.max(1e-9, (cTot[t.cc] || { gdp: 1 }).gdp)));
    if (r === 'metal' || r === 'nonfer') share = 0.5 * share + 0.5 * (((P.machinery[t.cc] || 0) / sumP('machinery')) * (t.gdp / Math.max(1e-9, (cTot[t.cc] || { gdp: 1 }).gdp)));
    t.need0[r] = W_prod[r] * share;
  }));
  // добрива потрібні там, де вирощують зерно
  const gTot = ter.reduce((a, t) => a + t.prod.grain, 0);
  ter.forEach(t => { t.need0.fert = 0.5 * t.need0.fert + 0.5 * W_prod.fert * t.prod.grain / gTot; });
  G.W_prod0 = W_prod;

  // ---------- параметри держав ----------
  const F = D.finance;
  N.forEach(n => {
    const c = C[n.a3] || [0.5, 1, 0, 0, 0.6, 1, 0, 0];
    const owned = ter.filter(t => t.owner === n.id);
    const gdp = owned.reduce((a, t) => a + t.gdp, 0), pop = owned.reduce((a, t) => a + t.pop, 0);
    const pc = gdp / Math.max(0.01, pop) * 1000;
    const rich = U.clamp(pc / 50000, 0, 1);
    // столиця — регіон зі столичним містом, інакше найбагатший
    const capR = owned.filter(t => T[t.i].cap && t.cc === n.a3).sort((a, b) => b.gdp - a.gdp)[0] || owned.slice().sort((a, b) => b.gdp - a.gdp)[0];
    n.home = capR ? capR.i : -1;
    n.tech = c[4] || 0.6; n.aggr = c[6] || 0; n.nuke = !!c[7];
    n.pol = { tax: F.tax[n.a3] != null ? F.tax[n.a3] : +(0.14 + 0.2 * rich).toFixed(3), mil: (c[5] || 1) / 100, infra: 0.03, res: +(0.004 + 0.025 * rich * n.tech).toFixed(3), soc: 0, mob: 0 };
    const r0 = F.rate[n.a3] != null ? F.rate[n.a3] : 0.012 + 0.045 * (1 - Math.min(1, pc / 40000));
    n.pol.soc = +Math.max(0.03, n.pol.tax - n.pol.mil - n.pol.infra - n.pol.res - r0 * (F.debt[n.a3] != null ? F.debt[n.a3] : 0.55) + 0.015).toFixed(3);
    n.troopsBase = c[2] || 0; n.ships = c[3] || 0;
    n.pol.mob = U.clamp((n.troopsBase / Math.max(0.01, pop) / 1000) * 1.15, 0.003, 0.06);
    n.basePol = Object.assign({}, n.pol);
    n.milStock = gdp * n.pol.mil * 7;
    n.infraLvl = U.clamp(0.2 + 0.8 * Math.sqrt(rich), 0.15, 1.1);
    n.stab = U.clamp(55 + 30 * rich + (c[6] > 0.3 ? 5 : 0), 25, 90);
    n.debt = gdp * (F.debt[n.a3] != null ? F.debt[n.a3] : 0.55);
    n.cash = gdp * (F.funds[n.a3] != null ? F.funds[n.a3] : 0.03);
    n.stock = { oil: 60, gas: 40, grain: 90 }; n.stockTarget = { oil: 90, gas: 60, grain: 120 };
    n.exportBan = {}; n.ratio = {}; n.imp = {}; n.exp = {}; RES.forEach(r => { n.ratio[r] = 1; n.imp[r] = 0; n.exp[r] = 0; });
    n.mods = []; n.growth = 0.02; n.lastWarDecl = -999; n.warExh = 0; n.casualties = 0; n.casualtiesDay = 0; n.autoTrade = true;
    n.q = 1; n.navQ = 1; n.alive = owned.length > 0; n.aidIn = 0;
    n.stats = { gdp, pop, exp: 0, imp: 0, rev: 0, spend: 0 };
    const h = (n.id * 137.508) % 360; n.color = `hsl(${h.toFixed(0)},${50 + (n.id * 7) % 25}%,${44 + (n.id * 13) % 16}%)`;
  });

  // ---------- відносини, союзи, санкції ----------
  const NN = N.length; G.NN = NN;
  const rel = Array.from({ length: NN }, () => new Float32Array(NN));
  for (let i = 0; i < NN; i++) for (let j = 0; j < NN; j++) rel[i][j] = i === j ? 100 : 5;
  T.forEach((t, i) => t.nb.forEach(j => { const a = ter[i].owner, b = ter[j].owner; if (a !== b) rel[a][b] = Math.max(rel[a][b], 15); }));
  const set = (a, b, v) => { if (a == null || b == null) return; rel[a][b] = v; rel[b][a] = v; };
  const EU = D.eu.split(' ').map(a => nIdx[a]).filter(x => x != null);
  EU.forEach(a => EU.forEach(b => { if (a !== b) rel[a][b] = 65; }));
  G.alliances = [];
  Object.entries(D.alliances).forEach(([name, s]) => { const m = s.split(' ').map(a => nIdx[a]).filter(x => x != null); G.alliances.push({ name, m: new Set(m) }); m.forEach(a => m.forEach(b => { if (a !== b) rel[a][b] = Math.max(rel[a][b], 55); })); });
  D.relations.forEach(([a, b, v]) => set(nIdx[a], nIdx[b], v));
  G.rel = rel; G.relBase = rel.map(r => Float32Array.from(r));
  G.sanctions = new Set(); G.access = new Set(); G.treaties = new Set();
  D.sanctions.from.split(' ').forEach(a => D.sanctions.to.split(' ').forEach(b => { if (nIdx[a] != null && nIdx[b] != null) G.sanctions.add(nIdx[a] + '>' + nIdx[b]); }));
  EU.forEach(a => EU.forEach(b => { if (a < b) G.treaties.add(a + '|' + b); }));

  // ---------- решта стану ----------
  Object.assign(G, { day: 0, startDate: Date.UTC(LORA.config.startYear, 0, 1), news: [], player: -1, flows: [], wars: new Map(), conflicts: [],
    contracts: [], armies: [], fleets: [], nextId: 1, seaClosed: new Array(D.sea.nodes.length).fill(0), gameOver: null, pendingPeace: [], worldMod: { growth: 0, until: 0 }, building: [] });
});

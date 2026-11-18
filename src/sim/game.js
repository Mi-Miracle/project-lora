// ГРА: створення світу, сценарій, головний щоденний цикл, збереження/завантаження.
// Порядок кроку дня задано в G.step — щоб додати нову систему, зареєструйте модуль і викличте його тут.
LORA.sim.register('game', 100, function (G) {
  const { N, ter, T } = G; const CFG = LORA.config;
  const findRegion = (cc, name) => ter.findIndex(t => t.cc === cc && (T[t.i].n0 || T[t.i].n) === name);

  G.applyScenario = function (id) {
    const sc = G.D.scenarios[id]; if (!sc) return;
    const idx = a => G.nIdx[a]; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    if (sc.base && sc.base !== id) G.applyScenario(sc.base);
    // відносини, цінові шоки, світова економіка, стабільність
    (sc.rel || []).forEach(([a, b, v]) => { const x = idx(a), y = idx(b); if (x == null || y == null) return; G.rel[x][y] = G.rel[y][x] = clamp(v, -100, 100); });
    (sc.relGroup || []).forEach(([A, B, d]) => A.forEach(a => B.forEach(b => { const x = idx(a), y = idx(b); if (x == null || y == null || x === y) return; G.rel[x][y] = G.rel[y][x] = clamp(G.rel[x][y] + d, -100, 100); })));
    if (sc.shock) { G.priceShock = G.priceShock || {}; Object.entries(sc.shock).forEach(([r, [m, days]]) => { G.priceShock[r] = { m, until: G.day + days }; if (G.prices[r] != null) G.prices[r] *= m; }); }
    if (sc.worldMod) G.worldMod = { growth: sc.worldMod[0], until: G.day + sc.worldMod[1] };
    Object.entries(sc.stab || {}).forEach(([c, d]) => { const n = N[idx(c)]; if (n) n.stab = clamp(n.stab + d, 0, 100); });
    (sc.wars || []).forEach((w, k) => { const a = idx(w.att), b = idx(w.def); if (a == null || b == null) return; G.conflicts.push({ id: G.conflicts.length, name: w.name, start: -1000, att: a, def: b }); G.wars.set(G.warKey(a, b), { a, b, att: a, start: -1000, cid: G.conflicts.length - 1 }); N[a].warStart = 1; N[b].warStart = 1; Object.entries(w.exh || {}).forEach(([c, v]) => { if (idx(c) != null) N[idx(c)].warExh = v; }); });
    (sc.control || []).forEach(c => { const r = findRegion(c.cc, c.n); if (r < 0 || idx(c.ctrl) == null) return; ter[r].ctrl = idx(c.ctrl); if (c.dmg) ter[r].dmg = c.dmg; if (c.fort) ter[r].fort = c.fort; });
    (sc.fronts || []).forEach(f => { const r = findRegion(f.cc, f.n); if (r < 0) return; if (f.by && idx(f.by) != null) ter[r].occ = { by: idx(f.by), p: f.p }; if (f.dmg) ter[r].dmg = f.dmg; if (f.fort) ter[r].fort = f.fort; });
    // перерозміщення військ
    const groups = {}; (sc.deploy || []).forEach(([nat, cc, name, share]) => (groups[nat] = groups[nat] || []).push([cc, name, share]));
    Object.entries(groups).forEach(([nat, list]) => {
      const nid = idx(nat); if (nid == null) return; const total = G.troopsOf(nid);
      const pool = G.armies.filter(a => a.n === nid);
      list.forEach(([cc, name, share]) => {
        const r = findRegion(cc, name); if (r < 0) return; let k = total * share, got = 0;
        for (const src of pool.sort((x, y) => y.k - x.k)) { if (got >= k) break; const take = Math.min(src.k - 1, k - got); if (take <= 0) continue; src.k -= take; got += take; }
        if (got < 1) return; const nm = T[r].n || name; const a = G.newArmy(nid, r, got, LORA.lang === 'en' ? `Group “${nm.replace(' Oblast', '').replace(' (city)', '')}”` : `Угруповання «${nm.replace(' обл.', '').replace(' (місто)', '')}»`); a.org = 0.75; a.auto = nid !== G.player;
      });
      G.armies = G.armies.filter(a => a.k >= 1);
    });
    Object.entries(sc.policy || {}).forEach(([c, p]) => { const n = N[idx(c)]; if (n) { Object.assign(n.pol, p); Object.assign(n.basePol, p); } });
    Object.entries(sc.aid || {}).forEach(([c, v]) => { const n = N[idx(c)]; if (n) n.aidIn = v; });
  };

  G.applyDifficulty = function (id) {
    const d = G.D.difficulty[id] || G.D.difficulty.normal; G.diff = Object.assign({ id }, d);
    G.B.aggrScale *= d.aiAggr; G.B.attackNeed = Math.max(0.85, G.B.attackNeed + d.aiNeed);
    N.forEach(n => { if (n.dev) n.dev.invest *= d.aiInvest; });
    const p = N[G.player]; if (!p) return;
    const gdp = ter.reduce((s, t) => s + (t.owner === p.id ? t.gdp : 0), 0);
    p.cash += gdp * d.cash; p.debt *= d.debt; if (d.growth) p.mods.push({ growth: d.growth, until: 1e9 }); if (p.dev) p.dev.invest /= d.aiInvest;
  };
  G.init = function (playerA3, scenario, opts) {
    opts = opts || {};
    G.player = playerA3 ? G.nIdx[playerA3] : -1;
    G.initForces();
    G.armies.forEach(a => { if (a.n === G.player) a.auto = false; });
    G.fleets.forEach(f => { if (f.n === G.player) f.auto = false; });
    G.seedStartBuildings();
    G.initArsenal();
    G.applyScenario(scenario);
    G.applyDifficulty(opts.difficulty || 'normal');
    G.humans = new Set((opts.humans || []).map(h => h.nid != null ? h.nid : h)); if (G.player >= 0) G.humans.add(G.player);
    G.aggregate(); G.allocateTrade(); G.applyTradeDaily(); G.economyDaily();
    G.seedCompanies(); G.initGenerals(); G.initSpace(); G.initNukes();
    if (G.player >= 0) G.say(`🏛 Ви очолили уряд: ${N[G.player].name}. ${G.dateStr()}`, 'big', [G.player]);
    if (opts.company) G.startCompany(opts.company);
    // лідер гравця на мапі
    if (opts.char) { G.initLeader({ name: opts.char.name, role: 'char', type: opts.char.type, home: G.nIdx[opts.char.home] }); if (opts.char.stage) G.initCareer(opts.char); }
    else if (opts.company) { const c = G.myCo(); G.initLeader({ name: (LORA.lang === 'en' ? 'CEO ' : 'CEO ') + c.name, role: 'ceo', home: c.home, at: c.offices[0].t, ic: '💼' }); }
    else if (G.player >= 0) G.initLeader({ name: opts.leaderName || (LORA.lang === 'en' ? 'President of ' : 'Президент: ') + N[G.player].name, role: 'president', home: G.player });
    (opts.humans || []).forEach(h => { const prev = G.player; G.player = h.nid != null ? h.nid : h; G.initLeader({ name: h.name || (LORA.lang === 'en' ? 'President of ' : 'Президент: ') + N[G.player].name, role: 'president', home: G.player }); G.armies.forEach(a => { if (a.n === G.player) a.auto = true; }); G.player = prev; });
  };

  G.step = function () {
    if (G.gameOver) return;
    G.day++;
    G.aggregate();
    if (G.day % CFG.tradeRecalcDays === 0 || (G.tradeDirty && G.day - (G._lastTrade || -99) >= 3)) { G.allocateTrade(); G.tradeDirty = false; G._lastTrade = G.day; } // зміни торгівлі — не частіше ніж раз на 3 дні
    G.applyTradeDaily();
    G.economyDaily();
    G.moveUnits();
    G.combat();
    G.arsenalDaily(); G.unitsDaily(); G.generalsDaily(); G.intelDaily();
    G.supplyAndAttrition();
    G.occupation();
    G.buildingsDaily(); G.linksDaily(); G.stockDaily(); if (G.day % 7 === 0) { G.nationLogistics(); G.victoryWeekly(); G.nukesWeekly(); }
    G.building = G.building.filter(b => { if (b.done <= G.day) { if (N[b.n].alive) G.newFleet(b.n, b.node, b.s, 'Новий флот'); G.say(`⚓ Нові кораблі (${b.s}) введено до строю`, 'good', [b.n]); return false; } return true; });
    N.forEach(n => {
      if (!n.alive) return;
      if ((!G.isHuman(n.id) || (n.id === G.player && G.autoPlayer)) && (G.day + n.id) % CFG.aiPolicyDays === 0) { G.aiPolicy(n); G.aiDiplomacy(n); }
      if ((G.day + n.id * 7) % 30 === 0) G.devMonthly(n);
      if (n.ai && n.ai.ops.length && (G.day + n.id) % 5 === 0) G.evalOps(n);
      if ((G.day + n.id) % CFG.aiArmyDays === 0) { if (!G.isHuman(n.id) || G.armies.some(a => a.n === n.id && a.auto)) G.aiArmies(n); G.aiFleets(n); }
    });
    // поповнення армій гравця в межах ліміту мобілізації
    const pn = N[G.player];
    if (pn && pn.alive) { const pool = pn.agg.pop * 1000 * pn.pol.mob, tr = G.troopsOf(pn.id); if (tr < pool) { const add = Math.min(pool - tr, pool * 0.002); const arm = G.armies.filter(a => a.n === pn.id && G.friendlyTo(pn.id, ter[a.t].ctrl)).sort((a, b) => a.k - b.k)[0]; if (arm) { arm.k += add; pn.cash -= add * 0.02 * (0.5 + pn.pc / 20000); if (pn.cash < 0) { pn.debt -= pn.cash; pn.cash = 0; } } } }
    if (G.day % 30 === 0) { G.foreignAid(); G.balanceMonthly(); G.alertsMonthly(); G.pressureMonthly(); G.decisionsMonthly(); G.spaceMonthly(); G.projectsMonthly(); G.monthlyExtra(); G.nukesMonthly(); G.radaMonthly(); G.stockMonthly(); G.recoveryMonthly(); G.reparMonthly(); G.chronMonthly(); G.corpMonthly(); G.corp2Tenders(); G.corp2Close(); G.corp2Monthly(); G.coDipMonthly(); G.careerMonthly(); G.corpEventsMonthly(); G.depletionMonthly(); G.ecologyMonthly(); G.climateMonthly(); G.tariffMonthly(); G.wevMonthly(); G.impeachMonthly(); }
    G.researchDaily();
    G.leaderDaily(); G.agentsDaily();
    G.parliamentDaily();
    G.blocsMonthly(); if (G.day % 30 === 20) G.blocsAiApply();
    G.companiesDaily();
    // автопілот гравця сам відповідає на мирні пропозиції
    if (G.autoPlayer && G.pendingPeace.length) { const p = G.pendingPeace[0]; const yes = p.type === 'ally_call' ? G.rnd() < 0.6 : p.type === 'cede' ? true : G.aiPeaceAnswer(G.player, p.from, p.type === 'cede_to_ai' ? 'cede' : p.type) && (p.type !== 'mutual' || (N[G.player].warExh > 0.85 && G.warScore(G.player, p.from) < -0.1)); G.act.answerPending(0, yes); }
    G.directorDaily();
    LORA.bus.emit('day', G.day);
  };

  // ---------- збереження ----------
  G.save = function () {
    return JSON.stringify({ v: 2, day: G.day, player: G.player, N: N.map(n => { const o = Object.assign({}, n); delete o.agg; return o; }),
      ter: ter.map(t => ({ owner: t.owner, ctrl: t.ctrl, gdp: t.gdp, pop: t.pop, dmg: t.dmg, integ: t.integ, occ: t.occ, prod: t.prod, fort: t.fort || 0, part: t.part || 0, bld: t.bld, base: t.base, pol: t.pol, rad: t.rad || 0, mine: t.mine || 0, rebuild: t.rebuild || 0, wasOcc: t.wasOcc || 0, dmz: t.dmz || 0, depl: t.depl || null })),
      rel: G.rel.map(r => Array.from(r, v => Math.round(v))), relBase: G.relBase.map(r => Array.from(r, v => Math.round(v))), wars: [...G.wars.values()], conflicts: G.conflicts,
      alliances: G.alliances.map(a => ({ name: a.name, m: [...a.m] })), sanctions: [...G.sanctions], access: [...G.access], treaties: [...G.treaties], contracts: G.contracts,
      armies: G.armies, fleets: G.fleets, nextId: G.nextId, diff: G.diff, B: G.B, balanceLog: G.balanceLog, metrics: G.metrics, constructions: G.constructions, victory: G.victory, priceShock: G.priceShock, online: G.online, rada: G.rada, stock: G.stock, repar: G.repar, truce: G.truce, nukeUsed: G.nukeUsed, chron: G.chron, tenders: G.tenders, tariffs: G.tariffs, embargo: G.embargo, wev: G.wev, doubleAgents: G.doubleAgents, links: G.links, decisions: G.decisions, leaders: G.leaders, agents: G.agents, generals: G.generals, goals: G.goals, humans: [...G.humans], blocs: G.blocs, companies: G.companies, pc: G.pc, seaClosed: G.seaClosed, prices: G.prices, news: G.news.slice(0, 60), worldMod: G.worldMod, building: G.building });
  };
  G.load = function (s) {
    const o = JSON.parse(s); if (o.v !== 2) throw new Error('Несумісне збереження');
    G.day = o.day; G.player = o.player;
    o.N.forEach((x, i) => Object.assign(N[i], x)); o.ter.forEach((x, i) => Object.assign(ter[i], x));
    o.rel.forEach((r, i) => r.forEach((v, j) => G.rel[i][j] = v)); o.relBase.forEach((r, i) => r.forEach((v, j) => G.relBase[i][j] = v));
    G.wars = new Map(o.wars.map(w => [G.warKey(w.a, w.b), w])); G.conflicts = o.conflicts; G.alliances = o.alliances.map(a => ({ name: a.name, m: new Set(a.m) }));
    G.sanctions = new Set(o.sanctions); G.access = new Set(o.access); G.treaties = new Set(o.treaties); G.contracts = o.contracts; G.armies = o.armies; G.fleets = o.fleets; G.nextId = o.nextId;
    G.seaClosed = o.seaClosed; G.prices = o.prices; G.news.length = 0; o.news.forEach(x => G.news.push(x)); G.worldMod = o.worldMod; G.building = o.building || []; if (o.B) Object.assign(G.B, o.B); if (o.diff) G.diff = o.diff; G.balanceLog = o.balanceLog || []; if (o.metrics) G.metrics = o.metrics; G.constructions = o.constructions || []; G.links = o.links || []; G.agents = o.agents || []; G.goals = o.goals || null; G.victory = o.victory || null; G.priceShock = o.priceShock || null; G.online = !!o.online; G.rada = o.rada || null; G.stock = o.stock || null; G.repar = o.repar || []; G.truce = o.truce || {}; G.nukeUsed = o.nukeUsed || 0; G.chron = o.chron || null; G.tenders = o.tenders || []; G.tariffs = o.tariffs || {}; G.embargo = o.embargo || {}; G.wev = o.wev || []; G.doubleAgents = o.doubleAgents || []; if (o.generals) G.generals = o.generals; else G.initGenerals(); if (!N[0].sats) G.initSpace(); G.leaders = o.leaders || (o.leader ? { [o.player >= 0 ? o.player : 'me']: o.leader } : {}); G.humans = new Set(o.humans || []); if (G.player >= 0) G.humans.add(G.player); if (o.blocs) G.blocs = o.blocs; G.decisions = o.decisions || []; if (o.companies) { G.companies = o.companies; G.pc = o.pc != null ? o.pc : -1; } ter.forEach(t => G.recalcRegionEffects(t)); G.rebuildLinkGraph();
    G.aggregate(); G.allocateTrade(); G.applyTradeDaily(); G.economyDaily();
  };
});

// Фабрика гри: створює G і встановлює всі зареєстровані модулі за порядком.
LORA.createGame = function (opts) {
  opts = opts || {};
  const G = { D: LORA.data, rnd: LORA.core.mulberry(opts.seed || 12345) };
  LORA.sim.modules.forEach(m => m.install(G));
  return G;
};

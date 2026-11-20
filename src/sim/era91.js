// ЕПОХИ ТА СЦЕНАРІЙ 1991.
// • Технології 90-х (епоха 0): у 2026 році вже вивчені всіма; у 1991 — треба досліджувати, і лише потім сучасні (епоха 1) тієї ж гілки.
// • Сценарій «1991: Україна стала незалежною»: дата старту, менші економіки й населення, армії й ядерні арсенали того часу,
//   союзи й санкції 1991 року; Будапештський вибір для України.
LORA.sim.register('era91', 100.5, function (G) {
  const { N, ter } = G; const TT = G.D.techs; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ERA0 = Object.keys(TT).filter(id => TT[id].era === 0);
  const era0Done = (n, br) => ERA0.every(id => TT[id].br !== br || n.res.done[id] != null);
  { const b = G.techAvail; G.techAvail = (n, id) => b(n, id) && (TT[id].era !== 1 || era0Done(n, TT[id].br)); }
  G.techEraLock = (n, id) => TT[id] && TT[id].era === 1 && !era0Done(n, TT[id].br) ? 'Спершу технології 90-х цієї гілки' : '';

  const base = G.init;
  G.init = function (player, scen, opts) {
    const sc = G.D.scenarios[scen] || {};
    if (sc.start) G.startDate = Date.UTC(sc.start[0], sc.start[1], sc.start[2]);
    base.apply(this, arguments);
    G.scen = scen;
    if (sc.year === 1991) apply1991(sc); else N.forEach(n => { if (!n.res) return; ERA0.forEach(id => { if (n.res.done[id] == null) n.res.done[id] = -1; }); });
    G.aggregate(); G.allocateTrade(); G.applyTradeDaily(); G.economyDaily();
  };

  function apply1991(sc) {
    const E = sc.econ || {};
    N.forEach(n => {
      const e = E[n.a3] || [sc.defGdp, sc.defPop, null, null]; const fg = e[0], fp = e[1];
      ter.forEach(t => { if (t.owner !== n.id) return; t.gdp *= fg; t.gdp0 = (t.gdp0 || t.gdp) * fg; t.pop *= fp; if (t.prod && t.prod.chips) t.prod.chips *= 0.2; });
      n.cash *= fg; n.debt *= fg; n.milStock = (n.milStock || 0) * fg;
      n.tech = clamp((n.tech || 0.6) * (e[3] != null ? e[3] / Math.max(0.4, n.tech || 0.6) : sc.defTech), 0.35, 1.3);
      if (e[2] != null && n.troopsBase > 0) { const k = e[2] / n.troopsBase; G.armies.forEach(a => { if (a.n === n.id) a.k *= k; }); n.troopsBase = e[2]; }
      if (e[4] != null) { n.nw = e[4]; n.nuke = e[4] > 0; n.nk = n.nk || { tested: true, esc: {}, used: 0 }; n.nk.tested = e[4] > 0; n.nk.del = n.nk.del || (e[4] > 500 ? 3 : 2); }
      if (n.res) { ERA0.forEach(id => { delete n.res.done[id]; }); n.res.act = {}; n.res.queue = []; }
    });
    // Захід уже має частину технологій 90-х
    const has = (a3, ids) => { const n = N[G.nIdx[a3]]; if (n && n.res) ids.forEach(id => { n.res.done[id] = -1; }); };
    ['USA'].forEach(a => has(a, ['pc_era', 'precision', 'stealth', 'modern_armor', 'gps', 'uav_recon', 'aegis', 'launch_comm', 'cnc', 'ccgt', 'market_ref']));
    ['GBR', 'FRA', 'DEU', 'JPN', 'ISR', 'CAN', 'NLD', 'SWE', 'ITA'].forEach(a => has(a, ['pc_era', 'cnc', 'market_ref', 'modern_armor', 'ccgt']));
    ['RUS', 'UKR'].forEach(a => has(a, ['modern_armor', 'launch_comm', 'sam_new']));
    // союзи й блоки 1991 року
    const ids = s => (s || '').split(' ').map(a => G.nIdx[a]).filter(x => x != null);
    const nato = G.alliances.find(a => a.name === 'НАТО'); if (nato) nato.m = new Set(ids(sc.nato));
    G.alliances = G.alliances.filter(a => a.name !== 'ОДКБ' && a.name !== 'Росія–КНДР');
    if (G.blocs) { if (G.blocs.nato) G.blocs.nato.m = ids(sc.nato); if (G.blocs.eu) G.blocs.eu.m = ids(sc.eu); if (G.blocs.asean) G.blocs.asean.m = ids(sc.asean); if (G.blocs.opec) G.blocs.opec.m = ids(sc.opec);
      (sc.noBlocs || []).forEach(k => { if (G.blocs[k]) G.blocs[k].m = []; }); }
    const eu = new Set(ids(sc.eu)); [...G.treaties].forEach(t => { const [a, b] = t.split('|').map(Number); if (!eu.has(a) || !eu.has(b)) G.treaties.delete(t); });
    const keep = new Set(ids((sc.sanctionsOnly || []).join(' '))); [...G.sanctions].forEach(s => { const to = +s.split('>')[1]; if (!keep.has(to)) G.sanctions.delete(s); });
    // санкції проти Росії в 1991-му немає; Україна — молода держава
    const U = N[G.nIdx.UKR]; if (U) { U.ukr91 = 1; U.stab = clamp(U.stab, 30, 60); U.pol.mil = U.basePol.mil = 0.03; U.aidIn = 0; }
    // відносини 1991-го: холодна війна скінчилася — менше ворожнечі; потім — особливі пари зі сценарію
    for (let a = 0; a < N.length; a++) for (let b = 0; b < N.length; b++) if (a !== b) { const v = G.rel[a][b] * 0.35 + 5; G.rel[a][b] = v; if (G.relBase) G.relBase[a][b] = v; }
    (sc.rel || []).forEach(([x, y, v]) => { const a = G.nIdx[x], b = G.nIdx[y]; if (a == null || b == null) return; G.rel[a][b] = G.rel[b][a] = v; if (G.relBase) G.relBase[a][b] = G.relBase[b][a] = v; });
    Object.entries(sc.aggr || {}).forEach(([a3, v]) => { const n = N[G.nIdx[a3]]; if (n) n.aggr = v; });
    N.forEach(n => { if (!n.pol || !n.agg) return; const pop = n.agg.pop || 1; n.pol.mob = n.basePol.mob = clamp((n.troopsBase / pop / 1000) * 1.15, 0.003, 0.06); });
    G.say(`🇺🇦 24 серпня 1991 року. Верховна Рада проголошує незалежність України. Попереду — референдум, реформи й непрості рішення`, 'big');
  }

  // Будапештський вибір: Україна та ядерна зброя (≈ кінець 1994 року)
  const BUD = { id: 'budapest', adv: 'dipl', ok: () => false, t: () => null, o: [
    ['Віддати ядерну зброю в обмін на гарантії безпеки', n => { n.nw = 0; n.nuke = false; G.N.forEach(o => { if (['USA', 'GBR', 'RUS'].includes(o.a3)) { G.rel[n.id][o.id] = G.rel[o.id][n.id] = clamp(G.rel[n.id][o.id] + 15, -100, 100); } }); n.cash += (n.agg ? n.agg.gdp * 0.02 : 1); return 'Арсенал вивезено й знищено. Підписано меморандум про гарантії безпеки; отримано фінансову допомогу'; }],
    ['Залишити частину арсеналу', n => { n.nw = Math.round((n.nw || 0) * 0.3); G.N.forEach(o => { if (o.alive && o.id !== n.id && ['USA', 'GBR', 'RUS', 'DEU', 'FRA'].includes(o.a3)) { G.rel[n.id][o.id] = G.rel[o.id][n.id] = clamp(G.rel[n.id][o.id] - 35, -100, 100); } }); n.stab -= 5; return 'Частину боєголовок залишено. Захід і Росія обурені, кредити заморожено'; }]
  ] };
  if (G.DEC_EV) G.DEC_EV.push(BUD);
  G.h29 && G.h29.m.push(() => {
    if (G.scen !== 'ind1991' || G.day < 1200 || G.v29.budapest) return; const U = N[G.nIdx.UKR]; if (!U || !U.alive || !(U.nw > 0)) return; G.v29.budapest = 1;
    if (G.isHuman(U.id)) G.decisions.push({ id: G.nextId++, ev: 'budapest', nid: U.id, ctx: { text: 'Будапешт, грудень 1994-го. США, Британія й Росія пропонують гарантії безпеки й допомогу в обмін на ядерний арсенал' }, d: G.day });
    else { BUD.o[0][1](U); G.say('🕊 Україна віддала ядерну зброю в обмін на гарантії безпеки (Будапештський меморандум)', 'big'); }
  });

});

// МИРНА КОНФЕРЕНЦІЯ: мир не одним кліком, а торгом. Гравець складає пакет умов: долю кожного спірного регіону,
// репарації, демілітаризовану зону, гарантії безпеки, посередника. ШІ погоджується, якщо пакет вкладається в «бюджет поступок»,
// що залежить від ходу війни, виснаження й тиску на ворога.
LORA.sim.register('peaceconf', 95, function (G) {
  const { N, ter, T } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.repar = G.repar || []; G.truce = G.truce || {};
  G.confPrepare = function (a, b) {
    const regs = ter.filter(t => (t.owner === a && t.ctrl === b) || (t.owner === b && t.ctrl === a) || (t.occ && ((t.occ.by === a && t.ctrl === b) || (t.occ.by === b && t.ctrl === a)))).map(t => ({ i: t.i, owner: t.owner, ctrl: t.ctrl, gdp: t.gdp }));
    const s = G.warScore(a, b), ex = N[b].warExh || 0, pr = N[b].press || 0;
    const budget = Math.round(clamp(50 + s * 60 + ex * 45 + pr * 30 - (N[a].warExh || 0) * 25, 0, 160));
    const mediators = N.filter(m => m.alive && m.id !== a && m.id !== b && G.rel[m.id][a] > 20 && G.rel[m.id][b] > 0 && m.agg && m.agg.gdp > 500).sort((x, y) => (G.rel[y.id][a] + G.rel[y.id][b]) - (G.rel[x.id][a] + G.rel[x.id][b])).slice(0, 3).map(m => m.id);
    const guarantors = N.filter(m => m.alive && m.id !== a && m.id !== b && G.rel[m.id][a] >= 50 && m.agg && m.agg.gdp > 1000 && !G.atWar(m.id, b)).sort((x, y) => y.agg.gdp - x.agg.gdp).slice(0, 4).map(m => m.id);
    return { a, b, regs, budget, score: s, mediators, guarantors };
  };
  // вартість пакета для сторони b (ШІ). Від'ємна — пакет вигідний b.
  G.confCost = function (a, b, terms) {
    const gb = Math.max(1, N[b].agg.gdpPot || N[b].agg.gdp || 1), ga = Math.max(1, N[a].agg.gdpPot || N[a].agg.gdp || 1); let cost = 0; const items = [];
    (terms.regs || []).forEach(r => {
      const t = ter[r.i], to = terms.give[r.i]; if (to == null) return; let c = 0;
      if (t.owner === b && to === a) c = 25 + t.gdp / gb * 900;            // анексія земель b
      else if (t.owner === a && t.ctrl === b && to === a) c = 6 + t.gdp / gb * 250; // b повертає захоплене
      else if (t.owner === a && to === b) c = -(10 + t.gdp / ga * 400);    // a поступається своєю землею
      else if (t.owner === b && t.ctrl === a && to === b) c = -(4 + t.gdp / gb * 150); // a повертає захоплене
      cost += c; items.push([r.i, c]);
    });
    if (terms.repar) { const yrs = terms.repar.years || 0, amt = terms.repar.amt || 0; const c = amt * yrs / gb * 1500 * (terms.repar.from === b ? 1 : -1); cost += c; items.push(['repar', c]); }
    if (terms.dmz) { cost += 8; items.push(['dmz', 8]); }
    if (terms.guar != null) { cost += 12; items.push(['guar', 12]); }
    let budget = terms._budget; if (terms.med != null) budget += 15;
    return { cost: Math.round(cost), budget, ok: cost <= budget, items };
  };
  G.confSign = function (a, b, terms) {
    const P = G.confPrepare(a, b); terms._budget = P.budget; const ev = G.confCost(a, b, terms); if (!ev.ok) { G.rel[b][a] = clamp(G.rel[b][a] - 3, -100, 100); return { ok: false, err: `${N[b].name} відкидає умови: поступки ${ev.cost} при межі ${ev.budget}` }; }
    if (terms.med != null) { const fee = N[a].agg.gdp * 0.004; N[a].cash -= fee; G.rel[terms.med][a] = clamp(G.rel[terms.med][a] + 10, -100, 100); }
    P.regs.forEach(r => { const t = ter[r.i], to = terms.give[r.i] != null ? terms.give[r.i] : t.ctrl; if (t.owner !== to) { t.owner = to; t.integ = 0.15; } t.ctrl = to; t.occ = null; });
    ter.forEach(t => { if (t.occ && (t.occ.by === a || t.occ.by === b)) t.occ = null; });
    G.endWar(a, b);
    G.armies.forEach(x => { if ((x.n === a || x.n === b) && !G.friendlyTo(x.n, ter[x.t].ctrl)) { x.t = N[x.n].home; x.mv = null; } });
    if (terms.repar && terms.repar.amt > 0) G.repar.push({ from: terms.repar.from, to: terms.repar.from === a ? b : a, amt: terms.repar.amt, until: G.day + 365 * terms.repar.years });
    if (terms.dmz) { P.regs.forEach(r => { const t = ter[r.i]; t.fort = 0; t.bfort = 0; t.dmz = G.day + 1825; }); G.truce[G.warKey(a, b)] = G.day + 1825; }
    else G.truce[G.warKey(a, b)] = G.day + 730;
    if (terms.guar != null) G.alliances.push({ name: `Гарантії безпеки: ${N[terms.guar].name} — ${N[a].name}`, m: new Set([a, terms.guar]) });
    G.rel[a][b] = G.rel[b][a] = terms.dmz ? -35 : -50; G.refreshNation(a); G.refreshNation(b);
    G.say(`🕊 Мирна конференція: ${N[a].name} і ${N[b].name} підписали мирну угоду${terms.med != null ? ' за посередництва ' + N[terms.med].name : ''}.`, 'good');
    return { ok: true };
  };
  // репарації: щомісяця
  G.reparMonthly = function () { G.repar = (G.repar || []).filter(r => r.until > G.day && N[r.from] && N[r.from].alive); G.repar.forEach(r => { const v = r.amt / 12; N[r.from].cash -= v; N[r.to].cash += v; }); };
  G.truceActive = (a, b) => (G.truce && G.truce[G.warKey(a, b)] > G.day);
  G.act.confSign = (b, terms) => G.player >= 0 ? G.confSign(G.player, b, terms) : { ok: false, err: 'Лише за державу' };
  // перемир'я забороняє ШІ знову оголошувати війну
  const baseDecl = G.declareWar;
  G.declareWar = function (att, def) { if (G.truceActive(att, def) && att !== G.player && !(G.humans && G.humans.has(att))) return; return baseDecl.apply(this, arguments); };
});

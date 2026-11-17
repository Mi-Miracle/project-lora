// ДОСЛІДЖЕННЯ: очки науки з ВВП × частки видатків на науку (pol.res), університетів і чипів; дифузія технологій
// (що більше світу вже має технологію — то дешевше її повторити; союзники діляться). Ефекти — постійні бонуси держави.
LORA.sim.register('research', 58, function (G) {
  const { N } = G; const U = LORA.core, clamp = U.clamp; const TT = G.D.techs;
  const ids = Object.keys(TT);
  N.forEach(n => { n.res = { done: {}, cur: null, prog: 0, queue: [], auto: true, pts: 0, last: null }; n.rx = { g: 0, q: 0, nav: 0, sup: 0, build: 0, cyber: 0 }; });

  G.techAvail = (n, id) => !n.res.done[id] && (TT[id].req || []).every(r => n.res.done[r]);
  G.techOwnersShare = function (id) { let have = 0, all = 0; N.forEach(o => { if (!o.alive || !o.agg) return; all += o.agg.gdp; if (o.res.done[id]) have += o.agg.gdp; }); return all ? have / all : 0; };
  G.techCost = function (n, id) {
    const base = TT[id].c; const share = G.techOwnersShare(id);
    const ally = N.some(o => o.alive && o.id !== n.id && o.res.done[id] && G.allied(n.id, o.id)) ? 0.15 : 0;
    const warTech = (TT[id].e.q || TT[id].e.nav || TT[id].e.um || TT[id].e.air || TT[id].e.ul || TT[id].br === 'mil') && G.enemiesOf(n.id).length ? 0.5 : 1; // війна прискорює військові інновації
    return Math.round(base * clamp(1 - 0.65 * share - ally, 0.25, 1) * warTech);
  };
  // очки науки на рік
  G.sciencePerYear = function (n) {
    if (!n.agg) return 0; const spend = Math.max(0, n.agg.gdp * n.pol.res);
    let unis = 0; G.ter.forEach(t => { if (t.owner === n.id && t.bld.university) unis += t.bld.university; if (t.owner === n.id && t.bld.ai_datacenter) unis += t.bld.ai_datacenter * 4; });
    return (45 * Math.pow(spend, 0.6) + unis * 8) * (0.6 + 0.4 * (n.ratio ? n.ratio.chips : 1)) * (0.7 + 0.3 * n.tech) * (n.sciK || 1);
  };
  G.setResearch = function (nid, id) { const n = N[nid]; if (!TT[id] || !G.techAvail(n, id)) return { ok: false, err: 'Дослідження недоступне' }; if (n.res.cur !== id) { n.res.cur = id; n.res.prog = 0; } return { ok: true }; };
  G.queueResearch = function (nid, id) {
    const n = N[nid]; if (n.res.done[id] || n.res.queue.includes(id)) return { ok: false, err: 'Вже в черзі' };
    const add = x => { if (n.res.done[x] || n.res.queue.includes(x) || n.res.cur === x) return; (TT[x].req || []).forEach(add); n.res.queue.push(x); }; // спершу передумови
    add(id); if (!n.res.cur) pickNext(n); return { ok: true };
  };

  function apply(n, id) {
    const e = TT[id].e || {}; n.res.done[id] = G.day; n.res.last = id;
    if (e.g) n.mods.push({ growth: e.g, until: 1e9, tech: id });
    if (e.prod) for (const r in e.prod) n.mods.push({ r, mul: e.prod[r], until: 1e9, tech: id });
    if (e.tech) n.tech = Math.min(2.2, n.tech + e.tech);
    if (e.stab) n.stab = Math.min(100, n.stab + e.stab);
    ['q', 'nav', 'sup', 'build', 'cyber'].forEach(k => { if (e[k]) n.rx[k] += e[k] * (k === 'q' || k === 'nav' ? 0.6 : 1); });
    n.rx.cyber = Math.min(0.95, n.rx.cyber);
  }
  // вибір наступного дослідження (черга → автоматичний вибір за пріоритетами агента)
  function pickNext(n) {
    n.res.queue = n.res.queue.filter(id => !n.res.done[id]);
    const q = n.res.queue.find(id => G.techAvail(n, id)); if (q) { n.res.queue = n.res.queue.filter(x => x !== q); n.res.cur = q; n.res.prog = 0; return; }
    if (G.isHuman(n.id) && !n.res.auto && !G.autoPlayer) { n.res.cur = null; return; }
    const war = G.enemiesOf(n.id).length > 0, threat = n.ai ? n.ai.threat || 0 : 0;
    let best = null;
    ids.forEach(id => { if (!G.techAvail(n, id)) return; const t = TT[id], e = t.e || {};
      let w = 1 + (e.g || 0) * 150 + (e.tech || 0) * 15 + (e.prod ? 0.4 : 0);
      const mil = Object.values(e.um || {}).reduce((a, b) => a + b, 0) + Object.values(e.air || {}).reduce((a, b) => a + b, 0) * 0.5 + (e.ul ? 0.15 : 0) + (t.br === 'mil' && !e.q && !e.um && !e.air && !e.ul ? 0.12 : 0);
      if (war || threat > 1.2) w += (e.q || 0) * 25 + (e.nav || 0) * 8 + (e.sup || 0) * 10 + mil * 12; else w += (e.q || 0) * 6 + mil * 2;
      const sc = w / G.techCost(n, id); if (!best || sc > best.sc) best = { id, sc }; });
    n.res.cur = best ? best.id : null; n.res.prog = 0;
  }
  G.researchDaily = function () {
    const weekly = G.day % 7 === 0;
    N.forEach(n => {
      if (!n.alive) return;
      if (weekly) n.res.pts = G.sciencePerYear(n);
      if (!n.res.cur) { if (weekly) pickNext(n); if (!n.res.cur) return; }
      n.res.prog += n.res.pts / 365;
      const cost = weekly || !n.res._c ? (n.res._c = G.techCost(n, n.res.cur)) : n.res._c;
      if (n.res.prog >= cost) {
        const id = n.res.cur; apply(n, id); n.res.prog = 0; n.res.cur = null; n.res._c = 0;
        if (n.id === G.player) G.say(`🔬 Дослідження завершено: ${TT[id].n}`, 'good', [n.id]);
        else if (TT[id].era >= 3 && G.techOwnersShare(id) < 0.2) G.say(`🔬 ${n.name} першою у світі освоює: ${TT[id].n}`, 'info', [n.id]);
        pickNext(n);
      }
    });
  };
  // ---- ефекти: якість армії/флоту, постачання, швидкість будівництва
  const baseEco = G.economyDaily;
  G.economyDaily = function () { baseEco(); N.forEach(n => { if (!n.alive || !n.rx) return; if (n.rx.q) n.q *= 1 + n.rx.q; if (n.rx.nav) n.navQ *= 1 + n.rx.nav; }); };
  const baseSup = G.supplyTarget;
  G.supplyTarget = function (a) { const n = N[a.n]; return clamp(baseSup(a) + (n && n.rx ? n.rx.sup : 0), 0, 1); };
  const baseBuild = G.startBuild;
  G.startBuild = function (nid, i, type, quiet) {
    const r = baseBuild(nid, i, type, quiet); const n = N[nid];
    if (r.ok && n.rx && n.rx.build) { const c = G.constructions[G.constructions.length - 1]; const d = Math.round((c.done - G.day) * n.rx.build); c.done -= d; r.days -= d; }
    return r;
  };
});

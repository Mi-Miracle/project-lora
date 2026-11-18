// ДОСЛІДЖЕННЯ: очки науки з ВВП × частки видатків на науку (pol.res), університетів і чипів; дифузія технологій
// (що більше світу вже має технологію — то дешевше її повторити; союзники діляться). Ефекти — постійні бонуси держави.
LORA.sim.register('research', 58, function (G) {
  const { N } = G; const U = LORA.core, clamp = U.clamp; const TT = G.D.techs;
  const ids = Object.keys(TT);
  N.forEach(n => { n.res = { done: {}, cur: null, prog: 0, queue: [], auto: true, pts: 0, last: null }; n.rx = { g: 0, q: 0, nav: 0, sup: 0, build: 0, cyber: 0 }; });

  G.techAvail = (n, id) => !n.res.done[id] && (TT[id].req || []).every(r => n.res.done[r]);
  let tosC = {}, tosW = -1;
  G.techOwnersShare = function (id) { const w = Math.floor(G.day / 7); if (w !== tosW) { tosW = w; tosC = {}; } if (tosC[id] != null) return tosC[id]; return (tosC[id] = tos(id)); };
  const tos = function (id) { let have = 0, all = 0; N.forEach(o => { if (!o.alive || !o.agg) return; all += o.agg.gdp; if (o.res.done[id]) have += o.agg.gdp; }); return all ? have / all : 0; };
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
  // ---- СФЕРИ: бюджет науки ділиться між гілками (alloc), кожна гілка має пул очок (bp) і своє активне дослідження (act)
  const BR = Object.keys(G.D.techBranches);
  const defAlloc = () => { const a = {}; BR.forEach(b => { a[b] = 1; }); return a; };
  const ens = n => { const R = n.res; if (!R.act) R.act = {}; if (!R.bp) R.bp = {}; if (!R.alloc) { R.alloc = defAlloc(); if (n.agg) aiAlloc(n); } return R; };
  G.resEnsure = ens;
  G.resShare = (n, b) => { const R = ens(n); let s = 0; BR.forEach(k => { s += R.alloc[k] || 0; }); return s ? (R.alloc[b] || 0) / s : 0; };
  G.resBranchPts = (n, b) => (n.res.pts || G.sciencePerYear(n)) * G.resShare(n, b); // очок на рік у сфері
  const feed = (n, b) => { const R = ens(n), A = R.act[b]; if (!A || !(R.bp[b] > 0)) return; const need = Math.max(0, G.techCost(n, A.id) - A.p), use = Math.min(need, R.bp[b]); A.p += use; R.bp[b] -= use; };
  G.setResearch = function (nid, id) { const n = N[nid]; if (!TT[id] || !G.techAvail(n, id)) return { ok: false, err: 'Дослідження недоступне' }; const R = ens(n), b = TT[id].br;
    const old = R.act[b]; if (old && old.id !== id) { R.pg = R.pg || {}; R.pg[old.id] = old.p; } if (!old || old.id !== id) R.act[b] = { id, p: (R.pg && R.pg[id]) || 0 }; if (R.pg) delete R.pg[id];
    feed(n, b); R.cur = id; R.prog = R.act[b].p; return { ok: true }; };
  G.queueResearch = function (nid, id) {
    const n = N[nid]; const R = ens(n); if (n.res.done[id] || n.res.queue.includes(id)) return { ok: false, err: 'Вже в черзі' };
    const add = x => { if (n.res.done[x] || n.res.queue.includes(x) || (R.act[TT[x].br] && R.act[TT[x].br].id === x)) return; (TT[x].req || []).forEach(add); n.res.queue.push(x); }; // спершу передумови
    add(id); BR.forEach(b => { if (!R.act[b]) pickBr(n, b); }); return { ok: true };
  };
  G.resAlloc = function (nid, b, w) { const n = N[nid]; if (!n || !G.D.techBranches[b]) return { ok: false, err: '?' }; ens(n).alloc[b] = clamp(+w || 0, 0, 10); return { ok: true }; };
  // разовий грант у сферу: гроші → очки науки цієї сфери
  G.resGrantPts = (n, amt) => Math.round(90 * Math.pow(Math.max(0, amt), 0.6) * (0.7 + 0.3 * n.tech) * (n.sciK || 1));
  G.resGrant = function (nid, b, amt) { const n = N[nid]; if (!n || !G.D.techBranches[b] || !(amt > 0)) return { ok: false, err: '?' }; if (n.cash < amt) return { ok: false, err: 'Бракує коштів у бюджеті' };
    n.cash -= amt; const R = ens(n), p = G.resGrantPts(n, amt); R.bp[b] = (R.bp[b] || 0) + p; feed(n, b); return { ok: true, msg: `+${p} очок` }; };
  // прискорення поточного дослідження (події, шпигунство, прориви)
  G.resBoost = function (n, frac) { const R = ens(n); const A = (R.cur && TT[R.cur] && R.act[TT[R.cur].br] && R.act[TT[R.cur].br].id === R.cur) ? R.act[TT[R.cur].br] : Object.values(R.act)[0]; if (A) A.p += G.techCost(n, A.id) * frac; };
  G.resActive = n => Object.values(ens(n).act);
  // ШІ розподіляє бюджет між сферами за пріоритетами
  function aiAlloc(n) { const R = ens(n), war = G.enemiesOf(n.id).length > 0, th = n.ai ? n.ai.threat || 0 : 0; const m = war || th > 1.2 ? 2.2 : 0.8;
    const r1 = v => Math.max(0, Math.round(v * 2)); R.alloc = { econ: r1(1.4), ind: r1(1.3), energy: r1(1.1), bio: r1(1), mil: r1(m), drone: r1(m * 0.8), cyber: r1(1), space: r1(0.3 + (n.agg && n.agg.gdp > 2000 ? 0.7 : 0)), navy: r1((G.nationPorts && G.nationPorts(n.id).length ? 0.3 : 0) + (war ? 0.4 : 0)) }; }
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
  function pickBr(n, b) {
    const R = ens(n); n.res.queue = n.res.queue.filter(id => !n.res.done[id]);
    const q = n.res.queue.find(id => TT[id].br === b && G.techAvail(n, id)); if (q) { n.res.queue = n.res.queue.filter(x => x !== q); G.setResearch(n.id, q); return; }
    if (G.isHuman(n.id) && !n.res.auto && !G.autoPlayer) return;
    const war = G.enemiesOf(n.id).length > 0, threat = n.ai ? n.ai.threat || 0 : 0;
    let best = null;
    ids.forEach(id => { if (TT[id].br !== b || !G.techAvail(n, id)) return; const t = TT[id], e = t.e || {};
      let w = 1 + (e.g || 0) * 150 + (e.tech || 0) * 15 + (e.prod ? 0.4 : 0);
      const mil = Object.values(e.um || {}).reduce((a, x) => a + x, 0) + Object.values(e.air || {}).reduce((a, x) => a + x, 0) * 0.5 + (e.ul ? 0.15 : 0) + (t.br === 'mil' && !e.q && !e.um && !e.air && !e.ul ? 0.12 : 0);
      if (war || threat > 1.2) w += (e.q || 0) * 25 + (e.nav || 0) * 8 + (e.sup || 0) * 10 + mil * 12; else w += (e.q || 0) * 6 + mil * 2;
      const sc = w / G.techCost(n, id); if (!best || sc > best.sc) best = { id, sc }; });
    if (best) G.setResearch(n.id, best.id);
  }
  const pickNext = n => BR.forEach(b => { if (!ens(n).act[b]) pickBr(n, b); });
  G.researchDaily = function () {
    const weekly = G.day % 7 === 0;
    N.forEach(n => {
      if (!n.alive) return; const R = ens(n);
      if (weekly) { R.pts = G.sciencePerYear(n); if (!G.isHuman(n.id) && G.day % 28 === 0) aiAlloc(n); pickNext(n); }
      let tw = 0; BR.forEach(b => { tw += R.alloc[b] || 0; }); if (!tw) return; const day = R.pts / 365 / tw;
      BR.forEach(b => {
        const inc = day * (R.alloc[b] || 0); if (!inc) return; const A = R.act[b];
        if (!A) { R.bp[b] = Math.min((R.bp[b] || 0) + inc, 50000); return; }
        A.p += inc; if (weekly || !A.c) A.c = G.techCost(n, A.id); const cost = A.c;
        if (A.p >= cost) {
          const id = A.id; apply(n, id); R.bp[b] = (R.bp[b] || 0) + (A.p - cost); delete R.act[b]; if (R.cur === id) R.cur = null;
          if (n.id === G.player || (G.isHuman && G.isHuman(n.id))) G.say(`🔬 Дослідження завершено: ${TT[id].n}`, 'good', [n.id]);
          else if (TT[id].era >= 3 && G.techOwnersShare(id) < 0.2) G.say(`🔬 ${n.name} першою у світі освоює: ${TT[id].n}`, 'info', [n.id]);
          pickBr(n, b);
        }
      });
      const f = R.cur && TT[R.cur] && R.act[TT[R.cur].br]; if (f && f.id === R.cur) R.prog = f.p; else { const a = Object.values(R.act)[0]; R.cur = a ? a.id : null; R.prog = a ? a.p : 0; }
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

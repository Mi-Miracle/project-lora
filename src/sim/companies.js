// КОМПАНІЇ: корпорації з офісами (штаб + філії) у країнах, активами-будівлями в регіонах, прибутком, податками,
// лобізмом (вплив на уряди) і можливістю перебрати владу в державі. ШІ-компанії розвиваються самі.
// Гравець може почати за компанію (G.player = -1, G.pc = індекс компанії) і після захоплення держави стати її урядом.
LORA.sim.register('companies', 57, function (G) {
  const { N, ter, T } = G; const U = LORA.core, clamp = U.clamp; const BD = G.D.buildings, SEC = G.D.companySectors;
  G.companies = []; G.pc = -1;
  const home = n => n.home != null ? n.home : ter.findIndex(t => t.owner === n.id);

  G.newCompany = function (o) {
    const c = { id: G.companies.length, name: o.name, en: o.en || o.name, sector: o.sector, home: o.home, cash: o.cash, base: o.base || 0,
      offices: [], assets: [], pend: [], infl: {}, profitY: 0, taxY: 0, ai: !o.player, alive: true, founded: G.day, hist: [] };
    G.companies.push(c);
    const hq = o.hqRegion != null ? o.hqRegion : home(N[o.home]); if (hq >= 0) c.offices.push({ n: ter[hq].owner, t: hq, hq: true });
    return c;
  };
  G.seedCompanies = function () {
    (G.D.companies || []).forEach(([name, en, sector, a3, cap]) => { const nid = G.nIdx[a3]; if (nid == null || !N[nid].alive) return;
      const c = G.newCompany({ name, en, sector, home: nid, cash: cap * 0.25, base: cap * 0.75 }); c.infl[nid] = 8 + Math.min(25, cap / Math.max(1, N[nid].agg ? N[nid].agg.gdp : 100) * 300); });
  };
  G.startCompany = function (o) {
    const nid = G.nIdx[o.home]; const cash = o.cash != null ? o.cash : (G.diff ? G.diff.companyCash : 10);
    const c = G.newCompany({ name: o.name || 'Моя компанія', en: o.name, sector: o.sector || 'industry', home: nid, cash, player: true, hqRegion: o.hqRegion });
    c.infl[nid] = 3; G.pc = c.id;
    G.say(`🏢 Засновано компанію «${c.name}» (${SEC[c.sector].n}). Штаб: ${T[c.offices[0].t].n}, ${N[nid].name}. Капітал $${cash} млрд`, 'big', [nid]);
    return c;
  };
  G.myCo = () => G.companies[G.pc];
  G.pv = () => G.player >= 0 ? G.player : (G.myCo() ? G.myCo().home : (G.leader ? G.leader.home : 0)); // «точка зору» інтерфейсу

  // ---- оцінки
  G.officeCost = (c, i) => +(0.05 + ter[i].gdp * 0.004 + (N[ter[i].owner].agg ? N[ter[i].owner].agg.gdp : 50) * 0.00015).toFixed(2);
  G.coHasOffice = (c, nid) => c.offices.some(o => o.n === nid);
  G.assetValue = c => c.assets.reduce((s, a) => s + BD[a.type].cost * a.lvl * 0.85, 0) + c.pend.reduce((s, p) => s + p.cost * 0.7, 0);
  G.coValue = c => c.cash + c.base + G.assetValue(c);
  G.coAssetsIn = (c, nid) => c.assets.filter(a => ter[a.t].owner === nid).reduce((s, a) => s + BD[a.type].cost * a.lvl, 0);
  // річний прибуток з рівня активу
  G.assetProfit = function (c, a) {
    const t = ter[a.t], b = BD[a.type], host = N[t.owner];
    if (t.ctrl !== t.owner) return 0;
    let p = Math.max(b.va * 0.55, b.cost * 0.1) * (1 - t.dmg);
    if (b.out) { let pf = 0, w = 0; for (const r in b.out) { const q = b.out[r]; pf += q * (G.prices[r] / G.priceBase[r]); w += q; } if (w) p *= clamp(pf / w, 0.4, 2.5); }
    if (b.in) { let inR = 1; for (const r in b.in) inR = Math.min(inR, host.ratio[r] != null ? host.ratio[r] : 1); p *= 0.4 + 0.6 * inR; }
    if (c.sector === 'military' && G.enemiesOf(host.id).length) p *= 1.7; // держзамовлення під час війни
    if (c.sector === 'logistics') p *= 0.8 + Math.min(0.8, host.agg.gdp / 4000);
    if (c.sector === 'telecom') p *= 0.6 + (host.net || 0.4) * 1.2;
    if (c.sector === 'space') p *= G.enemiesOf(host.id).length ? 1.1 : 1.6;
    if (c.sector === 'leisure') p *= G.enemiesOf(host.id).length ? 0.4 : 1.3;
    p *= 0.7 + host.stab / 160;
    if (t.pol.sez) p *= 1.15;
    return p * a.lvl;
  };
  const taxRate = (c, nid) => clamp(N[nid].pol.tax * 0.7 - (c.infl[nid] || 0) * 0.002, 0.05, 0.45) * (c.dip && c.dip[nid] && c.dip[nid].tax > G.day ? 0.5 : 1);
  G.coCostMul = (c, nid) => (c.dip && c.dip[nid] && c.dip[nid].sub > G.day ? 0.7 : 1);

  // ---- дії компанії
  G.coCanBuild = function (c, i, type) {
    const t = ter[i]; const host = t.owner;
    if (!SEC[c.sector].assets.includes(type)) return 'Не профіль компанії';
    if (!G.coHasOffice(c, host)) return 'Потрібен офіс у цій країні';
    if (t.ctrl !== host) return 'Регіон окупований';
    const err = G.canBuild(host, i, type); if (err && !/Лише на власній/.test(err)) return err;
    const cost = G.buildCost(host, i, type) * 1.1 * G.coCostMul(c, host); if (c.cash < cost) return `Потрібно $${cost.toFixed(2)} млрд`;
    return '';
  };
  G.coBuild = function (c, i, type, quiet) {
    const err = G.coCanBuild(c, i, type); if (err) return { ok: false, err };
    const host = ter[i].owner, cost = G.buildCost(host, i, type) * 1.1 * G.coCostMul(c, host); c.cash -= cost;
    const days = Math.round(BD[type].days / (0.7 + 0.3 * N[host].infraLvl));
    const k = { id: G.nextId++, n: host, t: i, type, done: G.day + days, start: G.day, cost, co: c.id };
    G.constructions.push(k); c.pend.push({ cid: k.id, t: i, type, cost, done: k.done });
    if (!quiet && !c.ai) G.say(`🏗 «${c.name}» будує: ${BD[type].n} — ${T[i].n} (${days} дн.)`, 'good', [host]);
    return { ok: true, days, cost };
  };
  G.coAssetDone = function (k) { const c = G.companies[k.co]; if (!c) return; c.pend = c.pend.filter(p => p.cid !== k.id);
    const a = c.assets.find(x => x.t === k.t && x.type === k.type); if (a) a.lvl++; else c.assets.push({ t: k.t, type: k.type, lvl: 1 });
    if (c.id === G.pc) G.say(`✅ «${c.name}»: збудовано ${BD[k.type].n} — ${T[k.t].n}`, 'good', [k.n]); };
  G.coAssetLost = function (k) { const c = G.companies[k.co]; if (!c) return; c.pend = c.pend.filter(p => p.cid !== k.id); if (c.id === G.pc) G.say(`🏚 «${c.name}»: будівництво втрачено — ${T[k.t].n}`, 'bad', [k.n]); };
  G.coOpenOffice = function (c, i) {
    const nid = ter[i].owner; if (G.coHasOffice(c, nid)) return { ok: false, err: 'Офіс у цій країні вже є' };
    if (ter[i].ctrl !== nid) return { ok: false, err: 'Регіон окупований' };
    if (G.atWar(nid, c.home)) return { ok: false, err: 'Країна воює з країною вашого штабу' };
    if (G.sanctions.has(nid + '>' + c.home) || G.sanctions.has(c.home + '>' + nid)) return { ok: false, err: 'Діють санкції' };
    const cost = G.officeCost(c, i); if (c.cash < cost) return { ok: false, err: `Потрібно $${cost} млрд` };
    c.cash -= cost; c.offices.push({ n: nid, t: i, hq: false }); c.infl[nid] = (c.infl[nid] || 0) + 2;
    if (!c.ai) G.say(`🏢 «${c.name}» купує офіс: ${T[i].n}, ${N[nid].name} ($${cost} млрд)`, 'good', [nid]);
    return { ok: true, cost };
  };
  G.coMoveHQ = function (c, i) { const nid = ter[i].owner; if (!G.coHasOffice(c, nid)) return { ok: false, err: 'Спершу купіть офіс у цій країні' };
    c.offices.forEach(o => o.hq = false); let o = c.offices.find(x => x.n === nid); o.hq = true; o.t = i; c.home = nid; return { ok: true }; };
  G.coLobby = function (c, nid, amt) {
    if (!G.coHasOffice(c, nid)) return { ok: false, err: 'Потрібен офіс у цій країні' }; if (c.cash < amt) return { ok: false, err: 'Недостатньо коштів' };
    c.cash -= amt; const gdp = Math.max(5, N[nid].agg.gdp); const d = amt / (gdp * 0.0015) * (1 - (c.infl[nid] || 0) / 140);
    c.infl[nid] = clamp((c.infl[nid] || 0) + d, 0, 100); N[nid].cash += amt * 0.3; return { ok: true, d };
  };
  G.takeoverCost = (c, nid) => +(N[nid].agg.gdp * 0.03 + 0.5).toFixed(1);
  G.coCanTakeover = function (c, nid) {
    const n = N[nid], inf = c.infl[nid] || 0; if (!n.alive) return 'Держава не існує';
    if (inf < 70) return `Потрібен вплив ≥ 70 (зараз ${inf.toFixed(0)})`;
    if (inf < 90 && n.stab > 65) return `Уряд надто стабільний (${n.stab.toFixed(0)}). Потрібна стабільність < 65 або вплив ≥ 90`;
    const cost = G.takeoverCost(c, nid); if (c.cash < cost) return `Потрібно $${cost} млрд на кампанію`;
    return '';
  };
  G.coTakeover = function (c, nid) {
    const err = G.coCanTakeover(c, nid); if (err) return { ok: false, err };
    const cost = G.takeoverCost(c, nid); c.cash -= cost; const n = N[nid];
    if (!c.ai) {
      const prev = G.player; G.player = nid; G.humans && G.humans.add(nid); if (G.leaders && G.leaders.me) { const L = G.leaders.me; delete G.leaders.me; L.role = 'president'; L.home = nid; G.leaders[nid] = L; } n.cash += c.cash * 0.3; c.cash *= 0.7; n.stab = Math.max(25, n.stab - 10);
      G.armies.forEach(a => { if (a.n === nid) a.auto = false; }); G.fleets.forEach(f => { if (f.n === nid) f.auto = false; });
      G.say(`👑 Компанія «${c.name}» перебрала владу: ${n.name}. ${prev >= 0 ? '' : 'Тепер ви керуєте державою, а компанія лишається вашою.'}`, 'big', [nid]);
      LORA.bus.emit('takeover', { co: c.id, n: nid });
    } else { n.stab -= 8; c.infl[nid] = 60; n.mods.push({ growth: 0.004, until: G.day + 365 }); G.say(`🏢 Корпорація «${c.name}» фактично контролює уряд: ${n.name}`, 'info', [nid]); }
    return { ok: true };
  };

  // ---- щоденний/щомісячний цикл
  G.companiesDaily = function () {
    if (G.day % 30) return;
    G.companies.forEach(c => {
      if (!c.alive) return;
      // прибуток
      let profit = c.base * 0.085 * (0.7 + N[c.home].stab / 160) * (N[c.home].alive ? 1 : 0.3); let tax = profit * taxRate(c, c.home);
      c.assets = c.assets.filter(a => { const t = ter[a.t]; const real = t.bld[a.type] || 0; if (real < a.lvl) a.lvl = real; return a.lvl > 0; });
      c.assets.forEach(a => { const p = G.assetProfit(c, a); const tx = p * taxRate(c, ter[a.t].owner); profit += p; tax += tx; N[ter[a.t].owner].cash += tx / 12; });
      N[c.home].cash += c.base * 0.085 * taxRate(c, c.home) / 12;
      c.profitY = profit; c.taxY = tax; c.cash += (profit - tax) / 12 - c.offices.length * 0.004;
      // вплив: згасання + пасивний від активів
      for (const k in c.infl) { const nid = +k; const pas = Math.min(40, G.coAssetsIn(c, nid) / Math.max(5, N[nid].agg.gdp) * 400) + (c.home === nid ? Math.min(25, c.base / Math.max(5, N[nid].agg.gdp) * 300) : 0);
        c.infl[k] += (pas - c.infl[k]) * 0.02; if (c.infl[k] > pas) c.infl[k] -= 0.3; c.infl[k] = clamp(c.infl[k], 0, 100); }
      // націоналізація: війна чи ворожнеча між країною активу та штабом
      c.offices = c.offices.filter(o => { if (o.hq) return true; const nid = o.n; if (!N[nid].alive || ter[o.t].owner !== nid) return false;
        const hostile = G.atWar(nid, c.home) || G.rel[nid][c.home] < -45; if (!hostile || (c.infl[nid] || 0) > 50) return true;
        if (G.rnd() < 0.5) { c.lost = c.lost || {}; c.lost[nid] = (c.lost[nid] || 0) + c.assets.filter(a => ter[a.t].owner === nid).reduce((v, a) => v + BD[a.type].cost * a.lvl, 0); c.assets = c.assets.filter(a => ter[a.t].owner !== nid); c.infl[nid] = 0; G.say(`🚩 ${N[nid].name} націоналізує активи компанії «${c.name}»`, c.id === G.pc ? 'bad' : 'info', [nid]); return false; } return true; });
      if (c.cash < -2) { c.base *= 0.9; c.cash += 1; }
      c.hist.push(+G.coValue(c).toFixed(2)); if (c.hist.length > 60) c.hist.shift();
      if (c.ai) coAI(c);
    });
  };
  function coAI(c) {
    const rnd = G.rnd; const sec = SEC[c.sector];
    // нові офіси у великих дружніх економіках
    if (c.offices.length < 2 + Math.floor(G.coValue(c) / 40) && c.cash > 3 && rnd() < 0.15) {
      const cand = N.filter(n => n.alive && n.id !== c.home && !G.coHasOffice(c, n.id) && G.rel[n.id][c.home] > 15 && !G.atWar(n.id, c.home)).sort((a, b) => b.agg.gdp - a.agg.gdp).slice(0, 12);
      const n = cand[Math.floor(rnd() * cand.length)]; if (n) G.coOpenOffice(c, home(n));
    }
    // нові активи
    if (c.cash > 2 && rnd() < 0.5) {
      let best = null;
      c.offices.forEach(o => { const nid = o.n; if (!N[nid].alive) return;
        for (let tries = 0; tries < 8; tries++) {
          const type = sec.assets[Math.floor(rnd() * sec.assets.length)]; const regs = ter.filter(t => t.owner === nid && t.ctrl === nid); if (!regs.length) return;
          const t = regs[Math.floor(rnd() * regs.length)]; if (G.coCanBuild(c, t.i, type)) continue;
          const roi = G.assetProfit(c, { t: t.i, type, lvl: 1 }) / BD[type].cost; if (!best || roi > best.roi) best = { i: t.i, type, roi }; } });
      if (best && best.roi > 0.06) G.coBuild(c, best.i, best.type, true);
    }
    // лобізм удома
    if (c.cash > 4 && rnd() < 0.3) G.coLobby(c, c.home, c.cash * 0.04);
  }
});

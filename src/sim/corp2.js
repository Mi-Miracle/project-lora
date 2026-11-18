// КОРПОРАЦІЯ 2: фізичний облік ресурсів (активи виробляють товар на склад, сировина купується на ринку),
// купівля й продаж на світовому ринку, тендери на постачання ресурсів для урядів, дипломатія компанії з державами.
LORA.sim.register('corp2', 99.65, function (G) {
  const { N, ter, T } = G; const BD = G.D.buildings; const clamp = (v, a, b) => Math.max(a, Math.min(b, v)); const RI = G.RI || G.D.resources;
  const human = c => c && !c.ai && c.alive;
  G.corpRes = c => { c.res = c.res || {}; c.sell = c.sell || {}; c.led = c.led || []; c.dip = c.dip || {}; return c.res; };
  // ціни для компанії: продаж трохи нижче, купівля трохи вище ринку
  G.spotSell = r => G.prices[r] * 0.95; G.spotBuy = r => G.prices[r] * 1.06;
  // прибуток активів людської компанії з виходом товару реалізується через продаж
  const baseAP = G.assetProfit; G.assetProfit = function (c, a) { if (human(c) && BD[a.type] && BD[a.type].out && !c._est) return 0; return baseAP(c, a); };
  G.corpEstProfit = (c, a) => { c._est = 1; const p = baseAP(c, a); c._est = 0; return p; };
  // місячне виробництво ресурсів
  G.corpResFlow = function (c) {
    const out = {}, inn = {};
    c.assets.forEach(a => { const b = BD[a.type], t = ter[a.t]; if (!b || !b.out || t.ctrl !== t.owner) return; const eff = (1 - t.dmg) * a.lvl / 12;
      for (const r in b.out) out[r] = (out[r] || 0) + b.out[r] * eff * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1);
      for (const r in (b.in || {})) inn[r] = (inn[r] || 0) + b.in[r] * eff; });
    return { out, inn };
  };
  G.corp2Monthly = function () {
    G.companies.forEach(c => {
      if (!human(c)) return; G.corpRes(c); const L = { rev: 0, cost: 0, m: G.day };
      const f = G.corpResFlow(c);
      for (const r in f.inn) { const need = f.inn[r], have = c.res[r] || 0, use = Math.min(have, need); c.res[r] = have - use; const buy = need - use; if (buy > 0) { const v = buy * G.spotBuy(r); c.cash -= v; L.cost += v; } }
      for (const r in f.out) c.res[r] = (c.res[r] || 0) + f.out[r];
      // постачання за ресурсними контрактами
      (c.supply || []).forEach(k => { const have = c.res[k.r] || 0, d = Math.min(have, k.q); c.res[k.r] = have - d; const pay = d * k.p; c.cash += pay; L.rev += pay; const b = N[k.buyer]; if (b && b.alive) { b.cash -= pay * 0.3; b.mods.push({ r: k.r, mul: 1 + Math.min(0.15, d / Math.max(0.001, b.agg.need[k.r] / 12 || 1) * 0.5), until: G.day + 31 }); }
        if (d < k.q * 0.98) { const pen = (k.q - d) * k.p * 0.25; c.cash -= pen; L.cost += pen; c.rep = clamp((c.rep || 50) - 2, 0, 100); }
        k.left--; if (k.left <= 0) { k.fin = 1; c.rep = clamp((c.rep || 50) + 3, 0, 100); G.say(`✅ Контракт постачання ${RI[k.r].n.toLowerCase()} для ${N[k.buyer].name} завершено`, 'good', [c.home]); } });
      c.supply = (c.supply || []).filter(k => !k.fin);
      // автопродаж
      for (const r in c.res) { if (c.sell[r] === false) continue; const keep = (c.supply || []).filter(k => k.r === r).reduce((s, k) => s + k.q, 0); const v = (c.res[r] || 0) - keep; if (v > 1e-6) { const m = v * G.spotSell(r); c.res[r] -= v; c.cash += m; L.rev += m; } }
      c.led.push(L); if (c.led.length > 12) c.led.shift();
      const net = c.led.reduce((s, x) => s + x.rev - x.cost, 0) * 12 / c.led.length; c.profitY = (c.profitY || 0) + net; c.resNetY = net;
    });
  };
  G.corpTrade = function (c, r, qty) { // qty > 0 — купити, < 0 — продати
    G.corpRes(c); if (!G.prices[r]) return { ok: false, err: 'Невідомий ресурс' };
    if (qty > 0) { const v = qty * G.spotBuy(r); if (c.cash < v) return { ok: false, err: 'Бракує коштів' }; c.cash -= v; c.res[r] = (c.res[r] || 0) + qty; return { ok: true, msg: `Куплено за $${v.toFixed(3)} млрд` }; }
    const q = Math.min(-qty, c.res[r] || 0); if (q <= 0) return { ok: false, err: 'Немає на складі' }; const v = q * G.spotSell(r); c.res[r] -= q; c.cash += v; return { ok: true, msg: `Продано на $${v.toFixed(3)} млрд` };
  };
  // ---- тендери на постачання ресурсів (кожного місяця, державам з дефіцитом)
  G.corp2Tenders = function () {
    N.forEach(n => {
      if (!n.alive || !n.agg || !n.ratio || G.rnd() > 0.35) return; const def = Object.keys(n.ratio).filter(r => n.ratio[r] < 0.95 && G.prices[r]); if (!def.length) return;
      const r = def[Math.floor(G.rnd() * def.length)]; const gap = Math.max(0, (n.agg.need[r] || 0) - (n.agg.prod[r] || 0)) / 12; const q = +(gap * (0.05 + G.rnd() * 0.15)).toFixed(5); if (q * G.prices[r] < 0.002) return;
      G.tenders.push({ id: G.nextId++, buyer: n.id, kind: 'res', r, q, months: 6 + Math.floor(G.rnd() * 13), price: +(G.prices[r] * (1.08 + G.rnd() * 0.2)).toFixed(6), close: G.day + 25, sector: '*', bids: [] });
    });
  };
  G.corpProduces = (c, r) => c.assets.some(a => BD[a.type] && BD[a.type].out && BD[a.type].out[r]);
  const baseCan = G.corpCanBid;
  G.corpCanBid = function (c, t) {
    if (t.kind !== 'res') return baseCan(c, t);
    if (!G.corpProduces(c, t.r)) return 'Ви не виробляєте цей ресурс';
    const b = t.buyer; if (!G.coHasOffice(c, b) && b !== c.home) return 'Потрібен офіс у країні-замовнику';
    if (G.atWar(b, c.home) || G.sanctioned(b, c.home) || G.tradeBan && G.tradeBan(c.home, b, t.r)) return 'Торгівля із замовником заборонена';
    if (t.bids.some(x => x.co === c.id)) return 'Ви вже подали заявку'; return '';
  };
  G.corp2Close = function () {
    G.tenders.filter(t => t.kind === 'res' && !t.done && t.close <= G.day).forEach(t => {
      t.done = true; G.companies.forEach(c => { if (!c.alive || !c.ai || !G.corpProduces(c, t.r) || G.rnd() > 0.4) return; t.bids.push({ co: c.id, mul: 0.88 + G.rnd() * 0.25 }); });
      if (!t.bids.length) return; const sc = b => { const c = G.companies[b.co]; return (1 + ((c.rep || 50) - 50) / 150) * (1 + (c.infl[t.buyer] || 0) / 120) * (c.home === t.buyer ? 1.2 : 1) / b.mul * (0.85 + G.rnd() * 0.3); };
      const best = t.bids.slice().sort((a, b) => sc(b) - sc(a))[0]; const c = G.companies[best.co]; if (!human(c)) return;
      c.supply = c.supply || []; c.supply.push({ id: t.id, buyer: t.buyer, r: t.r, q: t.q, p: t.price * best.mul, left: t.months });
      G.say(`📑 Контракт постачання виграно: ${RI[t.r].n} для ${N[t.buyer].name} на ${t.months} міс.`, 'good', [c.home]);
    });
  };
  // ---- дипломатія компанії з державами
  G.CO_DIP = {
    meet:    { n: 'Зустріч з міністром', ic: '🤝', cost: 0.02, inf: 0, cd: 30, d: 'Вплив +3–5' },
    sponsor: { n: 'Спонсорство (лікарні, школи)', ic: '💝', cost: 0.06, inf: 0, cd: 60, d: 'Вплив +3, репутація +2, стабільність країни +0.5' },
    taxhol:  { n: 'Податкові канікули', ic: '🧾', cost: 0.1, inf: 35, cd: 1095, d: 'Податки в цій країні −50% на 2 роки' },
    subsidy: { n: 'Державне співфінансування будівництва', ic: '🏗', cost: 0.08, inf: 45, cd: 720, d: 'Будівництво в цій країні на 30% дешевше рік' },
    license: { n: 'Експортна ліцензія', ic: '📜', cost: 0.05, inf: 25, cd: 365, d: 'Можна продавати продукцію в цю країну навіть без дружніх відносин зі штабом' },
    deal:    { n: 'Інвестиційна угода', ic: '📈', cost: 0, inf: 15, cd: 730, d: 'Зобовʼязання вкласти 1% ВВП країни за 2 роки: вплив +12 одразу; якщо не виконаєте — −25 і штраф' },
    court:   { n: 'Міжнародний арбітраж', ic: '⚖', cost: 0.15, inf: 0, cd: 365, d: 'Позов за націоналізовані активи: шанс 45% отримати компенсацію' }
  };
  G.coDipCan = function (c, nid, k) {
    const A = G.CO_DIP[k], d = (G.corpRes(c), c.dip[nid] = c.dip[nid] || {}); if (!A) return '?';
    if ((d['cd_' + k] || 0) > G.day) return `Ще ${d['cd_' + k] - G.day} дн.`; if (c.cash < A.cost) return 'Бракує коштів';
    if (k !== 'court' && !G.coHasOffice(c, nid) && nid !== c.home) return 'Потрібен офіс у країні';
    if ((c.infl[nid] || 0) < A.inf) return `Потрібен вплив ≥ ${A.inf}`;
    if (k === 'court' && !(c.lost && c.lost[nid])) return 'Немає націоналізованих активів у цій країні';
    if (k === 'deal' && d.deal && d.deal.until > G.day) return 'Угода вже діє';
    return '';
  };
  G.coDip = function (c, nid, k) {
    const e = G.coDipCan(c, nid, k); if (e) return { ok: false, err: e }; const A = G.CO_DIP[k], d = c.dip[nid], n = N[nid]; c.cash -= A.cost; d['cd_' + k] = G.day + A.cd; let msg = '';
    const inf = v => { c.infl[nid] = clamp((c.infl[nid] || 0) + v, 0, 100); };
    if (k === 'meet') { const v = 3 + G.rnd() * 2; inf(v); msg = `вплив +${v.toFixed(1)}`; }
    if (k === 'sponsor') { inf(3); c.rep = clamp((c.rep || 50) + 2, 0, 100); n.stab = Math.min(100, n.stab + 0.5); msg = 'вплив +3, репутація +2'; }
    if (k === 'taxhol') { d.tax = G.day + 730; msg = 'податки −50% на 2 роки'; }
    if (k === 'subsidy') { d.sub = G.day + 365; msg = 'будівництво −30% на рік'; }
    if (k === 'license') { d.lic = G.day + 365 * 3; msg = 'експортна ліцензія на 3 роки'; }
    if (k === 'deal') { d.deal = { until: G.day + 730, need: n.agg.gdp * 0.01, base: G.coAssetsIn(c, nid) }; inf(12); msg = `зобовʼязання вкласти $${(n.agg.gdp * 0.01).toFixed(2)} млрд за 2 роки`; }
    if (k === 'court') { if (G.rnd() < 0.45) { const v = c.lost[nid]; c.cash += v; delete c.lost[nid]; msg = `перемога! компенсація $${v.toFixed(2)} млрд`; } else msg = 'суд програно'; }
    G.say(`🏢 «${c.name}» × ${n.name}: ${A.n} — ${msg}`, 'info', [nid]); return { ok: true, msg };
  };
  G.coDipMonthly = function () {
    G.companies.forEach(c => { if (!human(c) || !c.dip) return; for (const nid in c.dip) { const d = c.dip[nid]; if (d.deal && d.deal.until <= G.day && !d.deal.done) { d.deal.done = 1; const did = G.coAssetsIn(c, +nid) - d.deal.base; if (did < d.deal.need) { c.infl[nid] = Math.max(0, (c.infl[nid] || 0) - 25); const fine = d.deal.need * 0.1; c.cash -= fine; G.say(`⚖ «${c.name}» не виконала інвестиційну угоду з ${N[nid].name}: вплив −25, штраф $${fine.toFixed(2)} млрд`, 'bad', [c.home]); } else G.say(`✅ «${c.name}» виконала інвестиційну угоду з ${N[nid].name}`, 'good', [c.home]); } } });
  };
  // ліцензія розширює список покупців зброї
  const baseBuyers = G.corpBuyers; G.corpBuyers = c => { const L = baseBuyers(c); for (const nid in (c.dip || {})) if (c.dip[nid].lic > G.day && !L.includes(+nid) && !G.atWar(c.home, +nid)) L.push(+nid); return L; };
  const baseSell = G.corpSellTo; G.corpSellTo = function (c, nid, k) { if (c.dip && c.dip[nid] && c.dip[nid].lic > G.day && G.rel[c.home][nid] < 20 && !G.atWar(c.home, nid)) { const r0 = G.rel[c.home][nid]; G.rel[c.home][nid] = 20; const r = baseSell(c, nid, k); G.rel[c.home][nid] = Math.max(r0, G.rel[c.home][nid] - 0); return r; } return baseSell(c, nid, k); };
  G.act.coBuild = (i, type) => G.pc >= 0 ? G.coBuild(G.myCo(), i, type) : { ok: false };
  G.act.coOffice = i => G.pc >= 0 ? G.coOpenOffice(G.myCo(), i) : { ok: false };
  G.act.coLobby = (nid, v) => G.pc >= 0 ? G.coLobby(G.myCo(), nid, v) : { ok: false };
  G.act.coHQ = i => G.pc >= 0 ? G.coMoveHQ(G.myCo(), i) : { ok: false };
  G.act.coTakeover = nid => G.pc >= 0 ? G.coTakeover(G.myCo(), nid) : { ok: false };
  // налаштування компанії: лінії, автопродаж, дивіденди, бюджет R&D, інвестиції власника
  G.act.coSet = (k, a, v) => { const c = G.pc >= 0 && G.myCo(); if (!c) return { ok: false }; G.corpRes(c); G.corpInit && G.corpInit(c);
    if (k === 'line') c.lines[a] = !!v; else if (k === 'sell') c.sell[a] = !!v; else if (k === 'autoSell') c.autoSell = !!v; else if (k === 'divs') c.divs = clamp(+v, 0, 0.6); else if (k === 'rd') c.rd.budget = clamp(+v, 0.05, 2);
    else if (k === 'invest') { const L = G.leader; if (!L || L.money < v) return { ok: false, err: 'Бракує грошей' }; L.money -= v; c.cash += v; } return { ok: true }; };
  G.act.corpTrade = (r, q) => G.pc >= 0 ? G.corpTrade(G.myCo(), r, q) : { ok: false };
  G.act.coDip = (nid, k) => G.pc >= 0 ? G.coDip(G.myCo(), nid, k) : { ok: false };
});

// СВІТОВИЙ РИНОК РЕСУРСІВ (замкнений): кожен або виробляє сам, або купує в когось.
// • Продавець отримує гроші лише тоді, коли знайшовся покупець: держава з дефіцитом (платить її бюджет) або інша компанія.
// • Купити можна лише те, що хтось реально продає: профіцит держав (гроші йдуть у їхній бюджет) або склади компаній.
// • Виробництво компаній гравців — їхнє: воно не зараховується державі-господарю, а йде на склад і продається на ринку.
//   Сировину вони купують на ринку; бракує сировини — активи працюють на частку потужності.
LORA.sim.register('market', 99.656, function (G) {
  const { N, ter } = G; const BD = G.D.buildings; const RES = G.RES; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const human = c => c && !c.ai && c.alive; const RI = G.RI || G.D.resources;
  const fx = (c, k) => c.rd && G.corpFx ? G.corpFx(c, k) : 0;
  const canDeal = (a, b, r) => a === b ? !!(N[a] && N[a].alive) : N[a] && N[b] && N[a].alive && N[b].alive && !G.atWar(a, b) && !G.sanctioned(a, b) && G.rel[a][b] > -70 && !(G.tradeBan && G.tradeBan(a, b, r));
  const lic = (c, nid) => c.dip && c.dip[nid] && c.dip[nid].lic > G.day;

  // ---- виробництво компаній гравців не входить у національну економіку господаря
  const baseAgg = G.aggregate;
  G.aggregate = function () {
    baseAgg();
    for (const c of G.companies) { if (!human(c)) continue;
      for (const a of c.assets) { const t = ter[a.t], b = BD[a.type]; if (!b) continue; const n = N[t.ctrl]; if (!n || !n.agg) continue;
        const lvl = Math.min(a.lvl, (t.bld[a.type] || 0) - (t.base[a.type] || 0)); if (lvl <= 0) continue; const eff = (1 - t.dmg) * (t.ctrl === t.owner ? 1 : 0.3);
        let inR = 1; if (b.in) for (const r in b.in) { n.agg.need[r] = Math.max(0, n.agg.need[r] - b.in[r] * lvl); inR = Math.min(inR, n.ratio && n.ratio[r] != null ? n.ratio[r] : 1); }
        if (b.out) for (const r in b.out) n.agg.prod[r] = Math.max(0, n.agg.prod[r] - b.out[r] * lvl * eff * inR * (t.depl && t.depl[r] ? 1 - t.depl[r] : 1)); } }
  };

  // ---- ШІ-компанії теж за правилами ринку: прибуток лише з того, що купили (непроданий надлишок країни-господаря
  //      зменшує виручку), і лише якщо сировина реально є (дефіцит країни зменшує випуск — враховано в assetProfit)
  const baseAP = G.assetProfit;
  G.assetProfit = function (c, a) { let p = baseAP(c, a); if (!c || !c.ai || !p) return p; const b = BD[a.type]; if (!b || !b.out) return p; const n = N[ter[a.t].owner]; if (!n || !n.agg) return p;
    let k = 0, w = 0; for (const r in b.out) { const pr = n.agg.prod[r] || 0, un = G.unsold ? G.unsold[r][n.id] || 0 : 0; const sold = pr > 0 ? clamp(1 - un / pr, 0, 1) : 1; k += sold * b.out[r] * G.prices[r]; w += b.out[r] * G.prices[r]; }
    return w > 0 ? p * (0.25 + 0.75 * k / w) : p; };
  // ---- місячні пули: що держави реально готові продати (профіцит) і купити (дефіцит)
  G.mkt2 = null;
  G.mktOpen = function () {
    const M = { sup: {}, dem: {}, sold: {}, bought: {}, d: G.day };
    RES.forEach(r => { M.sup[r] = {}; M.dem[r] = {}; M.sold[r] = 0; M.bought[r] = 0;
      N.forEach(n => { if (!n.alive || !n.agg) return; const un = G.unsold ? G.unsold[r][n.id] || 0 : 0, um = G.unmet ? G.unmet[r][n.id] || 0 : 0;
        const pr = n.agg.prod[r] || 0, nd = n.agg.need[r] || 0;
        const sup = un + pr * 0.12, dem = um + nd * 0.08; // частину внутрішнього ринку можна купити/зайняти: виробники продають тому, хто платить
        if (sup > 0) M.sup[r][n.id] = sup / 12; if (dem > 0 && n.cash > 0) M.dem[r][n.id] = dem / 12; M.unsold = M.unsold || {}; (M.unsold[r] = M.unsold[r] || {})[n.id] = un / 12; }); });
    G.mkt2 = M; return M;
  };
  const M = () => (G.mkt2 && G.day - G.mkt2.d < 31 ? G.mkt2 : G.mktOpen());
  // інші компанії гравців, що продають зі складу
  const coSellers = (c, r) => G.companies.filter(o => human(o) && o !== c && o.res && (o.res[r] || 0) > 1e-6 && (!o.sell || o.sell[r] !== false) && canDeal(o.home, c.home, r));
  // купівля: спершу склади інших компаній, далі профіцит держав (найближчі за відносинами); повертає куплену кількість
  G.mktBuy = function (c, r, q, pmax) {
    const m = M(); let got = 0, paid = 0; const price = G.spotBuy(r);
    for (const o of coSellers(c, r)) { if (got >= q) break; const keep = (o.supply || []).filter(k => k.r === r).reduce((s, k) => s + k.q, 0); const avail = Math.max(0, (o.res[r] || 0) - keep); const d = Math.min(avail, q - got); if (d <= 0) continue;
      const v = d * G.prices[r]; if (c.cash < v) break; o.res[r] -= d; o.cash += v; c.cash -= v; got += d; paid += v; (o.ledM = o.ledM || { rev: 0, cost: 0 }).rev += v; }
    const sel = Object.keys(m.sup[r]).map(Number).filter(nid => m.sup[r][nid] > 1e-9 && canDeal(nid, c.home, r)).sort((a, b) => G.rel[b][c.home] - G.rel[a][c.home]);
    for (const nid of sel) { if (got >= q) break; const d = Math.min(m.sup[r][nid], q - got); const v = d * price; if (c.cash < v) break;
      m.sup[r][nid] -= d; N[nid].cash += d * G.prices[r] * 0.3; c.cash -= v; got += d; paid += v; m.bought[r] += d;
      // куплене понад профіцит держава відриває від власних споживачів: її забезпеченість цим ресурсом падає
      const un = (m.unsold && m.unsold[r] && m.unsold[r][nid]) || 0; const over = Math.max(0, d - un); if (m.unsold && m.unsold[r]) m.unsold[r][nid] = Math.max(0, un - d);
      if (over > 0) { const pm = Math.max(1e-6, (N[nid].agg.prod[r] || 0) / 12); N[nid].mods.push({ r, mul: 1 - Math.min(0.2, over / pm), until: G.day + 31 }); } }
    return { q: got, v: paid };
  };
  // продаж: державам із дефіцитом (платить бюджет покупця) і компаніям, яким бракує сировини; повертає продане
  G.mktSell = function (c, r, q) {
    const m = M(); let sold = 0, rev = 0; const price = G.spotSell(r);
    const buyers = Object.keys(m.dem[r]).map(Number).filter(nid => m.dem[r][nid] > 1e-9 && (canDeal(c.home, nid, r) || lic(c, nid))).sort((a, b) => (c.infl[b] || 0) - (c.infl[a] || 0) || G.rel[b][c.home] - G.rel[a][c.home]);
    for (const nid of buyers) { if (sold >= q) break; const n = N[nid]; const can = Math.max(0, n.cash) / price; const d = Math.min(m.dem[r][nid], q - sold, can); if (d <= 1e-9) continue;
      const v = d * price; m.dem[r][nid] -= d; n.cash -= v; c.cash += v; sold += d; rev += v; m.sold[r] += d;
      const need = Math.max(1e-6, (n.agg.need[r] || 0) / 12); n.mods.push({ r, mul: 1 + Math.min(0.25, d / need), until: G.day + 31 }); }
    return { q: sold, v: rev };
  };
  // ручна угода гравця: купити/продати на ринку (лише якщо є продавець/покупець)
  G.corpTrade = function (c, r, qty) {
    G.corpRes(c); if (!G.prices[r]) return { ok: false, err: 'Невідомий ресурс' };
    if (qty > 0) { if (c.cash < qty * G.spotBuy(r) * 0.5) return { ok: false, err: 'Бракує коштів' }; const b = G.mktBuy(c, r, qty); if (b.q <= 1e-9) return { ok: false, err: 'Ніхто зараз не продає цей ресурс вам (санкції, війна або світовий дефіцит)' }; c.res[r] = (c.res[r] || 0) + b.q; return { ok: true, msg: `Куплено ${b.q.toFixed(3)} за $${b.v.toFixed(3)} млрд${b.q < qty * 0.99 ? ' (більше ніхто не продає)' : ''}` }; }
    const q = Math.min(-qty, c.res[r] || 0); if (q <= 0) return { ok: false, err: 'Немає на складі' };
    const s = G.mktSell(c, r, q); if (s.q <= 1e-9) return { ok: false, err: 'Немає покупців: усі ринки, куди ви можете продавати, вже забезпечені' }; c.res[r] -= s.q;
    return { ok: true, msg: `Продано ${s.q.toFixed(3)} на $${s.v.toFixed(3)} млрд${s.q < q * 0.99 ? ' (решту ніхто не купив)' : ''}` };
  };
  // склад: місткість — річний випуск (мінімум 1); надлишок псується
  G.corpStoreCap = (c, r, f) => Math.max(0.5, ((f || G.corpResFlow(c)).out[r] || 0) * 12);
  // ---- місячний цикл компаній гравців
  G.corp2Monthly = function () {
    G.mktOpen();
    G.companies.forEach(c => {
      if (!human(c)) return; G.corpRes(c); const L = { rev: 0, cost: 0, m: G.day };
      if (c.ledM) { L.rev += c.ledM.rev; c.ledM = null; }
      const f = G.corpResFlow(c); let ratio = 1; const lack = [];
      for (const r in f.inn) { const need = f.inn[r], have = c.res[r] || 0, use = Math.min(have, need); c.res[r] = have - use; let got = use;
        if (need - use > 1e-9) { const b = G.mktBuy(c, r, need - use); got += b.q; L.cost += b.v; }
        const k = need > 0 ? got / need : 1; if (k < 0.98) lack.push(r); ratio = Math.min(ratio, k); }
      c.inRatio = ratio; c.lack = lack;
      for (const r in f.out) c.res[r] = (c.res[r] || 0) + f.out[r] * ratio;
      // контракти постачання: покупець платить повністю
      (c.supply || []).forEach(k => { const have = c.res[k.r] || 0, d = Math.min(have, k.q); c.res[k.r] = have - d; const pay = d * k.p; c.cash += pay; L.rev += pay; const b = N[k.buyer]; if (b && b.alive) { b.cash -= pay; b.mods.push({ r: k.r, mul: 1 + Math.min(0.15, d / Math.max(0.001, b.agg.need[k.r] / 12 || 1) * 0.5), until: G.day + 31 }); }
        if (d < k.q * 0.98) { const pen = (k.q - d) * k.p * 0.25; c.cash -= pen; L.cost += pen; c.rep = clamp((c.rep || 50) - 2, 0, 100); }
        k.left--; if (k.left <= 0) { k.fin = 1; c.rep = clamp((c.rep || 50) + 3, 0, 100); G.say(`✅ Контракт постачання ${RI[k.r].n.toLowerCase()} для ${N[k.buyer].name} завершено`, 'good', [c.home]); } });
      c.supply = (c.supply || []).filter(k => !k.fin);
      // автопродаж — лише тим, хто купує
      c.unsoldM = {};
      for (const r in c.res) { if (c.sell[r] === false) continue; const keep = (c.supply || []).filter(k => k.r === r).reduce((s, k) => s + k.q, 0); const v = (c.res[r] || 0) - keep; if (v <= 1e-6) continue;
        const s = G.mktSell(c, r, v); c.res[r] -= s.q; L.rev += s.v; if (v - s.q > 1e-6) c.unsoldM[r] = v - s.q; }
      for (const r in c.res) { const cap = G.corpStoreCap(c, r, f); if (c.res[r] > cap) { c.res[r] -= (c.res[r] - cap) * 0.3; } } // зіпсоване/списане понад місткість складу
      c.led.push(L); if (c.led.length > 12) c.led.shift();
      const net = c.led.reduce((s, x) => s + x.rev - x.cost, 0) * 12 / c.led.length; c.profitY = (c.profitY || 0) + net; c.resNetY = net;
    });
  };
  G.mktSummary = r => { const m = M(); let sup = 0, dem = 0; for (const k in m.sup[r]) sup += m.sup[r][k]; for (const k in m.dem[r]) dem += m.dem[r][k]; return { sup, dem }; };
});

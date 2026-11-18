// БІРЖА: акції компаній. Ціна частки (1% компанії) залежить від вартості, прибутку й новин:
// війна в країні штабу й санкції — вниз; світова війна — ВПК вгору; дорога нафта — енергетика вгору; ядерний удар — обвал.
// Купувати можуть держава (казна), персонаж (особисті гроші) і компанія гравця. Дивіденди — щомісяця.
LORA.sim.register('stock', 96.2, function (G) {
  const { N } = G; const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  G.stockInit = function () {
    if (G.stock) return; G.stock = { px: {}, hist: {}, idx: [], hold: {}, mood: 1, last: {} };
    G.companies.forEach(c => { if (c.alive) { const p = fair(c); G.stock.px[c.id] = p; G.stock.hist[c.id] = [p]; } }); G.stock.idx = [100]; G.stock.idx0 = sumCap();
  };
  const fair = c => Math.max(0.005, (G.coValue(c) * 1.4 + Math.max(0, c.profitY) * 8) / 100); // ціна 1% у $ млрд
  const sumCap = () => G.companies.reduce((s, c) => s + (c.alive && G.stock.px[c.id] ? G.stock.px[c.id] * 100 : 0), 0);
  function sentiment(c) {
    let m = G.stock.mood; const home = c.home;
    if (home != null && N[home]) { if (G.enemiesOf(home).length) m *= c.sector === 'military' ? 1.25 : 0.85; if (G.sanctions && [...G.sanctions].some(k => k.endsWith('>' + home))) m *= 0.9; m *= 0.85 + N[home].stab / 330; }
    const wars = G.wars ? G.wars.size : 0; if (c.sector === 'military') m *= 1 + Math.min(0.4, wars * 0.04);
    if (c.sector === 'energy' && G.prices && G.priceBase) m *= clamp(G.prices.oil / G.priceBase.oil, 0.7, 1.8);
    if (c.sector === 'tech' && G.prices && G.priceBase) m *= clamp(G.priceBase.chips / G.prices.chips, 0.6, 1.2);
    return m;
  }
  G.stockDaily = function () {
    if (!G.stock) G.stockInit(); const S = G.stock; S.mood += (1 - S.mood) * 0.01 + (G.worldMod && G.worldMod.until > G.day ? G.worldMod.growth * 0.05 : 0);
    if (G.nukeUsed && G.nukeUsed !== S.lastNuke) { S.lastNuke = G.nukeUsed; S.mood *= 0.7; G.say('📉 Обвал світових бірж після ядерного удару!', 'bad'); }
    G.companies.forEach(c => {
      if (!c.alive) { delete S.px[c.id]; return; } if (S.px[c.id] == null) { S.px[c.id] = fair(c); S.hist[c.id] = [S.px[c.id]]; }
      const tgt = fair(c) * sentiment(c), p = S.px[c.id]; S.px[c.id] = Math.max(0.002, p + (tgt - p) * 0.03 + p * (G.rnd() - 0.5) * 0.025);
    });
    if (G.day % 7 === 0) { G.companies.forEach(c => { const h = S.hist[c.id]; if (h) { h.push(+S.px[c.id].toFixed(4)); if (h.length > 104) h.shift(); } }); S.idx.push(+(sumCap() / Math.max(0.001, S.idx0) * 100).toFixed(1)); if (S.idx.length > 104) S.idx.shift(); }
  };
  // гаманець: 'n<id>' — казна держави, 'L' — гроші персонажа, 'c<id>' — компанія
  G.wallet = function () { if (G.player >= 0) return 'n' + G.player; if (G.leader && G.leader.role === 'char') return 'L'; if (G.pc >= 0) return 'c' + G.pc; return null; };
  const cashOf = w => w[0] === 'n' ? N[+w.slice(1)].cash : w === 'L' ? G.leader.money : G.companies[+w.slice(1)].cash;
  const addCash = (w, v) => { if (w[0] === 'n') N[+w.slice(1)].cash += v; else if (w === 'L') G.leader.money += v; else G.companies[+w.slice(1)].cash += v; };
  G.stockHeld = (w, cid) => (G.stock.hold[w] && G.stock.hold[w][cid]) || 0;
  G.stockFree = cid => 100 - Object.values(G.stock.hold).reduce((s, h) => s + (h[cid] || 0), 0);
  G.stockTrade = function (w, cid, pct) {
    if (!G.stock) G.stockInit(); const S = G.stock, c = G.companies[cid]; if (!c || !c.alive || !w) return { ok: false, err: 'Недоступно' };
    if (w === 'c' + cid) return { ok: false, err: 'Не можна торгувати власними акціями' };
    const p = S.px[cid] * (pct > 0 ? 1.01 : 0.99), cost = p * pct; S.hold[w] = S.hold[w] || {};
    if (pct > 0) { if (G.stockFree(cid) - 51 < pct) return { ok: false, err: 'Засновники тримають контрольний пакет: у вільному обігу не лишилось акцій' }; if (cashOf(w) < cost) return { ok: false, err: 'Бракує коштів: потрібно $' + cost.toFixed(3) + ' млрд' }; }
    else if (G.stockHeld(w, cid) < -pct) return { ok: false, err: 'У вас немає стільки акцій' };
    addCash(w, -cost); S.hold[w][cid] = +(G.stockHeld(w, cid) + pct).toFixed(3); if (!S.hold[w][cid]) delete S.hold[w][cid];
    S.px[cid] *= 1 + pct * 0.004; // попит рухає ціну
    return { ok: true, cost };
  };
  G.stockPortfolio = w => { const h = (G.stock && G.stock.hold[w]) || {}; let v = 0; for (const cid in h) v += h[cid] * (G.stock.px[cid] || 0); return v; };
  // дивіденди: 30% річного прибутку / 12 пропорційно частці
  G.stockMonthly = function () {
    if (!G.stock) return; for (const w in G.stock.hold) { const h = G.stock.hold[w]; for (const cid in h) { const c = G.companies[cid]; if (!c || !c.alive) { delete h[cid]; continue; } const d = Math.max(0, c.profitY) * 0.3 / 12 * h[cid] / 100; if (d > 0) { try { addCash(w, d); } catch (e) { } } } }
  };
  G.act.stockTrade = (cid, pct) => G.stockTrade(G.wallet(), cid, pct);
});
